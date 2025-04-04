import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserItineraryService } from '../services/user-itinerary.service';
import { CountryImagesService } from '../services/country-images.service';
import ItineraryTile from '../components/ItineraryTile';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cleanDestination } from '../utils/stringUtils';
import { supabase } from '../lib/supabase';

// Country-specific information
const countryInfo: Record<string, {
    bestSeasons: string[];
    seasonDescription: string;
    famousFor: string[];
    attractions: string[];
    food: string[];
    travelTips: string[];
}> = {
    'New Zealand': {
        bestSeasons: ['🌸 Spring: September - November', '🍁 Fall: March - May'],
        seasonDescription: 'Perfect weather for outdoor activities and scenic views',
        famousFor: [
            '🏔️ Natural Landscapes',
            '🎬 Movie Locations',
            '🥝 Local Cuisine',
            '🚶‍♂️ Hiking Trails'
        ],
        attractions: [
            '⛰️ Mount Cook National Park',
            '🌊 Milford Sound',
            '🏰 Hobbiton Movie Set',
            '🌋 Rotorua Geothermal Area',
            '🚡 Queenstown Skyline'
        ],
        food: [
            '🍖 Hangi (Traditional Maori feast)',
            '🥝 Fresh Kiwifruit',
            '🦪 Bluff Oysters',
            '🥧 Meat Pies',
            '🍦 Hokey Pokey Ice Cream'
        ],
        travelTips: [
            '🚗 Rent a car for flexibility',
            '🎫 Book activities in advance',
            '🌧️ Pack for all weather',
            '📱 Get a local SIM card'
        ]
    },
    'Japan': {
        bestSeasons: ['🌸 Spring: March - May', '🍁 Fall: October - December'],
        seasonDescription: 'Cherry blossoms in spring, vibrant foliage in fall',
        famousFor: [
            '⛩️ Historic Temples',
            '🚅 Bullet Trains',
            '🍜 Unique Cuisine',
            '🗼 Modern Cities'
        ],
        attractions: [
            '⛩️ Fushimi Inari Shrine',
            '🗻 Mount Fuji',
            '🏯 Osaka Castle',
            '🍱 Tsukiji Fish Market',
            '🎋 Arashiyama Bamboo Grove'
        ],
        food: [
            '🍜 Ramen',
            '🍣 Fresh Sushi',
            '🍱 Bento Boxes',
            '🍵 Matcha Tea',
            '🍡 Mochi Desserts'
        ],
        travelTips: [
            '🚅 Get a JR Pass',
            '📱 Rent a pocket WiFi',
            '💳 Carry cash',
            '🎫 Book temples in advance'
        ]
    },
    'Fiji': {
        bestSeasons: ['🌞 Dry Season: May - October', '🌴 Shoulder Season: November - April'],
        seasonDescription: 'Dry season offers perfect beach weather and clear waters for diving',
        famousFor: [
            '🏖️ Pristine Beaches',
            '🤿 Coral Reefs',
            '🌺 Island Culture',
            '🌊 Water Sports'
        ],
        attractions: [
            '🏝️ Mamanuca Islands',
            '🐠 Great Astrolabe Reef',
            '🌺 Garden of the Sleeping Giant',
            '🏊‍♂️ Blue Lagoon',
            '🗿 Tavuni Hill Fort'
        ],
        food: [
            '🐟 Kokoda (Raw Fish in Coconut)',
            '🥥 Lovo (Earth Oven Feast)',
            '🍖 Duruka (Fijian Asparagus)',
            '🥘 Taro & Cassava',
            '🥭 Tropical Fruits'
        ],
        travelTips: [
            '🏨 Book resorts in advance',
            '🚤 Plan island hopping',
            '🧴 Pack reef-safe sunscreen',
            '🌧️ Check weather forecasts'
        ]
    },
    'Thailand': {
        bestSeasons: ['🌞 Cool Season: November - February', '🌸 Shoulder Season: March - May'],
        seasonDescription: 'Cool season offers comfortable temperatures and minimal rain',
        famousFor: [
            '🏖️ Tropical Beaches',
            '🍜 Street Food',
            '⛩️ Ancient Temples',
            '🎉 Vibrant Nightlife'
        ],
        attractions: [
            '🏯 Grand Palace Bangkok',
            '🏖️ Phi Phi Islands',
            '🐘 Elephant Nature Park',
            '⛩️ Wat Arun',
            '🌆 Khao San Road'
        ],
        food: [
            '🍜 Pad Thai',
            '🥘 Tom Yum Goong',
            '🥭 Mango Sticky Rice',
            '🍖 Satay',
            '🥗 Som Tam'
        ],
        travelTips: [
            '👕 Dress modestly at temples',
            '💧 Drink bottled water',
            '🛵 Use ride-hailing apps',
            '🏷️ Learn basic bargaining'
        ]
    },
    'Vietnam': {
        bestSeasons: ['🍂 Fall: September - December', '🌸 Spring: March - April'],
        seasonDescription: 'Fall and spring offer mild temperatures and less rainfall',
        famousFor: [
            '🏔️ Rice Terraces',
            '🚣 Ha Long Bay',
            '🍜 Street Food Culture',
            '🏛️ Historical Sites'
        ],
        attractions: [
            '🚣 Ha Long Bay',
            '🏙️ Hoi An Ancient Town',
            '🏔️ Sapa Rice Terraces',
            '🕌 Notre Dame Cathedral',
            '🏰 Imperial City Hue'
        ],
        food: [
            '🍜 Pho',
            '🥖 Banh Mi',
            '🥘 Bun Cha',
            '☕ Vietnamese Coffee',
            '🥗 Fresh Spring Rolls'
        ],
        travelTips: [
            '🛵 Be careful crossing streets',
            '💵 Carry small bills',
            '🚌 Book sleeper buses ahead',
            '☔ Pack rain gear'
        ]
    },
    'Indonesia': {
        bestSeasons: ['🌞 Dry Season: April - October', '🌺 Shoulder Season: March & November'],
        seasonDescription: 'Dry season is perfect for beach activities and temple visits',
        famousFor: [
            '🏖️ Tropical Paradise',
            '🏊‍♂️ Diving Spots',
            '🛕 Ancient Temples',
            '🌋 Volcanoes'
        ],
        attractions: [
            '🛕 Borobudur Temple',
            '🏖️ Bali Beaches',
            '🌋 Mount Bromo',
            '🦎 Komodo Island',
            '🌺 Ubud Monkey Forest'
        ],
        food: [
            '🍛 Nasi Goreng',
            '🥘 Rendang',
            '🍖 Satay',
            '🥜 Gado Gado',
            '🍜 Mie Goreng'
        ],
        travelTips: [
            '🚕 Use reliable taxi apps',
            '🛵 Rent scooters carefully',
            '💧 Drink bottled water',
            '🦟 Use mosquito repellent'
        ]
    }
    // You can continue adding more countries as needed
};

