import { supabase } from '../lib/supabase';

interface CachedPlaceResult {
    place_id: string;
    data: any;
    timestamp: number;
}

interface CachedPredictionResult {
    query: string;
    data: any;
    timestamp: number;
}

const CACHE_DURATION = 168 * 60 * 60 * 1000; // 7 days in milliseconds

class PlacesCacheService {
    private static instance: PlacesCacheService;

    private constructor() { }

    public static getInstance(): PlacesCacheService {
        if (!PlacesCacheService.instance) {
            PlacesCacheService.instance = new PlacesCacheService();
        }
        return PlacesCacheService.instance;
    }

    private async getFromCache(table: string, key: string): Promise<any | null> {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('key', key)
                .single();

            if (error) {
                console.error('Cache read error:', error);
                return null;
            }

            if (!data) return null;

            // Check if cache is expired
            if (Date.now() - data.timestamp > CACHE_DURATION) {
                // Delete expired cache
                await this.deleteFromCache(table, key);
                return null;
            }

            return data.data;
        } catch (error) {
            console.error('Cache error:', error);
            return null;
        }
    }

    private async saveToCache(table: string, key: string, data: any): Promise<void> {
        try {
            const { error } = await supabase
                .from(table)
                .upsert({
                    key,
                    data,
                    timestamp: Date.now()
                });

            if (error) {
                console.error('Cache write error:', error);
            }
        } catch (error) {
            console.error('Cache error:', error);
        }
    }

    private async deleteFromCache(table: string, key: string): Promise<void> {
        try {
            await supabase
                .from(table)
                .delete()
                .eq('key', key);
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    }

    public async getPlaceDetails(placeId: string): Promise<any | null> {
        return this.getFromCache('places_cache', placeId);
    }

    public async savePlaceDetails(placeId: string, details: any): Promise<void> {
        await this.saveToCache('places_cache', placeId, details);
    }

    public async getPlacePredictions(query: string): Promise<any | null> {
        return this.getFromCache('predictions_cache', query);
    }

    public async savePlacePredictions(query: string, predictions: any): Promise<void> {
        await this.saveToCache('predictions_cache', query, predictions);
    }

    public async getNearbyPlaces(location: string, type: string): Promise<any | null> {
        const key = `${location}-${type}`;
        return this.getFromCache('nearby_places_cache', key);
    }

    public async saveNearbyPlaces(location: string, type: string, places: any): Promise<void> {
        const key = `${location}-${type}`;
        await this.saveToCache('nearby_places_cache', key, places);
    }
}

export const placesCacheService = PlacesCacheService.getInstance(); 