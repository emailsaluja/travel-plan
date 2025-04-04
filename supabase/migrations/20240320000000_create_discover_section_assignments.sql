-- Drop existing table and its dependencies
DROP TABLE IF EXISTS discover_section_assignments CASCADE;

-- Create discover_section_assignments table
CREATE TABLE discover_section_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    itinerary_id UUID NOT NULL REFERENCES user_itineraries(id) ON DELETE CASCADE,
    section_name TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(itinerary_id, section_name)
);

-- Create index for faster queries
CREATE INDEX idx_discover_section_assignments_section_name 
    ON discover_section_assignments(section_name);

CREATE INDEX idx_discover_section_assignments_display_order 
    ON discover_section_assignments(display_order);

-- Enable RLS and create policies
ALTER TABLE discover_section_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all authenticated users"
    ON discover_section_assignments
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to manage assignments"
    ON discover_section_assignments
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true); 