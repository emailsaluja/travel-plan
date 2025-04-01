import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { AIItineraryService } from '../services/ai-itinerary.service';
import { countries } from '../data/countries';

interface AIItineraryGeneratorProps {
    onItineraryGenerated: (itinerary: any) => void;
}

const AIItineraryGenerator: React.FC<AIItineraryGeneratorProps> = ({ onItineraryGenerated }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        country: '',
        duration: 7,
        preferences: {
            interests: [] as string[],
            travelStyle: '',
            budget: '',
            pace: ''
        }
    });

    const interests = [
        'Culture & History',
        'Nature & Outdoors',
        'Food & Dining',
        'Shopping',
        'Adventure',
        'Relaxation',
        'Nightlife',
        'Art & Museums'
    ];

    const travelStyles = [
        'Luxury',
        'Comfort',
        'Budget',
        'Backpacking',
        'Family-friendly',
        'Romantic',
        'Solo'
    ];

    const budgets = [
        'Luxury',
        'Moderate',
        'Budget',
        'Backpacker'
    ];

    const paces = [
        'Relaxed',
        'Moderate',
        'Intensive',
        'Flexible'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const itinerary = await AIItineraryService.generateItinerary(formData);
            onItineraryGenerated(itinerary);
        } catch (err) {
            setError('Failed to generate itinerary. Please try again.');
            console.error('Error generating itinerary:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInterestToggle = (interest: string) => {
        setFormData(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                interests: prev.preferences.interests.includes(interest)
                    ? prev.preferences.interests.filter(i => i !== interest)
                    : [...prev.preferences.interests, interest]
            }
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-semibold">AI-Powered Itinerary Generator</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Country Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Destination Country
                    </label>
                    <select
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                        required
                    >
                        <option value="">Select a country</option>
                        {countries.map(country => (
                            <option key={country} value={country}>{country}</option>
                        ))}
                    </select>
                </div>

                {/* Duration */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trip Duration (days)
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="30"
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                        required
                    />
                </div>

                {/* Interests */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Interests
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {interests.map(interest => (
                            <button
                                key={interest}
                                type="button"
                                onClick={() => handleInterestToggle(interest)}
                                className={`p-2 rounded-md text-sm ${formData.preferences.interests.includes(interest)
                                    ? 'bg-rose-100 text-rose-700 border-rose-500'
                                    : 'bg-gray-50 text-gray-700 border-gray-300'
                                    } border`}
                            >
                                {interest}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Travel Style */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Travel Style
                    </label>
                    <select
                        value={formData.preferences.travelStyle}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            preferences: { ...prev.preferences, travelStyle: e.target.value }
                        }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    >
                        <option value="">Select travel style</option>
                        {travelStyles.map(style => (
                            <option key={style} value={style}>{style}</option>
                        ))}
                    </select>
                </div>

                {/* Budget */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Budget Level
                    </label>
                    <select
                        value={formData.preferences.budget}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            preferences: { ...prev.preferences, budget: e.target.value }
                        }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    >
                        <option value="">Select budget level</option>
                        {budgets.map(budget => (
                            <option key={budget} value={budget}>{budget}</option>
                        ))}
                    </select>
                </div>

                {/* Pace */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Travel Pace
                    </label>
                    <select
                        value={formData.preferences.pace}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            preferences: { ...prev.preferences, pace: e.target.value }
                        }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    >
                        <option value="">Select travel pace</option>
                        {paces.map(pace => (
                            <option key={pace} value={pace}>{pace}</option>
                        ))}
                    </select>
                </div>

                {error && (
                    <div className="text-red-500 text-sm">{error}</div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating Itinerary...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4" />
                            Generate Itinerary
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default AIItineraryGenerator; 