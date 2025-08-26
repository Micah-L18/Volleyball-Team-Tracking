-- Phase 8: Attendance & Availability Tables

-- Attendance tracking table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES player(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'excused', 'late')),
    notes TEXT,
    marked_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, player_id)
);

-- Availability tracking table
CREATE TABLE IF NOT EXISTS availability (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES player(id) ON DELETE CASCADE,
    available BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, player_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_player_id ON attendance(player_id);
CREATE INDEX IF NOT EXISTS idx_availability_event_id ON availability(event_id);
CREATE INDEX IF NOT EXISTS idx_availability_player_id ON availability(player_id);

-- Update function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_updated_at BEFORE UPDATE ON availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
