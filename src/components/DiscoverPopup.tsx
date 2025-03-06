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
  onAttractionsSelect,
  selectedAttractions = []
}) => {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);

  useEffect(() => {
    if (isOpen && destination && window.google) {
      // Initialize Places Service with a dummy div (required by Google Maps)
      const mapDiv = document.createElement('div');
      placesService.current = new window.google.maps.places.PlacesService(mapDiv);

      // Search for the destination first to get its location
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
              radius: 5000, // 5km radius
              type: 'tourist_attraction',
              rankBy: google.maps.places.RankBy.RATING
            };

            placesService.current?.nearbySearch(attractionsRequest, (places, searchStatus) => {
              if (searchStatus === google.maps.places.PlacesServiceStatus.OK && places) {
                const attractionsData: Attraction[] = places.map(place => ({
                  id: place.place_id || '',
                  name: place.name || '',
                  rating: place.rating,
                  userRatingsTotal: place.user_ratings_total,
                  photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }),
                  isSelected: selectedAttractions.includes(place.name || ''),
                  description: place.vicinity
                }));

                setAttractions(attractionsData);
                setLoading(false);
              }
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query || !autocompleteService.current) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const request = {
      input: query,
      types: ['tourist_attraction', 'point_of_interest'],
      location: new google.maps.LatLng(0, 0), // This will be replaced with actual destination coordinates
      radius: 5000,
      componentRestrictions: { country: 'JP' } // This should be dynamic based on the country
    };

    autocompleteService.current.getPlacePredictions(
      request,
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSearchResults(predictions);
          setShowSearchResults(true);
        }
      }
    );
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

    // Create temporary attraction without a placeholder image
    const tempAttraction: Attraction = {
      id: prediction.place_id,
      name: prediction.structured_formatting.main_text,
      description: prediction.structured_formatting.secondary_text,
      isSelected: true,
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
            if (a.id === prediction.place_id) {
              return {
                ...a,
                rating: place.rating || 0,
                userRatingsTotal: place.user_ratings_total || 0,
                photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }) || a.photoUrl,
                description: place.vicinity || place.formatted_address || a.description,
                isSelected: true
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
    if (a.isSelected && !b.isSelected) return -1;
    if (!a.isSelected && b.isSelected) return 1;
    // If both are selected or both are not selected, sort by rating
    return (b.rating || 0) - (a.rating || 0);
  });

  // Add this effect near the top of the component
  useEffect(() => {
    console.log('Current attractions:', attractions);
  }, [attractions]);

  // Add this debug effect to monitor state changes
  useEffect(() => {
    console.log('Attractions updated:', attractions);
  }, [attractions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-semibold">
              Popular attractions in {destination}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Add search bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for other attractions..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border max-h-60 overflow-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => handleAddCustomAttraction(result)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <div>
                      <div className="font-medium">{result.structured_formatting.main_text}</div>
                      <div className="text-sm text-gray-500">{result.structured_formatting.secondary_text}</div>
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
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{attraction.name}</h3>
                    {attraction.description && (
                      <p className="text-gray-600 text-sm mt-1">{attraction.description}</p>
                    )}
                    {attraction.rating && (
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