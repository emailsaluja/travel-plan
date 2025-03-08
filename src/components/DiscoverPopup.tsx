import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Star, Search, Plus } from 'lucide-react';

interface Attraction {
  id: string;
  name: string;
  description?: string;
  rating?: number;
  userRatingsTotal?: number;
  photoUrl?: string;
  isSelected?: boolean;
  isManuallyAdded?: boolean;
}

interface DiscoverPopupProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  onAttractionsSelect: (attractions: string[]) => void;
  selectedAttractions?: string[];
}

const DiscoverPopup: React.FC<DiscoverPopupProps> = ({
  isOpen,
  onClose,
  destination,
  selectedAttractions = [],
  onAttractionsSelect,
}) => {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const searchDebounceTimeout = useRef<NodeJS.Timeout>();

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
                isSelected: selectedAttractions.includes(place.name || ''),
                description: place.vicinity || place.formatted_address,
                isManuallyAdded: false
              }));

              // Add previously selected attractions that were manually added
              const manuallyAddedAttractions = selectedAttractions
                .filter(name => !attractionsData.some(a => a.name === name))
                .map(name => ({
                  id: `manual-${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  name,
                  isSelected: true,
                  isManuallyAdded: true,
                  rating: 0,
                  userRatingsTotal: 0
                }));

              setAttractions([...manuallyAddedAttractions, ...attractionsData]);
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

    // Check if attraction already exists
    const existingAttraction = attractions.find(a => 
      a.name.toLowerCase() === prediction.structured_formatting.main_text.toLowerCase()
    );

    if (existingAttraction) {
      if (!existingAttraction.isSelected) {
        handleAttractionToggle(existingAttraction);
      }
      setSearchQuery('');
      setShowSearchResults(false);
      return;
    }

    // Create temporary attraction with the original place_id
    const tempAttraction: Attraction = {
      id: prediction.place_id,  // Use the original place_id instead of generating a manual one
      name: prediction.structured_formatting.main_text,
      description: prediction.structured_formatting.secondary_text,
      isSelected: true,
      isManuallyAdded: true,
      rating: 0,
      userRatingsTotal: 0
    };

    // Add to list immediately
    setAttractions(prevAttractions => [tempAttraction, ...prevAttractions]);
    
    // Update selected attractions
    const selectedNames = [tempAttraction.name, ...selectedAttractions];
    onAttractionsSelect(selectedNames);

    // Then fetch full details
    const request = {
      placeId: prediction.place_id,
      fields: ['name', 'rating', 'user_ratings_total', 'photos', 'formatted_address', 'vicinity']
    };

    placesService.current.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        setAttractions(prevAttractions => {
          const updatedAttractions = prevAttractions.map(a => {
            if (a.id === prediction.place_id) {  // This will now match because we're using the original place_id
              return {
                ...a,
                rating: place.rating || 0,
                userRatingsTotal: place.user_ratings_total || 0,
                photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }),
                description: place.vicinity || place.formatted_address || a.description,
                isSelected: true,
                isManuallyAdded: true
              };
            }
            return a;
          });
          return updatedAttractions;
        });
      }
    });

    // Clear search
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleAttractionToggle = (attraction: Attraction) => {
    const updatedAttractions = attractions.map(a => 
      a.id === attraction.id ? { ...a, isSelected: !a.isSelected } : a
    );
    setAttractions(updatedAttractions);
    
    const selectedNames = updatedAttractions
      .filter(a => a.isSelected)
      .map(a => a.name);
    
    onAttractionsSelect(selectedNames);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Add Attractions in {destination}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Search className="w-5 h-5 text-gray-400 ml-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search for attractions..."
                className="w-full p-3 outline-none"
              />
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => handleAddCustomAttraction(result)}
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Show selected count if any attractions are selected */}
              {attractions.some(a => a.isSelected) && (
                <div className="text-sm text-gray-600 pb-2 border-b">
                  {attractions.filter(a => a.isSelected).length} attractions selected
                </div>
              )}
              
              {sortedAttractions.map((attraction) => (
                <div
                  key={attraction.id}
                  className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
                    attraction.isSelected 
                      ? 'bg-amber-50 hover:bg-amber-100' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {!attraction.isManuallyAdded && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden">
                      {attraction.photoUrl ? (
                        <img
                          src={attraction.photoUrl}
                          alt={attraction.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <MapPin className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-lg">{attraction.name}</h3>
                      {attraction.isManuallyAdded && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                          Custom
                        </span>
                      )}
                    </div>
                    {attraction.description && (
                      <p className="text-gray-600 text-sm mt-1">{attraction.description}</p>
                    )}
                    {attraction.rating !== undefined && attraction.rating > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium">{attraction.rating}</span>
                        <span className="text-sm text-gray-500">
                          ({attraction.userRatingsTotal?.toLocaleString()} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleAttractionToggle(attraction)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      attraction.isSelected
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {attraction.isSelected ? 'Remove' : 'Add'}
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

export default DiscoverPopup; 