const request = require('supertest');

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3003'; // Use different port for testing
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'coach_app';
process.env.DB_USER = 'coach_app_user';
process.env.DB_PASSWORD = 'your_secure_password';
process.env.JWT_SECRET = 'your_super_secret_jwt_key_minimum_32_characters_long_for_security';
process.env.CORS_ORIGIN = 'http://localhost:4200';

const app = require('../server/index');
const pool = require('../server/models/db');

describe('Skill Ratings API Tests', () => {
  let server;
  let authToken;
  let testCoachId;
  let testTeamId;
  let testPlayerId;
  let testSkills = [];

  beforeAll(async () => {
    // Start server
    server = app.listen(0);
    
    // Create test coach
    const coachResult = await pool.query(
      'INSERT INTO coach (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id',
      ['testcoach@test.com', 'hashedpassword', 'Test', 'Coach']
    );
    testCoachId = coachResult.rows[0].id;
    
    // Mock auth token (normally would come from login)
    authToken = 'valid-test-token';
    
    // Create test team
    const teamResult = await pool.query(
      'INSERT INTO team (name, description, season, coach_id) VALUES ($1, $2, $3, $4) RETURNING id',
      ['Test Team', 'Test Description', '2025', testCoachId]
    );
    testTeamId = teamResult.rows[0].id;
    
    // Create test player
    const playerResult = await pool.query(
      'INSERT INTO player (name, position, team_id) VALUES ($1, $2, $3) RETURNING id',
      ['Test Player', 'Outside Hitter', testTeamId]
    );
    testPlayerId = playerResult.rows[0].id;
    
    // Get available skills
    const skillsResult = await pool.query('SELECT * FROM volleyball_skills LIMIT 5');
    testSkills = skillsResult.rows;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM skill_ratings WHERE player_id = $1', [testPlayerId]);
    await pool.query('DELETE FROM player WHERE id = $1', [testPlayerId]);
    await pool.query('DELETE FROM team WHERE id = $1', [testTeamId]);
    await pool.query('DELETE FROM coach WHERE id = $1', [testCoachId]);
    
    // Close server and database connections
    server.close();
    await pool.end();
  });

  describe('GET /api/skill-ratings/skills', () => {
    it('should retrieve all volleyball skills', async () => {
      const response = await request(server)
        .get('/api/skill-ratings/skills')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      
      // Check skill structure
      const skill = response.body[0];
      expect(skill).toHaveProperty('id');
      expect(skill).toHaveProperty('name');
      expect(skill).toHaveProperty('category');
      expect(skill).toHaveProperty('description');
    });

    it('should return unauthorized without auth token', async () => {
      const response = await request(server)
        .get('/api/skill-ratings/skills');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/skill-ratings/skills/category/:category', () => {
    it('should retrieve skills by category', async () => {
      const category = 'Serving';
      const response = await request(server)
        .get(`/api/skill-ratings/skills/category/${category}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      
      // All returned skills should be from the requested category
      response.body.forEach(skill => {
        expect(skill.category).toBe(category);
      });
    });

    it('should return empty array for non-existent category', async () => {
      const response = await request(server)
        .get('/api/skill-ratings/skills/category/NonExistentCategory')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('PUT /api/skill-ratings/player/:playerId/skill/:skillName', () => {
    it('should create/update a skill rating', async () => {
      const skillName = testSkills[0].name;
      const rating = 4.5;
      const notes = 'Excellent improvement';

      const response = await request(server)
        .put(`/api/skill-ratings/player/${testPlayerId}/skill/${encodeURIComponent(skillName)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating, notes });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.player_id).toBe(testPlayerId);
      expect(response.body.skill_name).toBe(skillName);
      expect(response.body.rating).toBe(rating);
      expect(response.body.notes).toBe(notes);
    });

    it('should update existing skill rating', async () => {
      const skillName = testSkills[0].name;
      const newRating = 3.5;
      const newNotes = 'Needs more practice';

      const response = await request(server)
        .put(`/api/skill-ratings/player/${testPlayerId}/skill/${encodeURIComponent(skillName)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: newRating, notes: newNotes });

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(newRating);
      expect(response.body.notes).toBe(newNotes);
    });

    it('should reject invalid rating values', async () => {
      const skillName = testSkills[0].name;
      
      // Test rating too high
      let response = await request(server)
        .put(`/api/skill-ratings/player/${testPlayerId}/skill/${encodeURIComponent(skillName)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 6.0 });

      expect(response.status).toBe(400);

      // Test negative rating
      response = await request(server)
        .put(`/api/skill-ratings/player/${testPlayerId}/skill/${encodeURIComponent(skillName)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: -1.0 });

      expect(response.status).toBe(400);
    });

    it('should handle half-star ratings correctly', async () => {
      const skillName = testSkills[1].name;
      const halfStarRating = 3.5;

      const response = await request(server)
        .put(`/api/skill-ratings/player/${testPlayerId}/skill/${encodeURIComponent(skillName)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: halfStarRating });

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(halfStarRating);
    });
  });

  describe('GET /api/skill-ratings/player/:playerId', () => {
    it('should retrieve all ratings for a player', async () => {
      const response = await request(server)
        .get(`/api/skill-ratings/player/${testPlayerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      
      // Should have at least the ratings we created in previous tests
      expect(response.body.length).toBeGreaterThan(0);
      
      response.body.forEach(rating => {
        expect(rating.player_id).toBe(testPlayerId);
        expect(rating).toHaveProperty('skill_name');
        expect(rating).toHaveProperty('rating');
        expect(typeof rating.rating).toBe('number');
      });
    });

    it('should return empty array for player with no ratings', async () => {
      // Create a new player with no ratings
      const newPlayerResult = await pool.query(
        'INSERT INTO player (name, position, team_id) VALUES ($1, $2, $3) RETURNING id',
        ['New Player', 'Setter', testTeamId]
      );
      const newPlayerId = newPlayerResult.rows[0].id;

      const response = await request(server)
        .get(`/api/skill-ratings/player/${newPlayerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);

      // Clean up
      await pool.query('DELETE FROM player WHERE id = $1', [newPlayerId]);
    });
  });

  describe('PUT /api/skill-ratings/player/:playerId/bulk', () => {
    it('should bulk update multiple ratings', async () => {
      const bulkRatings = {
        ratings: [
          { skill_name: testSkills[2].name, rating: 4.0, notes: 'Good progress' },
          { skill_name: testSkills[3].name, rating: 3.5, notes: 'Needs work' }
        ],
        rated_date: '2025-08-24'
      };

      const response = await request(server)
        .put(`/api/skill-ratings/player/${testPlayerId}/bulk`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkRatings);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('ratings');
      expect(Array.isArray(response.body.ratings)).toBeTruthy();
      expect(response.body.ratings.length).toBe(2);
    });

    it('should reject bulk update with invalid data', async () => {
      const invalidBulkRatings = {
        ratings: [
          { skill_name: testSkills[0].name, rating: 6.0 } // Invalid rating
        ],
        rated_date: '2025-08-24'
      };

      const response = await request(server)
        .put(`/api/skill-ratings/player/${testPlayerId}/bulk`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidBulkRatings);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/skill-ratings/team/:teamId/averages', () => {
    it('should retrieve team skill averages', async () => {
      const response = await request(server)
        .get(`/api/skill-ratings/team/${testTeamId}/averages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      
      response.body.forEach(average => {
        expect(average).toHaveProperty('skill_name');
        expect(average).toHaveProperty('skill_category');
        expect(average).toHaveProperty('average_rating');
        expect(average).toHaveProperty('player_count');
        expect(typeof average.average_rating).toBe('number');
        expect(typeof average.player_count).toBe('number');
      });
    });

    it('should return empty array for team with no ratings', async () => {
      // Create a new team with no players/ratings
      const newTeamResult = await pool.query(
        'INSERT INTO team (name, coach_id) VALUES ($1, $2) RETURNING id',
        ['Empty Team', testCoachId]
      );
      const newTeamId = newTeamResult.rows[0].id;

      const response = await request(server)
        .get(`/api/skill-ratings/team/${newTeamId}/averages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);

      // Clean up
      await pool.query('DELETE FROM team WHERE id = $1', [newTeamId]);
    });

    it('should deny access to unauthorized team', async () => {
      // Create another coach and team
      const otherCoachResult = await pool.query(
        'INSERT INTO coach (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id',
        ['othercoach@test.com', 'hashedpassword', 'Other', 'Coach']
      );
      const otherCoachId = otherCoachResult.rows[0].id;

      const otherTeamResult = await pool.query(
        'INSERT INTO team (name, coach_id) VALUES ($1, $2) RETURNING id',
        ['Other Team', otherCoachId]
      );
      const otherTeamId = otherTeamResult.rows[0].id;

      // Try to access with our test coach's token
      const response = await request(server)
        .get(`/api/skill-ratings/team/${otherTeamId}/averages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);

      // Clean up
      await pool.query('DELETE FROM team WHERE id = $1', [otherTeamId]);
      await pool.query('DELETE FROM coach WHERE id = $1', [otherCoachId]);
    });
  });

  describe('DELETE /api/skill-ratings/player/:playerId/skill/:skillName', () => {
    it('should delete a skill rating', async () => {
      // First create a rating to delete
      const skillName = testSkills[4].name;
      await request(server)
        .put(`/api/skill-ratings/player/${testPlayerId}/skill/${encodeURIComponent(skillName)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 3.0 });

      // Then delete it
      const response = await request(server)
        .delete(`/api/skill-ratings/player/${testPlayerId}/skill/${encodeURIComponent(skillName)}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle deleting non-existent rating', async () => {
      const response = await request(server)
        .delete(`/api/skill-ratings/player/${testPlayerId}/skill/NonExistentSkill`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Data Integrity Tests', () => {
    it('should maintain data consistency after multiple operations', async () => {
      const skillName = testSkills[0].name;
      
      // Create rating
      await request(server)
        .put(`/api/skill-ratings/player/${testPlayerId}/skill/${encodeURIComponent(skillName)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 4.0 });

      // Update rating
      await request(server)
        .put(`/api/skill-ratings/player/${testPlayerId}/skill/${encodeURIComponent(skillName)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 4.5 });

      // Check final value
      const response = await request(server)
        .get(`/api/skill-ratings/player/${testPlayerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const rating = response.body.find(r => r.skill_name === skillName);
      expect(rating.rating).toBe(4.5);
    });

    it('should correctly calculate team averages', async () => {
      // Create a second player
      const player2Result = await pool.query(
        'INSERT INTO player (name, position, team_id) VALUES ($1, $2, $3) RETURNING id',
        ['Player 2', 'Setter', testTeamId]
      );
      const player2Id = player2Result.rows[0].id;

      const skillName = testSkills[0].name;
      
      // Add ratings for both players
      await request(server)
        .put(`/api/skill-ratings/player/${testPlayerId}/skill/${encodeURIComponent(skillName)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 4.0 });

      await request(server)
        .put(`/api/skill-ratings/player/${player2Id}/skill/${encodeURIComponent(skillName)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 3.0 });

      // Check team average
      const response = await request(server)
        .get(`/api/skill-ratings/team/${testTeamId}/averages`)
        .set('Authorization', `Bearer ${authToken}`);

      const skillAverage = response.body.find(avg => avg.skill_name === skillName);
      expect(skillAverage).toBeDefined();
      expect(skillAverage.average_rating).toBe(3.5); // (4.0 + 3.0) / 2
      expect(skillAverage.player_count).toBe(2);

      // Clean up
      await pool.query('DELETE FROM skill_ratings WHERE player_id = $1', [player2Id]);
      await pool.query('DELETE FROM player WHERE id = $1', [player2Id]);
    });
  });
});
