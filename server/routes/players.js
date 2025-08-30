const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all players for authenticated user's teams
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, t.name as team_name, t.season
      FROM player p
      JOIN team t ON p.team_id = t.id
      JOIN team_users tu ON t.id = tu.team_id
      WHERE tu.user_id = $1
      ORDER BY t.name, p.jersey_number, p.name
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Get players for a specific team
router.get('/team/:teamId', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;

    // Verify user has access to this team
    const teamCheck = await pool.query(
      'SELECT id FROM team_users WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );

    if (teamCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this team' });
    }

    const result = await pool.query(`
      SELECT p.*, t.name as team_name, t.season,
             p.first_name || COALESCE(' ' || p.last_name, '') as name
      FROM player p
      JOIN team t ON p.team_id = t.id
      WHERE p.team_id = $1
      ORDER BY p.jersey_number, p.last_name, p.first_name
    `, [teamId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching team players:', error);
    res.status(500).json({ error: 'Failed to fetch team players' });
  }
});

// Get single player details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT p.*, t.name as team_name, t.season
      FROM player p
      JOIN team t ON p.team_id = t.id
      JOIN team_users tu ON t.id = tu.team_id
      WHERE p.id = $1 AND tu.user_id = $2
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found or access denied' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// Create new player
router.post('/', authMiddleware, [
  body('first_name').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('last_name').optional().trim(),
  body('team_id').isInt().withMessage('Valid team ID is required'),
  body('jersey_number').optional().isInt({ min: 0, max: 99 }).withMessage('Jersey number must be between 0-99'),
  body('position').optional().isIn(['setter', 'outside_hitter', 'middle_blocker', 'opposite', 'libero', 'defensive_specialist']).withMessage('Invalid position'),
  body('year').optional().isIn(['freshman', 'sophomore', 'junior', 'senior', 'graduate']).withMessage('Invalid year'),
  body('height').optional().isFloat({ min: 48, max: 96 }).withMessage('Height must be between 48-96 inches'),
  body('reach').optional().isFloat({ min: 60, max: 140 }).withMessage('Reach must be between 60-140 inches'),
  body('dominant_hand').optional().isIn(['Right', 'Left', 'Ambidextrous']).withMessage('Invalid dominant hand')
], async (req, res) => {
  try {
    console.log('=== PLAYER CREATION DEBUG ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user.id);
    console.log('User object:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
      first_name, last_name, position, year, jersey_number, dominant_hand, 
      contact_info, notes, photo_url, team_id
    } = req.body;

    // Set default values for height and reach if not provided
    const height = req.body.height || 70;
    const reach = req.body.reach || 80;

    console.log('Extracted data:', {
      first_name, last_name, position, year, jersey_number, height, reach,
      dominant_hand, contact_info, notes, photo_url, team_id
    });

    // Verify user has coaching access to this team
    console.log('Checking team access for user:', req.user.id, 'team:', team_id);
    const teamCheck = await pool.query(
      'SELECT role FROM team_users WHERE team_id = $1 AND user_id = $2',
      [team_id, req.user.id]
    );

    console.log('Team check result:', teamCheck.rows);

    if (teamCheck.rows.length === 0) {
      console.log('❌ Access denied - user not in team');
      return res.status(403).json({ error: 'Access denied to this team' });
    }

    const userRole = teamCheck.rows[0].role;
    console.log('User role in team:', userRole);
    if (!['head_coach', 'assistant_coach'].includes(userRole)) {
      console.log('❌ Access denied - insufficient role');
      return res.status(403).json({ error: 'Only coaches can add players' });
    }

    // Check for duplicate jersey number in the same team
    if (jersey_number) {
      const jerseyCheck = await pool.query(
        'SELECT id FROM player WHERE team_id = $1 AND jersey_number = $2',
        [team_id, jersey_number]
      );

      if (jerseyCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Jersey number already exists for this team' });
      }
    }

    const result = await pool.query(`
      INSERT INTO player (
        first_name, last_name, position, year, jersey_number, height, reach,
        dominant_hand, contact_info, notes, photo_url, team_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *, first_name || COALESCE(' ' || last_name, '') as name
    `, [first_name, last_name, position, year, jersey_number, height, reach,
        dominant_hand, contact_info, notes, photo_url, team_id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

// Update player
router.put('/:id', authMiddleware, [
  body('first_name').optional().trim().isLength({ min: 1 }).withMessage('First name cannot be empty'),
  body('last_name').optional().trim(),
  body('jersey_number').optional().isInt({ min: 0, max: 99 }).withMessage('Jersey number must be between 0-99'),
  body('position').optional().isIn(['setter', 'outside_hitter', 'middle_blocker', 'opposite', 'libero', 'defensive_specialist']).withMessage('Invalid position'),
  body('year').optional().isIn(['freshman', 'sophomore', 'junior', 'senior', 'graduate']).withMessage('Invalid year'),
  body('height').optional().isFloat({ min: 48, max: 96 }).withMessage('Height must be between 48-96 inches'),
  body('reach').optional().isFloat({ min: 60, max: 140 }).withMessage('Reach must be between 60-140 inches'),
  body('dominant_hand').optional().isIn(['Right', 'Left', 'Ambidextrous']).withMessage('Invalid dominant hand')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { id } = req.params;
    const {
      first_name, last_name, position, year, jersey_number, height, reach,
      dominant_hand, contact_info, notes, photo_url
    } = req.body;

    // Verify user has coaching access to this player's team
    const accessCheck = await pool.query(`
      SELECT tu.role, p.team_id
      FROM player p
      JOIN team_users tu ON p.team_id = tu.team_id
      WHERE p.id = $1 AND tu.user_id = $2
    `, [id, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found or access denied' });
    }

    const userRole = accessCheck.rows[0].role;
    if (!['head_coach', 'assistant_coach'].includes(userRole)) {
      return res.status(403).json({ error: 'Only coaches can update players' });
    }

    // Check for duplicate jersey number in the same team (excluding current player)
    if (jersey_number) {
      const teamId = accessCheck.rows[0].team_id;
      const jerseyCheck = await pool.query(
        'SELECT id FROM player WHERE team_id = $1 AND jersey_number = $2 AND id != $3',
        [teamId, jersey_number, id]
      );

      if (jerseyCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Jersey number already exists for this team' });
      }
    }

    const result = await pool.query(`
      UPDATE player SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        position = COALESCE($3, position),
        year = COALESCE($4, year),
        jersey_number = COALESCE($5, jersey_number),
        height = COALESCE($6, height),
        reach = COALESCE($7, reach),
        dominant_hand = COALESCE($8, dominant_hand),
        contact_info = COALESCE($9, contact_info),
        notes = COALESCE($10, notes),
        photo_url = COALESCE($11, photo_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *, first_name || COALESCE(' ' || last_name, '') as name
    `, [first_name, last_name, position, year, jersey_number, height, reach,
        dominant_hand, contact_info, notes, photo_url, id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// Delete player
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user has head coach access to this player's team
    const accessCheck = await pool.query(`
      SELECT tu.role
      FROM player p
      JOIN team_users tu ON p.team_id = tu.team_id
      WHERE p.id = $1 AND tu.user_id = $2
    `, [id, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found or access denied' });
    }

    const userRole = accessCheck.rows[0].role;
    if (userRole !== 'head_coach') {
      return res.status(403).json({ error: 'Only head coaches can delete players' });
    }

    await pool.query('DELETE FROM player WHERE id = $1', [id]);

    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

// Bulk import players
router.post('/bulk-import', authMiddleware, [
  body('team_id').isInt().withMessage('Valid team ID is required'),
  body('players').isArray({ min: 1 }).withMessage('Players array is required and must not be empty'),
  body('players.*.first_name').trim().isLength({ min: 1 }).withMessage('First name is required for all players'),
  body('players.*.last_name').optional().trim(),
  body('players.*.jersey_number').optional().isInt({ min: 0, max: 99 }).withMessage('Jersey number must be between 0-99'),
  body('players.*.position').optional().isIn(['setter', 'outside_hitter', 'middle_blocker', 'opposite', 'libero', 'defensive_specialist']).withMessage('Invalid position'),
  body('players.*.year').optional().isIn(['freshman', 'sophomore', 'junior', 'senior', 'graduate']).withMessage('Invalid year'),
  body('players.*.height').optional().isFloat({ min: 48, max: 96 }).withMessage('Height must be between 48-96 inches'),
  body('players.*.reach').optional().isFloat({ min: 60, max: 140 }).withMessage('Reach must be between 60-140 inches'),
  body('players.*.dominant_hand').optional().isIn(['Right', 'Left', 'Ambidextrous']).withMessage('Invalid dominant hand')
], async (req, res) => {
  try {
    console.log('=== BULK PLAYER IMPORT DEBUG ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user.id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { team_id, players } = req.body;

    // Verify user has coaching access to this team
    console.log('Checking team access for user:', req.user.id, 'team:', team_id);
    const teamCheck = await pool.query(
      'SELECT role FROM team_users WHERE team_id = $1 AND user_id = $2',
      [team_id, req.user.id]
    );

    if (teamCheck.rows.length === 0) {
      console.log('❌ Access denied - user not in team');
      return res.status(403).json({ error: 'Access denied to this team' });
    }

    const userRole = teamCheck.rows[0].role;
    if (!['head_coach', 'assistant_coach'].includes(userRole)) {
      console.log('❌ Access denied - insufficient role');
      return res.status(403).json({ error: 'Only coaches can add players' });
    }

    // Check for duplicate jersey numbers within the import and existing team
    const existingJerseys = await pool.query(
      'SELECT jersey_number FROM player WHERE team_id = $1 AND jersey_number IS NOT NULL',
      [team_id]
    );
    const existingJerseyNumbers = new Set(existingJerseys.rows.map(row => row.jersey_number));
    
    const importJerseyNumbers = new Set();
    const duplicateJerseys = [];
    
    for (const player of players) {
      if (player.jersey_number) {
        if (existingJerseyNumbers.has(player.jersey_number) || importJerseyNumbers.has(player.jersey_number)) {
          duplicateJerseys.push(player.jersey_number);
        }
        importJerseyNumbers.add(player.jersey_number);
      }
    }

    if (duplicateJerseys.length > 0) {
      return res.status(400).json({ 
        error: 'Duplicate jersey numbers found', 
        duplicates: duplicateJerseys 
      });
    }

    // Begin transaction
    await pool.query('BEGIN');

    const importResults = [];
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const playerData of players) {
        try {
          const {
            first_name, last_name, position, year, jersey_number, dominant_hand, 
            contact_info, notes, photo_url
          } = playerData;

          // Set default values for height and reach if not provided
          const height = playerData.height || 70;
          const reach = playerData.reach || 80;

          const result = await pool.query(`
            INSERT INTO player (
              first_name, last_name, position, year, jersey_number, height, reach,
              dominant_hand, contact_info, notes, photo_url, team_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *, first_name || COALESCE(' ' || last_name, '') as name
          `, [first_name, last_name, position, year, jersey_number, height, reach,
              dominant_hand, contact_info, notes, photo_url, team_id]);

          importResults.push({
            success: true,
            player: result.rows[0],
            originalData: playerData
          });
          successCount++;

        } catch (playerError) {
          console.error('Error importing player:', playerError);
          importResults.push({
            success: false,
            error: playerError.message,
            originalData: playerData
          });
          errorCount++;
        }
      }

      // Commit transaction
      await pool.query('COMMIT');

      console.log(`✅ Bulk import completed: ${successCount} successful, ${errorCount} errors`);

      res.status(201).json({
        message: `Bulk import completed: ${successCount} players added successfully`,
        summary: {
          total: players.length,
          successful: successCount,
          errors: errorCount
        },
        results: importResults
      });

    } catch (transactionError) {
      await pool.query('ROLLBACK');
      throw transactionError;
    }

  } catch (error) {
    console.error('Error in bulk player import:', error);
    res.status(500).json({ error: 'Failed to import players' });
  }
});

module.exports = router;
