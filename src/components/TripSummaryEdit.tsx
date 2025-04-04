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
  X,
  FileText
} from 'lucide-react';
import { countries } from '../data/countries';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface TripSummary {
  tripName: string;
  country: string;
  duration: number;
  startDate: string;
  passengers: number;
  isPrivate: boolean;
  tags: string[];
  tripDescription: string;
}

const AVAILABLE_TAGS = [
  { id: 'trending', icon: Sparkles, label: 'Trending Destinations', description: 'Popular and in-demand travel spots' },
  { id: 'unique', icon: Star, label: 'Unique Experiences', description: 'One-of-a-kind adventures and activities' },
  { id: 'seasonal', icon: Calendar, label: 'Seasonal Highlights', description: 'Perfect for specific times of the year' },
  { id: 'hidden-gems', icon: Sparkles, label: 'Hidden Gems', description: 'Off-the-beaten-path destinations' },
  { id: 'family', icon: Users, label: 'Family Friendly', description: 'Great for travelers with children' },
  { id: 'bucket-list', icon: Star, label: 'Bucket List', description: 'Must-visit destinations and experiences' },
  { id: 'popular', icon: Sparkles, label: 'Most Popular', description: 'Highly rated by travelers' },
  { id: 'adventure', icon: Footprints, label: 'Adventure', description: 'For thrill-seekers and explorers' },
  { id: 'short', icon: Clock, label: 'Short Trip', description: 'Perfect for quick getaways' },
  { id: 'multi-country', icon: Globe2, label: 'Multi Country', description: 'Spanning multiple countries' }
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
    tags: tripSummary.tags || [],
    tripDescription: tripSummary.tripDescription || ''
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

  const handleDescriptionChange = (content: string) => {
    setEditedSummary(prev => ({
      ...prev,
      tripDescription: content
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
    <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl mx-auto relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[#1e293b]">Edit Trip Summary</h2>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-500 hover:text-[#00C48C] rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Basic Info Section */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tripName" className="block text-sm font-medium text-gray-700 mb-1">
              Trip Name
            </label>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 text-[#00C48C] mr-2" />
              <input
                type="text"
                id="tripName"
                name="tripName"
                value={editedSummary.tripName}
                onChange={handleInputChange}
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all font-['Inter_var']"
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
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all font-['Inter_var']"
                placeholder="Select a country"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowCountries(!showCountries)}
              >
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {showCountries && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-48 rounded-lg py-1 text-sm overflow-auto border border-gray-100">
                {filteredCountries.map((country, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => handleCountrySelect(country)}
                  >
                    {country}
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="px-3 py-1.5 text-sm text-gray-500">
                    No countries found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Trip Details Section */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration
            </label>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 text-[#00C48C] mr-2" />
              <input
                type="number"
                id="duration"
                name="duration"
                min="1"
                value={editedSummary.duration}
                onChange={handleInputChange}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all font-['Inter_var']"
              />
            </div>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 text-[#00C48C] mr-2" />
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={editedSummary.startDate}
                onChange={handleInputChange}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all font-['Inter_var']"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div>
            <label htmlFor="passengers" className="block text-sm font-medium text-gray-700 mb-1">
              Passengers
            </label>
            <div className="flex items-center">
              <Users className="w-4 h-4 text-[#00C48C] mr-2" />
              <input
                type="number"
                id="passengers"
                name="passengers"
                min="1"
                value={editedSummary.passengers}
                onChange={handleInputChange}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all font-['Inter_var']"
              />
            </div>
          </div>
        </div>

        {/* Trip Description */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#00C48C]" />
              Trip Description
            </div>
          </label>
          <ReactQuill
            value={editedSummary.tripDescription}
            onChange={handleDescriptionChange}
            className="bg-white rounded-lg"
            theme="snow"
            modules={{
              toolbar: [
                [{ header: [1, 2, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link'],
                ['clean']
              ]
            }}
          />
          <p className="mt-1 text-sm text-gray-500">
            Add a rich description of your trip to help others understand what makes it special.
          </p>
        </div>

        {/* Tags Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
            <span className="ml-1 text-gray-500 font-normal text-xs">(Select sections to display)</span>
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
            {AVAILABLE_TAGS.map((tag) => {
              const Icon = tag.icon;
              const isSelected = editedSummary.tags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleToggleTag(tag.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-sm ${isSelected
                    ? 'border-[#00C48C] bg-[#00C48C]/5 text-[#00C48C]'
                    : 'border-gray-200 hover:border-[#00C48C] hover:bg-[#00C48C]/5'
                    }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <div className="text-left">
                    <div className={`font-medium ${isSelected ? 'text-[#00C48C]' : 'text-gray-900'}`}>
                      {tag.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Privacy Toggle */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-sm font-medium text-gray-700">Privacy</span>
            <p className="text-xs text-gray-500">
              {editedSummary.isPrivate ? 'Only you can view this' : 'Anyone with the link can view'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditedSummary(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${editedSummary.isPrivate ? 'bg-[#00C48C]' : 'bg-gray-200'
              }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${editedSummary.isPrivate ? 'translate-x-5' : 'translate-x-0.5'
                }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 bg-[#00C48C] text-white rounded-lg hover:bg-[#00B380] transition-colors text-sm font-medium"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default TripSummaryEdit; 