-- Start transaction
BEGIN;

-- Insert main itinerary
WITH new_itinerary AS (
    INSERT INTO user_itineraries (
        trip_name,
        country,
        start_date,
        duration,
        passengers,
        created_at,
        updated_at,
        is_private,
        tags,
        user_id
    ) VALUES (
        'Swiss Alps Explorer: Mountains, Trains & Adventure',
        'Switzerland',
        '2025-09-15',
        15,
        2,
        NOW(),
        NOW(),
        false,
        ARRAY['first_time', 'hiking', 'food', 'outdoor', 'sightseeing', 'train_rides', 'mountains', 'adventure'],
        '45aacc90-3a1b-419c-b487-58d7b64f70a1'
    ) RETURNING id
)
-- Insert destinations
, destinations AS (
    INSERT INTO user_itinerary_destinations (
        itinerary_id,
        destination,
        nights,
        manual_discover,
        manual_discover_desc,
        transport,
        notes,
        order_index,
        created_at,
        food,
        food_desc,
        manual_hotel,
        manual_hotel_desc
    ) 
    SELECT 
        new_itinerary.id,
        destination,
        nights,
        manual_discover,
        manual_discover_desc,
        transport,
        notes,
        order_index,
        NOW(),
        food,
        food_desc,
        manual_hotel,
        manual_hotel_desc
    FROM new_itinerary,
    (VALUES 
        ('Zurich', 3, 
         'Old Town, Lake Zurich, Bahnhofstrasse',
         'Old Town features medieval architecture and historic churches, Lake Zurich offers scenic boat rides, Bahnhofstrasse is one of the world''s most exclusive shopping streets',
         'Arrive at Zurich Airport. City has excellent public transport. Swiss Pass recommended for train travel.',
         '• Get Swiss Pass before arrival\n• City is very walkable\n• Many attractions are free\n• Check weather forecast',
         0,
         'Zeughauskeller, Restaurant Kronenhalle',
         'Zeughauskeller: Traditional Swiss cuisine in historic setting, Kronenhalle: Classic Swiss restaurant with art collection',
         'Hotel Storchen Zurich',
         'Historic hotel on the river, featuring elegant rooms and excellent dining. Perfect location in Old Town.'
        ),
        ('Lucerne', 3,
         'Chapel Bridge, Mount Pilatus, Lake Lucerne',
         'Chapel Bridge is the oldest wooden bridge in Europe, Mount Pilatus offers stunning mountain views, Lake Lucerne features scenic boat cruises',
         'Train from Zurich (1 hour). Swiss Pass covers all transport.',
         '• Book Mount Pilatus tickets early\n• Bring hiking boots\n• Check weather for mountain activities\n• Allow time for photos',
         1,
         'Restaurant Old Swiss House, Wirtshaus Galliker',
         'Old Swiss House: Historic restaurant with traditional cuisine, Galliker: Local favorite for Swiss specialties',
         'Hotel Schweizerhof Lucerne',
         'Luxury hotel with lake views, spa facilities, and excellent dining. Close to major attractions.'
        ),
        ('Interlaken', 3,
         'Jungfraujoch, Lake Thun, Lake Brienz',
         'Jungfraujoch is the highest railway station in Europe, Lake Thun and Brienz offer scenic boat rides and water activities',
         'Train from Lucerne (2 hours). Swiss Pass covers all transport.',
         '• Book Jungfraujoch tickets early\n• Bring warm layers\n• Check weather for mountain activities\n• Pack hiking gear',
         2,
         'Restaurant Schuh, Husi Bierhaus',
         'Restaurant Schuh: Traditional Swiss cuisine with lake views, Husi Bierhaus: Local pub with Swiss specialties',
         'Victoria-Jungfrau Grand Hotel & Spa',
         'Luxury hotel with mountain views, spa facilities, and excellent dining. Perfect base for exploring the region.'
        ),
        ('Zermatt', 3,
         'Matterhorn, Gornergrat Railway, Glacier Paradise',
         'Matterhorn is Switzerland''s iconic mountain, Gornergrat Railway offers stunning views, Glacier Paradise features year-round skiing',
         'Train from Interlaken (3 hours). Swiss Pass covers transport to Täsch, then take Zermatt shuttle.',
         '• Book mountain activities early\n• Bring winter gear\n• Check weather for mountain activities\n• Pack hiking boots',
         3,
         'Findlerhof, Restaurant Schäferstube',
         'Findlerhof: Fine dining with Matterhorn views, Schäferstube: Cozy restaurant with local specialties',
         'Hotel Zermatterhof',
         'Luxury hotel with Matterhorn views, spa facilities, and excellent dining. Perfect location in car-free village.'
        ),
        ('Geneva', 3,
         'Lake Geneva, Jet d''Eau, Old Town',
         'Lake Geneva offers scenic boat rides, Jet d''Eau is the city''s iconic fountain, Old Town features historic architecture',
         'Train from Zermatt (4 hours). Swiss Pass covers all transport.',
         '• City is very walkable\n• Many free attractions\n• Check weather forecast\n• Bring comfortable shoes',
         4,
         'Le Chat-Botté, Café du Centre',
         'Le Chat-Botté: Fine dining with lake views, Café du Centre: Traditional Swiss cuisine in historic setting',
         'Hotel Beau-Rivage Geneva',
         'Historic luxury hotel with lake views, spa facilities, and excellent dining. Perfect location in city center.'
        )
    ) AS v(destination, nights, manual_discover, manual_discover_desc, transport, notes, order_index, food, food_desc, manual_hotel, manual_hotel_desc)
    RETURNING id, order_index
)
-- Insert day attractions
, day_attractions AS (
    INSERT INTO user_itinerary_day_attractions (
        itinerary_id,
        day_index,
        attractions,
        created_at
    )
    SELECT 
        new_itinerary.id,
        day_index,
        attractions::jsonb,
        NOW()
    FROM new_itinerary,
    (VALUES 
        -- Zurich Days
        (0, '[{"id": "1", "name": "Old Town", "description": "Explore medieval streets, historic churches, and charming squares"}, {"id": "2", "name": "Lake Zurich", "description": "Scenic boat ride on the lake with views of the Alps"}]'),
        (1, '[{"id": "3", "name": "Bahnhofstrasse", "description": "Shop along one of the world''s most exclusive shopping streets"}, {"id": "4", "name": "Uetliberg", "description": "Hike to Zurich''s local mountain for panoramic views"}]'),
        (2, '[{"id": "5", "name": "Kunsthaus Zurich", "description": "Visit the city''s main art museum"}, {"id": "6", "name": "Zurich Zoo", "description": "Explore one of Europe''s best zoos"}]'),
        -- Lucerne Days
        (3, '[{"id": "7", "name": "Chapel Bridge", "description": "Walk across Europe''s oldest wooden bridge"}, {"id": "8", "name": "Lake Lucerne", "description": "Scenic boat cruise on the lake"}]'),
        (4, '[{"id": "9", "name": "Mount Pilatus", "description": "Take the world''s steepest cogwheel railway to the summit"}, {"id": "10", "name": "Lion Monument", "description": "Visit the famous rock relief"}]'),
        (5, '[{"id": "11", "name": "Old Town Lucerne", "description": "Explore historic streets and squares"}, {"id": "12", "name": "Swiss Transport Museum", "description": "Interactive museum showcasing Swiss transport history"}]'),
        -- Interlaken Days
        (6, '[{"id": "13", "name": "Jungfraujoch", "description": "Visit the highest railway station in Europe"}, {"id": "14", "name": "Lake Thun", "description": "Scenic boat cruise on the lake"}]'),
        (7, '[{"id": "15", "name": "Lake Brienz", "description": "Morning boat cruise on the turquoise lake"}, {"id": "16", "name": "Harder Kulm", "description": "Panoramic views of the region"}]'),
        (8, '[{"id": "17", "name": "Schynige Platte", "description": "Scenic train ride and hiking trails"}, {"id": "18", "name": "St. Beatus Caves", "description": "Explore historic caves and waterfalls"}]'),
        -- Zermatt Days
        (9, '[{"id": "19", "name": "Matterhorn", "description": "Take the Gornergrat Railway for views of Switzerland''s iconic mountain"}, {"id": "20", "name": "Glacier Paradise", "description": "Visit Europe''s highest cable car station"}]'),
        (10, '[{"id": "21", "name": "Gornergrat", "description": "Scenic train ride with views of 29 peaks"}, {"id": "22", "name": "Riffelsee", "description": "Hike to the famous Matterhorn reflection lake"}]'),
        (11, '[{"id": "23", "name": "Sunnegga", "description": "Scenic hiking trails with Matterhorn views"}, {"id": "24", "name": "Zermatt Village", "description": "Explore the car-free village and its historic buildings"}]'),
        -- Geneva Days
        (12, '[{"id": "25", "name": "Lake Geneva", "description": "Scenic boat cruise on the lake"}, {"id": "26", "name": "Jet d''Eau", "description": "Visit the city''s iconic fountain"}]'),
        (13, '[{"id": "27", "name": "Old Town", "description": "Explore historic streets and St. Pierre Cathedral"}, {"id": "28", "name": "UN Office", "description": "Visit the European headquarters of the United Nations"}]'),
        (14, '[{"id": "29", "name": "Carouge", "description": "Explore the Italian-style district"}, {"id": "30", "name": "Mont Salève", "description": "Take the cable car for panoramic views"}]')
    ) AS v(day_index, attractions)
)
-- Insert day notes
, day_notes AS (
    INSERT INTO user_itinerary_day_notes (
        itinerary_id,
        day_index,
        notes,
        created_at
    )
    SELECT 
        new_itinerary.id,
        day_index,
        notes,
        NOW()
    FROM new_itinerary,
    (VALUES 
        (0, '• Get Swiss Pass at airport\n• Wear comfortable walking shoes\n• Bring camera for city views\n• Check weather forecast'),
        (1, '• Start early for shopping\n• Wear comfortable shoes\n• Pack sunscreen\n• Bring water bottle'),
        (2, '• Museum is free with Swiss Pass\n• Wear comfortable shoes\n• Pack sunscreen\n• Check opening hours'),
        (3, '• Book boat cruise early\n• Wear comfortable shoes\n• Camera essential\n• Check weather forecast'),
        (4, '• Book Mount Pilatus tickets early\n• Wear hiking boots\n• Pack warm layers\n• Bring water'),
        (5, '• Start with Old Town\n• Wear comfortable shoes\n• Bring water\n• Check museum hours'),
        (6, '• Book Jungfraujoch tickets early\n• Wear warm layers\n• Pack hiking gear\n• Check weather'),
        (7, '• Start boat cruise early\n• Wear comfortable shoes\n• Pack sunscreen\n• Check weather'),
        (8, '• Book train tickets early\n• Wear hiking boots\n• Pack water and snacks\n• Check weather'),
        (9, '• Book Gornergrat tickets early\n• Wear warm layers\n• Pack hiking gear\n• Check weather'),
        (10, '• Start train ride early\n• Wear hiking boots\n• Pack water and snacks\n• Check weather'),
        (11, '• Check trail conditions\n• Wear hiking boots\n• Pack water and snacks\n• Check weather'),
        (12, '• Book boat cruise early\n• Wear comfortable shoes\n• Pack sunscreen\n• Check weather'),
        (13, '• Start with Old Town\n• Wear comfortable shoes\n• Bring water\n• Check UN tour times'),
        (14, '• Book cable car tickets early\n• Wear comfortable shoes\n• Pack sunscreen\n• Check weather')
    ) AS v(day_index, notes)
)
-- Insert day hotels
, day_hotels AS (
    INSERT INTO user_itinerary_day_hotels (
        itinerary_id,
        day_index,
        hotel,
        hotel_desc,
        created_at
    )
    SELECT 
        new_itinerary.id,
        day_index,
        hotel,
        hotel_desc,
        NOW()
    FROM new_itinerary,
    (VALUES 
        (0, 'Hotel Storchen Zurich', 'Historic hotel on the river, featuring elegant rooms and excellent dining'),
        (1, 'Hotel Storchen Zurich', 'Historic hotel on the river, featuring elegant rooms and excellent dining'),
        (2, 'Hotel Storchen Zurich', 'Historic hotel on the river, featuring elegant rooms and excellent dining'),
        (3, 'Hotel Schweizerhof Lucerne', 'Luxury hotel with lake views, spa facilities, and excellent dining'),
        (4, 'Hotel Schweizerhof Lucerne', 'Luxury hotel with lake views, spa facilities, and excellent dining'),
        (5, 'Hotel Schweizerhof Lucerne', 'Luxury hotel with lake views, spa facilities, and excellent dining'),
        (6, 'Victoria-Jungfrau Grand Hotel & Spa', 'Luxury hotel with mountain views, spa facilities, and excellent dining'),
        (7, 'Victoria-Jungfrau Grand Hotel & Spa', 'Luxury hotel with mountain views, spa facilities, and excellent dining'),
        (8, 'Victoria-Jungfrau Grand Hotel & Spa', 'Luxury hotel with mountain views, spa facilities, and excellent dining'),
        (9, 'Hotel Zermatterhof', 'Luxury hotel with Matterhorn views, spa facilities, and excellent dining'),
        (10, 'Hotel Zermatterhof', 'Luxury hotel with Matterhorn views, spa facilities, and excellent dining'),
        (11, 'Hotel Zermatterhof', 'Luxury hotel with Matterhorn views, spa facilities, and excellent dining'),
        (12, 'Hotel Beau-Rivage Geneva', 'Historic luxury hotel with lake views, spa facilities, and excellent dining'),
        (13, 'Hotel Beau-Rivage Geneva', 'Historic luxury hotel with lake views, spa facilities, and excellent dining'),
        (14, 'Hotel Beau-Rivage Geneva', 'Historic luxury hotel with lake views, spa facilities, and excellent dining')
    ) AS v(day_index, hotel, hotel_desc)
)
-- Insert day food options
, day_food AS (
    INSERT INTO user_itinerary_day_food_options (
        itinerary_id,
        day_index,
        name,
        created_at
    )
    SELECT 
        new_itinerary.id,
        day_index,
        name::jsonb,
        NOW()
    FROM new_itinerary,
    (VALUES 
        (0, '[{"id": "food1", "name": {"text": "Zeughauskeller", "cuisine": "Traditional Swiss", "known_for": "Historic restaurant serving traditional Swiss cuisine and local specialties"}}, {"id": "food2", "name": {"text": "Restaurant Kronenhalle", "cuisine": "Classic Swiss", "known_for": "Elegant dining room with art collection and traditional Swiss dishes"}}]'),
        (1, '[{"id": "food3", "name": {"text": "Restaurant Hiltl", "cuisine": "Vegetarian", "known_for": "World''s oldest vegetarian restaurant with diverse menu"}}, {"id": "food4", "name": {"text": "Restaurant Swiss Chuchi", "cuisine": "Traditional Swiss", "known_for": "Authentic Swiss cuisine including fondue and raclette"}}]'),
        (2, '[{"id": "food5", "name": {"text": "Restaurant Zunfthaus zur Waag", "cuisine": "Traditional Swiss", "known_for": "Historic guild house serving traditional Swiss cuisine"}}]'),
        (3, '[{"id": "food6", "name": {"text": "Restaurant Old Swiss House", "cuisine": "Traditional Swiss", "known_for": "Historic restaurant with traditional Swiss cuisine and wine cellar"}}]'),
        (4, '[{"id": "food7", "name": {"text": "Wirtshaus Galliker", "cuisine": "Traditional Swiss", "known_for": "Local favorite serving authentic Swiss specialties"}}]'),
        (5, '[{"id": "food8", "name": {"text": "Restaurant Balances", "cuisine": "Modern Swiss", "known_for": "Fine dining with lake views and modern Swiss cuisine"}}]'),
        (6, '[{"id": "food9", "name": {"text": "Restaurant Schuh", "cuisine": "Traditional Swiss", "known_for": "Historic restaurant with lake views and traditional Swiss cuisine"}}]'),
        (7, '[{"id": "food10", "name": {"text": "Husi Bierhaus", "cuisine": "Traditional Swiss", "known_for": "Local pub serving Swiss specialties and local beer"}}]'),
        (8, '[{"id": "food11", "name": {"text": "Restaurant Laterne", "cuisine": "Traditional Swiss", "known_for": "Cozy restaurant serving traditional Swiss cuisine"}}]'),
        (9, '[{"id": "food12", "name": {"text": "Findlerhof", "cuisine": "Fine Dining", "known_for": "Fine dining with Matterhorn views and creative cuisine"}}]'),
        (10, '[{"id": "food13", "name": {"text": "Restaurant Schäferstube", "cuisine": "Traditional Swiss", "known_for": "Cozy restaurant with local specialties and fondue"}}]'),
        (11, '[{"id": "food14", "name": {"text": "Restaurant Cervo", "cuisine": "Modern Swiss", "known_for": "Modern Swiss cuisine with mountain views"}}]'),
        (12, '[{"id": "food15", "name": {"text": "Le Chat-Botté", "cuisine": "Fine Dining", "known_for": "Fine dining with lake views and creative cuisine"}}]'),
        (13, '[{"id": "food16", "name": {"text": "Café du Centre", "cuisine": "Traditional Swiss", "known_for": "Historic café serving traditional Swiss cuisine"}}]'),
        (14, '[{"id": "food17", "name": {"text": "Restaurant Les Armures", "cuisine": "Traditional Swiss", "known_for": "Historic restaurant in Old Town serving traditional Swiss cuisine"}}]')
    ) AS v(day_index, name)
)
SELECT 'Itinerary created successfully' as result;

-- Commit transaction
COMMIT; 