import React, { useState, useEffect } from 'react';
import { Calendar, Bed, Compass, Plus, StickyNote, MapPin, Sparkles, Edit } from 'lucide-react';
import DayDiscoverPopup from './DayDiscoverPopup';
import HotelSearchPopup from './HotelSearchPopup';
import NotesPopup from './NotesPopup';

interface DayByDayGridProps {
  tripStartDate: string;
  destinations: Array<{
    destination: string;
    nights: number;
    discover: string;
    transport: string;
    notes: string;
    hotel?: string;
  }>;
  onDestinationsUpdate: (destinations: any[]) => void;
  dayAttractions: Array<{
    dayIndex: number;
    selectedAttractions: string[];
  }>;
  onDayAttractionsUpdate: (dayIndex: number, attractions: string[]) => void;
  dayHotels: Array<{
    dayIndex: number;
    hotel: string;
  }>;
  onDayHotelsUpdate: (hotels: Array<{ dayIndex: number; hotel: string }>) => void;
  dayNotes: Array<{
    dayIndex: number;
    notes: string;
  }>;
  onDayNotesUpdate: (notes: Array<{ dayIndex: number; notes: string }>) => void;
  onHotelClick?: (destination: string, dayIndex: number) => void;
}

interface ExpandedDay {
  destination: string;
  nights: number;
  discover: string;
  dayIndex: number;
  isFirstDay: boolean;
  date: Date;
}

interface DayHotel {
  dayIndex: number;
  hotel: string;
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
  onHotelClick
}) => {
  const [showDiscoverPopup, setShowDiscoverPopup] = useState(false);
  const [showHotelPopup, setShowHotelPopup] = useState(false);
  const [showNotesPopup, setShowNotesPopup] = useState(false);
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDiscoverClick = (day: ExpandedDay, index: number) => {
    const destinationData = destinations.find(d => d.destination === day.destination);
    const destinationAttractions = destinationData?.discover.split(', ').filter(Boolean) || [];
    
    // Get the current attractions for this specific day
    const currentDayAttractions = dayAttractions.find(da => da.dayIndex === day.dayIndex);
    console.log('Opening popup for day:', day.dayIndex, 'Current attractions:', currentDayAttractions);

    setSelectedDay({
      date: formatDate(day.date),
      destination: day.destination,
      discover: currentDayAttractions?.selectedAttractions.join(', ') || '',
      dayIndex: day.dayIndex,
      allAttractions: destinationAttractions
    });
    setShowDiscoverPopup(true);
  };

  const handleUpdateDayAttractions = (attractions: string[]) => {
    if (selectedDay) {
      console.log('Updating attractions for day:', selectedDay.dayIndex, attractions);
      onDayAttractionsUpdate(selectedDay.dayIndex, attractions);
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
            date: new Date(currentDate)
          });
          dayIndex++;
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

    return expandedDays;
  };

  const expandedDays = generateExpandedDays();

  return (
    <div className="space-y-4">
      {/* Column Headers */}
      <div className="grid grid-cols-[200px,1fr,200px,120px,120px] gap-4 px-6 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#6366F1]/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-[#6366F1]" />
          </div>
          <span className="text-sm font-medium text-[#64748B]">DATE</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#00C48C]/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-[#00C48C]" />
          </div>
          <span className="text-sm font-medium text-[#64748B]">DESTINATION</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
            <Bed className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <span className="text-sm font-medium text-[#64748B]">SLEEPING</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#EC4899]/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#EC4899]" />
          </div>
          <span className="text-sm font-medium text-[#64748B]">DISCOVER</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
            <StickyNote className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <span className="text-sm font-medium text-[#64748B]">NOTES</span>
        </div>
      </div>

      {/* Days List */}
      <div className="space-y-1">
        {expandedDays.map((day, index) => (
          <div key={index} className="grid grid-cols-[200px,1fr,200px,120px,120px] gap-4 px-6 py-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
            <div>
              <div className="text-sm text-[#64748B]">Day {index + 1}</div>
              <div className="text-sm font-medium text-[#1E293B]">{formatDate(day.date)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[#1E293B]">{day.destination}</div>
              <div className="text-sm text-[#64748B]">{day.isFirstDay ? 'Start of your adventure!' : 'Spend the day in ' + day.destination}</div>
            </div>
            <div>
              {dayHotels.find(h => h.dayIndex === day.dayIndex)?.hotel ? (
                <div
                  onClick={() => onHotelClick?.(day.destination, day.dayIndex)}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <div>
                    <div className="text-sm font-medium text-[#1E293B] group-hover:text-[#00C48C]">{dayHotels.find(h => h.dayIndex === day.dayIndex)?.hotel}</div>
                    <div className="text-sm text-[#64748B]">To be booked</div>
                  </div>
                  <button className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-100">
                    <Edit className="w-4 h-4 text-[#64748B]" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onHotelClick?.(day.destination, day.dayIndex)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#00C48C] hover:bg-[#00C48C]/10 border border-dashed border-[#00C48C]"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
            <div>
              {dayAttractions.find(da => da.dayIndex === day.dayIndex)?.selectedAttractions.length ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#1E293B]">
                    {dayAttractions.find(da => da.dayIndex === day.dayIndex)?.selectedAttractions.length} to do's
                  </span>
                  <button
                    onClick={() => handleDiscoverClick(day, day.dayIndex)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4 text-[#64748B]" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleDiscoverClick(day, day.dayIndex)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#00C48C] hover:bg-[#00C48C]/10 border border-dashed border-[#00C48C]"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
            <div>
              {dayNotes.find(n => n.dayIndex === day.dayIndex)?.notes ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#1E293B] truncate max-w-[80px]">
                    {dayNotes.find(n => n.dayIndex === day.dayIndex)?.notes}
                  </span>
                  <button
                    onClick={() => handleNotesClick(day)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4 text-[#64748B]" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleNotesClick(day)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#00C48C] hover:bg-[#00C48C]/10 border border-dashed border-[#00C48C]"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
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