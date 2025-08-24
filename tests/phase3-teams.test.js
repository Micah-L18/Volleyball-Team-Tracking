const request = require('supertest');

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3003';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'coach_app';
process.env.DB_USER = 'coach_app_user';
process.env.DB_PASSWORD = 'your_secure_password';
process.env.JWT_SECRET = 'your_super_secret_jwt_key_minimum_32_characters_long_for_security';
process.env.CORS_ORIGIN = 'http://localhost:4200';

const app = require('../server/index');

describe('Phase 3: Team Management System Tests', () => {
  let headCoachToken;
  let playerToken;
  let teamId;
  let headCoachId;
  let playerId;

  beforeAll(async () => {
    // Register and login head coach
    const headCoachRegister = await request(app)
      .post('/api/auth/register')
      .send({
        first_name: 'Head',
        last_name: 'Coach',
        email: 'head.coach@test.com',
        password: 'password123',
        role: 'head_coach'
      });

    headCoachToken = headCoachRegister.body.token;
    headCoachId = headCoachRegister.body.user.id;

    // Register and login player
    const playerRegister = await request(app)
      .post('/api/auth/register')
      .send({
        first_name: 'Test',
        last_name: 'Player',
        email: 'test.player@test.com',
        password: 'password123',
        role: 'player'
      });

    playerToken = playerRegister.body.token;
    playerId = playerRegister.body.user.id;
  });

  describe('POST /api/teams', () => {
    test('Should create a new team', async () => {
      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${headCoachToken}`)
        .send({
          name: 'Test Volleyball Team',
          description: 'A team for testing',
          season: 'Fall 2024',
          age_group: 'U18'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Team created successfully');
      expect(response.body.team.name).toBe('Test Volleyball Team');
      expect(response.body.team.role).toBe('head_coach');

      teamId = response.body.team.id;
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .post('/api/teams')
        .send({
          name: 'Unauthorized Team',
          season: 'Fall 2024'
        });

      expect(response.status).toBe(401);
    });

    test('Should validate required fields', async () => {
      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${headCoachToken}`)
        .send({
          description: 'Missing name and season'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Team name and season are required');
    });
  });

  describe('GET /api/teams', () => {
    test('Should get user teams', async () => {
      const response = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${headCoachToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name).toBe('Test Volleyball Team');
      expect(response.body[0].role).toBe('head_coach');
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .get('/api/teams');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/teams/:id', () => {
    test('Should get team details for team member', async () => {
      const response = await request(app)
        .get(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${headCoachToken}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Volleyball Team');
      expect(response.body.userRole).toBe('head_coach');
      expect(Array.isArray(response.body.members)).toBe(true);
      expect(response.body.members.length).toBe(1); // Only head coach initially
    });

    test('Should deny access to non-members', async () => {
      const response = await request(app)
        .get(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('not a member');
    });
  });

  describe('POST /api/teams/:id/invite', () => {
    test('Should invite user to team', async () => {
      const response = await request(app)
        .post(`/api/teams/${teamId}/invite`)
        .set('Authorization', `Bearer ${headCoachToken}`)
        .send({
          email: 'test.player@test.com',
          role: 'player'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User invited successfully');
      expect(response.body.member.email).toBe('test.player@test.com');
      expect(response.body.member.role).toBe('player');
    });

    test('Should prevent duplicate invitations', async () => {
      const response = await request(app)
        .post(`/api/teams/${teamId}/invite`)
        .set('Authorization', `Bearer ${headCoachToken}`)
        .send({
          email: 'test.player@test.com',
          role: 'player'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already a member');
    });

    test('Should require valid role', async () => {
      const response = await request(app)
        .post(`/api/teams/${teamId}/invite`)
        .set('Authorization', `Bearer ${headCoachToken}`)
        .send({
          email: 'test.player@test.com',
          role: 'invalid_role'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid role');
    });

    test('Should deny access to non-coaches', async () => {
      const response = await request(app)
        .post(`/api/teams/${teamId}/invite`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          email: 'another@test.com',
          role: 'player'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Only coaches can invite');
    });
  });

  describe('PUT /api/teams/:id', () => {
    test('Should update team information', async () => {
      const response = await request(app)
        .put(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${headCoachToken}`)
        .send({
          name: 'Updated Volleyball Team',
          description: 'Updated description',
          season: 'Spring 2025',
          age_group: 'U16'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Team updated successfully');
      expect(response.body.team.name).toBe('Updated Volleyball Team');
    });

    test('Should deny access to non-coaches', async () => {
      const response = await request(app)
        .put(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          name: 'Unauthorized Update'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Only coaches can update');
    });
  });

  describe('PUT /api/teams/:id/members/:userId/role', () => {
    test('Should update member role', async () => {
      const response = await request(app)
        .put(`/api/teams/${teamId}/members/${playerId}/role`)
        .set('Authorization', `Bearer ${headCoachToken}`)
        .send({
          role: 'assistant_coach'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Member role updated successfully');
    });

    test('Should deny access to non-head-coaches', async () => {
      const response = await request(app)
        .put(`/api/teams/${teamId}/members/${playerId}/role`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          role: 'player'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Only head coaches can change');
    });
  });

  describe('DELETE /api/teams/:id/members/:userId', () => {
    test('Should deny removing head coach', async () => {
      const response = await request(app)
        .delete(`/api/teams/${teamId}/members/${headCoachId}`)
        .set('Authorization', `Bearer ${headCoachToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('cannot remove themselves');
    });

    test('Should remove team member', async () => {
      const response = await request(app)
        .delete(`/api/teams/${teamId}/members/${playerId}`)
        .set('Authorization', `Bearer ${headCoachToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Team member removed successfully');
    });

    test('Should deny access to non-head-coaches', async () => {
      const response = await request(app)
        .delete(`/api/teams/${teamId}/members/${headCoachId}`)
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Only head coaches can remove');
    });
  });

  describe('Team Role Permissions', () => {
    test('Should verify proper role hierarchy', async () => {
      // Head coach should be able to access team details
      const headCoachAccess = await request(app)
        .get(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${headCoachToken}`);

      expect(headCoachAccess.status).toBe(200);
      expect(headCoachAccess.body.userRole).toBe('head_coach');
    });

    test('Should show team in user teams list', async () => {
      const response = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${headCoachToken}`);

      expect(response.status).toBe(200);
      const userTeam = response.body.find(team => team.id === teamId);
      expect(userTeam).toBeDefined();
      expect(userTeam.name).toBe('Updated Volleyball Team');
    });
  });
});
