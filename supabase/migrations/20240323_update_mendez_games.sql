-- Drop existing table
DROP TABLE IF EXISTS mendez_games;

-- Create updated table with street-specific actions
CREATE TABLE mendez_games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    hand_id UUID NOT NULL, -- To group actions from the same hand
    street TEXT NOT NULL CHECK (street IN ('preflop', 'flop', 'turn', 'river')),
    players TEXT[] NOT NULL, -- All players in the hand
    hero_position TEXT NOT NULL, -- Hero's position
    hero_cards TEXT NOT NULL, -- Hero's hole cards
    board_cards TEXT, -- Current board cards (null for preflop)
    pot_size INTEGER NOT NULL,
    to_call INTEGER NOT NULL, -- Amount needed to call
    current_bet INTEGER NOT NULL, -- Current bet size
    active_players TEXT[] NOT NULL, -- Players still in the hand
    action_on TEXT NOT NULL, -- Player whose turn it is
    last_action TEXT, -- Last action taken by previous player
    last_bet_size INTEGER, -- Size of the last bet/raise
    mendez_recommendation TEXT NOT NULL, -- Mendez's recommended action
    final_action TEXT, -- The action that was actually taken
    notes TEXT -- Any additional notes or observations
);

-- Add indexes
CREATE INDEX idx_mendez_games_hand_id ON mendez_games(hand_id);
CREATE INDEX idx_mendez_games_street ON mendez_games(street);
CREATE INDEX idx_mendez_games_created ON mendez_games(created_at);

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