// Default country information for countries not in the mapping
const defaultCountryInfo = {
    bestSeasons: ['🌞 Summer: June - August', '🍂 Fall: September - November'],
    seasonDescription: 'Comfortable weather for sightseeing and outdoor activities',
    famousFor: [
        '🏛️ Cultural Sites',
        '🍴 Local Cuisine',
        '🎨 Art & History',
        '🌳 Natural Beauty'
    ],
    attractions: [
        '🏛️ Historic Sites',
        '🏰 Famous Landmarks',
        '🌳 Natural Wonders',
        '🏺 Museums',
        '🎨 Cultural Centers'
    ],
    food: [
        '🍽️ Traditional Dishes',
        '🥘 Local Specialties',
        '🍷 Regional Drinks',
        '🍰 Local Desserts',
        '🥗 Fresh Local Produce'
    ],
    travelTips: [
        '📅 Plan ahead',
        '🎫 Book in advance',
        '📱 Download offline maps',
        '💳 Check payment methods'
    ]
};

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
    tags?: string[];
}

const ScrollableSection: React.FC<{
    title: string;
    children: React.ReactNode;
}> = ({ title, children }): JSX.Element => {
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
            <div className="relative group">
                <div
                    ref={scrollContainerRef}
                    className="overflow-x-auto pb-4 hide-scrollbar"
                >
                    <div className="flex gap-4 min-w-max">
                        {children}
                    </div>
                </div>

                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -translate-x-1/2 z-10"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>

                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-x-1/2 z-10"
                >
                    <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
            </div>
        </div>
    );
};

