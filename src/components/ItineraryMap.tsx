import React from 'react';

interface Location {
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  days: number;
}

interface ItineraryMapProps {
  locations: Location[];
}

const ItineraryMap: React.FC<ItineraryMapProps> = ({ locations }) => {
  // Fallback to static map if no API key
  const calculateMapBounds = () => {
    const lats = locations.map(loc => loc.coordinates.lat);
    const lngs = locations.map(loc => loc.coordinates.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    return {
      center: `${(minLat + maxLat) / 2},${(minLng + maxLng) / 2}`,
      bounds: `${minLat-1},${minLng-1}|${maxLat+1},${maxLng+1}`
    };
  };

  const { center, bounds } = calculateMapBounds();

  // Create markers with start/end labels and nights information
  const markers = locations.map((loc, index) => {
    const label = index === 0 ? 'Start' : index === locations.length - 1 ? 'End' : `${index + 1}`;
    const color = index === 0 ? 'green' : index === locations.length - 1 ? 'red' : 'blue';
    return `markers=size:mid|color:${color}|label:${label}|${loc.coordinates.lat},${loc.coordinates.lng}`;
  }).join('&');

  // Create path between destinations
  const path = `path=color:0x0000ff|weight:3|geodesic:true|` + 
    locations.map(loc => `${loc.coordinates.lat},${loc.coordinates.lng}`).join('|');

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
    `center=${center}` +
    `&size=1600x600` +
    `&maptype=roadmap` +
    `&${markers}` +
    `&${path}` +
    `&visible=${bounds}` +
    `&scale=2` +
    `&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden">
      <img 
        src={mapUrl} 
        alt="Itinerary Map" 
        className="w-full h-full object-cover"
      />
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 p-4 rounded-lg shadow-lg">
        <div className="space-y-3 text-sm">
          {locations.map((loc, index) => (
            <div 
              key={`${loc.city}-${index}-${loc.days}`} 
              className="flex items-center gap-3"
            >
              <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold text-white
                ${index === 0 ? 'bg-green-500' : 
                  index === locations.length - 1 ? 'bg-red-500' : 
                  'bg-blue-500'}`}
              >
                {index === 0 ? 'S' : 
                 index === locations.length - 1 ? 'E' : 
                 `${index + 1}`}
              </span>
              <div className="flex flex-col">
                <span className="font-medium">{loc.city}</span>
                <span className="text-xs text-gray-500">
                  {index === 0 ? 'Start - ' : index === locations.length - 1 ? 'End - ' : ''}
                  {loc.days} {loc.days === 1 ? 'night' : 'nights'}
                </span>
              </div>
              {index < locations.length - 1 && (
                <span className="text-blue-500">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ItineraryMap; 