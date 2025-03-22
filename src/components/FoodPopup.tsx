import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Plus, Star, MapPin, Utensils, Minus, Compass, PenLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cleanDestination } from '../utils/stringUtils';

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
    isManuallyAdded?: boolean;
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
    const [activeTab, setActiveTab] = useState<'discover' | 'manual'>('discover');
    const [manualFoodName, setManualFoodName] = useState('');
    const [manualFoodAddress, setManualFoodAddress] = useState('');
    const [foodPlaces, setFoodPlaces] = useState<FoodPlace[]>([]);
    const [manualFoodPlaces, setManualFoodPlaces] = useState<FoodPlace[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const placesService = useRef<google.maps.places.PlacesService | null>(null);
    const searchDebounceTimeout = useRef<NodeJS.Timeout>();

    // Initialize selected items and manual food places when the popup opens
    useEffect(() => {
        if (isOpen) {
            setSelectedItems(selectedFoodItems || []);
            // Only convert items that start with 'manual-' to manual food places
            const manualPlaces = selectedFoodItems
                .filter(item => item.startsWith('manual-'))
                .map(item => ({
                    id: item,
                    name: item.replace('manual-', ''),
                    isManuallyAdded: true,
                    isSelected: true
                }));
            setManualFoodPlaces(manualPlaces);
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
                query: destination.toLowerCase() === 'venice' ? 'Venice, Italy' : destination,
                fields: ['geometry', 'formatted_address']
            };

            placesService.current.findPlaceFromQuery(destinationRequest, (results, status) => {
                console.log('Destination search results:', { destination, status, results });
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
                    const location = results[0].geometry?.location;
                    console.log('Found location for', destination, ':', location?.lat(), location?.lng());

                    if (location) {
                        // Search for must-try restaurants near this location
                        const searchTypes: SearchType[] = [
                            { type: 'restaurant', query: `best restaurants in Venice Italy` },
                            { type: 'restaurant', query: `famous restaurants Venice Italy` },
                            { type: 'restaurant', query: `traditional venetian restaurants` },
                            { type: 'restaurant', query: `venice italy restaurants` },
                            { type: 'restaurant', query: `restaurants near san marco venice` }
                        ];

                        Promise.all(
                            searchTypes.map(({ type, query }) =>
                                new Promise<PlaceSearchResponse>((resolve) => {
                                    console.log('Starting search for:', query);
                                    placesService.current?.nearbySearch({
                                        location: location,
                                        radius: 20000, // Increased radius for Venice
                                        type: type,
                                        keyword: query
                                    }, (results, status) => {
                                        console.log('Search results for', query, ':', {
                                            status,
                                            resultsCount: results?.length || 0,
                                            firstResult: results?.[0]?.name,
                                            location: location.toString()
                                        });
                                        resolve({ results: results || [], status });
                                    });
                                })
                            )
                        ).then((responses) => {
                            const allPlaces = new Map<string, google.maps.places.PlaceResult>();
                            let totalResults = 0;

                            responses.forEach((response) => {
                                if (response.status === google.maps.places.PlacesServiceStatus.OK) {
                                    response.results
                                        .filter(place =>
                                            place.rating && place.rating >= 4.0 &&
                                            place.user_ratings_total && place.user_ratings_total > 100
                                        )
                                        .forEach((place) => {
                                            if (place.place_id && !allPlaces.has(place.place_id)) {
                                                allPlaces.set(place.place_id, place);
                                                totalResults++;
                                            }
                                        });
                                }
                            });

                            console.log('Total unique places found:', totalResults);
                            console.log('Places after filtering:', allPlaces.size);

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
                                    isSelected: selectedItems.includes(place.name || ''),
                                    isManuallyAdded: false
                                }));

                                foodPlacesData.sort((a, b) => {
                                    if (a.isSelected !== b.isSelected) {
                                        return (a.isSelected ? -1 : 1);
                                    }
                                    const reviewsA = a.userRatingsTotal ?? 0;
                                    const reviewsB = b.userRatingsTotal ?? 0;
                                    if (reviewsB !== reviewsA) {
                                        return reviewsB - reviewsA;
                                    }
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
    }, [isOpen, destination, selectedItems]);

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
    };

    const handleClose = () => {
        // Update parent component with selections before closing
        onFoodSelect(selectedItems);
        onClose();
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

    const generateUniqueKey = (place: FoodPlace, index: number): string => {
        if (place.id && place.id.trim() !== '') {
            return place.id;
        }
        return `${place.name}-${index}`;
    };

    const handleManualAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualFoodName.trim()) {
            const newManualPlace: FoodPlace = {
                id: `manual-${manualFoodName.trim()}`,
                name: manualFoodName.trim(),
                address: manualFoodAddress.trim(),
                isManuallyAdded: true,
                isSelected: true
            };

            // Add to manual food places
            setManualFoodPlaces(prev => [...prev, newManualPlace]);

            // Add to selected items with the manual- prefix
            const newSelectedItems = [...selectedItems, newManualPlace.id];
            setSelectedItems(newSelectedItems);

            // Clear form
            setManualFoodName('');
            setManualFoodAddress('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b bg-gray-50/80">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center">
                                <Utensils className="w-5 h-5 text-[#8B5CF6]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Food in {cleanDestination(destination)}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {selectedItems.length} places selected
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mt-4 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('discover')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${activeTab === 'discover'
                                ? 'bg-white text-[#8B5CF6] shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Compass className="w-4 h-4" />
                            Discover
                        </button>
                        <button
                            onClick={() => setActiveTab('manual')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${activeTab === 'manual'
                                ? 'bg-white text-[#8B5CF6] shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <PenLine className="w-4 h-4" />
                            Manual Add
                        </button>
                    </div>

                    {/* Search Bar - Only show in discover tab */}
                    {activeTab === 'discover' && (
                        <div className="mt-4">
                            <div className="flex items-center bg-white border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#8B5CF6]/50 focus-within:border-[#8B5CF6]">
                                <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    placeholder="Search restaurants, cuisines, or locations..."
                                    className="w-full py-2 px-3 text-sm bg-transparent outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(80vh-180px)]">
                    {activeTab === 'discover' ? (
                        // Discover tab content
                        loading ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#8B5CF6] border-t-transparent"></div>
                            </div>
                        ) : error ? (
                            <div className="p-6 text-center text-red-500 text-sm">{error}</div>
                        ) : filteredFoodPlaces.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 text-sm">No food places found</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2 p-3">
                                {filteredFoodPlaces.map((place, index) => (
                                    <div
                                        key={generateUniqueKey(place, index)}
                                        className={`flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${place.isSelected ? 'bg-[#8B5CF6]/5 hover:bg-[#8B5CF6]/10' : ''
                                            }`}
                                    >
                                        {/* Image */}
                                        {place.photoUrl && (
                                            <img
                                                src={place.photoUrl}
                                                alt={place.name}
                                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                            />
                                        )}

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <h3 className="font-medium text-gray-900 truncate">{place.name}</h3>
                                                    {place.cuisine && (
                                                        <p className="text-xs text-gray-500 capitalize mt-0.5">{place.cuisine}</p>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-1">
                                                        {place.rating && (
                                                            <div className="flex items-center gap-1">
                                                                <Star className="w-3.5 h-3.5 fill-current text-yellow-400" />
                                                                <span className="text-sm font-medium">{place.rating}</span>
                                                                {place.userRatingsTotal && (
                                                                    <span className="text-xs text-gray-500">
                                                                        ({place.userRatingsTotal})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {place.priceLevel !== undefined && (
                                                            <span className="text-xs text-gray-500">
                                                                {getPriceLevelString(place.priceLevel)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {place.address && (
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            <span className="truncate">{place.address}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Selection Button */}
                                                <button
                                                    onClick={() => toggleFoodItem(place)}
                                                    className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${place.isSelected
                                                        ? 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED]'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {place.isSelected ? (
                                                        <Minus className="w-4 h-4" />
                                                    ) : (
                                                        <Plus className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        // Manual add tab content
                        <div className="p-4">
                            {/* Manually Added Restaurants List */}
                            {manualFoodPlaces.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-medium text-gray-700 mb-4">Your Custom Restaurants</h3>
                                    <div className="space-y-2">
                                        {manualFoodPlaces.map((place) => (
                                            <div
                                                key={place.id}
                                                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-[#8B5CF6] transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Utensils className="h-5 w-5 text-[#8B5CF6]" />
                                                    <div>
                                                        <div className="font-medium text-gray-900">{place.name}</div>
                                                        {place.address && (
                                                            <div className="text-sm text-gray-500">{place.address}</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newManualPlaces = manualFoodPlaces.filter(p => p.id !== place.id);
                                                        const newSelectedItems = selectedItems.filter(item => item !== place.id);
                                                        setManualFoodPlaces(newManualPlaces);
                                                        setSelectedItems(newSelectedItems);
                                                    }}
                                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                                >
                                                    <Minus className="h-4 w-4 text-gray-500" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleManualAdd} className="space-y-4">
                                <div>
                                    <label htmlFor="foodName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Restaurant Name
                                    </label>
                                    <input
                                        type="text"
                                        id="foodName"
                                        value={manualFoodName}
                                        onChange={(e) => setManualFoodName(e.target.value)}
                                        placeholder="Enter restaurant name"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#8B5CF6]/50 focus:border-[#8B5CF6] outline-none text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="foodAddress" className="block text-sm font-medium text-gray-700 mb-1">
                                        Address (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        id="foodAddress"
                                        value={manualFoodAddress}
                                        onChange={(e) => setManualFoodAddress(e.target.value)}
                                        placeholder="Enter restaurant address"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#8B5CF6]/50 focus:border-[#8B5CF6] outline-none text-sm"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-[#8B5CF6] text-white py-2 px-4 rounded-lg hover:bg-[#7C3AED] transition-colors text-sm font-medium"
                                >
                                    Add Restaurant
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FoodPopup; 