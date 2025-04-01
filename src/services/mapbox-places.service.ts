import mapboxgl from 'mapbox-gl';
import { mapboxCacheService } from './mapbox-cache.service';

export interface PlaceResult {
    name: string;
    location: [number, number];
    address?: string;
    types?: string[];
}

export class MapboxPlacesService {
    private static instance: MapboxPlacesService;

    private constructor() { }

    public static getInstance(): MapboxPlacesService {
        if (!MapboxPlacesService.instance) {
            MapboxPlacesService.instance = new MapboxPlacesService();
        }
        return MapboxPlacesService.instance;
    }

    public async findPlaceFromQuery(query: string): Promise<PlaceResult | null> {
        try {
            // Try to get from cache first
            const cachedCoords = await mapboxCacheService.getGeocodingResult(query);
            if (cachedCoords) {
                return {
                    name: query,
                    location: cachedCoords
                };
            }

            // If not in cache, fetch from Mapbox API
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}`
            );
            const data = await response.json();

            if (data.features && data.features[0]) {
                const feature = data.features[0];
                const [lng, lat] = feature.center;
                const coords: [number, number] = [lng, lat];

                // Save to cache
                await mapboxCacheService.saveGeocodingResult(query, coords);

                return {
                    name: feature.text,
                    location: coords,
                    address: feature.place_name,
                    types: feature.place_type
                };
            }

            return null;
        } catch (error) {
            console.error('Error finding place:', error);
            return null;
        }
    }

    public async getPlaceSuggestions(query: string): Promise<string[]> {
        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&types=place,region,country`
            );
            const data = await response.json();

            if (data.features) {
                return data.features.map((feature: any) => feature.place_name);
            }

            return [];
        } catch (error) {
            console.error('Error getting place suggestions:', error);
            return [];
        }
    }
}

export const mapboxPlacesService = MapboxPlacesService.getInstance(); 