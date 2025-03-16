import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Globe2,
  MapPin,
  Moon,
  Bed,
  Compass,
  Bus,
  Plus,
  Trash2,
  ArrowLeft,
  Edit,
  Calendar,
  Users,
  Clock,
  Navigation,
  Bell,
  Globe,
  ChevronRight,
  Search,
  Share2,
  MoreHorizontal,
  Settings,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  Image,
  Menu,
  Car as Transport,
  Utensils,
  Car,
  Plane,
  Train,
  Bus as BusIcon,
  Heart
} from 'lucide-react';
import { countries } from '../data/countries';
import PlaceAutocomplete from '../components/PlaceAutocomplete';
import DayByDayGrid from '../components/DayByDayGrid';
import DiscoverPopup from '../components/DiscoverPopup';
import TripSummaryEdit from '../components/TripSummaryEdit';
import { ItineraryService } from '../services/itinerary.service';
import { UserItineraryService } from '../services/user-itinerary.service';
import HotelSearchPopup from '../components/HotelSearchPopup';
import TransportPopup from '../components/TransportPopup';
import FoodPopup from '../components/FoodPopup';
import TopNavigation from '../components/TopNavigation';

interface DestinationData {
  destination: string;
  nights: number;
  discover: string;
  transport: string;
  notes: string;
  food: string;
}

interface SaveDestinationData {
  destination: string;
  nights: number;
  discover: string;
  transport: string;
  notes: string;
}

interface ItineraryDay {
  destination: string;
  nights: number;
  discover: string;
  transport: string;
  notes: string;
  food: string;
  hotel?: string;
}

interface TripSummary {
  tripName: string;
  country: string;
  duration: number;
  startDate: string;
  passengers: number;
  isPrivate: boolean;
  tags: string[];
}

type TabType = 'destinations' | 'day-by-day';

interface DayAttractions {
  dayIndex: number;
  selectedAttractions: string[];
}

interface UserItineraryDayAttraction {
  day_index: number;
  attractions: string[];
}

interface DayHotel {
  dayIndex: number;
  hotel: string;
  isManual?: boolean;
}

interface SaveDayHotel {
  day_index: number;
  hotel: string;
  is_manual?: boolean;
}

interface DayNote {
  dayIndex: number;
  notes: string;
}

interface SaveDayNote {
  day_index: number;
  notes: string;
}

interface UserItineraryData {
  trip_name: string;
  country: string;
  duration: number;
  start_date: string;
  passengers: number;
  is_private: boolean;
  tags: string[];
  destinations: Array<{
    destination: string;
    nights: number;
    discover: string;
    transport: string;
    notes: string;
    food: string;
    order_index: number;
  }>;
  day_attractions?: UserItineraryDayAttraction[];
  day_foods?: Array<{
    day_index: number;
    food_items: string[];
  }>;
  day_hotels?: Array<{
    day_index: number;
    hotel: string;
  }>;
  day_notes?: Array<{
    day_index: number;
    notes: string;
  }>;
}

