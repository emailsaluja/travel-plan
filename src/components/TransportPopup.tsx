import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, MapPin, Search, Plus, Train, Car, Bus, Check } from 'lucide-react';
import { mapboxPlacesService } from '../services/mapbox-places.service';
import { mapboxDirectionsService } from '../services/mapbox-directions.service';

interface Transport {
  id: string;
  name: string;
  description: string;
  isSelected: boolean;
  isManuallyAdded: boolean;
  destination: string;
  place_id?: string;
  mode?: 'driving' | 'transit';
  duration?: string;
  distance?: string;
}

interface TransportPopupProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  onTransportSelect: (transport: Transport) => void;
  selectedTransport?: string;
}

const TransportPopup: React.FC<TransportPopupProps> = ({
  isOpen,
  onClose,
  destination,
  onTransportSelect,
  selectedTransport
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
        getPlaceSuggestions(`${query} station ${destination}`);
      }, 300);
    } else {
      setSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = async (suggestion: string, mode: 'driving' | 'transit') => {
    try {
      const placeResult = await mapboxPlacesService.findPlaceFromQuery(suggestion);
      if (placeResult) {
        // Get directions
        const directions = await mapboxDirectionsService.getDirections(
          destination,
          placeResult.location.join(','),
          mode
        );

        const transport: Transport = {
          id: Date.now().toString(),
          name: placeResult.name,
          description: placeResult.address || '',
          isSelected: true,
          isManuallyAdded: false,
          destination: destination,
          place_id: placeResult.location.join(','),
          mode: mode,
          duration: directions.duration,
          distance: directions.distance
        };
        onTransportSelect(transport);
        onClose();
      }
    } catch (error) {
      console.error('Error selecting transport:', error);
      setError('Failed to select transport');
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
            <h2 className="text-2xl font-semibold">Find Transport</h2>
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
              placeholder="Search for stations or transport hubs..."
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
              No transport options found
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex gap-2">
                  <button
                    onClick={() => handleSuggestionClick(suggestion, 'transit')}
                    className="flex-1 p-4 flex items-center gap-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                  >
                    <Train className="w-5 h-5 text-[#00C48C] flex-shrink-0" />
                    <span className="flex-grow">{suggestion}</span>
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleSuggestionClick(suggestion, 'driving')}
                    className="flex-1 p-4 flex items-center gap-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                  >
                    <Car className="w-5 h-5 text-[#00C48C] flex-shrink-0" />
                    <span className="flex-grow">{suggestion}</span>
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransportPopup; 