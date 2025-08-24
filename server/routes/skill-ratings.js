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
