import React from 'react';
import { Calendar, MapPin, Bed, Navigation } from 'lucide-react';
import { getAttractionIcon } from '../data/attraction-types';

interface Destination {
  destination: string;
  nights: number;
  discover: string;
  transport: string;
  notes: string;
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
    let totalDays = 0;

    while (currentDestIndex < destinations.length) {
      const currentDest = destinations[currentDestIndex];
      console.log('Processing day:', totalDays, 'for destination:', currentDest.destination);
      
      const dayAttractionData = dayAttractions.find(da => {
        console.log('Comparing dayIndex:', da.dayIndex, 'with totalDays:', totalDays);
        return da.dayIndex === totalDays;
      });

      const dayHotelData = dayHotels.find(dh => dh.dayIndex === totalDays);
      
      console.log('Found attractions for day:', dayAttractionData);
      console.log('Found hotel for day:', dayHotelData);

      schedule.push({
        date: new Date(currentDate),
        destination: currentDest.destination,
        isArrivalDay: nightsSpent === 0,
        isDepartureDay: nightsSpent === currentDest.nights - 1,
        sleeping: dayHotelData?.hotel || '',
        transport: currentDest.transport,
        notes: currentDest.notes,
        attractions: dayAttractionData?.attractions || []
      });

      currentDate.setDate(currentDate.getDate() + 1);
      nightsSpent++;
      totalDays++;

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

  const schedule = generateDayByDaySchedule();

  return (
    <div className="space-y-8">
      {schedule.map((day, index) => {
        const dayNote = dayNotes.find(n => n.dayIndex === index);
        
        return (
          <div key={index} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Day {index + 1}</span>
                </div>
                <span className="text-gray-500">{formatDate(day.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">{day.destination}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                {day.isArrivalDay && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Arrival</h4>
                    <p className="text-gray-700">{day.transport || 'Transport details not specified'}</p>
                  </div>
                )}
                
                {day.isDepartureDay && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Departure</h4>
                    <p className="text-gray-700">
                      {destinations[schedule.findIndex(s => s.date === day.date) + 1]?.transport || 'Transport details not specified'}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Accommodation</h4>
                  <div className="flex items-center gap-2">
                    <Bed className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-700">{day.sleeping || 'Not specified'}</p>
                  </div>
                </div>

                {dayNote && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{dayNote.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Attractions */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Selected Attractions</h4>
                <div className="space-y-3">
                  {day.attractions && day.attractions.length > 0 ? (
                    day.attractions.map((attraction, attrIndex) => {
                      if (!attraction) return null;
                      console.log('Rendering attraction:', attraction);
                      try {
                        const attractionType = getAttractionIcon(attraction);
                        const IconComponent = attractionType.icon;
                        return (
                          <div 
                            key={attrIndex}
                            className={`${attractionType.bgColor} rounded-lg p-3`}
                          >
                            <div className="flex items-center gap-2">
                              <IconComponent className={`w-5 h-5 ${attractionType.color}`} />
                              <h5 className={`font-medium ${attractionType.color}`}>{attraction}</h5>
                            </div>
                          </div>
                        );
                      } catch (error) {
                        console.error('Error rendering attraction:', error);
                        return null;
                      }
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">No attractions selected for this day</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserDayByDayView; 