import { supabase } from '../lib/supabase';

interface UserItineraryDestination {
  id: string;
  destination: string;
  nights: number;
  discover: string;
  transport: string;
  notes: string;
  food: string;
  food_desc: string;
  hotel?: string;
  manual_hotel: string;
  manual_hotel_desc: string;
  manual_discover: string;
  manual_discover_desc: string;
  order_index: number;
}

interface UserItineraryDayAttraction {
  day_index: number;
  attractions: string;
}

interface UserItineraryDayHotel {
  day_index: number;
  hotel: string;
  hotel_desc?: string;
}

interface UserItineraryDayNote {
  day_index: number;
  notes: string;
}

interface UserItineraryData {
  id: string;
  trip_name: string;
  country: string;
  start_date: string;
  duration: number;
  passengers: number;
  created_at: string;
  user_id?: string;
  is_private?: boolean;
  tags?: string[];
  destinations: UserItineraryDestination[];
  day_attractions: UserItineraryDayAttraction[];
  day_hotels: UserItineraryDayHotel[];
  day_notes: UserItineraryDayNote[];
}

interface SupabaseItineraryResponse {
  id: string;
  trip_name: string;
  country: string;
  start_date: string;
  duration: number;
  passengers: number;
  created_at: string;
  user_id?: string;
  is_private?: boolean;
  tags?: string[];
  destinations?: UserItineraryDestination[];
  day_attractions?: UserItineraryDayAttraction[];
  day_hotels?: UserItineraryDayHotel[];
  day_notes?: UserItineraryDayNote[];
}

interface ItineraryResponse {
  id: string;
  trip_name: string;
  country: string;
  start_date: string;
  duration: number;
  passengers: number;
  created_at: string;
  is_private: boolean;
  tags: string[];
  user_id: string;
  destinations: Array<{
    destination: string;
    nights: number;
    food: string;
    food_desc: string;
    discover: string;
    transport: string;
    notes: string;
    hotel: string;
    manual_hotel: string;
    manual_hotel_desc: string;
    manual_discover: string;
    manual_discover_desc: string;
    order_index: number;
  }>;
  day_attractions?: Array<{
    day_index: number;
    attractions: string[];
  }>;
  day_hotels?: Array<{
    day_index: number;
    hotel: string;
    hotel_desc: string;
  }>;
  day_notes?: Array<{
    day_index: number;
    notes: string;
  }>;
}

export interface UserItinerary {
  id: string;
  trip_name: string;
  country: string;
  start_date: string;
  duration: number;
  passengers: number;
  created_at: string;
  is_private: boolean;
  tags: string[];
  destinations: {
    id: string;
    destination: string;
    nights: number;
    discover: string;
    transport: string;
    notes: string;
    food: string;
    food_desc: string;
    manual_hotel: string;
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
    tags: string[];
  };
  destinations: {
    destination: string;
    nights: number;
    discover: string;
    transport: string;
    notes: string;
    food: string;
    food_desc: string;
    hotel?: string;
    manual_hotel?: string;
    manual_hotel_desc?: string;
    manual_discover?: string;
    manual_discover_desc?: string;
  }[];
  dayAttractions: {
    dayIndex: number;
    selectedAttractions: string[];
  }[];
  dayHotels: {
    day_index: number;
    hotel: string;
    hotel_desc?: string;
  }[];
  dayNotes: {
    day_index: number;
    notes: string;
  }[];
}

interface LikedItinerary {
  id: string;
  trip_name: string;
  country: string;
  start_date: string;
  duration: number;
  passengers: number;
  created_at: string;
  destinations: Array<{
    destination: string;
    nights: number;
    discover: string;
    transport: string;
    notes: string;
    food: string;
    food_desc: string;
    hotel?: string;
    manual_hotel?: string;
  }>;
  liked_at: string;
}

export class UserItineraryService {
  static async saveItinerary(data: SaveItineraryData) {
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
          is_private: data.tripSummary.isPrivate,
          tags: data.tripSummary.tags || []
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
        food_desc: dest.food_desc,
        hotel: dest.hotel || '',
        manual_hotel: dest.manual_hotel || '',
        manual_hotel_desc: dest.manual_hotel_desc || '',
        manual_discover: dest.manual_discover || '',
        manual_discover_desc: dest.manual_discover_desc || '',
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
          hotel: day.hotel,
          hotel_desc: day.hotel_desc || ''
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
  }

  static async getUserItineraries() {
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
  }

  static async getAllPublicItineraries() {
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
  }

