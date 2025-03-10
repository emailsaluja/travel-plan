import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Plus, Star, MapPin, Utensils } from 'lucide-react';

interface FoodPlace {
    id: string;
    name: string;
    description?: string;
    rating?: number;
    userRatingsTotal?: number;
    photoUrl?: string;
    priceLevel?: number;
    cuisine?: string;
    isSelected?: boolean;
}

interface FoodPopupProps {
    isOpen: boolean;
    onClose: () => void;
    destination: string;
    selectedFoodItems: string[];
    onFoodSelect: (foodItems: string[]) => void;
}

const FoodPopup: React.FC<FoodPopupProps> = ({
    isOpen,
    onClose,
    destination,
    selectedFoodItems,
    onFoodSelect
}) => {
    const [foodPlaces, setFoodPlaces] = useState<FoodPlace[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState<string[]>(selectedFoodItems);
    const placesService = useRef<google.maps.places.PlacesService | null>(null);
    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
    const searchDebounceTimeout = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (isOpen && destination && window.google) {
            setLoading(true);

            // Initialize Places Service
            const mapDiv = document.createElement('div');
            const map = new google.maps.Map(mapDiv);
            placesService.current = new google.maps.places.PlacesService(map);

            // Find the location of the destination
            const destinationRequest = {
                query: destination,
                fields: ['geometry']
            };

            placesService.current.findPlaceFromQuery(destinationRequest, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
                    const location = results[0].geometry?.location;

                    if (location) {
                        // Search for food places near this location
                        Promise.all([
                            // Local Cuisine
                            new Promise((resolve) => {
                                placesService.current?.textSearch({
                                    location: location,
                                    radius: 5000,
                                    query: `best local food ${destination}`
                                }, (results, status) => resolve({ results, status }));
                            }),
                            // Popular Restaurants
                            new Promise((resolve) => {
                                placesService.current?.nearbySearch({
                                    location: location,
                                    radius: 5000,
                                    type: 'restaurant',
                                    rankBy: google.maps.places.RankBy.DISTANCE
                                }, (results, status) => resolve({ results, status }));
                            }),
                            // Street Food
                            new Promise((resolve) => {
                                placesService.current?.textSearch({
                                    location: location,
                                    radius: 5000,
                                    query: `street food markets ${destination}`
                                }, (results, status) => resolve({ results, status }));
                            })
                        ]).then((responses) => {
                            const allPlaces = new Map();

                            responses.forEach((response: any) => {
                                if (response.status === google.maps.places.PlacesServiceStatus.OK && response.results) {
                                    response.results.forEach((place: google.maps.places.PlaceResult) => {
                                        if (!place.rating || place.rating >= 4.0) {
                                            if (!allPlaces.has(place.place_id)) {
                                                allPlaces.set(place.place_id, place);
                                            }
                                        }
                                    });
                                }
                            });

                            const places = Array.from(allPlaces.values());
                            places.sort((a, b) => (b.rating || 0) - (a.rating || 0));

                            const foodPlacesData: FoodPlace[] = places.map(place => ({
                                id: place.place_id || '',
                                name: place.name || '',
                                rating: place.rating,
                                userRatingsTotal: place.user_ratings_total,
                                photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }),
                                priceLevel: place.price_level,
                                description: place.vicinity || place.formatted_address,
                                cuisine: place.types?.includes('restaurant') ? 'Restaurant' : 'Local Food',
                                isSelected: selectedItems.includes(place.name || '')
                            }));

                            setFoodPlaces(foodPlacesData);
                            setLoading(false);
                        });
                    }
                }
            });
        }
    }, [isOpen, destination, selectedItems]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (searchDebounceTimeout.current) {
            clearTimeout(searchDebounceTimeout.current);
        }

        if (!query.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        searchDebounceTimeout.current = setTimeout(() => {
            if (autocompleteService.current) {
                autocompleteService.current.getPlacePredictions({
                    input: `${query} food in ${destination}`,
                    types: ['restaurant', 'food'],
                    locationBias: {
                        radius: 5000,
                        center: { lat: 0, lng: 0 }
                    }
                }, (predictions, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                        setSearchResults(predictions);
                        setShowSearchResults(true);
                    }
                });
            }
        }, 300);
    };

    const toggleFoodItem = (foodPlace: FoodPlace) => {
        const newSelectedItems = selectedItems.includes(foodPlace.name)
            ? selectedItems.filter(item => item !== foodPlace.name)
            : [...selectedItems, foodPlace.name];

        setSelectedItems(newSelectedItems);
        onFoodSelect(newSelectedItems);
    };

    const getPriceLevelString = (level?: number) => {
        if (level === undefined) return '';
        return '¥'.repeat(level);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">
                            Must-Try Food in {destination}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="relative">
                        <div className="flex items-center border rounded-lg overflow-hidden">
                            <Search className="w-5 h-5 text-gray-400 ml-3" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Search for food places..."
                                className="w-full p-3 outline-none"
                            />
                        </div>

                        {showSearchResults && searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border max-h-60 overflow-y-auto">
                                {searchResults.map((result) => (
                                    <button
                                        key={result.place_id}
                                        onClick={() => {
                                            if (placesService.current) {
                                                placesService.current.getDetails(
                                                    {
                                                        placeId: result.place_id,
                                                        fields: ['name', 'rating', 'user_ratings_total', 'photos', 'price_level', 'formatted_address', 'vicinity']
                                                    },
                                                    (place, status) => {
                                                        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                                                            const foodPlace: FoodPlace = {
                                                                id: place.place_id || '',
                                                                name: place.name || '',
                                                                rating: place.rating,
                                                                userRatingsTotal: place.user_ratings_total,
                                                                photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }),
                                                                priceLevel: place.price_level,
                                                                description: place.vicinity || place.formatted_address,
                                                                isSelected: true
                                                            };
                                                            toggleFoodItem(foodPlace);
                                                        }
                                                    }
                                                );
                                            }
                                        }}
                                        className="w-full p-3 text-left hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <div className="font-medium">
                                                {result.structured_formatting.main_text}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {result.structured_formatting.secondary_text}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC4899]"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {foodPlaces.map((place) => (
                                <div
                                    key={place.id}
                                    className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${place.isSelected
                                        ? 'bg-pink-50 hover:bg-pink-100'
                                        : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                >
                                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                        {place.photoUrl ? (
                                            <img
                                                src={place.photoUrl}
                                                alt={place.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <Utensils className="w-8 h-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-lg truncate">{place.name}</h3>
                                        {place.description && (
                                            <p className="text-gray-600 text-sm mt-1">{place.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2">
                                            {place.rating !== undefined && place.rating > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <Star className="w-4 h-4 fill-[#EC4899] text-[#EC4899]" />
                                                    <span className="text-sm font-medium">{place.rating}</span>
                                                    <span className="text-sm text-gray-500">
                                                        ({place.userRatingsTotal?.toLocaleString()} reviews)
                                                    </span>
                                                </div>
                                            )}
                                            {place.priceLevel !== undefined && (
                                                <span className="text-sm font-medium text-gray-600">
                                                    {getPriceLevelString(place.priceLevel)}
                                                </span>
                                            )}
                                            {place.cuisine && (
                                                <span className="text-sm text-gray-500">{place.cuisine}</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleFoodItem(place)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${place.isSelected
                                            ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {place.isSelected ? 'Remove' : 'Add'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FoodPopup; 