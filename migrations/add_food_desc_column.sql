-- Add food_desc column to user_itinerary_destinations table
ALTER TABLE user_itinerary_destinations 
ADD COLUMN food_desc TEXT;

-- Update existing rows to copy food description from food column
UPDATE user_itinerary_destinations
SET food_desc = food
WHERE food IS NOT NULL AND food != ''; 