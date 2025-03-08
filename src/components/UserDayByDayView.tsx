import React from 'react';
import { Calendar, MapPin, Bed, Navigation } from 'lucide-react';

interface Destination {
  destination: string;
  nights: number;
  sleeping: string;
  discover: string;
  transport: string;
  notes: string;
}

interface DayAttraction {
  day_index: number;
  attractions: {
    name: string;
    place_id: string;
    types: string[];
    rating?: number;
    user_ratings_total?: number;
    formatted_address?: string;
  }[];
}

interface UserDayByDayViewProps {
  startDate: string;
  destinations: Destination[];
  dayAttractions: DayAttraction[];
}

const UserDayByDayView: React.FC<UserDayByDayViewProps> = ({
  startDate,
  destinations,
  dayAttractions
}) => {
  const generateDayByDaySchedule = () => {
    const schedule = [];
    let currentDate = new Date(startDate);
    let currentDestIndex = 0;
    let nightsSpent = 0;

    while (currentDestIndex < destinations.length) {
      const currentDest = destinations[currentDestIndex];
      const dayAttractionData = dayAttractions.find(da => 
        da.day_index === schedule.length
      );

      schedule.push({
        date: new Date(currentDate),
        destination: currentDest.destination,
        isArrivalDay: nightsSpent === 0,
        isDepartureDay: nightsSpent === currentDest.nights - 1,
        sleeping: currentDest.sleeping,
        discover: currentDest.discover,
        transport: currentDest.transport,
        notes: currentDest.notes,
        attractions: dayAttractionData?.attractions || []
      });

      currentDate.setDate(currentDate.getDate() + 1);
      nightsSpent++;

      if (nightsSpent === currentDest.nights) {
        currentDestIndex++;
        nightsSpent = 0;
      }
    }

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
      {schedule.map((day, index) => (
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

              {day.discover && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Activities Overview</h4>
                  <div className="flex items-start gap-2">
                    <Navigation className="w-4 h-4 text-gray-400 mt-1" />
                    <p className="text-gray-700">{day.discover}</p>
                  </div>
                </div>
              )}

              {day.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                  <p className="text-gray-700">{day.notes}</p>
                </div>
              )}
            </div>

            {/* Right Column - Attractions */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3">Selected Attractions</h4>
              <div className="space-y-3">
                {day.attractions.length > 0 ? (
                  day.attractions.map((attraction, attrIndex) => (
                    <div 
                      key={attrIndex}
                      className="bg-gray-50 rounded-lg p-3"
                    >
                      <h5 className="font-medium text-gray-900">{attraction.name}</h5>
                      {attraction.rating && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <span>★ {attraction.rating}</span>
                          {attraction.user_ratings_total && (
                            <span>({attraction.user_ratings_total} reviews)</span>
                          )}
                        </div>
                      )}
                      {attraction.formatted_address && (
                        <p className="text-sm text-gray-600 mt-1">{attraction.formatted_address}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No attractions selected for this day</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserDayByDayView; 