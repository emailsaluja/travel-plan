import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserItineraryService } from '../../services/user-itinerary.service';
import { CountryImagesService } from '../../services/country-images.service';
import ItineraryTile from '../../components/ItineraryTile';
import { cleanDestination } from '../../utils/stringUtils';

interface Itinerary {
    id: string;
    title?: string;
    trip_name?: string;
    country: string;
    duration: number;
    cities?: string[];
    destinations?: Array<{
        destination: string;
        nights: number;
    }>;
    createdAt?: string;
    created_at?: string;
    tags?: string[];
}

const OnceInLife: React.FC = () => {
    const navigate = useNavigate();
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImages, setSelectedImages] = useState<Record<string, string>>({});

    useEffect(() => {
        loadItineraries();
    }, []);

    // Fetch country images
    useEffect(() => {
        const fetchCountryImages = async () => {
            const countries = Array.from(new Set(itineraries.map(i => i.country || '')));

            try {
                const images = await CountryImagesService.batchGetCountryImages(countries);
                const selected: Record<string, string> = {};

                // Select images for itineraries
                itineraries.forEach(itinerary => {
                    const countryImageList = images[itinerary.country || ''] || [];
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

        if (itineraries.length > 0) {
            fetchCountryImages();
        }
    }, [itineraries]);

    const loadItineraries = async () => {
        try {
            const { data: allItineraries } = await UserItineraryService.getAllPublicItineraries();
            // Filter for bucket-list and once-in-a-life itineraries
            const bucketListItineraries = (allItineraries || []).filter(
                itinerary => itinerary.tags?.includes('bucket-list') || itinerary.tags?.includes('once-in-a-life')
            );
            setItineraries(bucketListItineraries);
        } catch (error) {
            // Handle error silently
        } finally {
            setLoading(false);
        }
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
                        src="/images/cappadocia-balloons.jpg"
                        alt="Hot air balloons flying over Cappadocia's unique landscape at sunrise"
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
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/50"></div>
                    <div className="absolute inset-0 flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                            Once in a Life Experiences
                        </h1>
                        <p className="text-xl text-white opacity-90 drop-shadow-md">
                            {itineraries.length} extraordinary journeys to explore
                        </p>
                    </div>
                </div>
            </div>

            {/* Trip Details Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 shadow-sm">
                    <h3 className="text-lg font-semibold mb-3">About Once in a Life Experiences</h3>
                    <div className="space-y-4">
                        <div className="pb-4 border-b border-gray-200">
                            <p className="text-gray-600 leading-relaxed">
                                These extraordinary journeys represent the pinnacle of travel experiences -
                                those rare moments that become cherished memories for a lifetime. From
                                witnessing natural phenomena to participating in unique cultural events,
                                these itineraries are carefully curated to offer truly unforgettable
                                experiences that you'll treasure forever.
                            </p>
                        </div>

                        {/* Basic Info */}
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 text-sm">
                            <div>
                                <p className="font-medium">Total Experiences</p>
                                <p className="text-gray-600">{itineraries.length} trips</p>
                            </div>
                            <div>
                                <p className="font-medium">Average Duration</p>
                                <p className="text-gray-600">
                                    {Math.round(
                                        itineraries.reduce((acc, curr) => acc + (curr.duration || 0), 0) /
                                        itineraries.length
                                    )} days
                                </p>
                            </div>
                            <div>
                                <p className="font-medium">Unique Destinations</p>
                                <p className="text-gray-600">
                                    {Array.from(new Set(itineraries.flatMap(i =>
                                        i.cities || i.destinations?.map(d => d.destination) || []
                                    ))).length} locations
                                </p>
                            </div>
                        </div>

                        {/* Extended Trip Info */}
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <h4 className="font-medium mb-1.5">Experience Types</h4>
                                <div className="space-y-0.5 text-gray-600">
                                    <p>🌋 Natural Phenomena</p>
                                    <p>🎭 Cultural Events</p>
                                    <p>🏔️ Extreme Adventures</p>
                                    <p>🌅 Unique Landscapes</p>
                                    <p>🎪 Special Festivals</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-1.5">What Makes These Special</h4>
                                <div className="space-y-0.5 text-gray-600">
                                    <p>🌟 Limited Time Events</p>
                                    <p>🎯 Rare Opportunities</p>
                                    <p>🌍 Unique Locations</p>
                                    <p>🎨 Special Access</p>
                                    <p>🌠 Extraordinary Moments</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-1.5">Planning Tips</h4>
                                <div className="space-y-0.5 text-gray-600">
                                    <p>📅 Book well in advance</p>
                                    <p>🎫 Secure special permits</p>
                                    <p>🌤️ Check optimal timing</p>
                                    <p>📱 Stay updated on conditions</p>
                                    <p>🎯 Plan backup options</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Itineraries Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {itineraries.map((itinerary) => (
                        <div
                            key={itinerary.id}
                            onClick={() => navigate(`/viewmyitinerary/${itinerary.id}`)}
                            className="cursor-pointer"
                        >
                            <ItineraryTile
                                id={itinerary.id}
                                title={itinerary.title || itinerary.trip_name || 'Untitled Trip'}
                                description={`${itinerary.duration || 0} days in ${(itinerary.cities || itinerary.destinations?.map(d => d.destination) || []).join(', ')}`}
                                imageUrl={selectedImages[itinerary.id] || '/images/empty-state.svg'}
                                duration={itinerary.duration || 0}
                                cities={itinerary.cities || itinerary.destinations?.map(d => d.destination) || []}
                                createdAt={itinerary.createdAt || itinerary.created_at}
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OnceInLife; 