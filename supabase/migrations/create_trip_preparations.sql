-- Create the trip_preparations table
CREATE TABLE trip_preparations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    itinerary_id UUID NOT NULL REFERENCES user_itineraries(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('documents', 'packing', 'bookings', 'health', 'other')),
    item TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster lookups by itinerary_id
CREATE INDEX trip_preparations_itinerary_id_idx ON trip_preparations(itinerary_id);

-- Enable Row Level Security
ALTER TABLE trip_preparations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own trip preparations"
    ON trip_preparations
    FOR SELECT
    USING (
        itinerary_id IN (
            SELECT id FROM user_itineraries
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own trip preparations"
    ON trip_preparations
    FOR INSERT
    WITH CHECK (
        itinerary_id IN (
            SELECT id FROM user_itineraries
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own trip preparations"
    ON trip_preparations
    FOR UPDATE
    USING (
        itinerary_id IN (
            SELECT id FROM user_itineraries
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own trip preparations"
    ON trip_preparations
    FOR DELETE
    USING (
        itinerary_id IN (
            SELECT id FROM user_itineraries
            WHERE user_id = auth.uid()
        )
    );

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_trip_preparations_updated_at
    BEFORE UPDATE ON trip_preparations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 