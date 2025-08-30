const pool = require('../models/db');

const createStatisticsTables = async () => {
  try {
    console.log('Creating statistics tables...');

    // Create player statistics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS player_statistics (
        id SERIAL PRIMARY KEY,
        player_id INTEGER NOT NULL,
        team_id INTEGER NOT NULL,
        stat_category VARCHAR(50) NOT NULL,
        stat_name VARCHAR(100) NOT NULL,
        stat_value DECIMAL(10,3) NOT NULL,
        stat_date DATE NOT NULL,
        game_type VARCHAR(20),
        opponent VARCHAR(100),
        set_number INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create team statistics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_statistics (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL,
        stat_category VARCHAR(50) NOT NULL,
        stat_name VARCHAR(100) NOT NULL,
        stat_value DECIMAL(10,3) NOT NULL,
        stat_date DATE NOT NULL,
        game_type VARCHAR(20),
        opponent VARCHAR(100),
        set_number INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Statistics tables created successfully!');
    console.log('Created tables:');
    console.log('- player_statistics');
    console.log('- team_statistics');

  } catch (error) {
    console.error('❌ Error creating statistics tables:', error);
    throw error;
  }
};

// Run the migration if this file is executed directly
if (require.main === module) {
  createStatisticsTables()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createStatisticsTables;
