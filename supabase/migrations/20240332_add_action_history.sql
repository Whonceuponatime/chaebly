-- Add action_history column to mendez_games table
ALTER TABLE mendez_games
ADD COLUMN IF NOT EXISTS action_history JSONB[] DEFAULT ARRAY[]::JSONB[];

-- Add index for faster queries on action_history
CREATE INDEX IF NOT EXISTS idx_mendez_games_action_history ON mendez_games USING GIN(action_history);

-- Add comment to explain the structure
COMMENT ON COLUMN mendez_games.action_history IS 'Array of action history entries with structure: {player: string, position: string, street: string, action: string, amount: number, timestamp: string}'; 