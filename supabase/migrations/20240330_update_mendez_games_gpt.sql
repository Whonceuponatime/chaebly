-- Drop mendez_recommendation column if it exists
ALTER TABLE mendez_games 
  DROP COLUMN IF EXISTS mendez_recommendation;

-- Allow NULL values for gpt_decision and decision_reasoning
ALTER TABLE mendez_games 
  ALTER COLUMN gpt_decision DROP NOT NULL,
  ALTER COLUMN decision_reasoning DROP NOT NULL;

-- Add a check constraint to ensure gpt_decision is either NULL or a valid action
ALTER TABLE mendez_games
  ADD CONSTRAINT valid_gpt_decision 
  CHECK (gpt_decision IS NULL OR gpt_decision IN ('fold', 'call', 'raise'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_mendez_games_gpt_decision 
  ON mendez_games(gpt_decision);