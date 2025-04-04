import React, { useState } from 'react';
import { Calendar, Users, Clock, MapPin } from 'lucide-react';

interface TripDetails {
    trip_name: string;
    country: string;
    duration: number;
    start_date: string;
    travelers: number;
    image_url?: string;
    budget?: string;
    description?: string;
}

interface TripDetailsEditFormProps {
    tripDetails: TripDetails;
    onSave: (details: TripDetails) => void;
    onCancel: () => void;
}

const TripDetailsEditForm: React.FC<TripDetailsEditFormProps> = ({
    tripDetails,
    onSave,
    onCancel
}) => {
    const [details, setDetails] = useState<TripDetails>(tripDetails);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(details);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-2xl font-bold mb-6">Edit Trip Details</h2>

                    <div className="space-y-4">
                        {/* Trip Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Trip Name
                            </label>
                            <input
                                type="text"
                                value={details.trip_name}
                                onChange={(e) => setDetails({ ...details, trip_name: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* Country */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Country
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={details.country}
                                    onChange={(e) => setDetails({ ...details, country: e.target.value })}
                                    className="w-full pl-10 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="date"
                                    value={details.start_date}
                                    onChange={(e) => setDetails({ ...details, start_date: e.target.value })}
                                    className="w-full pl-10 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        {/* Duration and Travelers - Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Duration (days)
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="number"
                                        min="1"
                                        value={details.duration}
                                        onChange={(e) => setDetails({ ...details, duration: parseInt(e.target.value) })}
                                        className="w-full pl-10 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Number of Travelers
                                </label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="number"
                                        min="1"
                                        value={details.travelers}
                                        onChange={(e) => setDetails({ ...details, travelers: parseInt(e.target.value) })}
                                        className="w-full pl-10 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Image URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cover Image URL
                            </label>
                            <input
                                type="url"
                                value={details.image_url || ''}
                                onChange={(e) => setDetails({ ...details, image_url: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://example.com/image.jpg"
                            />
                            {details.image_url && (
                                <img
                                    src={details.image_url}
                                    alt="Preview"
                                    className="mt-2 h-40 w-full object-cover rounded"
                                    onError={(e) => {
                                        const img = e.target as HTMLImageElement;
                                        img.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL';
                                    }}
                                />
                            )}
                        </div>

                        {/* Budget */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Budget (optional)
                            </label>
                            <input
                                type="text"
                                value={details.budget || ''}
                                onChange={(e) => setDetails({ ...details, budget: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., $5000"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Trip Description (optional)
                            </label>
                            <textarea
                                value={details.description || ''}
                                onChange={(e) => setDetails({ ...details, description: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={4}
                                placeholder="Describe your trip..."
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 mt-6">
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
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TripDetailsEditForm; 