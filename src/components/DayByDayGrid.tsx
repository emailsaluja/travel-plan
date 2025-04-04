import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Calendar, Bed, Compass, Plus, StickyNote, MapPin, Sparkles, Edit, Utensils, Car, Plane, Train, BusIcon } from 'lucide-react';
import DayDiscoverPopup from './DayDiscoverPopup';
import HotelSearchPopup from './HotelSearchPopup';
import NotesPopup from './NotesPopup';
import FoodPopup from './FoodPopup';
import { FaUtensils, FaPlus } from 'react-icons/fa';
import { cleanDestination } from '../utils/stringUtils';
import { supabase } from '../lib/supabase';

// Add a function to generate unique IDs
const generateUniqueId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

interface DayHotel {
  dayIndex: number;
  hotel: string;
  isManual?: boolean;
}

interface Attraction {
  id: string;
  name: string;
  description: string;
  time?: string;
}

interface FoodItem {
  id: string;
  name: {
    text: string;
    cuisine: string;
    known_for: string;
  };
}

interface DayByDayGridProps {
  tripStartDate: string;
  destinations: Array<{
    destination: string;
    nights: number;
    discover: string;
    transport: string;
    notes: string;
    hotel?: string;
    food: string;
    food_desc?: string;
    manual_discover?: string;
    manual_discover_desc?: string;
  }>;
  onDestinationsUpdate: (destinations: any[]) => void;
  dayAttractions: Array<{
    dayIndex: number;
    selectedAttractions: string[];
  }>;
  onDayAttractionsUpdate: (dayIndex: number, attractions: string[]) => void;
  dayHotels: Array<DayHotel>;
  onDayHotelsUpdate: (hotels: Array<DayHotel>) => void;
  dayNotes: Array<{
    dayIndex: number;
    notes: string;
    dayOverview?: string;
  }>;
  onDayNotesUpdate: (notes: Array<{ dayIndex: number; notes: string; dayOverview?: string }>) => void;
  onHotelClick?: (destination: string, dayIndex: number) => void;
  onFoodSelect?: (destination: string, dayIndex: number) => void;
  dayFoods: FoodItem[][];
  onFoodClick?: (destination: string, dayIndex: number) => void;
  onNotesClick: (destination: string, dayIndex: number) => void;
  itineraryId: string;
  className?: string;
  iconSize?: string;
  spacing?: string;
  padding?: string;
  buttonSize?: string;
  headingSize?: string;
  subheadingSize?: string;
}

interface ExpandedDay {
  destination: string;
  nights: number;
  discover: string;
  dayIndex: number;
  isFirstDay: boolean;
  date: Date;
  food: string;
  hotel?: string;
}

interface DayNote {
  dayIndex: number;
  notes: string;
  dayOverview?: string;
}

interface SelectedDay {
  date: string;
  destination: string;
  discover: string;
  dayIndex: number;
  allAttractions: Attraction[];
}