const Discover: React.FC = () => {
    const { country: urlCountry } = useParams<{ country?: string }>();
    const navigate = useNavigate();
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [loading, setLoading] = useState(true);
    const [countryImages, setCountryImages] = useState<Record<string, string[]>>({});
    const [selectedImages, setSelectedImages] = useState<Record<string, string>>({});
    const [sectionAssignments, setSectionAssignments] = useState<Record<string, string[]>>({});
    const [activeSeason, setActiveSeason] = useState('Spring');
    const [topTravellers, setTopTravellers] = useState<any[]>([]);

    // Group itineraries by country
    const countryStats = React.useMemo(() => {
        const stats: Record<string, { count: number; itineraries: Itinerary[] }> = {};
        itineraries.forEach(itinerary => {
            if (!stats[itinerary.country]) {
                stats[itinerary.country] = { count: 0, itineraries: [] };
            }
            stats[itinerary.country].count += 1;
            stats[itinerary.country].itineraries.push(itinerary);
        });
        return stats;
    }, [itineraries]);

    useEffect(() => {
        loadItineraries();
    }, []);

    useEffect(() => {
        loadSectionAssignments();
    }, []);

    const loadSectionAssignments = async () => {
        try {
            const { data, error } = await supabase
                .from('discover_section_assignments')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;

            // Group assignments by section
            const assignmentsBySection = data.reduce((acc, assignment) => {
                if (!acc[assignment.section_name]) {
                    acc[assignment.section_name] = [];
                }
                acc[assignment.section_name].push(assignment.itinerary_id);
                return acc;
            }, {} as Record<string, string[]>);

            setSectionAssignments(assignmentsBySection);
        } catch (error) {
            console.error('Error loading section assignments:', error);
        }
    };

    // Fetch country images
    useEffect(() => {
        const fetchCountryImages = async () => {
            if (!itineraries.length) return;

            const countries = Object.keys(countryStats);
            if (!countries.length) return;

            try {
                console.log('Fetching images for countries:', countries);
                const images = await CountryImagesService.getAllCountryImages();
                setCountryImages(images);

                const selected: Record<string, string> = {};

                // Select hero images for countries (prioritize high-quality images)
                Object.keys(countryStats).forEach(country => {
                    try {
                        const countryImageList = images[country] || [];
                        if (countryImageList.length > 0) {
                            // For hero images, always use the first (highest quality) image
                            const imageUrl = new URL(countryImageList[0]);
                            if (imageUrl.hostname.includes('supabase.co')) {
                                imageUrl.searchParams.set('quality', '100');
                                imageUrl.searchParams.set('width', '1920');
                            }
                            selected[country] = imageUrl.toString();
                        } else {
                            const defaultImages = images['default'] || [];
                            const randomDefaultIndex = Math.floor(Math.random() * defaultImages.length);
                            selected[country] = defaultImages[randomDefaultIndex];
                        }
                    } catch (error) {
                        console.error(`Error processing hero image for ${country}:`, error);
                        selected[country] = '/images/empty-state.svg';
                    }
                });

                // Select images for itineraries with different sizes based on section
                itineraries.forEach(itinerary => {
                    try {
                        const countryImageList = images[itinerary.country] || [];
                        if (countryImageList.length > 0) {
                            const randomIndex = Math.floor(Math.random() * countryImageList.length);
                            const imageUrl = new URL(countryImageList[randomIndex]);

                            if (imageUrl.hostname.includes('supabase.co')) {
                                // Use higher quality and larger size for Featured Destinations
                                if (sectionAssignments['Featured Destinations']?.includes(itinerary.id)) {
                                    imageUrl.searchParams.set('quality', '95');
                                    imageUrl.searchParams.set('width', '1200');
                                    imageUrl.searchParams.set('height', '800');
                                } else {
                                    // Standard size for other sections
                                    imageUrl.searchParams.set('quality', '90');
                                    imageUrl.searchParams.set('width', '800');
                                }
                            }
                            selected[itinerary.id] = imageUrl.toString();
                        } else {
                            const defaultImages = images['default'] || [];
                            const randomDefaultIndex = Math.floor(Math.random() * defaultImages.length);
                            selected[itinerary.id] = defaultImages[randomDefaultIndex];
                        }
                    } catch (error) {
                        console.error(`Error processing itinerary image for ${itinerary.id}:`, error);
                        selected[itinerary.id] = '/images/empty-state.svg';
                    }
                });

                console.log('Setting selected images:', selected);
                setSelectedImages(selected);
            } catch (error) {
                console.error('Error fetching country images:', error);
                const selected: Record<string, string> = {};
                Object.keys(countryStats).forEach(country => {
                    selected[country] = '/images/empty-state.svg';
                });
                itineraries.forEach(itinerary => {
                    selected[itinerary.id] = '/images/empty-state.svg';
                });
                setSelectedImages(selected);
            }
        };

        fetchCountryImages();
    }, [itineraries, countryStats, sectionAssignments]);

    const loadItineraries = async () => {
        try {
            const { data: allItineraries } = await UserItineraryService.getAllPublicItineraries();
            setItineraries(allItineraries || []);
        } catch (error) {
            // Handle error silently
        } finally {
            setLoading(false);
        }
    };

    const handleCountryClick = (country: string) => {
        navigate(`/discover/${encodeURIComponent(country.toLowerCase())}`);
    };

    // Add this function to load top travellers
    const loadTopTravellers = async () => {
        try {
            // First get all itineraries grouped by user_id
            const { data: itineraryData, error: itineraryError } = await supabase
                .from('user_itineraries')
                .select('user_id, country, created_at')
                .order('created_at', { ascending: false });

            if (itineraryError) throw itineraryError;

            // Group itineraries by user and calculate stats
            const userStats = itineraryData.reduce((acc: any, itinerary: any) => {
                const userId = itinerary.user_id;
                if (!acc[userId]) {
                    acc[userId] = {
                        user_id: userId,
                        countries: new Set(),
                        lastMonthTrips: 0,
                        totalTrips: 0
                    };
                }

                acc[userId].countries.add(itinerary.country);
                acc[userId].totalTrips++;

                // Check if itinerary was created in the last month
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                if (new Date(itinerary.created_at) >= lastMonth) {
                    acc[userId].lastMonthTrips++;
                }

                return acc;
            }, {});

            // Get top 3 users by total trips
            const topUserIds = Object.entries(userStats)
                .sort(([, a]: any, [, b]: any) => b.totalTrips - a.totalTrips)
                .slice(0, 3)
                .map(([userId]) => userId);

            console.log('Top user IDs:', topUserIds);

            // Fetch user details for top users
            const { data: userData, error: userError } = await supabase
                .from('user_profiles')
                .select('user_id, full_name, profile_picture_url, bio')
                .in('user_id', topUserIds);

            if (userError) throw userError;

            console.log('User profiles data:', userData);

            if (!userData || userData.length === 0) {
                console.warn('No user profiles found for top travellers');
                return;
            }

            // Combine user data with their stats
            const processedTravellers = userData.map((user: any) => ({
                ...user,
                ...userStats[user.user_id],
                avatar_url: user.profile_picture_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user_id}`,
                countriesVisited: Array.from(userStats[user.user_id].countries)
            }));

            console.log('Processed travellers:', processedTravellers);
            setTopTravellers(processedTravellers);
        } catch (error) {
            console.error('Error loading top travellers:', error);
        }
    };

    useEffect(() => {
        loadTopTravellers();
    }, []);

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackUrl: string = '/images/empty-state.svg') => {
        const target = e.target as HTMLImageElement;
        console.warn(`Failed to load image: ${target.src}`);
        target.src = fallbackUrl;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white pt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // If we're on a country-specific page
    if (urlCountry) {
        // Decode the URL and normalize the country name
        const decodedCountry = decodeURIComponent(urlCountry);
        const normalizedUrlCountry = decodedCountry
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        const countryData = countryStats[normalizedUrlCountry];

        if (!countryData) {
            return (
                <div className="min-h-screen bg-white pt-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <button
                            onClick={() => navigate('/discover')}
                            className="mb-8 text-[#00C48C] hover:text-[#00B380] flex items-center gap-2"
                        >
                            ← Back to Discover
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 mb-8">Country Not Found</h1>
                        <p className="text-gray-600">No itineraries found for {normalizedUrlCountry}.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-white pt-16">
                <button
                    onClick={() => navigate('/discover')}
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 block"
                >
                    ← Back to Discover
                </button>
                <div className="relative overflow-hidden mb-8">
                    <div className="relative h-[400px] w-full">
                        <img
                            src={selectedImages[normalizedUrlCountry] || '/images/empty-state.svg'}
                            alt={normalizedUrlCountry}
                            className="absolute inset-0 w-full h-full object-cover object-center"
                            style={{
                                imageRendering: 'crisp-edges',
                                maxWidth: '100%',
                                maxHeight: '100%'
                            }}
                            onError={(e) => handleImageError(e)}
                            loading="eager"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60"></div>
                        <div className="absolute inset-0 flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                                Discover {normalizedUrlCountry}
                            </h1>
                            <p className="text-xl text-white opacity-90 drop-shadow-md">
                                {countryData.count} itineraries to explore
                            </p>
                        </div>
                    </div>
                </div>

                {/* Trip Details Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 shadow-sm">
                        <h3 className="text-lg font-semibold mb-3">Trip Details</h3>
                        <div className="space-y-4">
                            {/* Country Overview */}
                            <div className="pb-4 border-b border-gray-200">
                                <p className="text-gray-600 leading-relaxed">
                                    {normalizedUrlCountry === 'New Zealand' ? (
                                        <>
                                            <span className="font-bold">New Zealand</span>, a breathtaking paradise in the South Pacific, is renowned for its <span className="italic">stunning natural landscapes</span> featured in "<span className="font-semibold">The Lord of the Rings</span>" films. This diverse country offers everything from <span className="font-semibold">pristine beaches to snow-capped mountains, glaciers, and lush rainforests</span>. Adventure seekers flock here for <span className="italic">hiking, skiing, bungee jumping, and white-water rafting</span>, while culture enthusiasts explore the <span className="font-semibold">rich Maori heritage</span>. The <span className="font-semibold">best time to visit</span> is during <span className="italic">summer (December-February)</span> for outdoor activities or <span className="italic">spring (September-November)</span> for mild weather and beautiful blooms. The country's unique ecosystem hosts distinctive wildlife like the <span className="font-semibold">kiwi bird</span>, and its culinary scene blends Pacific Rim flavors with fresh local ingredients, famous for its <span className="italic">lamb, seafood, and world-class wines</span>. The friendly locals, known as <span className="font-semibold">Kiwis</span>, are known for their warm hospitality and laid-back lifestyle.
                                        </>
                                    ) : normalizedUrlCountry === 'Japan' ? (
                                        <>
                                            <span className="font-bold">Japan</span> seamlessly blends <span className="font-semibold">ancient traditions with cutting-edge modernity</span>. From <span className="italic">serene temples and historic castles to neon-lit cityscapes and bullet trains</span>, it offers a unique cultural experience. <span className="font-semibold">Cherry blossom season (March-April)</span> draws visitors worldwide, while <span className="font-semibold">autumn (October-November)</span> showcases spectacular fall colors. The country is celebrated for its <span className="italic">distinctive cuisine</span>, including sushi, ramen, and kaiseki dining, as well as its <span className="font-semibold">innovative technology, anime culture, and traditional arts</span> like tea ceremonies and kabuki theater. <span className="font-semibold">Japanese hospitality (omotenashi)</span> and attention to detail are legendary. Visitors can experience everything from <span className="italic">peaceful Zen gardens and hot spring onsens to bustling shopping districts and robot restaurants</span>, making it a fascinating destination for all interests.
                                        </>
                                    ) : (
                                        <>
                                            This <span className="font-bold">beautiful country</span> offers a unique blend of <span className="font-semibold">cultural experiences, natural wonders, and unforgettable adventures</span>. Visitors can explore its <span className="italic">diverse landscapes</span>, immerse themselves in <span className="italic">local traditions</span>, and enjoy <span className="font-semibold">distinctive cuisine</span> while creating lasting memories.
                                        </>
                                    )}
                                </p>
                            </div>

                            {/* Basic Info */}
                            <div className="flex justify-between items-center pb-3 border-b border-gray-200 text-sm">
                                <div>
                                    <p className="font-medium">Total Itineraries</p>
                                    <p className="text-gray-600">{countryData.count} trips</p>
                                </div>
                                <div>
                                    <p className="font-medium">Average Duration</p>
                                    <p className="text-gray-600">
                                        {Math.round(
                                            countryData.itineraries.reduce((acc, curr) => acc + curr.duration, 0) /
                                            countryData.itineraries.length
                                        )} days
                                    </p>
                                </div>
                                <div>
                                    <p className="font-medium">Popular Cities</p>
                                    <p className="text-gray-600">{Array.from(new Set(countryData.itineraries.flatMap(i => i.destinations.map(d => d.destination)))).length} destinations</p>
                                </div>
                            </div>

                            {/* Extended Trip Info */}
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <h4 className="font-medium mb-1.5">Best Time to Visit</h4>
                                    <div className="space-y-0.5 text-gray-600">
                                        {(countryInfo[normalizedUrlCountry] || defaultCountryInfo).bestSeasons.map(season => (
                                            <p key={season}>{season}</p>
                                        ))}
                                        <p className="text-xs text-gray-500 mt-1">
                                            {(countryInfo[normalizedUrlCountry] || defaultCountryInfo).seasonDescription}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-1.5">Famous For</h4>
                                    <div className="space-y-0.5 text-gray-600">
                                        {(countryInfo[normalizedUrlCountry] || defaultCountryInfo).famousFor.map(item => (
                                            <p key={item}>{item}</p>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-1.5">Must-Visit Attractions</h4>
                                    <div className="space-y-0.5 text-gray-600">
                                        {(countryInfo[normalizedUrlCountry] || defaultCountryInfo).attractions.map(attraction => (
                                            <p key={attraction}>{attraction}</p>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-1.5">Food & Dining</h4>
                                    <div className="space-y-0.5 text-gray-600">
                                        {(countryInfo[normalizedUrlCountry] || defaultCountryInfo).food.map(food => (
                                            <p key={food}>{food}</p>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-1.5">Travel Tips</h4>
                                    <div className="space-y-0.5 text-gray-600">
                                        {(countryInfo[normalizedUrlCountry] || defaultCountryInfo).travelTips.map(tip => (
                                            <p key={tip}>{tip}</p>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-1.5">Popular Cities</h4>
                                    <div className="space-y-0.5 text-gray-600">
                                        {Array.from(new Set(countryData.itineraries.flatMap(i =>
                                            i.destinations.map(d => cleanDestination(d.destination))
                                        )))
                                            .slice(0, 5)
                                            .map(city => (
                                                <p key={city}>📍 {city}</p>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {countryData.itineraries.map((itinerary) => (
                            <div
                                key={itinerary.id}
                                onClick={() => navigate(`/viewmyitinerary/${itinerary.id}`)}
                                className="cursor-pointer"
                            >
                                <ItineraryTile
                                    id={itinerary.id}
                                    title={itinerary.trip_name}
                                    description={`${itinerary.duration} days in ${itinerary.destinations
                                        .map(d => cleanDestination(d.destination))
                                        .join(', ')}`}
                                    imageUrl={selectedImages[itinerary.id] || '/images/empty-state.svg'}
                                    duration={itinerary.duration}
                                    cities={itinerary.destinations.map(d =>
                                        cleanDestination(d.destination)
                                    )}
                                    createdAt={itinerary.created_at}
                                    loading="lazy"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Main discover page with country grid
    return (
        <div className="container mx-auto px-4 pt-24 pb-8">
            {/* Header Section */}
            <div className="text-center mb-12">
                <h1 className="text-5xl font-bold mb-4">
                    Discover the world's<br />
                    <span className="text-[#0096FF]">extraordinary</span> places
                </h1>
                <p className="text-gray-600 mb-8">
                    Carefully curated destinations and experiences that will transform the way you see the world.
                </p>
                <div className="max-w-2xl mx-auto relative">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Where would you like to go?"
                            className="w-full px-6 py-4 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0096FF] focus:border-transparent pl-12"
                        />
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#71717A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M21 21L16.65 16.65" stroke="#71717A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                        <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#0096FF] text-white px-8 py-2 rounded-full hover:bg-[#0077CC] transition-colors">
                            Search
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Countries Section */}
                <ScrollableSection title="Explore these Countries">
                    {Object.entries(countryStats).map(([country, { count }]) => (
                        <div
                            key={country}
                            onClick={() => handleCountryClick(country)}
                            className="relative overflow-hidden rounded-lg cursor-pointer transform transition-transform hover:scale-[1.02] shadow-md w-[280px]"
                        >
                            <div className="relative pb-[133.34%]">
                                <img
                                    src={selectedImages[country] || '/images/empty-state.svg'}
                                    alt={country}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => handleImageError(e)}
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60"></div>
                                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                                    <div className="text-white">
                                        <h3 className="text-lg font-semibold">{country}</h3>
                                        <p className="text-sm opacity-90">{count} itineraries</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </ScrollableSection>

                {/* Featured Destinations Section */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold mb-8">Featured Destinations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {itineraries
                            .filter(itinerary => sectionAssignments['Featured Destinations']?.includes(itinerary.id))
                            .map((itinerary) => (
                                <div
                                    key={itinerary.id}
                                    onClick={() => navigate(`/viewmyitinerary/${itinerary.id}`)}
                                    className="relative group cursor-pointer rounded-xl overflow-hidden"
                                >
                                    <div className="relative aspect-[4/3]">
                                        <img
                                            src={selectedImages[itinerary.id] || '/images/empty-state.svg'}
                                            alt={itinerary.trip_name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => handleImageError(e)}
                                        />
                                        {/* Like button */}
                                        <button className="absolute top-4 right-4 bg-white/90 p-2 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="2" fill="none" />
                                            </svg>
                                        </button>
                                        {/* Gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/60"></div>
                                        {/* Content overlay */}
                                        <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                                            <div>
                                                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm mb-2">
                                                    {itinerary.tags?.[0] || 'Featured'}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">{itinerary.trip_name}</h3>
                                                <p className="text-white/90 text-sm mb-2">
                                                    {itinerary.destinations.map(d => cleanDestination(d.destination)).join(', ')}
                                                </p>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span>{itinerary.duration} days</span>
                                                    <span className="text-white/60">•</span>
                                                    <div className="flex items-center">
                                                        <span className="text-yellow-400">★</span>
                                                        <span className="ml-1">4.8</span>
                                                        <span className="text-white/60 ml-1">(987)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Trending Destinations Section */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Trending Destinations</h2>
                        <button
                            onClick={() => navigate('/itineraries?section=trending')}
                            className="text-[#0096FF] hover:text-[#0077CC] font-medium"
                        >
                            View all →
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {itineraries
                            .filter(itinerary => sectionAssignments['Trending Destinations']?.includes(itinerary.id))
                            .slice(0, 4)
                            .map((itinerary) => (
                                <div
                                    key={itinerary.id}
                                    onClick={() => navigate(`/viewmyitinerary/${itinerary.id}`)}
                                    className="rounded-lg overflow-hidden shadow-md group cursor-pointer"
                                >
                                    <div className="relative">
                                        <img
                                            src={selectedImages[itinerary.id] || '/images/empty-state.svg'}
                                            alt={itinerary.trip_name}
                                            className="w-full h-[200px] object-cover"
                                            onError={(e) => handleImageError(e)}
                                        />
                                        <div className="absolute top-3 left-3 bg-white rounded-full px-2 py-1 flex items-center gap-1">
                                            <span className="text-yellow-400">★</span>
                                            <span className="font-medium">4.8</span>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60"></div>
                                        <div className="absolute bottom-0 left-0 right-0 p-4">
                                            <h3 className="text-white font-semibold text-lg">{itinerary.trip_name}</h3>
                                            <p className="text-white/90 text-sm">{itinerary.country}</p>
                                            <p className="text-white/80 text-xs mt-1">
                                                {itinerary.destinations.map(d => cleanDestination(d.destination)).join(', ')}
                                            </p>
                                            <p className="text-white/90 text-sm mt-1">{itinerary.duration} days</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Unique Experiences Section */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Unique Experiences</h2>
                        <button
                            onClick={() => navigate('/itineraries?section=unique')}
                            className="text-[#0096FF] hover:text-[#0077CC] font-medium"
                        >
                            View all →
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {itineraries
                            .filter(itinerary => sectionAssignments['Unique Experiences']?.includes(itinerary.id))
                            .map((itinerary) => (
                                <div
                                    key={itinerary.id}
                                    onClick={() => navigate(`/viewmyitinerary/${itinerary.id}`)}
                                    className="cursor-pointer"
                                >
                                    <ItineraryTile
                                        id={itinerary.id}
                                        title={itinerary.trip_name}
                                        description={`${itinerary.duration} days in ${itinerary.destinations
                                            .map(d => cleanDestination(d.destination))
                                            .join(', ')}`}
                                        imageUrl={selectedImages[itinerary.id] || '/images/empty-state.svg'}
                                        duration={itinerary.duration}
                                        cities={itinerary.destinations.map(d =>
                                            cleanDestination(d.destination)
                                        )}
                                        createdAt={itinerary.created_at}
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                    </div>
                </div>

                {/* Seasonal Highlights Section */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Seasonal Highlights</h2>
                    <p className="text-gray-600 mb-6">Find the perfect destination based on when you want to travel</p>

                    {/* Season Tabs */}
                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={() => setActiveSeason('Spring')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-full ${activeSeason === 'Spring' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <span>🌸</span>
                            Spring
                        </button>
                        <button
                            onClick={() => setActiveSeason('Summer')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-full ${activeSeason === 'Summer' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <span>☀️</span>
                            Summer
                        </button>
                        <button
                            onClick={() => setActiveSeason('Autumn')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-full ${activeSeason === 'Autumn' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <span>🍂</span>
                            Autumn
                        </button>
                        <button
                            onClick={() => setActiveSeason('Winter')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-full ${activeSeason === 'Winter' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <span>❄️</span>
                            Winter
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {itineraries
                            .filter(itinerary => sectionAssignments[activeSeason]?.includes(itinerary.id))
                            .map((itinerary) => (
                                <div
                                    key={itinerary.id}
                                    onClick={() => navigate(`/viewmyitinerary/${itinerary.id}`)}
                                    className="cursor-pointer"
                                >
                                    <ItineraryTile
                                        id={itinerary.id}
                                        title={itinerary.trip_name}
                                        description={`${itinerary.duration} days in ${itinerary.destinations
                                            .map(d => cleanDestination(d.destination))
                                            .join(', ')}`}
                                        imageUrl={selectedImages[itinerary.id] || '/images/empty-state.svg'}
                                        duration={itinerary.duration}
                                        cities={itinerary.destinations.map(d =>
                                            cleanDestination(d.destination)
                                        )}
                                        createdAt={itinerary.created_at}
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                    </div>
                </div>

                {/* Travel Mood Boards Section */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Travel Mood Boards</h2>
                    <p className="text-gray-600 mb-6">Visual inspiration for your next adventure based on the atmosphere you seek</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tropical Escape Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">Tropical Escape</h3>
                                    <p className="text-gray-600">White sandy beaches, crystal clear waters, and palm trees</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-gray-50 rounded-full">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="2" fill="none" />
                                        </svg>
                                    </button>
                                    <button className="p-2 hover:bg-gray-50 rounded-full">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" stroke="currentColor" strokeWidth="2" fill="none" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {itineraries
                                    .filter(itinerary => sectionAssignments['Tropical Escape']?.includes(itinerary.id))
                                    .slice(0, 4)
                                    .map((itinerary) => (
                                        <div
                                            key={itinerary.id}
                                            onClick={() => navigate(`/viewmyitinerary/${itinerary.id}`)}
                                            className="aspect-[4/3] rounded-lg overflow-hidden cursor-pointer"
                                        >
                                            <img
                                                src={selectedImages[itinerary.id] || '/images/empty-state.svg'}
                                                alt={itinerary.trip_name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Perfect for:</span>
                                    <div className="flex gap-2">
                                        {Array.from(new Set(
                                            itineraries
                                                .filter(itinerary => sectionAssignments['Tropical Escape']?.includes(itinerary.id))
                                                .map(itinerary => itinerary.country)
                                        ))
                                            .filter(Boolean)
                                            .slice(0, 3)
                                            .map((country, index, array) => (
                                                <React.Fragment key={country}>
                                                    <span className="text-[#0096FF] hover:underline cursor-pointer">{country}</span>
                                                    {index < array.length - 1 && <span className="text-gray-300">•</span>}
                                                </React.Fragment>
                                            ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>📅</span>
                                    <span className="text-gray-600">Best time: Year-round</span>
                                </div>
                                <button
                                    onClick={() => navigate('/itineraries?section=tropical')}
                                    className="w-full py-2 border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    See All Tropical Itineraries
                                    <span>→</span>
                                </button>
                            </div>
                        </div>

                        {/* Mountain Retreat Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">Mountain Retreat</h3>
                                    <p className="text-gray-600">Breathtaking peaks, alpine meadows, and cozy cabins</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-gray-50 rounded-full">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="2" fill="none" />
                                        </svg>
                                    </button>
                                    <button className="p-2 hover:bg-gray-50 rounded-full">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" stroke="currentColor" strokeWidth="2" fill="none" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {itineraries
                                    .filter(itinerary => sectionAssignments['Mountain Retreat']?.includes(itinerary.id))
                                    .slice(0, 4)
                                    .map((itinerary) => (
                                        <div
                                            key={itinerary.id}
                                            onClick={() => navigate(`/viewmyitinerary/${itinerary.id}`)}
                                            className="aspect-[4/3] rounded-lg overflow-hidden cursor-pointer"
                                        >
                                            <img
                                                src={selectedImages[itinerary.id] || '/images/empty-state.svg'}
                                                alt={itinerary.trip_name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Perfect for:</span>
                                    <div className="flex gap-2">
                                        {Array.from(new Set(
                                            itineraries
                                                .filter(itinerary => sectionAssignments['Mountain Retreat']?.includes(itinerary.id))
                                                .map(itinerary => itinerary.country)
                                        ))
                                            .filter(Boolean)
                                            .slice(0, 3)
                                            .map((country, index, array) => (
                                                <React.Fragment key={country}>
                                                    <span className="text-[#0096FF] hover:underline cursor-pointer">{country}</span>
                                                    {index < array.length - 1 && <span className="text-gray-300">•</span>}
                                                </React.Fragment>
                                            ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>📅</span>
                                    <span className="text-gray-600">Best time: Spring to Fall</span>
                                </div>
                                <button
                                    onClick={() => navigate('/itineraries?section=mountain')}
                                    className="w-full py-2 border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    See All Mountain Itineraries
                                    <span>→</span>
                                </button>
                            </div>
                        </div>

                        {/* Urban Adventure Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">Urban Adventure</h3>
                                    <p className="text-gray-600">Vibrant city life, iconic architecture, and cultural hotspots</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-gray-50 rounded-full">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="2" fill="none" />
                                        </svg>
                                    </button>
                                    <button className="p-2 hover:bg-gray-50 rounded-full">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" stroke="currentColor" strokeWidth="2" fill="none" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {itineraries
                                    .filter(itinerary => sectionAssignments['Urban Adventure']?.includes(itinerary.id))
                                    .slice(0, 4)
                                    .map((itinerary) => (
                                        <div
                                            key={itinerary.id}
                                            onClick={() => navigate(`/viewmyitinerary/${itinerary.id}`)}
                                            className="aspect-[4/3] rounded-lg overflow-hidden cursor-pointer"
                                        >
                                            <img
                                                src={selectedImages[itinerary.id] || '/images/empty-state.svg'}
                                                alt={itinerary.trip_name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Perfect for:</span>
                                    <div className="flex gap-2">
                                        {Array.from(new Set(
                                            itineraries
                                                .filter(itinerary => sectionAssignments['Urban Adventure']?.includes(itinerary.id))
                                                .map(itinerary => itinerary.country)
                                        ))
                                            .filter(Boolean)
                                            .slice(0, 3)
                                            .map((country, index, array) => (
                                                <React.Fragment key={country}>
                                                    <span className="text-[#0096FF] hover:underline cursor-pointer">{country}</span>
                                                    {index < array.length - 1 && <span className="text-gray-300">•</span>}
                                                </React.Fragment>
                                            ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>📅</span>
                                    <span className="text-gray-600">Best time: Year-round</span>
                                </div>
                                <button
                                    onClick={() => navigate('/itineraries?section=urban')}
                                    className="w-full py-2 border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    See All Urban Itineraries
                                    <span>→</span>
                                </button>
                            </div>
                        </div>

                        {/* Historical Journey Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">Historical Journey</h3>
                                    <p className="text-gray-600">Ancient ruins, preserved architecture, and cultural heritage</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-gray-50 rounded-full">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="2" fill="none" />
                                        </svg>
                                    </button>
                                    <button className="p-2 hover:bg-gray-50 rounded-full">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" stroke="currentColor" strokeWidth="2" fill="none" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {itineraries
                                    .filter(itinerary => sectionAssignments['Historical Journey']?.includes(itinerary.id))
                                    .slice(0, 4)
                                    .map((itinerary) => (
                                        <div
                                            key={itinerary.id}
                                            onClick={() => navigate(`/viewmyitinerary/${itinerary.id}`)}
                                            className="aspect-[4/3] rounded-lg overflow-hidden cursor-pointer"
                                        >
                                            <img
                                                src={selectedImages[itinerary.id] || '/images/empty-state.svg'}
                                                alt={itinerary.trip_name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Perfect for:</span>
                                    <div className="flex gap-2">
                                        {Array.from(new Set(
                                            itineraries
                                                .filter(itinerary => sectionAssignments['Historical Journey']?.includes(itinerary.id))
                                                .map(itinerary => itinerary.country)
                                        ))
                                            .filter(Boolean)
                                            .slice(0, 3)
                                            .map((country, index, array) => (
                                                <React.Fragment key={country}>
                                                    <span className="text-[#0096FF] hover:underline cursor-pointer">{country}</span>
                                                    {index < array.length - 1 && <span className="text-gray-300">•</span>}
                                                </React.Fragment>
                                            ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>📅</span>
                                    <span className="text-gray-600">Best time: Spring or Fall</span>
                                </div>
                                <button
                                    onClick={() => navigate('/itineraries?section=historical')}
                                    className="w-full py-2 border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    See All Historical Itineraries
                                    <span>→</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Short Trips Section */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Short Trips</h2>
                        <button
                            onClick={() => navigate('/itineraries?section=short')}
                            className="text-[#0096FF] hover:text-[#0077CC] font-medium"
                        >
                            View all →
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <div className="flex gap-4">
                            {itineraries
                                .filter(itinerary => itinerary.tags?.includes('short'))
                                .map((itinerary) => (
                                    <div
                                        key={itinerary.id}
                                        onClick={() => navigate(`/viewmyitinerary/${itinerary.id}`)}
                                        className="cursor-pointer w-[300px]"
                                    >
                                        <ItineraryTile
                                            id={itinerary.id}
                                            title={itinerary.trip_name}
                                            description={`${itinerary.duration} days in ${itinerary.destinations
                                                .map(d => cleanDestination(d.destination))
                                                .join(', ')}`}
                                            imageUrl={selectedImages[itinerary.id] || '/images/empty-state.svg'}
                                            duration={itinerary.duration}
                                            cities={itinerary.destinations.map(d =>
                                                cleanDestination(d.destination)
                                            )}
                                            createdAt={itinerary.created_at}
                                            loading="lazy"
                                        />
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>

                {/* Hidden Gems Section */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold mb-2">Hidden Gems</h2>
                    <p className="text-gray-600 mb-6">Extraordinary destinations off the beaten path for unique travel experiences</p>

                    <div className="text-sm bg-blue-50 text-blue-700 p-4 rounded-lg mb-6">
                        These lesser-known destinations offer authentic experiences away from the crowds
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {itineraries
                            .filter(itinerary => sectionAssignments['Hidden Gems']?.includes(itinerary.id))
                            .slice(0, 3)
                            .map((itinerary) => (
                                <div key={itinerary.id} className="bg-white rounded-lg overflow-hidden shadow-lg flex flex-col">
                                    <div className="relative">
                                        <img
                                            src={selectedImages[itinerary.id] || '/images/empty-state.svg'}
                                            alt={itinerary.trip_name}
                                            className="w-full h-64 object-cover"
                                        />
                                        <div className="absolute top-4 right-4 bg-white text-gray-900 px-2 py-1 rounded text-sm">
                                            Hidden Gem
                                        </div>
                                        <div className="absolute bottom-4 left-4 text-white">
                                            <div className="flex items-center gap-1">
                                                <span>📍</span>
                                                <span className="font-medium">{itinerary.country}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="flex-grow">
                                            <h3 className="text-xl font-semibold mb-2">{itinerary.trip_name}</h3>
                                            <p className="text-gray-600 mb-4">
                                                {itinerary.destinations.map(d => cleanDestination(d.destination)).join(', ')}
                                            </p>
                                            <div className="flex items-center gap-4 text-gray-500 text-sm">
                                                <span className="flex items-center gap-1">
                                                    <span>⏱️</span>
                                                    {itinerary.duration} days
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/viewmyitinerary/${itinerary.id}`)}
                                            className="w-full bg-[#18181B] text-white py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mt-6"
                                        >
                                            Discover Itinerary
                                            <span>→</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Travellers with most Trips Section */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Travellers with most Trips</h2>
                        <button
                            onClick={() => navigate('/community')}
                            className="text-[#0096FF] hover:text-[#0077CC] font-medium"
                        >
                            View all →
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {topTravellers.map((traveller) => (
                            <div key={traveller.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col h-full">
                                <div className="relative h-48">
                                    <img
                                        src={traveller.avatar_url}
                                        alt={traveller.full_name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => handleImageError(e, "https://api.dicebear.com/7.x/avataaars/svg?seed=" + traveller.id)}
                                    />
                                    <div className="absolute top-4 left-4">
                                        <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm font-medium flex items-center gap-1.5">
                                            <span className="text-blue-600">🌍</span>
                                            <span className="text-gray-800">{traveller.countriesVisited.length} Countries</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex items-center gap-3 mb-4">
                                        <img
                                            src={traveller.avatar_url}
                                            alt={traveller.full_name}
                                            className="w-12 h-12 rounded-full object-cover border-2 border-blue-100"
                                        />
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{traveller.full_name}</h3>
                                            <p className="text-sm text-gray-600">{traveller.bio || "Travel Enthusiast"}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 mb-4 bg-gray-50 p-4 rounded-xl">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 flex items-center gap-2">
                                                <span className="text-blue-500">🎯</span>
                                                Trips Last Month
                                            </span>
                                            <span className="font-medium text-blue-600">{traveller.lastMonthTrips}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 flex items-center gap-2">
                                                <span className="text-blue-500">✈️</span>
                                                Total Trips
                                            </span>
                                            <span className="font-medium text-blue-600">{traveller.totalTrips}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 flex items-center gap-2">
                                                <span className="text-blue-500">🗺️</span>
                                                Countries
                                            </span>
                                            <span className="font-medium text-blue-600">{traveller.countriesVisited.length}</span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-600 mb-6 bg-blue-50 p-3 rounded-lg flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">📍</span>
                                        <span>
                                            Recent: {traveller.countriesVisited.slice(0, 3).join(', ')}
                                            {traveller.countriesVisited.length > 3 && ' and more...'}
                                        </span>
                                    </div>
                                    <div className="mt-auto">
                                        <button
                                            onClick={() => navigate(`/profile/${traveller.id}`)}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2.5 rounded-full transition-colors flex items-center justify-center gap-2 font-medium"
                                        >
                                            <span>View Profile</span>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ready for Adventure Section */}
                <div className="bg-[#0096FF] rounded-2xl p-12 text-center text-white mb-12">
                    <h2 className="text-4xl font-bold mb-4">Ready for your next adventure?</h2>
                    <p className="text-xl mb-8">Create a personalized itinerary tailored to your preferences and travel style</p>
                    <div className="flex justify-center gap-4">
                        <button className="bg-white text-[#0096FF] px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors">
                            Create Itinerary
                        </button>
                        <button className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-full font-medium hover:bg-white/10 transition-colors">
                            Explore More
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Discover; 