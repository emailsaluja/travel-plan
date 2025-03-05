import React from 'react';
import HeroBanner from '../components/HeroBanner';
import CategorySelection from '../components/CategorySelection';
import ItinerarySection from '../components/ItinerarySection';

interface HomeProps {
  selectedCountry: string | null;
}

const Home: React.FC<HomeProps> = ({ selectedCountry }) => {
  return (
    <>
      <HeroBanner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CategorySelection />
        <ItinerarySection title="Most Popular Itineraries" country={selectedCountry} filter="popular" />
        <ItinerarySection title="Handpicked for You" country={selectedCountry} filter="handpicked" />
        {selectedCountry === 'Japan' && (
          <>
            <ItinerarySection title="2 Weeks in Japan" country="Japan" filter="2weeks" />
            <ItinerarySection title="1 Week in Japan" country="Japan" filter="1week" />
          </>
        )}
        <ItinerarySection title="Recently Added" country={selectedCountry} filter="recent" />
        <ItinerarySection title="Most Liked" country={selectedCountry} filter="liked" />
        <ItinerarySection title="Short Trips" country="Japan" filter="short-trips" />
      </div>
    </>
  );
};

export default Home; 