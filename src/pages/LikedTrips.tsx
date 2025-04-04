import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserItineraryService } from '../services/user-itinerary.service';
import { Heart, Calendar, MapPin, Users, Clock, ArrowRight, ChevronLeft, ChevronRight, Copy, ExternalLink } from 'lucide-react';
import { CountryImagesService } from '../services/country-images.service';
import { toast } from 'react-hot-toast';
import { cleanDestination } from '../utils/stringUtils';

interface LikedItinerary {
    id: string;
    trip_name: string;
    country: string;
    start_date: string;
    duration: number;
    passengers: number;
    created_at: string;
    liked_at: string;
    destinations: {
        destination: string;
        nights: number;
    }[];
}

interface LikedItineraryResponse {
    itinerary: {
        id: string;
        trip_name: string;
        country: string;
        start_date: string;
        duration: number;
        passengers: number;
        created_at: string;
        destinations: {
            destination: string;
            nights: number;
        }[];
    };
    created_at: string;
}

// Add ScrollableSection component
const ScrollableSection: React.FC<{
    title: string;
    children: React.ReactNode;
}> = ({ title, children }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 600;
            const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => scroll('left')}
                        className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>
            <div className="relative group">
                <div
                    ref={scrollContainerRef}
                    className="overflow-x-auto pb-4 hide-scrollbar"
                >
                    <div className="flex gap-4 min-w-max">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

const LikedTrips: React.FC = () => {
    const [likedTrips, setLikedTrips] = useState<LikedItinerary[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImages, setSelectedImages] = useState<Record<string, string>>({});
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [copying, setCopying] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/signin');
            return;
        }
        loadLikedTrips();
    }, [isAuthenticated, navigate]);

    const loadLikedTrips = async () => {
        try {
            setLoading(true);
            const { data } = await UserItineraryService.getLikedItineraries();
            if (data) {
                // Transform the data to match our interface
                const transformedData = (data as any[]).map(item => ({
                    id: item.id,
                    trip_name: item.trip_name,
                    country: item.country,
                    start_date: item.start_date,
                    duration: item.duration,
                    passengers: item.passengers,
                    created_at: item.created_at,
                    liked_at: item.liked_at,
                    destinations: item.destinations || []
                } as LikedItinerary));

                setLikedTrips(transformedData);

                // Load images for each country
                const imagePromises = transformedData.map(async trip => {
                    if (!trip.country) return '/images/default-country.jpg';
                    try {
                        const images = await CountryImagesService.getCountryImages(trip.country);
                        return images?.[0] || '/images/default-country.jpg';
                    } catch (error) {
                        console.error(`Error loading image for ${trip.country}:`, error);
                        return '/images/default-country.jpg';
                    }
                });

                const imageResults = await Promise.all(imagePromises);
                const newSelectedImages = Object.fromEntries(
                    transformedData.map((trip, index) => [
                        trip.id,
                        imageResults[index]
                    ])
                );
                setSelectedImages(newSelectedImages);
            }
        } catch (error) {
            console.error('Error loading liked trips:', error);
            toast.error('Failed to load liked trips. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    const handleCopyItinerary = async (e: React.MouseEvent, tripId: string) => {
        e.stopPropagation(); // Prevent navigation to view page
        try {
            setCopying(prev => ({ ...prev, [tripId]: true }));
            const { data } = await UserItineraryService.copyItinerary(tripId);
            if (data) {
                toast.success('Itinerary copied successfully! You can find it in your dashboard.');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error copying itinerary:', error);
            toast.error('Failed to copy itinerary. Please try again.');
        } finally {
            setCopying(prev => ({ ...prev, [tripId]: false }));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Liked Trips</h1>
                        <Heart className="w-6 h-6 text-rose-500" fill="currentColor" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                                <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Liked Trips</h1>
                    <Heart className="w-6 h-6 text-rose-500" fill="currentColor" />
                </div>

                {likedTrips.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No liked trips yet</h3>
                        <p className="text-gray-500 mb-4">
                            Start exploring and like trips that inspire you!
                        </p>
                        <button
                            onClick={() => navigate('/discover')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#00C48C] hover:bg-[#00B380]"
                        >
                            Explore Trips
                        </button>
                    </div>
                ) : (
                    <ScrollableSection title="Your Liked Trips">
                        {likedTrips.map((trip) => (
                            <div
                                key={trip.id}
                                className="flex-none w-[300px] bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group relative"
                            >
                                <div className="absolute top-4 right-4 flex gap-2 z-10">
                                    <button
                                        onClick={(e) => handleCopyItinerary(e, trip.id)}
                                        className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 transition-colors shadow-sm"
                                        title="Copy to my itineraries"
                                        disabled={copying[trip.id]}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/viewmyitinerary/${trip.id}`);
                                        }}
                                        className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 transition-colors shadow-sm"
                                        title="View itinerary"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                </div>

                                <div
                                    onClick={() => navigate(`/viewmyitinerary/${trip.id}`)}
                                    className="cursor-pointer"
                                >
                                    <div className="h-40 bg-gray-100 relative">
                                        <img
                                            src={selectedImages[trip.id] || '/images/default-country.jpg'}
                                            alt={`${trip.country} landscape`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <h3 className="text-lg font-semibold text-white mb-2">
                                                {trip.trip_name}
                                            </h3>
                                            <div className="flex items-center text-white/90 text-sm">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                <span>{trip.country}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>{trip.duration} days</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                <span>{trip.passengers}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center text-sm text-gray-500">
                                            <div className="flex items-center gap-1 flex-wrap">
                                                {trip.destinations.map((dest, index) => (
                                                    <React.Fragment key={index}>
                                                        <span>{cleanDestination(dest.destination)}</span>
                                                        {index < trip.destinations.length - 1 && (
                                                            <ArrowRight className="w-3 h-3 mx-1" />
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-3 text-xs text-gray-400">
                                            Liked {formatDate(trip.liked_at)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </ScrollableSection>
                )}
            </div>
        </div>
    );
};

export default LikedTrips; 