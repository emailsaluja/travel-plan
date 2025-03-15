import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Plus, Star, MapPin, Utensils, Minus } from 'lucide-react';

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
    address?: string;
    openNow?: boolean;
}

interface PlaceSearchResponse {
    results: google.maps.places.PlaceResult[];
    status: google.maps.places.PlacesServiceStatus;
}

interface PlaceDetailsResponse {
    details: google.maps.places.PlaceResult | null;
    status: google.maps.places.PlacesServiceStatus;
}

interface SearchType {
    type: 'restaurant';
    query: string;
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const placesService = useRef<google.maps.places.PlacesService | null>(null);
    const searchDebounceTimeout = useRef<NodeJS.Timeout>();

    // Initialize selected items when the popup opens
    useEffect(() => {
        if (isOpen) {
            setSelectedItems(selectedFoodItems || []);
        }
    }, [isOpen, selectedFoodItems]);

    useEffect(() => {
        if (isOpen && destination && window.google) {
            setLoading(true);
            setError(null);

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
                        // Search for must-try restaurants near this location
                        const searchTypes: SearchType[] = [
                            { type: 'restaurant', query: `must try restaurants in ${destination}` },
                            { type: 'restaurant', query: `famous restaurants ${destination}` },
                            { type: 'restaurant', query: `top rated restaurants ${destination}` },
                            { type: 'restaurant', query: `traditional food ${destination}` },
                            { type: 'restaurant', query: `tourist favorite restaurants ${destination}` }
                        ];

                        Promise.all(
                            searchTypes.map(({ type, query }) =>
                                new Promise<PlaceSearchResponse>((resolve) => {
                                    placesService.current?.nearbySearch({
                                        location: location,
                                        radius: 10000, // 10km radius
                                        type: type,
                                        keyword: query
                                    }, (results, status) => resolve({ results: results || [], status }));
                                })
                            )
                        ).then((responses) => {
                            const allPlaces = new Map<string, google.maps.places.PlaceResult>();

                            responses.forEach((response) => {
                                if (response.status === google.maps.places.PlacesServiceStatus.OK) {
                                    response.results
                                        // Pre-filter to only include highly rated places with sufficient reviews
                                        .filter(place =>
                                            place.rating && place.rating >= 4.0 &&
                                            place.user_ratings_total && place.user_ratings_total > 100
                                        )
                                        .forEach((place) => {
                                            if (place.place_id && !allPlaces.has(place.place_id)) {
                                                allPlaces.set(place.place_id, place);
                                            }
                                        });
                                }
                            });

                            // Get detailed information for each place
                            Promise.all(
                                Array.from(allPlaces.values()).map((place) =>
                                    new Promise<PlaceDetailsResponse>((resolve) => {
                                        if (place.place_id) {
                                            placesService.current?.getDetails(
                                                {
                                                    placeId: place.place_id,
                                                    fields: ['name', 'rating', 'user_ratings_total', 'photos', 'price_level', 'formatted_address', 'opening_hours', 'types', 'reviews']
                                                },
                                                (details, status) => resolve({ details, status })
                                            );
                                        } else {
                                            resolve({ details: place, status: google.maps.places.PlacesServiceStatus.OK });
                                        }
                                    })
                                )
                            ).then((detailsResponses) => {
                                const validPlaces = detailsResponses
                                    .map(response => response.details)
                                    .filter((place): place is google.maps.places.PlaceResult => place !== null);

                                const foodPlacesData: FoodPlace[] = validPlaces.map(place => ({
                                    id: place.place_id || '',
                                    name: place.name || '',
                                    rating: place.rating,
                                    userRatingsTotal: place.user_ratings_total,
                                    photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }),
                                    priceLevel: place.price_level,
                                    address: place.formatted_address,
                                    openNow: place.opening_hours?.isOpen(),
                                    cuisine: place.types?.find(type => type !== 'restaurant' && type !== 'food')?.replace(/_/g, ' '),
                                    isSelected: selectedFoodItems.includes(place.name || '')
                                }));

                                // Sort by selection first, then by number of reviews, then by rating
                                foodPlacesData.sort((a, b) => {
                                    // First, compare by selection status (selected items at top)
                                    if (a.isSelected !== b.isSelected) {
                                        return (a.isSelected ? -1 : 1);
                                    }
                                    // Then, compare by number of reviews
                                    const reviewsA = a.userRatingsTotal ?? 0;
                                    const reviewsB = b.userRatingsTotal ?? 0;
                                    if (reviewsB !== reviewsA) {
                                        return reviewsB - reviewsA;
                                    }
                                    // Finally, sort by rating
                                    const ratingA = a.rating ?? 0;
                                    const ratingB = b.rating ?? 0;
                                    return ratingB - ratingA;
                                });

                                setFoodPlaces(foodPlacesData);
                                setLoading(false);
                            });
                        });
                    }
                } else {
                    setError('Failed to find the destination location');
                    setLoading(false);
                }
            });
        }
    }, [isOpen, destination, selectedFoodItems]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
    };

    const toggleFoodItem = (foodPlace: FoodPlace) => {
        const newSelectedItems = selectedItems.includes(foodPlace.name)
            ? selectedItems.filter(item => item !== foodPlace.name)
            : [...selectedItems, foodPlace.name];

        setSelectedItems(newSelectedItems);
        setFoodPlaces(prevPlaces =>
            prevPlaces.map(place => ({
                ...place,
                isSelected: newSelectedItems.includes(place.name)
            }))
        );
        // Update parent component with new selections
        onFoodSelect(newSelectedItems);
    };

    const getPriceLevelString = (level?: number) => {
        if (level === undefined) return '';
        return '¥'.repeat(level);
    };

    const filteredFoodPlaces = foodPlaces.filter(place =>
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.cuisine?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Add a function to generate unique keys
    const generateUniqueKey = (place: FoodPlace, index: number): string => {
        if (place.id && place.id.trim() !== '') {
            return place.id;
        }
        // Fallback to using name + index if id is empty
        return `${place.name}-${index}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Utensils className="w-6 h-6 text-[#8B5CF6]" />
                            Popular Food Places in {destination}
                            <span className="text-sm font-normal text-gray-500">
                                ({selectedItems.length} selected)
                            </span>
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="relative mb-4">
                        <div className="flex items-center border rounded-lg overflow-hidden bg-gray-50">
                            <Search className="w-5 h-5 text-gray-400 ml-3" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Search restaurants, cuisines, or locations..."
                                className="w-full p-3 bg-transparent outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-y-auto max-h-[calc(80vh-180px)]">
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B5CF6]"></div>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-500">{error}</div>
                    ) : filteredFoodPlaces.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No food places found</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 p-6">
                            {filteredFoodPlaces.map((place, index) => (
                                <div
                                    key={generateUniqueKey(place, index)}
                                    className="bg-white rounded-lg border hover:shadow-md transition-shadow p-4"
                                >
                                    <div className="flex gap-4">
                                        {place.photoUrl && (
                                            <img
                                                src={place.photoUrl}
                                                alt={place.name}
                                                className="w-24 h-24 object-cover rounded-lg"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-medium text-lg">{place.name}</h3>
                                                    {place.cuisine && (
                                                        <p className="text-sm text-gray-600 capitalize">{place.cuisine}</p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => toggleFoodItem(place)}
                                                    className={`p-2 rounded-full transition-colors ${place.isSelected
                                                        ? 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED]'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {place.isSelected ? (
                                                        <Minus className="w-5 h-5" />
                                                    ) : (
                                                        <Plus className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                {place.rating && (
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-4 h-4 fill-current text-yellow-400" />
                                                        <span className="font-medium">{place.rating}</span>
                                                        {place.userRatingsTotal && (
                                                            <span className="text-gray-500 text-sm">
                                                                ({place.userRatingsTotal})
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {place.priceLevel !== undefined && (
                                                    <span className="text-gray-600">
                                                        {getPriceLevelString(place.priceLevel)}
                                                    </span>
                                                )}
                                            </div>
                                            {place.address && (
                                                <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                                                    <MapPin className="w-4 h-4" />
                                                    {place.address}
                                                </div>
                                            )}
                                        </div>
                                    </div>
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