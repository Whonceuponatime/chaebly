-- Drop existing table
DROP TABLE IF EXISTS mendez_games;

-- Recreate table with BB-based columns
CREATE TABLE mendez_games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    hand_id TEXT NOT NULL,
    street TEXT NOT NULL CHECK (street IN ('preflop', 'flop', 'turn', 'river')),
    players TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    hero_position TEXT NOT NULL,
    hero_cards TEXT NOT NULL,
    board_cards TEXT,
    pot_size_bb DECIMAL(10,2) NOT NULL,
    to_call_bb DECIMAL(10,2) NOT NULL,
    current_bet_bb DECIMAL(10,2) NOT NULL,
    active_players TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    action_on TEXT NOT NULL,
    last_action TEXT,
    last_bet_size_bb DECIMAL(10,2),
    effective_stack DECIMAL(10,2) NOT NULL DEFAULT 0,
    gpt_decision TEXT,
    decision_reasoning TEXT,
    final_action TEXT,
    positions JSONB DEFAULT '{}'::JSONB,
    player_stacks JSONB DEFAULT '{}'::JSONB,
    action_history JSONB[] DEFAULT ARRAY[]::JSONB[]
);

-- Add indexes
CREATE INDEX idx_mendez_games_hand_id ON mendez_games(hand_id);
CREATE INDEX idx_mendez_games_street ON mendez_games(street);
CREATE INDEX idx_mendez_games_created ON mendez_games(created_at);
CREATE INDEX idx_mendez_games_players ON mendez_games USING GIN(players);
CREATE INDEX idx_mendez_games_active_players ON mendez_games USING GIN(active_players);

-- Enable RLS
ALTER TABLE mendez_games ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
ON mendez_games FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for all users"
ON mendez_games FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON mendez_games TO authenticated;
GRANT INSERT ON mendez_games TO anon, authenticated; 