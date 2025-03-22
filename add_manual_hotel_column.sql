-- Add manual_hotel column to user_itinerary_destinations
ALTER TABLE user_itinerary_destinations
ADD COLUMN manual_hotel text;

-- Update existing records to use current hotel values as manual_hotel
UPDATE user_itinerary_destinations
SET manual_hotel = hotel
WHERE hotel IS NOT NULL AND manual_hotel IS NULL; 