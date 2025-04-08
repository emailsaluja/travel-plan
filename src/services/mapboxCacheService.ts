/**
 * MapboxCacheService - Provides caching functionality for Mapbox API responses
 * to reduce API calls and improve performance
 */

// In-memory cache for routes
const routeCache = new Map<string, any>();

// In-memory cache for geocoding results
const geocodingCache = new Map<string, any>();

// Generate a cache key from coordinates
const generateRouteKey = (start: [number, number], end: [number, number]): string => {
    return `${start[0].toFixed(4)},${start[1].toFixed(4)}-${end[0].toFixed(4)},${end[1].toFixed(4)}`;
};

/**
 * MapboxCacheService provides methods to cache and retrieve route geometries
 * to minimize API calls to Mapbox services
 */
const mapboxCacheService = {
    /**
     * Save a route geometry to the cache
     * @param start - Starting coordinates [lng, lat]
     * @param end - Ending coordinates [lng, lat]
     * @param geometry - The GeoJSON geometry object to cache
     */
    saveRouteGeometry: async (
        start: [number, number],
        end: [number, number],
        geometry: any
    ): Promise<void> => {
        const key = generateRouteKey(start, end);
        routeCache.set(key, geometry);

        // Also cache the reverse direction with the same geometry
        const reverseKey = generateRouteKey(end, start);
        routeCache.set(reverseKey, geometry);

        console.log(`Cached route: ${key}`);
    },

    /**
     * Retrieve a route geometry from the cache if it exists
     * @param start - Starting coordinates [lng, lat]
     * @param end - Ending coordinates [lng, lat]
     * @returns The cached geometry or null if not found
     */
    getRouteGeometry: async (
        start: [number, number],
        end: [number, number]
    ): Promise<any | null> => {
        const key = generateRouteKey(start, end);
        if (routeCache.has(key)) {
            console.log(`Cache hit for route: ${key}`);
            return routeCache.get(key);
        }
        console.log(`Cache miss for route: ${key}`);
        return null;
    },

    /**
     * Clear the entire route cache
     */
    clearRouteCache: (): void => {
        routeCache.clear();
        console.log('Route cache cleared');
    },

    /**
     * Save a geocoding result to the cache
     * @param query - The location query string
     * @param result - The geocoding result to cache
     */
    saveGeocodingResult: async (query: string, result: any): Promise<void> => {
        geocodingCache.set(query.toLowerCase(), result);
        console.log(`Cached geocoding result for: ${query}`);
    },

    /**
     * Retrieve a geocoding result from the cache if it exists
     * @param query - The location query string
     * @returns The cached geocoding result or null if not found
     */
    getGeocodingResult: async (query: string): Promise<any | null> => {
        const key = query.toLowerCase();
        if (geocodingCache.has(key)) {
            console.log(`Cache hit for geocoding: ${query}`);
            return geocodingCache.get(key);
        }
        console.log(`Cache miss for geocoding: ${query}`);
        return null;
    },

    /**
     * Delete a geocoding result from the cache
     * @param query - The location query string to remove
     */
    deleteGeocodingResult: (query: string): void => {
        const key = query.toLowerCase();
        if (geocodingCache.has(key)) {
            geocodingCache.delete(key);
            console.log(`Deleted geocoding cache for: ${query}`);
        }
    },

    /**
     * Clear the entire geocoding cache
     */
    clearGeocodingCache: (): void => {
        geocodingCache.clear();
        console.log('Geocoding cache cleared');
    }
};

export default mapboxCacheService; 