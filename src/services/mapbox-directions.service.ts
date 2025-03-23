import { mapboxgl } from '../lib/mapbox';

interface DirectionsResponse {
    duration: string;
    distance: string;
    geometry?: {
        coordinates: [number, number][];
    };
}

class MapboxDirectionsService {
    private formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    private formatDistance(meters: number): string {
        const kilometers = meters / 1000;
        if (kilometers >= 1) {
            return `${kilometers.toFixed(1)} km`;
        }
        return `${meters.toFixed(0)} m`;
    }

    async getDirections(
        origin: string,
        destination: string,
        mode: 'driving' | 'transit'
    ): Promise<DirectionsResponse> {
        try {
            // Convert addresses to coordinates using geocoding
            const [originCoords, destCoords] = await Promise.all([
                this.geocodeLocation(origin),
                this.geocodeLocation(destination)
            ]);

            // Get directions from Mapbox API
            const profile = mode === 'driving' ? 'mapbox/driving' : 'mapbox/walking';
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/${profile}/${originCoords.join(',')};${destCoords.join(',')}?access_token=${mapboxgl.accessToken}&geometries=geojson`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch directions');
            }

            const data = await response.json();
            const route = data.routes[0];

            return {
                duration: this.formatDuration(route.duration),
                distance: this.formatDistance(route.distance),
                geometry: route.geometry
            };
        } catch (error) {
            console.error('Error getting directions:', error);
            throw error;
        }
    }

    private async geocodeLocation(query: string): Promise<[number, number]> {
        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}`
            );

            if (!response.ok) {
                throw new Error('Failed to geocode location');
            }

            const data = await response.json();
            if (!data.features || data.features.length === 0) {
                throw new Error('No results found');
            }

            const [lng, lat] = data.features[0].center;
            return [lng, lat];
        } catch (error) {
            console.error('Error geocoding location:', error);
            throw error;
        }
    }
}

export const mapboxDirectionsService = new MapboxDirectionsService(); 