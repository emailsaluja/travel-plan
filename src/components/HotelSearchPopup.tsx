import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, MapPin, Star, Search, Plus, Building2, Edit2, Trash2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cleanDestination } from '../utils/stringUtils';
import { placesCacheService } from '../services/places-cache.service';
import { GoogleMapsService } from '../services/google-maps.service';

interface Hotel {
  id: string;
  name: string;
  rating?: number;
  userRatingsTotal?: number;
  photoUrl?: string;
  priceLevel?: number;
  description: string;
  isSelected: boolean;
  isManuallyAdded: boolean;
  destination: string;
  place_id?: string;
}

interface HotelSearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  onHotelSelect: (hotel: string, isManual?: boolean, description?: string) => void;
  selectedHotel?: string;
  startDate?: Date;
  numberOfNights?: number;
}

type TabType = 'search' | 'manual';

const HotelSearchPopup: React.FC<HotelSearchPopupProps> = ({
  isOpen,
  onClose,
  destination,
  onHotelSelect,
  selectedHotel,
  startDate,
  numberOfNights
}): JSX.Element | null => {
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const searchDebounceTimeout = useRef<NodeJS.Timeout>();

  // Manual hotel form state
  const [manualHotel, setManualHotel] = useState({
    name: '',
    description: '',
  });

  // State for manual hotels
  const [manualHotels, setManualHotels] = useState<Hotel[]>([]);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);

  const handleDeleteHotel = async (hotelId: string) => {
    try {
      const { error } = await supabase
        .from('hotels')
        .delete()
        .eq('id', hotelId);

      if (error) throw error;

      // Update local state
      setManualHotels(prev => prev.filter(h => h.id !== hotelId));

      // If the deleted hotel was selected, clear the selection
      if (selectedHotel === manualHotels.find(h => h.id === hotelId)?.name) {
        onHotelSelect('');
      }
    } catch (error) {
      console.error('Error deleting hotel:', error);
    }
  };

  useEffect(() => {
    const loadManualHotels = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: hotels, error } = await supabase
          .from('hotels')
          .select('*')
          .eq('destination', destination)
          .eq('user_id', user.id);

        if (error) throw error;

        // Convert the database format to our UI format
        const uiHotels: Hotel[] = (hotels || []).map(hotel => ({
          ...hotel,
          priceLevel: hotel.price_level,
          isManuallyAdded: hotel.is_manually_added,
          isSelected: hotel.name === selectedHotel
        }));

        setManualHotels(uiHotels);
      } catch (error) {
        console.error('Error loading manual hotels:', error);
      }
    };

    if (isOpen && destination) {
      loadManualHotels();
    }
  }, [destination, isOpen, selectedHotel]);

  const fetchHotelDetails = async (placeId: string) => {
    try {
      // Try to get from cache first
      const cachedDetails = await placesCacheService.getPlaceDetails(placeId);
      if (cachedDetails) {
        return cachedDetails;
      }

      // If not in cache, fetch from Google Places API
      return new Promise((resolve, reject) => {
        if (!placesService.current) return reject('Places service not initialized');

        placesService.current.getDetails(
          { placeId },
          async (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              // Save to cache
              await placesCacheService.savePlaceDetails(placeId, place);
              resolve(place);
            } else {
              reject(status);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error fetching hotel details:', error);
      throw error;
    }
  };

  const processHotelsData = (results: google.maps.places.PlaceResult[]) => {
    const sortedHotels = results.sort((a, b) => {
      const scoreA = (a.rating || 0) * Math.log(a.user_ratings_total || 1);
      const scoreB = (b.rating || 0) * Math.log(b.user_ratings_total || 1);
      return scoreB - scoreA;
    });

    console.log(`Found ${sortedHotels.length} unique hotels for ${destination}`);

    // Convert to our Hotel format
    const hotelsData: Hotel[] = sortedHotels.map(place => ({
      id: place.place_id || '',
      place_id: place.place_id || '',
      name: place.name || '',
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }),
      priceLevel: place.price_level,
      description: place.formatted_address || place.vicinity || '',
      isSelected: selectedHotel === place.name,
      isManuallyAdded: false,
      destination: destination
    }));

    setHotels(hotelsData);
    setLoading(false);
  };

  const searchHotels = useCallback(async () => {
    if (!placesService.current) {
      setError("Places service not initialized");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to get from cache first
      const cachedHotels = await placesCacheService.getNearbyPlaces(destination, 'lodging');
      if (cachedHotels) {
        processHotelsData(cachedHotels);
        return;
      }

      // If not in cache, perform the search
      const searchRequest: google.maps.places.TextSearchRequest = {
        query: destination === "Venice" ? "hotels in Venice Italy" : `hotels in ${destination}`,
        type: "lodging"
      };

      const uniqueHotels = new Map<string, google.maps.places.PlaceResult>();

      // First search - general hotels
      const generalResults = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
        placesService.current?.textSearch(searchRequest, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results);
          } else {
            reject(new Error(`Places API error: ${status}`));
          }
        });
      });

      generalResults.forEach(hotel => {
        if (hotel.place_id &&
          ((hotel.rating && hotel.rating >= 4.0) ||
            (hotel.user_ratings_total && hotel.user_ratings_total > 50))) {
          uniqueHotels.set(hotel.place_id, hotel);
        }
      });

      // Second search - luxury hotels
      if (destination === "Venice") {
        const luxuryRequest = {
          ...searchRequest,
          query: "luxury hotels near San Marco Venice Italy"
        };

        const luxuryResults = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
          placesService.current?.textSearch(luxuryRequest, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              resolve(results);
            } else {
              reject(new Error(`Places API error: ${status}`));
            }
          });
        });

        luxuryResults.forEach(hotel => {
          if (hotel.place_id && !uniqueHotels.has(hotel.place_id) &&
            ((hotel.rating && hotel.rating >= 4.0) ||
              (hotel.user_ratings_total && hotel.user_ratings_total > 50))) {
            uniqueHotels.set(hotel.place_id, hotel);
          }
        });
      }

      const results = Array.from(uniqueHotels.values());

      // Save to cache
      await placesCacheService.saveNearbyPlaces(destination, 'lodging', results);

      // Process the results
      processHotelsData(results);

    } catch (err) {
      console.error('Error searching for hotels:', err);
      setError("Failed to load hotels. Please try again.");
      setLoading(false);
    }
  }, [destination, placesService, selectedHotel]);

  const handleHotelSelect = async (hotel: Hotel) => {
    try {
      if (hotel.place_id) {
        const placeDetails = await fetchHotelDetails(hotel.place_id);
      }
      // Update the hotel with additional details if needed
      onHotelSelect(hotel.name, hotel.isManuallyAdded, hotel.description);
      onClose();
    } catch (error) {
      console.error('Error selecting hotel:', error);
    }
  };

  const handlePlaceAutocomplete = async (input: string) => {
    try {
      // Try to get from cache first
      const cachedPredictions = await placesCacheService.getPlacePredictions(input);
      if (cachedPredictions) {
        return cachedPredictions;
      }

      // If not in cache, fetch from Google Places API
      return new Promise((resolve, reject) => {
        if (!autocompleteService.current) return reject('Autocomplete service not initialized');

        const request = {
          input,
          types: ['lodging']
        };

        autocompleteService.current.getPlacePredictions(
          request,
          async (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              // Save to cache
              await placesCacheService.savePlacePredictions(input, predictions);
              resolve(predictions);
            } else {
              reject(status);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error fetching hotel predictions:', error);
      throw error;
    }
  };

  const handleSearch = async (input: string) => {
    if (!input) {
      setSearchResults([]);
      return;
    }

    try {
      const predictions = await handlePlaceAutocomplete(input);
      setSearchResults(predictions || []);
    } catch (error) {
      console.error('Error during search:', error);
      setSearchResults([]);
    }
  };

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
        }, (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSearchResults(predictions);
            setShowSearchResults(true);
          }
        });
      }
    }, 300);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const hotel = {
        id: editingHotel ? editingHotel.id : `manual-${Date.now()}`,
        name: manualHotel.name,
        description: manualHotel.description,
        is_manually_added: true,
        is_selected: true,
        destination: destination,
        user_id: user.id
      };

      if (editingHotel) {
        const { error } = await supabase
          .from('hotels')
          .update(hotel)
          .eq('id', hotel.id);

        if (error) throw error;

        const uiHotel: Hotel = {
          ...hotel,
          isManuallyAdded: hotel.is_manually_added,
          isSelected: hotel.is_selected
        };

        setManualHotels(prev => prev.map(h => h.id === hotel.id ? uiHotel : h));
      } else {
        const { data, error } = await supabase
          .from('hotels')
          .insert(hotel)
          .select()
          .single();

        if (error) throw error;

        const uiHotel: Hotel = {
          ...data,
          isManuallyAdded: data.is_manually_added,
          isSelected: data.is_selected
        };

        setManualHotels(prev => [...prev, uiHotel]);
      }

      setManualHotel({
        name: '',
        description: '',
      });
      setEditingHotel(null);
      onHotelSelect(hotel.name, true, hotel.description);
    } catch (error) {
      console.error('Error saving hotel:', error);
    }
  };

  const handleEditHotel = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setManualHotel({
      name: hotel.name,
      description: hotel.description || '',
    });
    setActiveTab('manual');
  };

  // Initialize Places Service
  useEffect(() => {
    if (isOpen && window.google) {
      placesService.current = GoogleMapsService.getPlacesService();
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      searchHotels();
    }
  }, [isOpen, searchHotels]);

  // Update hotel selection state when selectedHotel prop changes
  useEffect(() => {
    if (isOpen) {
      // Update manual hotels selection state
      setManualHotels(prev => prev.map(hotel => ({
        ...hotel,
        isSelected: hotel.name === selectedHotel
      })));

      // Update hotels selection state
      setHotels(prev => prev.map(hotel => ({
        ...hotel,
        isSelected: hotel.name === selectedHotel
      })));
    }
  }, [isOpen, selectedHotel]);

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 transform px-4">
        <div className="mx-auto max-w-2xl rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <h2 className="text-lg font-[600] font-['Poppins',sans-serif] text-[#1E293B]">
                Stay in {cleanDestination(destination)} {numberOfNights && startDate ?
                  `for ${numberOfNights} nights starting ${formatDate(startDate)}` : ''}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Manual Hotels List */}
              {manualHotels.length > 0 && (
                <div className="grid gap-4">
                  <h3 className="text-sm font-semibold text-gray-500">Your Hotels</h3>
                  {manualHotels.map((hotel) => (
                    <div
                      key={hotel.id}
                      className={`group relative rounded-lg border p-4 transition-all hover:shadow-md ${selectedHotel === hotel.name
                        ? 'border-[#F59E0B] bg-[#F59E0B]/5'
                        : 'border-gray-200 hover:border-[#F59E0B]'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-['Inter_var'] font-[600] text-[#1E293B]">{hotel.name}</h4>
                          <p className="mt-1 text-sm text-gray-500">{hotel.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditHotel(hotel)}
                            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteHotel(hotel.id)}
                            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleHotelSelect(hotel)}
                            className={`rounded-full p-2 ${selectedHotel === hotel.name
                              ? 'bg-[#F59E0B] text-white'
                              : 'text-[#F59E0B] hover:bg-[#F59E0B]/10'
                              }`}
                          >
                            {selectedHotel === hotel.name ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <Plus className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Search Results List */}
              {hotels.length > 0 && (
                <div className="grid gap-4">
                  <h3 className="text-sm font-semibold text-gray-500">Available Hotels</h3>
                  {hotels.map((hotel) => (
                    <div
                      key={hotel.id}
                      className={`group relative rounded-lg border p-4 transition-all hover:shadow-md ${selectedHotel === hotel.name
                        ? 'border-[#F59E0B] bg-[#F59E0B]/5'
                        : 'border-gray-200 hover:border-[#F59E0B]'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-['Inter_var'] font-[600] text-[#1E293B]">{hotel.name}</h4>
                          <p className="mt-1 text-sm text-gray-500">{hotel.description}</p>
                          {hotel.rating && (
                            <div className="mt-1 flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400" />
                              <span className="text-sm text-gray-600">{hotel.rating}</span>
                              {hotel.userRatingsTotal && (
                                <span className="text-sm text-gray-400">({hotel.userRatingsTotal})</span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleHotelSelect(hotel)}
                          className={`rounded-full p-2 ${selectedHotel === hotel.name
                            ? 'bg-[#F59E0B] text-white'
                            : 'text-[#F59E0B] hover:bg-[#F59E0B]/10'
                            }`}
                        >
                          {selectedHotel === hotel.name ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <Plus className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Hotel Form */}
              <form onSubmit={handleManualSubmit} className="space-y-4 pt-4 border-t border-gray-100">
                <div>
                  <input
                    type="text"
                    value={manualHotel.name}
                    onChange={(e) => setManualHotel({ ...manualHotel, name: e.target.value })}
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#F59E0B] focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                    placeholder="Hotel name"
                    required
                  />
                </div>
                <div>
                  <textarea
                    value={manualHotel.description}
                    onChange={(e) => setManualHotel({ ...manualHotel, description: e.target.value })}
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#F59E0B] focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                    rows={2}
                    placeholder="Description (optional)"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-lg bg-[#F59E0B] px-4 py-2 text-sm font-medium text-white hover:bg-[#F59E0B]/90 focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2"
                  >
                    {editingHotel ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelSearchPopup; 