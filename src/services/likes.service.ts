import { supabase } from '../lib/supabase';

interface Itinerary {
  id: string;
  title: string;
  description: string;
  image_url: string;
  duration: number;
  cities: string[];
  likes: number;
  created_at: string;
}

interface LikedItinerary {
  itinerary_id: string;
  itineraries: Itinerary;
}

export class LikesService {
  static async likeItinerary(itineraryId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
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

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  static async unlikeItinerary(itineraryId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('likes')
        .delete()
        .match({
          user_id: user.user.id,
          itinerary_id: itineraryId
        });

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async checkIfLiked(itineraryId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return { isLiked: false, error: null };

      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.user.id)
        .eq('itinerary_id', itineraryId)
        .maybeSingle();

      if (error) throw error;

      return { isLiked: !!data, error: null };
    } catch (error: any) {
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
    } catch (error: any) {
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
        data: (data as unknown as LikedItinerary[])?.map(item => ({
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
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }
} 