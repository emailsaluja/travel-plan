-- Create premium_itineraries table
CREATE TABLE IF NOT EXISTS premium_itineraries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    base_itinerary_id UUID REFERENCES user_itineraries(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    inclusions TEXT[] NOT NULL,
    exclusions TEXT[] NOT NULL,
    terms_and_conditions TEXT NOT NULL,
    cancellation_policy TEXT NOT NULL,
    featured_image_url TEXT,
    gallery_image_urls TEXT[],
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_premium_itineraries_user_id ON premium_itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_itineraries_base_itinerary_id ON premium_itineraries(base_itinerary_id);
CREATE INDEX IF NOT EXISTS idx_premium_itineraries_status ON premium_itineraries(status);
CREATE INDEX IF NOT EXISTS idx_premium_itineraries_created_at ON premium_itineraries(created_at DESC);

-- Enable Row Level Security
ALTER TABLE premium_itineraries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view published premium itineraries"
    ON premium_itineraries FOR SELECT
    USING (status = 'published' OR auth.uid() = user_id);

CREATE POLICY "Users can create their own premium itineraries"
    ON premium_itineraries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own premium itineraries"
    ON premium_itineraries FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own premium itineraries"
    ON premium_itineraries FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_premium_itineraries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_premium_itineraries_updated_at
    BEFORE UPDATE ON premium_itineraries
    FOR EACH ROW
    EXECUTE FUNCTION update_premium_itineraries_updated_at(); 