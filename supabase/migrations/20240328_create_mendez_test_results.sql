-- Drop existing table if it exists
DROP TABLE IF EXISTS mendez_test_results;

-- Create table for storing test results
CREATE TABLE mendez_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    test_session_id UUID NOT NULL,
    hand_id TEXT NOT NULL,
    street TEXT NOT NULL,
    hero_position TEXT NOT NULL,
    hero_cards TEXT NOT NULL,
    board_cards TEXT,
    pot_size_bb DECIMAL(10,2) NOT NULL,
    to_call_bb DECIMAL(10,2) NOT NULL,
    gpt_decision TEXT NOT NULL,
    decision_reasoning TEXT NOT NULL,
    gto_context TEXT NOT NULL,
    player_stats JSONB,
    is_correct BOOLEAN,
    error_type TEXT,
    notes TEXT,
    test_scenario TEXT NOT NULL -- e.g., 'UTG_with_premium', 'BTN_steal', etc.
);

-- Add indexes
CREATE INDEX idx_test_results_session ON mendez_test_results(test_session_id);
CREATE INDEX idx_test_results_scenario ON mendez_test_results(test_scenario);
CREATE INDEX idx_test_results_correct ON mendez_test_results(is_correct);
CREATE INDEX idx_test_results_created ON mendez_test_results(created_at);
CREATE INDEX idx_test_results_hand_id ON mendez_test_results(hand_id);

-- Enable RLS
ALTER TABLE mendez_test_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
ON mendez_test_results FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON mendez_test_results FOR INSERT
TO authenticated
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON mendez_test_results TO authenticated; 