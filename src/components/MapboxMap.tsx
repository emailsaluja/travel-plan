import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapboxMap.css';
import mapboxCacheService from '../services/mapboxCacheService';

interface Destination {
    destination: string;
    nights: number;
}

interface MapboxMapProps {
    destinations: Destination[];
    className?: string;
    country: string;
    onMapUpdate?: (
        coordinates: Array<[number, number]>,
        destinations: Destination[]
    ) => void;
}

const MapboxMap: React.FC<MapboxMapProps> = ({ destinations, className = '', country, onMapUpdate }) => {
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

                    // Create an image for arrow markers on the route
                    const arrowImage = new Image(20, 20);
                    arrowImage.src = 'data:image/svg+xml;charset=utf-8,%3Csvg%20viewBox%3D%220%200%2020%2020%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M10%2020c5.523%200%2010-4.477%2010-10S15.523%200%2010%200%200%204.477%200%2010s4.477%2010%2010%2010zm1-15v4h3l-4%206-4-6h3V5h2z%22%20fill%3D%22%23EC4899%22%2F%3E%3C%2Fsvg%3E';

                    arrowImage.onload = () => {
                        if (map.current) {
                            map.current.addImage('arrow', arrowImage);
                            console.log("Arrow icon added to map");
                        }
                    };

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

    // Geocode location with caching
    const geocodeLocation = useCallback(async (location: string): Promise<[number, number] | null> => {
        try {
            console.log(`Geocoding location: ${location}`);

            // Try to get from cache first
            const cachedResult = await mapboxCacheService.getGeocodingResult(location);
            if (cachedResult) {
                console.log(`Using cached geocoding for ${location}:`, cachedResult);
                return cachedResult;
            }

            // Perform geocoding API request
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${mapboxgl.accessToken}&limit=1`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].center;
                console.log(`Geocoded ${location} to [${lng.toFixed(4)}, ${lat.toFixed(4)}]`);

                // Cache the result
                await mapboxCacheService.saveGeocodingResult(location, [lng, lat]);

                return [lng, lat];
            } else {
                console.warn(`No geocoding results found for "${location}"`);
                return null;
            }
        } catch (error) {
            console.error(`Error geocoding location "${location}":`, error);
            return null;
        }
    }, []);

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
            // Calculate the distance to determine appropriate routing method
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

            console.log(`Calculating route from [${startLng.toFixed(4)}, ${startLat.toFixed(4)}] to [${endLng.toFixed(4)}, ${endLat.toFixed(4)}], distance: ${distance.toFixed(1)} km`);

            // Check cache first
            const cachedRoute = await mapboxCacheService.getRouteGeometry(start, end);
            if (cachedRoute) {
                console.log('Route found in cache');
                return cachedRoute;
            }

            // If distance is greater than 2000km, create a great circle route instead of driving
            if (distance > 2000) {
                console.log('Creating great circle route for long distance');
                // Create a great circle line
                const numPoints = 100;
                const coordinates = [];
                for (let i = 0; i <= numPoints; i++) {
                    const f = i / numPoints;
                    const A = Math.sin((1 - f) * c) / Math.sin(c);
                    const B = Math.sin(f * c) / Math.sin(c);
                    const x = A * Math.cos(φ1) * Math.cos(startLng) + B * Math.cos(φ2) * Math.cos(endLng);
                    const y = A * Math.cos(φ1) * Math.sin(startLng) + B * Math.cos(φ2) * Math.sin(endLng);
                    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
                    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI;
                    const lng = Math.atan2(y, x) * 180 / Math.PI;
                    coordinates.push([lng, lat]);
                }

                const geometry = {
                    type: 'LineString',
                    coordinates: coordinates
                };

                // Save to cache
                await mapboxCacheService.saveRouteGeometry(start, end, geometry);
                return geometry;
            }

            // For shorter distances, try to get a driving route
            try {
                console.log('Fetching driving route from Mapbox API');
                const response = await fetch(
                    `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
                );

                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }

                const data = await response.json();

                if (data.routes && data.routes.length > 0) {
                    const geometry = data.routes[0].geometry;
                    console.log('Driving route found and cached');
                    await mapboxCacheService.saveRouteGeometry(start, end, geometry);
                    return geometry;
                } else {
                    console.log('No routes found, falling back to direct line');
                    // Fallback to direct line if no route found
                    const directLine = {
                        type: 'LineString',
                        coordinates: [start, end]
                    };
                    await mapboxCacheService.saveRouteGeometry(start, end, directLine);
                    return directLine;
                }
            } catch (error) {
                console.error('Error fetching driving route:', error);
                // Fallback to direct line in case of error
                const directLine = {
                    type: 'LineString',
                    coordinates: [start, end]
                };
                await mapboxCacheService.saveRouteGeometry(start, end, directLine);
                return directLine;
            }
        } catch (error) {
            console.error('Error in getRoute:', error);
            // Fallback to direct line
            return {
                type: 'LineString',
                coordinates: [start, end]
            };
        }
    }, []);

    // Update route layer with new coordinates
    const updateRouteLayer = useCallback(async (coordinates: Array<[number, number]>) => {
        if (!map.current || coordinates.length < 2) {
            console.log('Map not ready or insufficient coordinates for route');
            return;
        }

        try {
            const mapInstance = map.current;
            console.log('Updating route layer with coordinates:', coordinates);

            // Clean up existing routes if they exist
            const mapStyle = mapInstance.getStyle();
            const existingLayers = mapStyle?.layers || [];
            existingLayers.forEach(layer => {
                if (layer.id.startsWith('route-') || layer.id.startsWith('route-arrows-')) {
                    mapInstance.removeLayer(layer.id);
                }
            });

            // Remove existing sources
            const sources = mapStyle?.sources || {};
            Object.keys(sources).forEach(sourceId => {
                if (sourceId.startsWith('route-')) {
                    mapInstance.removeSource(sourceId);
                }
            });

            // Process routes between consecutive points
            for (let i = 0; i < coordinates.length - 1; i++) {
                const start = coordinates[i];
                const end = coordinates[i + 1];

                try {
                    // Get route between these points
                    const geometry = await getRoute(start, end);
                    if (!geometry) continue;

                    // Calculate distance between points
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

                    // Determine if this is a long-distance route (use dashed line if so)
                    const isLongDistance = distance > 2000;

                    // Create source ID and layer ID
                    const sourceId = `route-${i}`;
                    const layerId = `route-${i}`;
                    const arrowsLayerId = `route-arrows-${i}`;

                    // Add source for this route segment
                    mapInstance.addSource(sourceId, {
                        type: 'geojson',
                        data: {
                            type: 'Feature',
                            properties: {},
                            geometry: geometry
                        }
                    });

                    // Add the line layer for this route segment
                    mapInstance.addLayer({
                        id: layerId,
                        type: 'line',
                        source: sourceId,
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': '#0084ff',
                            'line-width': 3,
                            'line-opacity': 0.8,
                            'line-dasharray': isLongDistance ? [2, 1] : [1]
                        }
                    });

                    // Add directional arrows for this route
                    mapInstance.addLayer({
                        id: arrowsLayerId,
                        type: 'symbol',
                        source: sourceId,
                        layout: {
                            'symbol-placement': 'line',
                            'symbol-spacing': 100,
                            'icon-image': 'arrow',
                            'icon-size': 0.5,
                            'icon-allow-overlap': true,
                            'symbol-avoid-edges': false
                        }
                    });

                    console.log(`Added route segment ${i} from ${start} to ${end}`);
                } catch (error) {
                    console.error(`Error adding route segment ${i}:`, error);
                }
            }
        } catch (error) {
            console.error('Error updating route layer:', error);
        }
    }, [map, getRoute]);

    // Memoize the destinations array to prevent unnecessary updates
    const memoizedDestinations = useMemo(() => {
        return destinations.filter(d => d.destination !== '');
    }, [destinations]);

    // Update markers and route when destinations change with debouncing
    useEffect(() => {
        const updateMap = async () => {
            if (!map.current || !destinations || destinations.length === 0) {
                console.log('Map not ready or no destinations');
                return;
            }

            console.log('Updating map with destinations:', destinations);

            // Clear existing markers and popups
            if (markers.current.length > 0) {
                console.log('Clearing existing markers');
                markers.current.forEach(marker => marker.remove());
                markers.current = [];
            }

            // Geocode all destinations in parallel with better error handling
            const coordinates: Array<[number, number]> = [];
            const validDestinations: Destination[] = [];

            await Promise.all(
                destinations.map(async (destination, index) => {
                    try {
                        const coords = await geocodeLocation(destination.destination);

                        if (coords) {
                            coordinates[index] = coords;
                            validDestinations[index] = destination;

                            // Create marker with improved styling
                            const markerElement = document.createElement('div');
                            markerElement.className = 'mapbox-marker';

                            // Add day number to marker
                            const dayElement = document.createElement('div');
                            dayElement.className = 'day-number';
                            dayElement.textContent = (index + 1).toString();
                            markerElement.appendChild(dayElement);

                            // Create popup with destination info
                            const popup = new mapboxgl.Popup({
                                offset: 25,
                                closeButton: false,
                                className: 'destination-popup'
                            }).setHTML(`
                                <div class="popup-content">
                                    <h3>Day ${index + 1}: ${destination.destination}</h3>
                                    <p>${destination.nights ? `${destination.nights} nights` : ''}</p>
                                </div>
                            `);

                            // Add marker to map
                            const marker = new mapboxgl.Marker(markerElement)
                                .setLngLat(coords)
                                .setPopup(popup);

                            // Only add to map if it exists
                            if (map.current) {
                                marker.addTo(map.current);
                            }

                            // Show popup on hover
                            markerElement.addEventListener('mouseenter', () => {
                                const popup = marker.getPopup();
                                if (map.current && popup) {
                                    popup.addTo(map.current);
                                }
                            });

                            markerElement.addEventListener('mouseleave', () => {
                                const popup = marker.getPopup();
                                if (popup) {
                                    popup.remove();
                                }
                            });

                            // Add to markers array for cleanup
                            markers.current.push(marker);
                        } else {
                            console.warn(`Failed to geocode destination: ${destination.destination}`);
                        }
                    } catch (error) {
                        console.error(`Error processing destination ${index}:`, error);
                    }
                })
            );

            // Filter out any empty slots from failed geocoding
            const filteredCoords = coordinates.filter(coord => coord !== undefined);
            const filteredDestinations = validDestinations.filter(dest => dest !== undefined);

            if (filteredCoords.length > 0) {
                console.log('Setting coordinates for route:', filteredCoords);

                // Update route if we have at least 2 points
                if (filteredCoords.length > 1 && map.current) {
                    updateRouteLayer(filteredCoords);
                }

                // Fit map to bounds of all markers
                const bounds = new mapboxgl.LngLatBounds();
                filteredCoords.forEach(coord => bounds.extend(coord));

                if (map.current) {
                    map.current.fitBounds(bounds, {
                        padding: { top: 100, bottom: 100, left: 100, right: 100 },
                        maxZoom: 10
                    });
                }

                // Save the result to callback if provided
                if (onMapUpdate) {
                    onMapUpdate(filteredCoords, filteredDestinations);
                }
            } else {
                console.warn('No valid coordinates after geocoding');
            }
        };

        // Clear any existing timeout
        if (updateTimeout.current) {
            clearTimeout(updateTimeout.current);
        }

        // Set a new timeout for the update to ensure the map is fully loaded
        updateTimeout.current = setTimeout(() => {
            // Only update the map if it's fully loaded
            if (map.current && map.current.loaded()) {
                updateMap();
            } else if (map.current) {
                // Wait for map to load if not already loaded
                map.current.once('load', () => {
                    updateMap();
                });
            }
        }, 300); // Reduced timeout for faster updates

        // Cleanup timeout on unmount
        return () => {
            if (updateTimeout.current) {
                clearTimeout(updateTimeout.current);
            }
        };
    }, [map, destinations, markers, geocodeLocation, updateRouteLayer, onMapUpdate]);

    return (
        <div ref={mapContainer} className={`mapbox-container ${className}`} />
    );
};

export default MapboxMap; 