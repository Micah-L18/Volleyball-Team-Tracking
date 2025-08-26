const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get team members with their roles
router.get('/team/:teamId/members', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;

    // Verify user has access to this team
    const accessCheck = await pool.query(`
      SELECT role FROM team_users 
      WHERE team_id = $1 AND user_id = $2 AND status = 'accepted'
    `, [teamId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this team' });
    }

    // Get all team members with their roles and user information
    const result = await pool.query(`
      SELECT 
        tu.id,
        tu.user_id,
        tu.role,
        tu.player_id,
        tu.status,
        tu.invited_at,
        tu.accepted_at,
        u.email,
        u.first_name,
        u.last_name,
        p.first_name as player_first_name,
        p.last_name as player_last_name,
        p.jersey_number
      FROM team_users tu
      JOIN users u ON tu.user_id = u.id
      LEFT JOIN player p ON tu.player_id = p.id
      WHERE tu.team_id = $1
      ORDER BY tu.role, u.last_name, u.first_name
    `, [teamId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// Update user role in team
router.patch('/team/:teamId/member/:memberId/role', 
  authMiddleware,
  [
    body('role').isIn(['head_coach', 'assistant_coach', 'player', 'parent'])
      .withMessage('Invalid role. Must be head_coach, assistant_coach, player, or parent')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { teamId, memberId } = req.params;
      const { role, transferOwnership } = req.body;
      const userId = req.user.id;

      console.log(`🎯 ROLE UPDATE REQUEST:`);
      console.log(`  - Team ID: ${teamId}`);
      console.log(`  - Member ID: ${memberId}`);
      console.log(`  - New Role: ${role}`);
      console.log(`  - Transfer Ownership: ${transferOwnership}`);
      console.log(`  - Requesting User ID: ${userId}`);

      // Verify user has head coach access to this team
      const accessCheck = await pool.query(`
        SELECT role FROM team_users 
        WHERE team_id = $1 AND user_id = $2 AND role = 'head_coach' AND status = 'accepted'
      `, [teamId, userId]);

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Only head coaches can modify member roles' });
      }

      // Check if member exists in this team
      const memberCheck = await pool.query(`
        SELECT id, user_id, role FROM team_users 
        WHERE id = $1 AND team_id = $2
      `, [memberId, teamId]);

      if (memberCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      const currentMember = memberCheck.rows[0];

      // Handle head coach transfer
      if (role === 'head_coach' && currentMember.role !== 'head_coach') {
        // Check if this is a transfer request (should come with transferOwnership flag)
        const { transferOwnership } = req.body;
        
        if (!transferOwnership) {
          return res.status(400).json({ 
            error: 'Head coach transfer requires confirmation',
            requiresTransferConfirmation: true
          });
        }

        // Begin transaction for ownership transfer
        await pool.query('BEGIN');
        
        try {
          console.log(`🔄 Starting head coach transfer:`);
          console.log(`  - Current head coach (user ${userId}) will become assistant coach`);
          console.log(`  - Target member (id ${memberId}, user ${currentMember.user_id}) will become head coach`);

          // First, demote current user (head coach) to assistant coach
          const demoteResult = await pool.query(`
            UPDATE team_users 
            SET role = 'assistant_coach', updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND team_id = $2 AND role = 'head_coach'
            RETURNING *
          `, [userId, teamId]);
          
          console.log(`  - Demoted ${demoteResult.rowCount} head coach(s) to assistant coach`);

          // Then promote the target member to head coach
          const result = await pool.query(`
            UPDATE team_users 
            SET role = 'head_coach', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND team_id = $2
            RETURNING *
          `, [memberId, teamId]);
          
          console.log(`  - Promoted ${result.rowCount} member(s) to head coach`);

          // Update team ownership in teams table
          const ownershipResult = await pool.query(`
            UPDATE team 
            SET created_by = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
          `, [currentMember.user_id, teamId]);
          
          console.log(`  - Updated team ownership: ${ownershipResult.rowCount} team(s) updated`);

          await pool.query('COMMIT');
          console.log(`✅ Head coach transfer completed successfully`);

          res.json({
            message: 'Head coach transferred successfully',
            member: result.rows[0],
            ownershipTransferred: true
          });

        } catch (error) {
          await pool.query('ROLLBACK');
          throw error;
        }
        
        return;
      }

      // Prevent removing the last head coach (for non-transfer scenarios)
      if (currentMember.role === 'head_coach' && role !== 'head_coach') {
        const headCoachCount = await pool.query(`
          SELECT COUNT(*) as count FROM team_users 
          WHERE team_id = $1 AND role = 'head_coach' AND status = 'accepted'
        `, [teamId]);

        if (parseInt(headCoachCount.rows[0].count) <= 1) {
          return res.status(400).json({ 
            error: 'Cannot remove the last head coach. Assign another head coach first.' 
          });
        }
      }

      // Regular role update
      const result = await pool.query(`
        UPDATE team_users 
        SET role = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND team_id = $3
        RETURNING *
      `, [role, memberId, teamId]);

      res.json({
        message: 'Role updated successfully',
        member: result.rows[0]
      });

    } catch (error) {
      console.error('Error updating member role:', error);
      res.status(500).json({ error: 'Failed to update member role' });
    }
  }
);

// Remove member from team
router.delete('/team/:teamId/member/:memberId', authMiddleware, async (req, res) => {
  try {
    const { teamId, memberId } = req.params;

    // Verify user has head coach access to this team
    const accessCheck = await pool.query(`
      SELECT role FROM team_users 
      WHERE team_id = $1 AND user_id = $2 AND role = 'head_coach' AND status = 'accepted'
    `, [teamId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only head coaches can remove team members' });
    }

    // Check if member exists and get their role
    const memberCheck = await pool.query(`
      SELECT role FROM team_users 
      WHERE id = $1 AND team_id = $2
    `, [memberId, teamId]);

    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Prevent removing the last head coach
    if (memberCheck.rows[0].role === 'head_coach') {
      const headCoachCount = await pool.query(`
        SELECT COUNT(*) as count FROM team_users 
        WHERE team_id = $1 AND role = 'head_coach' AND status = 'accepted'
      `, [teamId]);

      if (parseInt(headCoachCount.rows[0].count) <= 1) {
        return res.status(400).json({ 
          error: 'Cannot remove the last head coach' 
        });
      }
    }

    // Remove the member
    await pool.query(`
      DELETE FROM team_users 
      WHERE id = $1 AND team_id = $2
    `, [memberId, teamId]);

    res.json({ message: 'Member removed successfully' });

  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

module.exports = router;
