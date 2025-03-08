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
    sleeping: string;
    discover: string;
    transport: string;
    notes: string;
  }[];
  day_attractions: {
    day_index: number;
    attractions: {
      name: string;
      place_id: string;
      types: string[];
      rating?: number;
      user_ratings_total?: number;
      formatted_address?: string;
    }[];
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

    return {
      data: {
        ...itinerary,
        destinations: destinations || [],
        day_attractions: dayAttractions || []
      },
      error: null
    };
  }
}; 