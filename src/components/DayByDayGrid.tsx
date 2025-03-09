import React, { useState, useEffect } from 'react';
import { Calendar, Bed, Compass, Plus, StickyNote } from 'lucide-react';
import DayDiscoverPopup from './DayDiscoverPopup';
import HotelSearchPopup from './HotelSearchPopup';
import NotesPopup from './NotesPopup';

interface DayByDayGridProps {
  tripStartDate: string;
  destinations: {
    destination: string;
    nights: number;
    discover: string;
    transport: string;
    notes: string;
  }[];
  onDestinationsUpdate: (destinations: {
    destination: string;
    nights: number;
    discover: string;
    transport: string;
    notes: string;
  }[]) => void;
  dayAttractions: {
    dayIndex: number;
    selectedAttractions: string[];
  }[];
  onDayAttractionsUpdate: (dayIndex: number, attractions: string[]) => void;
  dayHotels: DayHotel[];
  onDayHotelsUpdate: (hotels: DayHotel[]) => void;
  dayNotes: DayNote[];
  onDayNotesUpdate: (notes: DayNote[]) => void;
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
  onDayNotesUpdate
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
    const weekday = date.toLocaleString('default', { weekday: 'short' });
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${weekday} ${day} ${month} ${year}`;
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
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Grid Header - Keep this fixed */}
      <div className="grid grid-cols-5 gap-4 mb-4 px-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span className="font-medium">DATE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">DESTINATION</span>
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
          <StickyNote className="w-4 h-4" />
          <span className="font-medium">NOTES</span>
        </div>
      </div>

      {/* Scrollable Grid Rows */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-4">
          {expandedDays.map((day, index) => {
            const currentDayAttractions = dayAttractions.find(da => da.dayIndex === day.dayIndex);
            const dayHotel = dayHotels.find(h => h.dayIndex === day.dayIndex);
            const dayNote = dayNotes.find(n => n.dayIndex === day.dayIndex);
            
            return (
              <div key={index} className="grid grid-cols-5 gap-4 bg-white rounded-lg p-4 shadow-sm">
                <div className="flex flex-col">
                  <span>{formatDate(day.date)}</span>
                  <span className="text-sm text-gray-500">Day {index + 1}</span>
                </div>
                <div className="flex flex-col">
                  <span>{day.destination}</span>
                  {day.isFirstDay && <span className="text-sm text-gray-500">Arrival day</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleHotelClick(day)}
                    className="flex items-center gap-2 text-emerald-500 hover:bg-emerald-50 p-2 rounded-full transition-colors"
                  >
                    {dayHotel?.hotel ? (
                      <span>{dayHotel.hotel}</span>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add hotel</span>
                      </>
                    )}
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => handleDiscoverClick(day, day.dayIndex)}
                    className="w-full text-left text-amber-500 hover:bg-amber-50 p-2 rounded-lg transition-colors"
                  >
                    {currentDayAttractions?.selectedAttractions.length 
                      ? currentDayAttractions.selectedAttractions.join(', ') 
                      : 'Add attractions'}
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => handleNotesClick(day)}
                    className="flex items-center gap-2 text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors"
                  >
                    {dayNote?.notes ? (
                      <span className="line-clamp-1">{dayNote.notes}</span>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add notes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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