const CreateItinerary: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const itineraryId = searchParams.get('id');
  const [showSummaryPopup, setShowSummaryPopup] = useState(!itineraryId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripSummary, setTripSummary] = useState<TripSummary>({
    tripName: '',
    country: '',
    duration: 1,
    startDate: new Date().toISOString().split('T')[0],
    passengers: 1,
    isPrivate: false,
    tags: []
  });
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('destinations');
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountries, setShowCountries] = useState(false);
  const [showDiscoverPopup, setShowDiscoverPopup] = useState(false);
  const [activeDestinationIndex, setActiveDestinationIndex] = useState<number | null>(null);
  const [dayAttractions, setDayAttractions] = useState<DayAttractions[]>([]);
  const [isDayAttractionsInitialized, setIsDayAttractionsInitialized] = useState(false);
  const [shouldUpdateDayAttractions, setShouldUpdateDayAttractions] = useState(false);
  const [showTripSummaryEdit, setShowTripSummaryEdit] = useState(false);
  const [isHotelSearchOpen, setIsHotelSearchOpen] = useState(false);
  const [currentDestinationForHotel, setCurrentDestinationForHotel] = useState<string>('');
  const [currentDestinationIndexForHotel, setCurrentDestinationIndexForHotel] = useState<number>(-1);
  const [dayHotels, setDayHotels] = useState<DayHotel[]>([]);
  const [showTransportPopup, setShowTransportPopup] = useState(false);
  const [currentDestinationForTransport, setCurrentDestinationForTransport] = useState<{
    from: string;
    to: string;
    index: number;
  } | null>(null);
  const [dayNotes, setDayNotes] = useState<DayNote[]>([]);
  const [showFoodPopup, setShowFoodPopup] = useState(false);
  const [activeDestinationIndexForFood, setActiveDestinationIndexForFood] = useState<number | null>(null);
  const [dayFoods, setDayFoods] = useState<Array<{ dayIndex: number; foodItems: string[] }>>([]);

  // Add available tags constant
  const AVAILABLE_TAGS = [
    { id: 'family', label: 'Family Friendly 👨‍👩‍👧‍👦' },
    { id: 'bucket-list', label: 'Bucket List 🌟' },
    { id: 'popular', label: 'Most Popular 🔥' },
    { id: 'adventure', label: 'Adventure 🏃‍♂️' },
    { id: 'short', label: 'Short Trip ⚡' },
    { id: 'multi-country', label: 'Multi Country 🌎' },
    { id: 'europe', label: 'Europe 🏰' }
  ];

  useEffect(() => {
    const loadExistingItinerary = async () => {
      if (itineraryId) {
        try {
          setLoading(true);
          const { data } = await UserItineraryService.getItineraryById(itineraryId);
          console.log('Loaded itinerary data:', data);
          if (data) {
            // Set trip summary
            setTripSummary({
              tripName: data.trip_name,
              country: data.country,
              duration: data.duration,
              startDate: data.start_date,
              passengers: data.passengers,
              isPrivate: data.is_private || false,
              tags: data.tags || []
            });
            setCountrySearch(data.country);

            // Set destinations with their specific hotels
            const destinationsWithHotels = data.destinations.map((dest: any) => ({
              destination: dest.destination,
              nights: dest.nights,
              discover: dest.discover || '',
              transport: dest.transport || '',
              notes: dest.notes || '',
              food: dest.food || '',
              hotel: dest.hotel || ''  // Load destination-specific hotel
            }));

            console.log('Setting destinations with hotels:', destinationsWithHotels);
            setItineraryDays(destinationsWithHotels);

            // Set day hotels separately
            if (data.day_hotels) {
              console.log('Setting day hotels:', data.day_hotels);
              const hotels = data.day_hotels.map((dh: any) => ({
                dayIndex: dh.day_index,
                hotel: dh.hotel,
                isManual: dh.is_manual
              }));
              setDayHotels(hotels);
            }

            // Initialize dayFoods from destinations data
            let currentDayIndex = 0;
            const newDayFoods: Array<{ dayIndex: number; foodItems: string[] }> = [];

            data.destinations.forEach((dest: any) => {
              const foodItems = dest.food ? dest.food.split(', ').filter(Boolean) : [];

              // For each night in the destination, add the food items
              for (let i = 0; i < dest.nights; i++) {
                newDayFoods.push({
                  dayIndex: currentDayIndex + i,
                  foodItems: []  // Initialize with empty array
                });
              }

              // Only set food items for the first day of the destination
              if (foodItems.length > 0) {
                const firstDayIndex = currentDayIndex;
                newDayFoods[firstDayIndex] = {
                  dayIndex: firstDayIndex,
                  foodItems: foodItems
                };
              }

              currentDayIndex += dest.nights;
            });

            setDayFoods(newDayFoods);

            // Set day attractions
            if (data.day_attractions) {
              console.log('Setting day attractions:', data.day_attractions);
              const attractions = data.day_attractions.map((da: any) => ({
                dayIndex: da.day_index,
                selectedAttractions: Array.isArray(da.attractions) ? da.attractions : []
              }));
              setDayAttractions(attractions);
              setIsDayAttractionsInitialized(true);
            }

            // Set day notes
            if (data.day_notes) {
              console.log('Setting day notes:', data.day_notes);
              setDayNotes(data.day_notes.map((dn: any) => ({
                dayIndex: dn.day_index,
                notes: dn.notes
              })));
            }
          }
        } catch (error) {
          console.error('Error loading itinerary:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadExistingItinerary();
  }, [itineraryId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTripSummary(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'passengers' ? Math.max(1, parseInt(value) || 1) : value
    }));
  };

  const initializeItineraryDays = () => {
    const emptyDay = {
      destination: '',
      nights: 1,
      discover: '',
      transport: '',
      notes: '',
      food: ''
    };
    setItineraryDays([emptyDay]);
  };

  const handleProceed = () => {
    if (!tripSummary.tripName.trim()) {
      setError('Trip name is required');
      return;
    }
    if (!tripSummary.country) {
      setError('Please select a country');
      return;
    }
    initializeItineraryDays();
    setShowSummaryPopup(false);
    setCountrySearch(tripSummary.country);
    setError(null);
  };

  const handleDayUpdate = (index: number, field: keyof ItineraryDay, value: string | number) => {
    const updatedDays = [...itineraryDays];
    updatedDays[index] = {
      ...updatedDays[index],
      [field]: value
    };

    // If we're updating nights, we need to update the hotel assignments
    if (field === 'nights') {
      const oldNights = itineraryDays[index].nights;
      const destinationHotel = updatedDays[index].hotel || '';
      const newNights = Number(value);

      // Calculate the start day index for this destination
      let startDayIndex = 0;
      for (let i = 0; i < index; i++) {
        startDayIndex += itineraryDays[i].nights;
      }

      // Create a new array of day hotels
      const updatedHotels = dayHotels.filter(h => h.dayIndex < startDayIndex);

      // Add hotel entries for all days in this destination
      for (let i = 0; i < newNights; i++) {
        updatedHotels.push({
          dayIndex: startDayIndex + i,
          hotel: destinationHotel,
          isManual: false
        });
      }

      // Add hotels for subsequent destinations
      let currentDayIndex = startDayIndex + newNights;
      for (let i = index + 1; i < itineraryDays.length; i++) {
        const dest = itineraryDays[i];
        const destHotel = dest.hotel || '';

        for (let j = 0; j < dest.nights; j++) {
          updatedHotels.push({
            dayIndex: currentDayIndex + j,
            hotel: destHotel,
            isManual: false
          });
        }
        currentDayIndex += dest.nights;
      }

      // Sort hotels by day index
      updatedHotels.sort((a, b) => a.dayIndex - b.dayIndex);
      setDayHotels(updatedHotels);
    }

    setItineraryDays(updatedDays);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, prepare the destinations data with food items
      const destinationsWithFood = itineraryDays.map((day, index) => {
        // Calculate start day index for this destination
        let startDayIndex = 0;
        for (let i = 0; i < index; i++) {
          startDayIndex += itineraryDays[i].nights;
        }

        // Get all food items for this destination's days
        const foodItems = new Set<string>();
        for (let i = 0; i < day.nights; i++) {
          const dayFood = dayFoods.find(f => f.dayIndex === startDayIndex + i);
          if (dayFood?.foodItems) {
            dayFood.foodItems.forEach(item => {
              const cleanedItem = item.trim();
              if (cleanedItem) {
                foodItems.add(cleanedItem);
              }
            });
          }
        }

        // Convert food items to string
        const foodString = Array.from(foodItems).join(', ');

        return {
          destination: day.destination,
          nights: day.nights,
          discover: day.discover || '',
          transport: day.transport || '',
          notes: day.notes || '',
          food: foodString,
          hotel: day.hotel || ''
        };
      });

      console.log('Saving destinations with food:', destinationsWithFood);

      const saveData = {
        tripSummary: {
          tripName: tripSummary.tripName,
          country: tripSummary.country,
          duration: tripSummary.duration,
          startDate: tripSummary.startDate,
          passengers: tripSummary.passengers,
          isPrivate: tripSummary.isPrivate,
          tags: tripSummary.tags
        },
        destinations: destinationsWithFood,
        dayAttractions: dayAttractions.map(da => ({
          dayIndex: da.dayIndex,
          selectedAttractions: da.selectedAttractions
        })),
        dayHotels: dayHotels.map(dh => ({
          day_index: dh.dayIndex,
          hotel: dh.hotel,
          is_manual: dh.isManual
        })),
        dayNotes: dayNotes.map(dn => ({
          day_index: dn.dayIndex,
          notes: dn.notes
        }))
      };

      if (itineraryId) {
        await UserItineraryService.updateItinerary(itineraryId, saveData);
      } else {
        await UserItineraryService.saveItinerary(saveData);
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving itinerary:', error);
      setError('Failed to save itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total nights from sleeping entries
  const totalNights = itineraryDays.reduce((sum, day) => sum + (day.nights || 0), 0);

  // Format date range (e.g., "10 April - 17 April")
  const formatDateRange = (index: number) => {
    if (!tripSummary.startDate) return '';

    let startDate = new Date(tripSummary.startDate);
    for (let i = 0; i < index; i++) {
      startDate.setDate(startDate.getDate() + itineraryDays[i].nights);
    }

    let endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + itineraryDays[index].nights);

    return `${startDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}`;
  };

  const handleAddDestination = () => {
    const newDay = {
      destination: '',
      nights: 1,
      discover: '',
      transport: '',
      notes: '',
      food: ''
    };
    setItineraryDays(prev => [...prev, newDay]);
  };

  // Update the useEffect that initializes dayAttractions
  useEffect(() => {
    if ((!isDayAttractionsInitialized || shouldUpdateDayAttractions) && itineraryDays.length > 0) {
      let dayIndex = 0;
      const newDayAttractions: DayAttractions[] = [];

      // First, create a day entry for each night of each destination
      itineraryDays.forEach((dest) => {
        const destinationAttractions = dest.discover.split(', ').filter(Boolean);

        // Make sure we create entries for all nights
        for (let i = 0; i < dest.nights; i++) {
          // Always create a new entry for each day
          newDayAttractions.push({
            dayIndex,
            // If we have existing attractions for this day, use them, otherwise use destination attractions
            selectedAttractions: dayAttractions.find(da => da.dayIndex === dayIndex)?.selectedAttractions ||
              [...destinationAttractions]
          });
          dayIndex++;
        }
      });

      console.log('Initializing day attractions:', newDayAttractions);
      setDayAttractions(newDayAttractions);
      setIsDayAttractionsInitialized(true);
      setShouldUpdateDayAttractions(false);
    }
  }, [itineraryDays, isDayAttractionsInitialized, shouldUpdateDayAttractions]);

  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Handle country selection
  const handleCountrySelect = (country: string) => {
    setTripSummary(prev => ({ ...prev, country }));
    setShowCountries(false);
    setCountrySearch('');
  };

  const handleDiscoverSelect = (index: number, attractions: string[]) => {
    const updatedDays = [...itineraryDays];
    updatedDays[index].discover = attractions.join(', ');
    setItineraryDays(updatedDays);
  };

  const handleDestinationsUpdate = (updatedDestinations: typeof itineraryDays) => {
    setItineraryDays(updatedDestinations);
  };

  // Update handleDayAttractionsUpdate to preserve state
  const handleDayAttractionsUpdate = (dayIndex: number, attractions: string[]) => {
    console.log('Updating attractions for day:', dayIndex, attractions); // Debug log
    setDayAttractions(prev => {
      const existingDayIndex = prev.findIndex(da => da.dayIndex === dayIndex);
      let newState;

      if (existingDayIndex >= 0) {
        // Update existing day
        newState = prev.map(da =>
          da.dayIndex === dayIndex
            ? { ...da, selectedAttractions: attractions }
            : da
        );
      } else {
        // Add new day
        newState = [...prev, { dayIndex, selectedAttractions: attractions }];
      }

      console.log('New day attractions state:', newState); // Debug log
      return newState;
    });
  };

  // Update handleNightsChange to trigger recalculation
  const handleNightsChange = (index: number, change: 'increment' | 'decrement') => {
    const updatedDays = [...itineraryDays];
    const oldNights = updatedDays[index].nights;

    if (change === 'increment') {
      updatedDays[index].nights += 1;
    } else {
      updatedDays[index].nights = Math.max(0, updatedDays[index].nights - 1);
    }

    // Calculate the start day index for this destination
    let startDayIndex = 0;
    for (let i = 0; i < index; i++) {
      startDayIndex += itineraryDays[i].nights;
    }

    // Get the hotel for this destination
    const destinationHotel = updatedDays[index].hotel;

    // Update day hotels
    const updatedHotels = [...dayHotels];

    if (change === 'increment') {
      // Add new hotel entry for the added day
      if (destinationHotel) {
        const newDayIndex = startDayIndex + oldNights;
        updatedHotels.push({
          dayIndex: newDayIndex,
          hotel: destinationHotel,
          isManual: false
        });
      }
    } else {
      // Remove hotel entry for the removed day
      const removedDayIndex = startDayIndex + updatedDays[index].nights;
      const hotelIndex = updatedHotels.findIndex(h => h.dayIndex === removedDayIndex);
      if (hotelIndex !== -1) {
        updatedHotels.splice(hotelIndex, 1);
      }
    }

    // Adjust day indices for all subsequent hotels
    let currentDayCount = 0;
    for (let i = 0; i < updatedDays.length; i++) {
      const dest = updatedDays[i];
      const destStartIndex = currentDayCount;
      const destEndIndex = currentDayCount + dest.nights;

      // Update indices for hotels in this destination
      updatedHotels.forEach(hotel => {
        if (hotel.dayIndex >= destStartIndex && hotel.dayIndex < destEndIndex) {
          hotel.hotel = dest.hotel || '';
        }
      });

      currentDayCount += dest.nights;
    }

    setItineraryDays(updatedDays);
    setDayHotels(updatedHotels);
    setShouldUpdateDayAttractions(true);
  };

  const handleDeleteDestination = (indexToDelete: number) => {
    // Don't allow deletion if only one destination remains
    if (itineraryDays.length <= 1) {
      return;
    }

    setItineraryDays(prev => prev.filter((_, index) => index !== indexToDelete));

    // Update day attractions after deletion
    setDayAttractions(prev => {
      const newDayAttractions = [...prev];
      // Recalculate day indices after deletion
      return newDayAttractions.filter(da =>
        Math.floor(da.dayIndex / itineraryDays.length) !== indexToDelete
      ).map(da => ({
        ...da,
        dayIndex: da.dayIndex > indexToDelete ? da.dayIndex - 1 : da.dayIndex
      }));
    });
  };

  // Add new handler for day hotels update
  const handleDayHotelsUpdate = (updatedHotels: DayHotel[]) => {
    setDayHotels(updatedHotels);

    // Update the destinations array
    const updatedDestinations = [...itineraryDays];
    let currentDayCount = 0;

    for (let i = 0; i < updatedDestinations.length; i++) {
      const dest = updatedDestinations[i];
      const destDayIndices = Array.from(
        { length: dest.nights },
        (_, index) => currentDayCount + index
      );

      // Get all hotels for this destination's days
      const destHotels = updatedHotels.filter(h =>
        destDayIndices.includes(h.dayIndex)
      );

      // Update the destination's hotel if any hotels are assigned to its days
      updatedDestinations[i] = {
        ...dest,
        hotel: destHotels.length > 0 ? destHotels[0].hotel : undefined
      };

      currentDayCount += dest.nights;
    }

    setItineraryDays(updatedDestinations);
  };

  const handleHotelSelect = (hotel: string, isManual?: boolean) => {
    if (currentDestinationIndexForHotel >= 0) {
      if (activeTab === 'destinations') {
        // Update the specific destination's hotel
        const updatedDestinations = [...itineraryDays];
        updatedDestinations[currentDestinationIndexForHotel] = {
          ...updatedDestinations[currentDestinationIndexForHotel],
          hotel  // Store hotel in the destination
        };
        setItineraryDays(updatedDestinations);

        // Calculate the start and end day indices for the selected destination
        let startDayIndex = 0;
        for (let i = 0; i < currentDestinationIndexForHotel; i++) {
          startDayIndex += itineraryDays[i].nights || 0;
        }
        const endDayIndex = startDayIndex + (itineraryDays[currentDestinationIndexForHotel].nights || 0);

        // Update day hotels for this destination's days
        const updatedHotels = dayHotels.filter(h =>
          h.dayIndex < startDayIndex || h.dayIndex >= endDayIndex
        );

        // Add new hotel entries for each day in this destination
        for (let dayIndex = startDayIndex; dayIndex < endDayIndex; dayIndex++) {
          updatedHotels.push({
            dayIndex,
            hotel,
            isManual
          });
        }

        setDayHotels(updatedHotels);
      } else {
        // Day by Day view - update only the selected day
        const updatedHotels = dayHotels.filter(h => h.dayIndex !== currentDestinationIndexForHotel);
        updatedHotels.push({
          dayIndex: currentDestinationIndexForHotel,
          hotel,
          isManual
        });
        setDayHotels(updatedHotels);
      }
      setIsHotelSearchOpen(false);
    }
  };

  const handleDayFoodSelect = (destination: string, index: number) => {
    // Calculate the start day index for this destination
    let startDayIndex = 0;
    for (let i = 0; i < index; i++) {
      startDayIndex += itineraryDays[i].nights;
    }

    // Get all food items for this destination's days
    const foodItems = new Set<string>();
    for (let i = 0; i < itineraryDays[index].nights; i++) {
      const dayFood = dayFoods.find(f => f.dayIndex === startDayIndex + i);
      if (dayFood && dayFood.foodItems) {
        dayFood.foodItems.forEach(item => foodItems.add(item));
      }
    }

    setActiveDestinationIndexForFood(index);
    setShowFoodPopup(true);
  };

  const handleFoodSelect = (dayIndex: number, foodItems: string[]) => {
    // Clean the food items first
    const cleanedFoodItems = [...new Set(
      foodItems
        .map(item => item.trim())
        .filter(item => item.length > 0)
    )];

    // Calculate the start day index for this destination
    let startDayIndex = 0;
    for (let i = 0; i < dayIndex; i++) {
      startDayIndex += itineraryDays[i].nights;
    }

    // Update food items for all days of this destination
    const updatedDayFoods = [...dayFoods];

    // First, ensure we have entries for all days of this destination
    for (let i = 0; i < itineraryDays[dayIndex].nights; i++) {
      const currentDayIndex = startDayIndex + i;
      const existingIndex = updatedDayFoods.findIndex(f => f.dayIndex === currentDayIndex);

      if (existingIndex === -1) {
        updatedDayFoods.push({
          dayIndex: currentDayIndex,
          foodItems: cleanedFoodItems // Set food items for all days
        });
      } else {
        // Update food items for all days
        updatedDayFoods[existingIndex] = {
          ...updatedDayFoods[existingIndex],
          foodItems: cleanedFoodItems
        };
      }
    }

    // Update dayFoods state
    setDayFoods(updatedDayFoods);

    // Update itineraryDays state with the food items
    const updatedItineraryDays = [...itineraryDays];
    updatedItineraryDays[dayIndex] = {
      ...updatedItineraryDays[dayIndex],
      food: cleanedFoodItems.join(', ')
    };
    setItineraryDays(updatedItineraryDays);

    console.log('Updated food items:', {
      dayFoods: updatedDayFoods,
      itineraryDays: updatedItineraryDays[dayIndex].food
    });

    // Close the popup
    setShowFoodPopup(false);
    setActiveDestinationIndexForFood(null);
  };

  const renderDestinationsGrid = () => {
    return (
      <div className="space-y-4">
        {/* Column Headers */}
        <div className="grid grid-cols-[1fr,140px,200px,120px,120px,160px] gap-4 px-4 py-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#00C48C]/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-[#00C48C]" />
            </div>
            <span className="font-[600] font-['Poppins',sans-serif]">DESTINATION</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#6366F1]/10 flex items-center justify-center">
              <Moon className="w-4 h-4 text-[#6366F1]" />
            </div>
            <span className="font-[600] font-['Poppins',sans-serif]">NIGHTS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
              <Bed className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <span className="font-[600] font-['Poppins',sans-serif]">SLEEPING</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#EC4899]/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#EC4899]" />
            </div>
            <span className="font-[600] font-['Poppins',sans-serif]">DISCOVER</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center">
              <Utensils className="w-4 h-4 text-[#8B5CF6]" />
            </div>
            <span className="font-[600] font-['Poppins',sans-serif]">FOOD</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center">
              <Transport className="w-5 h-5 text-pink-500" />
            </div>
            <span className="font-[600] font-['Poppins',sans-serif]">TRANSPORT</span>
          </div>
        </div>

        {/* Destinations List */}
        <div className="space-y-2">
          {itineraryDays.map((day, index) => (
            <React.Fragment key={index}>
              <div className="grid grid-cols-[1fr,140px,200px,120px,120px,160px] gap-4 items-center bg-white rounded-lg px-4 py-3 hover:shadow-sm transition-shadow">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="relative group">
                      <div className="w-6 h-6 rounded-full bg-[#00C48C]/10 flex items-center justify-center text-sm font-medium text-[#00C48C]">
                        {index + 1}
                      </div>
                      <button
                        onClick={() => {
                          const newDays = [...itineraryDays];
                          newDays.splice(index, 1);
                          setItineraryDays(newDays);
                        }}
                        className="absolute -right-2 -top-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div>
                      <PlaceAutocomplete
                        value={day.destination.split(',')[0]}
                        onChange={(value) => handleDayUpdate(index, 'destination', value)}
                        country={tripSummary.country}
                        onPlaceSelect={(place) => {
                          console.log('Selected place:', place);
                          handleDayUpdate(index, 'destination', place.name || '');
                        }}
                        startDate=""
                        nights={0}
                        className="font-['Inter_var'] font-[600]"
                      />
                      <div className="text-sm text-[#64748B] mt-1">
                        {formatDateRange(index)}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleDayUpdate(index, 'nights', Math.max(1, day.nights - 1))}
                      className="w-10 h-10 flex items-center justify-center text-[#64748B] hover:bg-gray-100 rounded-full font-['Inter_var'] font-[600] text-2xl"
                    >
                      -
                    </button>
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="font-[600] font-['Inter_var'] text-[#1E293B] text-xl">{day.nights}</span>
                    </div>
                    <button
                      onClick={() => handleDayUpdate(index, 'nights', day.nights + 1)}
                      className="w-10 h-10 flex items-center justify-center text-[#64748B] hover:bg-gray-100 rounded-full font-['Inter_var'] font-[600] text-2xl"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  {day.hotel || dayHotels.find(h => h.dayIndex === index)?.hotel ? (
                    <div className="text-sm group relative flex items-start justify-start flex-col">
                      <button
                        onClick={() => {
                          setCurrentDestinationForHotel(day.destination);
                          setCurrentDestinationIndexForHotel(index);
                          setIsHotelSearchOpen(true);
                        }}
                        className="font-['Inter_var'] font-[600] text-[#1E293B] hover:text-[#00C48C] transition-colors"
                      >
                        <span className="max-w-[160px]">
                          {day.hotel || dayHotels.find(h => h.dayIndex === index)?.hotel}
                        </span>
                      </button>
                      <div className="text-xs text-[#64748B]">To be booked</div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-start">
                      <button
                        onClick={() => {
                          setCurrentDestinationForHotel(day.destination);
                          setCurrentDestinationIndexForHotel(index);
                          setIsHotelSearchOpen(true);
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#F59E0B] hover:bg-[#F59E0B]/10 border border-[#F59E0B]"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  {day.discover ? (
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => {
                          setActiveDestinationIndex(index);
                          setShowDiscoverPopup(true);
                        }}
                        className="font-['Inter_var'] font-[600] text-[#1E293B] hover:text-[#00C48C] transition-colors"
                      >
                        {day.discover.split(',').length} to do's
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => {
                          setActiveDestinationIndex(index);
                          setShowDiscoverPopup(true);
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#EC4899] hover:bg-[#EC4899]/10 border border-[#EC4899]"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  {(() => {
                    // Calculate the start day index for this destination
                    let startDayIndex = 0;
                    for (let i = 0; i < index; i++) {
                      startDayIndex += itineraryDays[i].nights;
                    }

                    // Get all food items for this destination's days
                    const foodItems = new Set<string>();
                    for (let i = 0; i < day.nights; i++) {
                      const dayFood = dayFoods.find(f => f.dayIndex === startDayIndex + i);
                      if (dayFood && dayFood.foodItems) {
                        dayFood.foodItems.forEach(item => foodItems.add(item));
                      }
                    }

                    return foodItems.size > 0 ? (
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => {
                            handleDayFoodSelect(day.destination, index);
                          }}
                          className="font-['Inter_var'] font-[600] text-[#1E293B] hover:text-[#00C48C] transition-colors"
                        >
                          {`${foodItems.size} food spots`}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => {
                            handleDayFoodSelect(day.destination, index);
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[#8B5CF6] hover:bg-[#8B5CF6]/10 border border-[#8B5CF6]"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2">
                    {/* Remove the + button from here since we'll show it in the divider */}
                  </div>
                </div>
              </div>
              {index < itineraryDays.length - 1 && (
                <div className="relative -mt-3">
                  <div className="border-b-2 border-gray-300"></div>
                  {/* Transport icon overlapping the divider */}
                  <div className="grid grid-cols-[1fr,140px,200px,120px,120px,160px] gap-4">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div className="relative">
                      {day.transport ? (
                        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4">
                          <button
                            onClick={() => {
                              console.log('Transport icon clicked');
                              setCurrentDestinationForTransport({
                                from: day.destination,
                                to: index < itineraryDays.length - 1 ? itineraryDays[index + 1].destination : '',
                                index
                              });
                              setShowTransportPopup(true);
                            }}
                            className="flex flex-col items-center text-center hover:opacity-80 transition-opacity"
                          >
                            <div>
                              {day.transport.includes('Drive') && (
                                <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center">
                                  <Car className="w-5 h-5 text-pink-500" />
                                </div>
                              )}
                              {day.transport.includes('Flight') && (
                                <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center">
                                  <Plane className="w-5 h-5 text-pink-500" />
                                </div>
                              )}
                              {day.transport.includes('Train') && (
                                <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center">
                                  <Train className="w-5 h-5 text-pink-500" />
                                </div>
                              )}
                              {day.transport.includes('Bus') && (
                                <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center">
                                  <BusIcon className="w-5 h-5 text-pink-500" />
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-pink-500 font-['Inter_var'] font-[600]">
                              {day.transport.split(' · ')[1]}
                            </div>
                          </button>
                        </div>
                      ) : (
                        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4">
                          <button
                            onClick={() => {
                              setCurrentDestinationForTransport({
                                from: day.destination,
                                to: index < itineraryDays.length - 1 ? itineraryDays[index + 1].destination : '',
                                index
                              });
                              setShowTransportPopup(true);
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center border text-pink-500 hover:bg-pink-500/10 border-pink-500"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Add Destination Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => {
              setItineraryDays([
                ...itineraryDays,
                { destination: '', nights: 1, discover: '', transport: '', notes: '', food: '' }
              ]);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-[#00C48C] transition-colors font-['Inter_var'] font-[600]"
          >
            <Plus className="w-6 h-6" />
            Add new destination...
          </button>
          <button className="ml-2 px-4 py-2 text-sm text-gray-600 hover:text-[#00C48C] bg-gray-50 rounded-lg transition-colors">
            Discover
          </button>
          <button className="ml-2 px-4 py-2 text-sm text-gray-600 hover:text-[#00C48C] bg-gray-50 rounded-lg transition-colors">
            Collection
          </button>
        </div>
      </div>
    );
  };

  // Add this helper function to calculate distance (you'll need to implement the actual calculation)
  const calculateDistance = (from: string, to: string) => {
    // This is a placeholder. You'll need to implement actual distance calculation
    // For now, returning random distances for demonstration
    return Math.floor(Math.random() * 500);
  };

  // Update the save button text based on mode
  const saveButtonText = itineraryId ? 'Update Itinerary' : 'Save Itinerary';

  const handleTripSummaryUpdate = (updatedSummary: typeof tripSummary) => {
    setTripSummary(updatedSummary);
    setShowTripSummaryEdit(false);
  };

  // Add new handler for transport selection
  const handleTransportSelect = (index: number, transportDetails: string) => {
    const updatedDays = [...itineraryDays];
    updatedDays[index].transport = transportDetails;
    setItineraryDays(updatedDays);
    setShowTransportPopup(false);
    setCurrentDestinationForTransport(null);
  };

  const handleDayNotesUpdate = (updatedNotes: DayNote[]) => {
    setDayNotes(updatedNotes);
  };

  if (!showSummaryPopup) {
    return (
      <div className="min-h-screen">
        <TopNavigation />
        {/* Add all popups at root level */}
        {showTransportPopup && currentDestinationForTransport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <TransportPopup
              isOpen={showTransportPopup}
              onClose={() => {
                setShowTransportPopup(false);
                setCurrentDestinationForTransport(null);
              }}
              fromDestination={currentDestinationForTransport.from}
              toDestination={currentDestinationForTransport.to}
              onTransportSelect={(transportDetails) => {
                handleTransportSelect(currentDestinationForTransport.index, transportDetails);
              }}
            />
          </div>
        )}

        {isHotelSearchOpen && currentDestinationForHotel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <HotelSearchPopup
              isOpen={isHotelSearchOpen}
              onClose={() => {
                setIsHotelSearchOpen(false);
                setCurrentDestinationForHotel('');
              }}
              destination={currentDestinationForHotel}
              selectedHotel={itineraryDays[currentDestinationIndexForHotel]?.hotel || dayHotels.find(h => h.dayIndex === currentDestinationIndexForHotel)?.hotel}
              onHotelSelect={(hotel) => handleHotelSelect(hotel)}
            />
          </div>
        )}

        {showFoodPopup && activeDestinationIndexForFood !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <FoodPopup
              isOpen={showFoodPopup}
              onClose={() => {
                setShowFoodPopup(false);
                setActiveDestinationIndexForFood(null);
              }}
              destination={itineraryDays[activeDestinationIndexForFood]?.destination || ''}
              selectedFoodItems={(() => {
                if (activeDestinationIndexForFood === null) return [];

                // Calculate start day index for the active destination
                let startDayIndex = 0;
                for (let i = 0; i < activeDestinationIndexForFood; i++) {
                  startDayIndex += itineraryDays[i].nights;
                }

                // Get all food items for this destination's days
                const foodItems = new Set<string>();
                for (let i = 0; i < itineraryDays[activeDestinationIndexForFood].nights; i++) {
                  const dayFood = dayFoods.find(df => df.dayIndex === startDayIndex + i);
                  if (dayFood && dayFood.foodItems) {
                    dayFood.foodItems.forEach(item => foodItems.add(item));
                  }
                }
                return Array.from(foodItems);
              })()}
              onFoodSelect={(foodItems) => {
                if (activeDestinationIndexForFood !== null) {
                  handleFoodSelect(activeDestinationIndexForFood, foodItems);
                }
              }}
            />
          </div>
        )}

        {showDiscoverPopup && activeDestinationIndex !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <DiscoverPopup
              isOpen={showDiscoverPopup}
              onClose={() => {
                setShowDiscoverPopup(false);
                setActiveDestinationIndex(null);
              }}
              destination={itineraryDays[activeDestinationIndex].destination}
              selectedAttractions={itineraryDays[activeDestinationIndex].discover.split(',').filter(Boolean)}
              onAttractionsSelect={(attractions) => handleDiscoverSelect(activeDestinationIndex, attractions)}
            />
          </div>
        )}

        {showTripSummaryEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <TripSummaryEdit
              tripSummary={tripSummary}
              onClose={() => setShowTripSummaryEdit(false)}
              onUpdate={handleTripSummaryUpdate}
            />
          </div>
        )}
        <div className="pt-[60px]">
          <div className="min-h-screen">
            <div className="max-w-[1400px] mx-auto px-4 py-6">
              {/* Main Content Area */}
              <div className="flex gap-8">
                {/* Left Sidebar */}
                <div className="w-[240px] flex-shrink-0">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-[600] font-['Poppins',sans-serif] text-[#1e293b]">Trip Summary</h2>
                      <button
                        onClick={() => setShowTripSummaryEdit(true)}
                        className="p-2 text-gray-500 hover:text-[#00C48C] rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trip Name</label>
                        <input
                          type="text"
                          name="tripName"
                          value={tripSummary.tripName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all"
                          placeholder="Enter trip name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            onFocus={() => setShowCountries(true)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all"
                            placeholder="Select country"
                          />
                          {showCountries && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                              {filteredCountries.map(country => (
                                <button
                                  key={country}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                                  onClick={() => {
                                    setTripSummary(prev => ({ ...prev, country }));
                                    setCountrySearch(country);
                                    setShowCountries(false);
                                  }}
                                >
                                  {country}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                          <input
                            type="number"
                            name="duration"
                            value={tripSummary.duration}
                            onChange={handleInputChange}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Travelers</label>
                          <input
                            type="number"
                            name="passengers"
                            value={tripSummary.passengers}
                            onChange={handleInputChange}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          name="startDate"
                          value={tripSummary.startDate}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="mt-4">
                        <label className="flex items-center justify-between text-sm font-medium text-gray-700">
                          <span>Privacy</span>
                          <button
                            type="button"
                            onClick={() => setTripSummary(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${tripSummary.isPrivate ? 'bg-[#00C48C]' : 'bg-gray-200'
                              }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tripSummary.isPrivate ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                          </button>
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                          {tripSummary.isPrivate ? 'Only you can view this itinerary' : 'Anyone with the link can view this itinerary'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    {/* Header with Nights Planned and Tabs */}
                    <div className="border-b border-gray-200">
                      {/* Tabs and Nights Planned in same row */}
                      <div className="flex items-center justify-between">
                        {/* Tabs */}
                        <div className="flex items-center gap-8 border-b border-gray-200">
                          <button
                            onClick={() => setActiveTab('destinations')}
                            className={`py-4 px-2 font-['Inter_var'] font-[600] border-b-2 -mb-[1px] transition-colors ${activeTab === 'destinations'
                              ? 'text-[rgb(0,179,128)] border-[rgb(0,179,128)]'
                              : 'text-gray-500 border-transparent hover:text-[rgb(0,179,128)]'
                              }`}
                          >
                            Destinations
                          </button>
                          <button
                            onClick={() => setActiveTab('day-by-day')}
                            className={`py-4 px-2 font-['Inter_var'] font-[600] border-b-2 -mb-[1px] transition-colors ${activeTab === 'day-by-day'
                              ? 'text-[rgb(0,179,128)] border-[rgb(0,179,128)]'
                              : 'text-gray-500 border-transparent hover:text-[rgb(0,179,128)]'
                              }`}
                          >
                            Day by Day
                          </button>
                        </div>

                        {/* Nights Planned Indicator */}
                        <div className="flex items-center gap-3 pr-6">
                          <div className="relative h-20 w-20">
                            <svg className="transform -rotate-90" width="80" height="80">
                              <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="#E5E7EB"
                                strokeWidth="4"
                                fill="#f8fafc"
                              />
                              <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="#00C48C"
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray={`${(totalNights / tripSummary.duration) * 226.2} 226.2`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-2xl font-[600] font-['Inter_var'] text-[#00C48C]">
                              {totalNights}/{tripSummary.duration}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-[600] font-['Inter_var'] text-[#1e293b] text-lg">Nights</span>
                            <span className="text-sm text-gray-500">planned</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {activeTab === 'destinations' ? (
                      <div className="mt-6">
                        {renderDestinationsGrid()}
                      </div>
                    ) : (
                      <div className="mt-6">
                        <DayByDayGrid
                          tripStartDate={tripSummary.startDate}
                          destinations={itineraryDays}
                          onDestinationsUpdate={handleDestinationsUpdate}
                          dayAttractions={dayAttractions}
                          onDayAttractionsUpdate={handleDayAttractionsUpdate}
                          dayHotels={dayHotels}
                          onDayHotelsUpdate={handleDayHotelsUpdate}
                          dayNotes={dayNotes}
                          onDayNotesUpdate={handleDayNotesUpdate}
                          onHotelClick={(destination, dayIndex) => {
                            setCurrentDestinationForHotel(destination);
                            setCurrentDestinationIndexForHotel(dayIndex);
                            setIsHotelSearchOpen(true);
                          }}
                          onNotesClick={(destination, dayIndex) => {
                            const currentNotes = dayNotes.find(n => n.dayIndex === dayIndex)?.notes || '';
                            const updatedNotes = [...dayNotes];
                            const noteIndex = updatedNotes.findIndex(n => n.dayIndex === dayIndex);
                            if (noteIndex !== -1) {
                              updatedNotes[noteIndex].notes = currentNotes;
                            } else {
                              updatedNotes.push({ dayIndex, notes: currentNotes });
                            }
                            handleDayNotesUpdate(updatedNotes);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-6 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-6 py-2 bg-[#00C48C] text-white rounded-lg hover:bg-[#00B380] transition-colors shadow-sm flex items-center gap-2"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span>{saveButtonText}</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    // Semi-transparent overlay
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Popup content */}
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-[600] font-['Poppins',sans-serif] mb-4">Trip Summary</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label htmlFor="tripName" className="block text-sm font-medium text-gray-700 mb-1">
              Trip Name
            </label>
            <input
              type="text"
              id="tripName"
              name="tripName"
              value={tripSummary.tripName}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Enter trip name"
              required
            />
          </div>

          {/* Add Country Selector */}
          <div className="relative">
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <div className="relative">
              <input
                type="text"
                value={tripSummary.country || countrySearch}
                onChange={(e) => {
                  setCountrySearch(e.target.value);
                  setShowCountries(true);
                  if (tripSummary.country) {
                    setTripSummary(prev => ({ ...prev, country: '' }));
                  }
                }}
                onFocus={() => setShowCountries(true)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Select a country"
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowCountries(!showCountries)}
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Countries dropdown */}
            {showCountries && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto">
                {filteredCountries.map((country, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => handleCountrySelect(country)}
                  >
                    {country}
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No countries found
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration (days)
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              min="1"
              value={tripSummary.duration}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={tripSummary.startDate}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <label htmlFor="passengers" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Passengers
            </label>
            <input
              type="number"
              id="passengers"
              name="passengers"
              min="1"
              value={tripSummary.passengers}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProceed}
              className="px-4 py-2 text-sm text-white bg-rose-500 rounded-md hover:bg-rose-600"
            >
              Proceed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateItinerary; 