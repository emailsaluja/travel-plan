import React, { useState, useEffect } from 'react';
import { X, List } from 'lucide-react';

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
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Convert escaped newlines to actual newlines and ensure bullet points
    if (initialNotes) {
      const processedNotes = initialNotes
        .replace(/\\n/g, '\n')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .map(line => line.startsWith('•') ? line : `• ${line}`)
        .join('\n');
      setNotes(processedNotes);
    } else {
      setNotes('');
    }
  }, [initialNotes]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(notes);
    onClose();
  };

  const addBulletPoint = () => {
    // If notes is empty or ends with newline, just add a bullet point
    if (notes === '' || notes.endsWith('\n')) {
      setNotes(notes + '• ');
    } else {
      // Otherwise, add a newline and then a bullet point
      setNotes(notes + '\n• ');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBulletPoint();
    }
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
          <div className="mb-4">
            <button
              onClick={addBulletPoint}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <List className="w-4 h-4" />
              Add Bullet Point
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add your notes for this day..."
            className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none font-mono"
          />
          <p className="mt-2 text-sm text-gray-500">
            Press Enter to add a new bullet point automatically
          </p>
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