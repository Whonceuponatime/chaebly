-- Drop mendez_recommendation column
ALTER TABLE mendez_games 
  DROP COLUMN IF EXISTS mendez_recommendation;

-- Allow NULL values for gpt_decision
ALTER TABLE mendez_games 
  ALTER COLUMN gpt_decision DROP NOT NULL;

-- Add a check constraint to ensure gpt_decision is either NULL or a valid action
ALTER TABLE mendez_games
  ADD CONSTRAINT valid_gpt_decision 
  CHECK (gpt_decision IS NULL OR gpt_decision IN ('fold', 'call', 'raise'));