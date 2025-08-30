const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get attendance for a specific event
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

    // Get attendance data with player information
    const result = await pool.query(`
      SELECT 
        a.id,
        a.event_id,
        a.player_id,
        a.status,
        a.notes,
        a.marked_by,
        a.created_at,
        a.updated_at,
        p.first_name,
        p.last_name,
        p.jersey_number,
        u.first_name as marked_by_first_name,
        u.last_name as marked_by_last_name
      FROM attendance a
      JOIN players p ON a.player_id = p.id
      LEFT JOIN users u ON a.marked_by = u.id
      WHERE a.event_id = $1
      ORDER BY p.last_name, p.first_name
    `, [eventId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance data' });
  }
});

// Get attendance for a specific player
router.get('/player/:playerId', authMiddleware, async (req, res) => {
  try {
    const { playerId } = req.params;

    // Verify user has access to this player's team
    const accessCheck = await pool.query(`
      SELECT p.id FROM player p
      JOIN team_users tu ON p.team_id = tu.team_id
      WHERE p.id = $1 AND tu.user_id = $2
    `, [playerId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get attendance history for the player
    const result = await pool.query(`
      SELECT 
        a.id,
        a.event_id,
        a.status,
        a.notes,
        a.created_at,
        se.title as event_title,
        se.event_type,
        se.event_date,
        se.start_time,
        se.end_time
      FROM attendance a
      JOIN schedule_events se ON a.event_id = se.id
      WHERE a.player_id = $1
      ORDER BY se.event_date DESC, se.start_time DESC
    `, [playerId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching player attendance:', error);
    res.status(500).json({ error: 'Failed to fetch player attendance data' });
  }
});

// Mark attendance for players
router.post('/mark', authMiddleware, [
  body('eventId').isInt({ min: 1 }),
  body('attendanceData').isArray(),
  body('attendanceData.*.playerId').isInt({ min: 1 }),
  body('attendanceData.*.status').isIn(['present', 'absent', 'excused', 'late']),
  body('attendanceData.*.notes').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { eventId, attendanceData } = req.body;

    // Verify user has coach access to this event's team
    const accessCheck = await pool.query(`
      SELECT se.id FROM schedule_events se
      JOIN team t ON se.team_id = t.id
      JOIN team_users tu ON t.id = tu.team_id
      WHERE se.id = $1 AND tu.user_id = $2 AND tu.role IN ('head_coach', 'assistant_coach')
    `, [eventId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only coaches can mark attendance' });
    }

    // Use transaction to ensure data consistency
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const results = [];
      for (const attendance of attendanceData) {
        const { playerId, status, notes } = attendance;

        // Upsert attendance record
        const result = await client.query(`
          INSERT INTO attendance (event_id, player_id, status, notes, marked_by)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (event_id, player_id)
          DO UPDATE SET 
            status = EXCLUDED.status,
            notes = EXCLUDED.notes,
            marked_by = EXCLUDED.marked_by,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `, [eventId, playerId, status, notes || null, req.user.id]);

        results.push(result.rows[0]);
      }

      await client.query('COMMIT');
      res.json({ message: 'Attendance marked successfully', attendance: results });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Get attendance summary/statistics
router.get('/summary/:teamId', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify user has access to this team
    const accessCheck = await pool.query(`
      SELECT tu.role FROM team_users tu
      WHERE tu.team_id = $1 AND tu.user_id = $2
    `, [teamId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build date filter
    let dateFilter = '';
    const params = [teamId];
    let paramIndex = 2;

    if (startDate) {
      dateFilter += ` AND se.event_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      dateFilter += ` AND se.event_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    // Get attendance statistics
    const summaryQuery = `
      SELECT 
        p.id as player_id,
        p.first_name,
        p.last_name,
        p.jersey_number,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_count,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
        COUNT(a.id) as total_events_with_attendance,
        ROUND(
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(CASE WHEN a.status IN ('present', 'absent', 'late') THEN 1 END), 0), 
          2
        ) as attendance_percentage
      FROM player p
      LEFT JOIN attendance a ON p.id = a.player_id
      LEFT JOIN schedule_events se ON a.event_id = se.id
      WHERE p.team_id = $1 ${dateFilter}
      GROUP BY p.id, p.first_name, p.last_name, p.jersey_number
      ORDER BY p.last_name, p.first_name
    `;

    const result = await pool.query(summaryQuery, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
});

module.exports = router;
