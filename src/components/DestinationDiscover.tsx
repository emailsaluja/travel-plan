import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Sparkles } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { supabase } from '../lib/supabase';

interface DestinationDiscoverProps {
    open: boolean;
    onClose: () => void;
    destination: string;
    attractions?: string[];
    descriptions?: string[];
    onAttractionsUpdate?: (attractions: string[], descriptions: string[]) => void;
    itineraryId?: string;
    destinationIndex?: number;
}

const DestinationDiscover: React.FC<DestinationDiscoverProps> = ({
    open,
    onClose,
    destination,
    attractions = [],
    descriptions = [],
    onAttractionsUpdate,
    itineraryId,
    destinationIndex
}) => {
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [newAttraction, setNewAttraction] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [editAttraction, setEditAttraction] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [localAttractions, setLocalAttractions] = useState<string[]>([]);
    const [localDescriptions, setLocalDescriptions] = useState<string[]>([]);

    // Sync local state with props and ensure descriptions array is properly sized
    useEffect(() => {
        const normalizedDescriptions = [...descriptions];
        while (normalizedDescriptions.length < attractions.length) {
            normalizedDescriptions.push('');
        }
        setLocalAttractions(attractions);
        setLocalDescriptions(normalizedDescriptions);
        console.log('Initial state:', { attractions, descriptions: normalizedDescriptions });
    }, [attractions, descriptions]);

    if (!open) return null;

    const handleAddAttraction = () => {
        if (!newAttraction.trim()) return;

        const updatedAttractions = [...localAttractions, newAttraction.trim()];
        const updatedDescriptions = [...localDescriptions, newDescription.trim()];

        console.log('Adding attraction:', {
            attraction: newAttraction.trim(),
            description: newDescription.trim(),
            updatedAttractions,
            updatedDescriptions
        });

        setLocalAttractions(updatedAttractions);
        setLocalDescriptions(updatedDescriptions);
        onAttractionsUpdate?.(updatedAttractions, updatedDescriptions);
        setNewAttraction('');
        setNewDescription('');
    };

    const handleEditAttraction = (index: number) => {
        console.log('Starting edit:', {
            index,
            attraction: localAttractions[index],
            description: localDescriptions[index] || ''
        });

        setIsEditing(index);
        setEditAttraction(localAttractions[index]);
        setEditDescription(localDescriptions[index] || '');
    };

    const handleSaveEdit = () => {
        if (!editAttraction.trim() || isEditing === null) return;

        const updatedAttractions = [...localAttractions];
        const updatedDescriptions = [...localDescriptions];

        // Ensure arrays are properly sized
        while (updatedDescriptions.length < updatedAttractions.length) {
            updatedDescriptions.push('');
        }

        console.log('Before save:', {
            editingIndex: isEditing,
            currentAttractions: updatedAttractions,
            currentDescriptions: updatedDescriptions,
            newAttraction: editAttraction.trim(),
            newDescription: editDescription.trim()
        });

        updatedAttractions[isEditing] = editAttraction.trim();
        updatedDescriptions[isEditing] = editDescription.trim();

        console.log('After save:', {
            editingIndex: isEditing,
            updatedAttractions,
            updatedDescriptions
        });

        setLocalAttractions(updatedAttractions);
        setLocalDescriptions(updatedDescriptions);
        onAttractionsUpdate?.(updatedAttractions, updatedDescriptions);

        // Clear edit state
        setIsEditing(null);
        setEditAttraction('');
        setEditDescription('');
    };

    const handleCancelEdit = () => {
        setIsEditing(null);
        setEditAttraction('');
        setEditDescription('');
    };

    const handleDeleteAttraction = (index: number) => {
        const updatedAttractions = localAttractions.filter((_, i) => i !== index);
        const updatedDescriptions = localDescriptions.filter((_, i) => i !== index);

        console.log('Deleting attraction:', {
            index,
            updatedAttractions,
            updatedDescriptions
        });

        setLocalAttractions(updatedAttractions);
        setLocalDescriptions(updatedDescriptions);
        onAttractionsUpdate?.(updatedAttractions, updatedDescriptions);
    };

    const handleSaveChanges = async () => {
        try {
            // First update the parent component's state
            onAttractionsUpdate?.(localAttractions, localDescriptions);

            // If we have an itineraryId and destinationIndex, update the database
            if (itineraryId && typeof destinationIndex === 'number') {
                const { error } = await supabase
                    .from('user_itinerary_destinations')
                    .update({
                        manual_discover: localAttractions.join(','),
                        manual_discover_desc: localDescriptions.join(',')
                    })
                    .eq('itinerary_id', itineraryId)
                    .eq('order_index', destinationIndex);

                if (error) {
                    console.error('Error saving attractions to database:', error);
                    throw error;
                }

                console.log('Successfully saved attractions to database');
            }

            // Close the popup
            onClose();
        } catch (error) {
            console.error('Failed to save attractions:', error);
            // You might want to show an error message to the user here
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            className="fixed inset-0 z-50 overflow-y-auto"
        >
            <div className="flex items-center justify-center min-h-screen p-3">
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

                <div className="relative bg-white rounded-xl w-full max-w-xl shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-[#00B8A9]/5 rounded-t-xl border-b border-[#00B8A9]/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#00B8A9]/10 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-[#00B8A9]" />
                            </div>
                            <div>
                                <Dialog.Title className="text-lg font-semibold text-gray-900">
                                    Discover Places
                                </Dialog.Title>
                                <p className="text-sm text-gray-500">
                                    {destination}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-500 hover:bg-[#00B8A9]/5 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        {/* Add New Attraction Form */}
                        <div className="bg-[#00B8A9]/5 rounded-lg p-4 space-y-3">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Place Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter place name"
                                        value={newAttraction}
                                        onChange={(e) => setNewAttraction(e.target.value)}
                                        className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00B8A9] focus:border-transparent outline-none transition-shadow text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                        placeholder="Add description (optional)"
                                        className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00B8A9] focus:border-transparent outline-none transition-shadow text-sm"
                                        rows={2}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={handleAddAttraction}
                                    className="px-4 py-1.5 bg-[#00B8A9] text-white rounded-lg hover:bg-[#009B8E] transition-colors text-sm flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Place
                                </button>
                            </div>
                        </div>

                        {/* Attractions List */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-semibold text-gray-900">Selected Places</h3>
                                <span className="px-2.5 py-0.5 bg-[#00B8A9]/10 text-[#00B8A9] text-sm font-medium rounded-full">
                                    {localAttractions.length} {localAttractions.length === 1 ? 'place' : 'places'}
                                </span>
                            </div>
                            <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                                {localAttractions.map((attraction, index) => (
                                    <div
                                        key={`${attraction}-${index}`}
                                        className="p-3 hover:bg-gray-50 group transition-colors"
                                    >
                                        {isEditing === index ? (
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    value={editAttraction}
                                                    onChange={(e) => setEditAttraction(e.target.value)}
                                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00B8A9] focus:border-transparent outline-none transition-shadow text-sm"
                                                />
                                                <textarea
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00B8A9] focus:border-transparent outline-none transition-shadow text-sm"
                                                    rows={2}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        className="px-3 py-1.5 bg-[#00B8A9] text-white rounded-lg hover:bg-[#009B8E] transition-colors text-sm"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-2.5">
                                                    <div className="w-8 h-8 rounded-lg bg-[#00B8A9]/10 flex items-center justify-center flex-shrink-0">
                                                        <Sparkles className="w-4 h-4 text-[#00B8A9]" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-sm">{attraction}</p>
                                                        {localDescriptions[index] && (
                                                            <p className="text-xs text-gray-500">{localDescriptions[index]}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleEditAttraction(index)}
                                                        className="p-1.5 text-gray-400 hover:text-[#00B8A9] hover:bg-[#00B8A9]/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAttraction(index)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {localAttractions.length === 0 && (
                                    <div className="p-6 text-center">
                                        <div className="w-12 h-12 rounded-lg bg-[#00B8A9]/5 flex items-center justify-center mx-auto mb-3">
                                            <Sparkles className="w-6 h-6 text-[#00B8A9]/40" />
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">No places selected</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Add some interesting spots to discover!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 p-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveChanges}
                            className="px-4 py-1.5 bg-[#00B8A9] text-white rounded-lg hover:bg-[#009B8E] transition-colors text-sm"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default DestinationDiscover; 