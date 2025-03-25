import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Calendar, Bed, Compass, Plus, StickyNote, MapPin, Sparkles, Edit, Utensils, Car, Plane, Train, BusIcon } from 'lucide-react';
import DayDiscoverPopup from './DayDiscoverPopup';
import HotelSearchPopup from './HotelSearchPopup';
import NotesPopup from './NotesPopup';
import FoodPopup from './FoodPopup';
import { FaUtensils, FaPlus } from 'react-icons/fa';
import { cleanDestination } from '../utils/stringUtils';
import { supabase } from '../lib/supabase';

interface DayHotel {
  dayIndex: number;
  hotel: string;
  isManual?: boolean;
}

interface Attraction {
  name: string;
  description: string;
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
  }>;
  onDayNotesUpdate: (notes: Array<{ dayIndex: number; notes: string }>) => void;
  onHotelClick?: (destination: string, dayIndex: number) => void;
  onFoodSelect?: (destination: string, dayIndex: number) => void;
  dayFoods?: Array<{
    dayIndex: number;
    foodItems: string[];
  }>;
  onFoodClick?: (destination: string, dayIndex: number) => void;
  onNotesClick: (destination: string, dayIndex: number) => void;
  itineraryId: string;
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
  itineraryId
}) => {
  const [showDiscoverPopup, setShowDiscoverPopup] = useState(false);
  const [showNotesPopup, setShowNotesPopup] = useState(false);
  const [showFoodPopup, setShowFoodPopup] = useState(false);
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);
  const [selectedDayForNotes, setSelectedDayForNotes] = useState<{
    dayIndex: number;
    notes: string;
  } | null>(null);
  const [selectedDayForFood, setSelectedDayForFood] = useState<{
    dayIndex: number;
    destination: string;
    food: string;
  } | null>(null);
  const [isLoadingAttractions, setIsLoadingAttractions] = useState(false);
  const [hasLoadedInitialAttractions, setHasLoadedInitialAttractions] = useState(false);
  const previousAttractionsRef = useRef<string>('');

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

  // Memoize the attractions loading function to prevent unnecessary recreations
  const loadAttractionsFromDatabase = useCallback(async () => {
    if (!itineraryId || isLoadingAttractions) return;

    // Check if we already have the same attractions loaded
    const currentAttractions = JSON.stringify(dayAttractions);
    if (currentAttractions === previousAttractionsRef.current) {
      return;
    }

    setIsLoadingAttractions(true);
    try {
      const { data, error } = await supabase
        .from('user_itinerary_day_attractions')
        .select('day_index, attractions')
        .eq('itinerary_id', itineraryId);

      if (error) {
        console.error('Error loading attractions:', error);
        return;
      }

      // Create a map of all day attractions
      const attractionsMap = new Map();
      data.forEach(item => {
        if (item.day_index !== undefined && Array.isArray(item.attractions)) {
          attractionsMap.set(item.day_index, item.attractions);
        }
      });

      // Create a batch of updates to minimize state changes
      const updates: { dayIndex: number; attractions: string[] }[] = [];

      // Update each day's attractions, preserving existing ones if they exist
      expandedDays.forEach(day => {
        const existingAttractions = dayAttractions.find(da => da.dayIndex === day.dayIndex);
        const dbAttractions = attractionsMap.get(day.dayIndex);

        // Only update if we have database attractions and they're different from existing ones
        if (dbAttractions && (!existingAttractions ||
          JSON.stringify(dbAttractions) !== JSON.stringify(existingAttractions.selectedAttractions))) {
          updates.push({ dayIndex: day.dayIndex, attractions: dbAttractions });
        } else if (!existingAttractions && !dbAttractions) {
          // If no database attractions and no existing attractions, initialize from destinations
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

      // Only update if there are actual changes
      if (updates.length > 0) {
        // Batch update all attractions at once
        updates.forEach(update => {
          onDayAttractionsUpdate(update.dayIndex, update.attractions);
        });
      }

      // Store the current state for future comparison
      previousAttractionsRef.current = JSON.stringify(dayAttractions);
      setHasLoadedInitialAttractions(true);
    } catch (error) {
      console.error('Failed to load attractions:', error);
    } finally {
      setIsLoadingAttractions(false);
    }
  }, [itineraryId, expandedDays, destinations, dayAttractions, onDayAttractionsUpdate, isLoadingAttractions]);

  // Effect to load attractions only when necessary
  useEffect(() => {
    const shouldLoadAttractions = itineraryId &&
      (!hasLoadedInitialAttractions ||
        JSON.stringify(dayAttractions) !== previousAttractionsRef.current);

    if (shouldLoadAttractions) {
      const timeoutId = setTimeout(() => {
        loadAttractionsFromDatabase();
      }, 300); // Add a small debounce

      return () => clearTimeout(timeoutId);
    }
  }, [itineraryId, loadAttractionsFromDatabase, hasLoadedInitialAttractions, dayAttractions]);

  // Reset state when itineraryId changes
  useEffect(() => {
    setHasLoadedInitialAttractions(false);
    previousAttractionsRef.current = '';
  }, [itineraryId]);

  const handleDiscoverClick = (day: ExpandedDay, index: number) => {
    const destinationData = destinations.find(d => d.destination === day.destination);

    console.log('Destination data:', destinationData); // Debug log

    // Get the manual attractions and descriptions
    const manualAttractions = destinationData?.manual_discover?.split(',').filter(Boolean) || [];
    const manualDescriptions = destinationData?.manual_discover_desc?.split(',').filter(Boolean) || [];

    console.log('Manual attractions:', manualAttractions); // Debug log
    console.log('Manual descriptions:', manualDescriptions); // Debug log

    // Create an array of attraction objects with names and descriptions
    const allAttractions = manualAttractions.map((name, index) => ({
      name: name.trim(),
      description: (manualDescriptions[index] || '').trim()
    }));

    console.log('All attractions:', allAttractions); // Debug log

    // Get and clean the current attractions for this specific day
    const currentDayAttractions = dayAttractions.find(da => da.dayIndex === day.dayIndex);
    const cleanedCurrentAttractions = currentDayAttractions?.selectedAttractions
      .map(attraction => attraction.trim())
      .filter(attraction => attraction.length > 0) || [];

    console.log('Current day attractions:', cleanedCurrentAttractions); // Debug log

    // If there are no attractions in the master list but we have selected attractions,
    // we should include them in the master list
    if (allAttractions.length === 0 && cleanedCurrentAttractions.length > 0) {
      cleanedCurrentAttractions.forEach(attraction => {
        allAttractions.push({
          name: attraction,
          description: ''
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

  const handleUpdateDayAttractions = async (attractions: string[]) => {
    if (selectedDay) {
      // Clean attractions before updating
      const cleanedAttractions = attractions
        .map(attraction => attraction.trim())
        .filter(attraction => attraction.length > 0);

      console.log('Updating attractions for day:', selectedDay.dayIndex, 'with:', cleanedAttractions);

      try {
        // Update the local state first for immediate feedback
        const updatedDayAttractions = [...dayAttractions];
        const existingIndex = updatedDayAttractions.findIndex(da => da.dayIndex === selectedDay.dayIndex);

        if (existingIndex >= 0) {
          updatedDayAttractions[existingIndex] = {
            ...updatedDayAttractions[existingIndex],
            selectedAttractions: cleanedAttractions
          };
        } else {
          updatedDayAttractions.push({
            dayIndex: selectedDay.dayIndex,
            selectedAttractions: cleanedAttractions
          });
        }

        onDayAttractionsUpdate(selectedDay.dayIndex, cleanedAttractions);

        // If we have an itineraryId, update the database
        if (itineraryId) {
          const { error } = await supabase
            .from('user_itinerary_day_attractions')
            .upsert({
              itinerary_id: itineraryId,
              day_index: selectedDay.dayIndex,
              attractions: cleanedAttractions
            });

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
    const currentNotes = dayNotes.find(n => n.dayIndex === day.dayIndex)?.notes || '';
    setSelectedDayForNotes({
      dayIndex: day.dayIndex,
      notes: currentNotes
    });
    setShowNotesPopup(true);
  };

  const handleNotesUpdate = (notes: string) => {
    if (selectedDayForNotes) {
      const newNotes = [...dayNotes];
      const noteIndex = newNotes.findIndex(n => n.dayIndex === selectedDayForNotes.dayIndex);

      if (noteIndex !== -1) {
        newNotes[noteIndex] = {
          ...newNotes[noteIndex],
          notes
        };
      } else {
        newNotes.push({
          dayIndex: selectedDayForNotes.dayIndex,
          notes
        });
      }

      onDayNotesUpdate(newNotes);
      setShowNotesPopup(false);
      setSelectedDayForNotes(null);
    }
  };

  const handleFoodClick = (day: ExpandedDay) => {
    const destinationData = destinations.find(d => d.destination === day.destination);

    console.log('Destination data:', destinationData); // Debug log

    // Get the food items and descriptions
    const foodItems = destinationData?.food?.split(',').filter(Boolean) || [];
    const foodDescriptions = destinationData?.food_desc?.split(',').filter(Boolean) || [];

    console.log('Food items:', foodItems); // Debug log
    console.log('Food descriptions:', foodDescriptions); // Debug log

    // Create an array of food objects with names and descriptions
    const allFoodItems = foodItems.map((name, index) => ({
      name: name.trim(),
      description: (foodDescriptions[index] || '').trim()
    }));

    console.log('All food items:', allFoodItems); // Debug log

    // Get and clean the current food items for this specific day
    const currentDayFood = dayFoods?.find(df => df.dayIndex === day.dayIndex);
    const cleanedCurrentFood = currentDayFood?.foodItems
      .map(food => food.trim())
      .filter(food => food.length > 0) || [];

    console.log('Current day food:', cleanedCurrentFood); // Debug log

    setSelectedDayForFood({
      dayIndex: day.dayIndex,
      destination: day.destination,
      food: cleanedCurrentFood.join(', ')
    });
    setShowFoodPopup(true);
  };

  const handleUpdateDayFood = async (foodItems: string[]) => {
    if (selectedDayForFood) {
      // Clean food items before updating
      const cleanedFoodItems = foodItems
        .map(food => food.trim())
        .filter(food => food.length > 0);

      console.log('Updating food for day:', selectedDayForFood.dayIndex, 'with:', cleanedFoodItems);

      try {
        // Update the local state first for immediate feedback
        const updatedDayFoods = [...(dayFoods || [])];
        const existingIndex = updatedDayFoods.findIndex(df => df.dayIndex === selectedDayForFood.dayIndex);

        if (existingIndex >= 0) {
          updatedDayFoods[existingIndex] = {
            ...updatedDayFoods[existingIndex],
            foodItems: cleanedFoodItems
          };
        } else {
          updatedDayFoods.push({
            dayIndex: selectedDayForFood.dayIndex,
            foodItems: cleanedFoodItems
          });
        }

        if (onFoodSelect) {
          onFoodSelect(selectedDayForFood.destination, selectedDayForFood.dayIndex);
        }

        // If we have an itineraryId, update the database
        if (itineraryId) {
          const { error } = await supabase
            .from('user_itinerary_day_food')
            .upsert({
              itinerary_id: itineraryId,
              day_index: selectedDayForFood.dayIndex,
              food_items: cleanedFoodItems
            });

          if (error) {
            console.error('Error updating food:', error);
            throw error;
          }

          console.log('Successfully updated food in database');
        }

        // Only close the popup after successful update
        setShowFoodPopup(false);
        setSelectedDayForFood(null);

      } catch (error) {
        console.error('Failed to update food:', error);
      }
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

  const renderFoodCell = (day: { dayIndex: number; destination: string }) => {
    const dayFood = dayFoods?.find(f => f.dayIndex === day.dayIndex);
    const foodCount = dayFood?.foodItems.length || 0;

    return (
      <td
        className="border p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => onFoodClick && onFoodClick(day.destination, day.dayIndex)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaUtensils className="text-gray-500" />
            {foodCount > 0 ? (
              <span className="destination-name">{foodCount} food spot{foodCount !== 1 ? 's' : ''}</span>
            ) : (
              <span className="destination-subtitle">Add food spots</span>
            )}
          </div>
          <FaPlus className="text-gray-400" />
        </div>
      </td>
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
          <div className="grid grid-cols-[180px,200px,200px,120px,120px] gap-0 px-4 py-2 bg-gray-50">
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
    <div className="space-y-4 [&_.destination-name]:font-['Inter_var'] [&_.destination-name]:text-[14px] [&_.destination-name]:font-[600] [&_.destination-name]:text-[#1E293B] [&_.destination-subtitle]:font-['Inter_var'] [&_.destination-subtitle]:text-[13px] [&_.destination-subtitle]:text-[#64748B] [&_.destination-subtitle]:mt-1">
      {/* Column Headers */}
      <div className="grid grid-cols-[180px,200px,200px,120px,120px] gap-0 px-4 py-2 text-xs text-[#0f3e4a] border-b border-gray-200">
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
          <StickyNote className="w-4 h-4 text-[#3B82F6]" />
          <span className="destination-name uppercase">NOTES</span>
        </div>
      </div>

      {/* Days List */}
      <div className="space-y-1">
        {expandedDays.map((day, index) => (
          <React.Fragment key={index}>
            <div className="grid grid-cols-[180px,200px,200px,120px,120px] gap-0 items-center bg-white px-4 py-2 hover:bg-[#f1f8fa] transition-colors">
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
              <div className="flex items-center">
                {dayHotels.find(h => h.dayIndex === day.dayIndex)?.hotel ? (
                  <button
                    onClick={() => handleHotelClick(day)}
                    className="flex flex-col text-left hover:text-[#F59E0B] transition-colors"
                  >
                    <span className="destination-name">
                      {(dayHotels.find(h => h.dayIndex === day.dayIndex)?.hotel || '').length > 22
                        ? `${dayHotels.find(h => h.dayIndex === day.dayIndex)?.hotel?.slice(0, 22)}...`
                        : dayHotels.find(h => h.dayIndex === day.dayIndex)?.hotel}
                    </span>
                    <span className="destination-subtitle">
                      Booked
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center justify-start">
                    <button
                      onClick={() => handleHotelClick(day)}
                      className="sleeping-action column-action"
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>
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
          allDestinationAttractions={selectedDay.allAttractions}
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
          onSave={handleNotesUpdate}
        />
      )}

      {/* Food Popup */}
      {showFoodPopup && selectedDayForFood && (
        <FoodPopup
          isOpen={showFoodPopup}
          onClose={() => {
            setShowFoodPopup(false);
            setSelectedDayForFood(null);
          }}
          date={formatDate(expandedDays[selectedDayForFood.dayIndex].date)}
          destination={selectedDayForFood.destination}
          selectedFoodItems={dayFoods?.find(df =>
            df.dayIndex === selectedDayForFood.dayIndex
          )?.foodItems || []}
          allDestinationFood={(() => {
            const destinationData = destinations.find(d => d.destination === selectedDayForFood.destination);
            const foodItems = destinationData?.food?.split(',').filter(Boolean) || [];
            const foodDescriptions = destinationData?.food_desc?.split(',').filter(Boolean) || [];
            return foodItems.map((name, index) => ({
              name: name.trim(),
              description: (foodDescriptions[index] || '').trim()
            }));
          })()}
          onFoodUpdate={handleUpdateDayFood}
        />
      )}
    </div>
  );
};

export default DayByDayGrid; 