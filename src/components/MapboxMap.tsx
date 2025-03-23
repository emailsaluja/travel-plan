import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapboxMap.css';

interface Destination {
    destination: string;
    nights: number;
}

interface MapboxMapProps {
    destinations: Destination[];
    className?: string;
}

// Cache for geocoding results
const geocodingCache: { [key: string]: [number, number] } = {};

const MapboxMap: React.FC<MapboxMapProps> = React.memo(({ destinations, className = '' }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markers = useRef<mapboxgl.Marker[]>([]);
    const coordinates = useRef<[number, number][]>([]);
    const routeLayer = useRef<mapboxgl.GeoJSONSource | null>(null);
    const previousDestinations = useRef<string>('');
    const updateTimeout = useRef<NodeJS.Timeout | null>(null);

    // Function to clean up route layers and sources
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

    // Memoize geocoding function with cache
    const geocodeDestination = useCallback(async (destination: string): Promise<[number, number] | null> => {
        // Check cache first
        if (geocodingCache[destination]) {
            return geocodingCache[destination];
        }

        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination)}.json?access_token=${mapboxgl.accessToken}`
            );
            const data = await response.json();
            if (data.features && data.features[0]) {
                const [lng, lat] = data.features[0].center;
                // Cache the result
                geocodingCache[destination] = [lng, lat];
                return [lng, lat];
            }
            return null;
        } catch (error) {
            console.error(`Error geocoding ${destination}:`, error);
            return null;
        }
    }, []);

    // Memoize route fetching function with route cache
    const routeCache = useRef<{ [key: string]: any }>({});
    const getRoute = useCallback(async (start: [number, number], end: [number, number]) => {
        const cacheKey = `${start.join(',')}-${end.join(',')}`;

        // Check cache first
        if (routeCache.current[cacheKey]) {
            return routeCache.current[cacheKey];
        }

        try {
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
            );
            const data = await response.json();
            if (data.routes && data.routes[0]) {
                // Cache the result
                routeCache.current[cacheKey] = data.routes[0].geometry;
                return data.routes[0].geometry;
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

                const coords = await geocodeDestination(dest.destination);
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
    }, [memoizedDestinations, geocodeDestination, updateRouteLayer]);

    return (
        <div ref={mapContainer} className={`mapbox-container ${className}`} />
    );
});

export default MapboxMap; 