-- Create table for storing individual games
CREATE TABLE mendez_games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    player_name VARCHAR(255) NOT NULL,
    hand_cards VARCHAR(4) NOT NULL,
    board_cards VARCHAR(10) NOT NULL,
    pot_size INTEGER NOT NULL,
    bet_size INTEGER NOT NULL,
    action_taken VARCHAR(10) NOT NULL,
    flopzilla_recommendation VARCHAR(10) NOT NULL,
    result VARCHAR(10) NOT NULL,
    profit_loss INTEGER NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX idx_mendez_games_created_at ON mendez_games(created_at);
CREATE INDEX idx_mendez_games_player_name ON mendez_games(player_name);
CREATE INDEX idx_mendez_games_result ON mendez_games(result);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admin read access" ON mendez_games;
DROP POLICY IF EXISTS "Allow public insert access" ON mendez_games;
DROP POLICY IF EXISTS "Allow anon insert access" ON mendez_games;

-- Disable RLS temporarily to clean up
ALTER TABLE mendez_games DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE mendez_games ENABLE ROW LEVEL SECURITY;

-- Create policies
-- 1. Admin can read all data
CREATE POLICY "Allow admin read access"
ON mendez_games FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = 'taebaek@gmail.com');

-- 2. Anyone can insert data (both authenticated and anonymous)
CREATE POLICY "Allow anon insert access"
ON mendez_games FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON mendez_games TO anon;
GRANT ALL ON mendez_games TO authenticated;

-- Ensure the UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 
