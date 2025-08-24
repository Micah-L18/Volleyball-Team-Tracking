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

describe('Phase 2: Authentication System Tests', () => {
  let authToken;
  let userId;

  describe('POST /api/auth/register', () => {
    test('Should register a new head coach', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@test.com',
          password: 'password123',
          role: 'head_coach'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Registration successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('john.doe@test.com');
      expect(response.body.user.first_name).toBe('John');
      expect(response.body.user.last_name).toBe('Doe');

      authToken = response.body.token;
      userId = response.body.user.id;
    });

    test('Should register a new player', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@test.com',
          password: 'password123',
          role: 'player'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('jane.smith@test.com');
    });

    test('Should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'John',
          last_name: 'Duplicate',
          email: 'john.doe@test.com',
          password: 'password123',
          role: 'head_coach'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already exists');
    });

    test('Should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'incomplete@test.com',
          password: 'password123'
          // Missing first_name, last_name, role
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/login', () => {
    test('Should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('john.doe@test.com');
      expect(response.body.user.teams).toBeDefined();
    });

    test('Should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('Should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    test('Should get current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(userId);
      expect(response.body.email).toBe('john.doe@test.com');
      expect(response.body.teams).toBeDefined();
    });

    test('Should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('No token provided');
    });

    test('Should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token.');
    });
  });

  describe('Role Validation', () => {
    test('Should accept valid roles', async () => {
      const roles = ['head_coach', 'assistant_coach', 'player', 'parent'];
      
      for (let i = 0; i < roles.length; i++) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            first_name: 'Test',
            last_name: `User${i}`,
            email: `test${i}@test.com`,
            password: 'password123',
            role: roles[i]
          });

        expect(response.status).toBe(201);
      }
    });

    test('Should reject invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'Invalid',
          last_name: 'Role',
          email: 'invalid@test.com',
          password: 'password123',
          role: 'invalid_role'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });
});
