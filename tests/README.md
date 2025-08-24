# Testing Documentation

## Phase 2: Authentication System Tests

### Test Environment Setup
- Backend: http://localhost:3002
- Frontend: http://localhost:4200
- Database: PostgreSQL (coach_app)

### Test Cases

#### 2.1 User Registration
- [ ] Test user registration with valid data
- [ ] Test email validation
- [ ] Test password requirements
- [ ] Test role selection (head_coach, assistant_coach, player, parent)
- [ ] Test duplicate email handling

#### 2.2 User Login
- [ ] Test login with valid credentials
- [ ] Test login with invalid credentials
- [ ] Test JWT token generation
- [ ] Test protected route access

#### 2.3 Authentication Flow
- [ ] Test route guards
- [ ] Test token expiration
- [ ] Test logout functionality
- [ ] Test persistent login state

### Test Results
Results will be documented here after each test run.

## Phase 3: Team Management Tests (Coming Next)

### Test Cases
- [ ] Create team
- [ ] Add team members
- [ ] Assign team-based roles
- [ ] Team permissions

### How to Run Tests

#### Manual Testing
1. Start backend server: `cd server && npm start`
2. Start frontend server: `cd client && ng serve`
3. Open browser to http://localhost:4200
4. Follow test scenarios

#### Automated Testing (Future)
- Backend API tests using Jest/Supertest
- Frontend unit tests using Jasmine/Karma
- E2E tests using Cypress
