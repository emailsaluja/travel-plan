import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Users, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CountryImagesService } from '../services/country-images.service';
import { cleanDestination } from '../utils/stringUtils';
import WorldMap from '../components/WorldMap';

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
            {/* World Map Section */}
            <div className="w-full relative h-[70vh] bg-white">
                <WorldMap
                    visitedCountries={visitedCountries}
                    isEditable={isEditing}
                    onCountryToggle={handleCountryToggle}
                />
                {/* Profile Overlay */}
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
            <div className="max-w-[1400px] mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900">Travel Itineraries</h2>
                    <div className="text-sm text-gray-500">
                        Showing {itineraries.length} {itineraries.length === 1 ? 'trip' : 'trips'}
                    </div>
                </div>

                {itineraries.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <div className="max-w-sm mx-auto">
                            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium">No public itineraries shared yet</p>
                            <p className="text-sm text-gray-500 mt-2">Travel itineraries will appear here once created</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {itineraries.map((itinerary) => (
                            <Link
                                key={itinerary.id}
                                to={`/view-itinerary/${itinerary.id}`}
                                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                            >
                                <div className="relative h-52">
                                    <img
                                        src={selectedImages[itinerary.id] || '/images/empty-state.svg'}
                                        alt={itinerary.trip_name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>
                                <div className="p-5">
                                    <h3 className="font-medium text-lg text-gray-900 mb-3 group-hover:text-[#00C48C] transition-colors">
                                        {itinerary.trip_name}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4 text-[#00C48C]" />
                                            <span>{itinerary.country}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4 text-[#00C48C]" />
                                            <span>{itinerary.duration} days</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-4 h-4 text-[#00C48C]" />
                                            <span>{itinerary.passengers} travelers</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {formatDate(itinerary.start_date)}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
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
        </div>
    );
};

export default UserPublicDashboard; 