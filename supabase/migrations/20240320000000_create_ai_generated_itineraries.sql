-- Create AI generated itineraries table
CREATE TABLE IF NOT EXISTS ai_generated_itineraries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    country TEXT NOT NULL,
    duration INTEGER NOT NULL,
    preferences JSONB,
    generated_itinerary JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_generated_itineraries_user_id ON ai_generated_itineraries(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_ai_generated_itineraries_updated_at
    BEFORE UPDATE ON ai_generated_itineraries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE ai_generated_itineraries ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own AI-generated itineraries
CREATE POLICY "Users can view their own AI-generated itineraries"
    ON ai_generated_itineraries
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy to allow users to insert their own AI-generated itineraries
CREATE POLICY "Users can insert their own AI-generated itineraries"
    ON ai_generated_itineraries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own AI-generated itineraries
CREATE POLICY "Users can update their own AI-generated itineraries"
    ON ai_generated_itineraries
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own AI-generated itineraries
CREATE POLICY "Users can delete their own AI-generated itineraries"
    ON ai_generated_itineraries
    FOR DELETE
    USING (auth.uid() = user_id); 