-- Add new columns to mendez_player_history for advanced statistics
ALTER TABLE mendez_player_history
ADD COLUMN IF NOT EXISTS bb_per_100_hands FLOAT DEFAULT 0,
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
    bb_per_100_hands,
    ROUND((successful_bluffs::FLOAT / NULLIF(total_bluffs, 0) * 100)::numeric, 2) as bluff_success_rate,
    ROUND((check_raise_success::FLOAT / NULLIF(check_raise_attempts, 0) * 100)::numeric, 2) as check_raise_success_rate,
    ROUND((turn_call_success::FLOAT / NULLIF(turn_call_attempts, 0) * 100)::numeric, 2) as turn_call_success_rate,
    ROUND((half_pot_success::FLOAT / NULLIF(half_pot_bets, 0) * 100)::numeric, 2) as half_pot_success_rate,
    ROUND((full_pot_success::FLOAT / NULLIF(full_pot_bets, 0) * 100)::numeric, 2) as full_pot_success_rate
FROM mendez_player_history;

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_bb_per_100_hands_trigger ON mendez_games;
DROP FUNCTION IF EXISTS update_bb_per_100_hands();

-- Create function to update BB/100 calculation
CREATE OR REPLACE FUNCTION update_bb_per_100_hands()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stats for each active player in the hand
    IF NEW.active_players IS NOT NULL THEN
        UPDATE mendez_player_history
        SET bb_per_100_hands = (
            SELECT COALESCE(SUM(mg.pot_size_bb) * 100.0 / NULLIF(COUNT(DISTINCT mg.hand_id), 0), 0)
            FROM mendez_games mg
            WHERE mg.hand_id IN (
                SELECT DISTINCT hand_id 
                FROM mendez_games 
                WHERE action_on = mendez_player_history.player_name
            )
        )
        WHERE player_name = ANY(NEW.active_players);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for BB/100 updates
CREATE TRIGGER update_bb_per_100_hands_trigger
AFTER INSERT OR UPDATE ON mendez_games
FOR EACH ROW
EXECUTE FUNCTION update_bb_per_100_hands();

-- Grant permissions
GRANT ALL ON mendez_advanced_stats TO authenticated; 