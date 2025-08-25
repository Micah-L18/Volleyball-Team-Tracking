const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all volleyball skills
router.get('/skills', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM volleyball_skills ORDER BY category, name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// Get skills by category
router.get('/skills/category/:category', authMiddleware, async (req, res) => {
  try {
    const { category } = req.params;
    const result = await pool.query(
      'SELECT * FROM volleyball_skills WHERE category = $1 ORDER BY name',
      [category]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching skills by category:', error);
    res.status(500).json({ error: 'Failed to fetch skills by category' });
  }
});

// Get player skill ratings
router.get('/player/:playerId', authMiddleware, async (req, res) => {
  try {
    const { playerId } = req.params;

    // Verify player belongs to user's team
    const playerCheck = await pool.query(`
      SELECT p.id FROM player p
      JOIN team t ON p.team_id = t.id
      JOIN team_users tu ON t.id = tu.team_id
      WHERE p.id = $1 AND tu.user_id = $2 AND tu.role IN ('head_coach', 'assistant_coach')
    `, [playerId, req.user.id]);

    if (playerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this player' });
    }

    const result = await pool.query(
      'SELECT * FROM skill_ratings WHERE player_id = $1 ORDER BY skill_category, skill_name',
      [playerId]
    );

    // Debug: Log the data types being returned
    console.log('🔍 DEBUG: Sample rating data from DB:');
    if (result.rows.length > 0) {
      const sample = result.rows[0];
      console.log(`Rating value: ${sample.rating}, type: ${typeof sample.rating}`);
    }

    // Convert rating strings to numbers if needed
    const processedRows = result.rows.map(row => ({
      ...row,
      rating: typeof row.rating === 'string' ? parseFloat(row.rating) : row.rating
    }));

    console.log('🔧 DEBUG: After processing:');
    if (processedRows.length > 0) {
      const sample = processedRows[0];
      console.log(`Rating value: ${sample.rating}, type: ${typeof sample.rating}`);
    }

    res.json(processedRows);
  } catch (error) {
    console.error('Error fetching skill ratings:', error);
    res.status(500).json({ error: 'Failed to fetch skill ratings' });
  }
});

// Get team skill averages
router.get('/team/:teamId/averages', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;

    // Verify team access
    const teamCheck = await pool.query(
      'SELECT role FROM team_users WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );

    if (teamCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this team' });
    }

    const result = await pool.query(`
      SELECT 
        sr.skill_name,
        sr.skill_category,
        ROUND(AVG(sr.rating), 1) as average_rating,
        COUNT(sr.rating) as player_count,
        MAX(sr.rating) as max_rating,
        MIN(sr.rating) as min_rating
      FROM skill_ratings sr
      JOIN player p ON sr.player_id = p.id
      WHERE p.team_id = $1
      GROUP BY sr.skill_name, sr.skill_category
      ORDER BY sr.skill_category, average_rating DESC
    `, [teamId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching team averages:', error);
    res.status(500).json({ error: 'Failed to fetch team averages' });
  }
});

// Get player comparison data for analytics
router.get('/team/:teamId/player-comparison', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;

    // Verify team access
    const teamCheck = await pool.query(
      'SELECT id FROM team WHERE id = $1 AND created_by = $2',
      [teamId, req.user.id]
    );

    if (teamCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // First get all players for the team
    const playersResult = await pool.query(`
      SELECT id, name FROM player WHERE team_id = $1 ORDER BY name
    `, [teamId]);

    console.log(`Found ${playersResult.rows.length} players for team ${teamId}:`, playersResult.rows);

    // Check if there are any skill ratings at all for this team
    const ratingsCheck = await pool.query(`
      SELECT COUNT(*) as rating_count 
      FROM skill_ratings sr 
      JOIN player p ON sr.player_id = p.id 
      WHERE p.team_id = $1
    `, [teamId]);

    console.log(`Total skill ratings for team ${teamId}:`, ratingsCheck.rows[0].rating_count);

    // Get individual player skill ratings with averages
    const result = await pool.query(`
      SELECT 
        p.id as player_id,
        p.name as player_name,
        sr.skill_category,
        sr.skill_name,
        sr.rating,
        ROUND(AVG(sr.rating) OVER (PARTITION BY p.id), 1) as player_overall_average,
        COUNT(sr.rating) OVER (PARTITION BY p.id) as total_skills_rated,
        RANK() OVER (PARTITION BY sr.skill_name ORDER BY sr.rating DESC) as skill_rank
      FROM player p
      LEFT JOIN skill_ratings sr ON p.id = sr.player_id
      WHERE p.team_id = $1 AND sr.rating IS NOT NULL
      ORDER BY p.name, sr.skill_category, sr.skill_name
    `, [teamId]);

    console.log(`Player comparison query returned ${result.rows.length} rows for team ${teamId}`);
    console.log('Sample data:', result.rows.slice(0, 3));

    // Group by player and calculate stats
    const playerMap = new Map();
    
    // First add all players to the map (even those without ratings)
    playersResult.rows.forEach(player => {
      playerMap.set(player.id, {
        playerId: player.id,
        playerName: player.name,
        overallAverage: 0,
        totalSkillsRated: 0,
        skills: [],
        strengthCategory: 'No ratings yet',
        weakestCategory: 'No ratings yet'
      });
    });
    
    // Then add skill data for players who have ratings
    result.rows.forEach(row => {
      const player = playerMap.get(row.player_id);
      if (player) {
        // Update overall stats from the first row for this player
        player.overallAverage = parseFloat(row.player_overall_average);
        player.totalSkillsRated = parseInt(row.total_skills_rated);
        
        console.log(`Adding skill for player ${row.player_name}: ${row.skill_name} (category: ${row.skill_category}, rating: ${row.rating})`);
        
        player.skills.push({
          skillName: row.skill_name,
          skillCategory: row.skill_category,
          rating: parseFloat(row.rating),
          rank: parseInt(row.skill_rank)
        });
      }
    });

    // Calculate strength and weakness categories for each player
    const playerComparisons = Array.from(playerMap.values()).map(player => {
      const categoryAverages = new Map();
      
      // Only calculate categories if player has skills
      if (player.skills.length > 0) {
        console.log(`Processing ${player.skills.length} skills for player ${player.playerName}`);
        player.skills.forEach(skill => {
          console.log(`  Skill: ${skill.skillName}, Category: ${skill.skillCategory}, Rating: ${skill.rating}`);
          if (!categoryAverages.has(skill.skillCategory)) {
            categoryAverages.set(skill.skillCategory, []);
          }
          categoryAverages.get(skill.skillCategory).push(skill.rating);
        });
        
        console.log(`Category averages for ${player.playerName}:`, Array.from(categoryAverages.entries()));
        
        let strengthCategory = '';
        let weakestCategory = '';
        let highestAvg = 0;
        let lowestAvg = 6;
        
        categoryAverages.forEach((ratings, category) => {
          const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
          if (avg > highestAvg) {
            highestAvg = avg;
            strengthCategory = category;
          }
          if (avg < lowestAvg) {
            lowestAvg = avg;
            weakestCategory = category;
          }
        });
        
        return {
          ...player,
          strengthCategory,
          weakestCategory,
          categoryAverages: Object.fromEntries(
            Array.from(categoryAverages.entries()).map(([cat, ratings]) => [
              cat, 
              Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
            ])
          )
        };
      } else {
        // Player has no ratings
        return {
          ...player,
          categoryAverages: {}
        };
      }
    });

    console.log(`Returning ${playerComparisons.length} player comparisons`);
    if (playerComparisons.length > 0) {
      console.log('Sample player comparison:', JSON.stringify(playerComparisons[0], null, 2));
    }
    res.json(playerComparisons);
  } catch (error) {
    console.error('Error fetching player comparison data:', error);
    res.status(500).json({ error: 'Failed to fetch player comparison data' });
  }
});

// Get historical progress data for analytics
router.get('/team/:teamId/progress', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { timeframe = '6months' } = req.query;

    // Verify team access
    const teamCheck = await pool.query(
      'SELECT id FROM team WHERE id = $1 AND created_by = $2',
      [teamId, req.user.id]
    );

    if (teamCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate date range based on timeframe
    let dateCondition = '';
    switch (timeframe) {
      case '3months':
        dateCondition = "AND sr.updated_at >= NOW() - INTERVAL '3 months'";
        break;
      case '6months':
        dateCondition = "AND sr.updated_at >= NOW() - INTERVAL '6 months'";
        break;
      case '1year':
        dateCondition = "AND sr.updated_at >= NOW() - INTERVAL '1 year'";
        break;
      default:
        dateCondition = "AND sr.updated_at >= NOW() - INTERVAL '6 months'";
    }

    // Get historical skill rating data grouped by month
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('month', sr.updated_at) as month,
        ROUND(AVG(sr.rating), 1) as average_rating,
        COUNT(sr.rating) as skills_rated,
        COUNT(DISTINCT p.id) as players_rated
      FROM skill_ratings sr
      JOIN player p ON sr.player_id = p.id
      WHERE p.team_id = $1 ${dateCondition}
      GROUP BY DATE_TRUNC('month', sr.updated_at)
      ORDER BY month
    `, [teamId]);

    // Format the data for frontend consumption
    const progressData = result.rows.map(row => ({
      month: new Date(row.month).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      }),
      averageRating: parseFloat(row.average_rating),
      skillsRated: parseInt(row.skills_rated),
      playersRated: parseInt(row.players_rated)
    }));

    res.json(progressData);
  } catch (error) {
    console.error('Error fetching progress data:', error);
    res.status(500).json({ error: 'Failed to fetch progress data' });
  }
});

// Update/create skill rating
router.put('/player/:playerId/skill/:skillName', authMiddleware, [
  body('rating').isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('rated_date').isDate().withMessage('Valid date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { playerId, skillName } = req.params;
    const { rating, notes, rated_date } = req.body;

    // Verify access to player
    const playerCheck = await pool.query(`
      SELECT p.id FROM player p
      JOIN team t ON p.team_id = t.id
      JOIN team_users tu ON t.id = tu.team_id
      WHERE p.id = $1 AND tu.user_id = $2 AND tu.role IN ('head_coach', 'assistant_coach')
    `, [playerId, req.user.id]);

    if (playerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this player' });
    }

    // Get skill details
    const skillResult = await pool.query(
      'SELECT category, description FROM volleyball_skills WHERE name = $1',
      [skillName]
    );

    if (skillResult.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const skill = skillResult.rows[0];

    // Upsert skill rating
    const result = await pool.query(`
      INSERT INTO skill_ratings (
        player_id, skill_category, skill_name, skill_description,
        rating, notes, rated_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (player_id, skill_name)
      DO UPDATE SET
        rating = EXCLUDED.rating,
        notes = EXCLUDED.notes,
        rated_date = EXCLUDED.rated_date,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [playerId, skill.category, skillName, skill.description, rating, notes, rated_date]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating skill rating:', error);
    res.status(500).json({ error: 'Failed to update skill rating' });
  }
});

// Bulk update skill ratings for a player
router.post('/player/:playerId/bulk-update', authMiddleware, [
  body('ratings').isArray().withMessage('Ratings must be an array'),
  body('ratings.*.skill_name').isString().withMessage('Skill name is required'),
  body('ratings.*.rating').isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
  body('rated_date').isDate().withMessage('Valid date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { playerId } = req.params;
    const { ratings, rated_date } = req.body;

    // Verify access to player
    const playerCheck = await pool.query(`
      SELECT p.id FROM player p
      JOIN team t ON p.team_id = t.id
      JOIN team_users tu ON t.id = tu.team_id
      WHERE p.id = $1 AND tu.user_id = $2 AND tu.role IN ('head_coach', 'assistant_coach')
    `, [playerId, req.user.id]);

    if (playerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this player' });
    }

    const client = await pool.connect();
    const results = [];

    try {
      await client.query('BEGIN');

      for (const ratingData of ratings) {
        const { skill_name, rating, notes } = ratingData;

        // Get skill details
        const skillResult = await client.query(
          'SELECT category, description FROM volleyball_skills WHERE name = $1',
          [skill_name]
        );

        if (skillResult.rows.length === 0) {
          throw new Error(`Skill not found: ${skill_name}`);
        }

        const skill = skillResult.rows[0];

        // Upsert skill rating
        const result = await client.query(`
          INSERT INTO skill_ratings (
            player_id, skill_category, skill_name, skill_description,
            rating, notes, rated_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (player_id, skill_name)
          DO UPDATE SET
            rating = EXCLUDED.rating,
            notes = EXCLUDED.notes,
            rated_date = EXCLUDED.rated_date,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `, [playerId, skill.category, skill_name, skill.description, rating, notes, rated_date]);

        results.push(result.rows[0]);
      }

      await client.query('COMMIT');
      res.json({ message: 'Bulk update successful', ratings: results });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error bulk updating skill ratings:', error);
    res.status(500).json({ error: 'Failed to bulk update skill ratings' });
  }
});

module.exports = router;
