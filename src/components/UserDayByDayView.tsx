import React from 'react';
import { Calendar, MapPin, Bed, Navigation, Utensils, StickyNote, Sparkles, Plane, Train, Car, Bus } from 'lucide-react';
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
  const generateDayByDaySchedule = () => {
    const schedule = [];
    let currentDate = new Date(startDate);
    let currentDestIndex = 0;
    let nightsSpent = 0;
    let dayIndex = 0;

    while (currentDestIndex < destinations.length) {
      const currentDest = destinations[currentDestIndex];

      const dayAttractionData = dayAttractions.find(da => da.dayIndex === dayIndex);
      const dayHotelData = dayHotels.find(dh => dh.dayIndex === dayIndex);

      let attractions: string[] = [];
      if (dayAttractionData && Array.isArray(dayAttractionData.attractions)) {
        attractions = dayAttractionData.attractions;
      } else if (currentDest.discover) {
        attractions = currentDest.discover.split(', ').filter(Boolean);
      }

      schedule.push({
        date: new Date(currentDate),
        destination: currentDest.destination,
        isArrivalDay: nightsSpent === 0,
        isDepartureDay: nightsSpent === currentDest.nights - 1,
        sleeping: dayHotelData?.hotel || '',
        transport: currentDest.transport,
        notes: currentDest.notes,
        attractions: attractions,
        food: currentDest.food?.split(',').filter(item => item.trim()) || []
      });

      currentDate.setDate(currentDate.getDate() + 1);
      nightsSpent++;
      dayIndex++;

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

  const renderNotesWithLinks = (notes: string): React.ReactNode => {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    if (!notes) return null;

    const parts = notes.split(urlPattern);
    const matches = Array.from(notes.matchAll(urlPattern)).map(match => match[0]);

    return parts.map((part: string, index: number): React.ReactNode => {
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
      return <span key={index}>{part}</span>;
    });
  };

  const getTransportIcon = (transport: string) => {
    const lowerTransport = transport.toLowerCase();
    if (lowerTransport.includes('fly') || lowerTransport.includes('plane') || lowerTransport.includes('air')) {
      return Plane;
    } else if (lowerTransport.includes('train')) {
      return Train;
    } else if (lowerTransport.includes('bus')) {
      return Bus;
    }
    return Car;
  };

  const schedule = generateDayByDaySchedule();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[39px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#00C48C] to-[#00B8A9]" />

        {/* Days */}
        <div className="space-y-8">
          {schedule.map((day, index) => {
            const dayNote = dayNotes.find(n => n.dayIndex === index);
            const nextDay = index < schedule.length - 1 ? schedule[index + 1] : null;
            const isLastDayInDestination = nextDay && day.destination !== nextDay.destination;

            return (
              <React.Fragment key={index}>
                <div className="relative">
                  {/* Timeline dot */}
                  <div className="absolute left-[31px] w-4 h-4 rounded-full bg-white border-2 border-[#00C48C] z-10" />

                  {/* Day card */}
                  <div className="ml-20 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow border-2 border-gray-200">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm">
                              <Calendar className="w-4 h-4 text-[#6366F1]" />
                              <span className="text-sm font-semibold text-gray-900">Day {index + 1}</span>
                              <span className="text-sm text-gray-500">·</span>
                              <span className="text-sm font-medium text-gray-700">{formatDate(day.date)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <MapPin className="w-6 h-6 text-[#00C48C]" />
                            <h3 className="text-xl font-semibold text-gray-900">
                              {cleanDestination(day.destination)}
                            </h3>
                            {(day.isArrivalDay || day.isDepartureDay) && (
                              <div className="flex items-center gap-2">
                                {day.isArrivalDay && (
                                  <span className="px-3 py-1 text-sm font-medium text-[#00C48C] bg-[#00C48C]/10 rounded-full border border-[#00C48C]/20">
                                    Arrival
                                  </span>
                                )}
                                {day.isDepartureDay && (
                                  <span className="px-3 py-1 text-sm font-medium text-[#F43F5E] bg-[#F43F5E]/10 rounded-full border border-[#F43F5E]/20">
                                    Departure
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left column */}
                        <div className="space-y-8">
                          {/* Attractions */}
                          {day.attractions.length > 0 && (
                            <div>
                              <h4 className="flex items-center gap-2 font-medium text-gray-900 mb-4">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00B8A9]/10">
                                  <Sparkles className="w-4 h-4 text-[#00B8A9]" />
                                </div>
                                Places to Visit
                              </h4>
                              <div className="space-y-3">
                                {day.attractions.map((attraction, idx) => {
                                  if (!attraction) return null;
                                  try {
                                    const attractionType = getAttractionIcon(attraction);
                                    const IconComponent = attractionType.icon;
                                    return (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-3 p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-gray-200 transition-colors shadow-sm"
                                      >
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${attractionType.color.replace('text-', 'bg-')}/10`}>
                                          <IconComponent className={`w-4 h-4 ${attractionType.color}`} />
                                        </div>
                                        <span className="text-gray-700 font-medium">{attraction}</span>
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

                          {/* Food spots */}
                          {day.food.length > 0 && (
                            <div>
                              <h4 className="flex items-center gap-2 font-medium text-gray-900 mb-4">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#8B5CF6]/10">
                                  <Utensils className="w-4 h-4 text-[#8B5CF6]" />
                                </div>
                                Food Spots
                              </h4>
                              <div className="space-y-3">
                                {day.food.map((food, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-gray-200 transition-colors shadow-sm"
                                  >
                                    <span className="text-gray-700 font-medium">{food}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right column */}
                        <div className="space-y-8">
                          {/* Hotel */}
                          {day.sleeping && (
                            <div>
                              <h4 className="flex items-center gap-2 font-medium text-gray-900 mb-4">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F59E0B]/10">
                                  <Bed className="w-4 h-4 text-[#F59E0B]" />
                                </div>
                                Hotel
                              </h4>
                              <div className="p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-gray-200 transition-colors shadow-sm">
                                <p className="text-gray-700 font-medium">{day.sleeping}</p>
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {dayNote?.notes && (
                            <div>
                              <h4 className="flex items-center gap-2 font-medium text-gray-900 mb-4">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3B82F6]/10">
                                  <StickyNote className="w-4 h-4 text-[#3B82F6]" />
                                </div>
                                Notes
                              </h4>
                              <div className="p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-gray-200 transition-colors shadow-sm">
                                <div className="text-gray-700 font-medium break-words">
                                  {renderNotesWithLinks(dayNote.notes)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transportation Details */}
                {isLastDayInDestination && nextDay && (
                  <div className="relative ml-20 mt-4 mb-8">
                    <div className="flex items-center gap-4 py-4 px-6 bg-gradient-to-r from-[#6366F1]/5 to-[#818CF8]/5 rounded-xl border-2 border-[#6366F1]/20 shadow-sm hover:shadow-md transition-all hover:border-[#6366F1]/30">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6366F1] text-white shadow-md shadow-[#6366F1]/20">
                          <Navigation className="w-4 h-4" />
                        </div>
                        <span className="text-[#4F46E5] font-semibold">Travel to {cleanDestination(nextDay.destination)}</span>
                      </div>
                      <div className="h-6 w-px bg-[#6366F1]/20" />
                      <div className="flex items-center gap-3">
                        {(() => {
                          const TransportIcon = getTransportIcon(day.transport);
                          return (
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6366F1] text-white shadow-md shadow-[#6366F1]/20">
                              <TransportIcon className="w-4 h-4" />
                            </div>
                          );
                        })()}
                        <span className="text-[#4338CA] font-semibold">{day.transport}</span>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UserDayByDayView; 