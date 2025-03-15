import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserItineraryService } from '../services/user-itinerary.service';
import { CountryImagesService } from '../services/country-images.service';
import ItineraryTile from '../components/ItineraryTile';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cleanDestination } from '../utils/stringUtils';

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
}> = ({ title, children }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 600; // Adjust this value to control scroll distance
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

    // Fetch country images
    useEffect(() => {
        const fetchCountryImages = async () => {
            const countries = Object.keys(countryStats);

            try {
                const images = await CountryImagesService.batchGetCountryImages(countries);
                setCountryImages(images);

                const selected: Record<string, string> = {};

                // Select hero images for countries (prioritize high-quality images)
                Object.keys(countryStats).forEach(country => {
                    const countryImageList = images[country] || [];
                    if (countryImageList.length > 0) {
                        // For hero images, always use the first (highest quality) image
                        const imageUrl = new URL(countryImageList[0]);
                        if (imageUrl.hostname.includes('supabase.co')) {
                            imageUrl.searchParams.set('quality', '100');
                            imageUrl.searchParams.set('width', '1920');
                        }
                        selected[country] = imageUrl.toString();
                    }
                });

                // Select images for itineraries
                itineraries.forEach(itinerary => {
                    const countryImageList = images[itinerary.country] || [];
                    if (countryImageList.length > 0) {
                        // For itinerary tiles, use smaller images
                        const imageUrl = new URL(countryImageList[Math.floor(Math.random() * countryImageList.length)]);
                        if (imageUrl.hostname.includes('supabase.co')) {
                            imageUrl.searchParams.set('quality', '90');
                            imageUrl.searchParams.set('width', '800');
                        }
                        selected[itinerary.id] = imageUrl.toString();
                    }
                });

                setSelectedImages(selected);
            } catch (error) {
                // Handle error silently
            }
        };

        if (Object.keys(countryStats).length > 0) {
            fetchCountryImages();
        }
    }, [countryStats, itineraries]);

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
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/empty-state.svg';
                            }}
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
                                onClick={() => navigate(`/view-itinerary/${itinerary.id}`)}
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
        <div className="min-h-screen bg-white pt-16">
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
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/images/empty-state.svg';
                                    }}
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

                {/* Most Popular Itineraries Section */}
                <ScrollableSection title="Most Popular Itineraries">
                    {itineraries
                        .filter(itinerary => itinerary.tags?.includes('popular'))
                        .map((itinerary) => (
                            <div
                                key={itinerary.id}
                                onClick={() => navigate(`/view-itinerary/${itinerary.id}`)}
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
                </ScrollableSection>

                {/* Bucket List Experiences Section */}
                <ScrollableSection title="Bucket List Experiences">
                    <div className="flex flex-col items-start mb-4">
                        <button
                            onClick={() => navigate('/discover/onceinlife')}
                            className="text-[#00C48C] hover:text-[#00B380] flex items-center gap-2 mb-4"
                        >
                            View Once in a Life Experiences →
                        </button>
                    </div>
                    {itineraries
                        .filter(itinerary => itinerary.tags?.includes('bucket-list'))
                        .map((itinerary) => (
                            <div
                                key={itinerary.id}
                                onClick={() => navigate(`/view-itinerary/${itinerary.id}`)}
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
                </ScrollableSection>

                {/* Family Friendly Itineraries Section */}
                <ScrollableSection title="Family Friendly Itineraries">
                    {itineraries
                        .filter(itinerary => itinerary.tags?.includes('family'))
                        .map((itinerary) => (
                            <div
                                key={itinerary.id}
                                onClick={() => navigate(`/view-itinerary/${itinerary.id}`)}
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
                </ScrollableSection>

                {/* Adventurous Itineraries Section */}
                <ScrollableSection title="Adventurous Itineraries">
                    {itineraries
                        .filter(itinerary => itinerary.tags?.includes('adventure'))
                        .map((itinerary) => (
                            <div
                                key={itinerary.id}
                                onClick={() => navigate(`/view-itinerary/${itinerary.id}`)}
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
                </ScrollableSection>

                {/* Short Trips Section */}
                <ScrollableSection title="Short Trips">
                    {itineraries
                        .filter(itinerary => itinerary.tags?.includes('short'))
                        .map((itinerary) => (
                            <div
                                key={itinerary.id}
                                onClick={() => navigate(`/view-itinerary/${itinerary.id}`)}
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
                </ScrollableSection>

                {/* Multi Countries Section */}
                <ScrollableSection title="Multi Countries">
                    {itineraries
                        .filter(itinerary => itinerary.tags?.includes('multi-country'))
                        .map((itinerary) => (
                            <div
                                key={itinerary.id}
                                onClick={() => navigate(`/view-itinerary/${itinerary.id}`)}
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
                </ScrollableSection>
            </div>
        </div>
    );
};

export default Discover; 