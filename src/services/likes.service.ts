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

interface LikesData {
  counts: Record<string, number>;
  userLikes: Set<string>;
  error: string | null;
}

interface LikesCache {
  userLikes: Set<string>;
  likesCount: Record<string, number>;
  lastFetch: number;
}

export class LikesService {
  private static cache: LikesCache = {
    userLikes: new Set<string>(),
    likesCount: {},
    lastFetch: 0
  };

  private static CACHE_DURATION = 60000; // 1 minute cache

  static async getAllLikesData(): Promise<LikesData> {
    try {
      const { data: user } = await supabase.auth.getUser();

      // If user is not authenticated, just get counts
      if (!user.user) {
        const { data, error } = await supabase
          .from('likes')
          .select('itinerary_id');

        if (error) throw error;

        // Count likes for each itinerary
        const counts: Record<string, number> = {};
        data.forEach(like => {
          counts[like.itinerary_id] = (counts[like.itinerary_id] || 0) + 1;
        });

        this.cache = {
          userLikes: new Set<string>(),
          likesCount: counts,
          lastFetch: Date.now()
        };

        return { counts, userLikes: new Set<string>(), error: null };
      }

      // Get all likes data in a single query
      const { data, error } = await supabase
        .from('likes')
        .select('itinerary_id, user_id');

      if (error) throw error;

      // Process likes data
      const userLikes = new Set<string>();
      const counts: Record<string, number> = {};

      data.forEach(like => {
        // Count total likes
        counts[like.itinerary_id] = (counts[like.itinerary_id] || 0) + 1;

        // Track user's likes
        if (like.user_id === user.user.id) {
          userLikes.add(like.itinerary_id);
        }
      });

      // Update cache
      this.cache = {
        userLikes,
        likesCount: counts,
        lastFetch: Date.now()
      };

      return { counts, userLikes, error: null };
    } catch (error: any) {
      return { counts: {}, userLikes: new Set<string>(), error: error.message };
    }
  }

  static async refreshLikesData() {
    return this.getAllLikesData();
  }

  static getCachedLikesData() {
    const now = Date.now();
    if (this.cache.lastFetch > 0 && now - this.cache.lastFetch < this.CACHE_DURATION) {
      return {
        counts: this.cache.likesCount,
        userLikes: this.cache.userLikes,
        error: null
      };
    }
    return null;
  }

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

      // Update cache
      this.cache.userLikes.add(itineraryId);
      this.cache.likesCount[itineraryId] = (this.cache.likesCount[itineraryId] || 0) + 1;

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

      // Update cache
      this.cache.userLikes.delete(itineraryId);
      this.cache.likesCount[itineraryId] = Math.max(0, (this.cache.likesCount[itineraryId] || 1) - 1);

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Keep these methods for backward compatibility but make them use the cache
  static async checkIfLiked(itineraryId: string) {
    const cached = this.getCachedLikesData();
    if (cached) {
      return { isLiked: cached.userLikes.has(itineraryId), error: null };
    }
    const { userLikes, error } = await this.getAllLikesData();
    return { isLiked: userLikes.has(itineraryId), error };
  }

  static async getLikesCount(itineraryId: string) {
    const cached = this.getCachedLikesData();
    if (cached) {
      return { count: cached.counts[itineraryId] || 0, error: null };
    }
    const { counts, error } = await this.getAllLikesData();
    return { count: counts[itineraryId] || 0, error };
  }

  static async getBatchLikesCounts(itineraryIds: string[]) {
    const cached = this.getCachedLikesData();
    if (cached) {
      const result = itineraryIds.reduce((acc, id) => {
        acc[id] = cached.counts[id] || 0;
        return acc;
      }, {} as Record<string, number>);
      return { data: result, error: null };
    }
    const { counts, error } = await this.getAllLikesData();
    const result = itineraryIds.reduce((acc, id) => {
      acc[id] = counts[id] || 0;
      return acc;
    }, {} as Record<string, number>);
    return { data: result, error };
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

  static async getLikeStatusAndCount(itineraryId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();

      // If user is not authenticated, just return the count
      if (!user.user) {
        const { count, error: countError } = await supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('itinerary_id', itineraryId);

        if (countError) throw countError;
        return { isLiked: false, count: count || 0, error: null };
      }

      // Get both like status and count in a single query
      const { data, error } = await supabase
        .from('likes')
        .select('id', { count: 'exact' })
        .eq('itinerary_id', itineraryId);

      if (error) throw error;

      // Check if user has liked by looking for their like in the results
      const userLike = data?.find(like => like.id);

      return {
        isLiked: !!userLike,
        count: data?.length || 0,
        error: null
      };
    } catch (error: any) {
      return { isLiked: false, count: 0, error: error.message };
    }
  }
} 