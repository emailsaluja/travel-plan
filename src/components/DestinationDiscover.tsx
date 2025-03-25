import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

interface DestinationDiscoverProps {
    open: boolean;
    onClose: () => void;
    destination: string;
    attractions?: string[];
    descriptions?: string[];
    onAttractionsUpdate?: (attractions: string[], descriptions: string[]) => void;
}

const DestinationDiscover: React.FC<DestinationDiscoverProps> = ({
    open,
    onClose,
    destination,
    attractions = [],
    descriptions = [],
    onAttractionsUpdate
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

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h3 className="text-lg font-semibold leading-6 text-gray-900">
                                Discover {destination}
                            </h3>
                            <button
                                type="button"
                                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                onClick={onClose}
                            >
                                <span className="sr-only">Close</span>
                                <X className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-4">
                            {/* Add new attraction form */}
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={newAttraction}
                                    onChange={(e) => setNewAttraction(e.target.value)}
                                    placeholder="Add new attraction"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                                />
                                <textarea
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    placeholder="Add description (optional)"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                                    rows={2}
                                />
                                <button
                                    onClick={handleAddAttraction}
                                    className="w-full px-4 py-2 bg-[#00C48C] text-white rounded-lg hover:bg-[#00B380] transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Attraction
                                </button>
                            </div>

                            {/* Attractions list */}
                            <div className="space-y-3">
                                {localAttractions.map((attraction, index) => (
                                    <div key={`${attraction}-${index}`} className="border rounded-lg p-3">
                                        {isEditing === index ? (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={editAttraction}
                                                    onChange={(e) => setEditAttraction(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                                                />
                                                <textarea
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                                                    rows={2}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        className="flex-1 px-3 py-1 bg-[#00C48C] text-white rounded hover:bg-[#00B380] transition-colors"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="flex-1 px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between">
                                                    <h4 className="font-medium text-gray-900">{attraction}</h4>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditAttraction(index)}
                                                            className="p-1 text-gray-500 hover:text-[#00C48C] rounded-full hover:bg-gray-100"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAttraction(index)}
                                                            className="p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {localDescriptions[index] && (
                                                    <p className="text-sm text-gray-600">{localDescriptions[index]}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        <button
                            type="button"
                            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DestinationDiscover; 