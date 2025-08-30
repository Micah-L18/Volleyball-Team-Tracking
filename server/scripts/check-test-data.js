const pool = require('../config/database');

async function checkTestData() {
    try {
        console.log('🔍 Checking test data creation...\n');

        // Check teams
        const teams = await pool.query('SELECT * FROM team WHERE user_id = 1 ORDER BY created_at DESC LIMIT 5');
        console.log(`📊 Teams for user 1: ${teams.rows.length}`);
        teams.rows.forEach(team => {
            console.log(`  - ${team.name} (ID: ${team.id}) - ${team.created_at.toISOString()}`);
        });

        if (teams.rows.length > 0) {
            const latestTeam = teams.rows[0];
            
            // Check players for latest team
            const players = await pool.query('SELECT * FROM player WHERE team_id = $1', [latestTeam.id]);
            console.log(`\n👥 Players in ${latestTeam.name}: ${players.rows.length}`);
            players.rows.forEach(player => {
                console.log(`  - ${player.first_name} ${player.last_name || ''} (#${player.jersey_number}, ${player.position})`);
            });

            // Check schedule events
            const schedule = await pool.query('SELECT * FROM schedule WHERE team_id = $1', [latestTeam.id]);
            console.log(`\n📅 Schedule events: ${schedule.rows.length}`);
            schedule.rows.slice(0, 3).forEach(event => {
                console.log(`  - ${event.event_type} vs ${event.opponent} on ${event.event_date.toDateString()}`);
            });
            if (schedule.rows.length > 3) {
                console.log(`  ... and ${schedule.rows.length - 3} more events`);
            }

            // Check statistics
            const stats = await pool.query(`
                SELECT ps.*, p.first_name, p.last_name 
                FROM player_statistics ps 
                JOIN player p ON ps.player_id = p.id 
                WHERE p.team_id = $1 
                ORDER BY ps.created_at DESC
            `, [latestTeam.id]);
            console.log(`\n📈 Statistics entries: ${stats.rows.length}`);
            
            if (stats.rows.length > 0) {
                // Group by category
                const categoryCounts = {};
                stats.rows.forEach(stat => {
                    categoryCounts[stat.stat_category] = (categoryCounts[stat.stat_category] || 0) + 1;
                });
                
                console.log('  Categories:');
                Object.entries(categoryCounts).forEach(([category, count]) => {
                    console.log(`    - ${category}: ${count} entries`);
                });
            }

            // Check skill ratings
            const ratings = await pool.query(`
                SELECT sr.*, p.first_name, p.last_name 
                FROM skill_rating sr 
                JOIN player p ON sr.player_id = p.id 
                WHERE p.team_id = $1
            `, [latestTeam.id]);
            console.log(`\n⭐ Skill ratings: ${ratings.rows.length}`);
            
            if (ratings.rows.length > 0) {
                const ratingsByPlayer = {};
                ratings.rows.forEach(rating => {
                    const playerName = `${rating.first_name} ${rating.last_name || ''}`.trim();
                    ratingsByPlayer[playerName] = (ratingsByPlayer[playerName] || 0) + 1;
                });
                
                console.log('  Players with ratings:');
                Object.entries(ratingsByPlayer).forEach(([player, count]) => {
                    console.log(`    - ${player}: ${count} skills rated`);
                });
            }
        }

        console.log('\n✅ Test data check complete!');
        
    } catch (error) {
        console.error('❌ Error checking test data:', error);
    } finally {
        await pool.end();
    }
}

checkTestData();
