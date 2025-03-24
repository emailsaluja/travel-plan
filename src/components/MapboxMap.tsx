import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapboxMap.css';
import { mapboxCacheService } from '../services/mapbox-cache.service';

interface Destination {
    destination: string;
    nights: number;
}

interface MapboxMapProps {
    destinations: Destination[];
    className?: string;
}

const MapboxMap: React.FC<MapboxMapProps> = ({ destinations, className = '' }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markers = useRef<mapboxgl.Marker[]>([]);
    const coordinates = useRef<[number, number][]>([]);
    const routeLayer = useRef<mapboxgl.GeoJSONSource | null>(null);
    const previousDestinations = useRef<string>('');
    const updateTimeout = useRef<NodeJS.Timeout | null>(null);

    // Clear cache for New Zealand locations on mount
    useEffect(() => {
        const clearNZCache = async () => {
            const nzLocations = destinations
                .filter(d => d.destination)
                .map(d => d.destination);
            if (nzLocations.length > 0) {
                await mapboxCacheService.clearGeocodingCache(nzLocations);
            }
        };
        clearNZCache();
    }, [destinations]);

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

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        mapboxgl.accessToken = 'pk.eyJ1IjoiYW1hbjlpbiIsImEiOiJjbThrdHZrcjQxNXByMmtvZ3d1cGlsYXA4In0.nUn4wFsWrbw2jC6ZMEJNPw';

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [12.4964, 41.9028], // Rome, Italy
            zoom: 5,
            attributionControl: false
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Wait for map to load before allowing route updates
        map.current.on('load', () => {
            map.current?.resize();
        });

        // Cleanup
        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
            if (updateTimeout.current) {
                clearTimeout(updateTimeout.current);
            }
        };
    }, []);

    // Memoize geocoding function with cache and batch processing
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
            const batchSize = 5;
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

    // Memoize route fetching with batching
    const getRoutes = useCallback(async (coordPairs: Array<{ start: [number, number]; end: [number, number] }>) => {
        const routes = new Map<string, any>();
        const uncachedPairs: typeof coordPairs = [];

        // First check cache for all routes
        for (const pair of coordPairs) {
            const key = `${pair.start.join(',')}-${pair.end.join(',')}`;
            const cachedRoute = await mapboxCacheService.getRouteGeometry(pair.start, pair.end);
            if (cachedRoute) {
                routes.set(key, cachedRoute);
            } else {
                uncachedPairs.push(pair);
            }
        }

        // If there are uncached routes, fetch them in batches
        if (uncachedPairs.length > 0) {
            const batchSize = 3; // Process 3 routes at a time
            for (let i = 0; i < uncachedPairs.length; i += batchSize) {
                const batch = uncachedPairs.slice(i, i + batchSize);
                const promises = batch.map(async ({ start, end }) => {
                    try {
                        const response = await fetch(
                            `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
                        );
                        const data = await response.json();
                        if (data.routes && data.routes[0]) {
                            const geometry = data.routes[0].geometry;
                            const key = `${start.join(',')}-${end.join(',')}`;
                            await mapboxCacheService.saveRouteGeometry(start, end, geometry);
                            routes.set(key, geometry);
                        }
                    } catch (error) {
                        console.error('Error fetching route:', error);
                    }
                });

                await Promise.all(promises);

                // Add a small delay between batches to avoid rate limiting
                if (i + batchSize < uncachedPairs.length) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
        }

        return routes;
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

                // Save to cache
                await mapboxCacheService.saveRouteGeometry(start, end, geometry);
                return geometry;
            }
            return null;
        } catch (error) {
            console.error('Error fetching route:', error);
            return null;
        }
    }, []);

    // Update route layer with memoization
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
                    console.error(`Error adding route segment ${i}:`, error);
                }
            }
        }
    }, [cleanupRoutes, getRoute]);

    // Memoize the destinations array to prevent unnecessary updates
    const memoizedDestinations = useMemo(() => {
        return destinations.filter(d => d.destination !== '');
    }, [destinations]);

    // Update markers and route when destinations change with debouncing
    useEffect(() => {
        const updateMap = async () => {
            if (!map.current || !memoizedDestinations.length) return;

            // Check if destinations have actually changed
            const currentDestinationsString = JSON.stringify(memoizedDestinations.map(d => d.destination));
            if (currentDestinationsString === previousDestinations.current) {
                return;
            }
            previousDestinations.current = currentDestinationsString;

            // Clear existing markers
            markers.current.forEach(marker => marker.remove());
            markers.current = [];
            coordinates.current = [];

            // Create a bounds object to fit all markers
            const bounds = new mapboxgl.LngLatBounds();

            // Process each destination sequentially
            for (let i = 0; i < memoizedDestinations.length; i++) {
                const dest = memoizedDestinations[i];
                if (!dest.destination) continue;

                const coordsMap = await geocodeDestinations([dest.destination]);
                const coords = coordsMap.get(dest.destination);
                if (coords) {
                    const [lng, lat] = coords;
                    coordinates.current.push(coords);
                    bounds.extend(coords);

                    // Create marker element
                    const el = document.createElement('div');
                    el.className = 'mapbox-marker';
                    el.textContent = `${i + 1}`;

                    // Add marker to map
                    const marker = new mapboxgl.Marker(el)
                        .setLngLat([lng, lat])
                        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${dest.destination}</strong>`))
                        .addTo(map.current);

                    markers.current.push(marker);
                }
            }

            // Fit bounds with padding if we have coordinates
            if (coordinates.current.length > 0) {
                map.current.fitBounds(bounds, {
                    padding: 50,
                    duration: 1000
                });

                // Wait for the map to finish moving before adding routes
                map.current.once('moveend', async () => {
                    // Update route layer after all coordinates are collected
                    await updateRouteLayer(coordinates.current);
                });
            }
        };

        // Clear any existing timeout
        if (updateTimeout.current) {
            clearTimeout(updateTimeout.current);
        }

        // Set a new timeout for the update
        updateTimeout.current = setTimeout(() => {
            // Only update the map if it's fully loaded
            if (map.current && map.current.loaded()) {
                updateMap();
            } else if (map.current) {
                map.current.once('load', () => {
                    updateMap();
                });
            }
        }, 500); // 500ms debounce

        // Cleanup timeout on unmount
        return () => {
            if (updateTimeout.current) {
                clearTimeout(updateTimeout.current);
            }
        };
    }, [memoizedDestinations, geocodeDestinations, updateRouteLayer]);

    return (
        <div ref={mapContainer} className={`mapbox-container ${className}`} />
    );
};

export default MapboxMap; 