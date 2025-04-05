import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

interface DestinationNotesProps {
    isOpen: boolean;
    onClose: () => void;
    destination: string;
    onSave: (notes: string) => void;
    initialNotes: string;
    itineraryId: string;
    destinationIndex: number;
}

const DestinationNotes: React.FC<DestinationNotesProps> = ({
    isOpen,
    onClose,
    destination,
    onSave,
    initialNotes,
    itineraryId,
    destinationIndex
}) => {
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setNotes(initialNotes || '');
        }
    }, [isOpen, initialNotes]);

    if (!isOpen) return null;

    const handleSave = async () => {
        try {
            setIsSaving(true);

            // Update the database
            const { error: dbError } = await supabase
                .from('user_itinerary_destinations')
                .update({ destination_overview: notes })
                .eq('itinerary_id', itineraryId)
                .eq('order_index', destinationIndex);

            if (dbError) {
                throw dbError;
            }

            // Update the local state through the parent component
            onSave(notes);
            toast.success('Overview saved successfully');
            onClose();
        } catch (error) {
            console.error('Error saving overview:', error);
            toast.error('Error saving overview');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-gray-200">
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold">Overview for {destination}</h2>
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
                        placeholder="Add your overview for this destination..."
                        className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C48C] resize-none"
                    />
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-[#00C48C] text-white rounded-full hover:bg-[#00B380] transition-colors flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <span>Save Changes</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DestinationNotes; 