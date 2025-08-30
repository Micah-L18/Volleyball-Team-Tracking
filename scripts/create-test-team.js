const pool = require('./server/config/database');

async function createTestTeam() {
    try {
        console.log('🚀 Creating comprehensive test team for user 1...\n');

        // Create team
        console.log('📊 Creating team...');
        const teamResult = await pool.query(`
            INSERT INTO team (name, user_id, description, coach_name, season)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [
            'Elite Volleyball Academy',
            1,
            'A premier volleyball team focused on developing elite-level skills and competitive excellence',
            'Coach Sarah Thompson',
            '2025'
        ]);

        const team = teamResult.rows[0];
        console.log(`✅ Team created: ${team.name} (ID: ${team.id})`);

        // Create 12 players with diverse positions and skill levels
        console.log('\n👥 Creating players...');
        const playerData = [
            { name: 'Emma', lastName: 'Rodriguez', jersey: 1, position: 'setter', skill: 8.5 },
            { name: 'Maya', lastName: 'Chen', jersey: 2, position: 'outside_hitter', skill: 9.0 },
            { name: 'Sofia', lastName: 'Williams', jersey: 3, position: 'middle_blocker', skill: 7.8 },
            { name: 'Isabella', lastName: 'Johnson', jersey: 4, position: 'opposite', skill: 8.7 },
            { name: 'Ava', lastName: 'Garcia', jersey: 5, position: 'libero', skill: 8.9 },
            { name: 'Mia', lastName: 'Davis', jersey: 6, position: 'outside_hitter', skill: 8.2 },
            { name: 'Charlotte', lastName: 'Martinez', jersey: 7, position: 'middle_blocker', skill: 7.5 },
            { name: 'Amelia', lastName: 'Brown', jersey: 8, position: 'setter', skill: 7.9 },
            { name: 'Harper', lastName: 'Wilson', jersey: 9, position: 'outside_hitter', skill: 8.4 },
            { name: 'Evelyn', lastName: 'Anderson', jersey: 10, position: 'opposite', skill: 8.1 },
            { name: 'Abigail', lastName: 'Taylor', jersey: 11, position: 'middle_blocker', skill: 7.6 },
            { name: 'Emily', lastName: 'Thomas', jersey: 12, position: 'defensive_specialist', skill: 8.3 }
        ];

        const players = [];
        for (const playerInfo of playerData) {
            const playerResult = await pool.query(`
                INSERT INTO player (first_name, last_name, jersey_number, position, team_id, height, weight, year_in_school)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [
                playerInfo.name,
                playerInfo.lastName,
                playerInfo.jersey,
                playerInfo.position,
                team.id,
                Math.floor(Math.random() * 8) + 64, // Height 64-71 inches
                Math.floor(Math.random() * 40) + 130, // Weight 130-170 lbs
                ['freshman', 'sophomore', 'junior', 'senior'][Math.floor(Math.random() * 4)]
            ]);
            players.push(playerResult.rows[0]);
            console.log(`  ✅ ${playerInfo.name} ${playerInfo.lastName} (#${playerInfo.jersey}, ${playerInfo.position})`);
        }

        // Create skill ratings for each player
        console.log('\n⭐ Creating skill ratings...');
        const skills = ['serving', 'passing', 'setting', 'attacking', 'blocking', 'digging'];
        
        for (const player of players) {
            const baseSkill = playerData.find(p => p.name === player.first_name)?.skill || 7.0;
            
            for (const skill of skills) {
                // Vary skills based on position
                let skillRating = baseSkill;
                if (player.position === 'setter' && skill === 'setting') skillRating += 1.0;
                else if (player.position === 'libero' && (skill === 'passing' || skill === 'digging')) skillRating += 0.8;
                else if (player.position === 'middle_blocker' && skill === 'blocking') skillRating += 0.7;
                else if (player.position === 'outside_hitter' && skill === 'attacking') skillRating += 0.6;
                
                // Add some randomness and cap at 10
                skillRating += (Math.random() - 0.5) * 1.0;
                skillRating = Math.min(10, Math.max(5, skillRating));
                
                await pool.query(`
                    INSERT INTO skill_rating (player_id, skill_name, rating, notes)
                    VALUES ($1, $2, $3, $4)
                `, [
                    player.id,
                    skill,
                    skillRating.toFixed(1),
                    `Initial assessment - ${skill} ability`
                ]);
            }
        }
        console.log(`✅ Created skill ratings for ${players.length} players`);

        // Create schedule with 20 diverse events
        console.log('\n📅 Creating schedule events...');
        const scheduleData = [
            { type: 'game', opponent: 'Valley High Volleyball', date: '2025-09-05', location: 'Home Gym' },
            { type: 'practice', opponent: null, date: '2025-09-07', location: 'Training Center' },
            { type: 'tournament', opponent: 'Regional Championships', date: '2025-09-12', location: 'Sports Complex' },
            { type: 'game', opponent: 'Mountain View Academy', date: '2025-09-15', location: 'Away' },
            { type: 'practice', opponent: null, date: '2025-09-17', location: 'Home Gym' },
            { type: 'game', opponent: 'Coastal Prep', date: '2025-09-22', location: 'Home Gym' },
            { type: 'scrimmage', opponent: 'City College JV', date: '2025-09-24', location: 'Training Center' },
            { type: 'tournament', opponent: 'State Qualifiers', date: '2025-09-28', location: 'Convention Center' },
            { type: 'practice', opponent: null, date: '2025-10-01', location: 'Home Gym' },
            { type: 'game', opponent: 'Metro High', date: '2025-10-05', location: 'Away' },
            { type: 'game', opponent: 'Riverside Academy', date: '2025-10-08', location: 'Home Gym' },
            { type: 'practice', opponent: null, date: '2025-10-10', location: 'Training Center' },
            { type: 'tournament', opponent: 'Elite Invitational', date: '2025-10-15', location: 'University Arena' },
            { type: 'game', opponent: 'Summit Prep', date: '2025-10-19', location: 'Away' },
            { type: 'scrimmage', opponent: 'Local Club Team', date: '2025-10-22', location: 'Community Center' },
            { type: 'game', opponent: 'Pine Ridge High', date: '2025-10-26', location: 'Home Gym' },
            { type: 'practice', opponent: null, date: '2025-10-29', location: 'Training Center' },
            { type: 'tournament', opponent: 'Conference Finals', date: '2025-11-02', location: 'Regional Arena' },
            { type: 'game', opponent: 'Lakeside Volleyball', date: '2025-11-05', location: 'Away' },
            { type: 'practice', opponent: null, date: '2025-11-08', location: 'Home Gym' }
        ];

        for (const event of scheduleData) {
            await pool.query(`
                INSERT INTO schedule (team_id, event_type, opponent, event_date, event_time, location, notes)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                team.id,
                event.type,
                event.opponent,
                event.date,
                event.type === 'practice' ? '16:00:00' : '19:00:00',
                event.location,
                event.type === 'tournament' ? 'Multi-game tournament format' : null
            ]);
        }
        console.log(`✅ Created ${scheduleData.length} schedule events`);

        // Create comprehensive volleyball statistics
        console.log('\n📈 Creating comprehensive volleyball statistics...');
        
        const statCategories = {
            offense: ['kills', 'attacks', 'attack_errors', 'kill_percentage'],
            serving: ['aces', 'service_errors', 'serves_attempted', 'ace_percentage'],
            blocking: ['block_solos', 'block_assists', 'blocking_errors', 'blocks_per_set'],
            defense: ['digs', 'dig_errors', 'reception_attempts', 'dig_percentage'],
            passing: ['pass_attempts', 'pass_errors', 'perfect_passes', 'pass_rating'],
            setting: ['assists', 'setting_errors', 'sets_attempted', 'assist_percentage']
        };

        let totalStats = 0;
        
        // Create stats for the last 30 days with realistic game scenarios
        for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
            const statDate = new Date();
            statDate.setDate(statDate.getDate() - dayOffset);
            
            // 40% chance of having stats on any given day (games/practices)
            if (Math.random() > 0.6) continue;
            
            const gameType = Math.random() > 0.7 ? 'Game' : 'Practice';
            const isGoodDay = Math.random() > 0.3; // 70% chance of good performance
            
            for (const player of players) {
                const playerBaseSkill = playerData.find(p => p.name === player.first_name)?.skill || 7.0;
                
                for (const [category, statNames] of Object.entries(statCategories)) {
                    // Skip irrelevant stats for certain positions
                    if (player.position === 'libero' && (category === 'serving' || category === 'blocking')) continue;
                    if (player.position === 'setter' && category === 'offense') continue;
                    
                    for (const statName of statNames) {
                        let statValue = 0;
                        
                        // Generate realistic values based on stat type and player skill
                        switch (statName) {
                            case 'kills':
                                if (gameType === 'Game') {
                                    statValue = Math.floor((playerBaseSkill / 10) * (8 + Math.random() * 12));
                                    if (player.position === 'outside_hitter' || player.position === 'opposite') {
                                        statValue *= 1.5;
                                    }
                                } else {
                                    statValue = Math.floor((playerBaseSkill / 10) * (3 + Math.random() * 5));
                                }
                                break;
                                
                            case 'attacks':
                                statValue = Math.floor(Math.random() * 25) + 15;
                                if (player.position === 'outside_hitter') statValue *= 1.3;
                                break;
                                
                            case 'aces':
                                statValue = Math.floor((playerBaseSkill / 10) * (0 + Math.random() * 4));
                                break;
                                
                            case 'digs':
                                if (player.position === 'libero') {
                                    statValue = Math.floor((playerBaseSkill / 10) * (12 + Math.random() * 18));
                                } else {
                                    statValue = Math.floor((playerBaseSkill / 10) * (2 + Math.random() * 8));
                                }
                                break;
                                
                            case 'assists':
                                if (player.position === 'setter') {
                                    statValue = Math.floor((playerBaseSkill / 10) * (20 + Math.random() * 25));
                                } else {
                                    statValue = Math.floor(Math.random() * 3);
                                }
                                break;
                                
                            case 'block_solos':
                                if (player.position === 'middle_blocker') {
                                    statValue = Math.floor((playerBaseSkill / 10) * (1 + Math.random() * 3));
                                } else {
                                    statValue = Math.floor(Math.random() * 2);
                                }
                                break;
                                
                            case 'block_assists':
                                if (player.position === 'middle_blocker') {
                                    statValue = Math.floor((playerBaseSkill / 10) * (3 + Math.random() * 6));
                                } else {
                                    statValue = Math.floor(Math.random() * 3);
                                }
                                break;
                                
                            default:
                                // Generate reasonable values for other stats
                                statValue = Math.floor((playerBaseSkill / 10) * (2 + Math.random() * 8));
                        }
                        
                        // Apply good/bad day modifier
                        if (!isGoodDay) {
                            statValue = Math.floor(statValue * (0.6 + Math.random() * 0.3));
                        } else {
                            statValue = Math.floor(statValue * (1.0 + Math.random() * 0.4));
                        }
                        
                        // Ensure minimum of 0
                        statValue = Math.max(0, statValue);
                        
                        if (statValue > 0 || Math.random() > 0.7) { // Sometimes record zeros
                            await pool.query(`
                                INSERT INTO player_statistics (player_id, stat_category, stat_name, stat_value, stat_date, game_type)
                                VALUES ($1, $2, $3, $4, $5, $6)
                            `, [
                                player.id,
                                category,
                                statName,
                                statValue.toString(),
                                statDate.toISOString().split('T')[0],
                                gameType
                            ]);
                            totalStats++;
                        }
                    }
                }
            }
        }
        
        console.log(`✅ Created ${totalStats} statistical entries across all categories`);

        console.log(`
🎉 COMPREHENSIVE TEST TEAM CREATED SUCCESSFULLY! 🎉

📊 Team: ${team.name} (ID: ${team.id})
👥 Players: ${players.length} with diverse positions and skill levels
⭐ Skill Ratings: ${players.length * skills.length} individual skill assessments
📅 Schedule: ${scheduleData.length} events (games, practices, tournaments)
📈 Statistics: ${totalStats} realistic volleyball performance entries

🚀 Your comprehensive analytics dashboard is now ready with realistic data!
   Visit the Statistics Dashboard to explore all the advanced features.
        `);

    } catch (error) {
        console.error('❌ Error creating test team:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

createTestTeam();
