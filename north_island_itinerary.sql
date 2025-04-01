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
        'North Island Explorer: Culture, Nature & Adventure',
        'New Zealand',
        '2025-12-20',
        14,
        2,
        NOW(),
        NOW(),
        false,
        ARRAY['first_time', 'hiking', 'food', 'outdoor', 'sightseeing', 'driving', 'culture', 'adventure'],
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
        ('Auckland', 3, 
         'Sky Tower, Auckland Harbour Bridge, Auckland Domain',
         'Sky Tower offers panoramic city views and thrilling activities, Auckland Harbour Bridge features the famous bridge climb, Auckland Domain is the city''s oldest park with beautiful gardens',
         'Rent a car for flexibility. Auckland Airport has major car rental companies. City has good public transport.',
         '• Book Sky Tower activities in advance\n• City is very walkable\n• Parking can be expensive\n• Many activities are weather-dependent',
         0,
         'The Grove, Depot Eatery, Amano',
         'The Grove: Fine dining with local ingredients, Depot Eatery: Fresh seafood and local cuisine, Amano: Modern Italian with local produce',
         'Sofitel Auckland Viaduct Harbour',
         'Luxury hotel with harbor views, excellent location near waterfront, and modern amenities. Perfect base for exploring Auckland.'
        ),
        ('Bay of Islands', 3,
         'Hole in the Rock, Waitangi Treaty Grounds, Russell',
         'Hole in the Rock features unique rock formations and dolphin watching, Waitangi Treaty Grounds offers Maori cultural experiences, Russell is a historic town with colonial architecture',
         'Drive from Auckland (3 hours) or take a domestic flight to Kerikeri. Roads are well-maintained.',
         '• Book boat tours in advance\n• Bring swimwear and sunscreen\n• Check weather for boat trips\n• Allow time for photo stops',
         1,
         'Duke of Marlborough Hotel, Charlotte''s Kitchen',
         'Duke of Marlborough Hotel: Historic hotel with fresh seafood, Charlotte''s Kitchen: Modern dining with harbor views',
         'Copthorne Hotel and Resort Bay of Islands',
         'Beachfront resort with pool, spa, and excellent dining. Perfect location for exploring the Bay of Islands.'
        ),
        ('Rotorua', 3,
         'Te Puia, Wai-O-Tapu Thermal Wonderland, Redwoods Forest',
         'Te Puia showcases Maori culture and geothermal features, Wai-O-Tapu features colorful thermal pools, Redwoods Forest offers scenic walking trails',
         'Drive from Bay of Islands (6 hours) or fly to Rotorua Airport. Roads are scenic but winding.',
         '• Book cultural experiences early\n• Bring insect repellent\n• Check thermal park opening hours\n• Pack warm layers',
         2,
         'Mokoia Restaurant, Atticus Finch',
         'Mokoia Restaurant: Fine dining with local ingredients, Atticus Finch: Modern cuisine with local produce',
         'Novotel Rotorua Lakeside',
         'Lakeside hotel with spa, pool, and excellent dining. Close to major attractions and thermal areas.'
        ),
        ('Taupo', 2,
         'Huka Falls, Lake Taupo, Tongariro Alpine Crossing',
         'Huka Falls features powerful waterfalls, Lake Taupo offers water activities, Tongariro Alpine Crossing is a famous day hike',
         'Drive from Rotorua (1 hour). Roads are well-maintained.',
         '• Book Tongariro Crossing transport early\n• Check weather for hiking\n• Bring hiking gear\n• Pack warm clothing',
         3,
         'The Bistro, Plateau Restaurant',
         'The Bistro: Modern cuisine with lake views, Plateau Restaurant: Fine dining with local ingredients',
         'Hilton Lake Taupo',
         'Luxury hotel with lake views, spa facilities, and excellent dining. Perfect location for exploring Taupo.'
        ),
        ('Wellington', 3,
         'Te Papa Museum, Wellington Cable Car, Zealandia',
         'Te Papa Museum features Maori artifacts and natural history, Wellington Cable Car offers city views, Zealandia is a unique wildlife sanctuary',
         'Drive from Taupo (4 hours) or fly to Wellington Airport. City has excellent public transport.',
         '• City is very walkable\n• Book museum tours in advance\n• Check weather for outdoor activities\n• Many free attractions',
         4,
         'Logan Brown, Ortega Fish Shack',
         'Logan Brown: Fine dining with local ingredients, Ortega Fish Shack: Fresh seafood with harbor views',
         'InterContinental Wellington',
         'Luxury hotel in city center, featuring elegant rooms and excellent dining. Close to major attractions.'
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
        -- Auckland Days
        (0, '[{"id": "1", "name": "Sky Tower", "description": "Visit the iconic tower for panoramic views and optional activities"}, {"id": "2", "name": "Auckland Harbour Bridge", "description": "Walk or climb the famous bridge for city views"}]'),
        (1, '[{"id": "3", "name": "Auckland Domain", "description": "Morning walk through beautiful gardens and museum"}, {"id": "4", "name": "Viaduct Harbour", "description": "Explore waterfront area with restaurants and bars"}]'),
        (2, '[{"id": "5", "name": "Waiheke Island", "description": "Day trip to wine country with beautiful beaches"}]'),
        -- Bay of Islands Days
        (3, '[{"id": "6", "name": "Hole in the Rock", "description": "Full day cruise to see unique rock formations and dolphins"}]'),
        (4, '[{"id": "7", "name": "Waitangi Treaty Grounds", "description": "Learn about Maori culture and New Zealand history"}, {"id": "8", "name": "Russell", "description": "Explore historic town and colonial architecture"}]'),
        (5, '[{"id": "9", "name": "Paihia", "description": "Beach activities and optional water sports"}]'),
        -- Rotorua Days
        (6, '[{"id": "10", "name": "Te Puia", "description": "Morning visit to Maori cultural center and geothermal features"}, {"id": "11", "name": "Wai-O-Tapu", "description": "Afternoon at colorful thermal wonderland"}]'),
        (7, '[{"id": "12", "name": "Redwoods Forest", "description": "Morning walk through scenic forest"}, {"id": "13", "name": "Polynesian Spa", "description": "Relax in natural hot springs"}]'),
        (8, '[{"id": "14", "name": "Whakarewarewa Forest", "description": "Scenic walking trails and mountain biking"}]'),
        -- Taupo Days
        (9, '[{"id": "15", "name": "Huka Falls", "description": "Morning visit to powerful waterfalls"}, {"id": "16", "name": "Lake Taupo", "description": "Afternoon activities on the lake"}]'),
        (10, '[{"id": "17", "name": "Tongariro Alpine Crossing", "description": "Full day hike through volcanic landscape"}]'),
        -- Wellington Days
        (11, '[{"id": "18", "name": "Te Papa Museum", "description": "Morning visit to national museum"}, {"id": "19", "name": "Wellington Cable Car", "description": "Afternoon ride for city views"}]'),
        (12, '[{"id": "20", "name": "Zealandia", "description": "Morning at wildlife sanctuary"}, {"id": "21", "name": "Wellington Botanic Garden", "description": "Afternoon walk through beautiful gardens"}]'),
        (13, '[{"id": "22", "name": "Cuba Street", "description": "Explore historic street and cafes"}, {"id": "23", "name": "Mount Victoria", "description": "Evening hike for city views"}]')
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
        (0, '• Book Sky Tower tickets in advance\n• Wear comfortable walking shoes\n• Bring camera for city views\n• Check weather forecast'),
        (1, '• Start early for Auckland Domain\n• Museum is free entry\n• Pack sunscreen\n• Bring water bottle'),
        (2, '• Book Waiheke ferry early\n• Bring swimwear\n• Wear comfortable shoes\n• Check ferry schedule'),
        (3, '• Book Hole in the Rock cruise early\n• Bring swimwear and sunscreen\n• Camera essential\n• Check weather forecast'),
        (4, '• Start with Treaty Grounds\n• Book guided tour\n• Wear comfortable shoes\n• Bring water'),
        (5, '• Check water sports availability\n• Bring swimwear\n• Pack sunscreen\n• Check weather'),
        (6, '• Book Te Puia tour early\n• Bring insect repellent\n• Wear comfortable shoes\n• Check opening hours'),
        (7, '• Start Redwoods walk early\n• Book spa treatment\n• Bring swimwear\n• Check weather'),
        (8, '• Check trail conditions\n• Wear hiking boots\n• Pack water and snacks\n• Check weather'),
        (9, '• Start Huka Falls early\n• Book lake activities\n• Bring swimwear\n• Check weather'),
        (10, '• Book Tongariro transport early\n• Wear hiking boots\n• Pack water and snacks\n• Check weather'),
        (11, '• Start with Te Papa\n• Book museum tour\n• Wear comfortable shoes\n• Bring water'),
        (12, '• Book Zealandia tour early\n• Wear comfortable shoes\n• Pack sunscreen\n• Check weather'),
        (13, '• Explore Cuba Street shops\n• Start Mount Victoria hike early\n• Bring camera\n• Check weather')
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
        (0, 'Sofitel Auckland Viaduct Harbour', 'Luxury hotel with harbor views, excellent location near waterfront'),
        (1, 'Sofitel Auckland Viaduct Harbour', 'Luxury hotel with harbor views, excellent location near waterfront'),
        (2, 'Sofitel Auckland Viaduct Harbour', 'Luxury hotel with harbor views, excellent location near waterfront'),
        (3, 'Copthorne Hotel and Resort Bay of Islands', 'Beachfront resort with pool, spa, and excellent dining'),
        (4, 'Copthorne Hotel and Resort Bay of Islands', 'Beachfront resort with pool, spa, and excellent dining'),
        (5, 'Copthorne Hotel and Resort Bay of Islands', 'Beachfront resort with pool, spa, and excellent dining'),
        (6, 'Novotel Rotorua Lakeside', 'Lakeside hotel with spa, pool, and excellent dining'),
        (7, 'Novotel Rotorua Lakeside', 'Lakeside hotel with spa, pool, and excellent dining'),
        (8, 'Novotel Rotorua Lakeside', 'Lakeside hotel with spa, pool, and excellent dining'),
        (9, 'Hilton Lake Taupo', 'Luxury hotel with lake views, spa facilities, and excellent dining'),
        (10, 'Hilton Lake Taupo', 'Luxury hotel with lake views, spa facilities, and excellent dining'),
        (11, 'InterContinental Wellington', 'Luxury hotel in city center, featuring elegant rooms and excellent dining'),
        (12, 'InterContinental Wellington', 'Luxury hotel in city center, featuring elegant rooms and excellent dining'),
        (13, 'InterContinental Wellington', 'Luxury hotel in city center, featuring elegant rooms and excellent dining')
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
        (0, '[{"id": "food1", "name": {"text": "The Grove", "cuisine": "Modern New Zealand", "known_for": "Fine dining with local ingredients and excellent wine selection"}}, {"id": "food2", "name": {"text": "Depot Eatery", "cuisine": "Seafood", "known_for": "Fresh seafood and local cuisine in casual setting"}}]'),
        (1, '[{"id": "food3", "name": {"text": "Amano", "cuisine": "Italian", "known_for": "Modern Italian with local produce and fresh pasta"}}, {"id": "food4", "name": {"text": "Ortolana", "cuisine": "Seasonal", "known_for": "Fresh seasonal cuisine in beautiful setting"}}]'),
        (2, '[{"id": "food5", "name": {"text": "Cable Bay Vineyards", "cuisine": "Wine Country", "known_for": "Wine tasting and lunch with stunning views"}}]'),
        (3, '[{"id": "food6", "name": {"text": "Duke of Marlborough Hotel", "cuisine": "Historic", "known_for": "Historic hotel with fresh seafood and local cuisine"}}]'),
        (4, '[{"id": "food7", "name": {"text": "Charlotte''s Kitchen", "cuisine": "Modern", "known_for": "Modern dining with harbor views and fresh seafood"}}]'),
        (5, '[{"id": "food8", "name": {"text": "The Gables", "cuisine": "Traditional", "known_for": "Historic restaurant with local cuisine and harbor views"}}]'),
        (6, '[{"id": "food9", "name": {"text": "Mokoia Restaurant", "cuisine": "Maori Fusion", "known_for": "Fine dining with local ingredients and Maori influence"}}]'),
        (7, '[{"id": "food10", "name": {"text": "Atticus Finch", "cuisine": "Modern", "known_for": "Modern cuisine with local produce and excellent wine selection"}}]'),
        (8, '[{"id": "food11", "name": {"text": "Capers Epicurean", "cuisine": "Local", "known_for": "Fresh local cuisine in casual setting"}}]'),
        (9, '[{"id": "food12", "name": {"text": "The Bistro", "cuisine": "Modern", "known_for": "Modern cuisine with lake views and local ingredients"}}]'),
        (10, '[{"id": "food13", "name": {"text": "Plateau Restaurant", "cuisine": "Fine Dining", "known_for": "Fine dining with local ingredients and lake views"}}]'),
        (11, '[{"id": "food14", "name": {"text": "Logan Brown", "cuisine": "Fine Dining", "known_for": "Fine dining with local ingredients and excellent wine selection"}}]'),
        (12, '[{"id": "food15", "name": {"text": "Ortega Fish Shack", "cuisine": "Seafood", "known_for": "Fresh seafood with harbor views and casual atmosphere"}}]'),
        (13, '[{"id": "food16", "name": {"text": "Hippopotamus", "cuisine": "Modern", "known_for": "Modern cuisine with city views and elegant setting"}}]')
    ) AS v(day_index, name)
)
SELECT 'Itinerary created successfully' as result;

-- Commit transaction
COMMIT; 