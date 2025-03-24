import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Plus } from 'lucide-react';
import { cleanDestination } from '../utils/stringUtils';

interface HotelSearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  onHotelSelect: (hotel: string, isManual?: boolean, description?: string) => void;
  selectedHotel?: string;
  manualHotel?: string;
  manualHotelDesc?: string;
}

const HotelSearchPopup: React.FC<HotelSearchPopupProps> = ({
  isOpen,
  onClose,
  destination,
  onHotelSelect,
  selectedHotel,
  manualHotel,
  manualHotelDesc
}) => {
  // State for manual hotel entry
  const [manualHotelName, setManualHotelName] = useState('');
  const [manualHotelDescription, setManualHotelDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize with existing hotel data if available
  useEffect(() => {
    // Reset states first
    setManualHotelName('');
    setManualHotelDescription('');

    // First try to use the manual hotel name
    if (manualHotel) {
      setManualHotelName(manualHotel);
    }
    // If no manual hotel name, use the selected hotel name
    else if (selectedHotel) {
      setManualHotelName(selectedHotel);
    }

    // Set the description if available
    if (manualHotelDesc) {
      setManualHotelDescription(manualHotelDesc);
    }

    // Log values for debugging
    console.log('Hotel popup values:', { manualHotel, selectedHotel, manualHotelDesc });
  }, [isOpen, manualHotel, selectedHotel, manualHotelDesc]);

  // Handle manual hotel submission
  const handleManualHotelSubmit = () => {
    if (manualHotelName.trim()) {
      onHotelSelect(manualHotelName.trim(), true, manualHotelDescription.trim());
      onClose();
    } else {
      setError('Hotel name is required');
    }
  };

  // Handle delete hotel
  const handleDeleteHotel = () => {
    // Also clear the local state to ensure UI reflects the deletion immediately
    setManualHotelName('');
    setManualHotelDescription('');

    // Call the parent component's handler with empty values
    onHotelSelect('', true, '');
    onClose();
  };

  if (!isOpen) return null;

  // Determine if we have any existing hotel data
  const hasExistingHotel = Boolean(manualHotel || selectedHotel);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden relative">
        {/* Close button at the top of popup */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-[#165964] text-2xl font-bold pr-8">
              Sleeping in {cleanDestination(destination)}
            </h2>
            <div className="text-gray-500 text-sm">
              {hasExistingHotel ? 'Edit hotel details' : 'Add your hotel information'}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hotel Name*
              </label>
              <input
                type="text"
                value={manualHotelName}
                onChange={(e) => setManualHotelName(e.target.value)}
                placeholder="Enter hotel name"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFBA49] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hotel Description
              </label>
              <textarea
                value={manualHotelDescription}
                onChange={(e) => setManualHotelDescription(e.target.value)}
                placeholder="Enter hotel description, address, or additional details"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFBA49] focus:border-transparent h-32 resize-none"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 pb-4 px-6">
          <div className="flex justify-between gap-4">
            {!hasExistingHotel ? (
              <button
                onClick={handleManualHotelSubmit}
                className="w-full py-3 bg-[#FFBA49] text-white rounded-full flex items-center justify-center gap-2 font-semibold hover:bg-[#F0B042] transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add custom
              </button>
            ) : (
              <>
                <button
                  onClick={handleManualHotelSubmit}
                  className="flex-1 py-3 bg-[#FFBA49] text-white rounded-full flex items-center justify-center gap-2 font-semibold hover:bg-[#F0B042] transition-colors"
                >
                  <Check className="w-5 h-5" />
                  Save
                </button>
                <button
                  onClick={handleDeleteHotel}
                  className="py-3 px-5 bg-red-500 text-white rounded-full flex items-center gap-2 hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelSearchPopup; 