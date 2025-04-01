-- Create ai_itineraries table
CREATE TABLE IF NOT EXISTS ai_itineraries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    country TEXT NOT NULL,
    duration INTEGER NOT NULL,
    preferences JSONB NOT NULL,
    trip_name TEXT NOT NULL,
    destinations JSONB NOT NULL,
    generated_itinerary JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_user_id ON ai_itineraries(user_id);

-- Create index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_created_at ON ai_itineraries(created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE ai_itineraries ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own AI itineraries
CREATE POLICY "Users can view their own AI itineraries"
    ON ai_itineraries FOR SELECT
    USING (auth.uid() = user_id);

-- Policy to allow users to insert their own AI itineraries
CREATE POLICY "Users can insert their own AI itineraries"
    ON ai_itineraries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own AI itineraries
CREATE POLICY "Users can update their own AI itineraries"
    ON ai_itineraries FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own AI itineraries
CREATE POLICY "Users can delete their own AI itineraries"
    ON ai_itineraries FOR DELETE
    USING (auth.uid() = user_id); 