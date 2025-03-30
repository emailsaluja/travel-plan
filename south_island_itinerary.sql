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
        'South Island Adventure: Mountains, Lakes & Adventure',
        'New Zealand',
        '2025-12-24',
        10,
        2,
        NOW(),
        NOW(),
        false,
        ARRAY['couple', 'hiking', 'food', 'outdoor', 'sightseeing', 'driving', 'adventure'],
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
        ('Queenstown', 3, 
         'Skyline Queenstown, Lake Wakatipu, Queenstown Gardens, Fergburger',
         'Skyline Queenstown offers panoramic views and luge rides, Lake Wakatipu is perfect for scenic walks and boat rides, Queenstown Gardens features beautiful walking trails, Fergburger serves legendary gourmet burgers',
         'Rent a car for flexibility. Queenstown Airport has major car rental companies. Internal flights available to other destinations.',
         '• Book activities in advance\n• Pack layers for changing weather\n• Queenstown is a walking-friendly town\n• Many activities are weather-dependent',
         0,
         'Fergburger, Rata, The Bunker, The Cow',
         'Fergburger: World-famous gourmet burgers, Rata: Fine dining with local ingredients, The Bunker: Cozy atmosphere with great wine selection, The Cow: Authentic Italian cuisine in historic building',
         'Heritage Queenstown Hotel',
         'Luxury hotel with lake views, spa facilities, and excellent location near town center. Features historic charm with modern amenities.'
        ),
        ('Milford Sound', 2,
         'Milford Sound Cruise, Mirror Lakes, The Chasm, Key Summit Track',
         'Milford Sound Cruise offers stunning fjord views and waterfalls, Mirror Lakes provides perfect reflections of mountains, The Chasm features unique rock formations, Key Summit Track offers panoramic views',
         'Drive from Queenstown (4-5 hours) or take a scenic flight. Road conditions can be challenging - check weather and road status.',
         '• Book Milford Sound cruise in advance\n• Check road conditions before driving\n• Pack warm clothing\n• Allow extra time for photo stops',
         1,
         'Milford Sound Lodge Restaurant, The Blue Duck Cafe',
         'Milford Sound Lodge Restaurant: Fresh local seafood with fjord views, The Blue Duck Cafe: Cozy cafe with homemade meals',
         'Milford Sound Lodge',
         'Modern lodge with fjord views, comfortable rooms, and excellent restaurant. Perfect base for exploring Milford Sound.'
        ),
        ('Mount Cook', 2,
         'Hooker Valley Track, Tasman Glacier View, Mount Cook Village, Lake Pukaki',
         'Hooker Valley Track leads to stunning glacier views, Tasman Glacier View offers unique lake views, Mount Cook Village has informative visitor center, Lake Pukaki features turquoise waters',
         'Drive from Milford Sound (6-7 hours) or fly to Mount Cook Airport. Roads are well-maintained but remote.',
         '• Weather can change quickly\n• Book accommodation early\n• Bring warm clothing\n• Check track conditions',
         2,
         'The Old Mountaineers Cafe, Alpine Restaurant',
         'The Old Mountaineers Cafe: Cozy cafe with mountain views, Alpine Restaurant: Fine dining with local ingredients',
         'The Hermitage Hotel',
         'Historic hotel with stunning mountain views, comfortable rooms, and excellent facilities. Perfect location for exploring Mount Cook National Park.'
        ),
        ('Christchurch', 3,
         'Christchurch Botanic Gardens, International Antarctic Centre, New Regent Street, Christchurch Gondola',
         'Christchurch Botanic Gardens features beautiful gardens and walking paths, International Antarctic Centre offers interactive exhibits, New Regent Street has historic architecture and cafes, Christchurch Gondola provides city views',
         'Drive from Mount Cook (3-4 hours) or fly to Christchurch Airport. City has good public transport.',
         '• City is very walkable\n• Many attractions are close together\n• Check opening hours\n• Book activities in advance',
         3,
         'Pescatore, The Monday Room, Little High Eatery',
         'Pescatore: Fine dining with harbor views, The Monday Room: Modern cuisine in historic building, Little High Eatery: Food court with local vendors',
         'The George Christchurch',
         'Luxury boutique hotel in city center, featuring elegant rooms and excellent dining options. Close to major attractions.'
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
        -- Queenstown Days
        (0, '[{"id": "1", "name": "Skyline Queenstown", "description": "Take the gondola up for panoramic views and enjoy luge rides"}, {"id": "2", "name": "Lake Wakatipu", "description": "Scenic walk along the lakefront and optional boat cruise"}]'),
        (1, '[{"id": "3", "name": "Queenstown Gardens", "description": "Morning walk through beautiful gardens and lakeside paths"}, {"id": "4", "name": "Fergburger", "description": "Lunch at the famous burger joint"}]'),
        (2, '[{"id": "5", "name": "Arrowtown", "description": "Day trip to historic gold mining town"}]'),
        -- Milford Sound Days
        (3, '[{"id": "6", "name": "Mirror Lakes", "description": "Morning stop for perfect mountain reflections"}, {"id": "7", "name": "The Chasm", "description": "Visit unique rock formations and waterfalls"}]'),
        (4, '[{"id": "8", "name": "Milford Sound Cruise", "description": "Full day cruise through the stunning fjord"}]'),
        -- Mount Cook Days
        (5, '[{"id": "9", "name": "Hooker Valley Track", "description": "Morning hike with stunning glacier views"}, {"id": "10", "name": "Tasman Glacier View", "description": "Afternoon visit to glacier viewpoint"}]'),
        (6, '[{"id": "11", "name": "Lake Pukaki", "description": "Visit the turquoise lake and visitor center"}]'),
        -- Christchurch Days
        (7, '[{"id": "12", "name": "Christchurch Botanic Gardens", "description": "Morning walk through beautiful gardens"}, {"id": "13", "name": "International Antarctic Centre", "description": "Afternoon visit to learn about Antarctica"}]'),
        (8, '[{"id": "14", "name": "New Regent Street", "description": "Explore historic street and cafes"}, {"id": "15", "name": "Christchurch Gondola", "description": "Evening gondola ride for city views"}]'),
        (9, '[{"id": "16", "name": "Christchurch Art Gallery", "description": "Morning visit to art gallery"}, {"id": "17", "name": "Riverside Market", "description": "Lunch and shopping at local market"}]')
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
        (0, '• Book Skyline Queenstown tickets in advance\n• Wear comfortable walking shoes\n• Bring camera for lake views\n• Check weather forecast'),
        (1, '• Start early for Queenstown Gardens\n• Make Fergburger reservation\n• Pack sunscreen\n• Bring water bottle'),
        (2, '• Leave early for Arrowtown\n• Bring cash for small shops\n• Wear comfortable shoes\n• Check road conditions'),
        (3, '• Start early for Milford Sound drive\n• Check road conditions\n• Pack warm clothes\n• Bring snacks'),
        (4, '• Book Milford Sound cruise early\n• Bring warm layers\n• Camera essential\n• Check weather forecast'),
        (5, '• Start Hooker Valley Track early\n• Wear hiking boots\n• Pack water and snacks\n• Check track conditions'),
        (6, '• Visit Lake Pukaki visitor center\n• Bring camera\n• Check weather\n• Pack picnic lunch'),
        (7, '• Start with Botanic Gardens\n• Book Antarctic Centre tickets\n• Wear comfortable shoes\n• Bring water'),
        (8, '• Explore New Regent Street shops\n• Book gondola tickets\n• Bring camera\n• Check weather'),
        (9, '• Visit art gallery early\n• Check market opening hours\n• Pack shopping bags\n• Bring cash')
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
        (0, 'Heritage Queenstown Hotel', 'Luxury hotel with lake views, spa facilities, and excellent location near town center'),
        (1, 'Heritage Queenstown Hotel', 'Luxury hotel with lake views, spa facilities, and excellent location near town center'),
        (2, 'Heritage Queenstown Hotel', 'Luxury hotel with lake views, spa facilities, and excellent location near town center'),
        (3, 'Milford Sound Lodge', 'Modern lodge with fjord views, comfortable rooms, and excellent restaurant'),
        (4, 'Milford Sound Lodge', 'Modern lodge with fjord views, comfortable rooms, and excellent restaurant'),
        (5, 'The Hermitage Hotel', 'Historic hotel with stunning mountain views, comfortable rooms, and excellent facilities'),
        (6, 'The Hermitage Hotel', 'Historic hotel with stunning mountain views, comfortable rooms, and excellent facilities'),
        (7, 'The George Christchurch', 'Luxury boutique hotel in city center, featuring elegant rooms and excellent dining options'),
        (8, 'The George Christchurch', 'Luxury boutique hotel in city center, featuring elegant rooms and excellent dining options'),
        (9, 'The George Christchurch', 'Luxury boutique hotel in city center, featuring elegant rooms and excellent dining options')
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
        (0, '[{"id": "1", "name": "Fergburger", "description": "World-famous gourmet burgers - try the Ferg Deluxe"}, {"id": "2", "name": "Rata", "description": "Fine dining with local ingredients and excellent wine selection"}]'),
        (1, '[{"id": "3", "name": "The Cow", "description": "Historic Italian restaurant with cozy atmosphere"}, {"id": "4", "name": "The Bunker", "description": "Intimate dining with great wine selection"}]'),
        (2, '[{"id": "5", "name": "Arrowtown Bakery", "description": "Historic bakery with fresh pastries and sandwiches"}]'),
        (3, '[{"id": "6", "name": "Milford Sound Lodge Restaurant", "description": "Fresh local seafood with fjord views"}]'),
        (4, '[{"id": "7", "name": "The Blue Duck Cafe", "description": "Cozy cafe with homemade meals and great coffee"}]'),
        (5, '[{"id": "8", "name": "The Old Mountaineers Cafe", "description": "Cozy cafe with mountain views and hearty meals"}]'),
        (6, '[{"id": "9", "name": "Alpine Restaurant", "description": "Fine dining with local ingredients and mountain views"}]'),
        (7, '[{"id": "10", "name": "Pescatore", "description": "Fine dining with harbor views and fresh seafood"}]'),
        (8, '[{"id": "11", "name": "The Monday Room", "description": "Modern cuisine in historic building"}]'),
        (9, '[{"id": "12", "name": "Little High Eatery", "description": "Food court with various local vendors"}]')
    ) AS v(day_index, name)
)
SELECT 'Itinerary created successfully' as result;

-- Commit transaction
COMMIT; 