const DayByDayGrid: React.FC<DayByDayGridProps> = ({
  tripStartDate,
  destinations,
  onDestinationsUpdate,
  dayAttractions,
  onDayAttractionsUpdate,
  dayHotels,
  onDayHotelsUpdate,
  dayNotes,
  onDayNotesUpdate,
  onHotelClick,
  onFoodSelect,
  dayFoods,
  onFoodClick,
  onNotesClick,
  itineraryId,
  className,
  iconSize,
  spacing,
  padding,
  buttonSize,
  headingSize,
  subheadingSize
}) => {
  const [showDiscoverPopup, setShowDiscoverPopup] = useState(false);
  const [showNotesPopup, setShowNotesPopup] = useState(false);
  const [showFoodPopup, setShowFoodPopup] = useState(false);
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);
  const [selectedDayForNotes, setSelectedDayForNotes] = useState<{
    dayIndex: number;
    notes: string;
    dayOverview?: string;
  } | null>(null);
  const [selectedDayForFood, setSelectedDayForFood] = useState<SelectedDay | null>(null);
  const [isLoadingAttractions, setIsLoadingAttractions] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const previousAttractionsRef = useRef<string>('');
  const [foodOptionsMap, setFoodOptionsMap] = useState<Map<number, FoodItem[]>>(new Map());
  const [isLoadingFoodOptions, setIsLoadingFoodOptions] = useState(false);

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

  const expandedDays = useMemo(() => {
    let days: ExpandedDay[] = [];
    let dayIndex = 0;
    let currentDate = new Date(tripStartDate);
    let totalNights = 0;

    destinations.forEach(dest => {
      totalNights += dest.nights;
    });

    destinations.forEach(destination => {
      const nights = destination.nights || 0;

      for (let i = 0; i < nights; i++) {
        if (dayIndex < totalNights) {
          days.push({
            ...destination,
            dayIndex,
            isFirstDay: i === 0,
            date: new Date(currentDate),
            food: destination.food || '',
            hotel: destination.hotel
          });
          dayIndex++;
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

    return days;
  }, [tripStartDate, destinations]);

  // Memoize the data loading function to prevent unnecessary recreations
  const loadInitialData = useCallback(async () => {
    if (!itineraryId || isLoadingAttractions) return;

    // Check if we already have the same data loaded
    const currentAttractions = JSON.stringify(dayAttractions);
    if (currentAttractions === previousAttractionsRef.current && hasLoadedInitialData) {
      return;
    }

    setIsLoadingAttractions(true);
    try {
      // Load attractions, food options, and notes in parallel
      const [attractionsResponse, foodResponse, notesResponse] = await Promise.all([
        supabase
          .from('user_itinerary_day_attractions')
          .select('day_index, attractions')
          .eq('itinerary_id', itineraryId),
        supabase
          .from('user_itinerary_day_food_options')
          .select('day_index, name')
          .eq('itinerary_id', itineraryId),
        supabase
          .from('user_itinerary_day_notes')
          .select('day_index, notes, day_overview')
          .eq('itinerary_id', itineraryId)
      ]);

      if (attractionsResponse.error) {
        console.error('Error loading attractions:', attractionsResponse.error);
      }

      if (foodResponse.error) {
        console.error('Error loading food options:', foodResponse.error);
      }

      if (notesResponse.error) {
        console.error('Error loading notes:', notesResponse.error);
      }

      // Handle notes data
      if (notesResponse.data) {
        const updatedNotes = notesResponse.data.map(item => ({
          dayIndex: item.day_index,
          notes: item.notes,
          dayOverview: item.day_overview
        }));
        onDayNotesUpdate(updatedNotes);
      }

      // Handle attractions data
      if (attractionsResponse.data) {
        const attractionsMap = new Map();
        attractionsResponse.data.forEach(item => {
          if (item.day_index !== undefined && Array.isArray(item.attractions)) {
            attractionsMap.set(item.day_index, item.attractions);
          }
        });

        const updates: { dayIndex: number; attractions: string[] }[] = [];

        expandedDays.forEach(day => {
          const existingAttractions = dayAttractions.find(da => da.dayIndex === day.dayIndex);
          const dbAttractions = attractionsMap.get(day.dayIndex);

          if (dbAttractions && (!existingAttractions ||
            JSON.stringify(dbAttractions) !== JSON.stringify(existingAttractions.selectedAttractions))) {
            updates.push({ dayIndex: day.dayIndex, attractions: dbAttractions });
          } else if (!existingAttractions && !dbAttractions) {
            const destinationData = destinations.find(d => d.destination === day.destination);
            const destinationAttractions = [
              ...(destinationData?.discover?.split(',').filter(Boolean) || []),
              ...(destinationData?.manual_discover?.split(',').filter(Boolean) || [])
            ].map(attraction => attraction.trim());

            if (destinationAttractions.length > 0) {
              updates.push({ dayIndex: day.dayIndex, attractions: destinationAttractions });
            }
          }
        });

        if (updates.length > 0) {
          updates.forEach(update => {
            onDayAttractionsUpdate(update.dayIndex, update.attractions);
          });
        }
      }

      // Handle food options data
      if (foodResponse.data) {
        const newFoodOptionsMap = new Map<number, FoodItem[]>();
        foodResponse.data.forEach(item => {
          if (item.day_index !== undefined && Array.isArray(item.name)) {
            newFoodOptionsMap.set(item.day_index, item.name);
          }
        });
        setFoodOptionsMap(newFoodOptionsMap);
      }

      // Store the current state for future comparison
      previousAttractionsRef.current = JSON.stringify(dayAttractions);
      setHasLoadedInitialData(true);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setIsLoadingAttractions(false);
    }
  }, [itineraryId, expandedDays, destinations, dayAttractions, onDayAttractionsUpdate, onDayNotesUpdate, isLoadingAttractions, hasLoadedInitialData]);

  // Effect to load initial data only when necessary
  useEffect(() => {
    const shouldLoadData = itineraryId &&
      (!hasLoadedInitialData ||
        JSON.stringify(dayAttractions) !== previousAttractionsRef.current);

    if (shouldLoadData) {
      const timeoutId = setTimeout(() => {
        loadInitialData();
      }, 300); // Add a small debounce

      return () => clearTimeout(timeoutId);
    }
  }, [itineraryId, loadInitialData, hasLoadedInitialData, dayAttractions]);

  // Reset state when itineraryId changes
  useEffect(() => {
    setHasLoadedInitialData(false);
    setFoodOptionsMap(new Map());
    previousAttractionsRef.current = '';
  }, [itineraryId]);

  const handleDiscoverClick = (day: ExpandedDay, index: number) => {
    // Get the destination data for the current day
    const destinationData = destinations.find(d => d.destination === day.destination);

    // Get manual attractions and descriptions
    const manualAttractions = destinationData?.manual_discover?.split(',').filter(Boolean) || [];
    const manualDescriptions = destinationData?.manual_discover_desc?.split(',').filter(Boolean) || [];

    // Create an array of attraction objects with names and descriptions
    const allAttractions = manualAttractions.map((name, index) => ({
      id: generateUniqueId(),
      name: name.trim(),
      description: (manualDescriptions[index] || '').trim(),
      time: ''
    }));

    console.log('All attractions:', allAttractions); // Debug log

    // Get and clean the current attractions for this specific day
    const currentDayAttractions = dayAttractions.find(da => da.dayIndex === day.dayIndex);
    const cleanedCurrentAttractions = currentDayAttractions?.selectedAttractions || [];

    console.log('Current day attractions:', cleanedCurrentAttractions);

    // If there are no attractions in the master list but we have selected attractions,
    // we should include them in the master list
    if (allAttractions.length === 0 && cleanedCurrentAttractions.length > 0) {
      cleanedCurrentAttractions.forEach(attraction => {
        allAttractions.push({
          id: generateUniqueId(),
          name: attraction,
          description: '',
          time: ''
        });
      });
    }

    setSelectedDay({
      date: formatDate(day.date),
      destination: day.destination,
      discover: cleanedCurrentAttractions.join(', '),
      dayIndex: day.dayIndex,
      allAttractions
    });
    setShowDiscoverPopup(true);
  };

  const handleUpdateDayAttractions = async (attractions: Attraction[]) => {
    if (selectedDay) {
      // Extract just the names for backward compatibility with parent components
      const attractionNames = attractions.map(a => typeof a.name === 'string' ? a.name : '');

      // Clean attractions before updating
      const cleanedAttractionNames = attractionNames.filter(name => name && name.length > 0);

      console.log('Updating attractions for day:', selectedDay.dayIndex, 'with:', cleanedAttractionNames);

      try {
        // Update the local state first for immediate feedback
        const updatedDayAttractions = [...dayAttractions];
        const existingIndex = updatedDayAttractions.findIndex(da => da.dayIndex === selectedDay.dayIndex);

        if (existingIndex >= 0) {
          updatedDayAttractions[existingIndex] = {
            ...updatedDayAttractions[existingIndex],
            selectedAttractions: cleanedAttractionNames
          };
        } else {
          updatedDayAttractions.push({
            dayIndex: selectedDay.dayIndex,
            selectedAttractions: cleanedAttractionNames
          });
        }

        onDayAttractionsUpdate(selectedDay.dayIndex, cleanedAttractionNames);

        // If we have an itineraryId, update the database
        if (itineraryId) {
          // First check if record exists
          const { data: existingData, error: checkError } = await supabase
            .from('user_itinerary_day_attractions')
            .select('*')
            .eq('itinerary_id', itineraryId)
            .eq('day_index', selectedDay.dayIndex)
            .single();

          let error;

          if (existingData) {
            // Update existing record with full attraction objects
            const { error: updateError } = await supabase
              .from('user_itinerary_day_attractions')
              .update({
                attractions: attractions.map(a => ({
                  id: a.id,
                  name: typeof a.name === 'string' ? a.name : '',
                  description: typeof a.description === 'string' ? a.description : '',
                  time: typeof a.time === 'string' ? a.time : ''
                }))
              })
              .eq('itinerary_id', itineraryId)
              .eq('day_index', selectedDay.dayIndex);

            error = updateError;
          } else {
            // Insert new record with full attraction objects
            const { error: insertError } = await supabase
              .from('user_itinerary_day_attractions')
              .insert({
                itinerary_id: itineraryId,
                day_index: selectedDay.dayIndex,
                attractions: attractions.map(a => ({
                  id: a.id,
                  name: typeof a.name === 'string' ? a.name : '',
                  description: typeof a.description === 'string' ? a.description : '',
                  time: typeof a.time === 'string' ? a.time : ''
                }))
              });

            error = insertError;
          }

          if (error) {
            console.error('Error updating attractions:', error);
            // Revert local state if database update fails
            const previousAttractions = dayAttractions.find(da => da.dayIndex === selectedDay.dayIndex)?.selectedAttractions || [];
            onDayAttractionsUpdate(selectedDay.dayIndex, previousAttractions);
            throw error;
          }

          console.log('Successfully updated attractions in database');
        }

        // Store the current state for future comparison
        previousAttractionsRef.current = JSON.stringify(updatedDayAttractions);

        // Only close the popup after successful update
        setShowDiscoverPopup(false);
        setSelectedDay(null);

      } catch (error) {
        console.error('Failed to update attractions:', error);
      }
    }
  };

  const handleHotelClick = (day: ExpandedDay) => {
    if (onHotelClick) {
      onHotelClick(day.destination, day.dayIndex);
    }
  };

  const handleNotesClick = (day: ExpandedDay) => {
    const currentNote = dayNotes.find(n => n.dayIndex === day.dayIndex);
    setSelectedDayForNotes({
      dayIndex: day.dayIndex,
      notes: currentNote?.notes || '',
      dayOverview: currentNote?.dayOverview || ''
    });
    setShowNotesPopup(true);
  };

  const handleNotesUpdate = (notes: string, dayOverview: string) => {
    if (selectedDayForNotes) {
      const newNotes = [...dayNotes];
      const noteIndex = newNotes.findIndex(n => n.dayIndex === selectedDayForNotes.dayIndex);

      if (noteIndex !== -1) {
        newNotes[noteIndex] = {
          ...newNotes[noteIndex],
          notes,
          dayOverview
        };
      } else {
        newNotes.push({
          dayIndex: selectedDayForNotes.dayIndex,
          notes,
          dayOverview
        });
      }

      onDayNotesUpdate(newNotes);
      setShowNotesPopup(false);
      setSelectedDayForNotes(null);
    }
  };

  const handleFoodClick = async (day: ExpandedDay) => {
    try {
      setIsLoadingFoodOptions(true);

      // Fetch food options from the database
      const { data: foodData, error } = await supabase
        .from('user_itinerary_day_food_options')
        .select('name')
        .eq('itinerary_id', itineraryId)
        .eq('day_index', day.dayIndex)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching food options:', error);
        throw error;
      }

      // Extract food items array from the row, or use empty array if no data
      const foodItems = Array.isArray(foodData?.name) ? foodData.name : [];

      console.log('Fetched food items:', {
        dayIndex: day.dayIndex,
        foodData,
        foodItems
      });

      // Update food items for this specific day
      setFoodOptionsMap(prev => new Map(prev).set(day.dayIndex, foodItems));

      setSelectedDayForFood({
        date: formatDate(day.date),
        destination: day.destination,
        dayIndex: day.dayIndex,
        discover: '',
        allAttractions: []
      });
      setShowFoodPopup(true);
    } catch (error) {
      console.error('Error fetching food options:', error);
      setFoodOptionsMap(prev => new Map(prev).set(day.dayIndex, []));
    } finally {
      setIsLoadingFoodOptions(false);
    }
  };

  const handleUpdateDayFood = async (foodItems: FoodItem[]) => {
    if (!selectedDayForFood) return;

    try {
      // First, delete existing food options for this day
      await supabase
        .from('user_itinerary_day_food_options')
        .delete()
        .eq('itinerary_id', itineraryId)
        .eq('day_index', selectedDayForFood.dayIndex);

      // Then insert all food items as a single row with an array
      if (foodItems.length > 0) {
        const { error } = await supabase
          .from('user_itinerary_day_food_options')
          .insert({
            itinerary_id: itineraryId,
            day_index: selectedDayForFood.dayIndex,
            name: foodItems
          });

        if (error) throw error;
      }

      // Update local state for this specific day
      setFoodOptionsMap(prev => new Map(prev).set(selectedDayForFood.dayIndex, foodItems));
      setShowFoodPopup(false);
      setSelectedDayForFood(null);

    } catch (error) {
      console.error('Error updating food options:', error);
    }
  };

  const getFirstHotelForDestination = (day: ExpandedDay) => {
    // Calculate the start day index for this destination
    let startDayIndex = 0;
    for (const dest of destinations) {
      if (dest.destination === day.destination) {
        break;
      }
      startDayIndex += dest.nights;
    }

    // Find the first hotel for this destination's days
    const destDayIndices = Array.from(
      { length: destinations.find(d => d.destination === day.destination)?.nights || 0 },
      (_, index) => startDayIndex + index
    );

    const firstHotel = dayHotels.find(h => destDayIndices.includes(h.dayIndex))?.hotel;
    return firstHotel;
  };

  const getDestinationSubtitle = (day: ExpandedDay, index: number) => {
    if (index < expandedDays.length - 1 && day.destination !== expandedDays[index + 1].destination) {
      return `Travel to ${cleanDestination(expandedDays[index + 1].destination)}`;
    }
    return `Spend the day in ${cleanDestination(day.destination)}`;
  };

  const renderDestinationCell = (day: ExpandedDay, index: number) => {
    const nextDay = index < expandedDays.length - 1 ? expandedDays[index + 1] : null;
    const isTravel = nextDay && day.destination !== nextDay.destination;

    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="destination-name">
            {cleanDestination(day.destination)}
            {isTravel && (
              <>
                <span className="mx-2 text-[#64748B]">→</span>
                <span className="destination-name">{cleanDestination(nextDay.destination)}</span>
              </>
            )}
          </span>
        </div>
        <span className="destination-subtitle">
          {getDestinationSubtitle(day, index)}
        </span>
      </div>
    );
  };

  const renderFoodCell = (day: ExpandedDay) => {
    const foodItems = foodOptionsMap.get(day.dayIndex) || [];
    const foodCount = foodItems.length;

    return (
      <div className="flex items-center justify-center">
        {foodCount > 0 ? (
          <button
            onClick={() => handleFoodClick(day)}
            className="destination-name hover:text-[#8B5CF6] transition-colors"
          >
            {foodCount} food spot{foodCount !== 1 ? 's' : ''}
          </button>
        ) : (
          <button
            onClick={() => handleFoodClick(day)}
            className="food-action column-action"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          </button>
        )}
      </div>
    );
  };

  const renderTransportDivider = (currentDay: ExpandedDay, nextDay: ExpandedDay) => {
    if (currentDay.destination !== nextDay.destination) {
      // Find the destination data to get transport info
      const currentDestIndex = destinations.findIndex(d => d.destination === currentDay.destination);
      const transportInfo = destinations[currentDestIndex]?.transport || '';

      // Split transport info into type and duration (e.g., "Drive · 3h" -> ["Drive", "3h"])
      const [type, duration] = transportInfo.split(' · ');

      // Convert duration format (e.g., "6h41mins" to "6h 41m")
      const formattedDuration = duration
        ?.replace(/(\d+)h(\d+)mins?/, '$1h $2m')
        ?.replace(/hours?/g, 'h')
        ?.replace(/minutes?/g, 'm')
        ?.replace(/\s+/g, ' ');

      return (
        <div className="border-t-2 border-b-2 border-gray-200">
          <div className="grid grid-cols-[180px,200px,200px,120px,120px,120px] gap-0 px-4 py-2 bg-gray-50">
            <div className="col-span-full flex items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center">
                  {type?.toLowerCase().includes('drive') && <Car className="w-4 h-4 text-pink-500" />}
                  {type?.toLowerCase().includes('flight') && <Plane className="w-4 h-4 text-pink-500" />}
                  {type?.toLowerCase().includes('train') && <Train className="w-4 h-4 text-pink-500" />}
                  {type?.toLowerCase().includes('bus') && <BusIcon className="w-4 h-4 text-pink-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="destination-name text-[#EC4899]">
                    {type} · {formattedDuration}
                  </span>
                </div>
              </div>
              <span className="destination-subtitle mx-2">·</span>
              <span className="destination-name text-[#EC4899]">
                From {cleanDestination(currentDay.destination)} to {cleanDestination(nextDay.destination)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 [&_.destination-name]:font-['Inter_var'] [&_.destination-name]:text-sm [&_.destination-name]:font-[600] [&_.destination-name]:text-[#1E293B] [&_.destination-subtitle]:font-['Inter_var'] [&_.destination-subtitle]:text-xs [&_.destination-subtitle]:text-[#64748B] [&_.destination-subtitle]:mt-1">
      {/* Column Headers */}
      <div className="grid grid-cols-[180px,200px,200px,120px,120px,120px] gap-0 px-4 py-2 text-xs text-[#0f3e4a] border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#6366F1]" />
          <span className="destination-name uppercase">DATE</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#00C48C]" />
          <span className="destination-name uppercase">DESTINATION</span>
        </div>
        <div className="flex items-center gap-2">
          <Bed className="w-4 h-4 text-[#F59E0B]" />
          <span className="destination-name uppercase">SLEEPING</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00B8A9]" />
          <span className="destination-name uppercase">DISCOVER</span>
        </div>
        <div className="flex items-center gap-2">
          <FaUtensils className="w-4 h-4 text-[#8B5CF6]" />
          <span className="destination-name uppercase">FOOD</span>
        </div>
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-[#3B82F6]" />
          <span className="destination-name uppercase">NOTES</span>
        </div>
      </div>

      {/* Days List */}
      <div className="space-y-1">
        {expandedDays.map((day, index) => (
          <React.Fragment key={index}>
            <div className="grid grid-cols-[180px,200px,200px,120px,120px,120px] gap-0 items-center bg-white px-4 py-2 hover:bg-[#f1f8fa] transition-colors">
              <div>
                <div className="flex flex-col">
                  <div className="destination-name">
                    {formatDate(day.date)}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="destination-subtitle">Day {index + 1}</span>
                    {index < expandedDays.length - 1 && day.destination !== expandedDays[index + 1].destination && (
                      <>
                        <span className="destination-subtitle">·</span>
                        <span className="destination-subtitle text-[#F43F5E]">Travel day</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                {renderDestinationCell(day, index)}
              </div>
              <div className="flex items-center justify-center">
                {dayHotels.find(h => h.dayIndex === day.dayIndex)?.hotel ? (
                  <button
                    onClick={() => handleHotelClick(day)}
                    className="destination-name hover:text-[#F59E0B] transition-colors"
                  >
                    {dayHotels.find(h => h.dayIndex === day.dayIndex)?.hotel}
                  </button>
                ) : (
                  <button
                    onClick={() => handleHotelClick(day)}
                    className="sleeping-action column-action"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-center">
                {dayAttractions.find(da => da.dayIndex === day.dayIndex)?.selectedAttractions.length ? (
                  <button
                    onClick={() => handleDiscoverClick(day, day.dayIndex)}
                    className="destination-name hover:text-[#00B8A9] transition-colors"
                  >
                    {dayAttractions.find(da => da.dayIndex === day.dayIndex)?.selectedAttractions.length} to do's
                  </button>
                ) : (
                  <button
                    onClick={() => handleDiscoverClick(day, day.dayIndex)}
                    className="discover-action column-action"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-center">
                {renderFoodCell(day)}
              </div>
              <div className="flex items-center justify-center">
                {dayNotes.find(n => n.dayIndex === day.dayIndex)?.notes ? (
                  <button
                    onClick={() => handleNotesClick(day)}
                    className="destination-name hover:text-[#00C48C] transition-colors max-w-[80px] truncate"
                  >
                    {dayNotes.find(n => n.dayIndex === day.dayIndex)?.notes}
                  </button>
                ) : (
                  <button
                    onClick={() => handleNotesClick(day)}
                    className="notes-action column-action"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
            {index < expandedDays.length - 1 && renderTransportDivider(day, expandedDays[index + 1])}
          </React.Fragment>
        ))}
      </div>

      {/* Day Discover Popup */}
      {showDiscoverPopup && selectedDay && (
        <DayDiscoverPopup
          isOpen={showDiscoverPopup}
          onClose={() => {
            setShowDiscoverPopup(false);
            setSelectedDay(null);
          }}
          date={selectedDay.date}
          destination={selectedDay.destination}
          selectedAttractions={dayAttractions.find(da =>
            da.dayIndex === selectedDay.dayIndex
          )?.selectedAttractions || []}
          itineraryId={itineraryId}
          dayIndex={selectedDay.dayIndex}
          onAttractionsUpdate={handleUpdateDayAttractions}
        />
      )}

      {/* Notes Popup */}
      {showNotesPopup && selectedDayForNotes && (
        <NotesPopup
          isOpen={showNotesPopup}
          onClose={() => {
            setShowNotesPopup(false);
            setSelectedDayForNotes(null);
          }}
          dayNumber={selectedDayForNotes.dayIndex + 1}
          initialNotes={selectedDayForNotes.notes}
          initialDayOverview={selectedDayForNotes.dayOverview}
          onSave={handleNotesUpdate}
          itineraryId={itineraryId}
          dayIndex={selectedDayForNotes.dayIndex}
        />
      )}

      {/* Food Popup */}
      {showFoodPopup && selectedDayForFood && !isLoadingFoodOptions && (
        <FoodPopup
          isOpen={showFoodPopup}
          onClose={() => {
            setShowFoodPopup(false);
            setSelectedDayForFood(null);
          }}
          date={selectedDayForFood.date}
          destination={selectedDayForFood.destination}
          selectedFoodItems={foodOptionsMap.get(selectedDayForFood.dayIndex) || []}
          itineraryId={itineraryId}
          dayIndex={selectedDayForFood.dayIndex}
          onFoodUpdate={handleUpdateDayFood}
        />
      )}
    </div>
  );
};

export default DayByDayGrid; 