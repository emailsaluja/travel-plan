import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, MapPin, Star, Search, Plus, Edit2, Trash2, Check, Compass } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cleanDestination } from '../utils/stringUtils';
import { placesCacheService } from '../services/places-cache.service';
import { GoogleMapsService } from '../services/google-maps.service';

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
  onAttractionsSelect: (attractions: string[], manualAttractions: string[], description?: string) => void;
  selectedAttractions?: string[];
}

type TabType = 'search' | 'manual' | 'tours';

// Add a cache for destination coordinates
const destinationCache = new Map<string, google.maps.LatLng>();

const DiscoverPopup: React.FC<DiscoverPopupProps> = ({
  isOpen,
  onClose,
  destination,
  selectedAttractions = [],
  onAttractionsSelect,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('manual');
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
    description: ''
  });
  const [editingAttraction, setEditingAttraction] = useState<Attraction | null>(null);

  const [tours, setTours] = useState<Tour[]>([]);

  // Memoized function to get destination coordinates
  const getDestinationCoordinates = useCallback(async (dest: string): Promise<google.maps.LatLng | null> => {
    // Check cache first
    if (destinationCache.has(dest)) {
      return destinationCache.get(dest)!;
    }

    return new Promise((resolve) => {
      const placesService = GoogleMapsService.getPlacesService();
      const request = {
        query: dest,
        fields: ['geometry']
      };

      placesService.findPlaceFromQuery(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
          const location = results[0].geometry?.location;
          if (location) {
            destinationCache.set(dest, location);
            resolve(location);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }, []);

  // Optimized useEffect for loading attractions
  useEffect(() => {
    const loadAttractions = async () => {
      if (!isOpen || !destination || !window.google) return;

      setLoading(true);
      const location = await getDestinationCoordinates(destination);

      if (!location) {
        setLoading(false);
        return;
      }

      const placesService = GoogleMapsService.getPlacesService();
      const attractionsRequest = {
        location: location,
        radius: 50000,
        rankBy: google.maps.places.RankBy.PROMINENCE
      };

      // Combine similar type searches to reduce API calls
      const searchTypes = [
        { type: 'tourist_attraction', query: null },
        { type: 'museum', query: null },
        { type: 'place_of_worship', query: null },
        { type: 'park', query: null },
        { type: 'landmark', query: null },
        { type: 'amusement_park', query: null },
        { type: 'art_gallery', query: null },
        { query: `best attractions in ${cleanDestination(destination)}`, type: null }
      ];

      try {
        const results = await Promise.all(
          searchTypes.map(({ type, query }) => {
            return new Promise((resolve) => {
              if (type) {
                placesService.nearbySearch(
                  { ...attractionsRequest, type },
                  (results, status) => resolve({ results: results || [], status })
                );
              } else if (query) {
                placesService.textSearch(
                  { ...attractionsRequest, query },
                  (results, status) => resolve({ results: results || [], status })
                );
              }
            });
          })
        );

        const allPlaces = new Map();
        results.forEach((response: any) => {
          if (response.status === google.maps.places.PlacesServiceStatus.OK) {
            response.results.forEach((place: google.maps.places.PlaceResult) => {
              if (!place.rating || place.rating >= 3.5) {
                if (!allPlaces.has(place.place_id)) {
                  allPlaces.set(place.place_id, place);
                } else {
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
        const attractionsData = places.map(place => ({
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

        setAttractions(attractionsData);
        attractionsRef.current = attractionsData;
        setGooglePlacesLoaded(true);
      } catch (error) {
        console.error('Error loading attractions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAttractions();
  }, [isOpen, destination, selectedAttractions, getDestinationCoordinates]);

  // Cleanup function
  useEffect(() => {
    return () => {
      // Clear the cache when component unmounts
      destinationCache.clear();
    };
  }, []);

  // Second useEffect to load manual attractions after Google Places are loaded
  useEffect(() => {
    const loadManualAttractions = async () => {
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

        // Convert to UI format
        const dbUiAttractions: Attraction[] = (dbAttractions || [])
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
  }, [destination, isOpen, selectedAttractions]);

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
    if (window.google) {
      autocompleteService.current = GoogleMapsService.getAutocompleteService();
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
            onAttractionsSelect([uiAttraction.name, ...selectedAttractions], [], uiAttraction.description);
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
    onAttractionsSelect(selectedAttractions, selectedManualAttractions, selectedAttractions.includes(attraction.name) ? attraction.description : undefined);
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
    onAttractionsSelect(selectedAttractions, selectedManualAttractions, selectedAttractions.includes(attraction.name) ? attraction.description : undefined);
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
        onAttractionsSelect(newSelected, [], selectedAttractions.includes(attraction.name) ? attraction.description : undefined);
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
        description: ''
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

      // Call the parent's onAttractionsSelect with both lists and description
      onAttractionsSelect(selectedAttractions, selectedManualAttractions, manualAttraction.description);
    } catch (error) {
      console.error('Error saving attraction:', error);
    }
  };

  const handleEditAttraction = (attraction: Attraction) => {
    setEditingAttraction(attraction);
    setManualAttraction({
      name: attraction.name,
      description: attraction.description || ''
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

  const fetchPlaceDetails = async (placeId: string) => {
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
      console.error('Error fetching place details:', error);
      throw error;
    }
  };

  const fetchNearbyPlaces = async (location: string, type: string) => {
    try {
      // Try to get from cache first
      const cachedPlaces = await placesCacheService.getNearbyPlaces(location, type);
      if (cachedPlaces) {
        return cachedPlaces;
      }

      // If not in cache, fetch from Google Places API
      return new Promise((resolve, reject) => {
        if (!placesService.current) return reject('Places service not initialized');

        const [lat, lng] = location.split(',').map(Number);
        const request = {
          location: new google.maps.LatLng(lat, lng),
          radius: 5000,
          type: type.toLowerCase()
        };

        placesService.current.nearbySearch(
          request,
          async (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              // Save to cache
              await placesCacheService.saveNearbyPlaces(location, type, results);
              resolve(results);
            } else {
              reject(status);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      throw error;
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

        autocompleteService.current.getPlacePredictions(
          { input },
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
      console.error('Error fetching place predictions:', error);
      throw error;
    }
  };

  // Update the existing functions to use the new cached versions
  useEffect(() => {
    const initializeServices = () => {
      const map = new google.maps.Map(document.createElement('div'));
      placesService.current = new google.maps.places.PlacesService(map);
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    };

    if (window.google && window.google.maps) {
      initializeServices();
    }
  }, []);

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

  const handlePlaceSelect = async (placeId: string) => {
    try {
      const place = await fetchPlaceDetails(placeId);
      // Rest of your place selection logic
    } catch (error) {
      console.error('Error selecting place:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="font-['Inter_var'] text-xl font-[600] text-[#1E293B]">Add Attractions</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-8 px-6">
            <button
              onClick={() => setActiveTab('manual')}
              className={`py-4 px-2 font-['Inter_var'] font-[600] border-b-2 -mb-[1px] transition-colors ${activeTab === 'manual'
                ? 'text-[#00B8A9] border-[#00B8A9]'
                : 'text-gray-500 border-transparent hover:text-[#00B8A9]'
                }`}
            >
              Attractions List
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
          {activeTab === 'manual' ? (
            <div className="space-y-6">
              {/* Manual Attractions List */}
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
          ) : activeTab === 'tours' ? (
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
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DiscoverPopup; 