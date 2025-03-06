import React from 'react';
import { Calendar, Bed, Compass } from 'lucide-react';

interface DayByDayProps {
  tripStartDate: string;
  destinations: {
    destination: string;
    nights: number;
    sleeping: string;
    discover: string;
  }[];
}

const DayByDayGrid: React.FC<DayByDayProps> = ({ tripStartDate, destinations }) => {
  // Generate array of days based on destinations
  const generateDays = () => {
    const days: {
      date: Date;
      dayNumber: number;
      destination: string;
      isFirstDay: boolean;
      sleeping: string;
      discover: string;
      notes?: string;
    }[] = [];

    let currentDate = new Date(tripStartDate);
    let dayNumber = 1;
    
    destinations.forEach((dest) => {
      for (let i = 0; i < (dest.nights || 1); i++) {
        days.push({
          date: new Date(currentDate),
          dayNumber,
          destination: dest.destination,
          isFirstDay: i === 0,
          sleeping: dest.sleeping,
          discover: dest.discover,
          notes: i === 0 ? 'Start of your adventure!' : 'Spend the day in ' + dest.destination
        });
        currentDate.setDate(currentDate.getDate() + 1);
        dayNumber++;
      }
    });

    return days;
  };

  const days = generateDays();

  const formatDate = (date: Date) => {
    const weekday = date.toLocaleString('default', { weekday: 'short' });
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${weekday} ${day} ${month} ${year}`;
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Grid Header */}
      <div className="grid grid-cols-4 gap-4 mb-4">
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

      {/* Grid Rows */}
      <div className="space-y-4">
        {days.map((day, index) => (
          <div key={index} className="grid grid-cols-4 gap-4 bg-white rounded-lg p-4 shadow-sm">
            <div className="flex flex-col">
              <span>{formatDate(day.date)}</span>
              <span className="text-sm text-gray-500">Day {day.dayNumber}</span>
            </div>
            <div className="flex flex-col">
              <span>{day.destination}</span>
              {day.notes && (
                <span className="text-sm text-gray-500">{day.notes}</span>
              )}
            </div>
            <div>
              {day.sleeping && (
                <button className="text-emerald-500 hover:bg-emerald-50 p-2 rounded-full">
                  {day.sleeping}
                </button>
              )}
            </div>
            <div>
              {day.discover && (
                <button className="text-amber-500 hover:bg-amber-50 p-2 rounded-full">
                  {day.discover}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DayByDayGrid; 