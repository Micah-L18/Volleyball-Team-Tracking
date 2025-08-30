const express = require('express');
const { body, validationResult } = require('express-validator');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get events for statistics entry (simplified list)
router.get('/events/:teamId', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;

    // Verify user has access to this team
    const accessCheck = await pool.query(`
      SELECT tu.role FROM team_users tu
      WHERE tu.team_id = $1 AND tu.user_id = $2
    `, [teamId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get recent events (last 30 days) and upcoming events (next 7 days)
    const result = await pool.query(`
      SELECT 
        id,
        title,
        event_type,
        event_date,
        start_time,
        opponent,
        location
      FROM schedule_events 
      WHERE team_id = $1 
        AND (
          (event_date >= CURRENT_DATE - INTERVAL '30 days' AND event_date <= CURRENT_DATE)
          OR (event_date >= CURRENT_DATE AND event_date <= CURRENT_DATE + INTERVAL '7 days')
        )
      ORDER BY event_date DESC, start_time DESC
    `, [teamId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching events for statistics:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/temp/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.toLowerCase().endsWith('.csv') ||
        file.originalname.toLowerCase().endsWith('.xlsx') ||
        file.originalname.toLowerCase().endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'), false);
    }
  }
});

// Get player statistics summary
router.get('/player/summary', authMiddleware, async (req, res) => {
  try {
    const { playerId, startDate, endDate } = req.query;

    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    // Verify user has access to this player
    const accessCheck = await pool.query(`
      SELECT tu.role FROM team_users tu
      JOIN player p ON p.team_id = tu.team_id
      WHERE p.id = $1 AND tu.user_id = $2
    `, [playerId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let baseQuery = `
      SELECT 
        ps.stat_name,
        ps.stat_category,
        COUNT(*) as total_entries,
        AVG(ps.stat_value) as average_value,
        MAX(ps.stat_value) as max_value,
        MIN(ps.stat_value) as min_value,
        SUM(ps.stat_value) as total_value
      FROM player_statistics ps
      WHERE ps.player_id = $1
    `;

    const params = [playerId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      baseQuery += ` AND ps.game_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      baseQuery += ` AND ps.game_date <= $${paramCount}`;
      params.push(endDate);
    }

    baseQuery += ` GROUP BY ps.stat_name, ps.stat_category ORDER BY ps.stat_category, ps.stat_name`;

    const result = await pool.query(baseQuery, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching player summary:', error);
    res.status(500).json({ error: 'Failed to fetch player summary' });
  }
});

// Get general statistics summary
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const { playerId, eventId } = req.query;

    let summary = {
      totalStats: 0,
      categories: [],
      recentActivity: []
    };

    if (playerId) {
      // Get player-specific summary
      const playerStatsResult = await pool.query(`
        SELECT COUNT(*) as total_stats
        FROM player_statistics 
        WHERE player_id = $1
      `, [playerId]);

      const categoriesResult = await pool.query(`
        SELECT DISTINCT stat_category
        FROM player_statistics 
        WHERE player_id = $1
      `, [playerId]);

      summary.totalStats = parseInt(playerStatsResult.rows[0]?.total_stats || 0);
      summary.categories = categoriesResult.rows.map(row => row.stat_category);
    } else {
      // Get general summary for user's teams
      const userTeamsResult = await pool.query(`
        SELECT COUNT(DISTINCT ps.id) as total_player_stats,
               COUNT(DISTINCT ts.id) as total_team_stats
        FROM team_users tu
        LEFT JOIN player p ON p.team_id = tu.team_id
        LEFT JOIN player_statistics ps ON ps.player_id = p.id
        LEFT JOIN team_statistics ts ON ts.team_id = tu.team_id
        WHERE tu.user_id = $1
      `, [req.user.id]);

      const playerStats = parseInt(userTeamsResult.rows[0]?.total_player_stats || 0);
      const teamStats = parseInt(userTeamsResult.rows[0]?.total_team_stats || 0);
      summary.totalStats = playerStats + teamStats;

      const categoriesResult = await pool.query(`
        SELECT DISTINCT stat_category as category
        FROM player_statistics ps
        JOIN player p ON ps.player_id = p.id
        JOIN team_users tu ON tu.team_id = p.team_id
        WHERE tu.user_id = $1
        UNION
        SELECT DISTINCT stat_category as category
        FROM team_statistics ts
        JOIN team_users tu ON tu.team_id = ts.team_id
        WHERE tu.user_id = $1
      `, [req.user.id]);

      summary.categories = categoriesResult.rows.map(row => row.category);
    }

    res.json(summary);
  } catch (error) {
    console.error('Error fetching statistics summary:', error);
    res.status(500).json({ error: 'Failed to fetch statistics summary' });
  }
});

// Get player statistics
router.get('/player/:playerId', authMiddleware, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { category, startDate, endDate, gameType } = req.query;

    // Verify user has access to this player
    const accessCheck = await pool.query(`
      SELECT p.id FROM player p
      JOIN team_users tu ON p.team_id = tu.team_id
      WHERE p.id = $1 AND tu.user_id = $2
    `, [playerId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build dynamic query based on filters
    let query = `
      SELECT 
        ps.*,
        p.name
      FROM player_statistics ps
      JOIN player p ON ps.player_id = p.id
      WHERE ps.player_id = $1
    `;
    
    const params = [playerId];
    let paramIndex = 2;

    if (category) {
      query += ` AND ps.stat_category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND ps.stat_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND ps.stat_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (gameType) {
      query += ` AND LOWER(ps.game_type) = LOWER($${paramIndex})`;
      params.push(gameType);
      paramIndex++;
    }

    query += ` ORDER BY ps.stat_date DESC, ps.stat_category, ps.stat_name`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching player statistics:', error);
    res.status(500).json({ error: 'Failed to fetch player statistics' });
  }
});

// Get team statistics
router.get('/team/:teamId', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { category, startDate, endDate, gameType } = req.query;

    // Verify user has access to this team
    const accessCheck = await pool.query(`
      SELECT tu.role FROM team_users tu
      WHERE tu.team_id = $1 AND tu.user_id = $2
    `, [teamId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build dynamic query
    let query = `
      SELECT 
        ts.*,
        t.name as team_name
      FROM team_statistics ts
      JOIN team t ON ts.team_id = t.id
      WHERE ts.team_id = $1
    `;
    
    const params = [teamId];
    let paramIndex = 2;

    if (category) {
      query += ` AND ts.stat_category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND ts.stat_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND ts.stat_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (gameType) {
      query += ` AND LOWER(ts.game_type) = LOWER($${paramIndex})`;
      params.push(gameType);
      paramIndex++;
    }

    query += ` ORDER BY ts.stat_date DESC, ts.stat_category, ts.stat_name`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching team statistics:', error);
    res.status(500).json({ error: 'Failed to fetch team statistics' });
  }
});

// Get all players statistics for a team
router.get('/team/:teamId/all-players', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { category, startDate, endDate, gameType, player, statistic, opponent, minValue, maxValue, position, event } = req.query;

    // Verify user has access to this team
    const accessCheck = await pool.query(`
      SELECT tu.role FROM team_users tu
      WHERE tu.team_id = $1 AND tu.user_id = $2
    `, [teamId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build dynamic query with player information
    let query = `
      SELECT 
        ps.*,
        p.first_name,
        p.last_name,
        p.first_name || COALESCE(' ' || p.last_name, '') as player_name,
        p.jersey_number,
        p.position
      FROM player_statistics ps
      JOIN player p ON ps.player_id = p.id
      WHERE p.team_id = $1
    `;
    
    const params = [teamId];
    let paramIndex = 2;

    if (player) {
      query += ` AND p.id = $${paramIndex}`;
      params.push(player);
      paramIndex++;
    }

    if (category) {
      query += ` AND ps.stat_category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (statistic) {
      query += ` AND ps.stat_name = $${paramIndex}`;
      params.push(statistic);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND ps.stat_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND ps.stat_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (gameType) {
      query += ` AND LOWER(ps.game_type) = LOWER($${paramIndex})`;
      params.push(gameType);
      paramIndex++;
    }

    if (position) {
      query += ` AND p.position = $${paramIndex}`;
      params.push(position);
      paramIndex++;
    }

    if (opponent) {
      query += ` AND ps.opponent ILIKE $${paramIndex}`;
      params.push(`%${opponent}%`);
      paramIndex++;
    }

    if (event) {
      // Filter by matching the event date with the statistics date
      query += ` AND ps.stat_date = (SELECT event_date FROM schedule_events WHERE id = $${paramIndex} AND team_id = $1)`;
      params.push(event);
      paramIndex++;
    }

    if (minValue !== undefined && minValue !== null && minValue !== '') {
      query += ` AND ps.stat_value >= $${paramIndex}`;
      params.push(parseFloat(minValue));
      paramIndex++;
    }

    if (maxValue !== undefined && maxValue !== null && maxValue !== '') {
      query += ` AND ps.stat_value <= $${paramIndex}`;
      params.push(parseFloat(maxValue));
      paramIndex++;
    }

    query += ` ORDER BY ps.stat_date DESC, p.last_name, p.first_name, ps.stat_category, ps.stat_name`;

    console.log('=== ALL PLAYERS QUERY DEBUG ===');
    console.log('Query:', query);
    console.log('Params:', params);
    
    const result = await pool.query(query, params);
    
    console.log('Results count:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('First result:', result.rows[0]);
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all players statistics:', error);
    res.status(500).json({ error: 'Failed to fetch all players statistics' });
  }
});

// Add player statistics
router.post('/player', authMiddleware, [
  body('playerId').isInt({ min: 1 }),
  body('statCategory').isLength({ min: 1, max: 50 }),
  body('statName').isLength({ min: 1, max: 100 }),
  body('statValue').isNumeric(),
  body('eventId').optional().isInt({ min: 1 }),
  body('statDate').optional().isDate(),
  body('gameType').optional().isLength({ max: 50 }),
  body('opponent').optional().isLength({ max: 100 }),
  body('setNumber').optional().isInt({ min: 1, max: 5 }),
  body('notes').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { playerId, statCategory, statName, statValue, eventId, statDate, gameType, opponent, setNumber, notes } = req.body;

    // If eventId is provided, get event details to auto-populate fields
    let eventDetails = null;
    if (eventId) {
      const eventResult = await pool.query(`
        SELECT event_date, event_type, opponent, title
        FROM schedule_events 
        WHERE id = $1
      `, [eventId]);
      
      if (eventResult.rows.length > 0) {
        eventDetails = eventResult.rows[0];
      }
    }

    // Use event details if available, otherwise use provided values
    const finalStatDate = eventDetails ? eventDetails.event_date : statDate;
    const finalGameType = eventDetails ? eventDetails.event_type : gameType;
    const finalOpponent = eventDetails ? eventDetails.opponent : opponent;

    // Validate that we have required date field
    if (!finalStatDate) {
      return res.status(400).json({ error: 'statDate is required when eventId is not provided' });
    }

    // Verify user has access to this player
    const accessCheck = await pool.query(`
      SELECT p.id FROM player p
      JOIN team_users tu ON p.team_id = tu.team_id
      WHERE p.id = $1 AND tu.user_id = $2 AND tu.role IN ('head_coach', 'assistant_coach')
    `, [playerId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only coaches can add player statistics' });
    }

    const result = await pool.query(`
      INSERT INTO player_statistics 
      (player_id, stat_category, stat_name, stat_value, stat_date, game_type, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [playerId, statCategory, statName, statValue, finalStatDate, finalGameType, notes]);

    res.status(201).json({
      message: 'Player statistics added successfully',
      statistic: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding player statistics:', error);
    res.status(500).json({ error: 'Failed to add player statistics' });
  }
});

// Add team statistics
router.post('/team', authMiddleware, [
  body('teamId').isInt({ min: 1 }),
  body('statCategory').isLength({ min: 1, max: 50 }),
  body('statName').isLength({ min: 1, max: 100 }),
  body('statValue').isNumeric(),
  body('eventId').optional().isInt({ min: 1 }),
  body('statDate').optional().isDate(),
  body('gameType').optional().isLength({ max: 50 }),
  body('opponent').optional().isLength({ max: 255 }),
  body('notes').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { teamId, statCategory, statName, statValue, eventId, statDate, gameType, opponent, notes } = req.body;

    // If eventId is provided, get event details to auto-populate fields
    let eventDetails = null;
    if (eventId) {
      const eventResult = await pool.query(`
        SELECT event_date, event_type, opponent, title
        FROM schedule_events 
        WHERE id = $1
      `, [eventId]);
      
      if (eventResult.rows.length > 0) {
        eventDetails = eventResult.rows[0];
      }
    }

    // Use event details if available, otherwise use provided values
    const finalStatDate = eventDetails ? eventDetails.event_date : statDate;
    const finalGameType = eventDetails ? eventDetails.event_type : gameType;
    const finalOpponent = eventDetails ? eventDetails.opponent : opponent;

    // Validate that we have required date field
    if (!finalStatDate) {
      return res.status(400).json({ error: 'statDate is required when eventId is not provided' });
    }

    // Verify user has access to this team
    const accessCheck = await pool.query(`
      SELECT tu.role FROM team_users tu
      WHERE tu.team_id = $1 AND tu.user_id = $2 AND tu.role IN ('head_coach', 'assistant_coach')
    `, [teamId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only coaches can add team statistics' });
    }

    const result = await pool.query(`
      INSERT INTO team_statistics 
      (team_id, stat_category, stat_name, stat_value, stat_date, game_type, opponent, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [teamId, statCategory, statName, statValue, finalStatDate, finalGameType, finalOpponent, notes]);

    res.status(201).json({
      message: 'Team statistics added successfully',
      statistic: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding team statistics:', error);
    res.status(500).json({ error: 'Failed to add team statistics' });
  }
});

// Add multiple player statistics at once
router.post('/player/bulk', authMiddleware, [
  body('statistics').isArray({ min: 1 }),
  body('statistics.*.playerId').isInt({ min: 1 }),
  body('statistics.*.statCategory').isLength({ min: 1, max: 50 }),
  body('statistics.*.statName').isLength({ min: 1, max: 100 }),
  body('statistics.*.statValue').isNumeric(),
  body('statistics.*.eventId').optional().isInt({ min: 1 }),
  body('statistics.*.statDate').optional().isDate(),
  body('statistics.*.gameType').optional().isLength({ max: 50 }),
  body('statistics.*.opponent').optional().isLength({ max: 100 }),
  body('statistics.*.setNumber').optional().isInt({ min: 1, max: 5 }),
  body('statistics.*.notes').optional().isLength({ max: 500 })
], async (req, res) => {
  const client = await pool.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { statistics } = req.body;
    
    await client.query('BEGIN');
    
    const insertedStats = [];
    const failedStats = [];

    for (let i = 0; i < statistics.length; i++) {
      const stat = statistics[i];
      
      try {
        // Verify user has access to this player
        const accessCheck = await client.query(`
          SELECT p.id FROM player p
          JOIN team_users tu ON p.team_id = tu.team_id
          WHERE p.id = $1 AND tu.user_id = $2 AND tu.role IN ('head_coach', 'assistant_coach')
        `, [stat.playerId, req.user.id]);

        if (accessCheck.rows.length === 0) {
          failedStats.push({ index: i, error: 'Access denied for player', stat });
          continue;
        }

        // If eventId is provided, get event details to auto-populate fields
        let eventDetails = null;
        if (stat.eventId) {
          const eventResult = await client.query(`
            SELECT event_date, event_type, opponent, title
            FROM schedule_events 
            WHERE id = $1
          `, [stat.eventId]);
          
          if (eventResult.rows.length > 0) {
            eventDetails = eventResult.rows[0];
          }
        }

        // Use event details if available, otherwise use provided values
        const finalStatDate = eventDetails ? eventDetails.event_date : stat.statDate;
        const finalGameType = eventDetails ? eventDetails.event_type : stat.gameType;
        const finalOpponent = eventDetails ? eventDetails.opponent : stat.opponent;

        // Validate that we have required date field
        if (!finalStatDate) {
          failedStats.push({ index: i, error: 'statDate is required when eventId is not provided', stat });
          continue;
        }

        const result = await client.query(`
          INSERT INTO player_statistics 
          (player_id, stat_category, stat_name, stat_value, stat_date, game_type, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [stat.playerId, stat.statCategory, stat.statName, stat.statValue, finalStatDate, finalGameType, stat.notes]);

        insertedStats.push(result.rows[0]);
      } catch (error) {
        failedStats.push({ index: i, error: error.message, stat });
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: `Bulk player statistics operation completed`,
      inserted: insertedStats.length,
      failed: failedStats.length,
      insertedStats,
      failedStats
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in bulk player statistics:', error);
    res.status(500).json({ error: 'Failed to add bulk player statistics' });
  } finally {
    client.release();
  }
});

// Add multiple team statistics at once
router.post('/team/bulk', authMiddleware, [
  body('statistics').isArray({ min: 1 }),
  body('statistics.*.teamId').isInt({ min: 1 }),
  body('statistics.*.statCategory').isLength({ min: 1, max: 50 }),
  body('statistics.*.statName').isLength({ min: 1, max: 100 }),
  body('statistics.*.statValue').isNumeric(),
  body('statistics.*.eventId').optional().isInt({ min: 1 }),
  body('statistics.*.statDate').optional().isDate(),
  body('statistics.*.gameType').optional().isLength({ max: 50 }),
  body('statistics.*.opponent').optional().isLength({ max: 255 }),
  body('statistics.*.notes').optional().isLength({ max: 500 })
], async (req, res) => {
  const client = await pool.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { statistics } = req.body;
    
    await client.query('BEGIN');
    
    const insertedStats = [];
    const failedStats = [];

    for (let i = 0; i < statistics.length; i++) {
      const stat = statistics[i];
      
      try {
        // Verify user has access to this team
        const accessCheck = await client.query(`
          SELECT tu.role FROM team_users tu
          WHERE tu.team_id = $1 AND tu.user_id = $2 AND tu.role IN ('head_coach', 'assistant_coach')
        `, [stat.teamId, req.user.id]);

        if (accessCheck.rows.length === 0) {
          failedStats.push({ index: i, error: 'Access denied for team', stat });
          continue;
        }

        // If eventId is provided, get event details to auto-populate fields
        let eventDetails = null;
        if (stat.eventId) {
          const eventResult = await client.query(`
            SELECT event_date, event_type, opponent, title
            FROM schedule_events 
            WHERE id = $1
          `, [stat.eventId]);
          
          if (eventResult.rows.length > 0) {
            eventDetails = eventResult.rows[0];
          }
        }

        // Use event details if available, otherwise use provided values
        const finalStatDate = eventDetails ? eventDetails.event_date : stat.statDate;
        const finalGameType = eventDetails ? eventDetails.event_type : stat.gameType;
        const finalOpponent = eventDetails ? eventDetails.opponent : stat.opponent;

        // Validate that we have required date field
        if (!finalStatDate) {
          failedStats.push({ index: i, error: 'statDate is required when eventId is not provided', stat });
          continue;
        }

        const result = await client.query(`
          INSERT INTO team_statistics 
          (team_id, stat_category, stat_name, stat_value, stat_date, game_type, opponent, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [stat.teamId, stat.statCategory, stat.statName, stat.statValue, finalStatDate, finalGameType, finalOpponent, stat.notes]);

        insertedStats.push(result.rows[0]);
      } catch (error) {
        failedStats.push({ index: i, error: error.message, stat });
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: `Bulk team statistics operation completed`,
      inserted: insertedStats.length,
      failed: failedStats.length,
      insertedStats,
      failedStats
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in bulk team statistics:', error);
    res.status(500).json({ error: 'Failed to add bulk team statistics' });
  } finally {
    client.release();
  }
});

// Import statistics from CSV/Excel
router.post('/import', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { type, targetId } = req.body; // 'player' or 'team'
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!['player', 'team'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be "player" or "team"' });
    }

    // Verify access based on type
    if (type === 'player') {
      const accessCheck = await pool.query(`
        SELECT p.id FROM player p
        JOIN team_users tu ON p.team_id = tu.team_id
        WHERE p.id = $1 AND tu.user_id = $2 AND tu.role IN ('head_coach', 'assistant_coach')
      `, [targetId, req.user.id]);

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else {
      const accessCheck = await pool.query(`
        SELECT tu.role FROM team_users tu
        WHERE tu.team_id = $1 AND tu.user_id = $2 AND tu.role IN ('head_coach', 'assistant_coach')
      `, [targetId, req.user.id]);

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    let data = [];
    
    try {
      if (fileExtension === '.csv') {
        // Parse CSV
        data = await new Promise((resolve, reject) => {
          const results = [];
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => results.push(row))
            .on('end', () => resolve(results))
            .on('error', reject);
        });
      } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        // Parse Excel
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      } else {
        return res.status(400).json({ error: 'Unsupported file format. Use CSV or Excel files.' });
      }

      // Validate and process data
      const validData = data.filter(row => {
        return row.stat_category && row.stat_name && 
               row.stat_value !== undefined && row.stat_date;
      });

      if (validData.length === 0) {
        return res.status(400).json({ error: 'No valid data found in file' });
      }

      // Process and insert data
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const insertPromises = validData.map(row => {
          if (type === 'player') {
            return client.query(`
              INSERT INTO player_statistics 
              (player_id, stat_category, stat_name, stat_value, stat_date, game_type, opponent, set_number, notes)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
              targetId, 
              row.stat_category, 
              row.stat_name, 
              parseFloat(row.stat_value), 
              row.stat_date,
              row.game_type || null,
              row.opponent || null,
              row.set_number ? parseInt(row.set_number) : null,
              row.notes || null
            ]);
          } else {
            return client.query(`
              INSERT INTO team_statistics 
              (team_id, stat_category, stat_name, stat_value, stat_date, game_type, opponent, notes)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
              targetId,
              row.stat_category,
              row.stat_name,
              parseFloat(row.stat_value),
              row.stat_date,
              row.game_type || null,
              row.opponent || null,
              row.notes || null
            ]);
          }
        });

        await Promise.all(insertPromises);
        await client.query('COMMIT');

        res.json({ 
          message: `Successfully imported ${validData.length} statistics`,
          imported: validData.length,
          skipped: data.length - validData.length
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } finally {
      // Clean up temp file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.error('Error importing statistics:', error);
    res.status(500).json({ error: 'Failed to import statistics' });
  }
});

// Get available statistics categories
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const categories = [
      {
        name: 'offense',
        label: 'Offensive',
        stats: [
          { name: 'kills', label: 'Kills' },
          { name: 'attacks', label: 'Attacks' },
          { name: 'attack_errors', label: 'Attack Errors' },
          { name: 'hitting_percentage', label: 'Hitting Percentage' }
        ]
      },
      {
        name: 'serving',
        label: 'Serving',
        stats: [
          { name: 'aces', label: 'Aces' },
          { name: 'service_errors', label: 'Service Errors' },
          { name: 'total_serves', label: 'Total Serves' },
          { name: 'service_percentage', label: 'Service Percentage' }
        ]
      },
      {
        name: 'defense',
        label: 'Defensive',
        stats: [
          { name: 'digs', label: 'Digs' },
          { name: 'reception_errors', label: 'Reception Errors' },
          { name: 'total_receptions', label: 'Total Receptions' },
          { name: 'reception_percentage', label: 'Reception Percentage' }
        ]
      },
      {
        name: 'blocking',
        label: 'Blocking',
        stats: [
          { name: 'block_solos', label: 'Block Solos' },
          { name: 'block_assists', label: 'Block Assists' },
          { name: 'block_errors', label: 'Block Errors' },
          { name: 'total_blocks', label: 'Total Blocks' }
        ]
      },
      {
        name: 'setting',
        label: 'Setting',
        stats: [
          { name: 'assists', label: 'Assists' },
          { name: 'setting_errors', label: 'Setting Errors' },
          { name: 'total_sets', label: 'Total Sets' },
          { name: 'setting_percentage', label: 'Setting Percentage' }
        ]
      }
    ];

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Delete a statistic
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // First, find the statistic to check permissions
    const statCheck = await pool.query(`
      SELECT ps.player_id, p.team_id 
      FROM player_statistics ps
      JOIN player p ON ps.player_id = p.id
      WHERE ps.id = $1
      UNION
      SELECT NULL as player_id, ts.team_id
      FROM team_statistics ts
      WHERE ts.id = $1
    `, [id]);

    if (statCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Statistic not found' });
    }

    const teamId = statCheck.rows[0].team_id;

    // Verify user has access to this team
    const accessCheck = await pool.query(`
      SELECT tu.role FROM team_users tu
      WHERE tu.team_id = $1 AND tu.user_id = $2
    `, [teamId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete from player_statistics first
    let result = await pool.query('DELETE FROM player_statistics WHERE id = $1', [id]);
    
    // If not found in player_statistics, try team_statistics
    if (result.rowCount === 0) {
      result = await pool.query('DELETE FROM team_statistics WHERE id = $1', [id]);
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Statistic not found' });
    }

    res.json({ message: 'Statistic deleted successfully' });
  } catch (error) {
    console.error('Error deleting statistic:', error);
    res.status(500).json({ error: 'Failed to delete statistic' });
  }
});

// Export statistics to CSV
router.get('/export/csv', authMiddleware, async (req, res) => {
  try {
    const { teamId, playerId, startDate, endDate, category } = req.query;

    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    // Verify user has access to this team
    const accessCheck = await pool.query(`
      SELECT tu.role FROM team_users tu
      WHERE tu.team_id = $1 AND tu.user_id = $2
    `, [teamId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = '';
    let params = [];
    let paramCount = 0;

    if (playerId) {
      // Export player statistics
      query = `
        SELECT 
          ps.id,
          p.first_name,
          p.last_name,
          p.jersey_number,
          ps.stat_category,
          ps.stat_name,
          ps.stat_value,
          ps.stat_date,
          ps.game_type,
          ps.opponent,
          ps.set_number,
          ps.notes,
          ps.created_at
        FROM player_statistics ps
        JOIN player p ON ps.player_id = p.id
        WHERE p.team_id = $${++paramCount}
      `;
      params.push(teamId);

      if (playerId !== 'all') {
        query += ` AND ps.player_id = $${++paramCount}`;
        params.push(playerId);
      }
    } else {
      // Export team statistics
      query = `
        SELECT 
          ts.id,
          ts.stat_category,
          ts.stat_name,
          ts.stat_value,
          ts.stat_date,
          ts.game_type,
          ts.opponent,
          ts.set_number,
          ts.notes,
          ts.created_at
        FROM team_statistics ts
        WHERE ts.team_id = $${++paramCount}
      `;
      params.push(teamId);
    }

    // Add filters
    if (category) {
      query += ` AND stat_category = $${++paramCount}`;
      params.push(category);
    }

    if (startDate) {
      query += ` AND stat_date >= $${++paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND stat_date <= $${++paramCount}`;
      params.push(endDate);
    }

    query += ` ORDER BY stat_date DESC, stat_category, stat_name`;

    const result = await pool.query(query, params);

    // Convert to CSV format
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data found to export' });
    }

    const csvHeaders = Object.keys(result.rows[0]).join(',');
    const csvRows = result.rows.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );

    const csvContent = [csvHeaders, ...csvRows].join('\n');

    const filename = `statistics_export_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting statistics to CSV:', error);
    res.status(500).json({ error: 'Failed to export statistics' });
  }
});

// Export statistics to Excel
router.get('/export/excel', authMiddleware, async (req, res) => {
  try {
    const { teamId, playerId, startDate, endDate, category } = req.query;

    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    // Verify user has access to this team
    const accessCheck = await pool.query(`
      SELECT tu.role FROM team_users tu
      WHERE tu.team_id = $1 AND tu.user_id = $2
    `, [teamId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = '';
    let params = [];
    let paramCount = 0;

    if (playerId) {
      // Export player statistics
      query = `
        SELECT 
          ps.id,
          p.first_name,
          p.last_name,
          p.jersey_number,
          ps.stat_category,
          ps.stat_name,
          ps.stat_value,
          ps.stat_date,
          ps.game_type,
          ps.opponent,
          ps.set_number,
          ps.notes,
          ps.created_at
        FROM player_statistics ps
        JOIN player p ON ps.player_id = p.id
        WHERE p.team_id = $${++paramCount}
      `;
      params.push(teamId);

      if (playerId !== 'all') {
        query += ` AND ps.player_id = $${++paramCount}`;
        params.push(playerId);
      }
    } else {
      // Export team statistics
      query = `
        SELECT 
          ts.id,
          ts.stat_category,
          ts.stat_name,
          ts.stat_value,
          ts.stat_date,
          ts.game_type,
          ts.opponent,
          ts.set_number,
          ts.notes,
          ts.created_at
        FROM team_statistics ts
        WHERE ts.team_id = $${++paramCount}
      `;
      params.push(teamId);
    }

    // Add filters
    if (category) {
      query += ` AND stat_category = $${++paramCount}`;
      params.push(category);
    }

    if (startDate) {
      query += ` AND stat_date >= $${++paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND stat_date <= $${++paramCount}`;
      params.push(endDate);
    }

    query += ` ORDER BY stat_date DESC, stat_category, stat_name`;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data found to export' });
    }

    // Create Excel workbook
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(result.rows);
    
    // Add worksheet to workbook
    const sheetName = playerId ? 'Player Statistics' : 'Team Statistics';
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel file buffer
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const filename = `statistics_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);

  } catch (error) {
    console.error('Error exporting statistics to Excel:', error);
    res.status(500).json({ error: 'Failed to export statistics' });
  }
});

// Get statistical analysis report
router.get('/analysis/:teamId', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { playerId, startDate, endDate, category } = req.query;

    // Verify user has access to this team
    const accessCheck = await pool.query(`
      SELECT tu.role FROM team_users tu
      WHERE tu.team_id = $1 AND tu.user_id = $2
    `, [teamId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let analysis = {
      summary: {},
      trends: [],
      topPerformers: [],
      categoryAnalysis: [],
      insights: []
    };

    // Build base query conditions
    let baseConditions = `p.team_id = $1`; // For JOIN queries
    let playerStatsConditions = `player_id IN (SELECT id FROM player WHERE team_id = $1)`; // For player_statistics only queries
    let params = [teamId];
    let paramCount = 1;

    if (playerId) {
      baseConditions += ` AND ps.player_id = $${++paramCount}`;
      playerStatsConditions += ` AND player_id = $${++paramCount}`;
      params.push(playerId);
    }

    if (startDate) {
      baseConditions += ` AND ps.stat_date >= $${++paramCount}`;
      playerStatsConditions += ` AND stat_date >= $${++paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      baseConditions += ` AND ps.stat_date <= $${++paramCount}`;
      playerStatsConditions += ` AND stat_date <= $${++paramCount}`;
      params.push(endDate);
    }

    if (category) {
      baseConditions += ` AND ps.stat_category = $${++paramCount}`;
      playerStatsConditions += ` AND stat_category = $${++paramCount}`;
      params.push(category);
    }

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT stat_category) as categories_count,
        COUNT(DISTINCT stat_name) as stats_count,
        COUNT(DISTINCT player_id) as players_count,
        MIN(stat_date) as earliest_date,
        MAX(stat_date) as latest_date
      FROM player_statistics
      WHERE ${playerStatsConditions}
    `;

    const summaryResult = await pool.query(summaryQuery, params);
    analysis.summary = summaryResult.rows[0];

    // Get category analysis
    const categoryQuery = `
      SELECT 
        stat_category,
        COUNT(*) as record_count,
        AVG(stat_value) as average_value,
        MAX(stat_value) as max_value,
        MIN(stat_value) as min_value,
        STDDEV(stat_value) as std_deviation
      FROM player_statistics
      WHERE ${playerStatsConditions}
      GROUP BY stat_category
      ORDER BY record_count DESC
    `;

    const categoryResult = await pool.query(categoryQuery, params);
    analysis.categoryAnalysis = categoryResult.rows;

    // Get top performers (if not filtered by player)
    if (!playerId) {
      const topPerformersQuery = `
        SELECT 
          p.first_name,
          p.last_name,
          p.jersey_number,
          ps.stat_category,
          ps.stat_name,
          MAX(ps.stat_value) as best_value,
          AVG(ps.stat_value) as avg_value,
          COUNT(*) as record_count
        FROM player_statistics ps
        JOIN player p ON ps.player_id = p.id
        WHERE ${baseConditions}
        GROUP BY p.first_name, p.last_name, p.jersey_number, ps.stat_category, ps.stat_name
        HAVING COUNT(*) >= 3
        ORDER BY best_value DESC
        LIMIT 20
      `;

      const topPerformersResult = await pool.query(topPerformersQuery, params);
      analysis.topPerformers = topPerformersResult.rows;
    }

    // Get trends (last 30 days vs previous 30 days)
    const trendsQuery = `
      SELECT 
        stat_category,
        stat_name,
        AVG(CASE WHEN stat_date >= CURRENT_DATE - INTERVAL '30 days' THEN stat_value END) as recent_avg,
        AVG(CASE WHEN stat_date >= CURRENT_DATE - INTERVAL '60 days' AND stat_date < CURRENT_DATE - INTERVAL '30 days' THEN stat_value END) as previous_avg,
        COUNT(CASE WHEN stat_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_count,
        COUNT(CASE WHEN stat_date >= CURRENT_DATE - INTERVAL '60 days' AND stat_date < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as previous_count
      FROM player_statistics
      WHERE ${playerStatsConditions} AND stat_date >= CURRENT_DATE - INTERVAL '60 days'
      GROUP BY stat_category, stat_name
      HAVING COUNT(*) >= 5
      ORDER BY stat_category, stat_name
    `;

    const trendsResult = await pool.query(trendsQuery, params);
    analysis.trends = trendsResult.rows.map(row => ({
      ...row,
      trend_direction: row.recent_avg > row.previous_avg ? 'improving' : 'declining',
      change_percentage: row.previous_avg ? ((row.recent_avg - row.previous_avg) / row.previous_avg * 100).toFixed(2) : null
    }));

    // Generate insights
    analysis.insights = [];
    
    if (analysis.categoryAnalysis.length > 0) {
      const mostActiveCategory = analysis.categoryAnalysis[0];
      analysis.insights.push({
        type: 'category',
        message: `Most recorded category: ${mostActiveCategory.stat_category} with ${mostActiveCategory.record_count} records`
      });
    }

    if (analysis.trends.length > 0) {
      const improvingTrends = analysis.trends.filter(t => t.trend_direction === 'improving').length;
      const decliningTrends = analysis.trends.filter(t => t.trend_direction === 'declining').length;
      
      if (improvingTrends > decliningTrends) {
        analysis.insights.push({
          type: 'trend',
          message: `Positive trend: ${improvingTrends} statistics showing improvement vs ${decliningTrends} declining`
        });
      } else if (decliningTrends > improvingTrends) {
        analysis.insights.push({
          type: 'trend',
          message: `Areas for focus: ${decliningTrends} statistics declining vs ${improvingTrends} improving`
        });
      }
    }

    res.json(analysis);

  } catch (error) {
    console.error('Error generating statistical analysis:', error);
    res.status(500).json({ error: 'Failed to generate analysis' });
  }
});

module.exports = router;
