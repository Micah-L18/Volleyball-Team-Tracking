const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

// Get all teams for the authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log(`${new Date().toISOString()} - GET /api/teams`);
    
    const query = `
      SELECT t.*, tu.role, tu.joined_date
      FROM team t
      JOIN team_users tu ON t.id = tu.team_id
      WHERE tu.user_id = $1
      ORDER BY t.name ASC
    `;
    
    const result = await pool.query(query, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new team (only head coaches can create teams)
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log(`${new Date().toISOString()} - POST /api/teams`);
    
    const { name, description, season, age_group } = req.body;
    
    // Validation
    if (!name || !season) {
      return res.status(400).json({ error: 'Team name and season are required' });
    }
    
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create the team
      const teamResult = await client.query(
        'INSERT INTO team (name, description, season, age_group, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, description, season, age_group, req.user.id]
      );
      
      const team = teamResult.rows[0];
      
      // Add the creator as head coach
      await client.query(
        'INSERT INTO team_users (team_id, user_id, role, joined_date) VALUES ($1, $2, $3, NOW())',
        [team.id, req.user.id, 'head_coach']
      );
      
      await client.query('COMMIT');
      
      res.status(201).json({
        message: 'Team created successfully',
        team: {
          ...team,
          role: 'head_coach',
          joined_date: new Date()
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific team details (only for team members)
router.get('/:teamId', authMiddleware, async (req, res) => {
  try {
    console.log(`${new Date().toISOString()} - GET /api/teams/${req.params.teamId}`);
    
    const teamId = req.params.teamId;
    
    // Check if user is a member of this team
    const memberCheck = await pool.query(
      'SELECT role FROM team_users WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this team.' });
    }
    
    // Get team details
    const teamQuery = `
      SELECT t.*, u.first_name as creator_first_name, u.last_name as creator_last_name
      FROM team t
      JOIN users u ON t.created_by = u.id
      WHERE t.id = $1
    `;
    
    const teamResult = await pool.query(teamQuery, [teamId]);
    
    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Get team members
    const membersQuery = `
      SELECT u.id, u.first_name, u.last_name, u.email, tu.role, tu.joined_date
      FROM users u
      JOIN team_users tu ON u.id = tu.user_id
      WHERE tu.team_id = $1
      ORDER BY 
        CASE tu.role
          WHEN 'head_coach' THEN 1
          WHEN 'assistant_coach' THEN 2
          WHEN 'player' THEN 3
          WHEN 'parent' THEN 4
        END,
        u.first_name ASC
    `;
    
    const membersResult = await pool.query(membersQuery, [teamId]);
    
    const team = teamResult.rows[0];
    const members = membersResult.rows;
    const userRole = memberCheck.rows[0].role;
    
    res.json({
      ...team,
      members,
      userRole
    });
    
  } catch (error) {
    console.error('Get team details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update team (only head coaches and assistant coaches)
router.put('/:teamId', authMiddleware, async (req, res) => {
  try {
    console.log(`${new Date().toISOString()} - PUT /api/teams/${req.params.teamId}`);
    
    const teamId = req.params.teamId;
    const { name, description, season, age_group } = req.body;
    
    // Check if user has permission to update team
    const memberCheck = await pool.query(
      'SELECT role FROM team_users WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this team.' });
    }
    
    const userRole = memberCheck.rows[0].role;
    if (!['head_coach', 'assistant_coach'].includes(userRole)) {
      return res.status(403).json({ error: 'Access denied. Only coaches can update team details.' });
    }
    
    // Update team
    const updateQuery = `
      UPDATE team 
      SET name = $1, description = $2, season = $3, age_group = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [name, description, season, age_group, teamId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json({
      message: 'Team updated successfully',
      team: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invite user to team (only head coaches and assistant coaches)
router.post('/:teamId/invite', authMiddleware, async (req, res) => {
  try {
    console.log(`${new Date().toISOString()} - POST /api/teams/${req.params.teamId}/invite`);
    
    const teamId = req.params.teamId;
    const { email, role } = req.body;
    
    // Validation
    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }
    
    if (!['assistant_coach', 'player', 'parent'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be assistant_coach, player, or parent' });
    }
    
    // Check if user has permission to invite
    const memberCheck = await pool.query(
      'SELECT role FROM team_users WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this team.' });
    }
    
    const userRole = memberCheck.rows[0].role;
    if (!['head_coach', 'assistant_coach'].includes(userRole)) {
      return res.status(403).json({ error: 'Access denied. Only coaches can invite team members.' });
    }
    
    // Check if invited user exists
    const userResult = await pool.query('SELECT id, first_name, last_name FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User with this email does not exist' });
    }
    
    const invitedUser = userResult.rows[0];
    
    // Check if user is already a member
    const existingMember = await pool.query(
      'SELECT id FROM team_users WHERE team_id = $1 AND user_id = $2',
      [teamId, invitedUser.id]
    );
    
    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a member of this team' });
    }
    
    // Add user to team
    await pool.query(
      'INSERT INTO team_users (team_id, user_id, role, joined_date) VALUES ($1, $2, $3, NOW())',
      [teamId, invitedUser.id, role]
    );
    
    res.status(201).json({
      message: 'User invited successfully',
      member: {
        id: invitedUser.id,
        first_name: invitedUser.first_name,
        last_name: invitedUser.last_name,
        email: email,
        role: role,
        joined_date: new Date()
      }
    });
    
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove user from team (only head coaches)
router.delete('/:teamId/members/:userId', authMiddleware, async (req, res) => {
  try {
    console.log(`${new Date().toISOString()} - DELETE /api/teams/${req.params.teamId}/members/${req.params.userId}`);
    
    const teamId = req.params.teamId;
    const userId = req.params.userId;
    
    // Check if requesting user is head coach
    const memberCheck = await pool.query(
      'SELECT role FROM team_users WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );
    
    if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'head_coach') {
      return res.status(403).json({ error: 'Access denied. Only head coaches can remove team members.' });
    }
    
    // Don't allow removing the head coach
    if (userId == req.user.id) {
      return res.status(400).json({ error: 'Head coach cannot remove themselves from the team' });
    }
    
    // Remove user from team
    const result = await pool.query(
      'DELETE FROM team_users WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    res.json({ message: 'Team member removed successfully' });
    
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update team member role (only head coaches)
router.put('/:teamId/members/:userId/role', authMiddleware, async (req, res) => {
  try {
    console.log(`${new Date().toISOString()} - PUT /api/teams/${req.params.teamId}/members/${req.params.userId}/role`);
    
    const teamId = req.params.teamId;
    const userId = req.params.userId;
    const { role } = req.body;
    
    // Validation
    if (!role || !['assistant_coach', 'player', 'parent'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be assistant_coach, player, or parent' });
    }
    
    // Check if requesting user is head coach
    const memberCheck = await pool.query(
      'SELECT role FROM team_users WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );
    
    if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'head_coach') {
      return res.status(403).json({ error: 'Access denied. Only head coaches can change member roles.' });
    }
    
    // Don't allow changing head coach role
    if (userId == req.user.id) {
      return res.status(400).json({ error: 'Head coach cannot change their own role' });
    }
    
    // Update member role
    const result = await pool.query(
      'UPDATE team_users SET role = $1 WHERE team_id = $2 AND user_id = $3',
      [role, teamId, userId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    res.json({ message: 'Member role updated successfully' });
    
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
