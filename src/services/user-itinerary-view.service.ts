import { supabase } from '../lib/supabase';

export interface UserItineraryView {
  id: string;
  user_id: string;
  trip_name: string;
  country: string;
  start_date: string;
  duration: number;
  passengers: number;
  is_private: boolean;
  destinations: {
    destination: string;
    nights: number;
    discover: string;
    transport: string;
    notes: string;
    food: string;
  }[];
  discover_descriptions?: {
    [destination: string]: {
      [place: string]: string;
    };
  };
  day_attractions?: {
    day_index: number;
    attractions: {
      id: string;
      name: string;
      description?: string;
    }[];
  }[];
  day_hotels?: {
    day_index: number;
    hotel: string;
    hotel_desc?: string;
  }[];
  day_notes?: {
    day_index: number;
    notes: string;
  }[];
  day_food_options: Array<{
    day_index: number;
    food_options: Array<{
      id: string;
      name: string;
      cuisine?: string;
      description?: string;
    }>;
  }>;
}

export const UserItineraryViewService = {
  async getItineraryById(id: string): Promise<{ data: UserItineraryView | null; error: any }> {
    // Get the main itinerary data
    const { data: itinerary, error: itineraryError } = await supabase
      .from('user_itineraries')
      .select('*')
      .eq('id', id)
      .single();

    if (itineraryError) {
      return { data: null, error: itineraryError };
    }

    // Get the destinations
    const { data: destinations, error: destinationsError } = await supabase
      .from('user_itinerary_destinations')
      .select('*')
      .eq('itinerary_id', id)
      .order('order_index', { ascending: true });

    if (destinationsError) {
      return { data: null, error: destinationsError };
    }

    // Get the day attractions
    const { data: dayAttractions, error: attractionsError } = await supabase
      .from('user_itinerary_day_attractions')
      .select('*')
      .eq('itinerary_id', id)
      .order('day_index', { ascending: true });

    if (attractionsError) {
      return { data: null, error: attractionsError };
    }

    // Process attractions to ensure proper format
    const processedDayAttractions = dayAttractions?.map(day => {
      return {
        day_index: day.day_index,
        attractions: Array.isArray(day.attractions) ? day.attractions.map((attraction: any) => {
          if (typeof attraction === 'object' && attraction !== null) {
            return {
              id: attraction.id || '',
              name: attraction.name || '',
              description: attraction.description || ''
            };
          }
          return {
            id: '',
            name: String(attraction),
            description: ''
          };
        }) : []
      };
    }) || [];

    // Get the day hotels
    const { data: dayHotels, error: hotelsError } = await supabase
      .from('user_itinerary_day_hotels')
      .select('*')
      .eq('itinerary_id', id)
      .order('day_index', { ascending: true });

    if (hotelsError) {
      return { data: null, error: hotelsError };
    }

    // Process hotels to ensure proper format and adjust day_index
    const processedDayHotels = dayHotels?.map(hotel => ({
      day_index: hotel.day_index,
      hotel: hotel.hotel || '',
      hotel_desc: hotel.hotel_desc || ''
    })) || [];

    // Get the day notes
    const { data: dayNotes, error: notesError } = await supabase
      .from('user_itinerary_day_notes')
      .select('*')
      .eq('itinerary_id', id)
      .order('day_index', { ascending: true });

    if (notesError) {
      return { data: null, error: notesError };
    }

    // Get the food options
    const { data: foodOptions, error: foodError } = await supabase
      .from('user_itinerary_day_food_options')
      .select('*')
      .eq('itinerary_id', id)
      .order('day_index', { ascending: true });

    if (foodError) {
      return { data: null, error: foodError };
    }

    // Process food options into day_food_options format
    const processedDayFoodOptions = foodOptions?.map(day => ({
      day_index: day.day_index,
      food_options: Array.isArray(day.name) ? day.name.map((food: any) => ({
        id: food.id || '',
        name: food.name?.text || '',
        cuisine: food.name?.cuisine || 'Local Cuisine',
        description: food.name?.known_for || '-'
      })) : []
    })) || [];

    console.log('Processed day attractions:', processedDayAttractions);
    console.log('Processed day hotels:', processedDayHotels);
    console.log('Fetched day notes:', dayNotes);
    console.log('Processed food options:', processedDayFoodOptions);

    const formattedData = {
      ...itinerary,
      destinations: destinations || [],
      day_attractions: processedDayAttractions,
      day_hotels: processedDayHotels,
      day_notes: dayNotes || [],
      day_food_options: processedDayFoodOptions
    };

    console.log('Formatted itinerary data:', formattedData);

    return {
      data: formattedData,
      error: null
    };
  }
}; 