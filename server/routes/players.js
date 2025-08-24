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
      SELECT p.*, t.name as team_name, t.season
      FROM player p
      JOIN team t ON p.team_id = t.id
      WHERE p.team_id = $1
      ORDER BY p.jersey_number, p.name
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
  body('name').trim().isLength({ min: 1 }).withMessage('Player name is required'),
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
      name, position, year, jersey_number, height, reach,
      dominant_hand, contact_info, notes, photo_url, team_id
    } = req.body;

    console.log('Extracted data:', {
      name, position, year, jersey_number, height, reach,
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
        name, position, year, jersey_number, height, reach,
        dominant_hand, contact_info, notes, photo_url, team_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [name, position, year, jersey_number, height, reach,
        dominant_hand, contact_info, notes, photo_url, team_id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

// Update player
router.put('/:id', authMiddleware, [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Player name cannot be empty'),
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
      name, position, year, jersey_number, height, reach,
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
        name = COALESCE($1, name),
        position = COALESCE($2, position),
        year = COALESCE($3, year),
        jersey_number = COALESCE($4, jersey_number),
        height = COALESCE($5, height),
        reach = COALESCE($6, reach),
        dominant_hand = COALESCE($7, dominant_hand),
        contact_info = COALESCE($8, contact_info),
        notes = COALESCE($9, notes),
        photo_url = COALESCE($10, photo_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `, [name, position, year, jersey_number, height, reach,
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

module.exports = router;
