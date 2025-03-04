import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HeroBanner from './components/HeroBanner';
import CategorySelection from './components/CategorySelection';
import ItinerarySection from './components/ItinerarySection';
import { Search, User } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ItineraryDetails } from './pages/ItineraryDetails';

function App() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="flex flex-col min-h-screen">
            <Header selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry} />
            <main className="flex-grow">
              <HeroBanner />
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <CategorySelection />
                
                <ItinerarySection 
                  title="Most Popular Itineraries" 
                  country={selectedCountry} 
                  filter="popular"
                />
                
                <ItinerarySection 
                  title="Handpicked for You" 
                  country={selectedCountry} 
                  filter="handpicked"
                />
                
                {selectedCountry === 'Japan' && (
                  <>
                    <ItinerarySection 
                      title="2 Weeks in Japan" 
                      country="Japan" 
                      filter="2weeks"
                    />
                    
                    <ItinerarySection 
                      title="1 Week in Japan" 
                      country="Japan" 
                      filter="1week"
                    />
                  </>
                )}
                
                <ItinerarySection 
                  title="Recently Added" 
                  country={selectedCountry} 
                  filter="recent"
                />
                
                <ItinerarySection 
                  title="Most Liked" 
                  country={selectedCountry} 
                  filter="liked"
                />
                
                <ItinerarySection 
                  title="Short Trips" 
                  country="Japan" 
                  filter="short-trips"
                />
              </div>
            </main>
            <Footer />
          </div>
        } />
        <Route path="/itinerary/:id" element={<ItineraryDetails />} />
      </Routes>
    </Router>
  );
}

export default App;