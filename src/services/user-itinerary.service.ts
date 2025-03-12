import { supabase } from '../lib/supabase';

export interface UserItinerary {
  id: string;
  trip_name: string;
  country: string;
  start_date: string;
  duration: number;
  passengers: number;
  created_at: string;
  is_private: boolean;
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
    isPrivate: boolean;
  };
  destinations: {
    destination: string;
    nights: number;
    discover: string;
    transport: string;
    notes: string;
    food: string;
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
          passengers: data.tripSummary.passengers,
          is_private: data.tripSummary.isPrivate
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
        food: dest.food,
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
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('user_itineraries')
        .select(`
          *,
          destinations:user_itinerary_destinations(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error fetching user itineraries:', error);
      throw error;
    }
  },

  async getAllPublicItineraries() {
    try {
      const { data, error } = await supabase
        .from('user_itineraries')
        .select(`
          *,
          destinations:user_itinerary_destinations(*)
        `)
        .eq('is_private', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error fetching public itineraries:', error);
      throw error;
    }
  },

  async getItineraryById(id: string) {
    try {
      // Get the current user, but don't require authentication
      const { data: { user } } = await supabase.auth.getUser();

      const query = supabase
        .from('user_itineraries')
        .select(`
          *,
          destinations:user_itinerary_destinations(*),
          day_attractions:user_itinerary_day_attractions(*),
          day_hotels:user_itinerary_day_hotels(*),
          day_notes:user_itinerary_day_notes(*)
        `)
        .eq('id', id);

      // If user is authenticated, allow access to their private itineraries
      if (user) {
        query.or(`user_id.eq.${user.id},is_private.eq.false`);
      } else {
        // For anonymous users, only show non-private itineraries
        query.eq('is_private', false);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Itinerary not found or you do not have permission to view it');
        }
        throw error;
      }

      return { data };
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      throw error;
    }
  },

  async deleteItinerary(id: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // First verify the user owns this itinerary
      const { data: itinerary, error: checkError } = await supabase
        .from('user_itineraries')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (checkError || !itinerary) {
        throw new Error('Itinerary not found or you do not have permission to delete it');
      }

      // Delete in correct order to handle foreign key constraints
      console.log('Starting deletion process...');

      try {
        // First check for any existing destinations and their references
        const { data: existingDest } = await supabase
          .from('user_itinerary_destinations')
          .select('*')
          .eq('itinerary_id', id);

        console.log('Found existing destinations:', existingDest);

        // Delete all attractions first
        console.log('Deleting attractions...');
        const { error: attractionsError } = await supabase
          .from('user_itinerary_day_attractions')
          .delete()
          .eq('itinerary_id', id);

        if (attractionsError) {
          console.error('Failed to delete attractions:', attractionsError);
          throw attractionsError;
        }

        // Delete hotels
        console.log('Deleting hotels...');
        const { error: hotelsError } = await supabase
          .from('user_itinerary_day_hotels')
          .delete()
          .eq('itinerary_id', id);

        if (hotelsError) {
          console.error('Failed to delete hotels:', hotelsError);
          throw hotelsError;
        }

        // Delete notes
        console.log('Deleting notes...');
        const { error: notesError } = await supabase
          .from('user_itinerary_day_notes')
          .delete()
          .eq('itinerary_id', id);

        if (notesError) {
          console.error('Failed to delete notes:', notesError);
          throw notesError;
        }

        // Delete all destinations in one operation
        console.log('Deleting all destinations...');
        const { error: destError } = await supabase
          .from('user_itinerary_destinations')
          .delete()
          .eq('itinerary_id', id);

        if (destError) {
          console.error('Failed to delete destinations:', destError);
          throw destError;
        }

      } catch (error) {
        console.error('Error during deletion process:', error);
        throw error;
      }

      // Update main itinerary
      const { error: itineraryError } = await supabase
        .from('user_itineraries')
        .update({
          trip_name: data.tripSummary.tripName,
          country: data.tripSummary.country,
          start_date: data.tripSummary.startDate,
          duration: data.tripSummary.duration,
          passengers: data.tripSummary.passengers,
          is_private: data.tripSummary.isPrivate
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (itineraryError) throw itineraryError;

      return { success: true };
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      throw error;
    }
  },

  async updateItinerary(id: string, data: SaveItineraryData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // First verify the user owns this itinerary
      const { data: itinerary, error: checkError } = await supabase
        .from('user_itineraries')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (checkError || !itinerary) {
        throw new Error('Itinerary not found or you do not have permission to update it');
      }

      // Step 1: Delete all existing data in reverse order of dependencies
      console.log('Starting deletion of existing data...');

      // First check for any existing destinations and their references
      const { data: existingDest } = await supabase
        .from('user_itinerary_destinations')
        .select(`
          id,
          destination,
          user_itinerary_day_attractions (
            id,
            day_index
          )
        `)
        .eq('itinerary_id', id);

      console.log('Found existing destinations with references:', existingDest);

      // Delete attractions first for each destination
      for (const dest of (existingDest || [])) {
        if (dest.user_itinerary_day_attractions && dest.user_itinerary_day_attractions.length > 0) {
          console.log(`Deleting attractions for destination ${dest.id}...`);
          const { error: attractionError } = await supabase
            .from('user_itinerary_day_attractions')
            .delete()
            .eq('destination_id', dest.id);

          if (attractionError) {
            console.error(`Failed to delete attractions for destination ${dest.id}:`, attractionError);
            throw attractionError;
          }
        }
      }

      // Delete any remaining attractions by itinerary_id
      const { error: attractionsError } = await supabase
        .from('user_itinerary_day_attractions')
        .delete()
        .eq('itinerary_id', id);

      if (attractionsError) {
        console.error('Failed to delete remaining attractions:', attractionsError);
        throw attractionsError;
      }

      // Delete hotels
      const { error: hotelsError } = await supabase
        .from('user_itinerary_day_hotels')
        .delete()
        .eq('itinerary_id', id);

      if (hotelsError) {
        console.error('Failed to delete hotels:', hotelsError);
        throw hotelsError;
      }

      // Delete notes
      const { error: notesError } = await supabase
        .from('user_itinerary_day_notes')
        .delete()
        .eq('itinerary_id', id);

      if (notesError) {
        console.error('Failed to delete notes:', notesError);
        throw notesError;
      }

      // Delete all destinations in one operation
      console.log('Deleting all destinations...');
      const { error: destError } = await supabase
        .from('user_itinerary_destinations')
        .delete()
        .eq('itinerary_id', id);

      if (destError) {
        console.error('Failed to delete destinations:', destError);
        throw destError;
      }

      // Step 2: Update the main itinerary
      const { error: itineraryUpdateError } = await supabase
        .from('user_itineraries')
        .update({
          trip_name: data.tripSummary.tripName,
          country: data.tripSummary.country,
          start_date: data.tripSummary.startDate,
          duration: data.tripSummary.duration,
          passengers: data.tripSummary.passengers,
          is_private: data.tripSummary.isPrivate
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (itineraryUpdateError) {
        console.error('Failed to update itinerary:', itineraryUpdateError);
        throw itineraryUpdateError;
      }

      // Step 3: Insert new destinations
      console.log('Inserting new destinations:', data.destinations.length);
      const destinationsToInsert = data.destinations.map((dest, index) => ({
        itinerary_id: id,
        destination: dest.destination,
        nights: dest.nights,
        discover: dest.discover,
        transport: dest.transport,
        notes: dest.notes,
        food: dest.food,
        order_index: index
      }));

      const { data: newDestinations, error: destinationsError } = await supabase
        .from('user_itinerary_destinations')
        .insert(destinationsToInsert)
        .select();

      if (destinationsError) {
        console.error('Failed to insert destinations:', destinationsError);
        throw destinationsError;
      }

      // Step 4: Insert new attractions
      if (data.dayAttractions && data.dayAttractions.length > 0) {
        const attractionsToInsert = data.dayAttractions.map(day => {
          let currentDestIndex = 0;
          let nightsSum = 0;

          while (currentDestIndex < data.destinations.length) {
            if (nightsSum + data.destinations[currentDestIndex].nights > day.dayIndex) {
              break;
            }
            nightsSum += data.destinations[currentDestIndex].nights;
            currentDestIndex++;
          }

          return {
            itinerary_id: id,
            destination_id: newDestinations[Math.min(currentDestIndex, newDestinations.length - 1)].id,
            day_index: day.dayIndex,
            attractions: day.selectedAttractions
          };
        });

        const { error: newAttractionsError } = await supabase
          .from('user_itinerary_day_attractions')
          .insert(attractionsToInsert);

        if (newAttractionsError) {
          console.error('Failed to insert attractions:', newAttractionsError);
          throw newAttractionsError;
        }
      }

      // Step 5: Insert new hotels
      if (data.dayHotels && data.dayHotels.length > 0) {
        const hotelsToInsert = data.dayHotels.map(day => ({
          itinerary_id: id,
          day_index: day.day_index,
          hotel: day.hotel
        }));

        const { error: newHotelsError } = await supabase
          .from('user_itinerary_day_hotels')
          .insert(hotelsToInsert);

        if (newHotelsError) {
          console.error('Failed to insert hotels:', newHotelsError);
          throw newHotelsError;
        }
      }

      // Step 6: Insert new notes
      if (data.dayNotes && data.dayNotes.length > 0) {
        const notesToInsert = data.dayNotes.map(day => ({
          itinerary_id: id,
          day_index: day.day_index,
          notes: day.notes
        }));

        const { error: newNotesError } = await supabase
          .from('user_itinerary_day_notes')
          .insert(notesToInsert);

        if (newNotesError) {
          console.error('Failed to insert notes:', newNotesError);
          throw newNotesError;
        }
      }

      console.log('Update completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error updating itinerary:', error);
      throw error;
    }
  }
}; 