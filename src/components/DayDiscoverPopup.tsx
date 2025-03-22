import React, { useState, useEffect } from 'react';
import { X, MapPin, Star, Compass, Check } from 'lucide-react';
import { cleanDestination } from '../utils/stringUtils';

interface DayDiscoverPopupProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  destination: string;
  selectedAttractions: string[];
  allDestinationAttractions: string[];
  onAttractionsUpdate: (attractions: string[]) => void;
}

const DayDiscoverPopup: React.FC<DayDiscoverPopupProps> = ({
  isOpen,
  onClose,
  date,
  destination,
  selectedAttractions,
  allDestinationAttractions,
  onAttractionsUpdate,
}) => {
  const [localAttractions, setLocalAttractions] = useState<string[]>([]);

  // Initialize local state with selected attractions when the popup opens or when selectedAttractions changes
  useEffect(() => {
    if (isOpen) {
      setLocalAttractions(selectedAttractions);
    }
  }, [isOpen, selectedAttractions]);

  const handleAttractionToggle = (attraction: string) => {
    const updatedAttractions = localAttractions.includes(attraction)
      ? localAttractions.filter(a => a !== attraction)
      : [...localAttractions, attraction];

    setLocalAttractions(updatedAttractions);
  };

  const handleSelectAll = () => {
    setLocalAttractions(allDestinationAttractions);
  };

  const handleDeselectAll = () => {
    setLocalAttractions([]);
  };

  const handleClose = () => {
    // Save the current state before closing
    onAttractionsUpdate(localAttractions);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#00B8A9]/10 flex items-center justify-center">
              <Compass className="w-5 h-5 text-[#00B8A9]" />
            </div>
            <div>
              <h2 className="text-lg font-[600] font-['Poppins',sans-serif] text-[#1E293B]">
                {cleanDestination(destination)}
              </h2>
              <p className="text-sm text-gray-500">{date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 text-sm font-medium text-[#00B8A9] hover:bg-[#00B8A9]/10 rounded-lg transition-colors"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Deselect All
            </button>
            <button
              onClick={handleClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {allDestinationAttractions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <MapPin className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No attractions available</p>
              <p className="text-sm">Add attractions in the destination tab first</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {allDestinationAttractions.map((attraction) => (
                <div
                  key={attraction}
                  className={`group relative rounded-lg border p-4 transition-all hover:shadow-md ${localAttractions.includes(attraction)
                    ? 'border-[#00B8A9] bg-[#00B8A9]/5'
                    : 'border-gray-200 hover:border-[#00B8A9]'
                    }`}
                >
                  <button
                    onClick={() => handleAttractionToggle(attraction)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MapPin className={`h-5 w-5 ${localAttractions.includes(attraction) ? 'text-[#00B8A9]' : 'text-gray-400'
                          }`} />
                        <span className="font-['Inter_var'] font-[600] text-[#1E293B]">
                          {attraction}
                        </span>
                      </div>
                      {localAttractions.includes(attraction) ? (
                        <Check className="h-5 w-5 text-[#00B8A9]" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-gray-300" />
                      )}
                    </div>
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

export default DayDiscoverPopup; 