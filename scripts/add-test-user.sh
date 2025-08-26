#!/bin/bash

# Script to add coachmicahl@yahoo.com back to team 4 for testing purposes
# Usage: ./scripts/add-test-user.sh

echo "➕ Adding coachmicahl@yahoo.com back to team 4..."

# Add the user back to team 4 as assistant coach
psql -d coach_app -c "INSERT INTO team_users (team_id, user_id, role, status, joined_date) VALUES (4, (SELECT id FROM users WHERE email = 'coachmicahl@yahoo.com'), 'assistant_coach', 'accepted', NOW()) ON CONFLICT DO NOTHING;"

if [ $? -eq 0 ]; then
    echo "✅ User added successfully!"
    echo ""
    echo "📋 Current team 4 members:"
    psql -d coach_app -c "SELECT tu.id, u.email, u.first_name, u.last_name, tu.role FROM team_users tu JOIN users u ON tu.user_id = u.id WHERE tu.team_id = 4 ORDER BY tu.role;"
else
    echo "❌ Failed to add user"
fi
