import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CountryImagesService } from '../services/country-images.service';

interface UserProfile {
    username: string;
    full_name: string;
    measurement_system: string;
    privacy_setting: string;
    hero_banner_url?: string;
    profile_picture_url?: string;
    user_id: string;
}

interface Itinerary {
    id: string;
    trip_name: string;
    country: string;
    start_date: string;
    duration: number;
    passengers: number;
    destinations: {
        destination: string;
        nights: number;
    }[];
}

const UserPublicDashboard = () => {
    const { username } = useParams<{ username: string }>();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [countryImages, setCountryImages] = useState<{ [key: string]: string[] }>({});
    const [selectedImages, setSelectedImages] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        loadUserProfile();
    }, [username]);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            // First check if the profile exists using the public schema
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('username', username)
                .maybeSingle();

            if (profileError) {
                console.error('Profile fetch error:', profileError);
                setError('Error loading profile');
                return;
            }

            if (!profileData) {
                setError('Profile not found');
                return;
            }

            // Fetch user settings to get profile picture and hero banner
            const { data: userSettings, error: settingsError } = await supabase
                .from('user_settings')
                .select('profile_picture_url, hero_banner_url')
                .eq('user_id', profileData.user_id)
                .maybeSingle();

            if (settingsError) {
                console.error('Settings fetch error:', settingsError);
            }

            // Combine profile data with user settings
            setProfile({
                ...profileData,
                profile_picture_url: userSettings?.profile_picture_url || null,
                hero_banner_url: userSettings?.hero_banner_url || null
            });

            // Get public itineraries using the public schema
            const { data: itinerariesData, error: itinerariesError } = await supabase
                .from('user_itineraries')
                .select(`
                    *,
                    destinations:user_itinerary_destinations(
                        destination,
                        nights
                    )
                `)
                .eq('user_id', profileData.user_id)
                .eq('is_private', false)
                .order('created_at', { ascending: false });

            if (itinerariesError) {
                console.error('Itineraries fetch error:', itinerariesError);
                return;
            }

            // Transform the data to match our interface
            const transformedItineraries = (itinerariesData || []).map(itinerary => ({
                ...itinerary,
                destinations: itinerary.destinations || []
            }));

            setItineraries(transformedItineraries);

        } catch (error: any) {
            console.error('Error loading profile:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Add effect to fetch country images
    useEffect(() => {
        const fetchCountryImages = async () => {
            const countries = Array.from(new Set(itineraries.map(i => i.country)));
            const images: Record<string, string[]> = {};

            for (const country of countries) {
                try {
                    const imageUrls = await CountryImagesService.getCountryImages(country);
                    if (imageUrls && imageUrls.length > 0) {
                        images[country] = imageUrls;
                    }
                } catch (error) {
                    console.error(`Error fetching images for ${country}:`, error);
                }
            }

            setCountryImages(images);

            // Assign random images for each itinerary
            const selected: Record<string, string> = {};
            itineraries.forEach(itinerary => {
                const countryImageList = images[itinerary.country] || [];
                if (countryImageList.length > 0) {
                    const randomIndex = Math.floor(Math.random() * countryImageList.length);
                    selected[itinerary.id] = countryImageList[randomIndex];
                }
            });

            setSelectedImages(selected);
        };

        if (itineraries.length > 0) {
            fetchCountryImages();
        }
    }, [itineraries]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C48C] border-t-transparent"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h1>
                    <p className="text-gray-600">The user profile you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Banner */}
            <div className="h-[300px] relative">
                {profile.hero_banner_url ? (
                    <div className="absolute inset-0">
                        <img
                            src={profile.hero_banner_url}
                            alt="Hero Banner"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00C48C] to-[#00B380]">
                        <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                )}
                <div className="max-w-[1400px] mx-auto px-4 h-full flex items-end pb-8 relative">
                    <div className="flex items-end gap-6">
                        <div className="w-32 h-32 rounded-xl bg-white shadow-lg overflow-hidden">
                            <img
                                src={profile.profile_picture_url || '/images/profile-icon.svg'}
                                alt={profile.full_name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="mb-4 text-white">
                            <h1 className="text-3xl font-bold mb-2">{profile.full_name}</h1>
                            <p className="text-white/90 mb-2">@{profile.username}</p>
                            {itineraries.length > 0 && (
                                <div className="flex items-center gap-2 text-white/80">
                                    <MapPin className="w-4 h-4" />
                                    <p className="text-sm">
                                        {Array.from(new Set(itineraries.map(itinerary => itinerary.country))).join(', ')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1400px] mx-auto px-4 py-12">
                <h2 className="text-2xl font-bold text-[#1e293b] mb-8">Travel Itineraries</h2>

                {itineraries.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <p className="text-gray-600">No public itineraries shared yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {itineraries.map((itinerary) => (
                            <Link
                                key={itinerary.id}
                                to={`/view-itinerary/${itinerary.id}`}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                                <div className="relative h-48 bg-gray-100">
                                    {selectedImages[itinerary.id] ? (
                                        <img
                                            src={selectedImages[itinerary.id]}
                                            alt={itinerary.country}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[#00C48C] to-[#00B380]" />
                                    )}
                                    <div className="absolute inset-0 bg-black/20"></div>
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                                        <h3 className="text-xl font-semibold text-white mb-1">
                                            {itinerary.trip_name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-white/90">
                                            <MapPin className="w-4 h-4" />
                                            <span>{itinerary.country}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="text-lg font-medium text-[#1e293b] mb-4">
                                        {itinerary.trip_name}
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <MapPin className="w-4 h-4 text-[#00C48C]" />
                                            <span>{itinerary.country}</span>
                                        </div>
                                        {itinerary.destinations && itinerary.destinations.length > 0 && (
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <span className="text-sm italic">
                                                    Visiting: {itinerary.destinations.map(d =>
                                                        d.destination.split(',')[0].trim()
                                                    ).join(' → ')}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="w-4 h-4 text-[#00C48C]" />
                                                <span>{formatDate(itinerary.start_date)}</span>
                                            </div>
                                            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Clock className="w-4 h-4 text-[#00C48C]" />
                                                <span>{itinerary.duration} days</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Users className="w-4 h-4 text-[#00C48C]" />
                                            <span>{itinerary.passengers} travelers</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserPublicDashboard; 