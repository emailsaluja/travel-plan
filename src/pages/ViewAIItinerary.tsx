import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, Users, ArrowLeft, Sparkles } from 'lucide-react';
import TopNavigation from '../components/TopNavigation';
import { aiItineraryService, SavedAIItinerary } from '../services/ai-itinerary.service';
import { formatDate } from '../utils/dateUtils';

const ViewAIItinerary: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [itinerary, setItinerary] = useState<SavedAIItinerary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadItinerary = async () => {
            if (!id) return;

            try {
                const data = await aiItineraryService.getItineraryById(id);
                if (data) {
                    setItinerary(data);
                } else {
                    setError('Itinerary not found');
                }
            } catch (err) {
                console.error('Error loading itinerary:', err);
                setError('Failed to load itinerary');
            } finally {
                setLoading(false);
            }
        };

        loadItinerary();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C48C] border-t-transparent"></div>
            </div>
        );
    }

    if (error || !itinerary) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Itinerary Not Found</h1>
                    <p className="text-gray-600 mb-4">The itinerary you're looking for doesn't exist.</p>
                    <button
                        onClick={() => navigate('/dashboard?tab=aiItineraries')}
                        className="text-[#00C48C] hover:text-[#00B380] font-medium"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <TopNavigation />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-[80px]">
                <div className="bg-white rounded-lg shadow-sm">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-2 mb-6">
                            <button
                                onClick={() => navigate('/dashboard?tab=aiItineraries')}
                                className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Dashboard
                            </button>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-2xl font-semibold text-gray-900">{itinerary.trip_name}</h1>
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                                <span className="text-sm text-gray-500">AI-Generated</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{itinerary.country}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{itinerary.duration} days</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Generated {formatDate(itinerary.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Destinations */}
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Destinations</h2>
                        <div className="space-y-4">
                            {itinerary.generated_itinerary.destinations.map((dest, index) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-medium text-gray-900">{dest.name}</h3>
                                            <p className="text-sm text-gray-500">{dest.nights} nights</p>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-gray-700">{dest.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Daily Plans */}
                    <div className="p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Daily Plans</h2>
                        <div className="space-y-6">
                            {itinerary.generated_itinerary.dailyPlans.map((day, dayIndex) => (
                                <div key={dayIndex} className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-medium text-gray-900 mb-3">Day {day.day}</h3>
                                    <div className="space-y-4">
                                        {day.activities.map((activity, actIndex) => (
                                            <div key={actIndex} className="bg-white p-3 rounded-md">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {activity.time} - {activity.activity}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {activity.description}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-500 capitalize">
                                                        {activity.type}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewAIItinerary; 