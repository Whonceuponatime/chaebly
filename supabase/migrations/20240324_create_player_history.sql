-- Create player history table
CREATE TABLE mendez_player_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    total_hands INT DEFAULT 0,
    showdown_hands INT DEFAULT 0,
    hands_won INT DEFAULT 0,
    aggression_factor FLOAT DEFAULT 0,
    vpip_percentage FLOAT DEFAULT 0,
    pfr_percentage FLOAT DEFAULT 0,
    showdown_hands_history JSONB[] DEFAULT ARRAY[]::JSONB[],
    betting_patterns JSONB DEFAULT '{}'::JSONB,
    position_tendencies JSONB DEFAULT '{}'::JSONB,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add unique constraint on player_name
CREATE UNIQUE INDEX idx_player_history_name ON mendez_player_history(player_name);

-- Add index for last_seen_at for efficient querying
CREATE INDEX idx_player_history_last_seen ON mendez_player_history(last_seen_at);

-- Enable RLS
ALTER TABLE mendez_player_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
ON mendez_player_history FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert/update for authenticated users"
ON mendez_player_history FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON mendez_player_history TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 