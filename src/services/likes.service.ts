import { supabase } from '../lib/supabase';

export class LikesService {
  static async likeItinerary(itineraryId: string) {
    try {
      console.log('LikesService: Attempting to like itinerary:', itineraryId);
      const { data: user } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      if (!user.user) {
        console.error('No authenticated user found');
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('likes')
        .insert([
          { 
            user_id: user.user.id, 
            itinerary_id: itineraryId
          }
        ])
        .select()
        .single();

      console.log('Like operation result:', { data, error });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error in likeItinerary:', error);
      return { data: null, error: error.message };
    }
  }

  static async unlikeItinerary(itineraryId: string) {
    try {
      console.log('LikesService: Attempting to unlike itinerary:', itineraryId);
      const { data: user } = await supabase.auth.getUser();
      console.log('Current user:', user);

      if (!user.user) {
        console.error('No authenticated user found');
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('likes')
        .delete()
        .match({ 
          user_id: user.user.id, 
          itinerary_id: itineraryId 
        });

      console.log('Unlike operation result:', { error });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error in unlikeItinerary:', error);
      return { error: error.message };
    }
  }

  static async checkIfLiked(itineraryId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return { isLiked: false, error: null };

      console.log('Checking like for:', {
        user_id: user.user.id,
        itinerary_id: itineraryId
      });

      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.user.id)
        .eq('itinerary_id', itineraryId)
        .maybeSingle();

      if (error) {
        console.error('Like check error:', error);
        throw error;
      }

      return { isLiked: !!data, error: null };
    } catch (error) {
      console.error('Like check failed:', error);
      return { isLiked: false, error: error.message };
    }
  }

  static async getLikesCount(itineraryId: string) {
    try {
      const { count, error } = await supabase
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('itinerary_id', itineraryId);

      if (error) throw error;
      return { count: count || 0, error: null };
    } catch (error) {
      return { count: 0, error: error.message };
    }
  }

  static async getLikedItineraries() {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('likes')
        .select(`
          itinerary_id,
          itineraries (
            id,
            title,
            description,
            image_url,
            duration,
            cities,
            likes,
            created_at
          )
        `)
        .eq('user_id', user.user.id);

      if (error) throw error;
      return { 
        data: data?.map(item => ({
          id: item.itineraries.id,
          title: item.itineraries.title,
          description: item.itineraries.description,
          imageUrl: item.itineraries.image_url,
          duration: item.itineraries.duration,
          cities: item.itineraries.cities,
          likes: item.itineraries.likes,
          createdAt: item.itineraries.created_at
        })), 
        error: null 
      };
    } catch (error) {
      console.error('Error fetching liked itineraries:', error);
      return { data: null, error: error.message };
    }
  }
} 