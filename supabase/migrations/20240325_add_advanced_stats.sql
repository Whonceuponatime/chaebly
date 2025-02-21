-- Add new columns to mendez_player_history for advanced statistics
ALTER TABLE mendez_player_history
ADD COLUMN IF NOT EXISTS total_bluffs INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS successful_bluffs INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS check_raise_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS check_raise_success INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS turn_call_success INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS turn_call_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS half_pot_bets INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS half_pot_success INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS full_pot_bets INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS full_pot_success INT DEFAULT 0;

-- Create a view for advanced statistics analysis
CREATE OR REPLACE VIEW mendez_advanced_stats AS
SELECT 
    player_name,
    total_hands,
    CASE 
        WHEN total_hands >= 2000 THEN true 
        ELSE false 
    END as has_sufficient_sample,
    ROUND((successful_bluffs::FLOAT / NULLIF(total_bluffs, 0) * 100)::numeric, 2) as bluff_success_rate,
    ROUND((check_raise_success::FLOAT / NULLIF(check_raise_attempts, 0) * 100)::numeric, 2) as check_raise_success_rate,
    ROUND((turn_call_success::FLOAT / NULLIF(turn_call_attempts, 0) * 100)::numeric, 2) as turn_call_success_rate,
    ROUND((half_pot_success::FLOAT / NULLIF(half_pot_bets, 0) * 100)::numeric, 2) as half_pot_success_rate,
    ROUND((full_pot_success::FLOAT / NULLIF(full_pot_bets, 0) * 100)::numeric, 2) as full_pot_success_rate
FROM mendez_player_history;

-- Grant permissions
GRANT ALL ON mendez_advanced_stats TO authenticated; 