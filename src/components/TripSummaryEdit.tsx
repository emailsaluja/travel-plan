import React, { useState } from 'react';
import {
  Calendar,
  Users,
  MapPin,
  Mountain,
  Star,
  Sparkles,
  Clock,
  Globe2,
  Castle,
  ChevronDown,
  Footprints,
  Palmtree,
  Building2,
  Navigation,
  Utensils,
  Library,
  Landmark,
  X
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
  { id: 'family', icon: Users, label: 'Family Friendly' },
  { id: 'bucket-list', icon: Star, label: 'Bucket List' },
  { id: 'popular', icon: Sparkles, label: 'Most Popular' },
  { id: 'adventure', icon: Footprints, label: 'Adventure' },
  { id: 'short', icon: Clock, label: 'Short Trip' },
  { id: 'multi-country', icon: Globe2, label: 'Multi Country' },
  { id: 'europe', icon: Castle, label: 'Europe' },
  { id: 'mountains', icon: Mountain, label: 'Mountains' },
  { id: 'beach', icon: Palmtree, label: 'Beach' },
  { id: 'city', icon: Building2, label: 'City' },
  { id: 'hiking', icon: Navigation, label: 'Hiking' },
  { id: 'food', icon: Utensils, label: 'Food' },
  { id: 'museum', icon: Library, label: 'Museum' },
  { id: 'history', icon: Landmark, label: 'History' }
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
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto relative">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold text-[#1e293b]">Edit Trip Summary</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-[#00C48C] rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          <div>
            <label htmlFor="tripName" className="block text-sm font-medium text-gray-700 mb-2">
              Trip Name
            </label>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-[#00C48C] mr-2" />
              <input
                type="text"
                id="tripName"
                name="tripName"
                value={editedSummary.tripName}
                onChange={handleInputChange}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all font-['Inter_var']"
                placeholder="Enter trip name"
              />
            </div>
          </div>

          <div className="relative">
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all font-['Inter_var']"
                placeholder="Select a country"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowCountries(!showCountries)}
              >
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {showCountries && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base overflow-auto border border-gray-100">
                {filteredCountries.map((country, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => handleCountrySelect(country)}
                  >
                    {country}
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="px-4 py-2.5 text-sm text-gray-500">
                    No countries found
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Duration (days)
            </label>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-[#00C48C] mr-2" />
              <input
                type="number"
                id="duration"
                name="duration"
                min="1"
                value={editedSummary.duration}
                onChange={handleInputChange}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all font-['Inter_var']"
              />
            </div>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-[#00C48C] mr-2" />
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={editedSummary.startDate}
                onChange={handleInputChange}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all font-['Inter_var']"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div>
            <label htmlFor="passengers" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Passengers
            </label>
            <div className="flex items-center">
              <Users className="w-5 h-5 text-[#00C48C] mr-2" />
              <input
                type="number"
                id="passengers"
                name="passengers"
                min="1"
                value={editedSummary.passengers}
                onChange={handleInputChange}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all font-['Inter_var']"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
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
            <p className="text-sm text-gray-500">
              {editedSummary.isPrivate ? 'Only you can view this itinerary' : 'Anyone with the link can view this itinerary'}
            </p>
          </div>
        </div>

        {/* Right Column - Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tags
          </label>
          <div className="grid grid-cols-2 gap-3">
            {AVAILABLE_TAGS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleToggleTag(id)}
                className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-200 ${editedSummary.tags.includes(id)
                  ? 'border-[#00C48C] bg-[#00C48C]/10 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <Icon className={`w-5 h-5 mb-1.5 ${editedSummary.tags.includes(id)
                  ? 'text-[#00C48C]'
                  : 'text-gray-500'
                  }`} />
                <span className={`text-xs font-medium ${editedSummary.tags.includes(id)
                  ? 'text-[#00C48C]'
                  : 'text-gray-600'
                  }`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-8 mt-8 border-t">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-6 py-2.5 text-sm font-medium text-white bg-[#00C48C] rounded-lg hover:bg-[#00B37D] transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default TripSummaryEdit; 