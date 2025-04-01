-- Add manual_discover column to user_itinerary_destinations
ALTER TABLE user_itinerary_destinations
ADD COLUMN manual_discover text;

-- Update existing records to use current discover values as manual_discover
UPDATE user_itinerary_destinations
SET manual_discover = discover
WHERE discover IS NOT NULL AND manual_discover IS NULL; 