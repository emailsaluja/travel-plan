import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Globe2, MapPin, Moon, Bed, Compass, Bus, Plus, Trash2, ArrowLeft, Edit } from 'lucide-react';
import { countries } from '../data/countries';
import PlaceAutocomplete from '../components/PlaceAutocomplete';
import DayByDayGrid from '../components/DayByDayGrid';
import DiscoverPopup from '../components/DiscoverPopup';
import TripSummaryEdit from '../components/TripSummaryEdit';
import { ItineraryService } from '../services/itinerary.service';
import { UserItineraryService } from '../services/user-itinerary.service';
import { Calendar, Users, Clock, Navigation } from 'lucide-react';
import HotelSearchPopup from '../components/HotelSearchPopup';
import TransportPopup from '../components/TransportPopup';

interface DestinationData {
  destination: string;
  nights: number;
  discover: string;
  transport: string;
  notes: string;
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
}

interface TripSummary {
  tripName: string;
  country: string;
  duration: number;
  startDate: string;
  passengers: number;
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
    passengers: 1
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
              passengers: data.passengers
            });

            // Set destinations
            setItineraryDays(data.destinations.map((dest: DestinationData) => ({
              destination: dest.destination,
              nights: dest.nights,
              discover: dest.discover,
              transport: dest.transport,
              notes: dest.notes
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
      notes: ''
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
            notes: day.notes
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
            notes: day.notes
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
      navigate('/my-itineraries');
    } catch (error) {
      console.error('Error saving itinerary:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total nights from sleeping entries
  const totalNights = itineraryDays.reduce((sum, day) => sum + (day.nights || 0), 0);

  // Format date range (e.g., "10 April - 17 April")
  const formatDateRange = () => {
    const startDate = new Date(tripSummary.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + tripSummary.duration - 1);
    
    return `${startDate.getDate()} ${startDate.toLocaleString('default', { month: 'long' })} - ${endDate.getDate()} ${endDate.toLocaleString('default', { month: 'long' })}`;
  };

  const handleAddDestination = () => {
    const newDay = {
      destination: '',
      nights: 1,
      discover: '',
      transport: '',
      notes: ''
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
      const newState = prev.map(da => 
        da.dayIndex === dayIndex
          ? { ...da, selectedAttractions: attractions }
          : da
      );
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
      ).map(h => h.hotel);
      
      // Update the destination
      updatedDestinations[i] = {
        ...dest
      };
      
      currentDayCount += dest.nights;
    }
    
    setItineraryDays(updatedDestinations);
  };

  const handleHotelSelect = (index: number, hotel: string) => {
    // Calculate the starting day index for this destination
    let startDayIndex = 0;
    for (let i = 0; i < index; i++) {
      startDayIndex += itineraryDays[i].nights;
    }

    // Update hotels for all days of this destination
    const nights = itineraryDays[index].nights;
    const updatedHotels = [...dayHotels];
    
    for (let i = 0; i < nights; i++) {
      const dayIndex = startDayIndex + i;
      const existingHotelIndex = updatedHotels.findIndex(h => h.dayIndex === dayIndex);
      
      if (existingHotelIndex >= 0) {
        updatedHotels[existingHotelIndex] = { dayIndex, hotel };
      } else {
        updatedHotels.push({ dayIndex, hotel });
      }
    }
    
    setDayHotels(updatedHotels);
    setIsHotelSearchOpen(false);
  };

  const renderDestinationsGrid = () => {
    // Calculate cumulative nights to determine start date for each destination
    let cumulativeNights = 0;
    const destinationsWithDates = itineraryDays.map((day, index) => {
      const startDate = new Date(tripSummary.startDate);
      startDate.setDate(startDate.getDate() + cumulativeNights);
      
      // Calculate the starting day index for this destination
      let startDayIndex = 0;
      for (let i = 0; i < index; i++) {
        startDayIndex += itineraryDays[i].nights;
      }
      
      // Get all hotels for this destination's days
      const destHotels = dayHotels
        .filter(h => h.dayIndex >= startDayIndex && h.dayIndex < startDayIndex + day.nights)
        .map(h => h.hotel);
      
      // If all days have the same hotel, use that as the destination's hotel
      const uniqueHotels = [...new Set(destHotels)];
      const destinationHotel = uniqueHotels.length === 1 ? uniqueHotels[0] : '';
      
      cumulativeNights += day.nights;
      return {
        ...day,
        startDate: startDate.toISOString().split('T')[0],
        hotel: destinationHotel
      };
    });

    return (
      <div className="flex-1 overflow-auto">
        {/* Grid Header */}
        <div className="grid grid-cols-[auto,2fr,1fr,1fr,1fr,1fr] gap-4 mb-4">
          <div className="w-10"></div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">DESTINATION</span>
          </div>
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4" />
            <span className="font-medium">NIGHTS</span>
          </div>
          <div className="flex items-center gap-2">
            <Bed className="w-4 h-4" />
            <span className="font-medium">SLEEPING</span>
          </div>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4" />
            <span className="font-medium">DISCOVER</span>
          </div>
          <div className="flex items-center gap-2">
            <Bus className="w-4 h-4" />
            <span className="font-medium">TRANSPORT</span>
          </div>
        </div>

        {/* Grid Rows */}
        <div className="space-y-4">
          {destinationsWithDates.map((day, index) => {
            return (
              <div key={index} className="grid grid-cols-[auto,2fr,1fr,1fr,1fr,1fr] gap-4 bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <button
                    onClick={() => handleDeleteDestination(index)}
                    disabled={itineraryDays.length <= 1}
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      itineraryDays.length <= 1 ? 'text-gray-300' : 'text-gray-500 hover:text-red-500'
                    }`}
                    title={itineraryDays.length <= 1 ? "Can't delete the only destination" : "Delete destination"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <PlaceAutocomplete
                    country={tripSummary.country}
                    value={day.destination}
                    onChange={(value) => handleDayUpdate(index, 'destination', value)}
                    onPlaceSelect={(place) => {
                      console.log('Selected place:', place);
                      handleDayUpdate(index, 'destination', place.formatted_address || place.name || '');
                    }}
                    startDate={day.startDate}
                    nights={day.nights}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleNightsChange(index, 'decrement')}
                    className="text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                    type="button"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={day.nights}
                    onChange={(e) => handleDayUpdate(index, 'nights', parseInt(e.target.value) || 0)}
                    className="w-16 text-center border-none focus:ring-0 bg-transparent"
                    min="0"
                    readOnly // Make it read-only since we're using buttons
                  />
                  <button 
                    onClick={() => handleNightsChange(index, 'increment')}
                    className="text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                    type="button"
                  >
                    +
                  </button>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {day.hotel ? (
                      <div className="flex-1 p-2 text-gray-700">{day.hotel}</div>
                    ) : (
                      <div className="flex-1 p-2"></div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentDestinationForHotel(day.destination);
                        setCurrentDestinationIndexForHotel(index);
                        setIsHotelSearchOpen(true);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {(() => {
                    // Calculate the starting day index for this destination
                    let startDayIndex = 0;
                    for (let i = 0; i < index; i++) {
                      startDayIndex += itineraryDays[i].nights;
                    }
                    
                    // Check if all days in this destination have hotels selected
                    const hasAllDaysWithHotels = Array.from({ length: day.nights }, (_, i) => {
                      const dayIndex = startDayIndex + i;
                      return dayHotels.some(h => h.dayIndex === dayIndex && h.hotel);
                    }).every(Boolean);

                    // Only show "Already selected" if we don't have a hotel to show in the destinations tab
                    if (hasAllDaysWithHotels && !day.hotel) {
                      return (
                        <div className="mt-1 text-sm text-emerald-600">
                          Already selected
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div>
                  <button 
                    className="text-amber-500 hover:bg-amber-50 p-2 rounded-full"
                    onClick={() => {
                      if (day.destination) {  // Only open if destination is selected
                        setActiveDestinationIndex(index);
                        setShowDiscoverPopup(true);
                      } else {
                        // Maybe show a toast or alert that destination needs to be selected first
                        alert('Please select a destination first');
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {day.discover && (
                    <span className="ml-2 text-sm text-gray-500">{day.discover}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <button 
                    className="text-blue-500 hover:bg-blue-50 p-2 rounded-full"
                    onClick={() => {
                      if (day.destination) {
                        // Find the next destination for transport options
                        const nextDestination = destinationsWithDates[index + 1];
                        if (nextDestination) {
                          setCurrentDestinationForTransport({
                            from: day.destination,
                            to: nextDestination.destination,
                            index
                          });
                          setShowTransportPopup(true);
                        }
                      } else {
                        alert('Please select a destination first');
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {day.transport && (
                    <span className="ml-2 text-sm text-gray-500">{day.transport}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Updated Add New Destination Button */}
        <button 
          onClick={handleAddDestination}
          className="mt-4 text-gray-500 hover:text-gray-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add new destination...
        </button>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <button className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm">
            Discover
          </button>
          <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm">
            Collection
          </button>
        </div>
      </div>
    );
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
      <div className="flex h-[calc(100vh-64px)]">
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 mt-16">
            {/* Back button */}
            <button
              onClick={() => navigate(-1)}
              className="absolute top-20 left-6 p-2 bg-white/90 rounded-full text-gray-700 hover:bg-white transition-colors shadow-lg"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex flex-col ml-14">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-medium text-gray-900">{tripSummary.tripName}</h1>
                <button
                  onClick={() => setShowTripSummaryEdit(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  title="Edit trip summary"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-gray-500">{formatDateRange()}</span>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Progress Circle */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="h-12 w-12">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-medium">
                        {totalNights}/{tripSummary.duration}
                      </span>
                    </div>
                    <svg className="transform -rotate-90" width="48" height="48">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="#E5E7EB"
                        strokeWidth="4"
                        fill="none"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="#3B82F6"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${(totalNights / tripSummary.duration) * 125.6} 125.6`}
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">Nights</span>
                  <span className="text-sm text-gray-500">planned</span>
                </div>
              </div>

              <button
                onClick={handleSave}
                className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"
                disabled={loading}
              >
                {loading ? 'Saving...' : saveButtonText}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b mb-6">
            <div className="flex space-x-8">
              <button
                className={`pb-4 px-1 ${
                  activeTab === 'destinations'
                    ? 'border-b-2 border-emerald-500 text-emerald-500'
                    : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('destinations')}
              >
                Destinations
              </button>
              <button
                className={`pb-4 px-1 ${
                  activeTab === 'day-by-day'
                    ? 'border-b-2 border-emerald-500 text-emerald-500'
                    : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('day-by-day')}
              >
                Day by day
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'destinations' ? (
            renderDestinationsGrid()
          ) : (
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
            />
          )}
        </div>

        {/* Right side - Map placeholder */}
        <div className="w-1/3 bg-gray-100 border-l">
          <div className="h-full flex items-center justify-center text-gray-500">
            Map will be implemented later
          </div>
        </div>

        {/* Trip Summary Edit Modal */}
        {showTripSummaryEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <TripSummaryEdit
              tripSummary={tripSummary}
              onSave={handleTripSummaryUpdate}
              onCancel={() => setShowTripSummaryEdit(false)}
            />
          </div>
        )}

        {/* Add this popup component */}
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

        <HotelSearchPopup
          isOpen={isHotelSearchOpen}
          onClose={() => setIsHotelSearchOpen(false)}
          destination={currentDestinationForHotel}
          selectedHotel={currentDestinationIndexForHotel >= 0 ? 
            dayHotels.find(h => {
              let startDayIndex = 0;
              for (let i = 0; i < currentDestinationIndexForHotel; i++) {
                startDayIndex += itineraryDays[i].nights;
              }
              return h.dayIndex === startDayIndex;
            })?.hotel : undefined
          }
          onHotelSelect={(hotel) => {
            if (currentDestinationIndexForHotel >= 0) {
              handleHotelSelect(currentDestinationIndexForHotel, hotel);
            }
          }}
        />

        {/* Transport Popup */}
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
      </div>
    );
  }

  return (
    // Semi-transparent overlay
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Popup content */}
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Trip Summary</h2>
        
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