-- Insert Data for 7-Day Family Italy Itinerary
DO $$
DECLARE
    new_itinerary_id uuid;
    system_user_id uuid := '45aacc90-3a1b-419c-b487-58d7b64f70a1';
BEGIN
    -- First, cleanup any existing data
    DELETE FROM user_itinerary_day_notes
    WHERE itinerary_id IN (
        SELECT id FROM user_itineraries 
        WHERE trip_name = 'Family Adventure in Italy: Rome, Florence & Venice'
        AND user_id = system_user_id
    );

    DELETE FROM user_itinerary_day_attractions
    WHERE itinerary_id IN (
        SELECT id FROM user_itineraries 
        WHERE trip_name = 'Family Adventure in Italy: Rome, Florence & Venice'
        AND user_id = system_user_id
    );

    DELETE FROM user_itinerary_day_hotels
    WHERE itinerary_id IN (
        SELECT id FROM user_itineraries 
        WHERE trip_name = 'Family Adventure in Italy: Rome, Florence & Venice'
        AND user_id = system_user_id
    );

    DELETE FROM user_itinerary_destinations
    WHERE itinerary_id IN (
        SELECT id FROM user_itineraries 
        WHERE trip_name = 'Family Adventure in Italy: Rome, Florence & Venice'
        AND user_id = system_user_id
    );

    DELETE FROM user_itineraries
    WHERE trip_name = 'Family Adventure in Italy: Rome, Florence & Venice'
    AND user_id = system_user_id;

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
        tags,
        user_id
    ) VALUES (
        'Family Adventure in Italy: Rome, Florence & Venice',
        'Italy',
        '2024-06-01',
        7,
        4,
        NOW(),
        NOW(),
        false,
        ARRAY['family', 'culture', 'food', 'history', 'art', 'fun'],
        system_user_id
    ) RETURNING id INTO new_itinerary_id;

    -- Destinations with family-friendly details and manual hotels
    INSERT INTO user_itinerary_destinations (
        itinerary_id,
        destination,
        nights,
        discover,
        transport,
        notes,
        order_index,
        created_at,
        food,
        manual_hotel
    ) VALUES 
    -- Rome (3 nights)
    (new_itinerary_id, 'Rome', 3, 
    'Family-friendly exploration of ancient Rome, interactive museums, and delicious gelato',
    'Arrive at Rome Fiumicino Airport (FCO). Take Leonardo Express train or taxi to city center',
    'Start with Rome for an exciting introduction to Italy''s history',
    1,
    NOW(),
    'Family-friendly restaurants: La Boccaccia, Pizzeria da Baffetto, Gelateria del Teatro - Famous for: Pizza, Pasta, Gelato',
    'Hotel Artemide - Family-friendly hotel with kitchenette rooms, located in the heart of Rome'),

    -- Florence (2 nights)
    (new_itinerary_id, 'Florence', 2,
    'Interactive art experiences, family cooking classes, and beautiful gardens',
    'High-speed train from Rome to Florence (1.5 hours)',
    'Perfect for families with interactive museums and activities',
    2,
    NOW(),
    'Family-friendly restaurants: La Giostra, Osteria Santo Spirito, Gelateria dei Neri - Famous for: Pizza, Pasta, Gelato',
    'Hotel Spadai - Luxury family suites in the heart of Florence, perfect for families'),

    -- Venice (2 nights)
    (new_itinerary_id, 'Venice', 2,
    'Magical canals, mask-making workshops, and gondola rides',
    'High-speed train from Florence to Venice (2 hours)',
    'End in Venice for a magical family experience',
    3,
    NOW(),
    'Family-friendly restaurants: Al Timon, Osteria al Cicheto, Gelateria Nico - Famous for: Pizza, Pasta, Gelato',
    'Hotel Al Codega - Charming family rooms in a quiet area of Venice');

    -- Day-by-day hotels
    INSERT INTO user_itinerary_day_hotels (
        itinerary_id,
        day_index,
        hotel,
        created_at
    ) VALUES
    -- Rome Hotels (Days 1-3)
    (new_itinerary_id, 1, 'Hotel Artemide', NOW()),
    (new_itinerary_id, 2, 'Hotel Artemide', NOW()),
    (new_itinerary_id, 3, 'Hotel Artemide', NOW()),

    -- Florence Hotels (Days 4-5)
    (new_itinerary_id, 4, 'Hotel Spadai', NOW()),
    (new_itinerary_id, 5, 'Hotel Spadai', NOW()),

    -- Venice Hotels (Days 6-7)
    (new_itinerary_id, 6, 'Hotel Al Codega', NOW()),
    (new_itinerary_id, 7, 'Hotel Al Codega', NOW());

    -- Day-by-day attractions (family-friendly activities)
    INSERT INTO user_itinerary_day_attractions (
        itinerary_id,
        day_index,
        attractions,
        created_at
    ) VALUES
    -- Rome Days
    (new_itinerary_id, 1, ARRAY[
        'Morning: Colosseum & Roman Forum family tour with interactive guide',
        'Afternoon: Lunch at La Boccaccia, explore Piazza Navona with gelato',
        'Evening: Welcome dinner at family-friendly trattoria'
    ], NOW()),
    (new_itinerary_id, 2, ARRAY[
        'Morning: Vatican Museums & Sistine Chapel family tour',
        'Afternoon: Pizza-making class for the whole family',
        'Evening: Explore Trastevere neighborhood'
    ], NOW()),
    (new_itinerary_id, 3, ARRAY[
        'Morning: Gladiator School experience',
        'Afternoon: Borghese Gardens with bike rental',
        'Evening: Sunset at Pincio Terrace'
    ], NOW()),

    -- Florence Days
    (new_itinerary_id, 4, ARRAY[
        'Morning: Uffizi Gallery family tour',
        'Afternoon: Gelato-making workshop',
        'Evening: Sunset at Piazzale Michelangelo'
    ], NOW()),
    (new_itinerary_id, 5, ARRAY[
        'Morning: Accademia Gallery (David) & city walking tour',
        'Afternoon: Leonardo da Vinci Museum',
        'Evening: Family cooking class'
    ], NOW()),

    -- Venice Days
    (new_itinerary_id, 6, ARRAY[
        'Morning: St. Mark''s Basilica & Doge''s Palace tour',
        'Afternoon: Mask-making workshop',
        'Evening: Gondola ride with music'
    ], NOW()),
    (new_itinerary_id, 7, ARRAY[
        'Morning: Murano glass-blowing demonstration',
        'Afternoon: Treasure hunt in Venice',
        'Evening: Farewell dinner in local restaurant'
    ], NOW());

    -- Day-by-day notes
    INSERT INTO user_itinerary_day_notes (
        itinerary_id,
        day_index,
        notes,
        created_at
    ) VALUES
    -- Rome Days
    (new_itinerary_id, 1, 'Arrival day - take it easy and explore the neighborhood. Pre-book skip-the-line tickets for Colosseum.', NOW()),
    (new_itinerary_id, 2, 'Early start for Vatican - less crowded in morning. Book family tour in advance.', NOW()),
    (new_itinerary_id, 3, 'Book Gladiator School in advance - very popular! Bring comfortable shoes for Borghese Gardens.', NOW()),

    -- Florence Days
    (new_itinerary_id, 4, 'Book Uffizi tickets in advance. Gelato workshop needs 24hr advance booking.', NOW()),
    (new_itinerary_id, 5, 'Book cooking class in advance. Leonardo Museum is very interactive for kids.', NOW()),

    -- Venice Days
    (new_itinerary_id, 6, 'Book Secret Itineraries tour for Doge''s Palace - great for kids!', NOW()),
    (new_itinerary_id, 7, 'Murano visit - take early vaporetto to avoid crowds.', NOW());

    RAISE NOTICE 'Successfully created itinerary with ID: %', new_itinerary_id;
END $$; 