-- Add day_overview column to user_itinerary_day_notes table
ALTER TABLE user_itinerary_day_notes
ADD COLUMN day_overview text;

-- Initialize the day_overview column with empty string for existing records
UPDATE user_itinerary_day_notes
SET day_overview = ''
WHERE day_overview IS NULL; 