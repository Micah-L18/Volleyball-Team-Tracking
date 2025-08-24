// Jest setup file
const { execSync } = require('child_process');

beforeAll(async () => {
  // Ensure test database is clean before running tests
  console.log('Setting up test environment...');
  
  // Give the server a moment to fully start if running in parallel
  await new Promise(resolve => setTimeout(resolve, 2000));
});

afterAll(async () => {
  // Cleanup after tests
  console.log('Cleaning up test environment...');
});
