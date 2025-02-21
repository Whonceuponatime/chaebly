-- Add VPIP and PFR count columns
ALTER TABLE mendez_player_history
ADD COLUMN IF NOT EXISTS vpip_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS pfr_count INT DEFAULT 0;

-- Update existing records to calculate counts from percentages
UPDATE mendez_player_history
SET 
  vpip_count = ROUND(vpip_percentage * total_hands / 100),
  pfr_count = ROUND(pfr_percentage * total_hands / 100);

-- Add comment to explain the columns
COMMENT ON COLUMN mendez_player_history.vpip_count IS 'Count of hands where player voluntarily put money in pot';
COMMENT ON COLUMN mendez_player_history.pfr_count IS 'Count of hands where player raised preflop'; 