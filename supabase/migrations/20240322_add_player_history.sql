-- Create player history table
CREATE TABLE mendez_player_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    total_hands INT DEFAULT 0,
    showdown_hands INT DEFAULT 0,
    hands_won INT DEFAULT 0,
    aggression_factor FLOAT DEFAULT 0, -- (raise + bet) / call ratio
    vpip_percentage FLOAT DEFAULT 0, -- Voluntarily Put money In Pot
    pfr_percentage FLOAT DEFAULT 0, -- Pre-Flop Raise
    showdown_hands_history JSONB[], -- Array of hand histories at showdown
    betting_patterns JSONB, -- Recorded betting patterns in different situations
    position_tendencies JSONB, -- How they play in different positions
    last_seen_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes
CREATE INDEX idx_player_history_name ON mendez_player_history(player_name);
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