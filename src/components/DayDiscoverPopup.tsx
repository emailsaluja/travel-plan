import React, { useState, useEffect } from 'react';
import { X, MapPin, Star } from 'lucide-react';

interface DayDiscoverPopupProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  destination: string;
  selectedAttractions: string[];
  allDestinationAttractions: string[];
  onAttractionsUpdate: (attractions: string[]) => void;
}

interface AttractionItem {
  name: string;
  isSelected: boolean;
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
  const [attractions, setAttractions] = useState<AttractionItem[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!hasInitialized && allDestinationAttractions.length > 0) {
      const allAttractions = allDestinationAttractions.map(name => ({
        name,
        isSelected: selectedAttractions.includes(name)
      }));
      setAttractions(allAttractions);
      setHasInitialized(true);
    }
  }, [allDestinationAttractions, selectedAttractions, hasInitialized]);

  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
    }
  }, [isOpen]);

  const handleAttractionToggle = (attractionName: string) => {
    const updatedAttractions = attractions.map(a => 
      a.name === attractionName ? { ...a, isSelected: !a.isSelected } : a
    );
    setAttractions(updatedAttractions);
    
    const selectedNames = updatedAttractions
      .filter(a => a.isSelected)
      .map(a => a.name);
    onAttractionsUpdate(selectedNames);
  };

  // Separate attractions into selected and unselected
  const selectedItems = attractions.filter(a => a.isSelected);
  const unselectedItems = attractions.filter(a => !a.isSelected);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold">
              {destination}
            </h2>
            <p className="text-sm text-gray-500">{date}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          {attractions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No attractions available for this day
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Attractions Section */}
              {selectedItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Added Attractions</h3>
                  <div className="space-y-3">
                    {selectedItems.map((attraction) => (
                      <div
                        key={attraction.name}
                        className="flex items-center justify-between p-4 bg-amber-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-amber-500" />
                          <span className="text-amber-900">{attraction.name}</span>
                        </div>
                        <button
                          onClick={() => handleAttractionToggle(attraction.name)}
                          className="px-4 py-2 rounded-full text-sm font-medium bg-amber-100 text-amber-700 hover:bg-amber-200"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Attractions Section */}
              {unselectedItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Available Attractions</h3>
                  <div className="space-y-3">
                    {unselectedItems.map((attraction) => (
                      <div
                        key={attraction.name}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-600">{attraction.name}</span>
                        </div>
                        <button
                          onClick={() => handleAttractionToggle(attraction.name)}
                          className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DayDiscoverPopup; 