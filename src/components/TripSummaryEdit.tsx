import React, { useState } from 'react';
import {
  Calendar,
  Users,
  MapPin,
  Mountain,
  Waves,
  Building2,
  Tent,
  Hotel,
  Plane,
  Train,
  Car,
  Bus,
  Footprints,
  Camera,
  Utensils,
  ShoppingBag,
  Landmark,
  TreePine,
  Castle,
  Church,
  Star
} from 'lucide-react';
import { countries } from '../data/countries';

interface TripSummary {
  tripName: string;
  country: string;
  duration: number;
  startDate: string;
  passengers: number;
  isPrivate: boolean;
  tags: string[];
}

const AVAILABLE_TAGS = [
  { id: 'nature', icon: Mountain, label: 'Nature' },
  { id: 'beach', icon: Waves, label: 'Beach' },
  { id: 'city', icon: Building2, label: 'City' },
  { id: 'camping', icon: Tent, label: 'Camping' },
  { id: 'hotel', icon: Hotel, label: 'Hotel' },
  { id: 'plane', icon: Plane, label: 'Plane' },
  { id: 'train', icon: Train, label: 'Train' },
  { id: 'car', icon: Car, label: 'Car' },
  { id: 'bus', icon: Bus, label: 'Bus' },
  { id: 'hiking', icon: Footprints, label: 'Hiking' },
  { id: 'photography', icon: Camera, label: 'Photography' },
  { id: 'food', icon: Utensils, label: 'Food' },
  { id: 'shopping', icon: ShoppingBag, label: 'Shopping' },
  { id: 'museum', icon: Landmark, label: 'Museum' },
  { id: 'park', icon: TreePine, label: 'Park' },
  { id: 'castle', icon: Castle, label: 'Castle' },
  { id: 'temple', icon: Church, label: 'Temple' },
  { id: 'once-in-a-life', icon: Star, label: 'Once in a Life' }
];

interface TripSummaryEditProps {
  tripSummary: TripSummary;
  onUpdate: (updatedSummary: TripSummary) => void;
  onClose: () => void;
}

const TripSummaryEdit: React.FC<TripSummaryEditProps> = ({
  tripSummary,
  onUpdate,
  onClose
}) => {
  const [editedSummary, setEditedSummary] = useState<TripSummary>({
    tripName: tripSummary.tripName,
    country: tripSummary.country,
    duration: tripSummary.duration,
    startDate: tripSummary.startDate,
    passengers: tripSummary.passengers,
    isPrivate: tripSummary.isPrivate,
    tags: tripSummary.tags || []
  });
  const [newTag, setNewTag] = useState('');
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

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      setEditedSummary(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedSummary(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleToggleTag = (tagId: string) => {
    setEditedSummary(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(t => t !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const handleSubmit = () => {
    if (!editedSummary.tripName.trim()) {
      setError('Trip name is required');
      return;
    }
    if (!editedSummary.country) {
      setError('Please select a country');
      return;
    }
    onUpdate(editedSummary);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">Edit Trip Summary</h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
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

          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700">
              <span>Privacy</span>
              <button
                type="button"
                onClick={() => setEditedSummary(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editedSummary.isPrivate ? 'bg-[#00C48C]' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editedSummary.isPrivate ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </label>
            <p className="text-sm text-gray-500 mt-1">
              {editedSummary.isPrivate ? 'Only you can view this itinerary' : 'Anyone with the link can view this itinerary'}
            </p>
          </div>
        </div>

        {/* Right Column - Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <div className="grid grid-cols-2 gap-4">
            {AVAILABLE_TAGS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleToggleTag(id)}
                className={`flex flex-col items-center p-3 rounded-lg border transition-colors ${editedSummary.tags.includes(id)
                  ? 'border-[#00C48C] bg-[#00C48C]/10'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <Icon className={`w-6 h-6 mb-1 ${editedSummary.tags.includes(id)
                  ? 'text-[#00C48C]'
                  : 'text-gray-500'
                  }`} />
                <span className={`text-xs ${editedSummary.tags.includes(id)
                  ? 'text-[#00C48C] font-medium'
                  : 'text-gray-500'
                  }`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
        <button
          type="button"
          onClick={onClose}
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
  );
};

export default TripSummaryEdit; 