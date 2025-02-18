-- Drop existing policies
DROP POLICY IF EXISTS "Allow admin read access" ON mendez_games;
DROP POLICY IF EXISTS "Allow anon insert access" ON mendez_games;

-- Disable RLS temporarily
ALTER TABLE mendez_games DISABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
ON mendez_games FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for all users"
ON mendez_games FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE mendez_games ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON mendez_games TO authenticated;
GRANT INSERT ON mendez_games TO anon, authenticated; 