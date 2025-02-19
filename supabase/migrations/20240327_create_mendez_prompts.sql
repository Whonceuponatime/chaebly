-- Create table for managing ChatGPT prompts
CREATE TABLE mendez_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prompt_text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g., 'preflop', 'flop', 'turn', 'river', 'general'
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    success_rate FLOAT DEFAULT 0.0,
    total_uses INTEGER DEFAULT 0,
    successful_uses INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::JSONB -- For storing additional configuration or parameters
);

-- Add indexes
CREATE INDEX idx_prompts_category ON mendez_prompts(category);
CREATE INDEX idx_prompts_is_active ON mendez_prompts(is_active);
CREATE INDEX idx_prompts_success_rate ON mendez_prompts(success_rate);

-- Add a trigger to update updated_at
CREATE OR REPLACE FUNCTION update_mendez_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mendez_prompts_updated_at
    BEFORE UPDATE ON mendez_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_mendez_prompts_updated_at();

-- Enable RLS
ALTER TABLE mendez_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
ON mendez_prompts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert/update/delete for admin"
ON mendez_prompts FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'taebaek@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'taebaek@gmail.com');

-- Grant permissions
GRANT ALL ON mendez_prompts TO authenticated; 