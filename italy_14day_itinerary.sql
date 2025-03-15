-- Insert Data for 14-Day Italian Itinerary
DO $$
DECLARE
    new_itinerary_id uuid;
BEGIN

-- Main Itinerary
INSERT INTO user_itineraries (
    id,
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
    '19d38ea2-72be-4ec1-a6bb-e5f27ad56a67',
    'Grand Italian Adventure: From North to South',
    'Italy',
    '2024-06-01',
    14,
    2,
    NOW(),
    NOW(),
    false,
    ARRAY['culture', 'food', 'history', 'art', 'architecture', 'coastal', 'wine']
) RETURNING id INTO new_itinerary_id;

-- Destinations with comprehensive details
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
-- Venice (3 nights)
(new_itinerary_id, 'Venice', 3, 
'St. Mark''s Basilica, Doge''s Palace, Rialto Bridge, Grand Canal, Murano Island, Burano Island, Campanile, Peggy Guggenheim Collection, Bridge of Sighs',
'Arrive at Venice Marco Polo Airport (VCE). Water taxi or Alilaguna to city center. Next destination: 2.5 hours by train to Florence',
'Start in Venice for a magical introduction to Italy',
1,
NOW(),
'Antiche Carampane, Osteria alle Testiere, Venissa, All''Arco, Osteria ai Promessi Sposi - Famous for: Risotto al Nero di Seppia, Baccalà Mantecato, Fresh Seafood'),

-- Florence (3 nights)
(new_itinerary_id, 'Florence', 3,
'Uffizi Gallery, Duomo, Ponte Vecchio, Accademia Gallery, Palazzo Pitti, Boboli Gardens, Piazzale Michelangelo, Santa Croce, San Lorenzo Market',
'High-speed train from Venice to Florence (2.5 hours). Next destination: 1.5 hours by train to Rome',
'The birthplace of Renaissance, art and architecture paradise',
2,
NOW(),
'La Giostra, La Bottega del Buon Caffè, Enoteca Pinchiorri, All''Antico Vinaio, La Menagere - Famous for: Bistecca alla Fiorentina, Ribollita, Crostini, Tuscan Wines'),

-- Rome (3 nights)
(new_itinerary_id, 'Rome', 3, 
'Colosseum, Roman Forum, Vatican Museums, Sistine Chapel, Pantheon, Trevi Fountain, Spanish Steps, Borghese Gallery, Trastevere',
'High-speed train from Florence to Rome (1.5 hours). Next destination: 2 hours by train to Naples',
'The Eternal City with ancient history at every corner',
3,
NOW(),
'Roscioli, Armando al Pantheon, La Pergola, Pierluigi, Da Enzo - Famous for: Carbonara, Cacio e Pepe, Roman Pizza, Supplì'),

-- Naples & Pompeii (2 nights)
(new_itinerary_id, 'Naples', 2,
'Naples Archaeological Museum, Pompeii Ruins, Mount Vesuvius, Spaccanapoli, Cappella Sansevero, Naples Underground',
'High-speed train from Rome to Naples (2 hours). Next destination: 3 hours by car to Positano',
'Pizza birthplace and ancient history combined',
4,
NOW(),
'L''Antica Pizzeria da Michele, Sorbillo, 50 Kalò, Palazzo Petrucci, Concettina ai Tre Santi - Famous for: Neapolitan Pizza, Sfogliatella, Babà'),

-- Amalfi Coast (2 nights)
(new_itinerary_id, 'Positano', 2,
'Positano Beach, Path of the Gods hike, Amalfi Cathedral, Villa Rufolo in Ravello, Emerald Grotto, Boat tour to Capri',
'Private transfer from Naples to Positano (3 hours). Next destination: 5 hours by train to Venice for departure',
'Stunning coastal views and Mediterranean charm',
5,
NOW(),
'La Sponda, Zass, Lo Scoglio, La Tagliata, Don Alfonso 1890 - Famous for: Fresh Seafood, Limoncello, Delizia al Limone');

-- Day-by-day hotels
INSERT INTO user_itinerary_day_hotels (
    itinerary_id,
    day_index,
    hotel,
    created_at
) VALUES
-- Venice Hotels
(new_itinerary_id, 1, 'The Gritti Palace - Historic luxury hotel on the Grand Canal', NOW()),
(new_itinerary_id, 2, 'The Gritti Palace - Historic luxury hotel on the Grand Canal', NOW()),
(new_itinerary_id, 3, 'The Gritti Palace - Historic luxury hotel on the Grand Canal', NOW()),

