import { supabase } from '../lib/supabase';

export interface SaveItineraryData {
  tripSummary: {
    tripName: string;
    country: string;
    duration: number;
    startDate: string;
    passengers: number;
  };
  destinations: {
    destination: string;
    nights: number;
    sleeping: string;
    discover: string;
    transport: string;
    notes: string;
  }[];
  dayAttractions: {
    dayIndex: number;
    selectedAttractions: string[];
  }[];
}

export const ItineraryService = {
  async saveItinerary(data: SaveItineraryData) {
    try {
      // First, insert the main itinerary
      const { data: itinerary, error: itineraryError } = await supabase
        .from('user_itineraries')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          trip_name: data.tripSummary.tripName,
          country: data.tripSummary.country,
          start_date: data.tripSummary.startDate,
          duration: data.tripSummary.duration,
          passengers: data.tripSummary.passengers
        })
        .select()
        .single();

      if (itineraryError) throw itineraryError;

      // Then, insert all destinations
      const destinationsToInsert = data.destinations.map((dest, index) => ({
        itinerary_id: itinerary.id,
        destination: dest.destination,
        nights: dest.nights,
        sleeping: dest.sleeping,
        discover: dest.discover,
        transport: dest.transport,
        notes: dest.notes,
        order_index: index
      }));

      const { data: destinations, error: destinationsError } = await supabase
        .from('user_itinerary_destinations')
        .insert(destinationsToInsert)
        .select();

      if (destinationsError) throw destinationsError;

      // Finally, insert day attractions
      const attractionsToInsert = data.dayAttractions.map(day => ({
        itinerary_id: itinerary.id,
        destination_id: destinations[Math.floor(day.dayIndex / destinations.length)].id,
        day_index: day.dayIndex,
        attractions: day.selectedAttractions
      }));

      const { error: attractionsError } = await supabase
        .from('user_itinerary_day_attractions')
        .insert(attractionsToInsert);

      if (attractionsError) throw attractionsError;

      return { itinerary, destinations };
    } catch (error) {
      console.error('Error saving itinerary:', error);
      throw error;
    }
  },

  async getItineraryById(id: string) {
    try {
      const { data: itinerary, error } = await supabase
        .from('user_itineraries')
        .select(`
          *,
          destinations:user_itinerary_destinations (
            id,
            destination,
            nights,
            sleeping,
            discover,
            transport,
            notes,
            order_index
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data: itinerary };
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      throw error;
    }
  }
}; 