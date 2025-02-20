-- Add positions and player_stacks columns to mendez_games table
ALTER TABLE mendez_games
ADD COLUMN IF NOT EXISTS positions JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS player_stacks JSONB DEFAULT '{}'::JSONB;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_mendez_games_positions ON mendez_games USING GIN(positions);
CREATE INDEX IF NOT EXISTS idx_mendez_games_player_stacks ON mendez_games USING GIN(player_stacks);

-- Add comments to explain the structure
COMMENT ON COLUMN mendez_games.positions IS 'JSON object mapping player names to their positions';
COMMENT ON COLUMN mendez_games.player_stacks IS 'JSON object mapping player names to their stack sizes in BB'; 