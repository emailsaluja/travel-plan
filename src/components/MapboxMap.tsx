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
    country: string;
}

const MapboxMap: React.FC<MapboxMapProps> = ({ destinations, className = '', country }) => {
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
        const layers = map.current.getStyle()?.layers;
        if (layers) {
            // Remove all route layers
            layers.forEach(layer => {
                if (layer.id.startsWith('route-segment-')) {
                    map.current?.removeLayer(layer.id);
                }
            });
        }

        // Remove all route sources
        const sources = map.current.getStyle()?.sources;
        if (sources) {
            Object.keys(sources).forEach(sourceId => {
                if (sourceId.startsWith('route-segment-')) {
                    map.current?.removeSource(sourceId);
                }
            });
        }
    }, []);

    // Get country code using ISO-3166-1 alpha-2 format
    const getCountryCode = (countryName: string): string => {
        // Common country name variations to ISO code mapping
        const countryMapping: { [key: string]: string } = {
            // Oceania
            'fiji': 'fj', 'fiji islands': 'fj',
            'australia': 'au',
            'new zealand': 'nz',
            'papua new guinea': 'pg',
            // Asia
            'japan': 'jp',
            'china': 'cn',
            'india': 'in',
            'thailand': 'th',
            'vietnam': 'vn',
            'singapore': 'sg',
            'malaysia': 'my',
            'indonesia': 'id',
            // Europe
            'switzerland': 'ch',
            'italy': 'it',
            'france': 'fr',
            'germany': 'de',
            'spain': 'es',
            'portugal': 'pt',
            'united kingdom': 'gb', 'uk': 'gb',
            'ireland': 'ie',
            'netherlands': 'nl',
            'belgium': 'be',
            'austria': 'at',
            'greece': 'gr',
            'sweden': 'se',
            'norway': 'no',
            'denmark': 'dk',
            'finland': 'fi',
            // Americas
            'united states': 'us', 'usa': 'us',
            'canada': 'ca',
            'mexico': 'mx',
            'brazil': 'br',
            'argentina': 'ar',
            'chile': 'cl',
            'peru': 'pe',
            // Africa
            'south africa': 'za',
            'egypt': 'eg',
            'morocco': 'ma',
            'kenya': 'ke',
            'tanzania': 'tz'
        };

        const normalizedCountry = countryName.toLowerCase().trim();
        return countryMapping[normalizedCountry] || '';
    };

    // Get initial map center with improved country detection
    const getInitialMapCenter = useCallback(async (countryName: string): Promise<{ center: [number, number]; zoom: number }> => {
        if (!countryName) {
            return { center: [0, 0], zoom: 1 }; // World view
        }

        try {
            const countryCode = getCountryCode(countryName);
            let geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(countryName)}.json?types=country&language=en&limit=1&access_token=${mapboxgl.accessToken}`;

            if (countryCode) {
                geocodingUrl += `&country=${countryCode}`;
            }

            const response = await fetch(geocodingUrl);
            const data = await response.json();

            if (data.features && data.features[0]) {
                const feature = data.features[0];
                const [lng, lat] = feature.center;
                const bbox = feature.bbox;

                // Calculate zoom based on country size
                let zoom = 5;
                if (bbox) {
                    const width = Math.abs(bbox[2] - bbox[0]);
                    const height = Math.abs(bbox[3] - bbox[1]);
                    const size = Math.max(width, height);

                    // Dynamic zoom calculation based on country size
                    if (size > 100) zoom = 2;      // Very large countries (Russia, Canada)
                    else if (size > 50) zoom = 3;  // Large countries (USA, China)
                    else if (size > 20) zoom = 4;  // Medium countries (France, Germany)
                    else if (size > 10) zoom = 5;  // Smaller countries (Switzerland)
                    else if (size > 5) zoom = 6;   // Very small countries (Singapore)
                    else zoom = 7;                 // Tiny countries/territories
                }

                return { center: [lng, lat], zoom };
            }
        } catch (error) {
            console.error('Error getting country center:', error);
        }

        // Fallback to world view if anything fails
        return { center: [0, 0], zoom: 1 };
    }, []);

    // Initialize map with improved viewport handling
    useEffect(() => {
        const initializeMap = async () => {
            if (!mapContainer.current || map.current) return;

            try {
                const { center, zoom } = await getInitialMapCenter(country);

                mapboxgl.accessToken = 'pk.eyJ1IjoiYW1hbjlpbiIsImEiOiJjbThrdHZrcjQxNXByMmtvZ3d1cGlsYXA4In0.nUn4wFsWrbw2jC6ZMEJNPw';

                map.current = new mapboxgl.Map({
                    container: mapContainer.current,
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: center,
                    zoom: zoom,
                    attributionControl: false,
                    maxZoom: 15, // Prevent excessive zoom
                    minZoom: 1,  // Allow full world view
                    pitchWithRotate: false, // Disable 3D rotation for better performance
                });

                // Add navigation controls
                map.current.addControl(
                    new mapboxgl.NavigationControl({
                        showCompass: false // Only show zoom controls
                    }),
                    'top-right'
                );

                // Handle viewport changes
                map.current.on('load', () => {
                    map.current?.resize();

                    // Add event listener for viewport changes
                    map.current?.on('moveend', () => {
                        if (map.current) {
                            const currentBounds = map.current.getBounds();
                            const currentZoom = map.current.getZoom();

                            // Store current viewport state if needed
                            console.debug('Viewport updated:', {
                                bounds: currentBounds,
                                zoom: currentZoom
                            });
                        }
                    });
                });

            } catch (error) {
                console.error('Error initializing map:', error);
                // Initialize with world view as fallback
                if (mapContainer.current && !map.current) {
                    map.current = new mapboxgl.Map({
                        container: mapContainer.current,
                        style: 'mapbox://styles/mapbox/streets-v12',
                        center: [0, 0],
                        zoom: 1,
                        attributionControl: false
                    });
                }
            }
        };

        initializeMap();

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
    }, [country, getInitialMapCenter]);

    // Memoize geocoding function with cache and batch processing
    const geocodeDestinations = useCallback(async (destinations: string[]): Promise<Map<string, [number, number]>> => {
        const coordsMap = new Map<string, [number, number]>();
        const uncachedDestinations: string[] = [];
        const countryCode = getCountryCode(country);

        // Special handling for known Fiji locations
        const fijiLocations: { [key: string]: [number, number] } = {
            'denarau island': [177.4333, -17.7667],
            'nadi': [177.4167, -17.8000],
            'suva': [178.4417, -18.1416],
            'mamanuca islands': [177.1833, -17.6667],
            'yasawa islands': [177.0000, -16.9167],
            'taveuni': [179.9833, -16.8500],
            'vanua levu': [179.3167, -16.5833],
            'coral coast': [177.8333, -18.1667]
        };

        // First check for known Fiji locations
        if (countryCode === 'fj') {
            for (const dest of destinations) {
                const normalizedDest = dest.toLowerCase().trim();
                if (fijiLocations[normalizedDest]) {
                    coordsMap.set(dest, fijiLocations[normalizedDest]);
                    continue;
                }
                uncachedDestinations.push(dest);
            }
        } else {
            uncachedDestinations.push(...destinations);
        }

        // Get country center for proximity bias
        const { center } = await getInitialMapCenter(country);

        // Check cache for remaining destinations
        for (const dest of uncachedDestinations.slice()) {
            const cachedCoords = await mapboxCacheService.getGeocodingResult(dest);
            // Validate cached coordinates for Fiji
            if (cachedCoords && countryCode === 'fj') {
                const [lng, lat] = cachedCoords;
                // Check if coordinates are within Fiji's bounding box
                if (lng < 176 || lng > 180 || lat < -20 || lat > -16) {
                    // Invalid coordinates, remove from cache and add to uncached
                    await mapboxCacheService.deleteGeocodingResult(dest);
                } else {
                    coordsMap.set(dest, cachedCoords);
                    uncachedDestinations.splice(uncachedDestinations.indexOf(dest), 1);
                }
            } else if (cachedCoords) {
                coordsMap.set(dest, cachedCoords);
                uncachedDestinations.splice(uncachedDestinations.indexOf(dest), 1);
            }
        }

        // If there are uncached destinations, fetch them in batches
        if (uncachedDestinations.length > 0) {
            const batchSize = 5;
            for (let i = 0; i < uncachedDestinations.length; i += batchSize) {
                const batch = uncachedDestinations.slice(i, i + batchSize);
                const promises = batch.map(async (dest) => {
                    try {
                        // Build the geocoding URL with enhanced parameters
                        let geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(dest)}.json?` +
                            `types=place,district,locality,neighborhood,island&` +
                            `language=en&` +
                            `limit=10&` + // Increased limit to get more candidates
                            `proximity=${center.join(',')}&` + // Add proximity bias to country center
                            `bbox=${countryCode === 'fj' ? '176,-20,180,-16' : ''}&` + // Fiji bounding box
                            `access_token=${mapboxgl.accessToken}`;

                        if (countryCode) {
                            geocodingUrl += `&country=${countryCode}`;
                        }

                        const response = await fetch(geocodingUrl);
                        if (!response.ok) {
                            throw new Error(`Geocoding failed with status: ${response.status}`);
                        }

                        const data = await response.json();

                        if (data.features && data.features.length > 0) {
                            // Enhanced matching algorithm with country-specific logic
                            const bestMatch = data.features.reduce((best: any, current: any) => {
                                if (!best) return current;

                                // Calculate match scores
                                const getScore = (feature: any) => {
                                    let score = feature.relevance;

                                    // Exact name match bonus
                                    if (feature.text.toLowerCase() === dest.toLowerCase()) {
                                        score += 2;
                                    }

                                    // Correct country bonus
                                    if (feature.context?.some((ctx: any) => ctx.short_code === countryCode)) {
                                        score += 3;
                                    }

                                    // Place type weighting
                                    switch (feature.place_type[0]) {
                                        case 'island': score += 2; break;
                                        case 'place': score += 1.5; break;
                                        case 'locality': score += 1; break;
                                        case 'neighborhood': score += 0.5; break;
                                        default: break;
                                    }

                                    // For Fiji, check if coordinates are within bounds
                                    if (countryCode === 'fj') {
                                        const [lng, lat] = feature.center;
                                        if (lng >= 176 && lng <= 180 && lat >= -20 && lat <= -16) {
                                            score += 5; // High bonus for being within Fiji bounds
                                        } else {
                                            score -= 10; // Heavy penalty for being outside Fiji
                                        }
                                    }

                                    return score;
                                };

                                const currentScore = getScore(current);
                                const bestScore = getScore(best);

                                return currentScore > bestScore ? current : best;
                            });

                            if (bestMatch) {
                                const [lng, lat] = bestMatch.center;
                                // For Fiji, double-check coordinates are within bounds
                                if (countryCode !== 'fj' || (lng >= 176 && lng <= 180 && lat >= -20 && lat <= -16)) {
                                    const coords: [number, number] = [lng, lat];
                                    await mapboxCacheService.saveGeocodingResult(dest, coords);
                                    return { dest, coords };
                                }
                            }
                        }
                        console.warn(`No valid geocoding results found for ${dest} in ${country}`);
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
    }, [country, getInitialMapCenter]);

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

            // Calculate the distance between points using the Haversine formula
            const R = 6371e3; // Earth's radius in meters
            const φ1 = start[1] * Math.PI / 180;
            const φ2 = end[1] * Math.PI / 180;
            const Δφ = (end[1] - start[1]) * Math.PI / 180;
            const Δλ = (end[0] - start[0]) * Math.PI / 180;
            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c / 1000; // Distance in kilometers

            // If distance is greater than 2000km, create a great circle route instead
            if (distance > 2000) {
                // Create a great circle line
                const numPoints = 100;
                const coordinates = [];
                for (let i = 0; i <= numPoints; i++) {
                    const f = i / numPoints;
                    const A = Math.sin((1 - f) * c) / Math.sin(c);
                    const B = Math.sin(f * c) / Math.sin(c);
                    const x = A * Math.cos(φ1) * Math.cos(start[0]) + B * Math.cos(φ2) * Math.cos(end[0]);
                    const y = A * Math.cos(φ1) * Math.sin(start[0]) + B * Math.cos(φ2) * Math.sin(end[0]);
                    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
                    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI;
                    const lon = Math.atan2(y, x) * 180 / Math.PI;
                    coordinates.push([lon, lat]);
                }

                return {
                    type: 'LineString',
                    coordinates: coordinates
                };
            }

            // If distance is less than 2000km, try to get a driving route
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
            );

            if (!response.ok) {
                // If driving route fails, create a direct line
                return {
                    type: 'LineString',
                    coordinates: [start, end]
                };
            }

            const data = await response.json();
            if (data.routes && data.routes[0]) {
                const geometry = data.routes[0].geometry;
                await mapboxCacheService.saveRouteGeometry(start, end, geometry);
                return geometry;
            }

            // Fallback to direct line if no route found
            return {
                type: 'LineString',
                coordinates: [start, end]
            };
        } catch (error) {
            console.error('Error fetching route:', error);
            // Fallback to direct line in case of error
            return {
                type: 'LineString',
                coordinates: [start, end]
            };
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

                    // Calculate if this is a great circle route based on distance
                    const isGreatCircle = routeGeometry.coordinates.length > 2 && (() => {
                        const [startLng, startLat] = start;
                        const [endLng, endLat] = end;
                        const R = 6371e3; // Earth's radius in meters
                        const φ1 = startLat * Math.PI / 180;
                        const φ2 = endLat * Math.PI / 180;
                        const Δφ = (endLat - startLat) * Math.PI / 180;
                        const Δλ = (endLng - startLng) * Math.PI / 180;
                        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                            Math.cos(φ1) * Math.cos(φ2) *
                            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                        const distance = R * c / 1000; // Distance in kilometers
                        return distance > 2000;
                    })();

                    map.current.addLayer({
                        id: layerId,
                        type: 'line',
                        source: sourceId,
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': '#EC4899', // Always use pink color
                            'line-width': 3,
                            'line-opacity': 0.8,
                            'line-dasharray': isGreatCircle ? [2, 2] : [1, 0] // Dashed for air routes, solid for driving
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
            let hasValidBounds = false;

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
                    hasValidBounds = true;

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
            if (hasValidBounds) {
                map.current.fitBounds(bounds, {
                    padding: { top: 50, bottom: 50, left: 50, right: 50 },
                    duration: 1000,
                    maxZoom: 10 // Prevent excessive zoom for single destinations
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