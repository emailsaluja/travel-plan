import React, { useState } from 'react';

interface Activity {
    time: string;
    type: string;
    activity: string;
    description: string;
    location?: string;
    duration?: string;
    cost?: string;
    notes?: string;
}

interface ActivityEditFormProps {
    activity: Activity;
    onSave: (activity: Activity) => void;
    onCancel: () => void;
}

const ActivityEditForm: React.FC<ActivityEditFormProps> = ({ activity, onSave, onCancel }) => {
    const [editedActivity, setEditedActivity] = useState<Activity>(activity);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(editedActivity);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg border border-gray-300 shadow-md">
            <h3 className="font-bold text-gray-800 mb-4">Edit Activity</h3>
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                        type="time"
                        value={editedActivity.time}
                        onChange={(e) => setEditedActivity({ ...editedActivity, time: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                    <select
                        value={editedActivity.type}
                        onChange={(e) => setEditedActivity({ ...editedActivity, type: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Activity Name</label>
                    <input
                        type="text"
                        value={editedActivity.activity}
                        onChange={(e) => setEditedActivity({ ...editedActivity, activity: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        value={editedActivity.description}
                        onChange={(e) => setEditedActivity({ ...editedActivity, description: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
                    <input
                        type="text"
                        value={editedActivity.location || ''}
                        onChange={(e) => setEditedActivity({ ...editedActivity, location: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (optional)</label>
                    <input
                        type="text"
                        value={editedActivity.duration || ''}
                        onChange={(e) => setEditedActivity({ ...editedActivity, duration: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 2 hours"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost (optional)</label>
                    <input
                        type="text"
                        value={editedActivity.cost || ''}
                        onChange={(e) => setEditedActivity({ ...editedActivity, cost: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., $20"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                    <textarea
                        value={editedActivity.notes || ''}
                        onChange={(e) => setEditedActivity({ ...editedActivity, notes: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                    />
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

export default ActivityEditForm; 