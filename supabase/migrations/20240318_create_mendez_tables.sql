-- Create enum for player styles
CREATE TYPE player_style AS ENUM ('Aggressive', 'Passive', 'Balanced', 'Unknown');

-- Create enum for poker positions
CREATE TYPE poker_position AS ENUM ('Button', 'Small Blind', 'Big Blind', 'UTG', 'MP', 'CO');

-- Create enum for poker actions
CREATE TYPE poker_action AS ENUM ('fold', 'check', 'call', 'raise', 'all-in');

-- Create table for tracking players
CREATE TABLE mendez_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  style player_style DEFAULT 'Unknown',
  aggressive_percentage INT CHECK (aggressive_percentage BETWEEN 0 AND 100),
  passive_percentage INT CHECK (passive_percentage BETWEEN 0 AND 100),
  total_hands INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  total_losses INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create table for tracking player actions
CREATE TABLE mendez_player_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES mendez_players(id) ON DELETE CASCADE,
  action poker_action NOT NULL,
  position poker_position NOT NULL,
  hand VARCHAR(4), -- e.g., 'AKs', 'JTs', 'AA'
  stack_size INT NOT NULL,
  pot_size INT NOT NULL,
  is_winner BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create table for AI suggestions
CREATE TABLE mendez_ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES mendez_players(id) ON DELETE CASCADE,
  hand VARCHAR(4) NOT NULL,
  position poker_position NOT NULL,
  suggested_action poker_action NOT NULL,
  reasoning TEXT NOT NULL,
  was_followed BOOLEAN,
  result_if_followed TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create table for session statistics
CREATE TABLE mendez_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  end_time TIMESTAMP WITH TIME ZONE,
  total_hands INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  total_losses INT DEFAULT 0,
  profit_loss INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create view for player statistics
CREATE VIEW mendez_player_stats AS
SELECT 
  p.id,
  p.name,
  p.style,
  p.total_hands,
  p.total_wins,
  p.total_losses,
  ROUND(CAST(p.total_wins AS DECIMAL) / NULLIF(p.total_hands, 0) * 100, 2) as win_rate,
  COUNT(pa.id) as total_actions,
  COUNT(CASE WHEN pa.action = 'raise' OR pa.action = 'all-in' THEN 1 END) as aggressive_actions,
  COUNT(CASE WHEN pa.action = 'call' OR pa.action = 'check' THEN 1 END) as passive_actions,
  COUNT(CASE WHEN pa.is_winner = true THEN 1 END) as hands_won
FROM mendez_players p
LEFT JOIN mendez_player_actions pa ON p.id = pa.player_id
GROUP BY p.id, p.name, p.style, p.total_hands, p.total_wins, p.total_losses;

-- Create function to update player statistics
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update player statistics based on the new action
  UPDATE mendez_players
  SET 
    total_hands = total_hands + 1,
    aggressive_percentage = (
      SELECT ROUND(COUNT(CASE WHEN action IN ('raise', 'all-in') THEN 1 END) * 100.0 / COUNT(*))
      FROM mendez_player_actions
      WHERE player_id = NEW.player_id
    ),
    passive_percentage = (
      SELECT ROUND(COUNT(CASE WHEN action IN ('call', 'check') THEN 1 END) * 100.0 / COUNT(*))
      FROM mendez_player_actions
      WHERE player_id = NEW.player_id
    ),
    updated_at = NOW()
  WHERE id = NEW.player_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating player statistics
CREATE TRIGGER update_player_stats_trigger
AFTER INSERT ON mendez_player_actions
FOR EACH ROW
EXECUTE FUNCTION update_player_stats();

-- Create indexes for better query performance
CREATE INDEX idx_player_actions_player_id ON mendez_player_actions(player_id);
CREATE INDEX idx_ai_suggestions_player_id ON mendez_ai_suggestions(player_id);
CREATE INDEX idx_player_actions_created_at ON mendez_player_actions(created_at);
CREATE INDEX idx_players_style ON mendez_players(style);

-- Add RLS policies
ALTER TABLE mendez_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE mendez_player_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mendez_ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mendez_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to all authenticated users"
ON mendez_players FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow write access to admin only"
ON mendez_players FOR ALL
TO authenticated
USING (auth.email() = 'taebaek@gmail.com');

-- Repeat similar policies for other tables
CREATE POLICY "Allow read access to all authenticated users"
ON mendez_player_actions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow write access to admin only"
ON mendez_player_actions FOR ALL
TO authenticated
USING (auth.email() = 'taebaek@gmail.com');

CREATE POLICY "Allow read access to all authenticated users"
ON mendez_ai_suggestions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow write access to admin only"
ON mendez_ai_suggestions FOR ALL
TO authenticated
USING (auth.email() = 'taebaek@gmail.com');

CREATE POLICY "Allow read access to all authenticated users"
ON mendez_sessions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow write access to admin only"
ON mendez_sessions FOR ALL
TO authenticated
USING (auth.email() = 'taebaek@gmail.com'); 