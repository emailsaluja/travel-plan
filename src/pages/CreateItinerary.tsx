import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Globe2, MapPin, Moon, Bed, Compass, Bus, Plus } from 'lucide-react';
import { countries } from '../data/countries';
import PlaceAutocomplete from '../components/PlaceAutocomplete';

interface ItineraryDay {
  destination: string;
  nights: number;
  sleeping: string;
  discover: string;
  transport: string;
  notes: string;
}

interface TripSummary {
  tripName: string;
  country: string;
  duration: number;
  startDate: string;
  passengers: number;
}

type TabType = 'destinations' | 'day-by-day';

const CreateItinerary: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showSummaryPopup, setShowSummaryPopup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripSummary, setTripSummary] = useState<TripSummary>({
    tripName: '',
    country: '',
    duration: 1,
    startDate: new Date().toISOString().split('T')[0],
    passengers: 1
  });
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('destinations');
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountries, setShowCountries] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTripSummary(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'passengers' ? Math.max(1, parseInt(value) || 1) : value
    }));
  };

  const initializeItineraryDays = () => {
    const emptyDay = {
      destination: '',
      nights: 1,
      sleeping: '',
      discover: '',
      transport: '',
      notes: ''
    };
    setItineraryDays([emptyDay]);
  };

  const handleProceed = () => {
    if (!tripSummary.tripName.trim()) {
      setError('Trip name is required');
      return;
    }
    if (!tripSummary.country) {
      setError('Please select a country');
      return;
    }
    initializeItineraryDays();
    setShowSummaryPopup(false);
    setError(null);
  };

  const handleDayUpdate = (index: number, field: keyof ItineraryDay, value: string | number) => {
    const updatedDays = [...itineraryDays];
    updatedDays[index] = {
      ...updatedDays[index],
      [field]: value
    };
    setItineraryDays(updatedDays);
  };

  const handleSave = async () => {
    // Implementation for saving the itinerary will come later
    console.log('Saving itinerary:', { tripSummary, itineraryDays });
  };

  // Calculate total nights from sleeping entries
  const totalNights = itineraryDays.reduce((sum, day) => sum + (day.nights || 0), 0);

  // Format date range (e.g., "10 April - 17 April")
  const formatDateRange = () => {
    const startDate = new Date(tripSummary.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + tripSummary.duration - 1);
    
    return `${startDate.getDate()} ${startDate.toLocaleString('default', { month: 'long' })} - ${endDate.getDate()} ${endDate.toLocaleString('default', { month: 'long' })}`;
  };

  const handleAddDestination = () => {
    const newDay = {
      destination: '',
      nights: 1,
      sleeping: '',
      discover: '',
      transport: '',
      notes: ''
    };
    setItineraryDays(prev => [...prev, newDay]);
  };

  // Add this new function to handle nights increment/decrement
  const handleNightsChange = (index: number, change: 'increment' | 'decrement') => {
    const updatedDays = [...itineraryDays];
    if (change === 'increment') {
      updatedDays[index].nights += 1;
    } else {
      // Ensure nights don't go below 0
      updatedDays[index].nights = Math.max(0, updatedDays[index].nights - 1);
    }
    setItineraryDays(updatedDays);
  };

  // Filter countries based on search
  const filteredCountries = countries.filter(country => 
    country.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Handle country selection
  const handleCountrySelect = (country: string) => {
    setTripSummary(prev => ({ ...prev, country }));
    setShowCountries(false);
    setCountrySearch('');
  };

  const renderDestinationsGrid = () => {
    return (
      <div className="flex-1 overflow-auto">
        {/* Grid Header */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">DESTINATION</span>
          </div>
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4" />
            <span className="font-medium">NIGHTS</span>
          </div>
          <div className="flex items-center gap-2">
            <Bed className="w-4 h-4" />
            <span className="font-medium">SLEEPING</span>
          </div>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4" />
            <span className="font-medium">DISCOVER</span>
          </div>
          <div className="flex items-center gap-2">
            <Bus className="w-4 h-4" />
            <span className="font-medium">TRANSPORT</span>
          </div>
        </div>

        {/* Grid Rows */}
        <div className="space-y-4">
          {itineraryDays.map((day, index) => (
            <div key={index} className="grid grid-cols-5 gap-4 bg-white rounded-lg p-4 shadow-sm">
              <div>
                <PlaceAutocomplete
                  country={tripSummary.country}
                  value={day.destination}
                  onChange={(value) => handleDayUpdate(index, 'destination', value)}
                  onPlaceSelect={(place) => {
                    console.log('Selected place:', place);
                    handleDayUpdate(index, 'destination', place.formatted_address || place.name || '');
                  }}
                />
                {day.destination && (
                  <div className="text-sm text-gray-500 mt-1">
                    Thu 10 Apr - Sat 12 Apr
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleNightsChange(index, 'decrement')}
                  className="text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                  type="button"
                >
                  -
                </button>
                <input
                  type="number"
                  value={day.nights}
                  onChange={(e) => handleDayUpdate(index, 'nights', parseInt(e.target.value) || 0)}
                  className="w-16 text-center border-none focus:ring-0 bg-transparent"
                  min="0"
                  readOnly // Make it read-only since we're using buttons
                />
                <button 
                  onClick={() => handleNightsChange(index, 'increment')}
                  className="text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                  type="button"
                >
                  +
                </button>
              </div>
              <div>
                <button className="text-emerald-500 hover:bg-emerald-50 p-2 rounded-full">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div>
                <button className="text-amber-500 hover:bg-amber-50 p-2 rounded-full">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center">
                <button className="text-rose-500 hover:bg-rose-50 p-2 rounded-full">
                  <Plus className="w-4 h-4" />
                </button>
                {day.transport && (
                  <span className="ml-2 text-sm text-gray-500">402 km</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Updated Add New Destination Button */}
        <button 
          onClick={handleAddDestination}
          className="mt-4 text-gray-500 hover:text-gray-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add new destination...
        </button>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <button className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm">
            Discover
          </button>
          <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm">
            Collection
          </button>
        </div>
      </div>
    );
  };

  if (!showSummaryPopup) {
    return (
      <div className="flex h-[calc(100vh-64px)]">
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <h1 className="text-2xl font-medium text-gray-900">{tripSummary.tripName}</h1>
              <span className="text-sm text-gray-500">{formatDateRange()}</span>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Progress Circle */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="h-12 w-12">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-medium">
                        {totalNights}/{tripSummary.duration}
                      </span>
                    </div>
                    <svg className="transform -rotate-90" width="48" height="48">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="#E5E7EB"
                        strokeWidth="4"
                        fill="none"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="#3B82F6"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${(totalNights / tripSummary.duration) * 125.6} 125.6`}
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">Nights</span>
                  <span className="text-sm text-gray-500">planned</span>
                </div>
              </div>

              <button
                onClick={handleSave}
                className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"
              >
                Save Itinerary
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b mb-6">
            <div className="flex space-x-8">
              <button
                className={`pb-4 px-1 ${
                  activeTab === 'destinations'
                    ? 'border-b-2 border-emerald-500 text-emerald-500'
                    : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('destinations')}
              >
                Destinations
              </button>
              <button
                className={`pb-4 px-1 ${
                  activeTab === 'day-by-day'
                    ? 'border-b-2 border-emerald-500 text-emerald-500'
                    : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('day-by-day')}
              >
                Day by day
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'destinations' ? renderDestinationsGrid() : <div>Day by day view coming soon...</div>}
        </div>

        {/* Right side - Map placeholder */}
        <div className="w-1/3 bg-gray-100 border-l">
          <div className="h-full flex items-center justify-center text-gray-500">
            Map will be implemented later
          </div>
        </div>
      </div>
    );
  }

  return (
    // Semi-transparent overlay
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Popup content */}
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Trip Summary</h2>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label htmlFor="tripName" className="block text-sm font-medium text-gray-700 mb-1">
              Trip Name
            </label>
            <input
              type="text"
              id="tripName"
              name="tripName"
              value={tripSummary.tripName}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Enter trip name"
              required
            />
          </div>

          {/* Add Country Selector */}
          <div className="relative">
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <div className="relative">
              <input
                type="text"
                value={tripSummary.country || countrySearch}
                onChange={(e) => {
                  setCountrySearch(e.target.value);
                  setShowCountries(true);
                  if (tripSummary.country) {
                    setTripSummary(prev => ({ ...prev, country: '' }));
                  }
                }}
                onFocus={() => setShowCountries(true)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Select a country"
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowCountries(!showCountries)}
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Countries dropdown */}
            {showCountries && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto">
                {filteredCountries.map((country, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => handleCountrySelect(country)}
                  >
                    {country}
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No countries found
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration (days)
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              min="1"
              value={tripSummary.duration}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={tripSummary.startDate}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <label htmlFor="passengers" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Passengers
            </label>
            <input
              type="number"
              id="passengers"
              name="passengers"
              min="1"
              value={tripSummary.passengers}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => navigate('/my-itineraries')}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProceed}
              className="px-4 py-2 text-sm text-white bg-rose-500 rounded-md hover:bg-rose-600"
            >
              Proceed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateItinerary; 