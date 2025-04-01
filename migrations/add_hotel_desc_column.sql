-- Add hotel_desc column to user_itinerary_day_hotels table
ALTER TABLE user_itinerary_day_hotels
ADD COLUMN hotel_desc text;

-- Initialize the hotel_desc column with the existing hotel values where appropriate
UPDATE user_itinerary_day_hotels
SET hotel_desc = hotel
WHERE hotel IS NOT NULL; 