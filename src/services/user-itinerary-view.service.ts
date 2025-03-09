import { supabase } from '../lib/supabase';

export interface UserItineraryView {
  id: string;
  trip_name: string;
  country: string;
  start_date: string;
  duration: number;
  passengers: number;
  destinations: {
    destination: string;
    nights: number;
    discover: string;
    transport: string;
    notes: string;
  }[];
  day_attractions: {
    day_index: number;
    attractions: string[];
  }[];
  day_hotels: {
    day_index: number;
    hotel: string;
  }[];
  day_notes: {
    day_index: number;
    notes: string;
  }[];
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
      .eq('itinerary_id', id);

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

    // Get the day hotels
    const { data: dayHotels, error: hotelsError } = await supabase
      .from('user_itinerary_day_hotels')
      .select('*')
      .eq('itinerary_id', id)
      .order('day_index', { ascending: true });

    if (hotelsError) {
      return { data: null, error: hotelsError };
    }

    // Get the day notes
    const { data: dayNotes, error: notesError } = await supabase
      .from('user_itinerary_day_notes')
      .select('*')
      .eq('itinerary_id', id)
      .order('day_index', { ascending: true });

    if (notesError) {
      return { data: null, error: notesError };
    }

    console.log('Fetched day attractions:', dayAttractions);
    console.log('Fetched day hotels:', dayHotels);
    console.log('Fetched day notes:', dayNotes);

    const formattedData = {
      ...itinerary,
      destinations: destinations || [],
      day_attractions: dayAttractions || [],
      day_hotels: dayHotels || [],
      day_notes: dayNotes || []
    };

    console.log('Formatted itinerary data:', formattedData);

    return {
      data: formattedData,
      error: null
    };
  }
}; 