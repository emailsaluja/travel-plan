import { supabase } from '../lib/supabase';

export interface UserItinerary {
  id: string;
  trip_name: string;
  country: string;
  start_date: string;
  duration: number;
  passengers: number;
  created_at: string;
  destinations: {
    id: string;
    destination: string;
    nights: number;
    discover: string;
    transport: string;
    notes: string;
    order_index: number;
  }[];
  day_attractions: {
    day_index: number;
    attractions: string[];
  }[];
  day_hotels: {
    day_index: number;
    hotel: string;
  }[];
}

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
    discover: string;
    transport: string;
    notes: string;
  }[];
  dayAttractions: {
    dayIndex: number;
    selectedAttractions: string[];
  }[];
  dayHotels: {
    day_index: number;
    hotel: string;
  }[];
  dayNotes: {
    day_index: number;
    notes: string;
  }[];
}

export const UserItineraryService = {
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

      // Then, insert destinations
      const destinationsToInsert = data.destinations.map((dest, index) => ({
        itinerary_id: itinerary.id,
        destination: dest.destination,
        nights: dest.nights,
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

      // Insert day attractions if they exist
      if (data.dayAttractions && data.dayAttractions.length > 0) {
        const attractionsToInsert = data.dayAttractions.map(day => {
          const destinationIndex = Math.floor(day.dayIndex / data.destinations.length);
          return {
            itinerary_id: itinerary.id,
            destination_id: destinations[destinationIndex].id,
            day_index: day.dayIndex,
            attractions: day.selectedAttractions
          };
        });

        const { error: attractionsError } = await supabase
          .from('user_itinerary_day_attractions')
          .insert(attractionsToInsert);

        if (attractionsError) throw attractionsError;
      }

      // Insert day hotels if they exist
      if (data.dayHotels && data.dayHotels.length > 0) {
        const hotelsToInsert = data.dayHotels.map(day => ({
          itinerary_id: itinerary.id,
          day_index: day.day_index,
          hotel: day.hotel
        }));

        const { error: hotelsError } = await supabase
          .from('user_itinerary_day_hotels')
          .insert(hotelsToInsert);

        if (hotelsError) throw hotelsError;
      }

      // Insert day notes if they exist
      if (data.dayNotes && data.dayNotes.length > 0) {
        const notesToInsert = data.dayNotes.map(day => ({
          itinerary_id: itinerary.id,
          day_index: day.day_index,
          notes: day.notes
        }));

        const { error: notesError } = await supabase
          .from('user_itinerary_day_notes')
          .insert(notesToInsert);

        if (notesError) throw notesError;
      }

      return { itinerary, destinations };
    } catch (error) {
      console.error('Error saving itinerary:', error);
      throw error;
    }
  },

  async getUserItineraries() {
    try {
      const { data, error } = await supabase
        .from('user_itineraries')
        .select(`
          *,
          destinations:user_itinerary_destinations(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error fetching user itineraries:', error);
      throw error;
    }
  },

  async getItineraryById(id: string) {
    try {
      const { data, error } = await supabase
        .from('user_itineraries')
        .select(`
          *,
          destinations:user_itinerary_destinations(*),
          day_attractions:user_itinerary_day_attractions(*),
          day_hotels:user_itinerary_day_hotels(*),
          day_notes:user_itinerary_day_notes(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      throw error;
    }
  },

  async deleteItinerary(id: string) {
    try {
      // Delete in correct order to handle foreign key constraints
      const { error: attractionsError } = await supabase
        .from('user_itinerary_day_attractions')
        .delete()
        .eq('itinerary_id', id);
      
      if (attractionsError) throw attractionsError;

      const { error: hotelsError } = await supabase
        .from('user_itinerary_day_hotels')
        .delete()
        .eq('itinerary_id', id);
      
      if (hotelsError) throw hotelsError;

      const { error: destinationsError } = await supabase
        .from('user_itinerary_destinations')
        .delete()
        .eq('itinerary_id', id);
      
      if (destinationsError) throw destinationsError;

      const { error: itineraryError } = await supabase
        .from('user_itineraries')
        .delete()
        .eq('id', id);

      if (itineraryError) throw itineraryError;

      return { success: true };
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      throw error;
    }
  },

  async updateItinerary(id: string, data: SaveItineraryData) {
    try {
      // Update main itinerary
      const { error: itineraryError } = await supabase
        .from('user_itineraries')
        .update({
          trip_name: data.tripSummary.tripName,
          country: data.tripSummary.country,
          start_date: data.tripSummary.startDate,
          duration: data.tripSummary.duration,
          passengers: data.tripSummary.passengers
        })
        .eq('id', id);

      if (itineraryError) throw itineraryError;

      // Delete existing destinations, attractions, hotels, and notes
      await supabase.from('user_itinerary_day_attractions').delete().eq('itinerary_id', id);
      await supabase.from('user_itinerary_day_hotels').delete().eq('itinerary_id', id);
      await supabase.from('user_itinerary_day_notes').delete().eq('itinerary_id', id);
      await supabase.from('user_itinerary_destinations').delete().eq('itinerary_id', id);

      // Insert updated destinations
      const destinationsToInsert = data.destinations.map((dest, index) => ({
        itinerary_id: id,
        destination: dest.destination,
        nights: dest.nights,
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

      // Insert updated day attractions if they exist
      if (data.dayAttractions && data.dayAttractions.length > 0) {
        let currentDestIndex = 0;
        let daysAccumulated = 0;
        
        const attractionsToInsert = data.dayAttractions.map(day => {
          while (currentDestIndex < data.destinations.length && 
                 daysAccumulated + data.destinations[currentDestIndex].nights <= day.dayIndex) {
            daysAccumulated += data.destinations[currentDestIndex].nights;
            currentDestIndex++;
          }
          
          return {
            itinerary_id: id,
            destination_id: destinations[Math.min(currentDestIndex, destinations.length - 1)].id,
            day_index: day.dayIndex,
            attractions: day.selectedAttractions
          };
        });

        const { error: attractionsError } = await supabase
          .from('user_itinerary_day_attractions')
          .insert(attractionsToInsert);

        if (attractionsError) throw attractionsError;
      }

      // Insert updated day hotels if they exist
      if (data.dayHotels && data.dayHotels.length > 0) {
        const hotelsToInsert = data.dayHotels.map(day => ({
          itinerary_id: id,
          day_index: day.day_index,
          hotel: day.hotel
        }));

        const { error: hotelsError } = await supabase
          .from('user_itinerary_day_hotels')
          .insert(hotelsToInsert);

        if (hotelsError) throw hotelsError;
      }

      // Insert updated day notes if they exist
      if (data.dayNotes && data.dayNotes.length > 0) {
        const notesToInsert = data.dayNotes.map(day => ({
          itinerary_id: id,
          day_index: day.day_index,
          notes: day.notes
        }));

        const { error: notesError } = await supabase
          .from('user_itinerary_day_notes')
          .insert(notesToInsert);

        if (notesError) throw notesError;
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating itinerary:', error);
      throw error;
    }
  }
}; 