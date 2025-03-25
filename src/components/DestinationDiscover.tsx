import React, { useState } from 'react';
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

    if (!open) return null;

    const handleAddAttraction = () => {
        if (!newAttraction.trim()) return;

        const updatedAttractions = [...attractions, newAttraction.trim()];
        const updatedDescriptions = [...descriptions, newDescription.trim()];

        onAttractionsUpdate?.(updatedAttractions, updatedDescriptions);
        setNewAttraction('');
        setNewDescription('');
    };

    const handleEditAttraction = (index: number) => {
        setEditAttraction(attractions[index]);
        setEditDescription(descriptions[index] || '');
        setIsEditing(index);
    };

    const handleSaveEdit = () => {
        if (!editAttraction.trim()) return;

        const updatedAttractions = [...attractions];
        const updatedDescriptions = [...descriptions];

        updatedAttractions[isEditing!] = editAttraction.trim();
        updatedDescriptions[isEditing!] = editDescription.trim();

        onAttractionsUpdate?.(updatedAttractions, updatedDescriptions);
        setIsEditing(null);
    };

    const handleDeleteAttraction = (index: number) => {
        const updatedAttractions = attractions.filter((_, i) => i !== index);
        const updatedDescriptions = descriptions.filter((_, i) => i !== index);

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
                                {attractions.map((attraction, index) => (
                                    <div key={index} className="border rounded-lg p-3">
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
                                                        onClick={() => setIsEditing(null)}
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
                                                {descriptions[index] && (
                                                    <p className="text-sm text-gray-600">{descriptions[index]}</p>
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