import React, { useState, useEffect } from 'react';
import { Calendar, Bed, Compass } from 'lucide-react';
import DayDiscoverPopup from './DayDiscoverPopup';

interface DayByDayGridProps {
  tripStartDate: string;
  destinations: {
    destination: string;
    nights: number;
    sleeping: string;
    discover: string;
    transport: string;
    notes: string;
  }[];
  onDestinationsUpdate: (destinations: {
    destination: string;
    nights: number;
    sleeping: string;
    discover: string;
    transport: string;
    notes: string;
  }[]) => void;
  dayAttractions: {
    dayIndex: number;
    selectedAttractions: string[];
  }[];
  onDayAttractionsUpdate: (dayIndex: number, attractions: string[]) => void;
}

interface ExpandedDay {
  destination: string;
  nights: number;
  sleeping: string;
  discover: string;
  dayIndex: number;
  isFirstDay: boolean;
  date: Date;
}

const DayByDayGrid: React.FC<DayByDayGridProps> = ({
  tripStartDate,
  destinations,
  onDestinationsUpdate,
  dayAttractions,
  onDayAttractionsUpdate
}) => {
  const [showDiscoverPopup, setShowDiscoverPopup] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{
    date: string;
    destination: string;
    discover: string;
    dayIndex: number;
    allAttractions: string[];
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

  const generateExpandedDays = () => {
    let expandedDays: ExpandedDay[] = [];
    let dayIndex = 0;
    let currentDate = new Date(tripStartDate);
    let totalNights = 0;

    // First, calculate total nights
    destinations.forEach(dest => {
      totalNights += dest.nights;
    });

    // Then generate days for each destination
    destinations.forEach(destination => {
      const nights = destination.nights || 0;
      
      // Create entries for each night of the destination
      for (let i = 0; i < nights; i++) {
        // Only add if we haven't exceeded total nights
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

    console.log('Generated expanded days:', {
      totalNights,
      dayIndex,
      expandedDaysLength: expandedDays.length,
      expandedDays
    });

    return expandedDays;
  };

  const expandedDays = generateExpandedDays();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Grid Header - Keep this fixed */}
      <div className="grid grid-cols-4 gap-4 mb-4 px-4">
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
      </div>

      {/* Scrollable Grid Rows */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-4">
          {expandedDays.map((day, index) => {
            // Find attractions for this specific day
            const currentDayAttractions = dayAttractions.find(da => da.dayIndex === day.dayIndex);
            console.log('Rendering day:', day.dayIndex, 'Attractions:', currentDayAttractions);
            
            return (
              <div key={index} className="grid grid-cols-4 gap-4 bg-white rounded-lg p-4 shadow-sm">
                <div className="flex flex-col">
                  <span>{formatDate(day.date)}</span>
                  <span className="text-sm text-gray-500">Day {index + 1}</span>
                </div>
                <div className="flex flex-col">
                  <span>{day.destination}</span>
                  {day.isFirstDay && <span className="text-sm text-gray-500">Arrival day</span>}
                </div>
                <div>
                  {day.sleeping && (
                    <button className="text-emerald-500 hover:bg-emerald-50 p-2 rounded-full">
                      {day.sleeping}
                    </button>
                  )}
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
            console.log('Closing popup for day:', selectedDay.dayIndex);
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
    </div>
  );
};

export default DayByDayGrid; 