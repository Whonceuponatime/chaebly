-- Add players column to mendez_games
ALTER TABLE mendez_games
ADD COLUMN players TEXT[] NOT NULL DEFAULT '{}';

-- Add player_stacks column to mendez_games
ALTER TABLE mendez_games
ADD COLUMN player_stacks JSONB NOT NULL DEFAULT '{}'::JSONB;

-- Add effective_stack column to mendez_games
ALTER TABLE mendez_games
ADD COLUMN effective_stack INTEGER NOT NULL DEFAULT 0; 