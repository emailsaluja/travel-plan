import React, { useState } from 'react';

interface Destination {
    name: string;
    nights: number;
    description: string;
    image?: string;
}

interface DestinationEditFormProps {
    destination: Destination;
    onSave: (destination: Destination) => void;
    onCancel: () => void;
}

const DestinationEditForm: React.FC<DestinationEditFormProps> = ({
    destination,
    onSave,
    onCancel
}) => {
    const [editedDestination, setEditedDestination] = useState<Destination>(destination);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(editedDestination);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg border border-gray-300 shadow-md">
            <h3 className="font-bold text-gray-800 mb-4">Edit Destination</h3>
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                        type="text"
                        value={editedDestination.name}
                        onChange={(e) => setEditedDestination({ ...editedDestination, name: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Nights</label>
                    <input
                        type="number"
                        min="1"
                        value={editedDestination.nights}
                        onChange={(e) => setEditedDestination({ ...editedDestination, nights: parseInt(e.target.value) })}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        value={editedDestination.description}
                        onChange={(e) => setEditedDestination({ ...editedDestination, description: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                    <input
                        type="url"
                        value={editedDestination.image || ''}
                        onChange={(e) => setEditedDestination({ ...editedDestination, image: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/image.jpg"
                    />
                    {editedDestination.image && (
                        <img
                            src={editedDestination.image}
                            alt="Preview"
                            className="mt-2 h-40 w-full object-cover rounded"
                            onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL';
                            }}
                        />
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Save
                    </button>
                </div>
            </div>
        </form>
    );
};

export default DestinationEditForm; 