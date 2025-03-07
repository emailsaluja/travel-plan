import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import SavedItineraries from './pages/SavedItineraries';
import MyItineraries from './pages/MyItineraries';
import ItineraryDetails from './pages/ItineraryDetails';
import { Route } from 'react-router-dom';

const App = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header isAuthenticated={false} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default App;