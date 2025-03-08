import React, { useState } from 'react';
import { Calendar, Users, MapPin } from 'lucide-react';
import { countries } from '../data/countries';

interface TripSummaryEditProps {
  tripSummary: {
    tripName: string;
    country: string;
    duration: number;
    startDate: string;
    passengers: number;
  };
  onSave: (updatedSummary: {
    tripName: string;
    country: string;
    duration: number;
    startDate: string;
    passengers: number;
  }) => void;
  onCancel: () => void;
}

const TripSummaryEdit: React.FC<TripSummaryEditProps> = ({
  tripSummary,
  onSave,
  onCancel
}) => {
  const [editedSummary, setEditedSummary] = useState(tripSummary);
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountries, setShowCountries] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedSummary(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'passengers' ? Math.max(1, parseInt(value) || 1) : value
    }));
  };

  const handleCountrySelect = (country: string) => {
    setEditedSummary(prev => ({ ...prev, country }));
    setShowCountries(false);
    setCountrySearch('');
  };

  const filteredCountries = countries.filter(country => 
    country.toLowerCase().includes((countrySearch || editedSummary.country).toLowerCase())
  );

  const handleSubmit = () => {
    if (!editedSummary.tripName.trim()) {
      setError('Trip name is required');
      return;
    }
    if (!editedSummary.country) {
      setError('Please select a country');
      return;
    }
    onSave(editedSummary);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">Edit Trip Summary</h2>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label htmlFor="tripName" className="block text-sm font-medium text-gray-700 mb-1">
            Trip Name
          </label>
          <div className="flex items-center">
            <MapPin className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              id="tripName"
              name="tripName"
              value={editedSummary.tripName}
              onChange={handleInputChange}
              className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Enter trip name"
            />
          </div>
        </div>

        <div className="relative">
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <div className="relative">
            <input
              type="text"
              value={editedSummary.country || countrySearch}
              onChange={(e) => {
                setCountrySearch(e.target.value);
                setShowCountries(true);
                if (editedSummary.country) {
                  setEditedSummary(prev => ({ ...prev, country: '' }));
                }
              }}
              onFocus={() => setShowCountries(true)}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Select a country"
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
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="number"
              id="duration"
              name="duration"
              min="1"
              value={editedSummary.duration}
              onChange={handleInputChange}
              className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={editedSummary.startDate}
              onChange={handleInputChange}
              className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div>
          <label htmlFor="passengers" className="block text-sm font-medium text-gray-700 mb-1">
            Number of Passengers
          </label>
          <div className="flex items-center">
            <Users className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="number"
              id="passengers"
              name="passengers"
              min="1"
              value={editedSummary.passengers}
              onChange={handleInputChange}
              className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm text-white bg-rose-500 rounded-md hover:bg-rose-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripSummaryEdit; 