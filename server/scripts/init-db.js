const pool = require('../models/db');

async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');

    // Create users table (replaces coaches table)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create teams table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        level VARCHAR(100),
        season VARCHAR(50),
        description TEXT,
        photo_url VARCHAR(500),
        created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create team users and memberships table (team-based roles)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_users (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES team(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('head_coach', 'assistant_coach', 'player', 'parent')),
        player_id INTEGER,
        invited_by INTEGER REFERENCES users(id),
        invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'declined')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, user_id)
      );
    `);

    // Create players table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS player (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        position VARCHAR(50),
        year VARCHAR(30),
        jersey_number INTEGER,
        height VARCHAR(20),
        reach VARCHAR(20),
        dominant_hand VARCHAR(10) CHECK (dominant_hand IN ('Left', 'Right', 'Ambidextrous')),
        contact_info VARCHAR(255),
        notes TEXT,
        photo_url VARCHAR(500),
        team_id INTEGER REFERENCES team(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create volleyball skills reference table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS volleyball_skills (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create skill ratings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS skill_ratings (
        id SERIAL PRIMARY KEY,
        player_id INTEGER REFERENCES player(id) ON DELETE CASCADE,
        skill_category VARCHAR(50) NOT NULL,
        skill_name VARCHAR(100) NOT NULL,
        skill_description TEXT,
        rating DECIMAL(3,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
        notes TEXT,
        rated_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(player_id, skill_name)
      );
    `);

    // Create development areas table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS development_areas (
        id SERIAL PRIMARY KEY,
        player_id INTEGER REFERENCES player(id) ON DELETE CASCADE,
        skill_category VARCHAR(50) NOT NULL,
        priority_level INTEGER CHECK (priority_level >= 1 AND priority_level <= 5),
        description TEXT,
        target_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create video attachments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS video_attachments (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        uploaded_by INTEGER REFERENCES users(id),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create note videos linking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS note_videos (
        id SERIAL PRIMARY KEY,
        player_id INTEGER REFERENCES player(id) ON DELETE CASCADE,
        video_id INTEGER REFERENCES video_attachments(id) ON DELETE CASCADE,
        note_type VARCHAR(50) NOT NULL CHECK (note_type IN ('skill_rating', 'development_area', 'general_note')),
        reference_id INTEGER,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create player comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS player_comments (
        id SERIAL PRIMARY KEY,
        player_id INTEGER REFERENCES player(id) ON DELETE CASCADE,
        reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN ('skill_rating', 'development_area', 'general_note')),
        reference_id INTEGER NOT NULL,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create player statistics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS player_statistics (
        id SERIAL PRIMARY KEY,
        player_id INTEGER REFERENCES player(id) ON DELETE CASCADE,
        stat_category VARCHAR(50) NOT NULL,
        stat_name VARCHAR(100) NOT NULL,
        stat_value DECIMAL(10,2) NOT NULL,
        stat_date DATE NOT NULL,
        game_type VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create team statistics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_statistics (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES team(id) ON DELETE CASCADE,
        stat_category VARCHAR(50) NOT NULL,
        stat_name VARCHAR(100) NOT NULL,
        stat_value DECIMAL(10,2) NOT NULL,
        stat_date DATE NOT NULL,
        game_type VARCHAR(50),
        opponent VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create schedule events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schedule_events (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES team(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('Practice', 'Scrimmage', 'Game', 'Tournament')),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        location VARCHAR(255),
        opponent VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_player_team_id ON player(team_id);
      CREATE INDEX IF NOT EXISTS idx_skill_ratings_player_id ON skill_ratings(player_id);
      CREATE INDEX IF NOT EXISTS idx_skill_ratings_category ON skill_ratings(skill_category);
      CREATE INDEX IF NOT EXISTS idx_team_created_by ON team(created_by);
      CREATE INDEX IF NOT EXISTS idx_development_areas_player_id ON development_areas(player_id);
      CREATE INDEX IF NOT EXISTS idx_schedule_events_team_id ON schedule_events(team_id);
      CREATE INDEX IF NOT EXISTS idx_schedule_events_date ON schedule_events(event_date);
      CREATE INDEX IF NOT EXISTS idx_team_users_team_id ON team_users(team_id);
      CREATE INDEX IF NOT EXISTS idx_team_users_user_id ON team_users(user_id);
      CREATE INDEX IF NOT EXISTS idx_player_comments_player_id ON player_comments(player_id);
      CREATE INDEX IF NOT EXISTS idx_player_statistics_player_id ON player_statistics(player_id);
      CREATE INDEX IF NOT EXISTS idx_team_statistics_team_id ON team_statistics(team_id);
      CREATE INDEX IF NOT EXISTS idx_note_videos_player_id ON note_videos(player_id);
      CREATE INDEX IF NOT EXISTS idx_note_videos_video_id ON note_videos(video_id);
    `);

    // Insert volleyball skills
    await pool.query(`
      INSERT INTO volleyball_skills (name, category, description) VALUES
      -- Technical Skills
      ('Serving Accuracy', 'Technical', 'Precision and consistency in serve placement'),
      ('Serving Power', 'Technical', 'Force and speed of serves'),
      ('Passing Accuracy', 'Technical', 'Precise ball control and platform passing'),
      ('Passing Reception', 'Technical', 'Receiving and controlling incoming serves and attacks'),
      ('Setting Precision', 'Technical', 'Accurate ball placement for attackers'),
      ('Spiking Technique', 'Technical', 'Attack form and execution'),
      ('Blocking Technique', 'Technical', 'Defensive blocking form and positioning'),
      ('Blocking Timing', 'Technical', 'Timing and reaction in blocking situations'),

      -- Physical Skills
      ('Vertical Jump', 'Physical', 'Maximum jumping height and power'),
      ('Speed', 'Physical', 'Court movement and reaction speed'),
      ('Agility', 'Physical', 'Quick direction changes and footwork'),
      ('Strength', 'Physical', 'Overall physical power and endurance'),
      ('Endurance', 'Physical', 'Cardiovascular fitness and stamina'),
      ('Flexibility', 'Physical', 'Range of motion and injury prevention'),

      -- Mental Skills
      ('Focus', 'Mental', 'Concentration and mental discipline'),
      ('Leadership', 'Mental', 'Team motivation and game management'),
      ('Communication', 'Mental', 'On-court verbal and non-verbal communication'),
      ('Mental Toughness', 'Mental', 'Resilience under pressure and adversity'),
      ('Game Awareness', 'Mental', 'Reading the game and anticipation'),

      -- Tactical Skills
      ('Court Positioning', 'Tactical', 'Understanding of court zones and movement'),
      ('Decision Making', 'Tactical', 'Quick strategic choices during play'),
      ('Team Chemistry', 'Tactical', 'Coordination and teamwork with other players'),
      ('Game Strategy', 'Tactical', 'Understanding and execution of game plans')
      ON CONFLICT (name) DO NOTHING;
    `);

    console.log('Database schema created successfully!');
    console.log('Tables created:');
    console.log('- users');
    console.log('- team');
    console.log('- team_users');
    console.log('- player');
    console.log('- volleyball_skills');
    console.log('- skill_ratings');
    console.log('- development_areas');
    console.log('- video_attachments');
    console.log('- note_videos');
    console.log('- player_comments');
    console.log('- player_statistics');
    console.log('- team_statistics');
    console.log('- schedule_events');
    console.log('- All performance indexes created');
    console.log('- 23 volleyball skills inserted');

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = initializeDatabase;
