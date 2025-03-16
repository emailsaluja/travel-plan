import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Star, Search, Plus, Building2, Edit2 } from 'lucide-react';

interface Hotel {
  id: string;
  name: string;
  description?: string;
  rating?: number;
  userRatingsTotal?: number;
  photoUrl?: string;
  priceLevel?: number;
  amenities?: string[];
  isSelected?: boolean;
  isManuallyAdded?: boolean;
  destination?: string;
}

interface HotelSearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  onHotelSelect: (hotel: string, isManual?: boolean) => void;
  selectedHotel?: string;
}

type TabType = 'search' | 'manual';

const HotelSearchPopup: React.FC<HotelSearchPopupProps> = ({
  isOpen,
  onClose,
  destination,
  onHotelSelect,
  selectedHotel
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const searchDebounceTimeout = useRef<NodeJS.Timeout>();

  // Manual hotel form state
  const [manualHotel, setManualHotel] = useState({
    name: '',
    description: '',
    rating: '',
    priceLevel: '1'
  });

  // State for manual hotels
  const [manualHotels, setManualHotels] = useState<Hotel[]>([]);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);

  useEffect(() => {
    // Load manual hotels from localStorage
    const savedManualHotels = localStorage.getItem('manualHotels');
    if (savedManualHotels) {
      const allHotels = JSON.parse(savedManualHotels);
      // Filter hotels for current destination
      const destinationHotels = allHotels.filter((h: Hotel) => h.destination === destination);
      setManualHotels(destinationHotels);
    }
  }, [destination]);

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
            // Search for hotels near this location
            Promise.all([
              // Luxury and Upscale Hotels
              new Promise((resolve) => {
                placesService.current?.nearbySearch({
                  location: location,
                  radius: 5000,
                  type: 'lodging',
                  rankBy: google.maps.places.RankBy.PROMINENCE,
                  keyword: 'luxury hotel'
                }, (results, status) => resolve({ results, status }));
              }),
              // Regular Hotels
              new Promise((resolve) => {
                placesService.current?.nearbySearch({
                  location: location,
                  radius: 5000,
                  type: 'lodging',
                  rankBy: google.maps.places.RankBy.PROMINENCE
                }, (results, status) => resolve({ results, status }));
              }),
              // Popular Hotels
              new Promise((resolve) => {
                placesService.current?.textSearch({
                  location: location,
                  radius: 5000,
                  query: `best hotels in ${destination}`
                }, (results, status) => resolve({ results, status }));
              })
            ]).then((responses) => {
              const allPlaces = new Map();

              responses.forEach((response: any) => {
                if (response.status === google.maps.places.PlacesServiceStatus.OK && response.results) {
                  response.results.forEach((place: google.maps.places.PlaceResult) => {
                    // Only include places with ratings above 4.0 or no rating
                    if (!place.rating || place.rating >= 4.0) {
                      if (!allPlaces.has(place.place_id)) {
                        allPlaces.set(place.place_id, place);
                      } else {
                        // Update if better rating or more reviews
                        const existingPlace = allPlaces.get(place.place_id);
                        if ((place.rating || 0) > (existingPlace.rating || 0) ||
                          (place.user_ratings_total || 0) > (existingPlace.user_ratings_total || 0)) {
                          allPlaces.set(place.place_id, place);
                        }
                      }
                    }
                  });
                }
              });

              const places = Array.from(allPlaces.values());

              // Sort by rating and reviews
              places.sort((a, b) => {
                const ratingA = a.rating || 0;
                const ratingB = b.rating || 0;
                const reviewsA = a.user_ratings_total || 0;
                const reviewsB = b.user_ratings_total || 0;

                const scoreA = ratingA * Math.log(reviewsA + 1);
                const scoreB = ratingB * Math.log(reviewsB + 1);

                return scoreB - scoreA;
              });

              // Convert to our Hotel format
              const hotelsData: Hotel[] = places.map(place => ({
                id: place.place_id || '',
                name: place.name || '',
                rating: place.rating,
                userRatingsTotal: place.user_ratings_total,
                photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }),
                priceLevel: place.price_level,
                description: place.vicinity || place.formatted_address,
                isSelected: selectedHotel === place.name,
                isManuallyAdded: false,
                destination: destination
              }));

              setHotels(hotelsData);
              setLoading(false);
            });
          }
        }
      });
    }
  }, [isOpen, destination, selectedHotel]);

  // Initialize autocomplete service
  useEffect(() => {
    if (window.google && !autocompleteService.current) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
  }, []);

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
          input: `${query} hotels in ${destination}`,
          types: ['lodging'],
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

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hotel: Hotel = {
      id: editingHotel ? editingHotel.id : `manual-${Date.now()}`,
      name: manualHotel.name,
      description: manualHotel.description,
      rating: parseFloat(manualHotel.rating) || undefined,
      priceLevel: parseInt(manualHotel.priceLevel),
      isManuallyAdded: true,
      isSelected: true,
      destination: destination
    };

    // Get all existing manual hotels from localStorage
    const savedManualHotels = localStorage.getItem('manualHotels');
    let allHotels: Hotel[] = savedManualHotels ? JSON.parse(savedManualHotels) : [];

    if (editingHotel) {
      // Update the hotel in both local state and localStorage
      setManualHotels(prev => prev.map(h => h.id === editingHotel.id ? hotel : h));
      allHotels = allHotels.map(h => h.id === editingHotel.id ? hotel : h);
    } else {
      // Add the new hotel to both local state and localStorage
      setManualHotels(prev => [...prev, hotel]);
      allHotels = [...allHotels.filter(h => h.destination !== destination || h.id !== hotel.id), hotel];
    }

    // Save all hotels back to localStorage
    localStorage.setItem('manualHotels', JSON.stringify(allHotels));

    // Reset form
    setManualHotel({
      name: '',
      description: '',
      rating: '',
      priceLevel: '1'
    });
    setEditingHotel(null);

    // Instead of closing, just update the selected hotel
    onHotelSelect(hotel.name, true);
  };

  const handleEditHotel = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setManualHotel({
      name: hotel.name,
      description: hotel.description || '',
      rating: hotel.rating?.toString() || '',
      priceLevel: hotel.priceLevel?.toString() || '1'
    });
    setActiveTab('manual');
  };

  const handleHotelSelect = (hotel: Hotel) => {
    onHotelSelect(hotel.name, hotel.isManuallyAdded);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Hotels in {destination}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 p-3 text-sm font-medium ${activeTab === 'search'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('search')}
          >
            Search Hotels
          </button>
          <button
            className={`flex-1 p-3 text-sm font-medium ${activeTab === 'manual'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('manual')}
          >
            Add Manually
          </button>
        </div>

        {activeTab === 'search' ? (
          <>
            {/* Manual Hotels Section */}
            {manualHotels.length > 0 && (
              <div className="border-b">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Manual Hotels</h3>
                  <div className="space-y-3">
                    {manualHotels.map((hotel) => (
                      <div
                        key={hotel.id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${hotel.name === selectedHotel ? 'bg-amber-50' : 'bg-gray-50'
                          } hover:bg-amber-100`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{hotel.name}</h3>
                          {hotel.description && (
                            <p className="text-gray-600 text-xs truncate mt-0.5">{hotel.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {hotel.rating !== undefined && hotel.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-medium">{hotel.rating}</span>
                              </div>
                            )}
                            {hotel.priceLevel !== undefined && (
                              <span className="text-xs font-medium text-gray-600">
                                {'¥'.repeat(hotel.priceLevel)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditHotel(hotel)}
                            className="p-2 text-gray-400 hover:text-amber-600 rounded-full hover:bg-amber-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleHotelSelect(hotel)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${hotel.name === selectedHotel
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-white text-gray-700 hover:bg-gray-100'
                              }`}
                          >
                            {hotel.name === selectedHotel ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <div className="flex items-center border rounded-lg overflow-hidden bg-gray-50">
                  <Search className="w-4 h-4 text-gray-400 ml-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search for hotels..."
                    className="w-full p-2 bg-transparent outline-none text-sm"
                  />
                </div>

                {/* Search Results Dropdown */}
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
                                  const hotel: Hotel = {
                                    id: place.place_id || '',
                                    name: place.name || '',
                                    rating: place.rating,
                                    userRatingsTotal: place.user_ratings_total,
                                    photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }),
                                    priceLevel: place.price_level,
                                    description: place.vicinity || place.formatted_address,
                                    isSelected: true,
                                    isManuallyAdded: false,
                                    destination: destination
                                  };
                                  handleHotelSelect(hotel);
                                }
                              }
                            );
                          }
                        }}
                        className="w-full p-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                      >
                        <Plus className="w-3 h-3 text-gray-400" />
                        <div>
                          <div className="font-medium">{result.structured_formatting.main_text}</div>
                          <div className="text-xs text-gray-500">{result.structured_formatting.secondary_text}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hotel List */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 220px)' }}>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 p-4">
                  {hotels.map((hotel) => (
                    <div
                      key={hotel.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${hotel.isSelected ? 'bg-amber-50' : 'bg-gray-50'
                        } hover:bg-amber-100`}
                    >
                      {/* Hotel Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        {hotel.photoUrl ? (
                          <img src={hotel.photoUrl} alt={hotel.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Hotel Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{hotel.name}</h3>
                        {hotel.description && (
                          <p className="text-gray-600 text-xs truncate mt-0.5">{hotel.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {hotel.rating !== undefined && hotel.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-medium">{hotel.rating}</span>
                              <span className="text-xs text-gray-500">
                                ({hotel.userRatingsTotal?.toLocaleString()})
                              </span>
                            </div>
                          )}
                          {hotel.priceLevel !== undefined && (
                            <span className="text-xs font-medium text-gray-600">
                              {'¥'.repeat(hotel.priceLevel)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleHotelSelect(hotel)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${hotel.isSelected
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        {hotel.isSelected ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Manual Add Form */
          <div className="p-4">
            {/* Display Manual Hotels at the top */}
            {manualHotels.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Manual Hotels</h3>
                <div className="space-y-3">
                  {manualHotels.map((hotel) => (
                    <div
                      key={hotel.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${hotel.name === selectedHotel ? 'bg-amber-50' : 'bg-gray-50'
                        } hover:bg-amber-100`}
                    >
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{hotel.name}</h3>
                        {hotel.description && (
                          <p className="text-gray-600 text-xs truncate mt-0.5">{hotel.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {hotel.rating !== undefined && hotel.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-medium">{hotel.rating}</span>
                            </div>
                          )}
                          {hotel.priceLevel !== undefined && (
                            <span className="text-xs font-medium text-gray-600">
                              {'¥'.repeat(hotel.priceLevel)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditHotel(hotel)}
                          className="p-2 text-gray-400 hover:text-amber-600 rounded-full hover:bg-amber-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleHotelSelect(hotel)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${hotel.name === selectedHotel
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                          {hotel.name === selectedHotel ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add/Edit Hotel Form */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                {editingHotel ? 'Edit Hotel' : 'Add New Hotel'}
              </h3>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label htmlFor="hotelName" className="block text-sm font-medium text-gray-700 mb-1">
                    Hotel Name *
                  </label>
                  <input
                    type="text"
                    id="hotelName"
                    required
                    value={manualHotel.name}
                    onChange={(e) => setManualHotel(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 border rounded-lg text-sm"
                    placeholder="Enter hotel name"
                  />
                </div>

                <div>
                  <label htmlFor="hotelDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Description/Address
                  </label>
                  <textarea
                    id="hotelDescription"
                    value={manualHotel.description}
                    onChange={(e) => setManualHotel(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2 border rounded-lg text-sm h-24 resize-none"
                    placeholder="Enter hotel description or address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="hotelRating" className="block text-sm font-medium text-gray-700 mb-1">
                      Rating (0-5)
                    </label>
                    <input
                      type="number"
                      id="hotelRating"
                      min="0"
                      max="5"
                      step="0.1"
                      value={manualHotel.rating}
                      onChange={(e) => setManualHotel(prev => ({ ...prev, rating: e.target.value }))}
                      className="w-full p-2 border rounded-lg text-sm"
                      placeholder="Enter rating"
                    />
                  </div>

                  <div>
                    <label htmlFor="priceLevel" className="block text-sm font-medium text-gray-700 mb-1">
                      Price Level
                    </label>
                    <select
                      id="priceLevel"
                      value={manualHotel.priceLevel}
                      onChange={(e) => setManualHotel(prev => ({ ...prev, priceLevel: e.target.value }))}
                      className="w-full p-2 border rounded-lg text-sm"
                    >
                      <option value="1">¥ (Budget)</option>
                      <option value="2">¥¥ (Moderate)</option>
                      <option value="3">¥¥¥ (Expensive)</option>
                      <option value="4">¥¥¥¥ (Luxury)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-amber-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-amber-600 transition-colors"
                  >
                    {editingHotel ? 'Update Hotel' : 'Add Hotel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelSearchPopup; 