import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, MapPin, Star, Search, Plus, Building2, Edit2, Trash2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cleanDestination } from '../utils/stringUtils';
import { mapboxPlacesService } from '../services/mapbox-places.service';

interface Hotel {
  id: string;
  name: string;
  rating?: number;
  userRatingsTotal?: number;
  photoUrl?: string;
  priceLevel?: number;
  description: string;
  isSelected: boolean;
  isManuallyAdded: boolean;
  destination: string;
  place_id?: string;
}

interface HotelSearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  onHotelSelect: (hotel: Hotel) => void;
  selectedHotel?: string;
}

const HotelSearchPopup: React.FC<HotelSearchPopupProps> = ({
  isOpen,
  onClose,
  destination,
  onHotelSelect,
  selectedHotel
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Memoized function to get place suggestions
  const getPlaceSuggestions = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const results = await mapboxPlacesService.getPlaceSuggestions(query);
      setSuggestions(results);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      setError('Failed to load suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout for debouncing
    if (query.length > 2) {
      searchTimeout.current = setTimeout(() => {
        getPlaceSuggestions(`${query} hotel ${destination}`);
      }, 300);
    } else {
      setSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = async (suggestion: string) => {
    try {
      const placeResult = await mapboxPlacesService.findPlaceFromQuery(suggestion);
      if (placeResult) {
        const hotel: Hotel = {
          id: Date.now().toString(),
          name: placeResult.name,
          description: placeResult.address || '',
          isSelected: true,
          isManuallyAdded: false,
          destination: destination,
          place_id: placeResult.location.join(',')
        };
        onHotelSelect(hotel);
        onClose();
      }
    } catch (error) {
      console.error('Error selecting hotel:', error);
      setError('Failed to select hotel');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Find Hotels</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search for hotels..."
              className="w-full px-4 py-3 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C48C] border-t-transparent"></div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-center py-4">
              {error}
            </div>
          )}

          {!loading && !error && suggestions.length === 0 && searchQuery.length > 2 && (
            <div className="text-gray-500 text-center py-4">
              No hotels found
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                >
                  <Building2 className="w-5 h-5 text-[#00C48C] flex-shrink-0" />
                  <span className="flex-grow">{suggestion}</span>
                  <MapPin className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelSearchPopup; 