import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Users, Search, X, Globe, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CountryImagesService } from '../services/country-images.service';
import { cleanDestination } from '../utils/stringUtils';
import StaticWorldMap from '../components/StaticWorldMap';

// Add country code mapping
const COUNTRY_CODES: { [key: string]: string } = {
    'Afghanistan': 'AF',
    'Albania': 'AL',
    'Algeria': 'DZ',
    'Andorra': 'AD',
    'Angola': 'AO',
    'Argentina': 'AR',
    'Armenia': 'AM',
    'Australia': 'AU',
    'Austria': 'AT',
    'Azerbaijan': 'AZ',
    'Bahamas': 'BS',
    'Bahrain': 'BH',
    'Bangladesh': 'BD',
    'Barbados': 'BB',
    'Belarus': 'BY',
    'Belgium': 'BE',
    'Belize': 'BZ',
    'Bhutan': 'BT',
    'Bolivia': 'BO',
    'Bosnia and Herzegovina': 'BA',
    'Botswana': 'BW',
    'Brazil': 'BR',
    'Brunei': 'BN',
    'Bulgaria': 'BG',
    'Cambodia': 'KH',
    'Cameroon': 'CM',
    'Canada': 'CA',
    'Chile': 'CL',
    'China': 'CN',
    'Colombia': 'CO',
    'Costa Rica': 'CR',
    'Croatia': 'HR',
    'Cuba': 'CU',
    'Cyprus': 'CY',
    'Czech Republic': 'CZ',
    'Denmark': 'DK',
    'Dominican Republic': 'DO',
    'Ecuador': 'EC',
    'Egypt': 'EG',
    'El Salvador': 'SV',
    'Estonia': 'EE',
    'Ethiopia': 'ET',
    'Fiji': 'FJ',
    'Finland': 'FI',
    'France': 'FR',
    'Georgia': 'GE',
    'Germany': 'DE',
    'Ghana': 'GH',
    'Greece': 'GR',
    'Guatemala': 'GT',
    'Haiti': 'HT',
    'Honduras': 'HN',
    'Hungary': 'HU',
    'Iceland': 'IS',
    'India': 'IN',
    'Indonesia': 'ID',
    'Iran': 'IR',
    'Iraq': 'IQ',
    'Ireland': 'IE',
    'Israel': 'IL',
    'Italy': 'IT',
    'Jamaica': 'JM',
    'Japan': 'JP',
    'Jordan': 'JO',
    'Kazakhstan': 'KZ',
    'Kenya': 'KE',
    'Kuwait': 'KW',
    'Kyrgyzstan': 'KG',
    'Laos': 'LA',
    'Latvia': 'LV',
    'Lebanon': 'LB',
    'Libya': 'LY',
    'Liechtenstein': 'LI',
    'Lithuania': 'LT',
    'Luxembourg': 'LU',
    'Madagascar': 'MG',
    'Malaysia': 'MY',
    'Maldives': 'MV',
    'Malta': 'MT',
    'Mexico': 'MX',
    'Monaco': 'MC',
    'Mongolia': 'MN',
    'Montenegro': 'ME',
    'Morocco': 'MA',
    'Myanmar': 'MM',
    'Nepal': 'NP',
    'Netherlands': 'NL',
    'New Zealand': 'NZ',
    'Nicaragua': 'NI',
    'Nigeria': 'NG',
    'North Korea': 'KP',
    'Norway': 'NO',
    'Oman': 'OM',
    'Pakistan': 'PK',
    'Panama': 'PA',
    'Papua New Guinea': 'PG',
    'Paraguay': 'PY',
    'Peru': 'PE',
    'Philippines': 'PH',
    'Poland': 'PL',
    'Portugal': 'PT',
    'Qatar': 'QA',
    'Romania': 'RO',
    'Russia': 'RU',
    'Saudi Arabia': 'SA',
    'Serbia': 'RS',
    'Singapore': 'SG',
    'Slovakia': 'SK',
    'Slovenia': 'SI',
    'South Africa': 'ZA',
    'South Korea': 'KR',
    'Spain': 'ES',
    'Sri Lanka': 'LK',
    'Sweden': 'SE',
    'Switzerland': 'CH',
    'Syria': 'SY',
    'Taiwan': 'TW',
    'Tajikistan': 'TJ',
    'Tanzania': 'TZ',
    'Thailand': 'TH',
    'Tunisia': 'TN',
    'Turkey': 'TR',
    'Turkmenistan': 'TM',
    'Uganda': 'UG',
    'Ukraine': 'UA',
    'United Arab Emirates': 'AE',
    'United Kingdom': 'GB',
    'United States': 'US',
    'Uruguay': 'UY',
    'Uzbekistan': 'UZ',
    'Vatican City': 'VA',
    'Venezuela': 'VE',
    'Vietnam': 'VN',
    'Yemen': 'YE',
    'Zimbabwe': 'ZW'
};

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
    created_at: string;
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
    const [isEditing, setIsEditing] = useState(false);
    const [isCountrySelectOpen, setIsCountrySelectOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Get unique visited countries and their ISO codes
    const visitedCountries = React.useMemo(() => {
        const uniqueCountries = Array.from(new Set(itineraries.map(i => i.country)));
        return uniqueCountries
            .map(country => COUNTRY_CODES[country])
            .filter((code): code is string => !!code);
    }, [itineraries]);

    // Get all countries array
    const allCountries = React.useMemo(() => {
        return Object.entries(COUNTRY_CODES).map(([name, code]) => ({
            name,
            code,
            isVisited: visitedCountries.includes(code)
        }));
    }, [visitedCountries]);

    // Filter countries based on search
    const filteredCountries = React.useMemo(() => {
        if (!searchQuery) {
            // Sort countries with visited ones first
            return [...allCountries].sort((a, b) => {
                if (a.isVisited === b.isVisited) {
                    return a.name.localeCompare(b.name);
                }
                return a.isVisited ? -1 : 1;
            });
        }
        const query = searchQuery.toLowerCase();
        // Filter and sort matching countries with visited ones first
        return allCountries
            .filter(country => country.name.toLowerCase().includes(query))
            .sort((a, b) => {
                if (a.isVisited === b.isVisited) {
                    return a.name.localeCompare(b.name);
                }
                return a.isVisited ? -1 : 1;
            });
    }, [allCountries, searchQuery]);

    const handleCountryToggle = async (countryCode: string, isVisited: boolean) => {
        if (!profile) return;

        try {
            // Find the country name from the code
            const countryName = Object.entries(COUNTRY_CODES).find(([_, code]) => code === countryCode)?.[0];
            if (!countryName) return;

            if (isVisited) {
                // Create a new itinerary for the country with all required fields
                const newItinerary = {
                    trip_name: `Visit to ${countryName}`,
                    country: countryName,
                    start_date: new Date().toISOString(),
                    duration: 1,
                    passengers: 1,
                    is_private: false,
                    user_id: profile.user_id,
                    created_at: new Date().toISOString()
                };

                const { data, error } = await supabase
                    .from('user_itineraries')
                    .insert([newItinerary])
                    .select()
                    .single();

                if (error) {
                    console.error('Error creating itinerary:', error);
                    throw error;
                }

                // Add the empty destinations array for the frontend
                setItineraries(prev => [...prev, { ...data, destinations: [] }]);
            } else {
                // Remove itineraries for this country
                const { error } = await supabase
                    .from('user_itineraries')
                    .delete()
                    .eq('user_id', profile.user_id)
                    .eq('country', countryName);

                if (error) {
                    console.error('Error deleting itinerary:', error);
                    throw error;
                }

                setItineraries(prev => prev.filter(i => i.country !== countryName));
            }
        } catch (error) {
            console.error('Error toggling country:', error);
        }
    };

    useEffect(() => {
        loadUserProfile();
    }, [username]);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get profile data from user_profiles table
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

            // Set profile data directly since all fields are now in user_profiles
            setProfile(profileData);

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
        <div className="min-h-screen bg-[#FAFAFA]">
            {/* Map Section */}
            <div className="w-full relative h-[50vh] bg-white">
                <StaticWorldMap
                    visitedCountries={visitedCountries}
                />
                {/* Profile Card */}
                <div className="absolute bottom-6 right-6 w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="p-5">
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-16 h-16 rounded-full bg-white shadow-sm overflow-hidden ring-2 ring-white">
                                <img
                                    src={profile.profile_picture_url || '/images/profile-icon.svg'}
                                    alt={profile.full_name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl font-medium text-gray-900 tracking-tight truncate mb-2">
                                    {profile.full_name}
                                </h1>
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                        <MapPin className="w-4 h-4 text-[#00C48C]" />
                                        <span className="font-medium">{visitedCountries.length}</span>
                                        <span className="text-gray-500">countries</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                        <Calendar className="w-4 h-4 text-[#00C48C]" />
                                        <span className="font-medium">{itineraries.length}</span>
                                        <span className="text-gray-500">trips</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsCountrySelectOpen(true)}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-100"
                            >
                                Countries
                            </button>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${isEditing
                                    ? 'bg-[#00C48C] text-white hover:bg-[#00B380] shadow-lg shadow-[#00C48C]/20'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'
                                    }`}
                            >
                                {isEditing ? 'Done' : 'Edit Map'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-[1400px] mx-auto px-6">
                {/* Journey in Figures */}
                <div className="-mt-8 relative z-10 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12">
                    <h2 className="text-xl font-semibold text-[#1e293b] mb-6">Journey in Figures</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {/* Countries Visited */}
                        <div className="text-center bg-[#EEF2FF] rounded-2xl p-6">
                            <div className="flex items-center justify-center w-14 h-14 mx-auto bg-[#4B83FB]/10 rounded-2xl mb-4">
                                <svg className="w-7 h-7 text-[#4B83FB]" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M3.6001 9H20.4001" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M3.6001 15H20.4001" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 3C14.0683 5.35774 15.2075 8.27771 15.2001 11.3C15.2075 14.3223 14.0683 17.2423 12 19.6C9.93174 17.2423 8.79253 14.3223 8.8001 11.3C8.79253 8.27771 9.93174 5.35774 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="text-3xl font-bold text-[#4B83FB] mb-1.5">{visitedCountries.length}</div>
                            <div className="text-[15px] text-[#64748b] font-medium">Countries Visited</div>
                        </div>

                        {/* Cities Explored */}
                        <div className="text-center bg-[#FEF9C3] rounded-2xl p-6">
                            <div className="flex items-center justify-center w-14 h-14 mx-auto bg-[#CA8A04]/10 rounded-2xl mb-4">
                                <svg className="w-7 h-7 text-[#CA8A04]" viewBox="0 0 24 24" fill="none">
                                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1116 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="text-3xl font-bold text-[#CA8A04] mb-1.5">
                                {Array.from(new Set(itineraries.flatMap(i =>
                                    i.destinations?.map(d => d.destination) || []
                                ))).length}
                            </div>
                            <div className="text-[15px] text-[#64748b] font-medium">Cities Explored</div>
                        </div>

                        {/* Total Trip Days */}
                        <div className="text-center bg-[#FEE2E2] rounded-2xl p-6">
                            <div className="flex items-center justify-center w-14 h-14 mx-auto bg-[#E11D48]/10 rounded-2xl mb-4">
                                <svg className="w-7 h-7 text-[#E11D48]" viewBox="0 0 24 24" fill="none">
                                    <path d="M8 7V3m8 4V3M3 21h18M3 10h18M3 7v14h18V7H3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="text-3xl font-bold text-[#E11D48] mb-1.5">
                                {itineraries.reduce((total, curr) => total + (curr.duration || 0), 0)}
                            </div>
                            <div className="text-[15px] text-[#64748b] font-medium">Trip Days</div>
                        </div>

                        {/* Average Trip Duration */}
                        <div className="text-center bg-[#DCFCE7] rounded-2xl p-6">
                            <div className="flex items-center justify-center w-14 h-14 mx-auto bg-[#16A34A]/10 rounded-2xl mb-4">
                                <svg className="w-7 h-7 text-[#16A34A]" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="text-3xl font-bold text-[#16A34A] mb-1.5">
                                {Math.round(
                                    itineraries.reduce((acc, curr) => acc + (curr.duration || 0), 0) /
                                    (itineraries.length || 1)
                                )}
                            </div>
                            <div className="text-[15px] text-[#64748b] font-medium">Continents</div>
                        </div>
                    </div>
                </div>

                {/* Travel Itineraries Section */}
                <div className="mb-16">
                    <div className="text-[#00C48C] text-sm font-semibold tracking-wide mb-2">SHARE YOUR ADVENTURES</div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[32px] text-[#1e293b] font-medium">Travel Itineraries</h2>
                        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            Filter By Region
                        </button>
                    </div>
                    <p className="text-[#64748b] text-lg mb-8">
                        Detailed guides from past adventures that you can explore and use for your own journeys.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {itineraries.slice(0, 6).map((itinerary) => (
                            <div
                                key={itinerary.id}
                                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                            >
                                <div className="relative h-64">
                                    <img
                                        src={selectedImages[itinerary.id] || '/images/empty-state.svg'}
                                        alt={itinerary.trip_name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-5 left-5 right-5">
                                        <div className="flex items-center gap-1.5 text-white/90 text-[15px] mb-1.5">
                                            <MapPin className="w-[18px] h-[18px]" />
                                            {itinerary.country}
                                        </div>
                                        <h3 className="text-[22px] font-medium text-white leading-tight">
                                            {itinerary.trip_name}
                                        </h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-2 text-[15px] text-gray-500 mb-4">
                                        <Calendar className="w-[18px] h-[18px] text-[#00C48C]" />
                                        {formatDate(itinerary.start_date)} - {itinerary.duration} days
                                    </div>
                                    <div className="mb-6">
                                        <div className="text-[15px] font-medium text-gray-900 mb-1.5">Highlights:</div>
                                        <div className="text-[15px] text-gray-600">
                                            {itinerary.destinations?.slice(0, 3).map(d => cleanDestination(d.destination)).join(', ')}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Link
                                            to={`/view-itinerary/${itinerary.id}`}
                                            className="flex-1 text-center py-2.5 bg-[#00C48C] text-white text-[15px] font-medium rounded-xl hover:bg-[#00B380] transition-colors"
                                        >
                                            View Itinerary
                                        </Link>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                // Share functionality to be implemented
                                            }}
                                            className="flex-1 text-center py-2.5 bg-gray-50 text-gray-700 text-[15px] font-medium rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                                        >
                                            Share Itinerary
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {itineraries.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                            <div className="max-w-sm mx-auto">
                                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 font-medium">No public itineraries shared yet</p>
                                <p className="text-sm text-gray-500 mt-2">Travel itineraries will appear here once created</p>
                            </div>
                        </div>
                    ) : itineraries.length > 6 && (
                        <div className="mt-8 flex justify-center">
                            <Link
                                to="/itineraries"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F172A] text-white text-[15px] font-medium rounded-xl hover:bg-[#1E293B] transition-colors"
                            >
                                View All Itineraries
                            </Link>
                        </div>
                    )}
                </div>

                {/* Upcoming Adventures Section */}
                <div className="mb-16">
                    <div className="text-[#4B83FB] text-sm font-semibold tracking-wide mb-2">WHAT'S NEXT</div>
                    <h2 className="text-[32px] text-[#1e293b] font-medium mb-3">Upcoming Adventures</h2>
                    <p className="text-[#64748b] text-lg mb-8">
                        Trips I'm planning and preparing for in the near future.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* African Safari Adventure Card */}
                        <div className="bg-[#E6A44E] rounded-2xl overflow-hidden">
                            <div className="relative h-[280px]">
                                <img
                                    src="https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2048&auto=format&fit=crop"
                                    alt="African Safari"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
                                    <div className="bg-white rounded-full px-4 py-2 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-[#00C48C]" />
                                        <span className="text-[15px] font-medium">In 45 days</span>
                                    </div>
                                    <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-[#00C48C]" />
                                        <span className="text-[15px] font-medium">Kenya, Tanzania</span>
                                    </div>
                                </div>
                                <div className="absolute bottom-5 left-5">
                                    <h3 className="text-[28px] font-medium text-white mb-6">African Safari Adventure</h3>
                                    <div className="flex items-center gap-6 text-white/90">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5" />
                                            <span className="text-[15px]">September 10 - September 24, 2023</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-5 h-5" />
                                            <span className="text-[15px]">14 days</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 flex gap-3">
                                <button className="flex-1 py-2.5 bg-white/20 hover:bg-white/30 text-white text-[15px] font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="stroke-current">
                                        <path d="M7 2v2m6 0V2M3 8h14M3 6v9a2 2 0 002 2h10a2 2 0 002-2V6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    View Preparations
                                </button>
                                <button className="flex-1 py-2.5 bg-white text-[#1e293b] text-[15px] font-medium rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Calendar
                                </button>
                            </div>
                        </div>

                        {/* South American Expedition Card */}
                        <div className="bg-[#4B956F] rounded-2xl overflow-hidden">
                            <div className="relative h-[280px]">
                                <img
                                    src="https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=2048&auto=format&fit=crop"
                                    alt="South American Expedition"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
                                    <div className="bg-white rounded-full px-4 py-2 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-[#00C48C]" />
                                        <span className="text-[15px] font-medium">In 148 days</span>
                                    </div>
                                    <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-[#00C48C]" />
                                        <span className="text-[15px] font-medium">Peru, Bolivia, Chile</span>
                                    </div>
                                </div>
                                <div className="absolute bottom-5 left-5">
                                    <h3 className="text-[28px] font-medium text-white mb-6">South American Expedition</h3>
                                    <div className="flex items-center gap-6 text-white/90">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5" />
                                            <span className="text-[15px]">January 5 - January 22, 2024</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-5 h-5" />
                                            <span className="text-[15px]">17 days</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 flex gap-3">
                                <button className="flex-1 py-2.5 bg-white/20 hover:bg-white/30 text-white text-[15px] font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="stroke-current">
                                        <path d="M7 2v2m6 0V2M3 8h14M3 6v9a2 2 0 002 2h10a2 2 0 002-2V6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    View Preparations
                                </button>
                                <button className="flex-1 py-2.5 bg-white text-[#1e293b] text-[15px] font-medium rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Calendar
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <button className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-xl border border-gray-200 text-[15px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            <svg className="w-5 h-5 text-[#00C48C]" viewBox="0 0 24 24" fill="none">
                                <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Plan a New Trip
                        </button>
                    </div>
                </div>

                {/* Premium Itineraries Section */}
                <div className="relative -mx-[calc(50vw-50%)] px-6 py-16 bg-[rgb(248,245,255)]">
                    <div className="max-w-[1400px] mx-auto">
                        <div className="text-[#C2410C] text-sm font-semibold tracking-wide mb-2">CRAFTED WITH CARE</div>
                        <h2 className="text-[32px] text-[#1e293b] font-medium mb-3">Premium Itineraries</h2>
                        <p className="text-[#64748b] text-lg mb-8">
                            Detailed travel guides with insider tips, restaurant recommendations, and custom maps.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Ultimate Japan Guide */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
                                <div className="relative w-[45%] overflow-hidden">
                                    <img
                                        src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1000&auto=format&fit=crop"
                                        alt="Japan Temple"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <div className="px-3 py-1.5 bg-[#EAB308] text-white text-[13px] font-medium rounded-full">
                                            $29.99
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 p-6">
                                    <h3 className="text-[22px] font-medium text-[#1e293b] mb-3">Ultimate Japan Guide</h3>
                                    <p className="text-[#64748b] text-[15px] mb-6">
                                        Complete 2-week itinerary with insider tips, restaurant reservations, and hidden spots.
                                    </p>
                                    <div className="bg-[#F8FAFC] rounded-xl p-4 mb-6">
                                        <div className="text-[15px] font-medium text-[#1e293b] mb-3">What's included:</div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-[15px] text-[#64748b]">
                                                <svg className="w-[18px] h-[18px] text-[#00C48C]" viewBox="0 0 24 24" fill="none">
                                                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                PDF Guide
                                            </div>
                                            <div className="flex items-center gap-2 text-[15px] text-[#64748b]">
                                                <svg className="w-[18px] h-[18px] text-[#00C48C]" viewBox="0 0 24 24" fill="none">
                                                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Interactive Map
                                            </div>
                                            <div className="flex items-center gap-2 text-[15px] text-[#64748b]">
                                                <svg className="w-[18px] h-[18px] text-[#00C48C]" viewBox="0 0 24 24" fill="none">
                                                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Restaurant List
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C2410C] text-white text-[15px] font-medium rounded-xl hover:bg-[#B23A0B] transition-colors">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Purchase Guide
                                        </button>
                                        <div className="flex items-center gap-1 text-[#64748b] text-[15px]">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M4 8h16M4 8V7a3 3 0 013-3h10a3 3 0 013 3v1M4 8v8m16-8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                            124 sold
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bali Honeymoon Package */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
                                <div className="relative w-[45%] overflow-hidden">
                                    <img
                                        src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1000&auto=format&fit=crop"
                                        alt="Bali Temple"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <div className="px-3 py-1.5 bg-[#EAB308] text-white text-[13px] font-medium rounded-full">
                                            $39.99
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 p-6">
                                    <h3 className="text-[22px] font-medium text-[#1e293b] mb-3">Bali Honeymoon Package</h3>
                                    <p className="text-[#64748b] text-[15px] mb-6">
                                        Romantic 10-day itinerary with luxury accommodations and private experiences.
                                    </p>
                                    <div className="bg-[#F8FAFC] rounded-xl p-4 mb-6">
                                        <div className="text-[15px] font-medium text-[#1e293b] mb-3">What's included:</div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-[15px] text-[#64748b]">
                                                <svg className="w-[18px] h-[18px] text-[#00C48C]" viewBox="0 0 24 24" fill="none">
                                                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                PDF Guide
                                            </div>
                                            <div className="flex items-center gap-2 text-[15px] text-[#64748b]">
                                                <svg className="w-[18px] h-[18px] text-[#00C48C]" viewBox="0 0 24 24" fill="none">
                                                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Hotel Recommendations
                                            </div>
                                            <div className="flex items-center gap-2 text-[15px] text-[#64748b]">
                                                <svg className="w-[18px] h-[18px] text-[#00C48C]" viewBox="0 0 24 24" fill="none">
                                                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Activity Bookings
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C2410C] text-white text-[15px] font-medium rounded-xl hover:bg-[#B23A0B] transition-colors">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Purchase Guide
                                        </button>
                                        <div className="flex items-center gap-1 text-[#64748b] text-[15px]">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M4 8h16M4 8V7a3 3 0 013-3h10a3 3 0 013 3v1M4 8v8m16-8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                            87 sold
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-center">
                            <button className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-xl border border-gray-200 text-[15px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                <svg className="w-5 h-5 text-[#C2410C]" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                Create a Premium Guide
                            </button>
                        </div>
                    </div>
                </div>

                {/* Travel Blog Section */}
                <div className="mb-16">
                    <h2 className="text-[32px] text-[#1e293b] font-medium mb-3">Travel Blog</h2>
                    <p className="text-[#64748b] text-lg mb-8">
                        Stories, insights, and reflections from journeys around the world.
                    </p>

                    <div className="flex items-center gap-3 mb-8">
                        <button className="px-4 py-2 bg-[#F8FAFC] text-[#1e293b] text-[15px] font-medium rounded-full">All</button>
                        <button className="px-4 py-2 text-[#64748b] text-[15px] font-medium rounded-full hover:bg-[#F8FAFC] transition-colors">Tips</button>
                        <button className="px-4 py-2 text-[#64748b] text-[15px] font-medium rounded-full hover:bg-[#F8FAFC] transition-colors">Guides</button>
                        <button className="px-4 py-2 text-[#64748b] text-[15px] font-medium rounded-full hover:bg-[#F8FAFC] transition-colors">Stories</button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8">
                        {/* Main Blog Post */}
                        <Link to="/blog/slow-travel" className="group">
                            <div className="relative h-[400px] rounded-2xl overflow-hidden mb-6">
                                <img
                                    src="https://images.unsplash.com/photo-1499346030926-9a72daac6c63?q=80&w=2048&auto=format&fit=crop"
                                    alt="Cinque Terre"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                <div className="absolute top-6 left-6">
                                    <span className="px-3 py-1.5 bg-[#3B82F6] text-white text-[13px] font-medium rounded-full">
                                        Editor's Pick
                                    </span>
                                </div>
                            </div>
                            <h3 className="text-[28px] font-medium text-[#1e293b] mb-4 group-hover:text-[#00C48C] transition-colors">
                                A Year of Slow Travel: What I Learned Living Like a Local
                            </h3>
                            <p className="text-[#64748b] text-[17px] mb-5">
                                After spending a full year living in different cities around the world, I've gained insights into how slow travel can transform your experience and connection with a place.
                            </p>
                            <div className="flex items-center gap-6 text-[15px] text-[#64748b]">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-[18px] h-[18px] text-[#00C48C]" />
                                    August 12, 2023
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-[18px] h-[18px] text-[#00C48C]" />
                                    15 min read
                                </div>
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="w-[18px] h-[18px] text-[#00C48C]" />
                                    32 comments
                                </div>
                            </div>
                        </Link>

                        {/* Side Blog Posts */}
                        <div className="space-y-6">
                            {/* Hidden Gems of Paris */}
                            <Link to="/blog/paris-gems" className="flex gap-5 group">
                                <div className="relative w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                                    <img
                                        src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1000&auto=format&fit=crop"
                                        alt="Paris"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <div className="flex-1 py-2">
                                    <div className="text-[#4B83FB] text-[13px] font-semibold mb-2">City Guides</div>
                                    <h3 className="text-[17px] font-medium text-[#1e293b] mb-2 group-hover:text-[#00C48C] transition-colors">
                                        Hidden Gems of Paris
                                    </h3>
                                    <p className="text-[#64748b] text-[15px] line-clamp-2 mb-3">
                                        Discover the lesser-known spots that most tourists miss...
                                    </p>
                                    <div className="flex items-center justify-between text-[13px]">
                                        <div className="text-[#64748b]">8 min read</div>
                                        <div className="flex items-center gap-1 text-[#94A3B8]">
                                            <MessageCircle className="w-4 h-4" />
                                            24
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            {/* Budget Travel Europe */}
                            <Link to="/blog/budget-europe" className="flex gap-5 group">
                                <div className="relative w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                                    <img
                                        src="https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?q=80&w=1000&auto=format&fit=crop"
                                        alt="Amsterdam"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <div className="flex-1 py-2">
                                    <div className="text-[#4B83FB] text-[13px] font-semibold mb-2">Budget Travel</div>
                                    <h3 className="text-[17px] font-medium text-[#1e293b] mb-2 group-hover:text-[#00C48C] transition-colors">
                                        Budget Travel: Europe on $50/day
                                    </h3>
                                    <p className="text-[#64748b] text-[15px] line-clamp-2 mb-3">
                                        How I explored 5 European countries without breaking the bank...
                                    </p>
                                    <div className="flex items-center justify-between text-[13px]">
                                        <div className="text-[#64748b]">12 min read</div>
                                        <div className="flex items-center gap-1 text-[#94A3B8]">
                                            <MessageCircle className="w-4 h-4" />
                                            37
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            {/* Solo Female Travel */}
                            <Link to="/blog/solo-female-travel" className="flex gap-5 group">
                                <div className="relative w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                                    <img
                                        src="https://images.unsplash.com/photo-1580766777561-87a8f85dd2dd?q=80&w=1000&auto=format&fit=crop"
                                        alt="Solo Travel"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <div className="flex-1 py-2">
                                    <div className="text-[#4B83FB] text-[13px] font-semibold mb-2">Travel Tips</div>
                                    <h3 className="text-[17px] font-medium text-[#1e293b] mb-2 group-hover:text-[#00C48C] transition-colors">
                                        Solo Female Travel Safety Tips
                                    </h3>
                                    <p className="text-[#64748b] text-[15px] line-clamp-2 mb-3">
                                        Essential advice for women traveling alone based on my experience...
                                    </p>
                                    <div className="flex items-center justify-between text-[13px]">
                                        <div className="text-[#64748b]">10 min read</div>
                                        <div className="flex items-center gap-1 text-[#94A3B8]">
                                            <MessageCircle className="w-4 h-4" />
                                            45
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <Link
                            to="/blog"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F172A] text-white text-[15px] font-medium rounded-xl hover:bg-[#1E293B] transition-colors"
                        >
                            View All Blog Posts
                        </Link>
                    </div>
                </div>

                {/* Follow My Journey Section */}
                <div className="mb-16">
                    <div className="text-[#4B83FB] text-sm font-semibold tracking-wide mb-2">CONNECT WITH ME</div>
                    <h2 className="text-[32px] text-[#1e293b] font-medium mb-3">Follow My Journey</h2>
                    <p className="text-[#64748b] text-lg mb-8">
                        Connect with me on social media for more travel content and behind-the-scenes footage.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* YouTube Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#FF0000]/10 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-[#FF0000]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-[#1e293b] text-lg font-medium mb-1">YouTube</div>
                                    <div className="text-[#64748b] text-[15px]">@TravelWithAlex</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="text-[#1e293b] text-lg font-medium mb-1">24.5K</div>
                                    <div className="text-[#64748b] text-[13px]">Subscribers</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[#1e293b] text-lg font-medium mb-1">78</div>
                                    <div className="text-[#64748b] text-[13px]">Videos</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[#1e293b] text-lg font-medium mb-1">1.2M</div>
                                    <div className="text-[#64748b] text-[13px]">Views</div>
                                </div>
                            </div>
                            <div className="relative aspect-video rounded-xl overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1000&auto=format&fit=crop"
                                    alt="Thailand Beaches"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <div className="text-white">
                                        <div className="text-sm font-medium mb-1">14:22</div>
                                        <div className="text-lg font-medium mb-1">Top 10 Hidden Beaches in Thailand</div>
                                        <div className="text-sm">45K views</div>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full py-2.5 bg-[#FF0000] text-white text-[15px] font-medium rounded-xl hover:bg-[#E50000] transition-colors">
                                Subscribe to Channel
                            </button>
                        </div>

                        {/* Instagram Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF3366] via-[#FF00FF] to-[#FF9933] p-[2px]">
                                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M12 7a5 5 0 100 10 5 5 0 000-10zm-3 5a3 3 0 106 0 3 3 0 00-6 0z" fill="url(#instagram-gradient)" />
                                            <path fillRule="evenodd" clipRule="evenodd" d="M17 2H7a5 5 0 00-5 5v10a5 5 0 005 5h10a5 5 0 005-5V7a5 5 0 00-5-5zm3 15a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3h10a3 3 0 013 3v10z" fill="url(#instagram-gradient)" />
                                            <circle cx="17.5" cy="6.5" r="1.5" fill="url(#instagram-gradient)" />
                                            <defs>
                                                <linearGradient id="instagram-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                                                    <stop stopColor="#FF3366" />
                                                    <stop offset="0.5" stopColor="#FF00FF" />
                                                    <stop offset="1" stopColor="#FF9933" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[#1e293b] text-lg font-medium mb-1">Instagram</div>
                                    <div className="text-[#64748b] text-[15px]">@alex_travels</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="text-[#1e293b] text-lg font-medium mb-1">42.8K</div>
                                    <div className="text-[#64748b] text-[13px]">Followers</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[#1e293b] text-lg font-medium mb-1">342</div>
                                    <div className="text-[#64748b] text-[13px]">Posts</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[#1e293b] text-lg font-medium mb-1">Santorini</div>
                                    <div className="text-[#64748b] text-[13px]">Featured</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="aspect-square rounded-xl overflow-hidden">
                                    <img
                                        src="https://images.unsplash.com/photo-1580237072617-771c3ecc4a24?q=80&w=1000&auto=format&fit=crop"
                                        alt="Bali Temple"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="aspect-square rounded-xl overflow-hidden">
                                    <img
                                        src="https://images.unsplash.com/photo-1522083165195-3424ed129620?q=80&w=1000&auto=format&fit=crop"
                                        alt="Santorini"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="aspect-square rounded-xl overflow-hidden">
                                    <img
                                        src="https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=1000&auto=format&fit=crop"
                                        alt="Japan Street"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="aspect-square rounded-xl overflow-hidden">
                                    <img
                                        src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1000&auto=format&fit=crop"
                                        alt="Paris"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            <button className="w-full py-2.5 bg-gradient-to-r from-[#FF3366] via-[#FF00FF] to-[#FF9933] text-white text-[15px] font-medium rounded-xl hover:opacity-90 transition-opacity">
                                Follow on Instagram
                            </button>
                        </div>
                    </div>
                </div>

                {/* Country Selection Modal */}
                {isCountrySelectOpen && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col animate-in fade-in duration-200">
                            <div className="p-5 border-b border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-medium text-gray-900">Select Countries</h2>
                                    <button
                                        onClick={() => setIsCountrySelectOpen(false)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search countries..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                            <div className="overflow-y-auto flex-1 p-5">
                                <div className="grid grid-cols-1 gap-2">
                                    {filteredCountries.map((country) => (
                                        <button
                                            key={country.code}
                                            onClick={() => handleCountryToggle(country.code, !country.isVisited)}
                                            className={`flex items-center justify-between p-3 rounded-xl transition-all ${country.isVisited
                                                ? 'bg-[#00C48C]/5 text-[#00C48C] hover:bg-[#00C48C]/10'
                                                : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className="font-medium">{country.name}</span>
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${country.isVisited
                                                ? 'bg-[#00C48C] text-white'
                                                : 'border-2 border-gray-200'
                                                }`}>
                                                {country.isVisited && (
                                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Start Your Own Travel Journey Section */}
                <div className="relative -mx-[calc(50vw-50%)] px-6 py-24 bg-[#4B83FB] text-center">
                    <div className="max-w-[700px] mx-auto">
                        <div className="w-20 h-20 rounded-full bg-white/20 mx-auto mb-8 flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h2 className="text-[40px] font-medium text-white mb-4">Start Your Own Travel Journey</h2>
                        <p className="text-white/90 text-lg mb-8">
                            Create an account to document your own adventures, plan future trips, and connect with fellow travelers.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1e293b] text-[15px] font-medium rounded-xl hover:bg-white/90 transition-colors">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Create Your Travel Profile
                            </button>
                            <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#4B83FB] text-white text-[15px] font-medium rounded-xl border border-white/20 hover:bg-[#4B83FB]/90 transition-colors">
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserPublicDashboard; 