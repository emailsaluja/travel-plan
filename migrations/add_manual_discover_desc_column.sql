-- Add manual_discover_desc column to user_itinerary_destinations
ALTER TABLE user_itinerary_destinations
ADD COLUMN manual_discover_desc text;

-- Update existing records to use current discover values as manual_discover_desc
UPDATE user_itinerary_destinations
SET manual_discover_desc = discover
WHERE discover IS NOT NULL AND manual_discover_desc IS NULL; 