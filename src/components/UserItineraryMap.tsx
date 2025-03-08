import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

interface Location {
  destination: string;
  nights: number;
}

interface UserItineraryMapProps {
  destinations: Location[];
}

const UserItineraryMap: React.FC<UserItineraryMapProps> = ({ destinations }) => {
  const [mapUrl, setMapUrl] = useState<string>('');

  useEffect(() => {
    const generateMapUrl = () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const markers = destinations.map((loc, index) => {
        const label = index === 0 ? 'S' : 
                     index === destinations.length - 1 ? 'E' : 
                     String(index + 1);
        const color = index === 0 ? '0x4ade80' : 
                     index === destinations.length - 1 ? '0xef4444' : 
                     '0x3b82f6';
        return `markers=color:${color}|label:${label}|${encodeURIComponent(loc.destination)}`;
      }).join('&');

      const path = `path=color:0x3b82f6|weight:3|${destinations
        .map(loc => encodeURIComponent(loc.destination))
        .join('|')}`;

      return `https://maps.googleapis.com/maps/api/staticmap?${markers}&${path}&size=800x600&scale=2&key=${apiKey}`;
    };

    if (destinations.length > 0) {
      setMapUrl(generateMapUrl());
    }
  }, [destinations]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="relative rounded-lg overflow-hidden shadow-sm h-[600px]">
        <img 
          src={mapUrl} 
          alt="Itinerary Map" 
          className="w-full h-full object-cover"
        />
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 p-4 rounded-lg shadow-lg">
          <div className="space-y-3 text-sm">
            {destinations.map((loc, index) => (
              <div 
                key={`${loc.destination}-${index}`} 
                className="flex items-center gap-3"
              >
                <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold text-white
                  ${index === 0 ? 'bg-green-500' : 
                    index === destinations.length - 1 ? 'bg-red-500' : 
                    'bg-blue-500'}`}
                >
                  {index === 0 ? 'S' : 
                   index === destinations.length - 1 ? 'E' : 
                   `${index + 1}`}
                </span>
                <div className="flex flex-col">
                  <span className="font-medium">{loc.destination}</span>
                  <span className="text-xs text-gray-500">
                    {index === 0 ? 'Start - ' : index === destinations.length - 1 ? 'End - ' : ''}
                    {loc.nights} {loc.nights === 1 ? 'night' : 'nights'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserItineraryMap; 