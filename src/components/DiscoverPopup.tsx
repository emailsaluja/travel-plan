import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Star, Search, Plus, Edit2, Trash2, Check, Compass } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cleanDestination } from '../utils/stringUtils';

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

interface Tour {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  highlights: string[];
  rating: number;
  reviews: number;
}

interface DiscoverPopupProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  onAttractionsSelect: (attractions: string[], manualAttractions: string[]) => void;
  selectedAttractions?: string[];
}

type TabType = 'search' | 'manual' | 'tours';

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
  const [googlePlacesLoaded, setGooglePlacesLoaded] = useState(false);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const searchDebounceTimeout = useRef<NodeJS.Timeout>();
  const attractionsRef = useRef<Attraction[]>([]);

  // Manual attraction form state
  const [manualAttraction, setManualAttraction] = useState({
    name: '',
    description: '',
    rating: ''
  });
  const [editingAttraction, setEditingAttraction] = useState<Attraction | null>(null);

  const [tours, setTours] = useState<Tour[]>([]);

  // First useEffect to load Google Places results
  useEffect(() => {
    const clearAllState = () => {
      setGooglePlacesLoaded(false);
      setAttractions([]);
      setManualAttractions([]);
      attractionsRef.current = [];
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      setActiveTab('search');
      setManualAttraction({
        name: '',
        description: '',
        rating: ''
      });
      setEditingAttraction(null);
      setLoading(false);
    };

    if (isOpen && destination && window.google) {
      clearAllState();
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
                  query: `best viewpoints in ${cleanDestination(destination)}`
                }, (results, status) => resolve({ results, status }));
              }),
              // Historical Sites
              new Promise((resolve) => {
                placesService.current?.textSearch({
                  location: location,
                  radius: 50000,
                  query: `historical sites in ${cleanDestination(destination)}`
                }, (results, status) => resolve({ results, status }));
              }),
              // Must Visit Places
              new Promise((resolve) => {
                placesService.current?.textSearch({
                  location: location,
                  radius: 50000,
                  query: `must visit places in ${cleanDestination(destination)}`
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
                isSelected: false,
                description: place.vicinity || place.formatted_address,
                isManuallyAdded: false
              }));

              // Mark selected attractions
              selectedAttractions.forEach(selectedName => {
                const match = attractionsData.find(a =>
                  a.name.toLowerCase() === selectedName.toLowerCase() ||
                  selectedName.toLowerCase().includes(a.name.toLowerCase()) ||
                  a.name.toLowerCase().includes(selectedName.toLowerCase())
                );
                if (match) {
                  match.isSelected = true;
                }
              });

              // Update attractions with selected state
              setAttractions(attractionsData);
              attractionsRef.current = attractionsData; // Store in ref for stable reference
              setGooglePlacesLoaded(true);
              setLoading(false);
            });
          }
        }
      });
    }

    // Cleanup function
    return () => {
      if (!isOpen) {
        clearAllState();
      }
    };
  }, [isOpen, destination, selectedAttractions]);

  // Second useEffect to load manual attractions after Google Places are loaded
  useEffect(() => {
    const loadManualAttractions = async () => {
      if (!googlePlacesLoaded) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get existing manual attractions from the database first
        const { data: dbAttractions, error } = await supabase
          .from('attractions')
          .select('*')
          .eq('destination', destination)
          .eq('user_id', user.id)
          .eq('is_manually_added', true);

        if (error) throw error;

        // Get all selected attractions that aren't in Google Places
        const regularAttractionNames = attractionsRef.current.map(a => a.name.toLowerCase());

        // Filter out any attractions that exist in Google Places
        const dbUiAttractions: Attraction[] = (dbAttractions || [])
          .filter(attraction => {
            const lowerName = attraction.name.toLowerCase();
            return !regularAttractionNames.some(regularName =>
              regularName === lowerName ||
              lowerName.includes(regularName) ||
              regularName.includes(lowerName)
            );
          })
          .map(attraction => ({
            ...attraction,
            photoUrl: attraction.photo_url,
            userRatingsTotal: attraction.user_ratings_total,
            isSelected: selectedAttractions.includes(attraction.name),
            isManuallyAdded: true
          }));

        // Set manual attractions directly from database
        setManualAttractions(dbUiAttractions);
      } catch (error) {
        console.error('Error loading manual attractions:', error);
      }
    };

    if (isOpen && destination) {
      loadManualAttractions();
    }
  }, [destination, isOpen, selectedAttractions, googlePlacesLoaded]);

  // Clear search results when closing popup
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      setActiveTab('search');
    }
  }, [isOpen]);

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

  const handleAddCustomAttraction = async (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;

    const predictionName = prediction.structured_formatting.main_text.toLowerCase();

    // Check if attraction already exists in Google Places results
    const existingAttraction = attractionsRef.current.find(a =>
      a.id === prediction.place_id || // Match by ID first
      a.name.toLowerCase() === predictionName || // Then by exact name
      predictionName.includes(a.name.toLowerCase()) || // Then by partial name
      a.name.toLowerCase().includes(predictionName) // Then by reverse partial name
    );

    if (existingAttraction) {
      if (!existingAttraction.isSelected) {
        handleAttractionToggle(existingAttraction);
      }
      setSearchQuery('');
      setShowSearchResults(false);
      return;
    }

    // Also check if it exists in manual attractions
    const existingManual = manualAttractions.find(a =>
      a.name.toLowerCase() === predictionName
    );

    if (existingManual) {
      if (!selectedAttractions.includes(existingManual.name)) {
        handleManualAttractionToggle(existingManual);
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

    placesService.current.getDetails(request, async (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        // Check again after getting full details
        const existingWithDetails = attractionsRef.current.find(a =>
          a.id === place.place_id ||
          a.name.toLowerCase() === (place.name || '').toLowerCase()
        );

        if (existingWithDetails) {
          if (!existingWithDetails.isSelected) {
            handleAttractionToggle(existingWithDetails);
          }
        } else {
          try {
            // Get the current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              throw new Error('User not authenticated');
            }

            // Create the new attraction object
            const newAttraction: Attraction = {
              id: place.place_id || prediction.place_id,
              name: place.name || prediction.structured_formatting.main_text,
              description: place.vicinity || place.formatted_address || prediction.structured_formatting.secondary_text,
              rating: place.rating || 0,
              userRatingsTotal: place.user_ratings_total || 0,
              photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }),
              isSelected: true,
              isManuallyAdded: true,
              destination: destination,
              user_id: user.id
            };

            // Save to database
            const { data, error } = await supabase
              .from('attractions')
              .insert({
                id: newAttraction.id,
                name: newAttraction.name,
                description: newAttraction.description,
                rating: newAttraction.rating,
                photo_url: newAttraction.photoUrl,
                user_ratings_total: newAttraction.userRatingsTotal,
                is_manually_added: true,
                is_selected: true,
                destination: destination,
                user_id: user.id
              })
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

            // Update both states
            setAttractions(prevAttractions => [uiAttraction, ...prevAttractions]);
            setManualAttractions(prev => [uiAttraction, ...prev]);

            // Update selected attractions
            onAttractionsSelect([uiAttraction.name, ...selectedAttractions], []);
          } catch (error) {
            console.error('Error saving attraction:', error);
          }
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

    // Get all selected manual attractions
    const selectedManualAttractions = manualAttractions
      .filter(a => a.isSelected)
      .map(a => a.name);

    // Call the parent's onAttractionsSelect with both lists
    onAttractionsSelect(selectedAttractions, selectedManualAttractions);
  };

  const handleManualAttractionToggle = (attraction: Attraction) => {
    const updatedManualAttractions = manualAttractions.map(a =>
      a.id === attraction.id
        ? { ...a, isSelected: !a.isSelected }
        : a
    );
    setManualAttractions(updatedManualAttractions);

    // Get all selected attractions
    const selectedAttractions = attractions
      .filter(a => a.isSelected)
      .map(a => a.name);

    // Get all selected manual attractions
    const selectedManualAttractions = updatedManualAttractions
      .filter(a => a.isSelected)
      .map(a => a.name);

    // Call the parent's onAttractionsSelect with both lists
    onAttractionsSelect(selectedAttractions, selectedManualAttractions);
  };

  // Sort attractions with selected ones at the top
  const sortedAttractions = [...attractions]
    .filter(attraction => !attraction.isManuallyAdded) // Filter out manually added attractions
    .sort((a, b) => {
      // First priority: selected items
      if (a.isSelected && !b.isSelected) return -1;
      if (!a.isSelected && b.isSelected) return 1;

      // Second priority: number of reviews
      return (b.userRatingsTotal || 0) - (a.userRatingsTotal || 0);
    });

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
        onAttractionsSelect(newSelected, []);
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

      // Check if the attraction already exists in Google Places
      const attractionName = manualAttraction.name.toLowerCase().trim();
      const existsInGooglePlaces = attractionsRef.current.some(a =>
        a.name.toLowerCase() === attractionName ||
        attractionName.includes(a.name.toLowerCase()) ||
        a.name.toLowerCase().includes(attractionName)
      );

      if (existsInGooglePlaces) {
        alert('This attraction already exists in the search results. Please select it from there.');
        return;
      }

      // Check if it already exists in manual attractions (case-insensitive)
      const existsInManual = manualAttractions.some(a => {
        const existingName = a.name.toLowerCase().trim();
        return (existingName === attractionName ||
          existingName.includes(attractionName) ||
          attractionName.includes(existingName)) &&
          a.id !== (editingAttraction?.id || '');
      });

      if (existsInManual) {
        alert('This attraction already exists in your custom attractions.');
        return;
      }

      const attraction = {
        id: editingAttraction ? editingAttraction.id : `manual-${Date.now()}`,
        name: manualAttraction.name.trim(),
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
        // Get current selected attractions before adding new one
        const currentSelectedAttractions = attractions
          .filter(a => a.isSelected)
          .map(a => a.name);

        // Check if it exists in selected attractions
        const existsInSelected = currentSelectedAttractions.some(name => {
          const selectedName = name.toLowerCase().trim();
          return selectedName === attractionName ||
            selectedName.includes(attractionName) ||
            attractionName.includes(selectedName);
        });

        if (existsInSelected) {
          alert('This attraction is already selected.');
          return;
        }

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

      // Get all selected attractions
      const selectedAttractions = attractions
        .filter(a => a.isSelected)
        .map(a => a.name);

      // Get all selected manual attractions and add the new one
      const selectedManualAttractions = [...manualAttractions
        .filter(a => a.isSelected)
        .map(a => a.name), manualAttraction.name];

      // Call the parent's onAttractionsSelect with both lists
      onAttractionsSelect(selectedAttractions, selectedManualAttractions);
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

  // Initialize sample tours based on destination
  useEffect(() => {
    if (isOpen && activeTab === 'tours') {
      // Sample tours data - you can replace this with real API data later
      const sampleTours: Tour[] = [
        {
          id: '1',
          name: `${cleanDestination(destination)} Walking Tour`,
          description: `Explore the best of ${cleanDestination(destination)} with our expert local guide. Visit the most iconic landmarks and discover hidden gems.`,
          duration: '3 hours',
          price: '$49',
          highlights: [
            'Visit main attractions',
            'Local guide expertise',
            'Small group size',
            'Historical insights'
          ],
          rating: 4.8,
          reviews: 156
        },
        {
          id: '2',
          name: `${cleanDestination(destination)} Food Tour`,
          description: `Taste the authentic flavors of ${cleanDestination(destination)}. Sample local delicacies and learn about the culinary traditions.`,
          duration: '4 hours',
          price: '$79',
          highlights: [
            'Local food tastings',
            'Traditional restaurants',
            'Culinary history',
            'Wine pairings'
          ],
          rating: 4.9,
          reviews: 203
        },
        {
          id: '3',
          name: `${cleanDestination(destination)} Photography Tour`,
          description: `Capture the beauty of ${cleanDestination(destination)} through your lens. Perfect for photography enthusiasts of all levels.`,
          duration: '3 hours',
          price: '$59',
          highlights: [
            'Best photo spots',
            'Photography tips',
            'Golden hour timing',
            'Instagram-worthy locations'
          ],
          rating: 4.7,
          reviews: 128
        }
      ];
      setTours(sampleTours);
    }
  }, [isOpen, destination, activeTab]);

  const handleBookTour = (tourId: string) => {
    // This is a placeholder function - you can implement actual booking logic later
    alert('Booking feature coming soon! This will connect to a booking system in the future.');
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
              Discover {cleanDestination(destination)}
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
            <button
              onClick={() => setActiveTab('tours')}
              className={`py-4 px-2 font-['Inter_var'] font-[600] border-b-2 -mb-[1px] transition-colors ${activeTab === 'tours'
                ? 'text-[#00B8A9] border-[#00B8A9]'
                : 'text-gray-500 border-transparent hover:text-[#00B8A9]'
                }`}
            >
              Tours
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {activeTab === 'search' ? (
            <div className="space-y-6">
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
          ) : activeTab === 'manual' ? (
            <div className="space-y-6">
              {/* Manual Attractions List */}
              <div className="mb-8">
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MapPin className={`h-5 w-5 ${selectedAttractions.includes(attraction.name) ? 'text-[#00B8A9]' : 'text-gray-400'}`} />
                          <div>
                            <div className="font-['Inter_var'] font-[600] text-[#1E293B]">{attraction.name}</div>
                            {attraction.description && (
                              <div className="text-sm text-gray-500">{attraction.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditAttraction(attraction)}
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttraction(attraction.id)}
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6">
                {tours.map((tour) => (
                  <div
                    key={tour.id}
                    className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-4 flex-1">
                        <div>
                          <h3 className="text-lg font-['Inter_var'] font-[600] text-[#1E293B]">
                            {tour.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center">
                              {[...Array(Math.floor(tour.rating))].map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-[#00B8A9] text-[#00B8A9]" />
                              ))}
                              {tour.rating % 1 !== 0 && (
                                <Star className="h-4 w-4 fill-[#00B8A9]/50 text-[#00B8A9]" />
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              ({tour.reviews} reviews)
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-600">{tour.description}</p>

                        <div className="flex flex-wrap gap-2">
                          {tour.highlights.map((highlight, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full bg-[#00B8A9]/10 px-3 py-1 text-xs text-[#00B8A9]"
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="ml-6 flex flex-col items-end gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#00B8A9]">{tour.price}</div>
                          <div className="text-sm text-gray-500">per person</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-sm text-gray-500">{tour.duration}</div>
                          <button
                            onClick={() => handleBookTour(tour.id)}
                            className="rounded-lg bg-[#00B8A9] px-6 py-2 text-sm font-medium text-white hover:bg-[#00B8A9]/90 focus:outline-none focus:ring-2 focus:ring-[#00B8A9] focus:ring-offset-2"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscoverPopup; 