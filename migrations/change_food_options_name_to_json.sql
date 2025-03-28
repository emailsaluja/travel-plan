-- Change name column type from text to JSON in user_itinerary_day_food_options table
ALTER TABLE user_itinerary_day_food_options
ALTER COLUMN name TYPE JSONB USING name::jsonb;

-- Update existing rows to convert text to JSON format
UPDATE user_itinerary_day_food_options
SET name = jsonb_build_object('text', name)
WHERE name IS NOT NULL; 