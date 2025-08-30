/**
 * Create Test Team with Complete Data
 * Creates a volleyball team with players, ratings, schedule, and statistics for user 1
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test team data
const testTeam = {
  name: 'Elite Volleyball Academy',
  description: 'Premier competitive volleyball team with advanced analytics tracking',
  season: '2025 Fall Season',
  division: 'Division 1',
  coach_name: 'Coach Sarah Johnson',
  assistant_coach: 'Coach Mike Rodriguez'
};

// Test players with detailed information
const testPlayers = [
  {
    first_name: 'Emma',
    last_name: 'Thompson',
    jersey_number: 1,
    position: 'Setter',
    height: '5\'8"',
    year: 'Senior',
    email: 'emma.thompson@email.com',
    phone: '555-0101',
    emergency_contact: 'Lisa Thompson - 555-0102',
    notes: 'Team captain, excellent court vision and leadership skills'
  },
  {
    first_name: 'Sophia',
    last_name: 'Martinez',
    jersey_number: 7,
    position: 'Outside Hitter',
    height: '6\'0"',
    year: 'Junior',
    email: 'sophia.martinez@email.com',
    phone: '555-0103',
    emergency_contact: 'Carlos Martinez - 555-0104',
    notes: 'Powerful attacker with strong serve, team co-captain'
  },
  {
    first_name: 'Ava',
    last_name: 'Johnson',
    jersey_number: 12,
    position: 'Middle Blocker',
    height: '6\'2"',
    year: 'Sophomore',
    email: 'ava.johnson@email.com',
    phone: '555-0105',
    emergency_contact: 'David Johnson - 555-0106',
    notes: 'Dominant blocker with quick attack skills'
  },
  {
    first_name: 'Isabella',
    last_name: 'Davis',
    jersey_number: 9,
    position: 'Libero',
    height: '5\'6"',
    year: 'Senior',
    email: 'isabella.davis@email.com',
    phone: '555-0107',
    emergency_contact: 'Susan Davis - 555-0108',
    notes: 'Exceptional defensive specialist with great passing skills'
  },
  {
    first_name: 'Mia',
    last_name: 'Wilson',
    jersey_number: 14,
    position: 'Outside Hitter',
    height: '5\'10"',
    year: 'Junior',
    email: 'mia.wilson@email.com',
    phone: '555-0109',
    emergency_contact: 'Jennifer Wilson - 555-0110',
    notes: 'Versatile player with strong all-around skills'
  },
  {
    first_name: 'Charlotte',
    last_name: 'Brown',
    jersey_number: 3,
    position: 'Right Side Hitter',
    height: '5\'11"',
    year: 'Freshman',
    email: 'charlotte.brown@email.com',
    phone: '555-0111',
    emergency_contact: 'Robert Brown - 555-0112',
    notes: 'Rising talent with great potential, strong blocker'
  },
  {
    first_name: 'Amelia',
    last_name: 'Garcia',
    jersey_number: 8,
    position: 'Setter',
    height: '5\'7"',
    year: 'Sophomore',
    email: 'amelia.garcia@email.com',
    phone: '555-0113',
    emergency_contact: 'Maria Garcia - 555-0114',
    notes: 'Backup setter with excellent hands and court awareness'
  },
  {
    first_name: 'Harper',
    last_name: 'Miller',
    jersey_number: 15,
    position: 'Middle Blocker',
    height: '6\'1"',
    year: 'Junior',
    email: 'harper.miller@email.com',
    phone: '555-0115',
    emergency_contact: 'Kevin Miller - 555-0116',
    notes: 'Quick middle with developing skills, great work ethic'
  }
];

// Test schedule/events
const testEvents = [
  {
    title: 'vs Riverside High',
    description: 'Home match against Riverside High School',
    event_date: '2025-09-15',
    start_time: '18:00:00',
    end_time: '20:00:00',
    location: 'Elite Academy Gymnasium',
    event_type: 'match',
    opponent: 'Riverside High School',
    is_home: true
  },
  {
    title: 'Practice - Serving Focus',
    description: 'Intensive serving practice with new techniques',
    event_date: '2025-09-17',
    start_time: '16:00:00',
    end_time: '18:00:00',
    location: 'Elite Academy Gymnasium',
    event_type: 'practice',
    opponent: null,
    is_home: true
  },
  {
    title: 'Tournament - City Championships',
    description: 'Annual city volleyball championship tournament',
    event_date: '2025-09-22',
    start_time: '09:00:00',
    end_time: '17:00:00',
    location: 'City Sports Complex',
    event_type: 'tournament',
    opponent: 'Multiple Teams',
    is_home: false
  },
  {
    title: 'vs Central Academy',
    description: 'Away match against Central Academy',
    event_date: '2025-09-28',
    start_time: '19:00:00',
    end_time: '21:00:00',
    location: 'Central Academy Gymnasium',
    event_type: 'match',
    opponent: 'Central Academy',
    is_home: false
  },
  {
    title: 'Practice - Blocking Drills',
    description: 'Focus on blocking techniques and timing',
    event_date: '2025-10-01',
    start_time: '16:30:00',
    end_time: '18:30:00',
    location: 'Elite Academy Gymnasium',
    event_type: 'practice',
    opponent: null,
    is_home: true
  }
];

// Function to generate realistic volleyball statistics
function generatePlayerStats(playerId, playerPosition, teamId) {
  const stats = [];
  const dates = [
    '2025-08-15', '2025-08-18', '2025-08-22', '2025-08-25', '2025-08-29',
    '2025-09-01', '2025-09-05', '2025-09-08', '2025-09-12', '2025-09-15'
  ];

  dates.forEach((date, index) => {
    // Base stats for all positions
    const baseStats = [
      { category: 'general', name: 'games_played', value: 1 },
      { category: 'general', name: 'sets_played', value: Math.floor(Math.random() * 2) + 3 },
      { category: 'general', name: 'points_scored', value: Math.floor(Math.random() * 5) + 2 }
    ];

    // Position-specific stats
    let positionStats = [];
    
    switch (playerPosition) {
      case 'Setter':
        positionStats = [
          { category: 'setting', name: 'assists', value: Math.floor(Math.random() * 15) + 25 },
          { category: 'setting', name: 'setting_attempts', value: Math.floor(Math.random() * 10) + 45 },
          { category: 'setting', name: 'setting_errors', value: Math.floor(Math.random() * 3) + 1 },
          { category: 'attacking', name: 'kills', value: Math.floor(Math.random() * 3) + 1 },
          { category: 'attacking', name: 'attempts', value: Math.floor(Math.random() * 5) + 5 },
          { category: 'attacking', name: 'errors', value: Math.floor(Math.random() * 2) },
          { category: 'serving', name: 'aces', value: Math.floor(Math.random() * 3) + 1 },
          { category: 'serving', name: 'service_attempts', value: Math.floor(Math.random() * 5) + 12 },
          { category: 'serving', name: 'service_errors', value: Math.floor(Math.random() * 2) },
          { category: 'digging', name: 'digs', value: Math.floor(Math.random() * 8) + 5 }
        ];
        break;
        
      case 'Outside Hitter':
        positionStats = [
          { category: 'attacking', name: 'kills', value: Math.floor(Math.random() * 8) + 12 },
          { category: 'attacking', name: 'attempts', value: Math.floor(Math.random() * 10) + 25 },
          { category: 'attacking', name: 'errors', value: Math.floor(Math.random() * 4) + 2 },
          { category: 'serving', name: 'aces', value: Math.floor(Math.random() * 4) + 2 },
          { category: 'serving', name: 'service_attempts', value: Math.floor(Math.random() * 8) + 15 },
          { category: 'serving', name: 'service_errors', value: Math.floor(Math.random() * 3) + 1 },
          { category: 'blocking', name: 'solo_blocks', value: Math.floor(Math.random() * 2) + 1 },
          { category: 'blocking', name: 'block_assists', value: Math.floor(Math.random() * 4) + 3 },
          { category: 'blocking', name: 'block_errors', value: Math.floor(Math.random() * 2) },
          { category: 'passing', name: 'perfect_passes', value: Math.floor(Math.random() * 5) + 8 },
          { category: 'passing', name: 'good_passes', value: Math.floor(Math.random() * 6) + 10 },
          { category: 'passing', name: 'poor_passes', value: Math.floor(Math.random() * 3) + 2 },
          { category: 'digging', name: 'digs', value: Math.floor(Math.random() * 6) + 8 }
        ];
        break;
        
      case 'Middle Blocker':
        positionStats = [
          { category: 'attacking', name: 'kills', value: Math.floor(Math.random() * 6) + 8 },
          { category: 'attacking', name: 'attempts', value: Math.floor(Math.random() * 8) + 15 },
          { category: 'attacking', name: 'errors', value: Math.floor(Math.random() * 3) + 1 },
          { category: 'blocking', name: 'solo_blocks', value: Math.floor(Math.random() * 3) + 2 },
          { category: 'blocking', name: 'block_assists', value: Math.floor(Math.random() * 6) + 5 },
          { category: 'blocking', name: 'block_errors', value: Math.floor(Math.random() * 2) + 1 },
          { category: 'serving', name: 'aces', value: Math.floor(Math.random() * 2) + 1 },
          { category: 'serving', name: 'service_attempts', value: Math.floor(Math.random() * 5) + 10 },
          { category: 'serving', name: 'service_errors', value: Math.floor(Math.random() * 2) },
          { category: 'digging', name: 'digs', value: Math.floor(Math.random() * 4) + 3 }
        ];
        break;
        
      case 'Libero':
        positionStats = [
          { category: 'passing', name: 'perfect_passes', value: Math.floor(Math.random() * 8) + 15 },
          { category: 'passing', name: 'good_passes', value: Math.floor(Math.random() * 10) + 20 },
          { category: 'passing', name: 'poor_passes', value: Math.floor(Math.random() * 3) + 1 },
          { category: 'digging', name: 'digs', value: Math.floor(Math.random() * 10) + 18 },
          { category: 'digging', name: 'dig_attempts', value: Math.floor(Math.random() * 15) + 25 },
          { category: 'serving', name: 'aces', value: Math.floor(Math.random() * 3) + 1 },
          { category: 'serving', name: 'service_attempts', value: Math.floor(Math.random() * 6) + 12 },
          { category: 'serving', name: 'service_errors', value: Math.floor(Math.random() * 2) }
        ];
        break;
        
      case 'Right Side Hitter':
        positionStats = [
          { category: 'attacking', name: 'kills', value: Math.floor(Math.random() * 6) + 10 },
          { category: 'attacking', name: 'attempts', value: Math.floor(Math.random() * 8) + 20 },
          { category: 'attacking', name: 'errors', value: Math.floor(Math.random() * 3) + 2 },
          { category: 'blocking', name: 'solo_blocks', value: Math.floor(Math.random() * 2) + 1 },
          { category: 'blocking', name: 'block_assists', value: Math.floor(Math.random() * 5) + 4 },
          { category: 'blocking', name: 'block_errors', value: Math.floor(Math.random() * 2) },
          { category: 'serving', name: 'aces', value: Math.floor(Math.random() * 3) + 2 },
          { category: 'serving', name: 'service_attempts', value: Math.floor(Math.random() * 6) + 14 },
          { category: 'serving', name: 'service_errors', value: Math.floor(Math.random() * 3) + 1 },
          { category: 'passing', name: 'perfect_passes', value: Math.floor(Math.random() * 4) + 5 },
          { category: 'passing', name: 'good_passes', value: Math.floor(Math.random() * 5) + 8 },
          { category: 'passing', name: 'poor_passes', value: Math.floor(Math.random() * 3) + 1 },
          { category: 'digging', name: 'digs', value: Math.floor(Math.random() * 5) + 6 }
        ];
        break;
    }

    // Combine base and position stats
    const allStats = [...baseStats, ...positionStats];
    
    allStats.forEach(stat => {
      stats.push({
        player_id: playerId,
        team_id: teamId,
        stat_category: stat.category,
        stat_name: stat.name,
        stat_value: stat.value,
        stat_date: date,
        game_type: index % 3 === 0 ? 'match' : 'practice',
        opponent: index % 3 === 0 ? ['Riverside High', 'Central Academy', 'Oak Valley'][index % 3] : null,
        set_number: Math.floor(Math.random() * 3) + 1,
        notes: null
      });
    });
  });

  return stats;
}

// Function to generate player ratings
function generatePlayerRatings(playerId, playerPosition) {
  const ratings = [];
  const categories = ['attacking', 'serving', 'blocking', 'passing', 'setting', 'digging'];
  
  categories.forEach(category => {
    let rating = 50; // Base rating
    
    // Adjust rating based on position strengths
    switch (playerPosition) {
      case 'Setter':
        if (category === 'setting') rating = Math.floor(Math.random() * 20) + 80;
        else if (category === 'passing') rating = Math.floor(Math.random() * 15) + 75;
        else if (category === 'attacking') rating = Math.floor(Math.random() * 20) + 40;
        else rating = Math.floor(Math.random() * 25) + 60;
        break;
        
      case 'Outside Hitter':
        if (category === 'attacking') rating = Math.floor(Math.random() * 15) + 80;
        else if (category === 'serving') rating = Math.floor(Math.random() * 20) + 75;
        else if (category === 'passing') rating = Math.floor(Math.random() * 15) + 70;
        else rating = Math.floor(Math.random() * 25) + 65;
        break;
        
      case 'Middle Blocker':
        if (category === 'blocking') rating = Math.floor(Math.random() * 15) + 82;
        else if (category === 'attacking') rating = Math.floor(Math.random() * 20) + 75;
        else if (category === 'passing') rating = Math.floor(Math.random() * 15) + 45;
        else rating = Math.floor(Math.random() * 20) + 60;
        break;
        
      case 'Libero':
        if (category === 'passing') rating = Math.floor(Math.random() * 10) + 85;
        else if (category === 'digging') rating = Math.floor(Math.random() * 15) + 80;
        else if (category === 'serving') rating = Math.floor(Math.random() * 20) + 70;
        else if (category === 'attacking') rating = Math.floor(Math.random() * 15) + 20;
        else rating = Math.floor(Math.random() * 25) + 55;
        break;
        
      case 'Right Side Hitter':
        if (category === 'attacking') rating = Math.floor(Math.random() * 15) + 78;
        else if (category === 'blocking') rating = Math.floor(Math.random() * 20) + 75;
        else if (category === 'serving') rating = Math.floor(Math.random() * 15) + 70;
        else rating = Math.floor(Math.random() * 25) + 65;
        break;
        
      default:
        rating = Math.floor(Math.random() * 30) + 60;
    }
    
    ratings.push({
      player_id: playerId,
      category: category,
      rating: Math.min(rating, 100),
      notes: `${category} performance rating based on recent games and practice`,
      created_at: new Date().toISOString()
    });
  });
  
  return ratings;
}

async function createTestTeam() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🏐 Creating test team for user 1...');
    
    // 1. Create the team
    const teamResult = await client.query(`
      INSERT INTO team (name, description, created_by_user_id, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id
    `, [testTeam.name, testTeam.description, 1]);
    
    const teamId = teamResult.rows[0].id;
    console.log(`✅ Team created with ID: ${teamId}`);
    
    // 2. Add user 1 as team owner
    await client.query(`
      INSERT INTO team_users (team_id, user_id, role, joined_at)
      VALUES ($1, $2, 'owner', NOW())
    `, [teamId, 1]);
    
    console.log('✅ User 1 added as team owner');
    
    // 3. Create players
    const playerIds = [];
    for (const player of testPlayers) {
      const playerResult = await client.query(`
        INSERT INTO player (
          first_name, last_name, jersey_number, position, height, year,
          email, phone, emergency_contact, notes, team_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING id
      `, [
        player.first_name, player.last_name, player.jersey_number, player.position,
        player.height, player.year, player.email, player.phone,
        player.emergency_contact, player.notes, teamId
      ]);
      
      const playerId = playerResult.rows[0].id;
      playerIds.push({ id: playerId, position: player.position });
      console.log(`✅ Player created: ${player.first_name} ${player.last_name} (ID: ${playerId})`);
    }
    
    // 4. Create schedule events
    for (const event of testEvents) {
      await client.query(`
        INSERT INTO schedule (
          team_id, title, description, event_date, start_time, end_time,
          location, event_type, opponent, is_home, created_by_user_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      `, [
        teamId, event.title, event.description, event.event_date,
        event.start_time, event.end_time, event.location, event.event_type,
        event.opponent, event.is_home, 1
      ]);
    }
    
    console.log('✅ Schedule events created');
    
    // 5. Generate and insert player statistics
    for (const player of playerIds) {
      const stats = generatePlayerStats(player.id, player.position, teamId);
      
      for (const stat of stats) {
        await client.query(`
          INSERT INTO player_statistics (
            player_id, team_id, stat_category, stat_name, stat_value,
            stat_date, game_type, opponent, set_number, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        `, [
          stat.player_id, stat.team_id, stat.stat_category, stat.stat_name,
          stat.stat_value, stat.stat_date, stat.game_type, stat.opponent,
          stat.set_number, stat.notes
        ]);
      }
      
      console.log(`✅ Statistics generated for player ID: ${player.id}`);
    }
    
    // 6. Check if player_ratings table exists, create if not
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'player_ratings'
      );
    `);
    
    if (!tableCheckResult.rows[0].exists) {
      await client.query(`
        CREATE TABLE player_ratings (
          id SERIAL PRIMARY KEY,
          player_id INTEGER REFERENCES player(id) ON DELETE CASCADE,
          category VARCHAR(50) NOT NULL,
          rating INTEGER CHECK (rating >= 0 AND rating <= 100),
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Player ratings table created');
    }
    
    // 7. Generate and insert player ratings
    for (const player of playerIds) {
      const ratings = generatePlayerRatings(player.id, player.position);
      
      for (const rating of ratings) {
        await client.query(`
          INSERT INTO player_ratings (player_id, category, rating, notes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, [rating.player_id, rating.category, rating.rating, rating.notes]);
      }
      
      console.log(`✅ Ratings generated for player ID: ${player.id}`);
    }
    
    await client.query('COMMIT');
    
    console.log('\n🎉 Test team creation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Team: ${testTeam.name} (ID: ${teamId})`);
    console.log(`- Players: ${testPlayers.length} players with positions and stats`);
    console.log(`- Events: ${testEvents.length} scheduled events`);
    console.log(`- Statistics: Generated realistic volleyball stats for all players`);
    console.log(`- Ratings: Performance ratings across all volleyball categories`);
    console.log('\n🚀 Ready to test the advanced statistical analysis features!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating test team:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the script
if (require.main === module) {
  createTestTeam()
    .then(() => {
      console.log('\n✨ Test team setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to create test team:', error);
      process.exit(1);
    });
}

module.exports = { createTestTeam };
