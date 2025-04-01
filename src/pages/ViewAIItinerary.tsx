import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, ArrowLeft, Sparkles } from 'lucide-react';
import TopNavigation from '../components/TopNavigation';
import { aiItineraryService, SavedAIItinerary } from '../services/ai-itinerary.service';
import { formatDate } from '../utils/dateUtils';

const ViewAIItinerary: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [itinerary, setItinerary] = useState<SavedAIItinerary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeDestination, setActiveDestination] = useState('');
    const [activeDay, setActiveDay] = useState(1);

    useEffect(() => {
        const loadItinerary = async () => {
            if (!id) return;

            try {
                const data = await aiItineraryService.getItineraryById(id);
                if (data) {
                    setItinerary(data);

                    // Set initial active destination to the first one
                    if (data.generated_itinerary.destinations.length > 0) {
                        setActiveDestination(data.generated_itinerary.destinations[0].name);

                        // Find the first day for this destination
                        const firstDay = getFirstDayForDestination(data.generated_itinerary.destinations[0].name, data);
                        setActiveDay(firstDay);
                    }
                } else {
                    setError('Itinerary not found');
                }
            } catch (err) {
                console.error('Error loading itinerary:', err);
                setError('Failed to load itinerary');
            } finally {
                setLoading(false);
            }
        };

        loadItinerary();
    }, [id]);

    // Helper function to determine which days belong to which destination
    const getDestinationDays = (destinationName: string, itineraryData: SavedAIItinerary) => {
        const destinations = itineraryData.generated_itinerary.destinations;
        let dayStart = 1;

        for (const dest of destinations) {
            const dayEnd = dayStart + dest.nights - 1;
            if (dest.name === destinationName) {
                // Return an array of day numbers for this destination
                return Array.from({ length: dest.nights }, (_, i) => dayStart + i);
            }
            dayStart = dayEnd + 1;
        }

        return [];
    };

    // Helper function to get the first day for a destination
    const getFirstDayForDestination = (destinationName: string, itineraryData: SavedAIItinerary) => {
        const days = getDestinationDays(destinationName, itineraryData);
        return days.length > 0 ? days[0] : 1;
    };

    // Function to find which destination a specific day belongs to
    const getDestinationForDay = (dayNumber: number, itineraryData: SavedAIItinerary) => {
        const destinations = itineraryData.generated_itinerary.destinations;
        let dayCount = 0;

        for (const dest of destinations) {
            dayCount += dest.nights;
            if (dayNumber <= dayCount) {
                return dest.name;
            }
        }

        return destinations[destinations.length - 1]?.name || '';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#00C48C] border-t-transparent"></div>
            </div>
        );
    }

    if (error || !itinerary) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Itinerary Not Found</h1>
                    <p className="text-gray-600 mb-4">The itinerary you're looking for doesn't exist.</p>
                    <button
                        onClick={() => navigate('/dashboard?tab=aiItineraries')}
                        className="text-[#00C48C] hover:text-[#00B380] font-medium"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Get the active destination's image or a default
    const destinationImage = itinerary.generated_itinerary.destinations.find(d => d.name === activeDestination)?.image ||
        'https://images.unsplash.com/photo-1519677100203-a0e668c92439';

    // Get the active destination's description
    const activeDestinationDescription = itinerary.generated_itinerary.destinations.find(d => d.name === activeDestination)?.description || '';

    // Get the activities for the active day
    const activeActivities = itinerary.generated_itinerary.dailyPlans.find(day => day.day === activeDay)?.activities || [];

    // Group activities by time of day
    const morningActivities = activeActivities.filter(a => a.type === 'morning' || parseInt(a.time) < 12);
    const afternoonActivities = activeActivities.filter(a => a.type === 'afternoon' || (parseInt(a.time) >= 12 && parseInt(a.time) < 17));
    const eveningActivities = activeActivities.filter(a => a.type === 'evening' || parseInt(a.time) >= 17);

    return (
        <div className="min-h-screen bg-slate-50">
            <TopNavigation />

            {/* Back button (moved outside and above the hero banner) */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pt-[80px]">
                <button
                    onClick={() => navigate('/dashboard?tab=aiItineraries')}
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Dashboard</span>
                </button>
            </div>

            {/* Hero Banner */}
            <div className="relative w-full h-[400px] overflow-hidden">
                <img
                    src={destinationImage}
                    alt={itinerary.trip_name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 flex flex-col justify-end p-8">
                    <h1 className="text-4xl font-bold text-white mb-2">{itinerary.trip_name}</h1>
                    <p className="text-white/90 text-lg">Last updated: {formatDate(itinerary.created_at)}</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 -mt-8">
                {/* Content Container */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
                    {/* Metadata row */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-full">
                                    <MapPin className="h-4 w-4 text-blue-500" />
                                    <span>{itinerary.country}</span>
                                </div>
                                <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-full">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    <span>{itinerary.duration} days</span>
                                </div>
                                <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-full">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                    <span>Generated {formatDate(itinerary.created_at)}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-medium text-amber-600">AI-Generated</span>
                            </div>
                        </div>
                    </div>

                    {/* Destinations Navigation Bar - Increased width with smaller padding */}
                    <div className="bg-gray-50 border-b border-gray-100 p-4">
                        <div className="flex flex-nowrap gap-2 justify-center overflow-x-auto pb-2">
                            {itinerary.generated_itinerary.destinations.map((dest) => (
                                <button
                                    key={dest.name}
                                    onClick={() => {
                                        setActiveDestination(dest.name);
                                        // Also set the active day to the first day of this destination
                                        const firstDay = getFirstDayForDestination(dest.name, itinerary);
                                        setActiveDay(firstDay);
                                    }}
                                    className={`flex flex-col items-center px-4 py-2 rounded-lg transition-all ${activeDestination === dest.name
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                                        }`}
                                >
                                    <div className="font-medium">{dest.name}</div>
                                    <div className="text-xs flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{dest.nights} nights</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Destination Description */}
                    {activeDestinationDescription && (
                        <div className="bg-blue-50 p-4 border-b border-blue-100">
                            <p className="text-gray-700 text-center">{activeDestinationDescription}</p>
                        </div>
                    )}

                    {/* Day selection for current destination */}
                    <div className="bg-gray-100 p-4 flex flex-wrap gap-2 justify-center">
                        {getDestinationDays(activeDestination, itinerary).map(dayNum => (
                            <button
                                key={dayNum}
                                onClick={() => setActiveDay(dayNum)}
                                className={`px-4 py-2 rounded-full transition-all ${activeDay === dayNum
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Day {dayNum}
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area - Daily plan */}
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-8 text-gray-800">
                            Exploring {activeDestination} - Day {activeDay}
                        </h2>

                        <div className="space-y-6">
                            {/* Morning Section */}
                            {morningActivities.length > 0 && (
                                <div className="ml-2 relative">
                                    {/* Blue dot and vertical line */}
                                    <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-blue-500 -translate-x-1/2"></div>
                                    <div className="absolute left-0 top-4 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2"></div>

                                    {/* Morning heading */}
                                    <h3 className="text-blue-500 font-semibold text-lg ml-4 mb-4">Morning</h3>

                                    {/* Morning activities */}
                                    <div className="space-y-3 ml-4">
                                        {morningActivities.map((activity, idx) => (
                                            <div key={idx} className="bg-blue-50 rounded-md p-4 border-l-4 border-blue-300">
                                                <div className="font-medium text-gray-800 mb-2">{activity.time}</div>
                                                {activity.activity && (
                                                    <div className="font-semibold text-blue-700 mb-1">
                                                        {activity.activity}
                                                    </div>
                                                )}
                                                <div className="text-gray-700">
                                                    {activity.description}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Afternoon Section */}
                            {afternoonActivities.length > 0 && (
                                <div className="ml-2 relative">
                                    {/* Orange dot and vertical line */}
                                    <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-orange-500 -translate-x-1/2"></div>
                                    <div className="absolute left-0 top-4 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2"></div>

                                    {/* Afternoon heading */}
                                    <h3 className="text-orange-500 font-semibold text-lg ml-4 mb-4">Afternoon</h3>

                                    {/* Afternoon activities */}
                                    <div className="space-y-3 ml-4">
                                        {afternoonActivities.map((activity, idx) => (
                                            <div key={idx} className="bg-amber-50 rounded-md p-4 border-l-4 border-amber-300">
                                                <div className="font-medium text-gray-800 mb-2">{activity.time}</div>
                                                {activity.activity && (
                                                    <div className="font-semibold text-amber-700 mb-1">
                                                        {activity.activity}
                                                    </div>
                                                )}
                                                <div className="text-gray-700">
                                                    {activity.description}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Evening Section */}
                            {eveningActivities.length > 0 && (
                                <div className="ml-2 relative">
                                    {/* Purple dot and vertical line */}
                                    <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-purple-500 -translate-x-1/2"></div>
                                    <div className="absolute left-0 top-4 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2"></div>

                                    {/* Evening heading */}
                                    <h3 className="text-purple-500 font-semibold text-lg ml-4 mb-4">Evening</h3>

                                    {/* Evening activities */}
                                    <div className="space-y-3 ml-4">
                                        {eveningActivities.map((activity, idx) => (
                                            <div key={idx} className="bg-purple-50 rounded-md p-4 border-l-4 border-purple-300">
                                                <div className="font-medium text-gray-800 mb-2">{activity.time}</div>
                                                {activity.activity && (
                                                    <div className="font-semibold text-purple-700 mb-1">
                                                        {activity.activity}
                                                    </div>
                                                )}
                                                <div className="text-gray-700">
                                                    {activity.description}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* No activities message */}
                        {activeActivities.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No activities planned for this day.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Destinations Overview (still keeping the cards for reference) */}
                <h2 className="text-2xl font-bold mb-6 text-gray-800">All Destinations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {itinerary.generated_itinerary.destinations.map((dest, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl shadow-md overflow-hidden h-full transform transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                            onClick={() => {
                                setActiveDestination(dest.name);
                                const firstDay = getFirstDayForDestination(dest.name, itinerary);
                                setActiveDay(firstDay);
                                window.scrollTo(0, 0);
                            }}
                        >
                            {dest.image && (
                                <div className="h-44 overflow-hidden">
                                    <img
                                        src={dest.image}
                                        alt={dest.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="p-5">
                                <h3 className="font-bold text-lg text-gray-900 mb-1">{dest.name}</h3>
                                <div className="flex items-center text-sm text-gray-500 mb-3">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span>{dest.nights} nights</span>
                                </div>
                                <p className="text-gray-700">{dest.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ViewAIItinerary; 