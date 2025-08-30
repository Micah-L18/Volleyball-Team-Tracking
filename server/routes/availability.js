const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get availability for a specific event
router.get('/event/:eventId', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify user has access to this event's team
    const accessCheck = await pool.query(`
      SELECT se.id FROM schedule_events se
      JOIN team t ON se.team_id = t.id
      JOIN team_users tu ON t.id = tu.team_id
      WHERE se.id = $1 AND tu.user_id = $2
    `, [eventId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get availability data with player information
    const result = await pool.query(`
      SELECT 
        av.id,
        av.event_id,
        av.player_id,
        av.available,
        av.notes,
        av.created_at,
        av.updated_at,
        p.first_name,
        p.last_name,
        p.jersey_number
      FROM availability av
      JOIN player p ON av.player_id = p.id
      WHERE av.event_id = $1
      ORDER BY p.last_name, p.first_name
    `, [eventId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability data' });
  }
});

// Get availability for a specific player
router.get('/player/:playerId', authMiddleware, async (req, res) => {
  try {
    const { playerId } = req.params;

    // Verify user has access to this player's team OR is the player themselves
    const accessCheck = await pool.query(`
      SELECT p.id, p.user_id FROM player p
      JOIN team_users tu ON p.team_id = tu.team_id
      WHERE p.id = $1 AND (tu.user_id = $2 OR p.user_id = $2)
    `, [playerId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get upcoming events with availability status
    const result = await pool.query(`
      SELECT 
        se.id as event_id,
        se.title as event_title,
        se.event_type,
        se.event_date,
        se.start_time,
        se.end_time,
        se.location,
        av.id as availability_id,
        av.available,
        av.notes,
        av.updated_at
      FROM schedule_events se
      JOIN player p ON se.team_id = p.team_id
      LEFT JOIN availability av ON se.id = av.event_id AND av.player_id = p.id
      WHERE p.id = $1 AND se.event_date >= CURRENT_DATE
      ORDER BY se.event_date, se.start_time
    `, [playerId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching player availability:', error);
    res.status(500).json({ error: 'Failed to fetch player availability data' });
  }
});

// Update player availability
router.post('/update', authMiddleware, [
  body('eventId').isInt({ min: 1 }),
  body('playerId').isInt({ min: 1 }),
  body('available').isBoolean(),
  body('notes').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { eventId, playerId, available, notes } = req.body;

    // Verify user has access - either coach or the player themselves
    const accessCheck = await pool.query(`
      SELECT 
        p.id, 
        p.user_id,
        tu.role
      FROM player p
      JOIN team_users tu ON p.team_id = tu.team_id
      JOIN schedule_events se ON se.team_id = p.team_id
      WHERE p.id = $1 AND se.id = $2 AND 
        (tu.user_id = $3 OR p.user_id = $3)
    `, [playerId, eventId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const playerData = accessCheck.rows[0];
    const isPlayer = playerData.user_id === req.user.id;
    const isCoach = ['head_coach', 'assistant_coach'].includes(playerData.role);

    if (!isPlayer && !isCoach) {
      return res.status(403).json({ error: 'Only the player or coaches can update availability' });
    }

    // Upsert availability record
    const result = await pool.query(`
      INSERT INTO availability (event_id, player_id, available, notes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (event_id, player_id)
      DO UPDATE SET 
        available = EXCLUDED.available,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [eventId, playerId, available, notes || null]);

    res.json({ 
      message: 'Availability updated successfully', 
      availability: result.rows[0] 
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Bulk update availability for multiple events
router.post('/bulk-update', authMiddleware, [
  body('playerId').isInt({ min: 1 }),
  body('availabilityData').isArray(),
  body('availabilityData.*.eventId').isInt({ min: 1 }),
  body('availabilityData.*.available').isBoolean(),
  body('availabilityData.*.notes').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { playerId, availabilityData } = req.body;

    // Verify user is the player or a coach
    const accessCheck = await pool.query(`
      SELECT 
        p.id, 
        p.user_id,
        tu.role
      FROM player p
      JOIN team_users tu ON p.team_id = tu.team_id
      WHERE p.id = $1 AND (tu.user_id = $2 OR p.user_id = $2)
    `, [playerId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const playerData = accessCheck.rows[0];
    const isPlayer = playerData.user_id === req.user.id;
    const isCoach = ['head_coach', 'assistant_coach'].includes(playerData.role);

    if (!isPlayer && !isCoach) {
      return res.status(403).json({ error: 'Only the player or coaches can update availability' });
    }

    // Use transaction for bulk update
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const results = [];
      for (const availability of availabilityData) {
        const { eventId, available, notes } = availability;

        const result = await client.query(`
          INSERT INTO availability (event_id, player_id, available, notes)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (event_id, player_id)
          DO UPDATE SET 
            available = EXCLUDED.available,
            notes = EXCLUDED.notes,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `, [eventId, playerId, available, notes || null]);

        results.push(result.rows[0]);
      }

      await client.query('COMMIT');
      res.json({ 
        message: 'Availability updated successfully', 
        availability: results 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error bulk updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Get availability summary for coaches
router.get('/summary/:eventId', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify user has coach access to this event's team
    const accessCheck = await pool.query(`
      SELECT se.id FROM schedule_events se
      JOIN team t ON se.team_id = t.id
      JOIN team_users tu ON t.id = tu.team_id
      WHERE se.id = $1 AND tu.user_id = $2 AND tu.role IN ('head_coach', 'assistant_coach')
    `, [eventId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only coaches can view availability summary' });
    }

    // Get all players and their availability for this event
    const result = await pool.query(`
      SELECT 
        p.id as player_id,
        p.first_name,
        p.last_name,
        p.jersey_number,
        p.position,
        COALESCE(av.available, true) as available,
        av.notes,
        av.updated_at
      FROM player p
      JOIN schedule_events se ON p.team_id = se.team_id
      LEFT JOIN availability av ON p.id = av.player_id AND av.event_id = se.id
      WHERE se.id = $1 AND p.status = 'active'
      ORDER BY p.last_name, p.first_name
    `, [eventId]);

    const summary = {
      total_players: result.rows.length,
      available: result.rows.filter(p => p.available).length,
      unavailable: result.rows.filter(p => !p.available).length,
      no_response: result.rows.filter(p => p.updated_at === null).length,
      players: result.rows
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching availability summary:', error);
    res.status(500).json({ error: 'Failed to fetch availability summary' });
  }
});

module.exports = router;
