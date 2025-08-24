#!/bin/bash

# Phase 2 Authentication System Test Script

echo "🧪 Starting Phase 2 Authentication Tests"
echo "========================================"

# Check if servers are running
echo "📡 Checking server status..."

# Check backend
if curl -s http://localhost:3002/health > /dev/null; then
    echo "✅ Backend server running on port 3002"
else
    echo "❌ Backend server not running"
    echo "Starting backend server..."
    cd ../server && npm start &
    sleep 3
fi

# Check frontend
if curl -s http://localhost:4200 > /dev/null; then
    echo "✅ Frontend server running on port 4200"
else
    echo "❌ Frontend server not running"
    echo "Starting frontend server..."
    cd ../client && ng serve &
    sleep 5
fi

echo ""
echo "🎯 Test Scenarios to Execute:"
echo "1. Register new user (head_coach)"
echo "2. Register new user (player)"
echo "3. Login with valid credentials"
echo "4. Test protected route access"
echo "5. Test logout functionality"
echo ""
echo "📖 Open http://localhost:4200 in your browser to start testing"
echo "📝 Document results in tests/test-results.md"
