import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface NotesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: string) => void;
  initialNotes?: string;
  dayNumber: number;
}

const NotesPopup: React.FC<NotesPopupProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNotes = '',
  dayNumber
}) => {
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[600px] overflow-auto">
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Notes for Day {dayNumber}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your notes for this day..."
            className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
          >
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesPopup; 