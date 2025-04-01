-- Main Itinerary
INSERT INTO user_itineraries (
    trip_name,
    country,
    start_date,
    duration,
    passengers,
    created_at,
    updated_at,
    is_private,
    tags
) VALUES (
    'Classic Italian Journey: Rome, Florence, Venice',
    'Italy',
    '2024-06-01',
    10,
    2,
    NOW(),
    NOW(),
    false,
    ARRAY['culture', 'food', 'history', 'art']
) RETURNING id INTO new_itinerary_id;

-- Destinations (with order_index for sequence)
INSERT INTO user_itinerary_destinations (
    itinerary_id,
    destination,
    nights,
    discover,
    transport,
    notes,
    order_index,
    created_at,
    food
) VALUES 
-- Rome (4 nights)
(new_itinerary_id, 'Rome', 4, 
'The Eternal City - Ancient ruins, Renaissance art, and vibrant street life',
'Arrive at Rome Fiumicino Airport (FCO). Take Leonardo Express train or taxi to city center',
'Start with Rome to dive deep into Italy''s history',
1,
NOW(),
'Famous for: Carbonara, Cacio e Pepe, Roman-style Pizza, Supplì'),

-- Florence (3 nights)
(new_itinerary_id, 'Florence', 3,
'Birthplace of the Renaissance - Art, architecture, and Tuscan cuisine',
'High-speed train from Rome to Florence (1.5 hours)',
'The heart of Tuscany with incredible museums and architecture',
2,
NOW(),
'Famous for: Bistecca alla Fiorentina, Ribollita, Crostini, Tuscan wines'),

-- Venice (3 nights)
(new_itinerary_id, 'Venice', 3,
'The Floating City - Canals, gondolas, and magical atmosphere',
'High-speed train from Florence to Venice (2 hours)',
'End in Venice for a romantic finale to your Italian journey',
3,
NOW(),
'Famous for: Risotto al Nero di Seppia, Baccalà Mantecato, Cicchetti');

-- Day-by-day hotels
INSERT INTO user_itinerary_day_hotels (
    itinerary_id,
    day_index,
    hotel,
    created_at
) VALUES
-- Rome Hotels
(new_itinerary_id, 1, 'Hotel de Russie - Luxury hotel near Spanish Steps, Via del Babuino, 9', NOW()),
(new_itinerary_id, 2, 'Hotel de Russie - Luxury hotel near Spanish Steps, Via del Babuino, 9', NOW()),
(new_itinerary_id, 3, 'Hotel de Russie - Luxury hotel near Spanish Steps, Via del Babuino, 9', NOW()),
(new_itinerary_id, 4, 'Hotel de Russie - Luxury hotel near Spanish Steps, Via del Babuino, 9', NOW()),

-- Florence Hotels
(new_itinerary_id, 5, 'Portrait Firenze - Luxury hotel overlooking Ponte Vecchio', NOW()),
(new_itinerary_id, 6, 'Portrait Firenze - Luxury hotel overlooking Ponte Vecchio', NOW()),
(new_itinerary_id, 7, 'Portrait Firenze - Luxury hotel overlooking Ponte Vecchio', NOW()),

-- Venice Hotels
(new_itinerary_id, 8, 'The Gritti Palace - Historic luxury hotel on the Grand Canal', NOW()),
(new_itinerary_id, 9, 'The Gritti Palace - Historic luxury hotel on the Grand Canal', NOW()),
(new_itinerary_id, 10, 'The Gritti Palace - Historic luxury hotel on the Grand Canal', NOW());

-- Day-by-day attractions and activities
INSERT INTO user_itinerary_day_attractions (
    itinerary_id,
    day_index,
    attractions,
    created_at
) VALUES
-- Rome Days
(new_itinerary_id, 1, ARRAY[
    'Morning: Colosseum & Roman Forum guided tour (4 hours)',
    'Afternoon: Lunch at Roscioli, explore Monti neighborhood',
    'Evening: Welcome dinner at Roscioli Ristorante'
], NOW()),

