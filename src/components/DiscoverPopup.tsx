import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Star, Search, Plus, Edit2, Trash2, Check, Compass } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Attraction {
  id: string;
  name: string;
  description?: string;
  rating?: number;
  userRatingsTotal?: number;
  photoUrl?: string;
  isSelected?: boolean;
  isManuallyAdded?: boolean;
  destination?: string;
  user_id?: string;
}

interface DiscoverPopupProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  onAttractionsSelect: (attractions: string[]) => void;
  selectedAttractions?: string[];
}

type TabType = 'search' | 'manual';

const DiscoverPopup: React.FC<DiscoverPopupProps> = ({
  isOpen,
  onClose,
  destination,
  selectedAttractions = [],
  onAttractionsSelect,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [manualAttractions, setManualAttractions] = useState<Attraction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const searchDebounceTimeout = useRef<NodeJS.Timeout>();

  // Manual attraction form state
  const [manualAttraction, setManualAttraction] = useState({
    name: '',
    description: '',
    rating: ''
  });
  const [editingAttraction, setEditingAttraction] = useState<Attraction | null>(null);

  useEffect(() => {
    if (isOpen && destination && window.google) {
      setLoading(true);

      // Initialize Places Service with a map div (required by Google Maps API)
      const mapDiv = document.createElement('div');
      const map = new google.maps.Map(mapDiv);
      placesService.current = new google.maps.places.PlacesService(map);

      // First, find the location of the destination
      const destinationRequest = {
        query: destination,
        fields: ['geometry']
      };

      placesService.current.findPlaceFromQuery(destinationRequest, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
          const location = results[0].geometry?.location;

          if (location) {
            // Now search for attractions near this location
            const attractionsRequest = {
              location: location,
              radius: 50000, // 50km radius
              rankBy: google.maps.places.RankBy.PROMINENCE // Use PROMINENCE with radius
            };

            // Perform multiple searches for different types of attractions
            Promise.all([
              // Major Tourist Attractions
              new Promise((resolve) => {
                placesService.current?.nearbySearch(
                  { ...attractionsRequest, type: 'tourist_attraction' },
                  (results, status) => resolve({ results, status })
                );
              }),
              // Historical & Cultural Sites
              new Promise((resolve) => {
                placesService.current?.nearbySearch(
                  { ...attractionsRequest, type: 'museum' },
                  (results, status) => resolve({ results, status })
                );
              }),
              // Religious Sites
              new Promise((resolve) => {
                placesService.current?.nearbySearch(
                  { ...attractionsRequest, type: 'place_of_worship' },
                  (results, status) => resolve({ results, status })
                );
              }),
              // Parks and Nature
              new Promise((resolve) => {
                placesService.current?.nearbySearch(
                  { ...attractionsRequest, type: 'park' },
                  (results, status) => resolve({ results, status })
                );
              }),
              // Landmarks
              new Promise((resolve) => {
                placesService.current?.nearbySearch(
                  { ...attractionsRequest, type: 'landmark' },
                  (results, status) => resolve({ results, status })
                );
              }),
              // Amusement Parks
              new Promise((resolve) => {
                placesService.current?.nearbySearch(
                  { ...attractionsRequest, type: 'amusement_park' },
                  (results, status) => resolve({ results, status })
                );
              }),
              // Art Galleries
              new Promise((resolve) => {
                placesService.current?.nearbySearch(
                  { ...attractionsRequest, type: 'art_gallery' },
                  (results, status) => resolve({ results, status })
                );
              }),
              // Famous View Points
              new Promise((resolve) => {
                placesService.current?.textSearch({
                  location: location,
                  radius: 50000,
                  query: `best viewpoints in ${destination}`
                }, (results, status) => resolve({ results, status }));
              }),
              // Historical Sites
              new Promise((resolve) => {
                placesService.current?.textSearch({
                  location: location,
                  radius: 50000,
                  query: `historical sites in ${destination}`
                }, (results, status) => resolve({ results, status }));
              }),
              // Must Visit Places
              new Promise((resolve) => {
                placesService.current?.textSearch({
                  location: location,
                  radius: 50000,
                  query: `must visit places in ${destination}`
                }, (results, status) => resolve({ results, status }));
              })
            ]).then((responses) => {
              const allPlaces = new Map();

              responses.forEach((response: any) => {
                if (response.status === google.maps.places.PlacesServiceStatus.OK && response.results) {
                  response.results.forEach((place: google.maps.places.PlaceResult) => {
                    // Only include places with ratings above 3.5 or no rating (new places)
                    if (!place.rating || place.rating >= 3.5) {
                      if (!allPlaces.has(place.place_id)) {
                        allPlaces.set(place.place_id, place);
                      } else {
                        // If place already exists, update it if the new one has better rating or more reviews
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

              // Sort places by rating and number of reviews
              places.sort((a, b) => {
                const ratingA = a.rating || 0;
                const ratingB = b.rating || 0;
                const reviewsA = a.user_ratings_total || 0;
                const reviewsB = b.user_ratings_total || 0;

                // Prioritize highly rated places with significant number of reviews
                const scoreA = ratingA * Math.log(reviewsA + 1);
                const scoreB = ratingB * Math.log(reviewsB + 1);

                return scoreB - scoreA;
              });

              // Convert places to our Attraction format
              const attractionsData: Attraction[] = places.map(place => ({
                id: place.place_id || '',
                name: place.name || '',
                rating: place.rating,
                userRatingsTotal: place.user_ratings_total,
                photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }),
                isSelected: false, // Initialize as not selected
                description: place.vicinity || place.formatted_address,
                isManuallyAdded: false
              }));

              // For each selected attraction, try to find a match in attractionsData
              const selectedAttractionObjects = selectedAttractions.map(selectedName => {
                const match = attractionsData.find(a =>
                  a.name.toLowerCase() === selectedName.toLowerCase() ||
                  selectedName.toLowerCase().includes(a.name.toLowerCase()) ||
                  a.name.toLowerCase().includes(selectedName.toLowerCase())
                );

                if (match) {
                  match.isSelected = true;
                  return null; // Return null for matches found in attractionsData
                }

                // If no match found, create a new manually added attraction
                return {
                  id: `manual-${selectedName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  name: selectedName,
                  isSelected: true,
                  isManuallyAdded: true,
                  rating: 0,
                  userRatingsTotal: 0
                };
              }).filter(Boolean) as Attraction[]; // Remove null values and keep only manual attractions

              // Update attractions with selected state and add manual ones
              setAttractions([...selectedAttractionObjects, ...attractionsData]);
              setLoading(false);
            });
          }
        }
      });
    }
  }, [isOpen, destination, selectedAttractions]);

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
          input: `${query} ${destination}`,
          types: ['tourist_attraction', 'point_of_interest'],
          locationBias: {
            radius: 50000,
            center: { lat: 0, lng: 0 } // This will be biased by the Places API automatically
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

  const handleAddCustomAttraction = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;

    // Check if attraction already exists in our list
    const existingAttraction = attractions.find(a =>
      a.id === prediction.place_id || // Match by ID first
      a.name.toLowerCase() === prediction.structured_formatting.main_text.toLowerCase() || // Then by exact name
      prediction.structured_formatting.main_text.toLowerCase().includes(a.name.toLowerCase()) || // Then by partial name
      a.name.toLowerCase().includes(prediction.structured_formatting.main_text.toLowerCase()) // Then by reverse partial name
    );

    if (existingAttraction) {
      if (!existingAttraction.isSelected) {
        handleAttractionToggle(existingAttraction);
      }
      setSearchQuery('');
      setShowSearchResults(false);
      return;
    }

    // If not found in our list, fetch the full details first
    const request = {
      placeId: prediction.place_id,
      fields: ['name', 'rating', 'user_ratings_total', 'photos', 'formatted_address', 'vicinity', 'place_id', 'types']
    };

    placesService.current.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        // Check again after getting full details
        const existingWithDetails = attractions.find(a =>
          a.id === place.place_id ||
          a.name.toLowerCase() === (place.name || '').toLowerCase()
        );

        if (existingWithDetails) {
          if (!existingWithDetails.isSelected) {
            handleAttractionToggle(existingWithDetails);
          }
        } else {
          // Only add as new if we still can't find it
          const newAttraction: Attraction = {
            id: place.place_id || prediction.place_id,
            name: place.name || prediction.structured_formatting.main_text,
            description: place.vicinity || place.formatted_address || prediction.structured_formatting.secondary_text,
            rating: place.rating || 0,
            userRatingsTotal: place.user_ratings_total || 0,
            photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }),
            isSelected: true,
            // Mark as manually added only if it's not a recognized tourist attraction or point of interest
            isManuallyAdded: !(place.types?.some(type =>
              ['tourist_attraction', 'point_of_interest', 'establishment'].includes(type)
            ))
          };

          setAttractions(prevAttractions => [newAttraction, ...prevAttractions]);
          onAttractionsSelect([newAttraction.name, ...selectedAttractions]);
        }
      }
    });

    // Clear search
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleAttractionToggle = (attraction: Attraction) => {
    const updatedAttractions = attractions.map(a =>
      a.id === attraction.id
        ? { ...a, isSelected: !a.isSelected }
        : a
    );
    setAttractions(updatedAttractions);

    // Get all selected attractions
    const selectedAttractions = updatedAttractions
      .filter(a => a.isSelected)
      .map(a => a.name);

    // Call the parent's onAttractionsSelect with the updated list
    onAttractionsSelect(selectedAttractions);
  };

  // Sort attractions with selected ones at the top
  const sortedAttractions = [...attractions].sort((a, b) => {
    // First priority: selected items
    if (a.isSelected && !b.isSelected) return -1;
    if (!a.isSelected && b.isSelected) return 1;

    // Second priority: manually added items
    if (a.isManuallyAdded && !b.isManuallyAdded) return -1;
    if (!a.isManuallyAdded && b.isManuallyAdded) return 1;

    // Third priority: number of reviews (for non-manual attractions)
    if (!a.isManuallyAdded && !b.isManuallyAdded) {
      return (b.userRatingsTotal || 0) - (a.userRatingsTotal || 0);
    }

    // If both are manually added or other cases, maintain current order
    return 0;
  });

  // Load manual attractions
  useEffect(() => {
    const loadManualAttractions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: attractions, error } = await supabase
          .from('attractions')
          .select('*')
          .eq('destination', destination)
          .eq('user_id', user.id)
          .eq('is_manually_added', true);

        if (error) throw error;

        // Convert the database format to our UI format
        const uiAttractions: Attraction[] = (attractions || []).map(attraction => ({
          ...attraction,
          photoUrl: attraction.photo_url,
          userRatingsTotal: attraction.user_ratings_total,
          isSelected: selectedAttractions.includes(attraction.name),
          isManuallyAdded: attraction.is_manually_added
        }));

        setManualAttractions(uiAttractions);
      } catch (error) {
        console.error('Error loading manual attractions:', error);
      }
    };

    if (isOpen && destination) {
      loadManualAttractions();
    }
  }, [destination, isOpen, selectedAttractions]);

  const handleDeleteAttraction = async (attractionId: string) => {
    try {
      const { error } = await supabase
        .from('attractions')
        .delete()
        .eq('id', attractionId);

      if (error) throw error;

      // Update local state
      setManualAttractions(prev => prev.filter(a => a.id !== attractionId));

      // Remove from selected attractions if it was selected
      const attraction = manualAttractions.find(a => a.id === attractionId);
      if (attraction && selectedAttractions.includes(attraction.name)) {
        const newSelected = selectedAttractions.filter(name => name !== attraction.name);
        onAttractionsSelect(newSelected);
      }
    } catch (error) {
      console.error('Error deleting attraction:', error);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const attraction = {
        id: editingAttraction ? editingAttraction.id : `manual-${Date.now()}`,
        name: manualAttraction.name,
        description: manualAttraction.description,
        rating: parseFloat(manualAttraction.rating) || undefined,
        photo_url: undefined,
        user_ratings_total: undefined,
        is_manually_added: true,
        is_selected: true,
        destination: destination,
        user_id: user.id
      };

      if (editingAttraction) {
        // Update existing attraction
        const { error } = await supabase
          .from('attractions')
          .update(attraction)
          .eq('id', attraction.id);

        if (error) throw error;

        // Convert back to UI format
        const uiAttraction: Attraction = {
          ...attraction,
          photoUrl: attraction.photo_url,
          userRatingsTotal: attraction.user_ratings_total,
          isSelected: true,
          isManuallyAdded: true
        };

        setManualAttractions(prev => prev.map(a => a.id === attraction.id ? uiAttraction : a));
      } else {
        // Insert new attraction
        const { data, error } = await supabase
          .from('attractions')
          .insert(attraction)
          .select()
          .single();

        if (error) throw error;

        // Convert to UI format
        const uiAttraction: Attraction = {
          ...data,
          photoUrl: data.photo_url,
          userRatingsTotal: data.user_ratings_total,
          isSelected: true,
          isManuallyAdded: true
        };

        setManualAttractions(prev => [...prev, uiAttraction]);
      }

      // Reset form
      setManualAttraction({
        name: '',
        description: '',
        rating: ''
      });
      setEditingAttraction(null);

      // Add to selected attractions
      const newSelected = [...selectedAttractions, manualAttraction.name];
      onAttractionsSelect(newSelected);
    } catch (error) {
      console.error('Error saving attraction:', error);
    }
  };

  const handleEditAttraction = (attraction: Attraction) => {
    setEditingAttraction(attraction);
    setManualAttraction({
      name: attraction.name,
      description: attraction.description || '',
      rating: attraction.rating?.toString() || ''
    });
    setActiveTab('manual');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#00B8A9]/10 flex items-center justify-center">
              <Compass className="w-5 h-5 text-[#00B8A9]" />
            </div>
            <h2 className="text-lg font-[600] font-['Poppins',sans-serif] text-[#1E293B]">
              Discover {destination}
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
                ? 'text-[#00B8A9] border-[#00B8A9]'
                : 'text-gray-500 border-transparent hover:text-[#00B8A9]'
                }`}
            >
              Search Attractions
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`py-4 px-2 font-['Inter_var'] font-[600] border-b-2 -mb-[1px] transition-colors ${activeTab === 'manual'
                ? 'text-[#00B8A9] border-[#00B8A9]'
                : 'text-gray-500 border-transparent hover:text-[#00B8A9]'
                }`}
            >
              Add Custom Attraction
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
                  className="block w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-[#00B8A9] focus:outline-none focus:ring-1 focus:ring-[#00B8A9]"
                  placeholder="Search for attractions..."
                />
              </div>

              {/* Search Results */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
                  {searchResults.map((result) => (
                    <button
                      key={result.place_id}
                      onClick={() => handleAddCustomAttraction(result)}
                      className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 last:border-b-0"
                    >
                      <MapPin className="h-5 w-5 text-[#00B8A9]" />
                      <div>
                        <div className="font-medium">{result.structured_formatting.main_text}</div>
                        <div className="text-sm text-gray-500">
                          {result.structured_formatting.secondary_text}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Attractions List */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00B8A9] border-t-transparent"></div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {sortedAttractions.map((attraction) => (
                    <div
                      key={attraction.id}
                      className={`group relative rounded-lg border p-4 transition-all hover:shadow-md ${attraction.isSelected
                        ? 'border-[#00B8A9] bg-[#00B8A9]/5'
                        : 'border-gray-200 hover:border-[#00B8A9]'
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        {attraction.photoUrl && (
                          <img
                            src={attraction.photoUrl}
                            alt={attraction.name}
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-['Inter_var'] font-[600] text-[#1E293B]">
                                {attraction.name}
                              </h3>
                              <p className="mt-1 text-sm text-gray-500">
                                {attraction.description}
                              </p>
                            </div>
                            <button
                              onClick={() => handleAttractionToggle(attraction)}
                              className={`rounded-full p-2 ${attraction.isSelected
                                ? 'bg-[#00B8A9] text-white'
                                : 'text-[#00B8A9] hover:bg-[#00B8A9]/10'
                                }`}
                            >
                              {attraction.isSelected ? (
                                <Check className="h-5 w-5" />
                              ) : (
                                <Plus className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                          {attraction.rating && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex items-center">
                                {[...Array(Math.floor(attraction.rating))].map((_, i) => (
                                  <Star key={i} className="h-4 w-4 fill-[#00B8A9] text-[#00B8A9]" />
                                ))}
                                {attraction.rating % 1 !== 0 && (
                                  <Star className="h-4 w-4 fill-[#00B8A9]/50 text-[#00B8A9]" />
                                )}
                              </div>
                              <span className="text-sm text-gray-500">
                                ({attraction.userRatingsTotal?.toLocaleString()} reviews)
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
              {/* Manual Attraction Form */}
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Attraction Name</label>
                  <input
                    type="text"
                    value={manualAttraction.name}
                    onChange={(e) => setManualAttraction({ ...manualAttraction, name: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#00B8A9] focus:outline-none focus:ring-1 focus:ring-[#00B8A9]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={manualAttraction.description}
                    onChange={(e) => setManualAttraction({ ...manualAttraction, description: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#00B8A9] focus:outline-none focus:ring-1 focus:ring-[#00B8A9]"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rating</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={manualAttraction.rating}
                    onChange={(e) => setManualAttraction({ ...manualAttraction, rating: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#00B8A9] focus:outline-none focus:ring-1 focus:ring-[#00B8A9]"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-lg bg-[#00B8A9] px-4 py-2 text-sm font-medium text-white hover:bg-[#00B8A9]/90 focus:outline-none focus:ring-2 focus:ring-[#00B8A9] focus:ring-offset-2"
                  >
                    {editingAttraction ? 'Update Attraction' : 'Add Attraction'}
                  </button>
                </div>
              </form>

              {/* Manual Attractions List */}
              <div className="mt-8">
                <h3 className="mb-4 font-['Inter_var'] font-[600] text-[#1E293B]">Your Custom Attractions</h3>
                <div className="grid gap-4">
                  {manualAttractions.map((attraction) => (
                    <div
                      key={attraction.id}
                      className={`group relative rounded-lg border p-4 transition-all hover:shadow-md ${selectedAttractions.includes(attraction.name)
                        ? 'border-[#00B8A9] bg-[#00B8A9]/5'
                        : 'border-gray-200 hover:border-[#00B8A9]'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-['Inter_var'] font-[600] text-[#1E293B]">{attraction.name}</h4>
                          <p className="mt-1 text-sm text-gray-500">{attraction.description}</p>
                          {attraction.rating && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex items-center">
                                {[...Array(Math.floor(Number(attraction.rating)))].map((_, i) => (
                                  <Star key={i} className="h-4 w-4 fill-[#00B8A9] text-[#00B8A9]" />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditAttraction(attraction)}
                            className="rounded-full p-2 text-gray-400 hover:bg-[#00B8A9]/10 hover:text-[#00B8A9]"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttraction(attraction.id)}
                            className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleAttractionToggle(attraction)}
                            className={`rounded-full p-2 ${selectedAttractions.includes(attraction.name)
                              ? 'bg-[#00B8A9] text-white'
                              : 'text-[#00B8A9] hover:bg-[#00B8A9]/10'
                              }`}
                          >
                            {selectedAttractions.includes(attraction.name) ? (
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
  );
};

export default DiscoverPopup; 