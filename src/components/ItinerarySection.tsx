import React, { useEffect, useState } from 'react';
import ItineraryTile from './ItineraryTile';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getItineraries } from '../data/itineraries';
import { Itinerary } from '../types';

interface ItinerarySectionProps {
  title: string;
  country: string | null;
  filter: string;
}

const ItinerarySection: React.FC<ItinerarySectionProps> = ({ title, country, filter }) => {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadItineraries() {
      setLoading(true);
      const data = await getItineraries(country, filter);
      console.log('Loaded itineraries:', data);
      setItineraries(data);
      setLoading(false);
    }

    loadItineraries();
  }, [country, filter]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (itineraries.length === 0) {
    return null;
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="my-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="flex space-x-2">
          <button 
            onClick={scrollLeft}
            className="p-1 rounded-full border border-gray-300 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          </button>
          <button 
            onClick={scrollRight}
            className="p-1 rounded-full border border-gray-300 hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide"
      >
        {itineraries.map((itinerary: Itinerary) => (
          <div key={itinerary.id} className="relative">
            <ItineraryTile
              id={itinerary.id}
              title={itinerary.title}
              description={itinerary.description}
              imageUrl={itinerary.imageUrl}
              duration={itinerary.duration}
              cities={itinerary.cities}
              likes={itinerary.likes}
              createdAt={itinerary.createdAt}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItinerarySection;