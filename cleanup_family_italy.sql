-- Cleanup script for Family Italy 7-day itinerary data
DO $$
BEGIN
    -- First, delete all related data from child tables
    DELETE FROM user_itinerary_day_notes
    WHERE itinerary_id IN (
        SELECT id FROM user_itineraries 
        WHERE trip_name = 'Family Adventure in Italy: Rome, Florence & Venice'
    );

    DELETE FROM user_itinerary_day_attractions
    WHERE itinerary_id IN (
        SELECT id FROM user_itineraries 
        WHERE trip_name = 'Family Adventure in Italy: Rome, Florence & Venice'
    );

    DELETE FROM user_itinerary_day_hotels
    WHERE itinerary_id IN (
        SELECT id FROM user_itineraries 
        WHERE trip_name = 'Family Adventure in Italy: Rome, Florence & Venice'
    );

    DELETE FROM user_itinerary_destinations
    WHERE itinerary_id IN (
        SELECT id FROM user_itineraries 
        WHERE trip_name = 'Family Adventure in Italy: Rome, Florence & Venice'
    );

    -- Finally, delete the main itinerary
    DELETE FROM user_itineraries
    WHERE trip_name = 'Family Adventure in Italy: Rome, Florence & Venice';

    -- Output the number of rows that were deleted
    RAISE NOTICE 'Cleanup completed successfully';
END $$; 