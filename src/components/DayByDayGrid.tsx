import React, { useState, useEffect } from 'react';
import { Calendar, Bed, Compass, Plus, StickyNote, MapPin, Sparkles, Edit, Utensils, Car, Plane, Train, BusIcon } from 'lucide-react';
import DayDiscoverPopup from './DayDiscoverPopup';
import HotelSearchPopup from './HotelSearchPopup';
import NotesPopup from './NotesPopup';
import FoodPopup from './FoodPopup';
import { FaUtensils, FaPlus } from 'react-icons/fa';

interface DayHotel {
  dayIndex: number;
  hotel: string;
  isManual?: boolean;
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
  onNotesClick
}) => {
  const [showDiscoverPopup, setShowDiscoverPopup] = useState(false);
  const [showHotelPopup, setShowHotelPopup] = useState(false);
  const [showNotesPopup, setShowNotesPopup] = useState(false);
  const [showFoodPopup, setShowFoodPopup] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{
    date: string;
    destination: string;
    discover: string;
    dayIndex: number;
    allAttractions: string[];
  } | null>(null);
  const [selectedDayForHotel, setSelectedDayForHotel] = useState<{
    dayIndex: number;
    destination: string;
    sleeping: string;
  } | null>(null);
  const [selectedDayForNotes, setSelectedDayForNotes] = useState<{
    dayIndex: number;
    notes: string;
  } | null>(null);
  const [selectedDayForFood, setSelectedDayForFood] = useState<{
    dayIndex: number;
    destination: string;
    food: string;
  } | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const generateExpandedDays = () => {
    let expandedDays: ExpandedDay[] = [];
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
          expandedDays.push({
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

    return expandedDays;
  };

  const expandedDays = generateExpandedDays();

  useEffect(() => {
    // Process each day
    expandedDays.forEach(day => {
      // Check if we already have attractions for this day in dayAttractions
      const existingDayAttractions = dayAttractions.find(da => da.dayIndex === day.dayIndex);

      // Only proceed if there are no attractions at all for this day
      if (!existingDayAttractions) {
        // Get all available attractions for this destination from the destinations array
        const destinationData = destinations.find(d => d.destination === day.destination);
        // Split by comma and clean each attraction
        const destinationAttractions = destinationData?.discover
          .split(',')
          .map(attraction => attraction.trim())
          .filter(attraction => attraction.length > 0) || [];

        // If there are attractions available in the destination, select them all for this day
        if (destinationAttractions.length > 0) {
          console.log(`Auto-selecting attractions for day ${day.dayIndex}:`, destinationAttractions);
          onDayAttractionsUpdate(day.dayIndex, destinationAttractions);
        }
      } else {
        // Clean existing attractions
        const cleanedAttractions = existingDayAttractions.selectedAttractions
          .map(attraction => attraction.trim())
          .filter(attraction => attraction.length > 0);

        // Update if cleaning changed anything
        if (JSON.stringify(cleanedAttractions) !== JSON.stringify(existingDayAttractions.selectedAttractions)) {
          onDayAttractionsUpdate(day.dayIndex, cleanedAttractions);
        }
      }
    });
  }, [destinations, dayAttractions, onDayAttractionsUpdate]);

  const handleDiscoverClick = (day: ExpandedDay, index: number) => {
    const destinationData = destinations.find(d => d.destination === day.destination);
    // Clean destination attractions
    const destinationAttractions = destinationData?.discover
      .split(',')
      .map(attraction => attraction.trim())
      .filter(attraction => attraction.length > 0) || [];

    // Get and clean the current attractions for this specific day
    const currentDayAttractions = dayAttractions.find(da => da.dayIndex === day.dayIndex);
    const cleanedCurrentAttractions = currentDayAttractions?.selectedAttractions
      .map(attraction => attraction.trim())
      .filter(attraction => attraction.length > 0) || [];

    console.log('Opening popup for day:', day.dayIndex, 'Current attractions:', cleanedCurrentAttractions);

    setSelectedDay({
      date: formatDate(day.date),
      destination: day.destination,
      discover: cleanedCurrentAttractions.join(', '),
      dayIndex: day.dayIndex,
      allAttractions: destinationAttractions
    });
    setShowDiscoverPopup(true);
  };

  const handleUpdateDayAttractions = (attractions: string[]) => {
    if (selectedDay) {
      // Clean attractions before updating
      const cleanedAttractions = attractions
        .map(attraction => attraction.trim())
        .filter(attraction => attraction.length > 0);

      console.log('Updating attractions for day:', selectedDay.dayIndex, 'with:', cleanedAttractions);
      onDayAttractionsUpdate(selectedDay.dayIndex, cleanedAttractions);
    }
  };

  const handleHotelSelect = (hotel: string) => {
    if (selectedDayForHotel) {
      const newHotels = [...dayHotels];
      const hotelIndex = newHotels.findIndex(h => h.dayIndex === selectedDayForHotel.dayIndex);

      if (hotelIndex !== -1) {
        newHotels[hotelIndex] = {
          ...newHotels[hotelIndex],
          hotel
        };
      } else {
        newHotels.push({
          dayIndex: selectedDayForHotel.dayIndex,
          hotel
        });
      }

      onDayHotelsUpdate(newHotels);
      setShowHotelPopup(false);
      setSelectedDayForHotel(null);
    }
  };

  const handleHotelClick = (day: ExpandedDay) => {
    setSelectedDayForHotel({
      dayIndex: day.dayIndex,
      destination: day.destination,
      sleeping: dayHotels.find(h => h.dayIndex === day.dayIndex)?.hotel || ''
    });
    setShowHotelPopup(true);
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
    if (onFoodSelect) {
      onFoodSelect(day.destination, day.dayIndex);
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
              <span className="font-['Inter_var'] font-[600]">{foodCount} food spot{foodCount !== 1 ? 's' : ''}</span>
            ) : (
              <span className="text-gray-400 font-['Inter_var']">Add food spots</span>
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

      return (
        <div className="border-b-2 border-gray-200">
          <div className={`grid ${dayFoods ? 'grid-cols-[200px,1fr,140px,120px,120px,120px]' : 'grid-cols-[200px,1fr,140px,120px,120px]'} gap-4 px-6 py-3 bg-gray-50`}>
            <div className="col-span-full flex items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
                  {type?.toLowerCase().includes('drive') && <Car className="w-6 h-6 text-pink-500" />}
                  {type?.toLowerCase().includes('flight') && <Plane className="w-6 h-6 text-pink-500" />}
                  {type?.toLowerCase().includes('train') && <Train className="w-6 h-6 text-pink-500" />}
                  {type?.toLowerCase().includes('bus') && <BusIcon className="w-6 h-6 text-pink-500" />}
                </div>
                <div className="flex flex-col">
                  <span className="font-['Inter_var'] font-[600] text-[#1E293B]">
                    {type}
                  </span>
                  <span className="text-sm font-['Inter_var'] text-[#64748B]">{duration}</span>
                </div>
              </div>
              <span className="font-['Inter_var'] text-[#64748B] mx-2">·</span>
              <span className="font-['Inter_var'] text-[#64748B]">
                From {currentDay.destination} to {nextDay.destination}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Column Headers */}
      <div className={`grid ${dayFoods ? 'grid-cols-[200px,1fr,140px,120px,120px,120px]' : 'grid-cols-[200px,1fr,140px,120px,120px]'} gap-4 px-6 py-3 border-b border-gray-100`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#6366F1]/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-[#6366F1]" />
          </div>
          <span className="text-sm font-['Inter_var'] font-[600] text-[#64748B]">DATE</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#00C48C]/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-[#00C48C]" />
          </div>
          <span className="text-sm font-['Inter_var'] font-[600] text-[#64748B]">DESTINATION</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
            <Bed className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <span className="text-sm font-['Inter_var'] font-[600] text-[#64748B]">SLEEPING</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#EC4899]/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#EC4899]" />
          </div>
          <span className="text-sm font-['Inter_var'] font-[600] text-[#64748B]">DISCOVER</span>
        </div>
        {dayFoods && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center">
              <Utensils className="w-4 h-4 text-[#8B5CF6]" />
            </div>
            <span className="text-sm font-['Inter_var'] font-[600] text-[#64748B]">FOOD</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
            <StickyNote className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <span className="text-sm font-['Inter_var'] font-[600] text-[#64748B]">NOTES</span>
        </div>
      </div>

      {/* Days List */}
      <div className="space-y-1">
        {expandedDays.map((day, index) => (
          <React.Fragment key={index}>
            <div className={`grid ${dayFoods ? 'grid-cols-[200px,1fr,140px,120px,120px,120px]' : 'grid-cols-[200px,1fr,140px,120px,120px]'} gap-4 px-6 py-4 hover:bg-gray-50 border-b-2 border-gray-200 last:border-b-0`}>
              <div>
                <div className="text-sm font-['Inter_var'] font-[600] text-[#64748B]">Day {index + 1}</div>
                <div className="text-sm font-['Inter_var'] font-[600] text-[#1E293B]">{formatDate(day.date)}</div>
              </div>
              <div>
                <div className="text-sm font-['Inter_var'] font-[600] text-[#1E293B]">{day.destination}</div>
                <div className="text-sm font-['Inter_var'] text-[#64748B]">{day.isFirstDay ? 'Start of your adventure!' : 'Spend the day in ' + day.destination}</div>
              </div>
              <div className="flex items-center justify-center">
                {dayHotels.find(h => h.dayIndex === day.dayIndex)?.hotel ? (
                  <button
                    onClick={() => handleHotelClick(day)}
                    className="text-sm group relative flex items-center flex-col"
                  >
                    <span className="font-['Inter_var'] font-[600] text-[#1E293B] hover:text-[#00C48C] transition-colors">
                      {(dayHotels.find(h => h.dayIndex === day.dayIndex)?.hotel || '').slice(0, 20)}
                      {(dayHotels.find(h => h.dayIndex === day.dayIndex)?.hotel || '').length > 20 ? '...' : ''}
                    </span>
                    <div className="text-xs font-['Inter_var'] text-[#64748B]">To be booked</div>
                  </button>
                ) : (
                  <button
                    onClick={() => handleHotelClick(day)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#F59E0B] hover:bg-[#F59E0B]/10 border border-[#F59E0B]"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-center">
                {dayAttractions.find(da => da.dayIndex === day.dayIndex)?.selectedAttractions.length ? (
                  <button
                    onClick={() => handleDiscoverClick(day, day.dayIndex)}
                    className="text-sm group relative flex items-center flex-col"
                  >
                    <span className="font-['Inter_var'] font-[600] text-[#1E293B] hover:text-[#00C48C] transition-colors">
                      {dayAttractions.find(da => da.dayIndex === day.dayIndex)?.selectedAttractions.length} to do's
                    </span>
                    <div className="text-xs font-['Inter_var'] text-[#64748B]">Selected</div>
                  </button>
                ) : (
                  <button
                    onClick={() => handleDiscoverClick(day, day.dayIndex)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#EC4899] hover:bg-[#EC4899]/10 border border-[#EC4899]"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
              {dayFoods && renderFoodCell(day)}
              <div className="flex items-center justify-center">
                {dayNotes.find(n => n.dayIndex === day.dayIndex)?.notes ? (
                  <button
                    onClick={() => handleNotesClick(day)}
                    className="text-sm font-['Inter_var'] font-[600] text-[#1E293B] hover:text-[#00C48C] transition-colors truncate max-w-[80px]"
                  >
                    {dayNotes.find(n => n.dayIndex === day.dayIndex)?.notes}
                  </button>
                ) : (
                  <button
                    onClick={() => handleNotesClick(day)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#3B82F6] hover:bg-[#3B82F6]/10 border border-[#3B82F6]"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            {/* Render transport divider if next day exists and has different destination */}
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

      {/* Hotel Search Popup */}
      {showHotelPopup && selectedDayForHotel && (
        <HotelSearchPopup
          isOpen={showHotelPopup}
          onClose={() => {
            setShowHotelPopup(false);
            setSelectedDayForHotel(null);
          }}
          destination={selectedDayForHotel.destination}
          selectedHotel={selectedDayForHotel.sleeping}
          onHotelSelect={handleHotelSelect}
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
    </div>
  );
};

export default DayByDayGrid; 