import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, MapPin, Star, Search, Plus, Building2, Edit2, Trash2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cleanDestination } from '../utils/stringUtils';

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
  user_id?: string;
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
    rating: '',
    priceLevel: '1'
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
          isSelected: hotel.is_selected
        }));

        setManualHotels(uiHotels);
      } catch (error) {
        console.error('Error loading manual hotels:', error);
      }
    };

    if (isOpen && destination) {
      loadManualHotels();
    }
  }, [destination, isOpen]);

  const searchHotels = useCallback(async () => {
    if (!placesService.current) {
      setError("Places service not initialized");
      return;
    }

    setLoading(true);
    setError(null);
    const uniqueHotels = new Map<string, google.maps.places.PlaceResult>();

    const searchRequest: google.maps.places.TextSearchRequest = {
      query: destination === "Venice" ? "hotels in Venice Italy" : `hotels in ${destination}`,
      type: "lodging"
    };

    try {
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

      const sortedHotels = Array.from(uniqueHotels.values()).sort((a, b) => {
        const scoreA = (a.rating || 0) * Math.log(a.user_ratings_total || 1);
        const scoreB = (b.rating || 0) * Math.log(b.user_ratings_total || 1);
        return scoreB - scoreA;
      });

      console.log(`Found ${sortedHotels.length} unique hotels for ${destination}`);

      // Convert to our Hotel format
      const hotelsData: Hotel[] = sortedHotels.map(place => ({
        id: place.place_id || '',
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
    } catch (err) {
      console.error('Error searching for hotels:', err);
      setError("Failed to load hotels. Please try again.");
      setLoading(false);
    }
  }, [destination, placesService, selectedHotel]);

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
        rating: parseFloat(manualHotel.rating) || undefined,
        price_level: parseInt(manualHotel.priceLevel),
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
          priceLevel: hotel.price_level,
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
          priceLevel: data.price_level,
          isManuallyAdded: data.is_manually_added,
          isSelected: data.is_selected
        };

        setManualHotels(prev => [...prev, uiHotel]);
      }

      setManualHotel({
        name: '',
        description: '',
        rating: '',
        priceLevel: '1'
      });
      setEditingHotel(null);
      onHotelSelect(hotel.name, true);
    } catch (error) {
      console.error('Error saving hotel:', error);
    }
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

  // Initialize Places Service
  useEffect(() => {
    if (isOpen && window.google) {
      const mapDiv = document.createElement('div');
      const map = new google.maps.Map(mapDiv);
      placesService.current = new google.maps.places.PlacesService(map);
      searchHotels();
    }
  }, [isOpen, searchHotels]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 transform px-4">
        <div className="mx-auto max-w-3xl rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <h2 className="text-lg font-[600] font-['Poppins',sans-serif] text-[#1E293B]">
                Select Hotel in {cleanDestination(destination)}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex gap-8 px-6">
              <button
                onClick={() => setActiveTab('search')}
                className={`py-4 px-2 font-['Inter_var'] font-[600] border-b-2 -mb-[1px] transition-colors ${activeTab === 'search'
                  ? 'text-[#F59E0B] border-[#F59E0B]'
                  : 'text-gray-500 border-transparent hover:text-[#F59E0B]'
                  }`}
              >
                Search Hotels
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`py-4 px-2 font-['Inter_var'] font-[600] border-b-2 -mb-[1px] transition-colors ${activeTab === 'manual'
                  ? 'text-[#F59E0B] border-[#F59E0B]'
                  : 'text-gray-500 border-transparent hover:text-[#F59E0B]'
                  }`}
              >
                Add Custom Hotel
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto p-6">
            {activeTab === 'search' ? (
              <div className="space-y-6">
                {/* Search Input */}
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setShowSearchResults(true)}
                    className="block w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-[#F59E0B] focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                    placeholder="Search for hotels..."
                  />
                </div>

                {/* Hotel List */}
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F59E0B] border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {(searchResults.length > 0 && showSearchResults ? searchResults : hotels).map((hotel: any) => (
                      <div
                        key={hotel.id || hotel.place_id}
                        className={`group relative rounded-lg border p-4 transition-all hover:shadow-md ${(selectedHotel === hotel.name || hotel.isSelected)
                          ? 'border-[#F59E0B] bg-[#F59E0B]/5'
                          : 'border-gray-200 hover:border-[#F59E0B]'
                          }`}
                      >
                        <div className="flex items-start gap-4">
                          {hotel.photoUrl && (
                            <img
                              src={hotel.photoUrl}
                              alt={hotel.name}
                              className="h-20 w-20 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-['Inter_var'] font-[600] text-[#1E293B]">
                                  {hotel.name || hotel.structured_formatting?.main_text}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                  {hotel.description || hotel.structured_formatting?.secondary_text}
                                </p>
                              </div>
                              <button
                                onClick={() => handleHotelSelect(hotel)}
                                className={`rounded-full p-2 ${(selectedHotel === hotel.name || hotel.isSelected)
                                  ? 'bg-[#F59E0B] text-white'
                                  : 'text-[#F59E0B] hover:bg-[#F59E0B]/10'
                                  }`}
                              >
                                {(selectedHotel === hotel.name || hotel.isSelected) ? (
                                  <Check className="h-5 w-5" />
                                ) : (
                                  <Plus className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                            {hotel.rating && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex items-center">
                                  {[...Array(Math.floor(hotel.rating))].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                                  ))}
                                  {hotel.rating % 1 !== 0 && (
                                    <Star className="h-4 w-4 fill-[#F59E0B]/50 text-[#F59E0B]" />
                                  )}
                                </div>
                                <span className="text-sm text-gray-500">
                                  ({hotel.userRatingsTotal?.toLocaleString()} reviews)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Manual Hotel Form */}
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hotel Name</label>
                    <input
                      type="text"
                      value={manualHotel.name}
                      onChange={(e) => setManualHotel({ ...manualHotel, name: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#F59E0B] focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={manualHotel.description}
                      onChange={(e) => setManualHotel({ ...manualHotel, description: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#F59E0B] focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rating</label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={manualHotel.rating}
                        onChange={(e) => setManualHotel({ ...manualHotel, rating: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#F59E0B] focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price Level</label>
                      <select
                        value={manualHotel.priceLevel}
                        onChange={(e) => setManualHotel({ ...manualHotel, priceLevel: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#F59E0B] focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                      >
                        <option value="1">$</option>
                        <option value="2">$$</option>
                        <option value="3">$$$</option>
                        <option value="4">$$$$</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="rounded-lg bg-[#F59E0B] px-4 py-2 text-sm font-medium text-white hover:bg-[#F59E0B]/90 focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2"
                    >
                      {editingHotel ? 'Update Hotel' : 'Add Hotel'}
                    </button>
                  </div>
                </form>

                {/* Manual Hotels List */}
                <div className="mt-8">
                  <h3 className="mb-4 font-['Inter_var'] font-[600] text-[#1E293B]">Your Custom Hotels</h3>
                  <div className="grid gap-4">
                    {manualHotels.map((hotel) => (
                      <div
                        key={hotel.id}
                        className={`group relative rounded-lg border p-4 transition-all hover:shadow-md ${(selectedHotel === hotel.name || hotel.isSelected)
                          ? 'border-[#F59E0B] bg-[#F59E0B]/5'
                          : 'border-gray-200 hover:border-[#F59E0B]'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-['Inter_var'] font-[600] text-[#1E293B]">{hotel.name}</h4>
                            <p className="mt-1 text-sm text-gray-500">{hotel.description}</p>
                            {hotel.rating && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex items-center">
                                  {[...Array(Math.floor(Number(hotel.rating)))].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {'$'.repeat(Number(hotel.priceLevel))}
                                </span>
                              </div>
                            )}
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
                              className={`rounded-full p-2 ${(selectedHotel === hotel.name || hotel.isSelected)
                                ? 'bg-[#F59E0B] text-white'
                                : 'text-[#F59E0B] hover:bg-[#F59E0B]/10'
                                }`}
                            >
                              {(selectedHotel === hotel.name || hotel.isSelected) ? (
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelSearchPopup; 