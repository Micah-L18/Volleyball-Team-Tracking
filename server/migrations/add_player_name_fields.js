const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function migratePlayerNames() {
  const client = await pool.connect();
  
  try {
    console.log('Starting player name migration...');
    
    // Step 1: Add new columns
    console.log('Adding first_name and last_name columns...');
    await client.query(`
      ALTER TABLE player 
      ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(255)
    `);
    
    // Step 2: Migrate existing names to first_name (keep full name in first_name for now)
    console.log('Migrating existing names to first_name...');
    await client.query(`
      UPDATE player 
      SET first_name = name 
      WHERE first_name IS NULL AND name IS NOT NULL
    `);
    
    // Step 3: Make first_name NOT NULL (last_name can be null as per requirement)
    console.log('Setting constraints...');
    await client.query(`
      ALTER TABLE player 
      ALTER COLUMN first_name SET NOT NULL
    `);
    
    console.log('Migration completed successfully!');
    
    // Verify the migration
    const result = await client.query('SELECT COUNT(*) as count FROM player WHERE first_name IS NOT NULL');
    console.log(`Players with first_name populated: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migratePlayerNames()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migratePlayerNames };
