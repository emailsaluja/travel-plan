-- Get itinerary data and generate INSERT statements
WITH itinerary_data AS (
    SELECT id::uuid, trip_name::text, country::text, start_date::date, duration::integer, passengers::integer, created_at::timestamp, updated_at::timestamp, is_private::boolean, tags::jsonb,
           NULL::text as destination, NULL::integer as nights, NULL::text as discover, NULL::text as transport, NULL::text as notes, NULL::integer as order_index, NULL::text as food,
           NULL::text as name, NULL::text as description, NULL::numeric as rating, NULL::text as price_level, NULL::boolean as is_manually_added, NULL::boolean as is_selected, NULL::uuid as user_id,
           NULL::integer as day_index, NULL::text as hotel, NULL::jsonb as attractions
    FROM user_itineraries 
    WHERE id = '7de67e25-5d99-46af-98a7-d9c8eece04cb'
),
destination_data AS (
    SELECT NULL::uuid as id, NULL::text as trip_name, NULL::text as country, NULL::date as start_date, NULL::integer as duration, NULL::integer as passengers, created_at::timestamp, NULL::timestamp as updated_at, NULL::boolean as is_private, NULL::jsonb as tags,
           destination::text, nights::integer, discover::text, transport::text, notes::text, order_index::integer, food::text,
           NULL::text as name, NULL::text as description, NULL::numeric as rating, NULL::text as price_level, NULL::boolean as is_manually_added, NULL::boolean as is_selected, NULL::uuid as user_id,
           NULL::integer as day_index, NULL::text as hotel, NULL::jsonb as attractions
    FROM user_itinerary_destinations 
    WHERE itinerary_id = '7de67e25-5d99-46af-98a7-d9c8eece04cb'
),
hotel_data AS (
    SELECT id::uuid, NULL::text as trip_name, NULL::text as country, NULL::date as start_date, NULL::integer as duration, NULL::integer as passengers, created_at::timestamp, updated_at::timestamp, NULL::boolean as is_private, NULL::jsonb as tags,
           destination::text, NULL::integer as nights, NULL::text as discover, NULL::text as transport, NULL::text as notes, NULL::integer as order_index, NULL::text as food,
           name::text, description::text, rating::numeric, price_level::text, is_manually_added::boolean, is_selected::boolean, user_id::uuid,
           NULL::integer as day_index, NULL::text as hotel, NULL::jsonb as attractions
    FROM hotels h
    WHERE EXISTS (
        SELECT 1 FROM user_itinerary_day_hotels dh 
        WHERE dh.hotel = h.name AND dh.itinerary_id = '7de67e25-5d99-46af-98a7-d9c8eece04cb'
    )
),
day_hotel_data AS (
    SELECT NULL::uuid as id, NULL::text as trip_name, NULL::text as country, NULL::date as start_date, NULL::integer as duration, NULL::integer as passengers, created_at::timestamp, NULL::timestamp as updated_at, NULL::boolean as is_private, NULL::jsonb as tags,
           NULL::text as destination, NULL::integer as nights, NULL::text as discover, NULL::text as transport, NULL::text as notes, NULL::integer as order_index, NULL::text as food,
           NULL::text as name, NULL::text as description, NULL::numeric as rating, NULL::text as price_level, NULL::boolean as is_manually_added, NULL::boolean as is_selected, NULL::uuid as user_id,
           day_index::integer, hotel::text, NULL::jsonb as attractions
    FROM user_itinerary_day_hotels 
    WHERE itinerary_id = '7de67e25-5d99-46af-98a7-d9c8eece04cb'
),
day_attraction_data AS (
    SELECT NULL::uuid as id, NULL::text as trip_name, NULL::text as country, NULL::date as start_date, NULL::integer as duration, NULL::integer as passengers, created_at::timestamp, NULL::timestamp as updated_at, NULL::boolean as is_private, NULL::jsonb as tags,
           NULL::text as destination, NULL::integer as nights, NULL::text as discover, NULL::text as transport, NULL::text as notes, NULL::integer as order_index, NULL::text as food,
           NULL::text as name, NULL::text as description, NULL::numeric as rating, NULL::text as price_level, NULL::boolean as is_manually_added, NULL::boolean as is_selected, NULL::uuid as user_id,
           day_index::integer, NULL::text as hotel, attractions::jsonb
    FROM user_itinerary_day_attractions 
    WHERE itinerary_id = '7de67e25-5d99-46af-98a7-d9c8eece04cb'
),
day_note_data AS (
    SELECT NULL::uuid as id, NULL::text as trip_name, NULL::text as country, NULL::date as start_date, NULL::integer as duration, NULL::integer as passengers, created_at::timestamp, NULL::timestamp as updated_at, NULL::boolean as is_private, NULL::jsonb as tags,
           NULL::text as destination, NULL::integer as nights, NULL::text as discover, NULL::text as transport, notes::text, NULL::integer as order_index, NULL::text as food,
           NULL::text as name, NULL::text as description, NULL::numeric as rating, NULL::text as price_level, NULL::boolean as is_manually_added, NULL::boolean as is_selected, NULL::uuid as user_id,
           day_index::integer, NULL::text as hotel, NULL::jsonb as attractions
    FROM user_itinerary_day_notes 
    WHERE itinerary_id = '7de67e25-5d99-46af-98a7-d9c8eece04cb'
)
SELECT 
    string_agg(
        CASE WHEN id IS NOT NULL AND trip_name IS NOT NULL THEN
            format(
                'INSERT INTO user_itineraries (id, trip_name, country, start_date, duration, passengers, created_at, updated_at, is_private, tags) VALUES (%L, %L, %L, %L, %L, %L, %L, %L, %L, %L);',
                id, trip_name, country, start_date, duration, passengers, created_at, updated_at, is_private, tags
            )
        END,
        E'\n'
    ) as itinerary_inserts,
    string_agg(
        CASE WHEN destination IS NOT NULL THEN
            format(
                'INSERT INTO user_itinerary_destinations (itinerary_id, destination, nights, discover, transport, notes, order_index, created_at, food) VALUES (%L, %L, %L, %L, %L, %L, %L, %L, %L);',
                '7de67e25-5d99-46af-98a7-d9c8eece04cb', destination, nights, discover, transport, notes, order_index, created_at, food
            )
        END,
        E'\n'
    ) as destination_inserts,
    string_agg(
        CASE WHEN name IS NOT NULL THEN
            format(
                'INSERT INTO hotels (id, name, description, rating, price_level, is_manually_added, is_selected, destination, user_id, created_at, updated_at) VALUES (%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L);',
                id, name, description, rating, price_level, is_manually_added, is_selected, destination, user_id, created_at, updated_at
            )
        END,
        E'\n'
    ) as hotel_inserts,
    string_agg(
        CASE WHEN hotel IS NOT NULL THEN
            format(
                'INSERT INTO user_itinerary_day_hotels (itinerary_id, day_index, hotel, created_at) VALUES (%L, %L, %L, %L);',
                '7de67e25-5d99-46af-98a7-d9c8eece04cb', day_index, hotel, created_at
            )
        END,
        E'\n'
    ) as day_hotel_inserts,
    string_agg(
        CASE WHEN attractions IS NOT NULL THEN
            format(
                'INSERT INTO user_itinerary_day_attractions (itinerary_id, day_index, attractions, created_at) VALUES (%L, %L, %L, %L);',
                '7de67e25-5d99-46af-98a7-d9c8eece04cb', day_index, attractions, created_at
            )
        END,
        E'\n'
    ) as day_attraction_inserts,
    string_agg(
        CASE WHEN notes IS NOT NULL AND day_index IS NOT NULL THEN
            format(
                'INSERT INTO user_itinerary_day_notes (itinerary_id, day_index, notes, created_at) VALUES (%L, %L, %L, %L);',
                '7de67e25-5d99-46af-98a7-d9c8eece04cb', day_index, notes, created_at
            )
        END,
        E'\n'
    ) as day_note_inserts
FROM (
    SELECT * FROM itinerary_data
    UNION ALL
    SELECT * FROM destination_data
    UNION ALL
    SELECT * FROM hotel_data
    UNION ALL
    SELECT * FROM day_hotel_data
    UNION ALL
    SELECT * FROM day_attraction_data
    UNION ALL
    SELECT * FROM day_note_data
) combined_data; 