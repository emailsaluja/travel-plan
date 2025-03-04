import React, { useState } from 'react';

const HeroBanner: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleCreateItinerary = () => {
    if (!isLoggedIn) {
      //alert('Please sign in to create an itinerary');
    } else {
      // Navigate to create itinerary page
      //console.log('Navigate to create itinerary page');
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-0">
        <img
          className="w-full h-full object-cover"
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
          alt="Travel destination"
        />
        <div className="absolute inset-0 bg-black opacity-40"></div>
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Discover your perfect travel itinerary
        </h1>
        <p className="mt-6 text-xl text-white max-w-3xl">
          Explore curated travel plans from around the world or create your own custom itinerary.
        </p>
        <div className="mt-10">
          <button
            onClick={handleCreateItinerary}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
          >
            Create an Itinerary
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;