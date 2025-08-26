#!/bin/bash

# Script to remove coachmicahl@yahoo.com from team 4 for testing purposes
# Usage: ./scripts/remove-test-user.sh

echo "🗑️  Removing coachmicahl@yahoo.com from team 4..."

# Remove the user from team 4
psql -d coach_app -c "DELETE FROM team_users WHERE team_id = 4 AND user_id = (SELECT id FROM users WHERE email = 'coachmicahl@yahoo.com');"

if [ $? -eq 0 ]; then
    echo "✅ User removed successfully!"
    echo ""
    echo "📋 Current team 4 members:"
    psql -d coach_app -c "SELECT tu.id, u.email, u.first_name, u.last_name, tu.role FROM team_users tu JOIN users u ON tu.user_id = u.id WHERE tu.team_id = 4 ORDER BY tu.role;"
else
    echo "❌ Failed to remove user"
fi