-- Florence Hotels
(new_itinerary_id, 4, 'Portrait Firenze - Luxury hotel overlooking Ponte Vecchio', NOW()),
(new_itinerary_id, 5, 'Portrait Firenze - Luxury hotel overlooking Ponte Vecchio', NOW()),
(new_itinerary_id, 6, 'Portrait Firenze - Luxury hotel overlooking Ponte Vecchio', NOW()),

-- Rome Hotels
(new_itinerary_id, 7, 'Hotel de Russie - Luxury hotel near Spanish Steps', NOW()),
(new_itinerary_id, 8, 'Hotel de Russie - Luxury hotel near Spanish Steps', NOW()),
(new_itinerary_id, 9, 'Hotel de Russie - Luxury hotel near Spanish Steps', NOW()),

-- Naples Hotels
(new_itinerary_id, 10, 'Romeo Hotel - Modern luxury hotel with bay views', NOW()),
(new_itinerary_id, 11, 'Romeo Hotel - Modern luxury hotel with bay views', NOW()),

-- Positano Hotels
(new_itinerary_id, 12, 'Le Sirenuse - Iconic luxury hotel with sea views', NOW()),
(new_itinerary_id, 13, 'Le Sirenuse - Iconic luxury hotel with sea views', NOW()),
(new_itinerary_id, 14, 'The Gritti Palace - Last night back in Venice for departure', NOW());

-- Day-by-day attractions
INSERT INTO user_itinerary_day_attractions (
    itinerary_id,
    day_index,
    attractions,
    created_at
) VALUES
-- Venice Days
(new_itinerary_id, 1, ARRAY[
    'Morning: St. Mark''s Basilica & Doge''s Palace tour',
    'Afternoon: Grand Canal boat tour',
    'Evening: Welcome dinner at Antiche Carampane'
], NOW()),

(new_itinerary_id, 2, ARRAY[
    'Morning: Murano glass-making tour',
    'Afternoon: Burano lace and colorful houses',
    'Evening: Cicchetti tour in local bacari'
], NOW()),

(new_itinerary_id, 3, ARRAY[
    'Morning: Rialto Market tour',
    'Afternoon: Peggy Guggenheim Collection',
    'Evening: Sunset gondola ride'
], NOW()),

-- Florence Days
(new_itinerary_id, 4, ARRAY[
    'Morning: Uffizi Gallery early access tour',
    'Afternoon: Ponte Vecchio & city walking tour',
    'Evening: Dinner at La Giostra'
], NOW()),

(new_itinerary_id, 5, ARRAY[
    'Morning: Accademia Gallery (David)',
    'Afternoon: Duomo Complex climb',
    'Evening: Sunset at Piazzale Michelangelo'
], NOW()),

(new_itinerary_id, 6, ARRAY[
    'Morning: San Lorenzo Market & Cooking Class',
    'Afternoon: Pitti Palace & Boboli Gardens',
    'Evening: Wine tasting experience'
], NOW()),

-- Rome Days
(new_itinerary_id, 7, ARRAY[
    'Morning: Colosseum & Roman Forum guided tour',
    'Afternoon: Pantheon & Piazza Navona',
    'Evening: Dinner at Roscioli'
], NOW()),

(new_itinerary_id, 8, ARRAY[
    'Morning: Vatican Museums & Sistine Chapel',
    'Afternoon: St. Peter''s Basilica',
    'Evening: Trastevere food tour'
], NOW()),

(new_itinerary_id, 9, ARRAY[
    'Morning: Borghese Gallery & Gardens',
    'Afternoon: Spanish Steps & Shopping',
    'Evening: Dinner at La Pergola'
], NOW()),

-- Naples Days
(new_itinerary_id, 10, ARRAY[
    'Morning: Naples Archaeological Museum',
    'Afternoon: Historic Center & Spaccanapoli',
    'Evening: Pizza tasting at L''Antica Pizzeria da Michele'
], NOW()),

(new_itinerary_id, 11, ARRAY[
    'Morning: Pompeii Archaeological Park guided tour',
    'Afternoon: Mount Vesuvius hike',
    'Evening: Seafood dinner at Palazzo Petrucci'
], NOW()),

-- Positano Days
(new_itinerary_id, 12, ARRAY[
    'Morning: Positano Beach & town exploration',
    'Afternoon: Path of the Gods hike',
    'Evening: Dinner at La Sponda'
], NOW()),

(new_itinerary_id, 13, ARRAY[
    'Morning: Boat tour to Capri & Blue Grotto',
    'Afternoon: Ravello visit - Villa Rufolo & Villa Cimbrone',
    'Evening: Farewell dinner at Zass'
], NOW()),

(new_itinerary_id, 14, ARRAY[
    'Morning: Transfer to Venice',
    'Afternoon: Final Venice shopping',
    'Evening: Farewell dinner at Ristorante Quadri'
], NOW());

END $$; 