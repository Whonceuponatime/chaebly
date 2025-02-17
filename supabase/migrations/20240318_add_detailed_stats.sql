-- Create enum for street
CREATE TYPE poker_street AS ENUM ('preflop', 'flop', 'turn', 'river');

-- Create table for detailed hand statistics
CREATE TABLE mendez_hand_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES mendez_players(id) ON DELETE CASCADE,
  session_id UUID REFERENCES mendez_sessions(id) ON DELETE CASCADE,
  street poker_street NOT NULL,
  position poker_position NOT NULL,
  -- Preflop stats
  vpip BOOLEAN DEFAULT false, -- Voluntarily Put money In Pot
  pfr BOOLEAN DEFAULT false,  -- PreFlop Raise
  three_bet BOOLEAN DEFAULT false,
  four_bet BOOLEAN DEFAULT false,
  -- Post-flop stats
  cbet BOOLEAN DEFAULT false, -- Continuation bet
  cbet_success BOOLEAN DEFAULT false,
  fold_to_cbet BOOLEAN DEFAULT false,
  -- General stats
  won_hand BOOLEAN DEFAULT false,
  won_amount INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create table for Flopzilla analysis
CREATE TABLE mendez_flopzilla_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hand_id UUID REFERENCES mendez_hand_stats(id) ON DELETE CASCADE,
  hole_cards VARCHAR(4) NOT NULL,
  board_cards VARCHAR(10), -- e.g., 'Ah,Kd,2c'
  equity DECIMAL(5,2),
  hand_range TEXT,
  suggested_action poker_action NOT NULL,
  actual_action poker_action,
  was_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create detailed statistics view
CREATE VIEW mendez_detailed_stats AS
SELECT 
  p.id,
  p.name,
  -- Preflop stats
  ROUND(COUNT(CASE WHEN hs.vpip THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as vpip_percentage,
  ROUND(COUNT(CASE WHEN hs.pfr THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as pfr_percentage,
  ROUND(COUNT(CASE WHEN hs.three_bet THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as three_bet_percentage,
  -- Post-flop stats
  ROUND(COUNT(CASE WHEN hs.cbet THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as cbet_percentage,
  ROUND(COUNT(CASE WHEN hs.cbet_success THEN 1 END) * 100.0 / NULLIF(COUNT(CASE WHEN hs.cbet THEN 1 END), 0), 2) as cbet_success_rate,
  ROUND(COUNT(CASE WHEN hs.fold_to_cbet THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as fold_to_cbet_percentage,
  -- Position-based stats
  ROUND(COUNT(CASE WHEN hs.position = 'Button' AND hs.won_hand THEN 1 END) * 100.0 / NULLIF(COUNT(CASE WHEN hs.position = 'Button' THEN 1 END), 0), 2) as btn_win_rate,
  ROUND(COUNT(CASE WHEN hs.position = 'Small Blind' AND hs.won_hand THEN 1 END) * 100.0 / NULLIF(COUNT(CASE WHEN hs.position = 'Small Blind' THEN 1 END), 0), 2) as sb_win_rate,
  ROUND(COUNT(CASE WHEN hs.position = 'Big Blind' AND hs.won_hand THEN 1 END) * 100.0 / NULLIF(COUNT(CASE WHEN hs.position = 'Big Blind' THEN 1 END), 0), 2) as bb_win_rate,
  -- Flopzilla accuracy
  ROUND(COUNT(CASE WHEN fa.was_correct THEN 1 END) * 100.0 / NULLIF(COUNT(fa.id), 0), 2) as flopzilla_accuracy,
  -- Profit metrics
  SUM(hs.won_amount) as total_profit,
  ROUND(AVG(hs.won_amount), 2) as avg_profit_per_hand
FROM mendez_players p
LEFT JOIN mendez_hand_stats hs ON p.id = hs.player_id
LEFT JOIN mendez_flopzilla_analysis fa ON hs.id = fa.hand_id
GROUP BY p.id, p.name;

-- Add RLS policies
ALTER TABLE mendez_hand_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE mendez_flopzilla_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to all authenticated users"
ON mendez_hand_stats FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow write access to admin only"
ON mendez_hand_stats FOR ALL
TO authenticated
USING (auth.email() = 'taebaek@gmail.com');

CREATE POLICY "Allow read access to all authenticated users"
ON mendez_flopzilla_analysis FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow write access to admin only"
ON mendez_flopzilla_analysis FOR ALL
TO authenticated
USING (auth.email() = 'taebaek@gmail.com');

-- Create indexes
CREATE INDEX idx_hand_stats_player_id ON mendez_hand_stats(player_id);
CREATE INDEX idx_hand_stats_session_id ON mendez_hand_stats(session_id);
CREATE INDEX idx_flopzilla_hand_id ON mendez_flopzilla_analysis(hand_id); 