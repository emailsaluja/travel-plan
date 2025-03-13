import React from 'react';
import { Calendar, MapPin, Bed, Navigation, Utensils, StickyNote, Sparkles } from 'lucide-react';
import { getAttractionIcon } from '../data/attraction-types';
import { cleanDestination } from '../utils/stringUtils';

interface Destination {
  destination: string;
  nights: number;
  discover: string;
  transport: string;
  notes: string;
  food: string;
}

interface DayAttraction {
  dayIndex: number;
  attractions: string[];
}

interface DayHotel {
  dayIndex: number;
  hotel: string;
}

interface DayNote {
  dayIndex: number;
  notes: string;
}

interface UserDayByDayViewProps {
  startDate: string;
  destinations: Destination[];
  dayAttractions: DayAttraction[];
  dayHotels: DayHotel[];
  dayNotes: DayNote[];
}

const UserDayByDayView: React.FC<UserDayByDayViewProps> = ({
  startDate,
  destinations,
  dayAttractions,
  dayHotels,
  dayNotes
}) => {
  console.log('UserDayByDayView props:', { startDate, destinations, dayAttractions, dayHotels });

  const generateDayByDaySchedule = () => {
    const schedule = [];
    let currentDate = new Date(startDate);
    let currentDestIndex = 0;
    let nightsSpent = 0;
    let dayIndex = 0;

    console.log('Initial dayAttractions:', dayAttractions);
    console.log('Initial destinations:', destinations);

    while (currentDestIndex < destinations.length) {
      const currentDest = destinations[currentDestIndex];
      console.log(`Processing day ${dayIndex} for ${currentDest.destination}`);

      // Find attractions for this day
      const dayAttractionData = dayAttractions.find(da => {
        console.log('Comparing:', { dayAttractionDayIndex: da.dayIndex, currentDayIndex: dayIndex });
        return da.dayIndex === dayIndex;
      });

      const dayHotelData = dayHotels.find(dh => dh.dayIndex === dayIndex);
      console.log('Found dayAttractionData:', dayAttractionData);

      // Get attractions from the destination's discover field if no day attractions are found
      let attractions: string[] = [];
      if (dayAttractionData && Array.isArray(dayAttractionData.attractions)) {
        console.log('Using day-specific attractions:', dayAttractionData.attractions);
        attractions = dayAttractionData.attractions;
      } else if (currentDest.discover) {
        console.log('Using destination discover field:', currentDest.discover);
        attractions = currentDest.discover.split(', ').filter(Boolean);
      }
      console.log('Final attractions array:', attractions);

      schedule.push({
        date: new Date(currentDate),
        destination: currentDest.destination,
        isArrivalDay: nightsSpent === 0,
        isDepartureDay: nightsSpent === currentDest.nights - 1,
        sleeping: dayHotelData?.hotel || '',
        transport: currentDest.transport,
        notes: currentDest.notes,
        attractions: attractions,
        food: currentDest.food
      });

      currentDate.setDate(currentDate.getDate() + 1);
      nightsSpent++;
      dayIndex++;

      if (nightsSpent === currentDest.nights) {
        currentDestIndex++;
        nightsSpent = 0;
      }
    }

    console.log('Generated schedule:', schedule);
    return schedule;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderNotesWithLinks = (notes: string): React.ReactNode => {
    // URL regex pattern
    const urlPattern = /(https?:\/\/[^\s]+)/g;

    if (!notes) return 'No notes';

    const parts = notes.split(urlPattern);
    const matches = notes.match(urlPattern) || [];

    return parts.map((part: string, index: number): React.ReactNode => {
      // If this part matches our URL pattern, render it as a link
      if (matches.includes(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-words"
          >
            {part}
          </a>
        );
      }
      // Otherwise render as regular text
      return <span key={index}>{part}</span>;
    });
  };

  const schedule = generateDayByDaySchedule();

  return (
    <div className="space-y-4">
      {schedule.map((day, index) => {
        const dayNote = dayNotes.find(n => n.dayIndex === index);
        const foodItems = day.food?.split(',').filter(item => item.trim()) || [];

        return (
          <div key={index} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Day {index + 1}</span>
                </div>
                <span className="text-gray-500">{formatDate(day.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">{cleanDestination(day.destination)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Places to Visit */}
              {day.attractions && day.attractions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-[#EC4899]" />
                    Places to Visit
                  </h4>
                  <div className="space-y-1">
                    {day.attractions.map((attraction, attrIndex) => {
                      if (!attraction) return null;
                      try {
                        const attractionType = getAttractionIcon(attraction);
                        const IconComponent = attractionType.icon;
                        return (
                          <div
                            key={attrIndex}
                            className="flex items-center gap-2"
                          >
                            <IconComponent className={`w-4 h-4 ${attractionType.color}`} />
                            <span className="text-sm font-medium text-gray-700">{attraction}</span>
                          </div>
                        );
                      } catch (error) {
                        console.error('Error rendering attraction:', error);
                        return null;
                      }
                    })}
                  </div>
                </div>
              )}

              <div>
                {/* Food Spots */}
                {foodItems.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                      <Utensils className="w-4 h-4 text-[#8B5CF6]" />
                      Food Spots
                    </h4>
                    <div className="space-y-1">
                      {foodItems.map((food, idx) => (
                        <div key={idx} className="text-sm text-gray-700">{food}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hotel */}
                {day.sleeping && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                      <Bed className="w-4 h-4 text-[#F59E0B]" />
                      Hotel
                    </h4>
                    <p className="text-gray-700 text-sm">{day.sleeping}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes - Full Width */}
            {dayNote?.notes && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <StickyNote className="w-4 h-4 text-[#3B82F6]" />
                  Notes
                </h4>
                <div className="text-sm text-gray-700 break-words overflow-hidden">
                  {renderNotesWithLinks(dayNote.notes)}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default UserDayByDayView; 