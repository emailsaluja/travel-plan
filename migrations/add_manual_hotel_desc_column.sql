-- Add manual_hotel_desc column to user_itinerary_destinations
ALTER TABLE user_itinerary_destinations
ADD COLUMN manual_hotel_desc text;

-- Update existing records to use current hotel values as manual_hotel_desc
UPDATE user_itinerary_destinations
SET manual_hotel_desc = hotel
WHERE hotel IS NOT NULL AND manual_hotel_desc IS NULL; 