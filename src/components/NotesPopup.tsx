import React, { useState, useEffect } from 'react';
import { X, List } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

interface NotesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: string) => void;
  initialNotes?: string;
  dayNumber: number;
  itineraryId?: string;
  dayIndex?: number;
}

const NotesPopup: React.FC<NotesPopupProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNotes = '',
  dayNumber,
  itineraryId,
  dayIndex
}) => {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Call the parent's onSave handler to update application state
      onSave(notes);

      // If we have an itineraryId and dayIndex, also save directly to the database
      if (itineraryId && typeof dayIndex === 'number') {
        // Check if a record already exists
        const { data: existingRecord, error: checkError } = await supabase
          .from('user_itinerary_day_notes')
          .select('*')
          .eq('itinerary_id', itineraryId)
          .eq('day_index', dayIndex)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking for existing notes:', checkError);
          toast.error('Error saving notes to database');
          return;
        }

        let saveError;
        if (existingRecord) {
          // Update existing record
          const { error } = await supabase
            .from('user_itinerary_day_notes')
            .update({ notes, updated_at: new Date() })
            .eq('itinerary_id', itineraryId)
            .eq('day_index', dayIndex);

          saveError = error;
        } else {
          // Insert new record
          const { error } = await supabase
            .from('user_itinerary_day_notes')
            .insert({
              itinerary_id: itineraryId,
              day_index: dayIndex,
              notes,
              created_at: new Date()
            });

          saveError = error;
        }

        if (saveError) {
          console.error('Error saving notes to database:', saveError);
          toast.error('Error saving notes to database');
        } else {
          console.log('Notes saved successfully to database');
          toast.success('Notes saved successfully');
        }
      }

      setIsSaving(false);
      onClose();
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Error saving notes');
      setIsSaving(false);
    }
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
            disabled={isSaving}
            className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Notes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesPopup; 