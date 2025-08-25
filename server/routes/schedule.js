const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Helper function to create recurring events
async function createRecurringEvents(parentEvent, recurrenceConfig) {
  const { recurrence_type, recurrence_interval, recurrence_end_date, recurrence_days_of_week } = recurrenceConfig;
  const startDate = new Date(parentEvent.event_date);
  const endDate = new Date(recurrence_end_date);
  
  let currentDate = new Date(startDate);
  const recurringEvents = [];

  while (currentDate <= endDate) {
    // Calculate next date based on recurrence type
    switch (recurrence_type) {
      case 'weekly':
        if (recurrence_days_of_week && recurrence_days_of_week.length > 0) {
          // For specific days of the week
          for (const dayOfWeek of recurrence_days_of_week) {
            const nextDate = new Date(currentDate);
            const currentDay = nextDate.getDay();
            const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
            nextDate.setDate(nextDate.getDate() + daysUntilTarget);
            
            if (nextDate > startDate && nextDate <= endDate) {
              recurringEvents.push(createEventForDate(parentEvent, nextDate));
            }
          }
        }
        currentDate.setDate(currentDate.getDate() + 7 * recurrence_interval);
        break;
      
      case 'biweekly':
        if (recurrence_days_of_week && recurrence_days_of_week.length > 0) {
          for (const dayOfWeek of recurrence_days_of_week) {
            const nextDate = new Date(currentDate);
            const currentDay = nextDate.getDay();
            const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
            nextDate.setDate(nextDate.getDate() + daysUntilTarget);
            
            if (nextDate > startDate && nextDate <= endDate) {
              recurringEvents.push(createEventForDate(parentEvent, nextDate));
            }
          }
        }
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + recurrence_interval);
        if (currentDate > startDate && currentDate <= endDate) {
          recurringEvents.push(createEventForDate(parentEvent, currentDate));
        }
        break;
      
      default:
        return;
    }
  }

  // Insert all recurring events
  if (recurringEvents.length > 0) {
    for (const eventData of recurringEvents) {
      await pool.query(`
        INSERT INTO schedule_events (
          team_id, event_type, title, description, event_date, end_date,
          start_time, end_time, location, opponent, parent_event_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, eventData);
    }
  }
}

function createEventForDate(parentEvent, date) {
  const dateString = date.toISOString().split('T')[0];
  let endDateString = null;
  
  if (parentEvent.end_date) {
    const originalStart = new Date(parentEvent.event_date);
    const originalEnd = new Date(parentEvent.end_date);
    const daysDiff = Math.floor((originalEnd - originalStart) / (1000 * 60 * 60 * 24));
    const newEndDate = new Date(date);
    newEndDate.setDate(newEndDate.getDate() + daysDiff);
    endDateString = newEndDate.toISOString().split('T')[0];
  }

  return [
    parentEvent.team_id,
    parentEvent.event_type,
    parentEvent.title,
    parentEvent.description,
    dateString,
    endDateString,
    parentEvent.start_time,
    parentEvent.end_time,
    parentEvent.location,
    parentEvent.opponent,
    parentEvent.id
  ];
}

// Get team schedule
router.get('/team/:teamId', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;

    // Verify team access - updated to use correct user authentication
    const teamCheck = await pool.query(`
      SELECT t.id FROM team t
      JOIN team_users tu ON t.id = tu.team_id
      WHERE t.id = $1 AND tu.user_id = $2 AND tu.role IN ('head_coach', 'assistant_coach', 'player', 'viewer')
    `, [teamId, req.user.id]);

    if (teamCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this team' });
    }

    const result = await pool.query(
      'SELECT * FROM schedule_events WHERE team_id = $1 ORDER BY event_date, start_time',
      [teamId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// Get single schedule event
router.get('/:eventId', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get event and verify team access
    const result = await pool.query(`
      SELECT se.*, t.name as team_name FROM schedule_events se
      JOIN team t ON se.team_id = t.id
      JOIN team_users tu ON t.id = tu.team_id
      WHERE se.id = $1 AND tu.user_id = $2
    `, [eventId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found or access denied' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create schedule event
router.post('/', authMiddleware, [
  body('team_id').isInt({ min: 1 }),
  body('event_type').isIn(['Practice', 'Scrimmage', 'Game', 'Tournament']),
  body('title').trim().isLength({ min: 1, max: 100 }),
  body('event_date').isISO8601().toDate(),
  body('end_date').optional().isISO8601().toDate(),
  body('start_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('end_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('location').optional().trim().isLength({ max: 200 }),
  body('opponent').optional().trim().isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('recurrence_type').optional().isIn(['weekly', 'biweekly', 'monthly']),
  body('recurrence_interval').optional().isInt({ min: 1, max: 52 }),
  body('recurrence_end_date').optional().isISO8601().toDate(),
  body('recurrence_days_of_week').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
      team_id, event_type, title, description, event_date, end_date,
      start_time, end_time, location, opponent, recurrence_type,
      recurrence_interval, recurrence_end_date, recurrence_days_of_week
    } = req.body;

    // Verify team access and coach permissions
    const teamCheck = await pool.query(`
      SELECT t.id FROM team t
      JOIN team_users tu ON t.id = tu.team_id
      WHERE t.id = $1 AND tu.user_id = $2 AND tu.role IN ('head_coach', 'assistant_coach')
    `, [team_id, req.user.id]);

    if (teamCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied - only coaches can create events' });
    }

    const result = await pool.query(`
      INSERT INTO schedule_events (
        team_id, event_type, title, description, event_date, end_date,
        start_time, end_time, location, opponent, recurrence_type,
        recurrence_interval, recurrence_end_date, recurrence_days_of_week
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [team_id, event_type, title, description, event_date, end_date,
        start_time, end_time, location, opponent, recurrence_type,
        recurrence_interval, recurrence_end_date, recurrence_days_of_week]);

    // If this is a recurring event, create the recurring instances
    if (recurrence_type && recurrence_end_date) {
      await createRecurringEvents(result.rows[0], {
        recurrence_type,
        recurrence_interval: recurrence_interval || 1,
        recurrence_end_date,
        recurrence_days_of_week
      });
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating schedule event:', error);
    res.status(500).json({ error: 'Failed to create schedule event' });
  }
});

// Update schedule event
router.put('/:eventId', authMiddleware, [
  body('event_type').optional().isIn(['Practice', 'Scrimmage', 'Game', 'Tournament']),
  body('title').optional().trim().isLength({ min: 1, max: 100 }),
  body('event_date').optional().isISO8601().toDate(),
  body('end_date').optional().isISO8601().toDate(),
  body('start_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('end_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('location').optional().trim().isLength({ max: 200 }),
  body('opponent').optional().trim().isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('recurrence_type').optional().isIn(['daily', 'weekly', 'biweekly', 'monthly']),
  body('recurrence_interval').optional().isInt({ min: 1, max: 30 }),
  body('recurrence_end_date').optional().isISO8601().toDate(),
  body('recurrence_days_of_week').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { eventId } = req.params;
    const {
      event_type, title, description, event_date, end_date,
      start_time, end_time, location, opponent,
      recurrence_type, recurrence_interval, recurrence_end_date, recurrence_days_of_week
    } = req.body;

    // Verify event exists and user has coach access
    const eventCheck = await pool.query(`
      SELECT se.id FROM schedule_events se
      JOIN team t ON se.team_id = t.id
      JOIN team_users tu ON t.id = tu.team_id
      WHERE se.id = $1 AND tu.user_id = $2 AND tu.role IN ('head_coach', 'assistant_coach')
    `, [eventId, req.user.id]);

    if (eventCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Event not found or access denied' });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let valueIndex = 1;

    if (event_type !== undefined) {
      updateFields.push(`event_type = $${valueIndex++}`);
      updateValues.push(event_type);
    }
    if (title !== undefined) {
      updateFields.push(`title = $${valueIndex++}`);
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${valueIndex++}`);
      updateValues.push(description);
    }
    if (event_date !== undefined) {
      updateFields.push(`event_date = $${valueIndex++}`);
      updateValues.push(event_date);
    }
    if (end_date !== undefined) {
      updateFields.push(`end_date = $${valueIndex++}`);
      updateValues.push(end_date);
    }
    if (start_time !== undefined) {
      updateFields.push(`start_time = $${valueIndex++}`);
      updateValues.push(start_time);
    }
    if (end_time !== undefined) {
      updateFields.push(`end_time = $${valueIndex++}`);
      updateValues.push(end_time);
    }
    if (location !== undefined) {
      updateFields.push(`location = $${valueIndex++}`);
      updateValues.push(location);
    }
    if (opponent !== undefined) {
      updateFields.push(`opponent = $${valueIndex++}`);
      updateValues.push(opponent);
    }
    if (recurrence_type !== undefined) {
      updateFields.push(`recurrence_type = $${valueIndex++}`);
      updateValues.push(recurrence_type);
    }
    if (recurrence_interval !== undefined) {
      updateFields.push(`recurrence_interval = $${valueIndex++}`);
      updateValues.push(recurrence_interval);
    }
    if (recurrence_end_date !== undefined) {
      updateFields.push(`recurrence_end_date = $${valueIndex++}`);
      updateValues.push(recurrence_end_date);
    }
    if (recurrence_days_of_week !== undefined) {
      updateFields.push(`recurrence_days_of_week = $${valueIndex++}`);
      updateValues.push(JSON.stringify(recurrence_days_of_week));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(eventId);

    const result = await pool.query(`
      UPDATE schedule_events 
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `, updateValues);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating schedule event:', error);
    res.status(500).json({ error: 'Failed to update schedule event' });
  }
});

// Delete schedule event
router.delete('/:eventId', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify event exists and user has coach access
    const eventCheck = await pool.query(`
      SELECT se.id FROM schedule_events se
      JOIN team t ON se.team_id = t.id
      JOIN team_users tu ON t.id = tu.team_id
      WHERE se.id = $1 AND tu.user_id = $2 AND tu.role IN ('head_coach', 'assistant_coach')
    `, [eventId, req.user.id]);

    if (eventCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Event not found or access denied' });
    }

    await pool.query('DELETE FROM schedule_events WHERE id = $1', [eventId]);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule event:', error);
    res.status(500).json({ error: 'Failed to delete schedule event' });
  }
});

// Get upcoming events for team (next 30 days)
router.get('/team/:teamId/upcoming', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { limit = 10 } = req.query;

    // Verify team access
    const teamCheck = await pool.query(`
      SELECT t.id FROM team t
      JOIN team_users tu ON t.id = tu.team_id
      WHERE t.id = $1 AND tu.user_id = $2
    `, [teamId, req.user.id]);

    if (teamCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this team' });
    }

    const result = await pool.query(`
      SELECT * FROM schedule_events 
      WHERE team_id = $1 
        AND event_date >= CURRENT_DATE 
        AND event_date <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY event_date, start_time
      LIMIT $2
    `, [teamId, parseInt(limit)]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

module.exports = router;
