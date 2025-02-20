-- Add all required columns
ALTER TABLE mendez_games
ADD COLUMN IF NOT EXISTS players TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS player_stacks JSONB NOT NULL DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS effective_stack DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Now update effective_stack based on player_stacks
UPDATE mendez_games
SET effective_stack = (
  SELECT COALESCE(MIN(value::decimal), 0)
  FROM jsonb_each_text(player_stacks) AS ps(key, value)
)
WHERE effective_stack = 0;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mendez_games_effective_stack ON mendez_games(effective_stack);
CREATE INDEX IF NOT EXISTS idx_mendez_games_players ON mendez_games USING GIN(players); 