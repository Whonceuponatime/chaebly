-- First, add new columns
ALTER TABLE mendez_games
ADD COLUMN pot_size_bb INTEGER,
ADD COLUMN to_call_bb INTEGER,
ADD COLUMN current_bet_bb INTEGER,
ADD COLUMN last_bet_size_bb INTEGER;

-- Copy data from old columns to new ones (if there's existing data)
UPDATE mendez_games
SET pot_size_bb = pot_size,
    to_call_bb = to_call,
    current_bet_bb = current_bet,
    last_bet_size_bb = last_bet_size;

-- Drop old columns
ALTER TABLE mendez_games
DROP COLUMN pot_size,
DROP COLUMN to_call,
DROP COLUMN current_bet,
DROP COLUMN last_bet_size;

-- Make new columns not nullable where needed
ALTER TABLE mendez_games
ALTER COLUMN pot_size_bb SET NOT NULL,
ALTER COLUMN to_call_bb SET NOT NULL,
ALTER COLUMN current_bet_bb SET NOT NULL; 