(new_itinerary_id, 2, ARRAY[
    'Morning: Vatican Museums & Sistine Chapel early access tour (4 hours)',
    'Afternoon: St. Peter''s Basilica, lunch at Lela''s',
    'Evening: Trastevere food tour'
], NOW()),

(new_itinerary_id, 3, ARRAY[
    'Morning: Galleria Borghese (book in advance)',
    'Afternoon: Spanish Steps & Trevi Fountain',
    'Evening: Dinner at Armando al Pantheon'
], NOW()),

(new_itinerary_id, 4, ARRAY[
    'Morning: Pantheon & Piazza Navona',
    'Afternoon: Campo de'' Fiori & Jewish Ghetto',
    'Evening: Food tour in Testaccio'
], NOW()),

-- Florence Days
(new_itinerary_id, 5, ARRAY[
    'Morning: Uffizi Gallery early access tour',
    'Afternoon: Ponte Vecchio & Pitti Palace',
    'Evening: Sunset at Piazzale Michelangelo'
], NOW()),

(new_itinerary_id, 6, ARRAY[
    'Morning: Accademia Gallery (David)',
    'Afternoon: Duomo Complex tour',
    'Evening: Cooking class in local''s home'
], NOW()),

(new_itinerary_id, 7, ARRAY[
    'Morning: San Lorenzo Market & Cooking Class',
    'Afternoon: Santa Croce & leather district',
    'Evening: Wine tasting in historic cellar'
], NOW()),

-- Venice Days
(new_itinerary_id, 8, ARRAY[
    'Morning: St. Mark''s Basilica & Doge''s Palace',
    'Afternoon: Campanile & Grand Canal tour',
    'Evening: Cicchetti tour in local bacari'
], NOW()),

(new_itinerary_id, 9, ARRAY[
    'Morning: Murano glass-making tour',
    'Afternoon: Burano lace-making demonstration',
    'Evening: Sunset gondola ride'
], NOW()),

(new_itinerary_id, 10, ARRAY[
    'Morning: Rialto Market tour',
    'Afternoon: Venice Jewish Ghetto',
    'Evening: Farewell dinner at Antiche Carampane'
], NOW());

-- Day-by-day notes
INSERT INTO user_itinerary_day_notes (
    itinerary_id,
    day_index,
    notes,
    created_at,
    updated_at
) VALUES
-- Rome Notes
(new_itinerary_id, 1, 'Book Colosseum tour for early morning to avoid crowds. Bring water and comfortable walking shoes. Get Roma Pass.', NOW(), NOW()),
(new_itinerary_id, 2, 'Vatican Museums reservation required. Dress code: no shorts, bare shoulders. Bring water.', NOW(), NOW()),
(new_itinerary_id, 3, 'Galleria Borghese requires advance booking. Limited to 2-hour visits.', NOW(), NOW()),
(new_itinerary_id, 4, 'Morning is best for Pantheon photos. Market closes early.', NOW(), NOW()),

-- Florence Notes
(new_itinerary_id, 5, 'Book Uffizi tickets in advance. Get Firenze Card for museum access.', NOW(), NOW()),
(new_itinerary_id, 6, 'Duomo climb requires good fitness level. Book David statue in advance.', NOW(), NOW()),
(new_itinerary_id, 7, 'Market closed Sundays. Bring cash for leather shopping.', NOW(), NOW()),

-- Venice Notes
(new_itinerary_id, 8, 'Book Secret Itineraries tour for Doge''s Palace. Get vaporetto pass.', NOW(), NOW()),
(new_itinerary_id, 9, 'First boat to islands leaves early. Check weather for gondola ride.', NOW(), NOW()),
(new_itinerary_id, 10, 'Market closed Sunday afternoon. Restaurant reservations essential.', NOW(), NOW());

-- Initialize likes (assuming we want to start with some initial likes)
INSERT INTO user_itinerary_likes (
    itinerary_id,
    user_id,
    created_at
) VALUES
(new_itinerary_id, 'f47ac10b-58cc-4372-a567-0e02b2c3d479', NOW()),  -- Sample user ID
(new_itinerary_id, '550e8400-e29b-41d4-a716-446655440000', NOW());  -- Sample user ID

END $$; 