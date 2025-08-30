-- Phase 10: Statistics System Database Schema

-- Player statistics table
CREATE TABLE IF NOT EXISTS player_statistics (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES player(id) ON DELETE CASCADE,
  stat_category VARCHAR(50) NOT NULL, -- 'offense', 'defense', 'serving', 'setting'
  stat_name VARCHAR(100) NOT NULL,    -- 'kills', 'digs', 'aces', 'assists'
  stat_value DECIMAL(10,3) NOT NULL,  -- Statistical value
  stat_date DATE NOT NULL,            -- Date of performance
  game_type VARCHAR(50),              -- 'practice', 'scrimmage', 'match'
  opponent VARCHAR(100),              -- Opponent team name
  set_number INTEGER,                 -- Set number within match
  notes TEXT,                         -- Additional context
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team statistics table
CREATE TABLE IF NOT EXISTS team_statistics (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES team(id) ON DELETE CASCADE,
  stat_category VARCHAR(50) NOT NULL,
  stat_name VARCHAR(100) NOT NULL,
  stat_value DECIMAL(10,3) NOT NULL,
  stat_date DATE NOT NULL,
  game_type VARCHAR(50),
  opponent VARCHAR(100),
  set_number INTEGER,               -- Set number within match
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_statistics_player_id ON player_statistics(player_id);
CREATE INDEX IF NOT EXISTS idx_player_statistics_date ON player_statistics(stat_date);
CREATE INDEX IF NOT EXISTS idx_player_statistics_category ON player_statistics(stat_category);
CREATE INDEX IF NOT EXISTS idx_team_statistics_team_id ON team_statistics(team_id);
CREATE INDEX IF NOT EXISTS idx_team_statistics_date ON team_statistics(stat_date);
CREATE INDEX IF NOT EXISTS idx_team_statistics_category ON team_statistics(stat_category);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for both tables
DROP TRIGGER IF EXISTS update_player_statistics_updated_at ON player_statistics;
CREATE TRIGGER update_player_statistics_updated_at
    BEFORE UPDATE ON player_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_statistics_updated_at ON team_statistics;
CREATE TRIGGER update_team_statistics_updated_at
    BEFORE UPDATE ON team_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
