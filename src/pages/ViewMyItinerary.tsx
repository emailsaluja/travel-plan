import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserItineraryViewService, UserItineraryView } from '../services/user-itinerary-view.service';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Calendar, Utensils } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { config } from '../config/config';

// Initialize Mapbox with the token
mapboxgl.accessToken = config.mapbox.accessToken;

const getHeroImage = async (tripName: string, country: string): Promise<string> => {
    // Curated fallback images for travel/landscape
    const fallbackImages = [
        'https://images.unsplash.com/photo-1469521669194-babb45599def',
        'https://images.unsplash.com/photo-1507699622108-4be3abd695ad',
        'https://images.unsplash.com/photo-1598890777032-bde835ba27c2'
    ];

    // If no valid Unsplash API key, return a random fallback image
    if (!config.unsplash.accessKey || config.unsplash.accessKey === 'your_unsplash_access_key_here') {
        const randomIndex = Math.floor(Math.random() * fallbackImages.length);
        return `${fallbackImages[randomIndex]}?w=3000&q=85&auto=format&fit=crop`;
    }

    try {
        // Create a search query for Unsplash
        const query = `${country} landscape scenic travel`;

        // Call Unsplash API to get a relevant photo
        const response = await fetch(
            `${config.unsplash.apiBaseUrl}/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`,
            {
                headers: {
                    'Authorization': `Client-ID ${config.unsplash.accessKey}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch image');
        }

        const data = await response.json();
        return `${data.urls.raw}&w=3000&q=85&auto=format&fit=crop`;
    } catch (error) {
        console.error('Error fetching hero image:', error);
        // Return a random fallback image on error
        const randomIndex = Math.floor(Math.random() * fallbackImages.length);
        return `${fallbackImages[randomIndex]}?w=3000&q=85&auto=format&fit=crop`;
    }
};

const ViewMyItinerary: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [itinerary, setItinerary] = useState<UserItineraryView | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDestIndex, setSelectedDestIndex] = useState(0);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [coordinates, setCoordinates] = useState<[number, number][]>([]);
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [heroImage, setHeroImage] = useState<string>('');

    const formatDate = (date: string) => {
        const options: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        };
        return new Date(date).toLocaleDateString('en-US', options);
    };

    const calculateStartDate = (destIndex: number, dayIndex: number) => {
        if (!itinerary?.start_date) return new Date();
        const startDate = new Date(itinerary.start_date);
        let daysToAdd = 0;
        for (let i = 0; i < destIndex; i++) {
            daysToAdd += itinerary.destinations[i].nights;
        }
        daysToAdd += dayIndex;
        const newDate = new Date(startDate);
        newDate.setDate(startDate.getDate() + daysToAdd);
        return newDate;
    };

    // Function to fetch coordinates for a destination
    const fetchCoordinates = async (destination: string): Promise<[number, number]> => {
        try {
            // Add ", New Zealand" to the search query for better results
            const searchQuery = `${destination}, New Zealand`;

            const params = new URLSearchParams();
            params.append('access_token', config.mapbox.accessToken);
            params.append('types', 'place,region,district,locality,neighborhood');
            params.append('country', 'nz');
            params.append('language', 'en');
            params.append('limit', '1');
            params.append('proximity', `${config.map.newZealand.center.lng},${config.map.newZealand.center.lat}`);

            const response = await fetch(
                `${config.mapbox.apiBaseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?${params}`
            );

            const data = await response.json();

            if (data.features && data.features.length > 0) {
                // Log the found place for debugging
                console.log('Found place:', {
                    name: data.features[0].place_name,
                    coordinates: data.features[0].center,
                    type: data.features[0].place_type,
                    context: data.features[0].context
                });

                return data.features[0].center as [number, number];
            }

            console.warn(`No coordinates found for: ${destination}`);
            return [0, 0];
        } catch (error) {
            console.error('Error fetching coordinates:', error);
            return [0, 0];
        }
    };

    // Function to draw route between destinations
    const drawRoute = async (coordinates: [number, number][]) => {
        if (!map.current || coordinates.length < 2) return;

        try {
            // Create waypoints from coordinates
            const waypoints = coordinates.map(coord => ({
                coordinates: coord
            }));

            // Function to get route between two points
            const getRouteBetweenPoints = async (start: [number, number], end: [number, number]) => {
                const response = await fetch(
                    `${config.mapbox.apiBaseUrl}/directions/v5/mapbox/driving/${start.join(',')};${end.join(',')}?geometries=geojson&overview=full&access_token=${config.mapbox.accessToken}`
                );
                const data = await response.json();
                return data.routes?.[0]?.geometry?.coordinates || null;
            };

            // Get routes between consecutive points
            const routeSegments = [];
            for (let i = 0; i < coordinates.length - 1; i++) {
                const segmentCoords = await getRouteBetweenPoints(coordinates[i], coordinates[i + 1]);
                if (segmentCoords) {
                    routeSegments.push(...segmentCoords);
                } else {
                    // Fallback to direct line if no route found
                    routeSegments.push(coordinates[i], coordinates[i + 1]);
                }
            }

            const lineGeometry: GeoJSON.LineString = {
                type: 'LineString',
                coordinates: routeSegments
            };

            if (map.current.getSource('route')) {
                (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
                    type: 'Feature',
                    properties: {},
                    geometry: lineGeometry
                });
            } else {
                map.current.addSource('route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: lineGeometry
                    }
                });

                map.current.addLayer({
                    id: 'route',
                    type: 'line',
                    source: 'route',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#EC4899',
                        'line-width': 4,
                        'line-opacity': 0.8
                    }
                });
            }
        } catch (error) {
            console.error('Error drawing route:', error);

            // Fallback to direct lines if the directions API fails
            const lineGeometry: GeoJSON.LineString = {
                type: 'LineString',
                coordinates: coordinates
            };

            if (map.current.getSource('route')) {
                (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
                    type: 'Feature',
                    properties: {},
                    geometry: lineGeometry
                });
            } else {
                map.current.addSource('route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: lineGeometry
                    }
                });

                map.current.addLayer({
                    id: 'route',
                    type: 'line',
                    source: 'route',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#EC4899',
                        'line-width': 4,
                        'line-opacity': 0.8
                    }
                });
            }
        }
    };

    // Initialize map and fetch coordinates
    useEffect(() => {
        const initializeMap = async () => {
            if (!itinerary || !mapContainer.current || map.current) return;

            const allCoords = await Promise.all(
                itinerary.destinations.map(dest => fetchCoordinates(dest.destination))
            );
            setCoordinates(allCoords);

            const bounds = new mapboxgl.LngLatBounds();
            allCoords.forEach(coord => bounds.extend(coord as mapboxgl.LngLatLike));

            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: config.mapbox.defaultMapStyle,
                bounds: bounds,
                fitBoundsOptions: { padding: 50 }
            });

            // Add markers for each destination
            allCoords.forEach((coord, index) => {
                const marker = document.createElement('div');
                marker.className = 'destination-marker';
                marker.innerHTML = `
                    <div class="w-8 h-8 bg-[#00B8A9] text-white rounded-full flex items-center justify-center text-sm font-medium shadow-lg">
                        ${index + 1}
                    </div>
                `;

                const popup = new mapboxgl.Popup({
                    offset: 25,
                    closeButton: false,
                    className: 'destination-popup'
                }).setHTML(`
                    <div class="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100">
                        <p class="font-medium text-gray-900">${itinerary.destinations[index].destination}</p>
                        <p class="text-sm text-gray-500">${itinerary.destinations[index].nights} ${itinerary.destinations[index].nights === 1 ? 'night' : 'nights'}</p>
                    </div>
                `);

                new mapboxgl.Marker({ element: marker })
                    .setLngLat(coord)
                    .setPopup(popup)
                    .addTo(map.current!);
            });

            map.current.on('load', () => {
                drawRoute(allCoords);
            });
        };

        initializeMap();
    }, [itinerary]);

    // Fetch itinerary data
    useEffect(() => {
        const fetchItinerary = async () => {
            if (id) {
                const { data, error } = await UserItineraryViewService.getItineraryById(id);
                if (data) {
                    setItinerary(data);
                }
                setLoading(false);
            }
        };
        fetchItinerary();
    }, [id]);

    useEffect(() => {
        setSelectedDayIndex(0);
    }, [selectedDestIndex]);

    // Load hero image
    useEffect(() => {
        const loadHeroImage = async () => {
            const imageUrl = await getHeroImage(itinerary?.trip_name || '', itinerary?.country || '');
            setHeroImage(imageUrl);
        };
        loadHeroImage();
    }, [itinerary?.trip_name, itinerary?.country]);

    if (loading) {
        return <div className="container mx-auto px-4 py-8 mt-16">Loading...</div>;
    }

    const selectedDestination = itinerary?.destinations[selectedDestIndex];
    const getDayNumber = (destIndex: number, dayIndex: number) => {
        let totalDays = 0;
        for (let i = 0; i < destIndex; i++) {
            totalDays += (itinerary?.destinations[i]?.nights || 0);
        }
        return totalDays + dayIndex + 1;
    };

    const currentDayNumber = getDayNumber(selectedDestIndex, selectedDayIndex);
    const dayAttractions = itinerary?.day_attractions?.[currentDayNumber - 1]?.attractions || [];
    const dayHotel = itinerary?.day_hotels?.find(d => d.day_index === currentDayNumber - 1)?.hotel;
    const dayNotes = itinerary?.day_notes?.find(d => d.day_index === currentDayNumber - 1)?.notes;
    const dayFoodOptions = itinerary?.day_food_options?.[currentDayNumber - 1]?.food_options || [];

    return (
        <section className="relative">
            <div className="relative w-full h-[500px] -mt-20">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                    style={{
                        backgroundImage: `url('${heroImage}')`,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30" />
                <div className="container mx-auto h-full max-w-[90rem] relative">
                    <div className="flex flex-col justify-end h-full pb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center px-6"
                        >
                            <h1 className="text-[40px] sm:text-[48px] font-light text-white mb-4">
                                {itinerary?.trip_name}
                            </h1>
                            <p className="text-xl text-white/90 mb-6">
                                A {itinerary?.duration}-day journey through {itinerary?.country}
                            </p>
                            <Link to="/overview" className="text-white/90 hover:text-white flex items-center justify-center gap-2 transition-colors">
                                ← Back to overview
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-[90rem]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="px-6"
                >
                    <Tabs
                        value={selectedDestination?.destination}
                        onValueChange={(value: string) => {
                            const index = itinerary?.destinations.findIndex(d => d.destination === value) ?? 0;
                            setSelectedDestIndex(index);
                        }}
                        className="w-full"
                    >
                        <TabsList className="mb-6 flex flex-wrap h-auto bg-transparent p-0 justify-start w-full border-b border-[#E2E8F0]">
                            {itinerary?.destinations.map((dest, index) => (
                                <TabsTrigger
                                    key={dest.destination}
                                    value={dest.destination}
                                    className="data-[state=active]:bg-transparent data-[state=active]:text-[#6366F1] data-[state=active]:border-b-2 data-[state=active]:border-[#6366F1] mr-6 mb-0 px-1 pb-4 rounded-none"
                                >
                                    {dest.destination} ({dest.nights} {dest.nights === 1 ? 'day' : 'days'})
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="flex-1">
                                {itinerary?.destinations.map((destination, destIndex) => (
                                    <TabsContent
                                        key={destination.destination}
                                        value={destination.destination}
                                        className="mt-0"
                                    >
                                        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mb-8">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                                                <div>
                                                    <h3 className="text-2xl font-medium text-[#0F172A]">{destination.destination}</h3>
                                                    <p className="text-[#64748B]">
                                                        Starting {formatDate(calculateStartDate(destIndex, 0).toISOString())} • {destination.nights} days
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-6">
                                                {Array.from({ length: destination.nights }).map((_, dayIndex) => (
                                                    <button
                                                        key={dayIndex}
                                                        onClick={() => setSelectedDayIndex(dayIndex)}
                                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${dayIndex === selectedDayIndex
                                                            ? 'bg-[#6366F1] text-white'
                                                            : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                                                            }`}
                                                    >
                                                        Day {getDayNumber(destIndex, dayIndex)}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="mt-8">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-12 h-12 bg-[#EEF2FF] rounded-full flex items-center justify-center text-2xl text-[#6366F1]">
                                                        {getDayNumber(destIndex, selectedDayIndex)}
                                                    </div>
                                                    <div>
                                                        <div className="text-[#64748B] text-sm font-medium flex items-center gap-2">
                                                            <Calendar className="w-4 h-4" />
                                                            {formatDate(calculateStartDate(destIndex, selectedDayIndex).toISOString())}
                                                        </div>
                                                        {dayHotel && (
                                                            <div className="flex items-center gap-2 text-[#64748B] text-sm mt-0.5">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                                </svg>
                                                                <span className="font-medium">{dayHotel}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Things to Do Section */}
                                                <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
                                                    <div className="p-6">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M17.5 8.33334C17.5 14.1667 10 19.1667 10 19.1667C10 19.1667 2.5 14.1667 2.5 8.33334C2.5 6.34421 3.29018 4.43656 4.6967 3.03004C6.10322 1.62352 8.01088 0.833344 10 0.833344C11.9891 0.833344 13.8968 1.62352 15.3033 3.03004C16.7098 4.43656 17.5 6.34421 17.5 8.33334Z" stroke="#0EA5E9" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M10 10.8333C11.3807 10.8333 12.5 9.71405 12.5 8.33334C12.5 6.95262 11.3807 5.83334 10 5.83334C8.61929 5.83334 7.5 6.95262 7.5 8.33334C7.5 9.71405 8.61929 10.8333 10 10.8333Z" stroke="#0EA5E9" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                            <h3 className="text-[#0F172A] text-lg font-semibold">Things to Do & See</h3>
                                                        </div>
                                                        <p className="text-[#64748B] text-sm">Scheduled activities for the day</p>
                                                    </div>

                                                    <div className="space-y-4 p-6 pt-2">
                                                        {dayAttractions.map((attraction, index) => (
                                                            <div key={attraction.id || index} className="flex items-start justify-between p-4 border border-[#E2E8F0] rounded-lg">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="mt-1">
                                                                        <svg className="w-4 h-4 text-[#0EA5E9]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                            <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                        </svg>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-[#0F172A] text-base font-medium">{attraction.name}</h4>
                                                                        <p className="text-[#64748B] text-sm mt-1">{attraction.description || ''}</p>
                                                                    </div>
                                                                </div>
                                                                {(() => {
                                                                    const description = (attraction.description || '').toLowerCase();
                                                                    let timeText = 'All Day';
                                                                    let colorClasses = 'bg-gray-50 text-gray-600';

                                                                    if (description.includes('morning')) {
                                                                        timeText = 'Morning';
                                                                        colorClasses = 'bg-amber-50 text-amber-600';
                                                                    } else if (description.includes('afternoon')) {
                                                                        timeText = 'Afternoon';
                                                                        colorClasses = 'bg-sky-50 text-sky-600';
                                                                    } else if (description.includes('evening')) {
                                                                        timeText = 'Evening';
                                                                        colorClasses = 'bg-indigo-50 text-indigo-600';
                                                                    } else if (description.includes('night')) {
                                                                        timeText = 'Night';
                                                                        colorClasses = 'bg-purple-50 text-purple-600';
                                                                    }

                                                                    return (
                                                                        <div className={`px-3 py-1 rounded text-sm font-medium ${colorClasses}`}>
                                                                            {timeText}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        ))}
                                                        {dayAttractions.length === 0 && (
                                                            <div className="p-6 text-[#64748B] text-sm">
                                                                No activities scheduled for this day.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Food & Dining Options Section */}
                                                <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden mt-8">
                                                    <div className="p-6">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Utensils className="w-5 h-5 text-[#F59E0B]" />
                                                            <h3 className="text-[#0F172A] text-lg font-semibold">Food & Dining Options</h3>
                                                        </div>
                                                        <p className="text-[#64748B] text-sm">Recommended restaurants and eateries</p>
                                                    </div>

                                                    <div className="px-6">
                                                        <div className="grid grid-cols-[2fr,1.5fr,2.5fr] text-[#64748B] text-sm font-medium">
                                                            <div className="pb-2">Restaurant</div>
                                                            <div className="pb-2">Cuisine</div>
                                                            <div className="pb-2">Known For</div>
                                                        </div>

                                                        <div className="divide-y divide-[#E2E8F0]">
                                                            {dayFoodOptions.map((food, index) => (
                                                                <div key={food.id || index} className="grid grid-cols-[2fr,1.5fr,2.5fr] py-4">
                                                                    <div className="text-[#0F172A] text-sm font-medium">{food.name}</div>
                                                                    <div className="text-[#64748B] text-sm">{food.cuisine || 'Local Cuisine'}</div>
                                                                    <div className="text-[#64748B] text-sm">{food.description || '-'}</div>
                                                                </div>
                                                            ))}
                                                            {dayFoodOptions.length === 0 && (
                                                                <div className="py-4 text-[#64748B] text-sm">
                                                                    No dining options added for this day.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Notes Section */}
                                                <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden mt-8">
                                                    <div className="p-6">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M6.66667 5H13.3333M6.66667 9.16667H13.3333M6.66667 13.3333H10M17.5 9.16667V14.1667C17.5 15.0871 17.5 15.5474 17.3183 15.9081C17.1586 16.2293 16.8959 16.4919 16.5748 16.6517C16.214 16.8333 15.7537 16.8333 14.8333 16.8333H5.16667C4.24619 16.8333 3.78595 16.8333 3.42515 16.6517C3.10398 16.4919 2.84135 16.2293 2.68162 15.9081C2.5 15.5474 2.5 15.0871 2.5 14.1667V5.83333C2.5 4.91286 2.5 4.45262 2.68162 4.09182C2.84135 3.77065 3.10398 3.50802 3.42515 3.34829C3.78595 3.16667 4.24619 3.16667 5.16667 3.16667H14.8333C15.7537 3.16667 16.214 3.16667 16.5748 3.34829C16.8959 3.50802 17.1586 3.77065 17.3183 4.09182C17.5 4.45262 17.5 4.91286 17.5 5.83333V9.16667Z" stroke="#3B82F6" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                            <h3 className="text-[#0F172A] text-lg font-semibold">Notes</h3>
                                                        </div>
                                                        <p className="text-[#64748B] text-sm mt-4">
                                                            {dayNotes || 'No notes added for this day.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                ))}
                            </div>

                            <div className="lg:sticky lg:top-[72px] h-[calc(100vh-72px)]">
                                <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden border border-[#E2E8F0]" />
                            </div>
                        </div>
                    </Tabs>
                </motion.div>
            </div>

            <style>{`
                .destination-marker {
                    cursor: pointer;
                }
                .destination-popup {
                    max-width: 240px;
                }
                .destination-popup .mapboxgl-popup-content {
                    padding: 0;
                    background: transparent;
                    border: none;
                    box-shadow: none;
                }
                .destination-popup .mapboxgl-popup-tip {
                    display: none;
                }
            `}</style>
        </section>
    );
};

export default ViewMyItinerary; 