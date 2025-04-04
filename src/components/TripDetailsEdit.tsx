import React, { useState } from 'react';
import { X, Save, Upload } from 'lucide-react';

interface TripDetailsEditProps {
    tripDetails: TripDetails;
    onSave: (details: TripDetails) => void;
    onCancel: () => void;
}

const TripDetailsEdit: React.FC<TripDetailsEditProps> = ({ tripDetails, onSave, onCancel }) => {
    const [details, setDetails] = useState(tripDetails);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Edit Trip Details</h2>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trip Name</label>
                        <input
                            type="text"
                            value={details.trip_name}
                            onChange={(e) => setDetails({ ...details, trip_name: e.target.value })}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                        <input
                            type="text"
                            value={details.image_url || ''}
                            onChange={(e) => setDetails({ ...details, image_url: e.target.value })}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                            <input
                                type="text"
                                value={details.country}
                                onChange={(e) => setDetails({ ...details, country: e.target.value })}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                            <input
                                type="number"
                                value={details.duration}
                                onChange={(e) => setDetails({ ...details, duration: parseInt(e.target.value) })}
                                className="w-full p-2 border rounded"
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={details.start_date}
                                onChange={(e) => setDetails({ ...details, start_date: e.target.value })}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Travelers</label>
                            <input
                                type="number"
                                value={details.travelers}
                                onChange={(e) => setDetails({ ...details, travelers: parseInt(e.target.value) })}
                                className="w-full p-2 border rounded"
                                min="1"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Budget (optional)</label>
                        <input
                            type="text"
                            value={details.budget || ''}
                            onChange={(e) => setDetails({ ...details, budget: e.target.value })}
                            className="w-full p-2 border rounded"
                            placeholder="e.g., $5000"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(details)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TripDetailsEdit; 