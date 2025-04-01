import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Search } from 'lucide-react';
import { cleanDestination } from '../utils/stringUtils';
import { supabase } from '../lib/supabase';
import { CountryImagesService } from '../services/country-images.service';

type RegionKey = 'all' | 'asia' | 'europe' | 'namerica' | 'samerica' | 'africa' | 'oceania' | 'other';

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

const REGIONS: Record<RegionKey, string> = {
    all: 'All Regions',
    asia: 'Asia',
    europe: 'Europe',
    namerica: 'North America',
    samerica: 'South America',
    africa: 'Africa',
    oceania: 'Oceania',
    other: 'Other Regions'
};

const getRegionForCountry = (country: string): RegionKey => {
    const asianCountries = ['China', 'Japan', 'Thailand', 'Vietnam', 'India', 'Singapore', 'Malaysia', 'Indonesia', 'Philippines', 'South Korea'];
    const europeanCountries = ['France', 'Italy', 'Spain', 'Germany', 'United Kingdom', 'Greece', 'Netherlands', 'Switzerland'];
    const northAmericanCountries = ['United States', 'Canada', 'Mexico'];
    const southAmericanCountries = ['Brazil', 'Argentina', 'Peru', 'Colombia', 'Chile'];
    const africanCountries = ['South Africa', 'Egypt', 'Morocco', 'Kenya', 'Tanzania'];
    const oceaniaCountries = ['Australia', 'New Zealand', 'Fiji'];

    if (asianCountries.includes(country)) return 'asia';
    if (europeanCountries.includes(country)) return 'europe';
    if (northAmericanCountries.includes(country)) return 'namerica';
    if (southAmericanCountries.includes(country)) return 'samerica';
    if (africanCountries.includes(country)) return 'africa';
    if (oceaniaCountries.includes(country)) return 'oceania';
    return 'other';
};

const AllItineraries = () => {
    const { username } = useParams<{ username: string }>();
    const [selectedRegion, setSelectedRegion] = useState<RegionKey>('all');
    const [isRegionFilterOpen, setIsRegionFilterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'duration' | 'name'>('date');
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [loading, setLoading] = useState(true);
    const [countryImages, setCountryImages] = useState<{ [key: string]: string[] }>({});
    const [selectedImages, setSelectedImages] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        loadItineraries();
    }, []);

    const loadItineraries = async () => {
        try {
            setLoading(true);

            console.log('Starting to fetch itineraries...'); // Debug log

            // Get all public itineraries with their destinations
            const { data: itinerariesData, error: itinerariesError } = await supabase
                .from('user_itineraries')
                .select(`
                    id,
                    trip_name,
                    country,
                    start_date,
                    duration,
                    passengers,
                    created_at,
                    user_id,
                    is_private,
                    destinations:user_itinerary_destinations(
                        destination,
                        nights
                    )
                `)
                .eq('is_private', false)
                .order('created_at', { ascending: false });

            console.log('Raw data from Supabase:', itinerariesData); // Debug log

            if (itinerariesError) {
                console.error('Error loading itineraries:', itinerariesError);
                return;
            }

            if (!itinerariesData || itinerariesData.length === 0) {
                console.log('No itineraries found in the database'); // Debug log
                setLoading(false);
                return;
            }

            // Transform the data to match our interface
            const transformedItineraries = (itinerariesData || []).map(itinerary => {
                console.log('Processing itinerary:', itinerary); // Debug log for each itinerary
                return {
                    id: itinerary.id,
                    trip_name: itinerary.trip_name,
                    country: itinerary.country,
                    start_date: itinerary.start_date,
                    duration: itinerary.duration,
                    passengers: itinerary.passengers,
                    created_at: itinerary.created_at,
                    destinations: itinerary.destinations || []
                };
            });

            console.log('Transformed itineraries:', transformedItineraries); // Debug log

            setItineraries(transformedItineraries);

            // Fetch country images
            const countries = Array.from(new Set(transformedItineraries.map(i => i.country)));
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
            transformedItineraries.forEach(itinerary => {
                const countryImageList = images[itinerary.country] || [];
                if (countryImageList.length > 0) {
                    const randomIndex = Math.floor(Math.random() * countryImageList.length);
                    selected[itinerary.id] = countryImageList[randomIndex];
                }
            });

            setSelectedImages(selected);

        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAndSortedItineraries = useMemo(() => {
        let filtered = itineraries;

        // Apply region filter
        if (selectedRegion !== 'all') {
            filtered = filtered.filter(itinerary => getRegionForCountry(itinerary.country) === selectedRegion);
        }

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(itinerary =>
                itinerary.trip_name.toLowerCase().includes(query) ||
                itinerary.country.toLowerCase().includes(query) ||
                itinerary.destinations.some(d => d.destination.toLowerCase().includes(query))
            );
        }

        // Apply sorting
        return [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
                case 'duration':
                    return b.duration - a.duration;
                case 'name':
                    return a.trip_name.localeCompare(b.trip_name);
                default:
                    return 0;
            }
        });
    }, [itineraries, selectedRegion, searchQuery, sortBy]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] py-12">
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="mb-8">
                    <h1 className="text-[32px] text-[#1e293b] font-medium mb-3">All Travel Itineraries</h1>
                    <p className="text-[#64748b] text-lg">
                        Explore detailed travel guides and itineraries from around the world.
                    </p>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,auto] gap-4 items-center">
                        {/* Search */}
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search itineraries..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Region Filter */}
                        <div className="relative">
                            <button
                                onClick={() => setIsRegionFilterOpen(!isRegionFilterOpen)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-w-[160px]"
                            >
                                <MapPin className="w-4 h-4 text-[#00C48C]" />
                                {REGIONS[selectedRegion]}
                            </button>

                            {isRegionFilterOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                                    {Object.entries(REGIONS).map(([key, value]) => (
                                        <button
                                            key={key}
                                            onClick={() => {
                                                setSelectedRegion(key as RegionKey);
                                                setIsRegionFilterOpen(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left text-sm transition-colors ${selectedRegion === key
                                                ? 'bg-[#00C48C]/5 text-[#00C48C]'
                                                : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {value}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sort By */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'date' | 'duration' | 'name')}
                            className="px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors appearance-none min-w-[160px]"
                        >
                            <option value="date">Sort by Date</option>
                            <option value="duration">Sort by Duration</option>
                            <option value="name">Sort by Name</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C48C] border-t-transparent"></div>
                    </div>
                ) : (
                    <>
                        {/* Itineraries Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredAndSortedItineraries.map((itinerary) => (
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
                                            <button className="flex-1 text-center py-2.5 bg-gray-50 text-gray-700 text-[15px] font-medium rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                                Share
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty State */}
                        {filteredAndSortedItineraries.length === 0 && !loading && (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                                <div className="max-w-sm mx-auto">
                                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium">No itineraries found</p>
                                    <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or search query</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AllItineraries; 