import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cleanDestination } from '../utils/stringUtils';
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
import DayHotelSearchPopup from '../components/DayHotelSearchPopup';
import TransportPopup from '../components/TransportPopup';
import FoodPopup from '../components/FoodPopup';
import TopNavigation from '../components/TopNavigation';
import MapboxMap from '../components/MapboxMap';
import DestinationDiscover from '../components/DestinationDiscover';
import { toast } from 'react-toastify';
import NotesPopup from '../components/NotesPopup';

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
  tempDestination?: string; // Temporary value for display during autocomplete
  nights: number;
  discover: string;
  manual_discover: string;
  manual_discover_desc: string;
  transport: string;
  notes: string;
  food: string;
  food_desc?: string;
  hotel?: string;
  manual_hotel?: string;
  manual_hotel_desc?: string;
  order_index?: number;
}

interface TripSummary {
  tripName: string;
  country: string;
  duration: number;
  startDate: string;
  passengers: number;
  isPrivate: boolean;
  tags: string[];
  tripDescription: string;
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
  trip_description: string;
  destinations: Array<{
    destination: string;
    nights: number;
    discover: string;
    transport: string;
    notes: string;
    food: string;
    manual_hotel: string;
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

interface DayFood {
  dayIndex: number;
  foodItems: FoodItem[];
  foodDesc: string;
}

interface FoodItem {
  id: string;
  name: {
    text: string;
    cuisine: string;
    known_for: string;
  };
}

// Utility functions
const formatDate = (date: Date) => {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);

  // Convert "Mon, Mar 14, 2025" to "Mon 14 Mar 2025"
  const [weekday, month, day, year] = formattedDate.replace(',', '').split(' ');
  return `${weekday} ${day} ${month} ${year}`;
};

interface Destination {
  nights: number;
  discover?: Array<{ name: string }>;
  manual_discover?: Array<{ name: string }>;
  food?: Array<{
    id: string;
    name: string;
    cuisine: string;
    known_for: string;
  }>;
}

// Add interface at the top with other interfaces
interface ItineraryDestination {
  destination: string;
  nights: number;
  discover: string;
  transport: string;
  notes: string;
  food: string;
  food_desc: string;
  hotel?: string;
  manual_hotel: string;
  manual_hotel_desc: string;
  manual_discover: string;
  manual_discover_desc: string;
  order_index: number;
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
    duration: 0,
    startDate: new Date().toISOString().split('T')[0],
    passengers: 1,
    isPrivate: false,
    tags: [],
    tripDescription: ''
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
  const [isDayHotelSearchOpen, setIsDayHotelSearchOpen] = useState(false);
  const [currentDestinationForHotel, setCurrentDestinationForHotel] = useState<string>('');
  const [currentDestinationIndexForHotel, setCurrentDestinationIndexForHotel] = useState<number>(-1);
  const [dayHotels, setDayHotels] = useState<DayHotel[]>([]);
  const [dayHotelDesc, setDayHotelDesc] = useState<string>('');
  const [showTransportPopup, setShowTransportPopup] = useState(false);
  const [currentDestinationForTransport, setCurrentDestinationForTransport] = useState<{
    from: string;
    to: string;
    index: number;
  } | null>(null);
  const [dayNotes, setDayNotes] = useState<DayNote[]>([]);
  const [showFoodPopup, setShowFoodPopup] = useState(false);
  const [activeDestinationIndexForFood, setActiveDestinationIndexForFood] = useState<number | null>(null);
  const [dayFoods, setDayFoods] = useState<DayFood[]>([]);
  const [showTripSummary, setShowTripSummary] = useState(false);
  const [isMapCollapsed, setIsMapCollapsed] = useState(false);
  const [currentDestinationForFood, setCurrentDestinationForFood] = useState('');
  const [currentDestinationIndexForFood, setCurrentDestinationIndexForFood] = useState<number | null>(null);
  const [showDestinationDiscover, setShowDestinationDiscover] = useState(false);
  const [activeDestinationForDiscover, setActiveDestinationForDiscover] = useState<string>('');
  // Add a state to track if we're in day-by-day view
  const [isDayByDayView, setIsDayByDayView] = useState(false);
  const [showNotesPopup, setShowNotesPopup] = useState(false);
  const [selectedDayForNotes, setSelectedDayForNotes] = useState<{
    dayIndex: number;
    notes: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Add available tags constant
  const AVAILABLE_TAGS = [
    { id: 'family', label: 'Family Friendly' },
    { id: 'bucket-list', label: 'Bucket List' },
    { id: 'popular', label: 'Most Popular' },
    { id: 'adventure', label: 'Adventure' },
    { id: 'short', label: 'Short Trip' },
    { id: 'multi-country', label: 'Multi Country' },
    { id: 'europe', label: 'Europe' },
    { id: 'mountains', label: 'Mountains' },
    { id: 'beach', label: 'Beach' },
    { id: 'city', label: 'City' },
    { id: 'hiking', label: 'Hiking' },
    { id: 'food', label: 'Food' },
    { id: 'museum', label: 'Museum' },
    { id: 'history', label: 'History' }
  ];

  // Add a state variable to track if we've already synced hotel descriptions
  const [hasSyncedHotelDescriptions, setHasSyncedHotelDescriptions] = useState(false);

  // Add a new state to cache hotel descriptions to avoid repeated fetches
  const [hotelDescriptionCache, setHotelDescriptionCache] = useState<Record<number, string>>({});

  // Add a new state to manually trigger sync
  const [triggerSync, setTriggerSync] = useState(false);

  // Add state for day-by-day data
  const [dayByDayData, setDayByDayData] = useState<{
    dayAttractions: Array<{
      dayIndex: number;
      selectedAttractions: string[];
    }>;
    dayFoodOptions: FoodItem[][];
  }>({
    dayAttractions: [],
    dayFoodOptions: []
  });

  useEffect(() => {
    const loadExistingItinerary = async () => {
      if (itineraryId) {
        try {
          setLoading(true);
          const { data: itinerary, error } = await supabase
            .from('user_itineraries')
            .select(`
              *,
              destinations:user_itinerary_destinations(*)
            `)
            .eq('id', itineraryId)
            .single();

          if (error) throw error;

          if (itinerary) {
            setTripSummary({
              tripName: itinerary.trip_name,
              country: itinerary.country,
              duration: itinerary.duration,
              startDate: itinerary.start_date,
              passengers: itinerary.passengers,
              isPrivate: itinerary.is_private,
              tags: itinerary.tags || [],
              tripDescription: itinerary.trip_description || ''
            });
            setCountrySearch(itinerary.country);

            // Update the sorting line with proper types
            const sortedDestinations = (itinerary.destinations || [] as ItineraryDestination[]).sort(
              (a: ItineraryDestination, b: ItineraryDestination) => a.order_index - b.order_index
            );

            // Set destinations with their specific hotels and manual_discover
            const destinationsWithHotels = sortedDestinations.map((dest: ItineraryDestination) => ({
              destination: cleanDestination(dest.destination),
              nights: dest.nights,
              discover: dest.discover || '',
              manual_discover: dest.manual_discover || '',
              manual_discover_desc: dest.manual_discover_desc || '',
              transport: dest.transport || '',
              notes: dest.notes || '',
              food: dest.food || '',
              food_desc: dest.food_desc || '',
              hotel: dest.hotel || '',
              manual_hotel: dest.manual_hotel || '',
              manual_hotel_desc: dest.manual_hotel_desc || ''
            }));

            console.log('Setting sorted destinations with hotels:', destinationsWithHotels);
            setItineraryDays(destinationsWithHotels);

            // Load hotels from user_itinerary_day_hotels table
            const { data: dayHotelsData, error: dayHotelsError } = await supabase
              .from('user_itinerary_day_hotels')
              .select('day_index, hotel, hotel_desc')
              .eq('itinerary_id', itineraryId)
              .order('day_index');

            if (dayHotelsError) {
              console.error('Error loading day hotels:', dayHotelsError);
            } else {
              // Initialize dayHotels from user_itinerary_day_hotels
              const newDayHotels: DayHotel[] = dayHotelsData.map((dh: any) => ({
                dayIndex: dh.day_index,
                hotel: dh.hotel || '',
                isManual: true
              }));

              // If there are missing days, fill them with hotels from destinations
              let hotelDayIndex = 0;
              destinationsWithHotels.forEach((dest: any) => {
                const hotelName = dest.manual_hotel || dest.hotel || '';
                for (let i = 0; i < dest.nights; i++) {
                  const dayIndex = hotelDayIndex + i;
                  if (!newDayHotels.some(h => h.dayIndex === dayIndex)) {
                    newDayHotels.push({
                      dayIndex,
                      hotel: hotelName,
                      isManual: Boolean(dest.manual_hotel)
                    });
                  }
                }
                hotelDayIndex += dest.nights;
              });

              // Sort hotels by day index
              newDayHotels.sort((a, b) => a.dayIndex - b.dayIndex);
              console.log('Setting day hotels from user_itinerary_day_hotels:', newDayHotels);
              setDayHotels(newDayHotels);

              // Cache hotel descriptions
              const descriptionCache: Record<number, string> = {};
              dayHotelsData.forEach((dh: any) => {
                if (dh.hotel_desc) {
                  descriptionCache[dh.day_index] = dh.hotel_desc;
                }
              });
              setHotelDescriptionCache(descriptionCache);
            }

            // Initialize dayFoods from sorted destinations
            let currentDayIndex = 0;
            const newDayFoods: DayFood[] = [];

            destinationsWithHotels.forEach((dest: any) => {
              const foodItems = dest.food ? dest.food.split(', ').filter(Boolean).map((text: string, idx: number) => {
                const [cuisine = '', known_for = ''] = (dest.food_desc || '').split(',')[idx]?.split('-').map((s: string) => s.trim()) || [];
                return {
                  id: Math.random().toString(36).substring(7),
                  name: {
                    text: text.trim(),
                    cuisine,
                    known_for
                  }
                };
              }) : [];

              // For each night in the destination, add the food items
              for (let i = 0; i < dest.nights; i++) {
                newDayFoods.push({
                  dayIndex: currentDayIndex + i,
                  foodItems: i === 0 ? foodItems : [], // Only set food items for the first day
                  foodDesc: i === 0 ? dest.food_desc || '' : ''
                });
              }

              currentDayIndex += dest.nights;
            });

            console.log('Setting day foods:', newDayFoods);
            setDayFoods(newDayFoods);

            // Set day attractions from manual_discover
            if (itinerary.destinations) {
              console.log('Setting day attractions from manual_discover:', itinerary.destinations);
              let dayIndex = 0;
              const attractions = itinerary.destinations.flatMap((dest: any) => {
                const manualAttractions = dest.manual_discover ? dest.manual_discover.split(', ').filter(Boolean) : [];
                const regularAttractions = dest.discover ? dest.discover.split(', ').filter(Boolean) : [];
                const result = [];

                for (let i = 0; i < dest.nights; i++) {
                  result.push({
                    dayIndex: dayIndex + i,
                    selectedAttractions: i === 0 ? [...regularAttractions, ...manualAttractions] : []
                  });
                }
                dayIndex += dest.nights;
                return result;
              });

              setDayAttractions(attractions);
              setIsDayAttractionsInitialized(true);
            }

            // Set day notes
            if (itinerary.day_notes) {
              console.log('Setting day notes:', itinerary.day_notes);
              setDayNotes(itinerary.day_notes.map((dn: any) => ({
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

  // Initialize day-by-day data when itinerary days change
  useEffect(() => {
    if (!itineraryDays?.length) return;

    const newDayAttractions: Array<{
      dayIndex: number;
      selectedAttractions: string[];
    }> = [];
    const newDayFoodOptions: FoodItem[][] = [];

    let currentDayIndex = 0;
    itineraryDays.forEach((destination) => {
      for (let night = 0; night < destination.nights; night++) {
        // Process attractions
        const dayAttractions = destination.discover ? [destination.discover] : [];
        const manualAttractions = destination.manual_discover ? [destination.manual_discover] : [];
        newDayAttractions.push({
          dayIndex: currentDayIndex,
          selectedAttractions: [...dayAttractions, ...manualAttractions]
        });

        // Process food options
        const foodItems: FoodItem[] = destination.food ? destination.food.split(',').map(foodName => ({
          id: Math.random().toString(36).substring(7),
          name: {
            text: foodName.trim(),
            cuisine: 'Local Cuisine',
            known_for: ''
          }
        })) : [];
        newDayFoodOptions[currentDayIndex] = foodItems;

        currentDayIndex++;
      }
    });

    setDayByDayData({
      dayAttractions: newDayAttractions,
      dayFoodOptions: newDayFoodOptions
    });
  }, [itineraryDays]);

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
      manual_discover: '',
      manual_discover_desc: '',
      transport: '',
      notes: '',
      food: '',
      food_desc: '',
      hotel: '',
      manual_hotel: '',
      manual_hotel_desc: ''
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
      const newNights = Number(value);

      // Calculate the start day index for this destination
      let startDayIndex = 0;
      for (let i = 0; i < index; i++) {
        startDayIndex += itineraryDays[i].nights;
      }

      // Create a new array of day hotels
      let updatedHotels = [...dayHotels];

      // First, preserve all hotels before this destination
      const hotelsBeforeDestination = updatedHotels.filter(h => h.dayIndex < startDayIndex);

      // Get the hotels for this destination
      const destinationHotel = updatedDays[index].hotel || updatedDays[index].manual_hotel || '';
      const isManual = Boolean(updatedDays[index].manual_hotel);

      // Add hotel entries for all days in this destination
      const destinationHotels = Array.from({ length: newNights }, (_, i) => ({
        dayIndex: startDayIndex + i,
        hotel: destinationHotel,
        isManual
      }));

      // Calculate the start index for subsequent destinations
      const nextDestinationStartIndex = startDayIndex + newNights;

      // Get all subsequent destinations' hotels
      let subsequentHotels: DayHotel[] = [];
      let currentDayIndex = nextDestinationStartIndex;

      // Process each subsequent destination
      for (let i = index + 1; i < itineraryDays.length; i++) {
        const dest = itineraryDays[i];
        const destHotel = dest.hotel || dest.manual_hotel || '';
        const isManualDest = Boolean(dest.manual_hotel);

        // Add hotels for each night in this destination
        for (let j = 0; j < dest.nights; j++) {
          subsequentHotels.push({
            dayIndex: currentDayIndex + j,
            hotel: destHotel,
            isManual: isManualDest
          });
        }
        currentDayIndex += dest.nights;
      }

      // Combine all hotels in correct order
      updatedHotels = [
        ...hotelsBeforeDestination,
        ...destinationHotels,
        ...subsequentHotels
      ];

      // Sort hotels by day index
      updatedHotels.sort((a, b) => a.dayIndex - b.dayIndex);
      setDayHotels(updatedHotels);
    }

    setItineraryDays(updatedDays);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!itineraryId) {
        throw new Error('No itinerary ID found');
      }

      // First, delete all existing day attractions
      const { error: deleteError } = await supabase
        .from('user_itinerary_day_attractions')
        .delete()
        .eq('itinerary_id', itineraryId);

      if (deleteError) {
        console.error('Error deleting existing attractions:', deleteError);
        throw deleteError;
      }

      // Prepare day attractions for saving
      const dayAttractionsToSave = dayByDayData.dayAttractions.map(da => ({
        itinerary_id: itineraryId,
        day_index: da.dayIndex,
        attractions: da.selectedAttractions
      }));

      // Insert new day attractions
      if (dayAttractionsToSave.length > 0) {
        const { error: insertError } = await supabase
          .from('user_itinerary_day_attractions')
          .insert(dayAttractionsToSave);

        if (insertError) {
          console.error('Error inserting attractions:', insertError);
          throw insertError;
        }
      }

      // Continue with the rest of the save operation...
      const result = await UserItineraryService.updateItinerary(itineraryId, {
        tripSummary: {
          tripName: tripSummary.tripName,
          country: tripSummary.country,
          duration: tripSummary.duration,
          startDate: tripSummary.startDate,
          passengers: tripSummary.passengers,
          isPrivate: tripSummary.isPrivate,
          tags: tripSummary.tags,
          tripDescription: tripSummary.tripDescription
        },
        destinations: itineraryDays.map(day => ({
          destination: day.destination,
          nights: day.nights,
          discover: day.discover || '',
          transport: day.transport || '',
          notes: day.notes || '',
          food: day.food || '',
          food_desc: day.food_desc || '',
          hotel: day.hotel || '',
          manual_hotel: day.manual_hotel || '',
          manual_hotel_desc: day.manual_hotel_desc || '',
          manual_discover: day.manual_discover || '',
          manual_discover_desc: day.manual_discover_desc || '',
          order_index: day.order_index
        })),
        dayAttractions: dayByDayData.dayAttractions.map(da => ({
          dayIndex: da.dayIndex,
          selectedAttractions: da.selectedAttractions
        })),
        dayHotels: dayHotels.map(dh => ({
          day_index: dh.dayIndex,
          hotel: dh.hotel,
          hotel_desc: hotelDescriptionCache[dh.dayIndex] || ''
        })),
        dayNotes: dayNotes.map(dn => ({
          day_index: dn.dayIndex,
          notes: dn.notes
        }))
      });

      if (!result.success) {
        console.error('Error updating itinerary');
        throw new Error('Failed to update itinerary');
      }

      setIsSaving(false);
      toast.success('Itinerary saved successfully!');
    } catch (error) {
      console.error('Error saving itinerary:', error);
      setIsSaving(false);
      toast.error('Failed to save itinerary');
    }
  };

  // Helper function to get hotel description for a specific day
  const getHotelDescForDay = async (dayIndex: number): Promise<string | null> => {
    if (!itineraryId) return null;

    try {
      const { data, error } = await supabase
        .from('user_itinerary_day_hotels')
        .select('hotel_desc')
        .eq('itinerary_id', itineraryId)
        .eq('day_index', dayIndex)
        .single();

      if (error) {
        console.error(`Error fetching hotel description for day ${dayIndex}:`, error);
        return null;
      }

      return data?.hotel_desc || null;
    } catch (error) {
      console.error(`Failed to fetch hotel description for day ${dayIndex}:`, error);
      return null;
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
      manual_discover: '',
      manual_discover_desc: '',
      transport: '',
      notes: '',
      food: '',
      food_desc: '',
      hotel: '',
      manual_hotel: '',
      manual_hotel_desc: ''
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

  const handleDiscoverSelect = (index: number, attractions: string[], manualAttractions: string[], description?: string) => {
    const updatedDays = [...itineraryDays];
    updatedDays[index] = {
      ...updatedDays[index],
      discover: attractions.join(', '),
      manual_discover: manualAttractions.join(', '),
      manual_discover_desc: description || ''
    };
    setItineraryDays(updatedDays);
  };

  const handleDestinationsUpdate = (updatedDestinations: typeof itineraryDays) => {
    setItineraryDays(updatedDestinations);
  };

  // Update handleDayAttractionsUpdate to preserve state and update destination
  const handleDayAttractionsUpdate = (dayIndex: number, attractions: string[]) => {
    console.log('Updating attractions for day:', dayIndex, attractions); // Debug log

    // First update the dayAttractions state
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

    // Then find and update the corresponding destination
    let currentDayCount = 0;
    const updatedDays = [...itineraryDays];

    for (let i = 0; i < updatedDays.length; i++) {
      const dest = updatedDays[i];
      const destEndIndex = currentDayCount + dest.nights;

      // Check if this dayIndex falls within this destination's range
      if (dayIndex >= currentDayCount && dayIndex < destEndIndex) {
        // Update the destination's manual_discover field
        updatedDays[i] = {
          ...dest,
          manual_discover: attractions.join(', ')
        };
        break;
      }

      currentDayCount = destEndIndex;
    }

    // Update the itineraryDays state
    setItineraryDays(updatedDays);
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

    // Calculate the number of nights before the deleted destination
    let nightsBeforeDelete = 0;
    for (let i = 0; i < indexToDelete; i++) {
      nightsBeforeDelete += itineraryDays[i].nights;
    }

    // Get the number of nights for the destination being deleted
    const nightsToDelete = itineraryDays[indexToDelete].nights;

    // Create new arrays for all state updates
    const updatedDays = itineraryDays.filter((_, index) => index !== indexToDelete);
    const updatedAttractions = dayAttractions
      .filter(da => da.dayIndex < nightsBeforeDelete || da.dayIndex >= nightsBeforeDelete + nightsToDelete)
      .map(da => ({
        ...da,
        dayIndex: da.dayIndex >= nightsBeforeDelete + nightsToDelete ?
          da.dayIndex - nightsToDelete : da.dayIndex
      }));
    const updatedHotels = dayHotels
      .filter(dh => dh.dayIndex < nightsBeforeDelete || dh.dayIndex >= nightsBeforeDelete + nightsToDelete)
      .map(dh => ({
        ...dh,
        dayIndex: dh.dayIndex >= nightsBeforeDelete + nightsToDelete ?
          dh.dayIndex - nightsToDelete : dh.dayIndex
      }));
    const updatedFoods = dayFoods
      .filter(df => df.dayIndex < nightsBeforeDelete || df.dayIndex >= nightsBeforeDelete + nightsToDelete)
      .map(df => ({
        ...df,
        dayIndex: df.dayIndex >= nightsBeforeDelete + nightsToDelete ?
          df.dayIndex - nightsToDelete : df.dayIndex
      }));
    const updatedNotes = dayNotes
      .filter(dn => dn.dayIndex < nightsBeforeDelete || dn.dayIndex >= nightsBeforeDelete + nightsToDelete)
      .map(dn => ({
        ...dn,
        dayIndex: dn.dayIndex >= nightsBeforeDelete + nightsToDelete ?
          dn.dayIndex - nightsToDelete : dn.dayIndex
      }));

    // If we have an itineraryId, update the order_index in the database
    if (itineraryId) {
      (async () => {
        try {
          // First delete the destination
          const { error: deleteError } = await supabase
            .from('user_itinerary_destinations')
            .delete()
            .eq('itinerary_id', itineraryId)
            .eq('order_index', indexToDelete);

          if (deleteError) {
            console.error('Error deleting destination:', deleteError);
            return;
          }

          // Then update the order_index for all destinations after the deleted one
          for (let i = indexToDelete + 1; i < itineraryDays.length; i++) {
            const { error: updateError } = await supabase
              .from('user_itinerary_destinations')
              .update({ order_index: i - 1 })
              .eq('itinerary_id', itineraryId)
              .eq('order_index', i);

            if (updateError) {
              console.error(`Error updating order_index for destination ${i}:`, updateError);
            }
          }
        } catch (error) {
          console.error('Error updating destination order:', error);
        }
      })();
    }

    // Update all states in a batch
    setItineraryDays(updatedDays);
    setDayAttractions(updatedAttractions);
    setDayHotels(updatedHotels);
    setDayFoods(updatedFoods);
    setDayNotes(updatedNotes);

    // Force a re-render of the map by triggering a state update
    setTimeout(() => {
      setItineraryDays([...updatedDays]);
    }, 0);
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

  // Correctly modify the handleHotelSelect function
  const handleHotelSelect = (hotel: string, isManual?: boolean, description?: string) => {
    if (currentDestinationIndexForHotel >= 0) {
      // Update the specific destination's hotel
      const updatedDestinations = [...itineraryDays];
      const updatedHotels = [...dayHotels];

      // Check if this is a deletion operation
      const isDeleting = hotel === '' && isManual === true;

      if (activeTab === 'destinations') {
        console.log('Updating hotel from Destinations tab');

        // Update the destination's hotel fields
        if (isDeleting) {
          // When deleting, clear all hotel-related fields
          updatedDestinations[currentDestinationIndexForHotel] = {
            ...updatedDestinations[currentDestinationIndexForHotel],
            hotel: '',
            manual_hotel: '',
            manual_hotel_desc: ''
          };
        } else {
          // Normal update operation
          updatedDestinations[currentDestinationIndexForHotel] = {
            ...updatedDestinations[currentDestinationIndexForHotel],
            hotel: isManual ? '' : hotel,
            manual_hotel: isManual ? hotel : '',
            manual_hotel_desc: isManual ? description || '' : ''
          };
        }

        // Calculate the start and end day indices for the selected destination
        let startDayIndex = 0;
        for (let i = 0; i < currentDestinationIndexForHotel; i++) {
          startDayIndex += itineraryDays[i].nights || 0;
        }
        const endDayIndex = startDayIndex + (itineraryDays[currentDestinationIndexForHotel].nights || 0);

        // Remove all hotel entries for this destination's days
        const filteredHotels = updatedHotels.filter(h =>
          h.dayIndex < startDayIndex || h.dayIndex >= endDayIndex
        );

        // Clear hotel description cache for all affected days
        setHotelDescriptionCache(prev => {
          const newCache = { ...prev };
          for (let dayIndex = startDayIndex; dayIndex < endDayIndex; dayIndex++) {
            delete newCache[dayIndex];
          }
          return newCache;
        });

        // If we're updating the database, prepare a bulk operation
        if (itineraryId && !isDeleting) {
          (async () => {
            try {
              console.log(`Updating ${endDayIndex - startDayIndex} hotels from Destinations tab`);

              // Process each day's hotel one by one
              for (let dayIndex = startDayIndex; dayIndex < endDayIndex; dayIndex++) {
                // Add each day to the local state
                filteredHotels.push({
                  dayIndex,
                  hotel,
                  isManual: isManual || false
                });

                // First check if a record exists
                const { data: existingRecord, error: checkError } = await supabase
                  .from('user_itinerary_day_hotels')
                  .select('*')
                  .eq('itinerary_id', itineraryId)
                  .eq('day_index', dayIndex)
                  .maybeSingle();

                if (checkError) {
                  console.error(`Error checking existing hotel for day ${dayIndex}:`, checkError);
                  continue;
                }

                if (existingRecord) {
                  // Update existing record
                  const { error } = await supabase
                    .from('user_itinerary_day_hotels')
                    .update({
                      hotel,
                      hotel_desc: description || '',
                      created_at: new Date()
                    })
                    .eq('itinerary_id', itineraryId)
                    .eq('day_index', dayIndex);

                  if (error) {
                    console.error(`Error updating hotel for day ${dayIndex}:`, error);
                  }
                } else {
                  // Insert new record
                  const { error } = await supabase
                    .from('user_itinerary_day_hotels')
                    .insert({
                      itinerary_id: itineraryId,
                      day_index: dayIndex,
                      hotel,
                      hotel_desc: description || '',
                      created_at: new Date()
                    });

                  if (error) {
                    console.error(`Error inserting hotel for day ${dayIndex}:`, error);
                  }
                }
              }

              // Sort hotels by day index
              updatedHotels.sort((a, b) => a.dayIndex - b.dayIndex);

              console.log('Successfully updated hotels from Destinations tab');
            } catch (error) {
              console.error('Failed to update hotels from Destinations tab:', error);
            }
          })();
        } else if (itineraryId && isDeleting) {
          // If deleting, perform a bulk delete for all affected days
          (async () => {
            try {
              console.log(`Deleting hotels for days ${startDayIndex} to ${endDayIndex - 1}`);

              // Create an array of day indices to delete
              const dayIndices = Array.from(
                { length: endDayIndex - startDayIndex },
                (_, i) => startDayIndex + i
              );

              // Since we can't use 'in' with Supabase JS client directly,
              // we need to delete each day individually, but we can parallelize them
              await Promise.all(
                dayIndices.map(dayIndex =>
                  supabase
                    .from('user_itinerary_day_hotels')
                    .delete()
                    .eq('itinerary_id', itineraryId)
                    .eq('day_index', dayIndex)
                )
              );

              console.log('Successfully deleted hotels from Destinations tab');
            } catch (error) {
              console.error('Failed to delete hotels from Destinations tab:', error);
            }
          })();
        }

        setDayHotels(updatedHotels);

        // Reset the synchronization flag when editing from the Destinations tab
        // This ensures future changes from Destinations tab will be propagated to Day by Day
        setHasSyncedHotelDescriptions(false);
      } else {
        // Day by Day view operations remain unchanged
        if (isDeleting) {
          // Remove the hotel entry for this day
          const filteredHotels = updatedHotels.filter(h => h.dayIndex !== currentDestinationIndexForHotel);
          setDayHotels(filteredHotels);

          // Find which destination this day belongs to and clear its hotel data too
          let currentDayCount = 0;
          for (let i = 0; i < itineraryDays.length; i++) {
            const nextDayCount = currentDayCount + itineraryDays[i].nights;
            if (currentDestinationIndexForHotel >= currentDayCount && currentDestinationIndexForHotel < nextDayCount) {
              updatedDestinations[i] = {
                ...updatedDestinations[i],
                hotel: '',
                manual_hotel: '',
                manual_hotel_desc: ''
              };
              break;
            }
            currentDayCount = nextDayCount;
          }
        } else {
          // Normal update operation
          const hotelIndex = updatedHotels.findIndex(h => h.dayIndex === currentDestinationIndexForHotel);

          if (hotelIndex !== -1) {
            updatedHotels[hotelIndex] = {
              dayIndex: currentDestinationIndexForHotel,
              hotel,
              isManual
            };
          } else {
            updatedHotels.push({
              dayIndex: currentDestinationIndexForHotel,
              hotel,
              isManual
            });
          }

          // Sort hotels by day index
          updatedHotels.sort((a, b) => a.dayIndex - b.dayIndex);
          setDayHotels(updatedHotels);

          // Find which destination this day belongs to and update it
          let dayCount = 0;
          for (let i = 0; i < itineraryDays.length; i++) {
            const nextDayCount = dayCount + itineraryDays[i].nights;
            if (currentDestinationIndexForHotel >= dayCount && currentDestinationIndexForHotel < nextDayCount) {
              updatedDestinations[i] = {
                ...updatedDestinations[i],
                hotel: isManual ? '' : hotel,
                manual_hotel: isManual ? hotel : '',
                manual_hotel_desc: isManual ? description || '' : ''
              };
              break;
            }
            dayCount = nextDayCount;
          }
        }
      }

      setItineraryDays(updatedDestinations);
      setIsHotelSearchOpen(false);
    } else {
      // Day by Day tab operations - Clear cache for the specific day
      setHotelDescriptionCache(prev => {
        const newCache = { ...prev };
        delete newCache[currentDestinationIndexForHotel];
        return newCache;
      });

      // Rest of the function remains the same
      // ... existing code ...
    }
  };

  // Add a helper function to delete hotel entries from the database
  const deleteHotelFromDatabase = async (dayIndex: number) => {
    if (!itineraryId) return;

    console.log(`Deleting hotel for day ${dayIndex}`);

    try {
      const { error } = await supabase
        .from('user_itinerary_day_hotels')
        .delete()
        .eq('itinerary_id', itineraryId)
        .eq('day_index', dayIndex);

      if (error) {
        console.error('Error deleting hotel from database:', error);
      } else {
        console.log(`Successfully deleted hotel for day ${dayIndex}`);
      }
    } catch (error) {
      console.error('Failed to delete hotel:', error);
    }
  };

  const handleDayFoodSelect = (destination: string, index: number) => {
    console.log('Setting food for destination:', {
      destination,
      index
    });

    // Set both state variables to the same index
    setCurrentDestinationIndexForFood(index);
    setActiveDestinationIndexForFood(index);
    setCurrentDestinationForFood(destination);
    setShowFoodPopup(true);
  };

  const handleFoodSelect = async (foodItems: FoodItem[]) => {
    if (!itineraryId || currentDestinationIndexForFood === null) return;

    try {
      // Delete existing food entries for this destination's days
      const startDayIndex = itineraryDays
        .slice(0, currentDestinationIndexForFood)
        .reduce((sum, day) => sum + day.nights, 0);

      const nights = itineraryDays[currentDestinationIndexForFood].nights;

      // Delete existing food entries for this destination's days
      await supabase
        .from('user_itinerary_day_food_options')
        .delete()
        .eq('itinerary_id', itineraryId)
        .gte('day_index', startDayIndex)
        .lt('day_index', startDayIndex + nights);

      // Add new food entries for this destination's days
      if (foodItems.length > 0) {
        const { error } = await supabase
          .from('user_itinerary_day_food_options')
          .insert({
            itinerary_id: itineraryId,
            day_index: startDayIndex,
            name: foodItems
          });

        if (error) throw error;
      }

      // Update local state
      const updatedDayFoods = dayFoods.filter(
        df => df.dayIndex < startDayIndex || df.dayIndex >= startDayIndex + nights
      );

      // Add new food entries for this destination's days
      for (let i = 0; i < nights; i++) {
        const currentDayIndex = startDayIndex + i;
        updatedDayFoods.push({
          dayIndex: currentDayIndex,
          foodItems: foodItems,
          foodDesc: foodItems.map(item => item.name.text).join(', ')
        });
      }

      // Sort dayFoods by dayIndex
      updatedDayFoods.sort((a, b) => a.dayIndex - b.dayIndex);

      // Update states
      setDayFoods(updatedDayFoods);
      setShowFoodPopup(false);
      setCurrentDestinationIndexForFood(null);
      setActiveDestinationIndexForFood(null);

    } catch (error) {
      console.error('Error handling food selection:', error);
    }
  };

  // Add this function before the renderDestinationsGrid function
  const handleAttractionsUpdate = (index: number, attractions: string[], descriptions: string[]) => {
    console.log('Updating attractions:', { index, attractions, descriptions });
    const updatedDays = [...itineraryDays];
    updatedDays[index] = {
      ...updatedDays[index],
      manual_discover: attractions.join(', '),
      manual_discover_desc: descriptions.join(', ')
    };
    console.log('Updated day:', updatedDays[index]);
    setItineraryDays(updatedDays);

    // If we have an itineraryId, update the database immediately
    if (itineraryId) {
      (async () => {
        try {
          const { error } = await supabase
            .from('user_itinerary_destinations')
            .update({
              manual_discover: attractions.join(', '),
              manual_discover_desc: descriptions.join(', ')
            })
            .eq('itinerary_id', itineraryId)
            .eq('order_index', index);

          if (error) {
            console.error('Error updating attractions:', error);
          } else {
            console.log('Successfully updated attractions in database');
          }
        } catch (error) {
          console.error('Failed to update attractions:', error);
        }
      })();
    }
  };

  const renderDestinationsGrid = () => {
    return (
      <div className="space-y-4">
        {/* Column Headers */}
        <div className="grid grid-cols-[200px,100px,180px,120px,120px] gap-0 px-4 py-2 text-xs text-[#0f3e4a] border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 destination-icon" />
            <span className="font-[600] font-['Inter_var']">DESTINATION</span>
          </div>
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 nights-icon" />
            <span className="font-[600] font-['Inter_var']">NIGHTS</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Bed className="w-4 h-4 sleeping-icon" />
            <span className="font-[600] font-['Inter_var']">SLEEPING</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 discover-icon" />
            <span className="font-[600] font-['Inter_var']">DISCOVER</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Utensils className="w-4 h-4 food-icon" />
            <span className="font-[600] font-['Inter_var']">FOOD</span>
          </div>
        </div>

        {/* Destinations List */}
        <div className="space-y-1">
          {itineraryDays.map((day, index) => (
            <React.Fragment key={index}>
              <div className="grid grid-cols-[200px,100px,180px,120px,120px] gap-0 items-center bg-white px-4 py-2 hover:bg-[#f1f8fa] transition-colors">
                <div className="pr-0">
                  <div className="flex items-center gap-2">
                    <div className="relative group">
                      <div className="w-5 h-5 rounded-full bg-[#00C48C]/10 flex items-center justify-center text-xs font-medium text-[#00C48C]">
                        {index + 1}
                      </div>
                      <button
                        onClick={() => handleDeleteDestination(index)}
                        className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-2 h-2" />
                      </button>
                    </div>
                    <div>
                      <PlaceAutocomplete
                        value={day.tempDestination !== undefined ? day.tempDestination : day.destination.split(',')[0]}
                        onChange={(value) => {
                          const updatedDays = [...itineraryDays];
                          updatedDays[index] = {
                            ...updatedDays[index],
                            tempDestination: value,
                            // If value is empty, also clear the actual destination
                            ...(value === '' && { destination: '' })
                          };
                          setItineraryDays(updatedDays);
                        }}
                        country={tripSummary.country}
                        onPlaceSelect={(place) => {
                          const updatedDays = [...itineraryDays];
                          updatedDays[index] = {
                            ...updatedDays[index],
                            destination: place.name || '',
                            tempDestination: undefined
                          };
                          setItineraryDays(updatedDays);
                        }}
                        startDate=""
                        nights={0}
                        className="font-['Inter_var'] font-[600] text-sm text-[#0f3e4a]"
                      />
                      <div className="text-xs text-[#0f3e4a] mt-0.5">
                        {formatDateRange(index)}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleDayUpdate(index, 'nights', Math.max(1, day.nights - 1))}
                      className="w-7 h-7 flex items-center justify-center text-[#0f3e4a] hover:bg-gray-100 rounded-full font-['Inter_var'] font-[600] text-lg"
                    >
                      -
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="font-[600] font-['Inter_var'] text-[#0f3e4a] text-sm">{day.nights}</span>
                    </div>
                    <button
                      onClick={() => handleDayUpdate(index, 'nights', day.nights + 1)}
                      className="w-7 h-7 flex items-center justify-center text-[#0f3e4a] hover:bg-gray-100 rounded-full font-['Inter_var'] font-[600] text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  {(day.hotel || day.manual_hotel) ? (
                    <div className="text-xs group relative flex items-center justify-start flex-col">
                      <button
                        onClick={() => {
                          setCurrentDestinationForHotel(cleanDestination(day.destination));
                          setCurrentDestinationIndexForHotel(index);
                          setIsHotelSearchOpen(true);
                        }}
                        className="font-['Inter_var'] font-[600] text-sm text-[#0f3e4a] hover:text-[#00C48C] transition-colors"
                      >
                        <span className="max-w-[140px] truncate block">
                          {day.manual_hotel || day.hotel}
                        </span>
                      </button>
                      <div className="text-[10px] text-[#0f3e4a]">To be booked</div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => {
                          setCurrentDestinationForHotel(cleanDestination(day.destination));
                          setCurrentDestinationIndexForHotel(index);
                          setIsHotelSearchOpen(true);
                        }}
                        className="sleeping-action column-action"
                      >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  {day.discover || day.manual_discover ? (
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => {
                          setActiveDestinationForDiscover(cleanDestination(day.destination));
                          setShowDestinationDiscover(true);
                        }}
                        className="font-['Inter_var'] font-[600] text-sm text-[#0f3e4a] hover:text-[#00C48C] transition-colors"
                      >
                        {[
                          ...day.discover.split(',').filter(Boolean),
                          ...day.manual_discover.split(',').filter(Boolean)
                        ].length} to do's
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => {
                          setActiveDestinationForDiscover(cleanDestination(day.destination));
                          setShowDestinationDiscover(true);
                        }}
                        className="discover-action column-action"
                      >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  {(() => {
                    let startDayIndex = 0;
                    for (let i = 0; i < index; i++) {
                      startDayIndex += itineraryDays[i].nights;
                    }

                    // Get unique food items for this destination
                    const uniqueFoodItems = new Set();
                    for (let i = 0; i < day.nights; i++) {
                      const dayFood = dayFoods.find(f => f.dayIndex === startDayIndex + i);
                      if (dayFood?.foodItems) {
                        dayFood.foodItems.forEach(item => {
                          uniqueFoodItems.add(item.id);
                        });
                      }
                    }

                    const foodCount = uniqueFoodItems.size;

                    return foodCount > 0 ? (
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => {
                            handleDayFoodSelect(cleanDestination(day.destination), index);
                          }}
                          className="font-['Inter_var'] font-[600] text-sm text-[#0f3e4a] hover:text-[#00C48C] transition-colors"
                        >
                          {`${foodCount} food spot${foodCount === 1 ? '' : 's'}`}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => {
                            handleDayFoodSelect(cleanDestination(day.destination), index);
                          }}
                          className="food-action column-action"
                        >
                          <Plus className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2">
                  </div>
                </div>
              </div>
              {index < itineraryDays.length - 1 && (
                <div className="relative">
                  <div className="border-b border-gray-200"></div>
                  <div className="grid grid-cols-[200px,100px,180px,120px,120px] gap-0">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Add Destination Button and Update Button Row */}
        <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200">
          <button
            onClick={() => {
              setItineraryDays([
                ...itineraryDays,
                { destination: '', nights: 1, discover: '', manual_discover: '', manual_discover_desc: '', transport: '', notes: '', food: '', food_desc: '', hotel: '', manual_hotel: '', manual_hotel_desc: '' }
              ]);
            }}
            className="flex items-center gap-2 text-sm text-[#0f3e4a] hover:text-[#00C48C] transition-colors font-['Inter_var'] font-[600]"
          >
            <Plus className="w-6 h-6" />
            Add new destination...
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-[#00C48C] text-white rounded-lg hover:bg-[#00B380] transition-colors shadow-sm flex items-center gap-2 font-['Inter_var'] font-[600]"
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

  // Update handleDayHotelSelect to clear cache and update UI correctly
  const handleDayHotelSelect = (hotel: string, dayIndex: number, description?: string) => {
    console.log(`Handling day hotel select for day ${dayIndex}:`, { hotel, description });

    // Clear this day's cache entry since we're updating it
    setHotelDescriptionCache(prev => {
      const newCache = { ...prev };
      delete newCache[dayIndex];
      return newCache;
    });

    // Update the specific day's hotel in local state
    const updatedHotels = [...dayHotels];

    // Check if this is a deletion operation
    const isDeleting = hotel === '';

    if (isDeleting) {
      // Remove the hotel entry for this day only
      const filteredHotels = updatedHotels.filter(h => h.dayIndex !== dayIndex);
      setDayHotels(filteredHotels);

      // If we're showing description now, clear it
      if (currentDestinationIndexForHotel === dayIndex) {
        setDayHotelDesc('');
      }
    } else {
      // Find if we already have a hotel for this day
      const existingHotelIndex = updatedHotels.findIndex(h => h.dayIndex === dayIndex);

      if (existingHotelIndex >= 0) {
        // Update existing entry for this day only
        updatedHotels[existingHotelIndex] = {
          ...updatedHotels[existingHotelIndex],
          hotel,
          isManual: true
        };
      } else {
        // Add new entry for this day only
        updatedHotels.push({
          dayIndex,
          hotel,
          isManual: true
        });
      }

      // Sort hotels by day index
      updatedHotels.sort((a, b) => a.dayIndex - b.dayIndex);
      setDayHotels(updatedHotels);

      // If this is the current day being edited, update description in UI
      if (currentDestinationIndexForHotel === dayIndex) {
        setDayHotelDesc(description || '');
      }
    }

    // Update the description state (used in the UI)
    setDayHotelDesc(description || '');

    // If we have an itineraryId, update the hotel in the database in a single operation
    if (itineraryId) {
      (async () => {
        try {
          console.log(`Saving hotel data for day ${dayIndex} to database`);

          if (isDeleting) {
            // Delete the hotel entry
            const { error: deleteError } = await supabase
              .from('user_itinerary_day_hotels')
              .delete()
              .eq('itinerary_id', itineraryId)
              .eq('day_index', dayIndex);

            if (deleteError) {
              console.error(`Error deleting hotel for day ${dayIndex}:`, deleteError);
            } else {
              console.log(`Successfully deleted hotel for day ${dayIndex}`);
            }
          } else {
            // First check if a record already exists
            const { data: existingRecord, error: checkError } = await supabase
              .from('user_itinerary_day_hotels')
              .select('*')
              .eq('itinerary_id', itineraryId)
              .eq('day_index', dayIndex)
              .maybeSingle();

            if (checkError) {
              console.error(`Error checking existing hotel for day ${dayIndex}:`, checkError);
              return;
            }

            let saveError;

            if (existingRecord) {
              // Update the existing record
              const { error } = await supabase
                .from('user_itinerary_day_hotels')
                .update({
                  hotel,
                  hotel_desc: description || '',
                  created_at: new Date()
                })
                .eq('itinerary_id', itineraryId)
                .eq('day_index', dayIndex);

              saveError = error;
            } else {
              // Insert a new record
              const { error } = await supabase
                .from('user_itinerary_day_hotels')
                .insert({
                  itinerary_id: itineraryId,
                  day_index: dayIndex,
                  hotel,
                  hotel_desc: description || '',
                  created_at: new Date()
                });

              saveError = error;
            }

            if (saveError) {
              console.error(`Error saving hotel for day ${dayIndex}:`, saveError);
            } else {
              console.log(`Successfully saved hotel data for day ${dayIndex}`);

              // Update the cache with the new description
              setHotelDescriptionCache(prev => ({
                ...prev,
                [dayIndex]: description || ''
              }));
            }
          }
        } catch (error) {
          console.error(`Error handling hotel data for day ${dayIndex}:`, error);
        }
      })();
    }
  };

  // Modified syncHotelDescriptions function to efficiently update hotels
  const syncHotelDescriptions = () => {
    if (!itineraryId) {
      console.log('Skipping hotel description sync (not saved yet)');
      return;
    }

    console.log('Syncing hotel descriptions from destinations to days');

    // For each destination, get its hotel description and update days in local state only
    // Without making API calls unless absolutely necessary
    let currentDayIndex = 0;
    const updatedHotels = [...dayHotels];
    const hotelBulkUpserts: {
      itinerary_id: string;
      day_index: number;
      hotel: string;
      hotel_desc: string;
      created_at: Date;
    }[] = [];

    let needsApiSync = false;

    itineraryDays.forEach((dest, destIndex) => {
      const hotelDesc = dest.manual_hotel_desc || '';
      const hotelName = dest.manual_hotel || dest.hotel || '';

      if (!hotelName) {
        currentDayIndex += dest.nights;
        return;
      }

      // Update each day in this destination
      for (let i = 0; i < dest.nights; i++) {
        const dayIndex = currentDayIndex + i;

        // Check if this day already has a custom hotel entry
        const existingHotelIndex = updatedHotels.findIndex(h => h.dayIndex === dayIndex);
        const existingDayHotel = existingHotelIndex >= 0 ? updatedHotels[existingHotelIndex] : null;

        // Only update if this day doesn't already have a custom entry
        if (!existingDayHotel) {
          // Add new entry
          updatedHotels.push({
            dayIndex,
            hotel: hotelName,
            isManual: false
          });
          needsApiSync = true;
        } else if (existingDayHotel.hotel !== hotelName) {
          // Update existing entry, but only if hotel name is different
          updatedHotels[existingHotelIndex] = {
            ...updatedHotels[existingHotelIndex],
            hotel: hotelName,
            isManual: false
          };
          needsApiSync = true;
        }

        // Only add to API update list if we really need to update
        if (needsApiSync) {
          hotelBulkUpserts.push({
            itinerary_id: itineraryId,
            day_index: dayIndex,
            hotel: hotelName,
            hotel_desc: hotelDesc,
            created_at: new Date()
          });
        }
      }

      currentDayIndex += dest.nights;
    });

    // Sort by day index
    updatedHotels.sort((a, b) => a.dayIndex - b.dayIndex);
    setDayHotels(updatedHotels);

    // Only perform database update if we have differences to update
    // and if we haven't already synced
    if (hotelBulkUpserts.length > 0 && needsApiSync) {
      (async () => {
        try {
          console.log(`Syncing ${hotelBulkUpserts.length} hotels`);

          // Process each hotel record one by one
          for (const hotelRecord of hotelBulkUpserts) {
            // First check if the record exists
            const { data: existingRecord, error: checkError } = await supabase
              .from('user_itinerary_day_hotels')
              .select('*')
              .eq('itinerary_id', hotelRecord.itinerary_id)
              .eq('day_index', hotelRecord.day_index)
              .maybeSingle();

            if (checkError) {
              console.error(`Error checking existing hotel for day ${hotelRecord.day_index}:`, checkError);
              continue;
            }

            if (existingRecord) {
              // Update existing record
              const { error } = await supabase
                .from('user_itinerary_day_hotels')
                .update({
                  hotel: hotelRecord.hotel,
                  hotel_desc: hotelRecord.hotel_desc,
                  created_at: hotelRecord.created_at
                })
                .eq('itinerary_id', hotelRecord.itinerary_id)
                .eq('day_index', hotelRecord.day_index);

              if (error) {
                console.error(`Error updating hotel for day ${hotelRecord.day_index}:`, error);
              }
            } else {
              // Insert new record
              const { error } = await supabase
                .from('user_itinerary_day_hotels')
                .insert(hotelRecord);

              if (error) {
                console.error(`Error inserting hotel for day ${hotelRecord.day_index}:`, error);
              }
            }
          }

          console.log('Successfully synced hotel descriptions to database');
        } catch (error) {
          console.error('Failed to sync hotels:', error);
        }
      })();
    } else {
      console.log('No hotel changes detected, skipping database sync');
    }

    // Mark that we've done the sync
    setHasSyncedHotelDescriptions(true);
  };

  // Add a proper manual sync function that will be called when the sync button is clicked
  const handleManualSync = () => {
    console.log('Manual sync button clicked');
    if (itineraryId && itineraryDays.length > 0) {
      syncHotelDescriptions();
    }
  };

  // Modify the handleTabChange function to completely avoid any sync or data operations
  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
    if (newTab === 'day-by-day') {
      handleDayByDayTabChange('dayByDay');
    } else {
      handleDayByDayTabChange('destinations');
    }
  };

  // Also, add a function to clear hotel description cache when hotel data changes
  const clearHotelDescriptionCache = () => {
    setHotelDescriptionCache({});
  };

  // Add a new helper function to get hotel info without API calls
  const getHotelInfoFromState = async (dayIndex: number): Promise<{ hotel: string, description: string }> => {
    // First check our cache for description
    const cachedDescription = hotelDescriptionCache[dayIndex];

    // Get hotel from our local state
    const existingDayHotel = dayHotels.find(h => h.dayIndex === dayIndex);
    const hotelName = existingDayHotel?.hotel || '';

    // If we have a cached description, use it
    if (cachedDescription !== undefined) {
      return {
        hotel: hotelName,
        description: cachedDescription
      };
    }

    // If we have an itineraryId, check the database first
    if (itineraryId) {
      try {
        const { data, error } = await supabase
          .from('user_itinerary_day_hotels')
          .select('hotel, hotel_desc')
          .eq('itinerary_id', itineraryId)
          .eq('day_index', dayIndex)
          .maybeSingle();

        if (!error && data) {
          // Cache the description
          setHotelDescriptionCache(prev => ({
            ...prev,
            [dayIndex]: data.hotel_desc || ''
          }));

          return {
            hotel: data.hotel || '',
            description: data.hotel_desc || ''
          };
        }
      } catch (error) {
        console.error('Error fetching hotel info from database:', error);
      }
    }

    // If no data in database or no itineraryId, try to find a fallback from destinations
    // Find which destination this day belongs to
    let currentDayCount = 0;
    let destinationIndex = -1;

    for (let i = 0; i < itineraryDays.length; i++) {
      const nextDayCount = currentDayCount + itineraryDays[i].nights;
      if (dayIndex >= currentDayCount && dayIndex < nextDayCount) {
        destinationIndex = i;
        break;
      }
      currentDayCount = nextDayCount;
    }

    // Get the destination hotel description as fallback
    const destinationHotel = destinationIndex >= 0 ? itineraryDays[destinationIndex] : null;
    const destinationHotelDesc = destinationHotel?.manual_hotel_desc || '';

    // Cache this fallback description
    if (destinationHotelDesc) {
      setHotelDescriptionCache(prev => ({
        ...prev,
        [dayIndex]: destinationHotelDesc
      }));
    }

    return {
      hotel: hotelName,
      description: destinationHotelDesc
    };
  };

  // Update the attractions only when not in day-by-day view
  useEffect(() => {
    if (isDayByDayView || !itineraryDays.length) return;

    if (activeDestinationIndex === undefined) return;

    const updateAttractions = async () => {
      try {
        // ... existing attractions update logic ...
      } catch (error) {
        console.error('Error updating attractions:', error);
      }
    };

    updateAttractions();
  }, [activeDestinationIndex, isDayByDayView, itineraryDays]);

  // Update food options only when not in day-by-day view
  useEffect(() => {
    if (isDayByDayView || !itineraryDays.length) return;

    if (activeDestinationIndex === undefined) return;

    const updateFoodOptions = async () => {
      try {
        // ... existing food options update logic ...
      } catch (error) {
        console.error('Error updating food options:', error);
      }
    };

    updateFoodOptions();
  }, [activeDestinationIndex, isDayByDayView, itineraryDays]);

  // Handle tab changes in DayByDayGrid
  const handleDayByDayTabChange = (tab: 'destinations' | 'dayByDay') => {
    setIsDayByDayView(tab === 'dayByDay');
    console.log(`Tab changed to ${tab}, updates ${tab === 'dayByDay' ? 'disabled' : 'enabled'}`);
  };

  if (!showSummaryPopup) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />

        {/* Main content area */}
        <div className="flex h-[calc(100vh-60px)] pt-[60px] relative overflow-hidden">
          {/* Left side - Form */}
          <div className={`${isMapCollapsed ? 'w-[15%]' : 'w-[50%]'} h-full transition-all duration-300`}>
            <div className="h-full">
              <div className="h-full">
                <div className="bg-white h-full flex flex-col">
                  {/* Header with Trip Summary Info */}
                  <div className="border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h1 className="text-2xl heading-text">
                            {tripSummary.tripName || 'Untitled Trip'}
                          </h1>
                          <button
                            onClick={() => setShowTripSummaryEdit(true)}
                            className="p-2 text-[#00C48C] hover:text-[#00B380] rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="sub-heading">
                              {(() => {
                                const startDate = new Date(tripSummary.startDate);
                                const endDate = new Date(startDate);
                                endDate.setDate(startDate.getDate() + tripSummary.duration - 1);

                                return `${startDate.getDate()} ${startDate.toLocaleString('default', { month: 'short' })} - ${endDate.getDate()} ${endDate.toLocaleString('default', { month: 'short' })}`;
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Nights Planned Indicator */}
                      <div className="flex items-center gap-3">
                        <div className="relative h-16 w-16">
                          <svg className="transform -rotate-90" width="64" height="64">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="#E5E7EB"
                              strokeWidth="4"
                              fill="#f8fafc"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="#00C48C"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${(totalNights / tripSummary.duration) * 176} 176`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-xl font-[600] font-['Inter_var'] text-[#00C48C]">
                            {totalNights}/{tripSummary.duration}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="heading-text text-lg">Nights</span>
                          <span className="text-sm text-gray-500">planned</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center gap-8 border-b border-gray-200 px-4">
                    <button
                      onClick={() => handleTabChange('destinations')}
                      className={`py-4 px-2 font-['Inter_var'] font-[600] border-b-2 -mb-[1px] transition-colors ${activeTab === 'destinations'
                        ? 'text-[rgb(0,179,128)] border-[rgb(0,179,128)]'
                        : 'text-gray-500 border-transparent hover:text-[rgb(0,179,128)]'
                        }`}
                    >
                      Destinations
                    </button>
                    <button
                      onClick={() => handleTabChange('day-by-day')}
                      className={`py-4 px-2 font-['Inter_var'] font-[600] border-b-2 -mb-[1px] transition-colors ${activeTab === 'day-by-day'
                        ? 'text-[rgb(0,179,128)] border-[rgb(0,179,128)]'
                        : 'text-gray-500 border-transparent hover:text-[rgb(0,179,128)]'
                        }`}
                    >
                      Day by Day
                    </button>
                  </div>

                  {/* Content area with flex-grow */}
                  <div className="flex-grow overflow-y-auto">
                    {activeTab === 'destinations' ? (
                      <div className="py-4 px-4">
                        {renderDestinationsGrid()}
                      </div>
                    ) : (
                      <div className="py-4 px-4">
                        <DayByDayGrid
                          tripStartDate={tripSummary.startDate}
                          destinations={itineraryDays}
                          onDestinationsUpdate={(destinations) => setItineraryDays(destinations)}
                          dayAttractions={dayByDayData.dayAttractions}
                          onDayAttractionsUpdate={(dayIndex, attractions) => {
                            setDayByDayData(prev => ({
                              ...prev,
                              dayAttractions: prev.dayAttractions.map(da =>
                                da.dayIndex === dayIndex
                                  ? { ...da, selectedAttractions: attractions }
                                  : da
                              )
                            }));
                          }}
                          dayHotels={dayHotels}
                          onDayHotelsUpdate={setDayHotels}
                          dayNotes={dayNotes}
                          onDayNotesUpdate={setDayNotes}
                          onHotelClick={(destination, dayIndex) => {
                            setCurrentDestinationForHotel(destination);
                            setCurrentDestinationIndexForHotel(dayIndex);
                            setIsDayHotelSearchOpen(true);
                          }}
                          onFoodSelect={(destination, dayIndex) => {
                            setCurrentDestinationForFood(destination);
                            setCurrentDestinationIndexForFood(dayIndex);
                            setShowFoodPopup(true);
                          }}
                          dayFoods={dayByDayData.dayFoodOptions}
                          onFoodClick={(destination, dayIndex) => {
                            setCurrentDestinationForHotel(destination);
                            setCurrentDestinationIndexForHotel(dayIndex);
                            setShowFoodPopup(true);
                          }}
                          onNotesClick={(destination, dayIndex) => {
                            const currentNotes = dayNotes.find(n => n.dayIndex === dayIndex)?.notes || '';
                            setSelectedDayForNotes({
                              dayIndex,
                              notes: currentNotes
                            });
                            setShowNotesPopup(true);
                          }}
                          itineraryId={itineraryId ?? ''}
                          className="text-sm font-['Inter_var']"
                          iconSize="w-4 h-4"
                          spacing="gap-2"
                          padding="p-2"
                          buttonSize="text-sm"
                          headingSize="text-sm"
                          subheadingSize="text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Map */}
          <div className={`${isMapCollapsed ? 'w-[85%]' : 'w-[50%]'} h-full relative transition-all duration-300`}>
            <button
              onClick={() => setIsMapCollapsed(!isMapCollapsed)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-all"
            >
              <ChevronLeft className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${isMapCollapsed ? 'rotate-180' : ''}`} />
            </button>
            <MapboxMap
              destinations={itineraryDays.filter(day => day.destination !== '')}
              className="h-full w-full"
              country={tripSummary.country}
            />
          </div>
        </div>

        {/* Add all popups at root level */}
        {showTransportPopup && currentDestinationForTransport && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transport-popup-title"
          >
            <TransportPopup
              isOpen={showTransportPopup}
              onClose={() => {
                setShowTransportPopup(false);
                setCurrentDestinationForTransport(null);
              }}
              destination={`From ${currentDestinationForTransport.from} to ${currentDestinationForTransport.to}`}
              onTransportSelect={(transport) => {
                if (currentDestinationForTransport && currentDestinationForTransport.index >= 0) {
                  const transportDetails = typeof transport === 'string' ? transport : transport.toString();
                  handleTransportSelect(currentDestinationForTransport.index, transportDetails);
                }
              }}
            />
          </div>
        )}

        {/* Food Popup */}
        {showFoodPopup && activeDestinationIndexForFood !== null && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="food-popup-title"
          >
            <FoodPopup
              isOpen={showFoodPopup}
              onClose={() => {
                setShowFoodPopup(false);
                setActiveDestinationIndexForFood(null);
                setCurrentDestinationIndexForFood(null);
              }}
              date={(() => {
                const startDate = new Date(tripSummary.startDate);
                let daysToAdd = 0;
                for (let i = 0; i < activeDestinationIndexForFood; i++) {
                  daysToAdd += itineraryDays[i].nights;
                }
                const destinationDate = new Date(startDate);
                destinationDate.setDate(startDate.getDate() + daysToAdd);
                return formatDate(destinationDate);
              })()}
              destination={currentDestinationForFood}
              selectedFoodItems={(() => {
                let startDayIndex = 0;
                for (let i = 0; i < activeDestinationIndexForFood; i++) {
                  startDayIndex += itineraryDays[i].nights;
                }
                const dayFood = dayFoods.find(f => f.dayIndex === startDayIndex);
                return dayFood?.foodItems || [];
              })()}
              itineraryId={itineraryId ?? ''}
              dayIndex={activeDestinationIndexForFood}
              onFoodUpdate={handleFoodSelect}
            />
          </div>
        )}

        {isHotelSearchOpen && currentDestinationForHotel && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            role="dialog"
            aria-modal="true"
          >
            <HotelSearchPopup
              isOpen={isHotelSearchOpen}
              onClose={() => {
                setIsHotelSearchOpen(false);
                setCurrentDestinationForHotel('');
              }}
              destination={currentDestinationForHotel}
              onHotelSelect={handleHotelSelect}
              itineraryId={itineraryId ?? ''}
              destinationIndex={currentDestinationIndexForHotel}
              selectedHotel={itineraryDays[currentDestinationIndexForHotel]?.hotel}
              manualHotel={itineraryDays[currentDestinationIndexForHotel]?.manual_hotel}
              manualHotelDesc={itineraryDays[currentDestinationIndexForHotel]?.manual_hotel_desc}
            />
          </div>
        )}

        {isDayHotelSearchOpen && currentDestinationForHotel && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            role="dialog"
            aria-modal="true"
          >
            <DayHotelSearchPopup
              isOpen={isDayHotelSearchOpen}
              onClose={() => {
                setIsDayHotelSearchOpen(false);
                setCurrentDestinationForHotel('');
                setDayHotelDesc('');
              }}
              destination={currentDestinationForHotel}
              onHotelSelect={handleDayHotelSelect}
              dayIndex={currentDestinationIndexForHotel}
              selectedHotel={dayHotels.find(h => h.dayIndex === currentDestinationIndexForHotel)?.hotel}
              hotelDesc={dayHotelDesc}
              itineraryId={itineraryId ?? ''}
            />
          </div>
        )}

        {showDestinationDiscover && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="destination-discover-title"
          >
            <DestinationDiscover
              open={showDestinationDiscover}
              onClose={() => setShowDestinationDiscover(false)}
              destination={activeDestinationForDiscover}
              attractions={(() => {
                const day = itineraryDays.find((d: ItineraryDay) => cleanDestination(d.destination) === activeDestinationForDiscover);
                if (!day) return [];
                const manualAttractions = day.manual_discover ? day.manual_discover.split(',').map(s => s.trim()).filter(Boolean) : [];
                return manualAttractions;
              })()}
              descriptions={(() => {
                const day = itineraryDays.find((d: ItineraryDay) => cleanDestination(d.destination) === activeDestinationForDiscover);
                if (!day || !day.manual_discover_desc) return [];
                const parts = day.manual_discover_desc.split(',');
                return parts.map(s => s.trim());
              })()}
              onAttractionsUpdate={(newAttractions: string[], newDescriptions: string[]) => {
                const dayIndex = itineraryDays.findIndex((d: ItineraryDay) => cleanDestination(d.destination) === activeDestinationForDiscover);
                if (dayIndex !== -1) {
                  console.log('Updating attractions and descriptions:', {
                    attractions: newAttractions,
                    descriptions: newDescriptions
                  });
                  const updatedDays = [...itineraryDays];
                  updatedDays[dayIndex] = {
                    ...updatedDays[dayIndex],
                    manual_discover: newAttractions.join(','),
                    manual_discover_desc: newDescriptions.join(',')
                  };
                  setItineraryDays(updatedDays);
                }
              }}
              itineraryId={itineraryId ?? ''}
              destinationIndex={itineraryDays.findIndex((d: ItineraryDay) => cleanDestination(d.destination) === activeDestinationForDiscover)}
            />
          </div>
        )}

        {/* Trip Summary Edit Popup */}
        {showTripSummaryEdit && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trip-summary-edit-title"
          >
            <TripSummaryEdit
              tripSummary={tripSummary}
              onUpdate={handleTripSummaryUpdate}
              onClose={() => setShowTripSummaryEdit(false)}
            />
          </div>
        )}

        {/* Notes Popup */}
        {showNotesPopup && selectedDayForNotes && (
          <NotesPopup
            isOpen={showNotesPopup}
            onClose={() => {
              setShowNotesPopup(false);
              setSelectedDayForNotes(null);
            }}
            onSave={(notes) => {
              const updatedNotes = [...dayNotes];
              const existingNoteIndex = updatedNotes.findIndex(
                (note) => note.dayIndex === selectedDayForNotes.dayIndex
              );

              if (existingNoteIndex !== -1) {
                updatedNotes[existingNoteIndex] = {
                  ...updatedNotes[existingNoteIndex],
                  notes
                };
              } else {
                updatedNotes.push({
                  dayIndex: selectedDayForNotes.dayIndex,
                  notes
                });
              }

              setDayNotes(updatedNotes);
              setShowNotesPopup(false);
              setSelectedDayForNotes(null);
            }}
            initialNotes={selectedDayForNotes.notes}
            dayNumber={selectedDayForNotes.dayIndex + 1}
            itineraryId={itineraryId}
            dayIndex={selectedDayForNotes.dayIndex}
          />
        )}
      </div>
    );
  }

  return (
    // Semi-transparent overlay - Update the initial summary popup
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trip-summary-title"
    >
      {/* Popup content */}
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h1 id="trip-summary-title" className="text-2xl font-[600] font-['Poppins',sans-serif] text-[#1e293b]">Trip Summary</h1>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded" role="alert">
            {error}
          </div>
        )}

        <form className="space-y-4 mt-6">
          <div>
            <label htmlFor="tripName" className="block text-sm destination-subtitle mb-1">
              Trip Name
            </label>
            <input
              type="text"
              id="tripName"
              name="tripName"
              value={tripSummary.tripName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all font-['Inter_var']"
              placeholder="Enter trip name"
              required
            />
          </div>

          {/* Add Country Selector */}
          <div className="relative">
            <label htmlFor="country" className="block text-sm destination-subtitle mb-1">
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all font-['Inter_var']"
                placeholder="Select a country"
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowCountries(!showCountries)}
              >
                <ChevronDown className="h-4 w-4 text-[#00C48C]" />
              </button>
            </div>

            {/* Countries dropdown */}
            {showCountries && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto">
                {filteredCountries.map((country, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors font-['Inter_var']"
                    onClick={() => handleCountrySelect(country)}
                  >
                    {country}
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="px-4 py-2 text-sm text-gray-500 font-['Inter_var']">
                    No countries found
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm destination-subtitle mb-1">
                Duration
              </label>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-[#00C48C] mr-2" />
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  min="1"
                  value={tripSummary.duration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all font-['Inter_var']"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm destination-subtitle mb-1">
                Travelers
              </label>
              <div className="flex items-center">
                <Users className="w-5 h-5 text-[#00C48C] mr-2" />
                <input
                  type="number"
                  id="passengers"
                  name="passengers"
                  min="1"
                  value={tripSummary.passengers}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all font-['Inter_var']"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm destination-subtitle mb-1">
              Start Date
            </label>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-[#00C48C] mr-2" />
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={tripSummary.startDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all font-['Inter_var']"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors font-['Inter_var']"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProceed}
              className="px-6 py-2 bg-[#00C48C] text-white rounded-lg hover:bg-[#00B380] transition-colors shadow-sm flex items-center gap-2 font-['Inter_var']"
            >
              <span>Proceed</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateItinerary; 