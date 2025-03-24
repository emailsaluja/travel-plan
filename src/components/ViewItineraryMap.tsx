import React, { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './ViewItineraryMap.css';
import { mapboxCacheService } from '../services/mapbox-cache.service';

interface Destination {
    destination: string;
    nights: number;
}

interface ViewItineraryMapProps {
    destinations: Destination[];
    className?: string;
}

const ViewItineraryMap: React.FC<ViewItineraryMapProps> = ({ destinations, className = '' }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markers = useRef<mapboxgl.Marker[]>([]);
    const coordinates = useRef<[number, number][]>([]);
    const routeLayer = useRef<mapboxgl.GeoJSONSource | null>(null);
    const previousDestinations = useRef<string>('');
    const updateTimeout = useRef<NodeJS.Timeout | null>(null);

    // Clean up route layers and sources
    const cleanupRoutes = useCallback(() => {
        if (!map.current) return;

        // Get all layers
        const layers = map.current.getStyle().layers;
        if (layers) {
            // Remove all route layers
            layers.forEach(layer => {
                if (layer.id.startsWith('route-segment-')) {
                    map.current?.removeLayer(layer.id);
                }
            });
        }

        // Remove all route sources
        const sources = map.current.getStyle().sources;
        if (sources) {
            Object.keys(sources).forEach(sourceId => {
                if (sourceId.startsWith('route-segment-')) {
                    map.current?.removeSource(sourceId);
                }
            });
        }
    }, []);

    // Geocode destinations with caching
    const geocodeDestinations = useCallback(async (destinations: string[]): Promise<Map<string, [number, number]>> => {
        const coordsMap = new Map<string, [number, number]>();
        const uncachedDestinations: string[] = [];

        // First check cache for all destinations
        for (const dest of destinations) {
            const cachedCoords = await mapboxCacheService.getGeocodingResult(dest);
            if (cachedCoords) {
                coordsMap.set(dest, cachedCoords);
            } else {
                uncachedDestinations.push(dest);
            }
        }

        // If there are uncached destinations, fetch them in batches
        if (uncachedDestinations.length > 0) {
            const batchSize = 5; // Process 5 destinations at a time
            for (let i = 0; i < uncachedDestinations.length; i += batchSize) {
                const batch = uncachedDestinations.slice(i, i + batchSize);
                const promises = batch.map(async (dest) => {
                    try {
                        // Add country context for better accuracy
                        const response = await fetch(
                            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(dest)}.json?country=nz&types=place&access_token=${mapboxgl.accessToken}`
                        );
                        const data = await response.json();
                        if (data.features && data.features[0]) {
                            const [lng, lat] = data.features[0].center;
                            const coords: [number, number] = [lng, lat];
                            await mapboxCacheService.saveGeocodingResult(dest, coords);
                            return { dest, coords };
                        }
                        return null;
                    } catch (error) {
                        console.error(`Error geocoding ${dest}:`, error);
                        return null;
                    }
                });

                const results = await Promise.all(promises);
                results.forEach(result => {
                    if (result) {
                        coordsMap.set(result.dest, result.coords);
                    }
                });

                // Add a small delay between batches to avoid rate limiting
                if (i + batchSize < uncachedDestinations.length) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
        }

        return coordsMap;
    }, []);

    // Get route with cache
    const getRoute = useCallback(async (start: [number, number], end: [number, number]) => {
        try {
            // Try to get from cache first
            const cachedRoute = await mapboxCacheService.getRouteGeometry(start, end);
            if (cachedRoute) {
                return cachedRoute;
            }

            // If not in cache, fetch from Mapbox API
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
            );
            const data = await response.json();
            if (data.routes && data.routes[0]) {
                const geometry = data.routes[0].geometry;
                await mapboxCacheService.saveRouteGeometry(start, end, geometry);
                return geometry;
            }
            return null;
        } catch (error) {
            console.error('Error fetching route:', error);
            return null;
        }
    }, []);

    // Update route layer
    const updateRouteLayer = useCallback(async (coords: [number, number][]) => {
        if (!map.current || coords.length < 2) return;

        cleanupRoutes();

        // Wait for the map to process the cleanup
        await new Promise(resolve => setTimeout(resolve, 0));

        // Get and display routes between consecutive points
        for (let i = 0; i < coords.length - 1; i++) {
            const start = coords[i];
            const end = coords[i + 1];
            const routeGeometry = await getRoute(start, end);

            if (routeGeometry && map.current) {
                const sourceId = `route-segment-${i}`;
                const layerId = `route-segment-${i}`;

                try {
                    map.current.addSource(sourceId, {
                        type: 'geojson',
                        data: {
                            type: 'Feature',
                            properties: {},
                            geometry: routeGeometry
                        }
                    });

                    map.current.addLayer({
                        id: layerId,
                        type: 'line',
                        source: sourceId,
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': '#EC4899',
                            'line-width': 3,
                            'line-opacity': 0.8
                        }
                    });
                } catch (error) {
                    console.error('Error adding route layer:', error);
                }
            }
        }
    }, [cleanupRoutes, getRoute]);

    // Update map markers and route
    const updateMap = useCallback(async () => {
        if (!map.current || !destinations.length) return;

        // Clear existing markers
        markers.current.forEach(marker => marker.remove());
        markers.current = [];
        coordinates.current = [];

        // Get coordinates for all destinations
        const destinationStrings = destinations.map(d => d.destination);
        const coordsMap = await geocodeDestinations(destinationStrings);

        // Create markers and collect coordinates
        destinations.forEach((dest, index) => {
            const coords = coordsMap.get(dest.destination);
            if (coords) {
                coordinates.current.push(coords);

                // Create marker element
                const el = document.createElement('div');
                el.className = 'flex items-center justify-center w-6 h-6 rounded-full bg-[#00C48C] text-white text-sm font-bold border-2 border-white shadow-lg';
                el.textContent = `${index + 1}`;

                // Add marker to map
                const marker = new mapboxgl.Marker({ element: el })
                    .setLngLat(coords)
                    .addTo(map.current!);

                markers.current.push(marker);
            }
        });

        // Update route if we have coordinates
        if (coordinates.current.length > 0) {
            // Fit map to show all markers with padding
            const bounds = new mapboxgl.LngLatBounds();
            coordinates.current.forEach(coord => bounds.extend(coord));
            map.current.fitBounds(bounds, {
                padding: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            // Update route layer
            await updateRouteLayer(coordinates.current);
        }
    }, [destinations, geocodeDestinations, updateRouteLayer]);

    // Initialize map
    const initializeMap = useCallback(() => {
        if (!mapContainer.current || map.current) return;

        mapboxgl.accessToken = 'pk.eyJ1IjoiYW1hbjlpbiIsImEiOiJjbThrdHZrcjQxNXByMmtvZ3d1cGlsYXA4In0.nUn4wFsWrbw2jC6ZMEJNPw';

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [0, 20],
            zoom: 1.5,
            attributionControl: false,
            dragRotate: false
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl({
            showCompass: false
        }), 'top-right');

        // Add resize handler
        const handleResize = () => {
            if (map.current) {
                map.current.resize();
            }
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
            if (updateTimeout.current) {
                clearTimeout(updateTimeout.current);
            }
        };
    }, []);

    useEffect(() => {
        initializeMap();
    }, [initializeMap]);

    // Update map when it's loaded
    useEffect(() => {
        if (!map.current) return;

        map.current.on('load', () => {
            map.current?.resize();
            updateMap();
        });
    }, [updateMap]);

    // Update map when destinations change
    useEffect(() => {
        const currentDestinations = JSON.stringify(destinations);
        if (currentDestinations !== previousDestinations.current) {
            previousDestinations.current = currentDestinations;
            if (updateTimeout.current) {
                clearTimeout(updateTimeout.current);
            }
            updateTimeout.current = setTimeout(() => {
                updateMap();
            }, 100);
        }
    }, [destinations, updateMap]);

    return (
        <div ref={mapContainer} className={`w-full h-full rounded-xl overflow-hidden border-2 border-gray-200 ${className}`} />
    );
};

export default ViewItineraryMap; 