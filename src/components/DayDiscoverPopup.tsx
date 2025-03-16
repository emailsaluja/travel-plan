import React, { useState, useEffect } from 'react';
import { X, MapPin, Star, Compass } from 'lucide-react';

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
  const [attractions, setAttractions] = useState<string[]>([]);

  // Initialize with all attractions selected
  useEffect(() => {
    if (isOpen && allDestinationAttractions.length > 0) {
      // If no attractions are selected yet, select all attractions
      if (selectedAttractions.length === 0) {
        setAttractions(allDestinationAttractions);
        onAttractionsUpdate(allDestinationAttractions);
      } else {
        setAttractions(selectedAttractions);
      }
    }
  }, [isOpen, allDestinationAttractions, selectedAttractions, onAttractionsUpdate]);

  const handleAttractionToggle = (attraction: string) => {
    const updatedAttractions = attractions.includes(attraction)
      ? attractions.filter(a => a !== attraction)
      : [...attractions, attraction];
    setAttractions(updatedAttractions);
    onAttractionsUpdate(updatedAttractions);
  };

  const handleSelectAll = () => {
    setAttractions(allDestinationAttractions);
    onAttractionsUpdate(allDestinationAttractions);
  };

  const handleDeselectAll = () => {
    setAttractions([]);
    onAttractionsUpdate([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#00B8A9]/10 flex items-center justify-center">
              <Compass className="w-5 h-5 text-[#00B8A9]" />
            </div>
            <div>
              <h2 className="text-lg font-[600] font-['Poppins',sans-serif] text-[#1E293B]">
                {destination}
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
              onClick={onClose}
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
                  className={`group relative rounded-lg border p-4 transition-all hover:shadow-md ${attractions.includes(attraction)
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
                        <MapPin className={`h-5 w-5 ${attractions.includes(attraction) ? 'text-[#00B8A9]' : 'text-gray-400'}`} />
                        <span className="font-['Inter_var'] font-[600] text-[#1E293B]">
                          {attraction}
                        </span>
                      </div>
                      <div className={`h-2 w-2 rounded-full transition-colors ${attractions.includes(attraction) ? 'bg-[#00B8A9]' : 'bg-gray-300'
                        }`} />
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