  static async getItineraryById(id: string) {
    const { data, error } = await supabase
      .from('user_itineraries')
      .select(`
        id,
        trip_name,
        country,
        start_date,
        duration,
        passengers,
        created_at,
        is_private,
        tags,
        user_id,
        destinations:user_itinerary_destinations(
          destination,
          nights,
          discover,
          transport,
          notes,
          food,
          food_desc,
          hotel,
          manual_hotel,
          manual_hotel_desc,
          manual_discover,
          manual_discover_desc,
          order_index
        ),
        day_attractions:user_itinerary_day_attractions(
          day_index,
          attractions
        ),
        day_hotels:user_itinerary_day_hotels(
          day_index,
          hotel,
          hotel_desc
        ),
        day_notes:user_itinerary_day_notes(
          day_index,
          notes
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching itinerary:', error);
      return { data: null, error };
    }

    return { data: data as ItineraryResponse, error: null };
  }

  static async deleteItinerary(id: string) {
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

        // Finally, delete the main itinerary
        const { error: deleteError } = await supabase
          .from('user_itineraries')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

      } catch (error) {
        console.error('Error during deletion process:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      throw error;
    }
  }

  static async updateItinerary(id: string, data: SaveItineraryData) {
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

      // Update the main itinerary
      const { error: itineraryError } = await supabase
        .from('user_itineraries')
        .update({
          trip_name: data.tripSummary.tripName,
          country: data.tripSummary.country,
          start_date: data.tripSummary.startDate,
          duration: data.tripSummary.duration,
          passengers: data.tripSummary.passengers,
          is_private: data.tripSummary.isPrivate,
          tags: data.tripSummary.tags || []
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (itineraryError) throw itineraryError;

      // Delete existing destinations
      const { error: deleteError } = await supabase
        .from('user_itinerary_destinations')
        .delete()
        .eq('itinerary_id', id);

      if (deleteError) throw deleteError;

      // Insert new destinations
      const destinationsToInsert = data.destinations.map((dest, index) => ({
        itinerary_id: id,
        destination: dest.destination,
        nights: dest.nights,
        discover: dest.discover,
        transport: dest.transport,
        notes: dest.notes,
        food: dest.food,
        food_desc: dest.food_desc,
        hotel: dest.hotel || '',
        manual_hotel: dest.manual_hotel || '',
        manual_hotel_desc: dest.manual_hotel_desc || '',
        manual_discover: dest.manual_discover || '',
        manual_discover_desc: dest.manual_discover_desc || '',
        order_index: index
      }));

      const { error: destinationsError } = await supabase
        .from('user_itinerary_destinations')
        .insert(destinationsToInsert);

      if (destinationsError) throw destinationsError;

      // Update day attractions
      if (data.dayAttractions && data.dayAttractions.length > 0) {
        // Delete existing attractions
        await supabase
          .from('user_itinerary_day_attractions')
          .delete()
          .eq('itinerary_id', id);

        const attractionsToInsert = data.dayAttractions.map(day => ({
          itinerary_id: id,
          day_index: day.dayIndex,
          attractions: day.selectedAttractions
        }));

        const { error: attractionsError } = await supabase
          .from('user_itinerary_day_attractions')
          .insert(attractionsToInsert);

        if (attractionsError) throw attractionsError;
      }

      // Update day hotels
      if (data.dayHotels && data.dayHotels.length > 0) {
        // Delete existing hotels
        await supabase
          .from('user_itinerary_day_hotels')
          .delete()
          .eq('itinerary_id', id);

        const hotelsToInsert = data.dayHotels.map(day => ({
          itinerary_id: id,
          day_index: day.day_index,
          hotel: day.hotel,
          hotel_desc: day.hotel_desc || ''
        }));

        const { error: hotelsError } = await supabase
          .from('user_itinerary_day_hotels')
          .insert(hotelsToInsert);

        if (hotelsError) throw hotelsError;
      }

      // Update day notes
      if (data.dayNotes && data.dayNotes.length > 0) {
        // Delete existing notes
        await supabase
          .from('user_itinerary_day_notes')
          .delete()
          .eq('itinerary_id', id);

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

  static async getLikedItineraries() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('likes')
        .select(`
          created_at,
          itinerary:user_itineraries!inner(
            id,
            trip_name,
            country,
            start_date,
            duration,
            passengers,
            created_at,
            destinations:user_itinerary_destinations(
              destination,
              nights,
              food,
              food_desc
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match the LikedItinerary interface
      const transformedData = data?.map(item => ({
        id: item.itinerary.id,
        trip_name: item.itinerary.trip_name,
        country: item.itinerary.country,
        start_date: item.itinerary.start_date,
        duration: item.itinerary.duration,
        passengers: item.itinerary.passengers,
        created_at: item.itinerary.created_at,
        destinations: item.itinerary.destinations,
        liked_at: item.created_at
      }));

      return { data: transformedData };
    } catch (error) {
      console.error('Error fetching liked itineraries:', error);
      throw error;
    }
  }

  static async toggleLikeItinerary(itineraryId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if the itinerary is already liked
      const { data: existingLike, error: checkError } = await supabase
        .from('likes')
        .select()
        .eq('user_id', user.id)
        .eq('itinerary_id', itineraryId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingLike) {
        // Unlike the itinerary
        const { error: unlikeError } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('itinerary_id', itineraryId);

        if (unlikeError) throw unlikeError;
        return { liked: false };
      } else {
        // Like the itinerary
        const { error: likeError } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            itinerary_id: itineraryId
          });

        if (likeError) throw likeError;
        return { liked: true };
      }
    } catch (error) {
      console.error('Error toggling itinerary like:', error);
      throw error;
    }
  }

  static async isItineraryLiked(itineraryId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { liked: false };
      }

      const { data, error } = await supabase
        .from('likes')
        .select()
        .eq('user_id', user.id)
        .eq('itinerary_id', itineraryId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return { liked: !!data };
    } catch (error) {
      console.error('Error checking if itinerary is liked:', error);
      throw error;
    }
  }

  static async copyItinerary(id: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the original itinerary with all its data
      const { data: originalItinerary } = await this.getItineraryById(id);
      if (!originalItinerary) {
        throw new Error('Itinerary not found');
      }

      // Create a new itinerary with the same data but for the current user
      const { data: newItinerary, error: itineraryError } = await supabase
        .from('user_itineraries')
        .insert({
          user_id: user.id,
          trip_name: `${originalItinerary.trip_name} (Copy)`,
          country: originalItinerary.country,
          start_date: originalItinerary.start_date,
          duration: originalItinerary.duration,
          passengers: originalItinerary.passengers,
          is_private: true, // Make the copy private by default
          tags: originalItinerary.tags || []
        })
        .select()
        .single();

      if (itineraryError) throw itineraryError;

      // Copy destinations
      if (originalItinerary.destinations && originalItinerary.destinations.length > 0) {
        const destinationsToInsert = originalItinerary.destinations.map((dest, index) => ({
          itinerary_id: newItinerary.id,
          destination: dest.destination,
          nights: dest.nights,
          discover: dest.discover || '',
          transport: dest.transport || '',
          notes: dest.notes || '',
          food: dest.food || '',
          food_desc: dest.food_desc || '',
          manual_hotel: dest.manual_hotel || '',
          manual_hotel_desc: dest.manual_hotel_desc || '',
          manual_discover: dest.manual_discover || '',
          manual_discover_desc: dest.manual_discover_desc || '',
          order_index: index
        }));

        const { error: destinationsError } = await supabase
          .from('user_itinerary_destinations')
          .insert(destinationsToInsert);

        if (destinationsError) throw destinationsError;
      }

      // Copy day attractions if they exist
      if (originalItinerary.day_attractions && originalItinerary.day_attractions.length > 0) {
        const attractionsToInsert = originalItinerary.day_attractions.map(day => ({
          itinerary_id: newItinerary.id,
          day_index: day.day_index,
          attractions: day.attractions
        }));

        const { error: attractionsError } = await supabase
          .from('user_itinerary_day_attractions')
          .insert(attractionsToInsert);

        if (attractionsError) throw attractionsError;
      }

      // Copy day hotels if they exist
      if (originalItinerary.day_hotels && originalItinerary.day_hotels.length > 0) {
        const hotelsToInsert = originalItinerary.day_hotels.map(day => ({
          itinerary_id: newItinerary.id,
          day_index: day.day_index,
          hotel: day.hotel
        }));

        const { error: hotelsError } = await supabase
          .from('user_itinerary_day_hotels')
          .insert(hotelsToInsert);

        if (hotelsError) throw hotelsError;
      }

      // Copy day notes if they exist
      if (originalItinerary.day_notes && originalItinerary.day_notes.length > 0) {
        const notesToInsert = originalItinerary.day_notes.map(day => ({
          itinerary_id: newItinerary.id,
          day_index: day.day_index,
          notes: day.notes
        }));

        const { error: notesError } = await supabase
          .from('user_itinerary_day_notes')
          .insert(notesToInsert);

        if (notesError) throw notesError;
      }

      return { data: newItinerary };
    } catch (error) {
      console.error('Error copying itinerary:', error);
      throw error;
    }
  }
} 