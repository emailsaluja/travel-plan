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
  Bus as BusIcon
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
}

type TabType = 'destinations' | 'day-by-day';

interface DayAttractions {
  dayIndex: number;
  selectedAttractions: string[];
}

interface DayAttractionData {
  day_index: number;
  attractions: string[];
}

interface DayHotel {
  dayIndex: number;
  hotel: string;
}

interface SaveDayHotel {
  day_index: number;
  hotel: string;
}

interface DayNote {
  dayIndex: number;
  notes: string;
}

interface SaveDayNote {
  day_index: number;
  notes: string;
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
    isPrivate: false
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
              isPrivate: data.is_private
            });
            setCountrySearch(data.country);

            // Set destinations
            setItineraryDays(data.destinations.map((dest: DestinationData) => ({
              destination: dest.destination,
              nights: dest.nights,
              discover: dest.discover,
              transport: dest.transport,
              notes: dest.notes,
              food: dest.food || ''
            })));

            // Set day attractions
            if (data.day_attractions) {
              console.log('Setting day attractions:', data.day_attractions);
              setDayAttractions(data.day_attractions.map((da: DayAttractionData) => ({
                dayIndex: da.day_index,
                selectedAttractions: da.attractions
              })));
              setIsDayAttractionsInitialized(true);
            }

            // Set day hotels
            if (data.day_hotels) {
              console.log('Setting day hotels:', data.day_hotels);
              setDayHotels(data.day_hotels.map((dh: SaveDayHotel) => ({
                dayIndex: dh.day_index,
                hotel: dh.hotel
              })));
            }

            // Set day notes
            if (data.day_notes) {
              console.log('Setting day notes:', data.day_notes);
              setDayNotes(data.day_notes.map((dn: SaveDayNote) => ({
                dayIndex: dn.day_index,
                notes: dn.notes
              })));
            } else {
              console.log('No day notes found in data');
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
    setItineraryDays(updatedDays);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (itineraryId) {
        // Update existing itinerary
        await UserItineraryService.updateItinerary(itineraryId, {
          tripSummary,
          destinations: itineraryDays.map(day => ({
            destination: day.destination,
            nights: day.nights,
            discover: day.discover,
            transport: day.transport,
            notes: day.notes,
            food: day.food || ''
          })),
          dayAttractions,
          dayHotels: dayHotels.map(dh => ({
            day_index: dh.dayIndex,
            hotel: dh.hotel
          })),
          dayNotes: dayNotes.map(dn => ({
            day_index: dn.dayIndex,
            notes: dn.notes
          }))
        });
      } else {
        // Create new itinerary
        await UserItineraryService.saveItinerary({
          tripSummary,
          destinations: itineraryDays.map(day => ({
            destination: day.destination,
            nights: day.nights,
            discover: day.discover,
            transport: day.transport,
            notes: day.notes,
            food: day.food || ''
          })),
          dayAttractions,
          dayHotels: dayHotels.map(dh => ({
            day_index: dh.dayIndex,
            hotel: dh.hotel
          })),
          dayNotes: dayNotes.map(dn => ({
            day_index: dn.dayIndex,
            notes: dn.notes
          }))
        });
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving itinerary:', error);
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
    if (change === 'increment') {
      updatedDays[index].nights += 1;
    } else {
      updatedDays[index].nights = Math.max(0, updatedDays[index].nights - 1);
    }
    setItineraryDays(updatedDays);
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

  const handleHotelSelect = (hotel: string) => {
    if (currentDestinationIndexForHotel >= 0) {
      if (activeTab === 'destinations' && currentDestinationIndexForHotel < itineraryDays.length) {
        // Calculate the start and end day indices for the selected destination
        let startDayIndex = 0;
        for (let i = 0; i < currentDestinationIndexForHotel && i < itineraryDays.length; i++) {
          startDayIndex += itineraryDays[i].nights || 0;
        }
        const endDayIndex = startDayIndex + (itineraryDays[currentDestinationIndexForHotel].nights || 0);

        // Update hotels for all days in this destination
        const updatedHotels = [...dayHotels];

        // Remove any existing hotel entries for this destination's days
        const filteredHotels = updatedHotels.filter(h =>
          h.dayIndex < startDayIndex || h.dayIndex >= endDayIndex
        );

        // Add new hotel entries for each day in this destination
        for (let dayIndex = startDayIndex; dayIndex < endDayIndex; dayIndex++) {
          filteredHotels.push({
            dayIndex,
            hotel
          });
        }

        handleDayHotelsUpdate(filteredHotels);
      } else {
        // Day by Day view - update only the selected day
        const updatedHotels = dayHotels.filter(h => h.dayIndex !== currentDestinationIndexForHotel);
        updatedHotels.push({
          dayIndex: currentDestinationIndexForHotel,
          hotel
        });
        handleDayHotelsUpdate(updatedHotels);
      }
      setIsHotelSearchOpen(false);
    }
  };

  const handleDayFoodSelect = (destination: string, dayIndex: number) => {
    if (activeTab === 'destinations') {
      // In destinations tab, the dayIndex is already the correct destination index
      setActiveDestinationIndexForFood(dayIndex);
    } else {
      // In day-by-day tab, we need to find the destination index based on the day index
      let destinationIndex = 0;
      let currentDayCount = 0;

      for (let i = 0; i < itineraryDays.length; i++) {
        currentDayCount += itineraryDays[i].nights;
        if (dayIndex < currentDayCount) {
          destinationIndex = i;
          break;
        }
      }
      setActiveDestinationIndexForFood(destinationIndex);
    }
    setShowFoodPopup(true);
  };

  const handleFoodSelect = (index: number, foodItems: string[]) => {
    if (activeTab === 'destinations') {
      // In destinations tab, directly update the destination
      const updatedDays = [...itineraryDays];
      updatedDays[index] = {
        ...updatedDays[index],
        food: foodItems.join(', ')
      };
      setItineraryDays(updatedDays);
    } else {
      // In day-by-day tab, find the destination index based on the day index
      let destinationIndex = 0;
      let currentDayCount = 0;

      for (let i = 0; i < itineraryDays.length; i++) {
        currentDayCount += itineraryDays[i].nights;
        if (index < currentDayCount) {
          destinationIndex = i;
          break;
        }
      }

      const updatedDays = [...itineraryDays];
      updatedDays[destinationIndex] = {
        ...updatedDays[destinationIndex],
        food: foodItems.join(', ')
      };
      setItineraryDays(updatedDays);
    }
    setShowFoodPopup(false);
    setActiveDestinationIndexForFood(null);
  };

  const renderDestinationsGrid = () => {
    return (
      <div className="space-y-4">
        {/* Column Headers */}
        <div className="grid grid-cols-[1fr,140px,200px,120px,120px,120px] gap-4 px-4 py-2 text-sm text-gray-500">
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
            <div className="w-6 h-6 rounded-full bg-[#14B8A6]/10 flex items-center justify-center">
              <Transport className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <span className="font-[600] font-['Poppins',sans-serif]">TRANSPORT</span>
          </div>
        </div>

        {/* Destinations List */}
        <div className="space-y-2">
          {itineraryDays.map((day, index) => (
            <div key={index} className="grid grid-cols-[1fr,140px,200px,120px,120px,120px] gap-4 items-center bg-white rounded-lg px-4 py-3 hover:shadow-sm transition-shadow">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#00C48C]/10 flex items-center justify-center text-sm font-medium text-[#00C48C]">
                    {index + 1}
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
                    />
                    <div className="text-sm text-[#64748B] mt-1">
                      {formatDateRange(index)}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDayUpdate(index, 'nights', Math.max(1, day.nights - 1))}
                    className="w-8 h-8 flex items-center justify-center text-[#64748B] hover:bg-gray-100"
                  >
                    -
                  </button>
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                    <span className="font-bold text-[#1E293B]">{day.nights}</span>
                  </div>
                  <button
                    onClick={() => handleDayUpdate(index, 'nights', day.nights + 1)}
                    className="w-8 h-8 flex items-center justify-center text-[#64748B] hover:bg-gray-100"
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
                      className="font-medium text-[#1E293B] hover:text-[#00C48C] transition-colors"
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
                      className="text-sm font-medium text-[#1E293B] hover:text-[#00C48C] transition-colors"
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
                {day.food ? (
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => {
                        handleDayFoodSelect(day.destination, index);
                      }}
                      className="text-sm font-medium text-[#1E293B] hover:text-[#00C48C] transition-colors"
                    >
                      {day.food.split(',').filter(item => item.trim()).length} food spots
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
                )}
              </div>
              <div>
                {index > 0 && (
                  <div className="flex items-center justify-center gap-2">
                    {day.transport ? (
                      <button
                        disabled={index === 0}
                        onClick={() => {
                          if (index === 0) return;
                          setCurrentDestinationForTransport({
                            from: itineraryDays[index - 1].destination,
                            to: day.destination,
                            index
                          });
                          setShowTransportPopup(true);
                        }}
                        className="flex items-center gap-2 hover:text-[#00C48C] transition-colors"
                      >
                        {day.transport.includes('Drive') && <Car className="w-5 h-5 text-[#14B8A6]" />}
                        {day.transport.includes('Air') && <Plane className="w-5 h-5 text-[#14B8A6]" />}
                        {day.transport.includes('Train') && <Train className="w-5 h-5 text-[#14B8A6]" />}
                        {day.transport.includes('Bus') && <BusIcon className="w-5 h-5 text-[#14B8A6]" />}
                        <span className="text-sm font-medium text-[#1E293B]">
                          {day.transport.split(' - ')[1]}
                        </span>
                      </button>
                    ) : (
                      <button
                        disabled={index === 0}
                        onClick={() => {
                          if (index === 0) return;
                          setCurrentDestinationForTransport({
                            from: itineraryDays[index - 1].destination,
                            to: day.destination,
                            index
                          });
                          setShowTransportPopup(true);
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border ${index === 0
                            ? 'text-gray-300 border-gray-300 cursor-not-allowed'
                            : 'text-[#14B8A6] hover:bg-[#14B8A6]/10 border-[#14B8A6]'
                          }`}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
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
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-[#00C48C] transition-colors"
          >
            <Plus className="w-4 h-4" />
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
    setShouldUpdateDayAttractions(true);
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
      <div className="min-h-screen bg-[#f8fafc]">
        {/* Top Navigation */}
        <nav className="bg-white border-b border-gray-100 fixed top-0 left-0 right-0 z-50">
          <div className="max-w-[1400px] mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex-shrink-0">
                <img src="/images/stippl-logo.svg" alt="Stippl" className="h-8" />
              </Link>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <Link to="/you" className="flex items-center gap-2 text-gray-700">
                    <div className="w-6 h-6 rounded-full bg-[#00C48C] flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-[600] font-['Poppins',sans-serif]">You</span>
                  </Link>
                  <Link to="/discover" className="flex items-center gap-2 text-gray-500">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="font-[600] font-['Poppins',sans-serif]">Discover</span>
                  </Link>
                </div>

                <div className="flex items-center gap-4">
                  <Link to="/invite" className="text-[#00C48C] hover:text-[#00B380] transition-colors font-[600] font-['Poppins',sans-serif]">
                    Invite a friend
                  </Link>
                  <button className="relative">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#00C48C] rounded-full"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-[1400px] mx-auto px-4 py-6 pt-20">
          {/* Back Button */}
          <div className="mb-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-[#1e293b] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          {/* Main Content */}
          <div className="flex gap-8">
            {/* Left Sidebar */}
            <div className="w-[240px] flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                <h2 className="text-lg font-[600] font-['Poppins',sans-serif] text-[#1e293b] mb-4">Trip Summary</h2>
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
                <div className="border-b border-gray-200 pb-4">
                  {/* Tabs and Nights Planned in same row */}
                  <div className="flex items-center justify-between">
                    {/* Tabs */}
                    <div className="flex items-center">
                      <button
                        className={`px-6 py-3 text-sm font-[600] font-['Poppins',sans-serif] border-b-2 -mb-[1px] ${activeTab === 'destinations'
                          ? 'text-[#00C48C] border-[#00C48C]'
                          : 'text-gray-500 border-transparent hover:text-[#1e293b]'
                          } transition-colors`}
                        onClick={() => setActiveTab('destinations')}
                      >
                        Destinations
                      </button>
                      <button
                        className={`px-6 py-3 text-sm font-[600] font-['Poppins',sans-serif] border-b-2 -mb-[1px] ${activeTab === 'day-by-day'
                          ? 'text-[#00C48C] border-[#00C48C]'
                          : 'text-gray-500 border-transparent hover:text-[#1e293b]'
                          } transition-colors`}
                        onClick={() => setActiveTab('day-by-day')}
                      >
                        Day by Day
                      </button>
                    </div>

                    {/* Nights Planned Indicator */}
                    <div className="flex items-center gap-3 pr-6">
                      <div className="relative h-16 w-16">
                        <svg className="transform -rotate-90" width="64" height="64">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="#E5E7EB"
                            strokeWidth="4"
                            fill="none"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="#00C48C"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${(totalNights / tripSummary.duration) * 175.9} 175.9`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xl font-medium text-[#00C48C]">
                          {totalNights}/{tripSummary.duration}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-[#1e293b] text-lg">Nights</span>
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
                      onFoodSelect={handleDayFoodSelect}
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

        {/* Popups */}
        {showDiscoverPopup && activeDestinationIndex !== null && (
          <DiscoverPopup
            isOpen={showDiscoverPopup}
            onClose={() => {
              setShowDiscoverPopup(false);
              setActiveDestinationIndex(null);
            }}
            destination={itineraryDays[activeDestinationIndex].destination}
            selectedAttractions={itineraryDays[activeDestinationIndex].discover.split(', ').filter(Boolean)}
            onAttractionsSelect={(attractions) => {
              handleDiscoverSelect(activeDestinationIndex, attractions);
            }}
          />
        )}

        {showTransportPopup && currentDestinationForTransport && (
          <TransportPopup
            isOpen={showTransportPopup}
            onClose={() => {
              setShowTransportPopup(false);
              setCurrentDestinationForTransport(null);
            }}
            fromDestination={currentDestinationForTransport.from}
            toDestination={currentDestinationForTransport.to}
            onTransportSelect={(transport) => {
              handleTransportSelect(currentDestinationForTransport.index, transport);
            }}
          />
        )}

        <HotelSearchPopup
          isOpen={isHotelSearchOpen}
          onClose={() => setIsHotelSearchOpen(false)}
          destination={currentDestinationForHotel}
          selectedHotel={
            activeTab === 'destinations' ?
              (currentDestinationIndexForHotel >= 0 && currentDestinationIndexForHotel < itineraryDays.length ?
                dayHotels.find(h => {
                  let startDayIndex = 0;
                  for (let i = 0; i < currentDestinationIndexForHotel && i < itineraryDays.length; i++) {
                    startDayIndex += itineraryDays[i].nights || 0;
                  }
                  return h.dayIndex === startDayIndex;
                })?.hotel : undefined
              ) :
              dayHotels.find(h => h.dayIndex === currentDestinationIndexForHotel)?.hotel
          }
          onHotelSelect={handleHotelSelect}
        />

        {showTripSummaryEdit && (
          <TripSummaryEdit
            tripSummary={tripSummary}
            onSave={handleTripSummaryUpdate}
            onCancel={() => setShowTripSummaryEdit(false)}
          />
        )}

        <FoodPopup
          isOpen={showFoodPopup}
          onClose={() => {
            setShowFoodPopup(false);
            setActiveDestinationIndexForFood(null);
          }}
          destination={activeDestinationIndexForFood !== null ? itineraryDays[activeDestinationIndexForFood]?.destination || '' : ''}
          selectedFoodItems={activeDestinationIndexForFood !== null ? (itineraryDays[activeDestinationIndexForFood]?.food || '').split(',').filter(Boolean).map(item => item.trim()) : []}
          onFoodSelect={(foodItems) => {
            if (activeDestinationIndexForFood !== null) {
              handleFoodSelect(activeDestinationIndexForFood, foodItems);
            }
          }}
        />
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
              onClick={() => navigate('/my-itineraries')}
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