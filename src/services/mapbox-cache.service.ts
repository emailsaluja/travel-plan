import { supabase } from '../lib/supabase';

interface CachedGeocodingResult {
    location: string;
    coordinates: [number, number];
    timestamp: number;
}

interface CachedRouteResult {
    start: string;
    end: string;
    geometry: any;
    timestamp: number;
}

const CACHE_DURATION = 168 * 60 * 60 * 1000; // 7 days in milliseconds

class MapboxCacheService {
    private static instance: MapboxCacheService;

    private constructor() { }

    public static getInstance(): MapboxCacheService {
        if (!MapboxCacheService.instance) {
            MapboxCacheService.instance = new MapboxCacheService();
        }
        return MapboxCacheService.instance;
    }

    private async getFromCache(table: string, key: string): Promise<any | null> {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('key', key)
                .maybeSingle();

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
            // Delete any existing entry first to avoid conflicts
            await this.deleteFromCache(table, key);

            const { error } = await supabase
                .from(table)
                .insert({
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

    public async getGeocodingResult(location: string): Promise<[number, number] | null> {
        const result = await this.getFromCache('mapbox_geocoding_cache', location);
        return result ? result.coordinates : null;
    }

    public async saveGeocodingResult(location: string, coordinates: [number, number]): Promise<void> {
        await this.saveToCache('mapbox_geocoding_cache', location, { coordinates });
    }

    public async getRouteGeometry(start: [number, number], end: [number, number]): Promise<any | null> {
        const key = `${start.join(',')}-${end.join(',')}`;
        const result = await this.getFromCache('mapbox_routes_cache', key);
        return result ? result.geometry : null;
    }

    public async saveRouteGeometry(start: [number, number], end: [number, number], geometry: any): Promise<void> {
        const key = `${start.join(',')}-${end.join(',')}`;
        await this.saveToCache('mapbox_routes_cache', key, { geometry });
    }
}

export const mapboxCacheService = MapboxCacheService.getInstance(); 