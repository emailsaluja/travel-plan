import { supabase } from '../lib/supabase';

export interface UserItineraryView {
  id: string;
  trip_name: string;
  country: string;
  start_date: string;
  duration: number;
  passengers: number;
  created_at: string;
  updated_at: string;
  is_private: boolean;
  tags: string[];
  trip_description?: string;
  food_descriptions?: { [destination: string]: { [place: string]: string } };
  destinations: {
    destination: string;
    nights: number;
    discover: string;
    transport: string;
    notes: string;
    order_index: number;
    food: string;
    food_desc?: string;
    destination_overview?: string;
  }[];
  discover_descriptions?: {
    [destination: string]: {
      [place: string]: string;
    };
  };
  day_attractions: {
    day_index: number;
    attractions: string[];
  }[];
  day_hotels: {
    day_index: number;
    hotel: string;
    hotel_desc?: string;
  }[];
  day_notes: {
    day_index: number;
    notes: string;
    day_overview?: string;
  }[];
  day_food_options: {
    day_index: number;
    food_options: {
      id: string;
      name: {
        text: string;
        cuisine?: string;
        known_for?: string;
      };
    }[];
  }[];
}

export const UserItineraryViewService = {
  async getItineraryById(id: string): Promise<{ data: UserItineraryView | null; error: any }> {
    try {
      const { data: itineraryData, error: itineraryError } = await supabase
        .from('user_itineraries')
        .select(`
          id,
          trip_name,
          country,
          start_date,
          duration,
          passengers,
          created_at,
          updated_at,
          is_private,
          tags,
          trip_description
        `)
        .eq('id', id)
        .single();

      if (itineraryError) throw itineraryError;
      if (!itineraryData) return { data: null, error: null };

      // Fetch destinations
      const { data: destinations, error: destinationsError } = await supabase
        .from('user_itinerary_destinations')
        .select('*')
        .eq('itinerary_id', id)
        .order('order_index');

      if (destinationsError) throw destinationsError;

      // Fetch day attractions
      const { data: dayAttractions, error: attractionsError } = await supabase
        .from('user_itinerary_day_attractions')
        .select('*')
        .eq('itinerary_id', id)
        .order('day_index');

      if (attractionsError) throw attractionsError;

      // Fetch day hotels
      const { data: dayHotels, error: hotelsError } = await supabase
        .from('user_itinerary_day_hotels')
        .select('*')
        .eq('itinerary_id', id)
        .order('day_index');

      if (hotelsError) throw hotelsError;

      // Fetch day notes
      const { data: dayNotes, error: notesError } = await supabase
        .from('user_itinerary_day_notes')
        .select('day_index, notes, day_overview')
        .eq('itinerary_id', id)
        .order('day_index');

      if (notesError) throw notesError;

      // Fetch day food options
      const { data: dayFoodOptions, error: foodError } = await supabase
        .from('user_itinerary_day_food_options')
        .select('*')
        .eq('itinerary_id', id)
        .order('day_index');

      if (foodError) throw foodError;

      // Map the data to the UserItineraryView interface
      const itineraryView: UserItineraryView = {
        id: itineraryData.id,
        trip_name: itineraryData.trip_name,
        country: itineraryData.country,
        start_date: itineraryData.start_date,
        duration: itineraryData.duration,
        passengers: itineraryData.passengers,
        created_at: itineraryData.created_at,
        updated_at: itineraryData.updated_at,
        is_private: itineraryData.is_private,
        tags: itineraryData.tags,
        trip_description: itineraryData.trip_description,
        destinations: destinations.map(d => ({
          destination: d.destination,
          nights: d.nights,
          discover: d.discover,
          transport: d.transport,
          notes: d.notes,
          order_index: d.order_index,
          food: d.food,
          food_desc: d.food_desc,
          destination_overview: d.destination_overview
        })),
        day_attractions: dayAttractions.map(da => ({
          day_index: da.day_index,
          attractions: da.attractions
        })),
        day_hotels: dayHotels.map(dh => ({
          day_index: dh.day_index,
          hotel: dh.hotel,
          hotel_desc: dh.hotel_desc
        })),
        day_notes: dayNotes.map(dn => ({
          day_index: dn.day_index,
          notes: dn.notes,
          day_overview: dn.day_overview
        })),
        day_food_options: dayFoodOptions.map(df => ({
          day_index: df.day_index,
          food_options: df.food_options
        }))
      };

      return {
        data: itineraryView,
        error: null
      };
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      return { data: null, error };
    }
  }
}; 