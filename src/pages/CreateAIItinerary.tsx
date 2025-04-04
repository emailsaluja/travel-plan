import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Calendar, Users, Heart, Clock, Sparkles, ArrowLeft } from 'lucide-react';
import TopNavigation from '../components/TopNavigation';
import { countries } from '../data/countries';
import { aiItineraryService } from '../services/ai-itinerary.service';

interface FormData {
    country: string;
    duration: number;
    preferences: {
        interests: string[];
        travelStyle: string;
        budget: string;
        pace: string;
        lookingFor: string;
        thingsToAvoid: string;
    };
}

interface GeneratedItinerary {
    destinations: {
        name: string;
        nights: number;
        description: string;
    }[];
    dailyPlans: {
        day: number;
        activities: {
            time: string;
            activity: string;
            description: string;
            type: string;
        }[];
    }[];
}

const CreateAIItinerary: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedItinerary, setGeneratedItinerary] = useState<GeneratedItinerary | null>(null);
    const [formData, setFormData] = useState<FormData>({
        country: '',
        duration: 7,
        preferences: {
            interests: [],
            travelStyle: 'balanced',
            budget: 'medium',
            pace: 'moderate',
            lookingFor: '',
            thingsToAvoid: ''
        }
    });

    const interests = [
        'Culture & History',
        'Nature & Landscapes',
        'Food & Cuisine',
        'Adventure & Sports',
        'Art & Museums',
        'Shopping & Markets',
        'Beaches & Relaxation',
        'Local Experiences',
        'Photography',
        'Wildlife'
    ];

    const travelStyles = [
        { value: 'luxury', label: 'Luxury' },
        { value: 'balanced', label: 'Balanced' },
        { value: 'budget', label: 'Budget-friendly' }
    ];

    const budgets = [
        { value: 'budget', label: '$' },
        { value: 'medium', label: '$$' },
        { value: 'luxury', label: '$$$' }
    ];

    const paces = [
        { value: 'relaxed', label: 'Relaxed' },
        { value: 'moderate', label: 'Moderate' },
        { value: 'active', label: 'Active' }
    ];

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const itinerary = await aiItineraryService.generateItinerary({
                country: formData.country,
                duration: formData.duration,
                preferences: {
                    ...formData.preferences,
                    lookingFor: formData.preferences.lookingFor.trim(),
                    thingsToAvoid: formData.preferences.thingsToAvoid.trim()
                }
            });
            setGeneratedItinerary(itinerary);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate itinerary');
        } finally {
            setLoading(false);
        }
    };

    const handleViewInDashboard = () => {
        // First navigate to the dashboard
        navigate('/dashboard');
        // Then update the URL with the tab parameter
        window.history.pushState({}, '', '/dashboard?tab=aiItineraries');
    };

    if (generatedItinerary) {
        return (
            <div className="min-h-screen bg-gray-50">
                <TopNavigation />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-[80px]">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <button
                                onClick={() => setGeneratedItinerary(null)}
                                className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Form
                            </button>
                        </div>

                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            Your Generated Itinerary for {formData.country}
                        </h2>

                        {/* Destinations */}
                        <div className="mb-8">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Destinations</h3>
                            <div className="grid gap-4">
                                {generatedItinerary.destinations.map((dest, index) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-900">{dest.name}</h4>
                                        <p className="text-sm text-gray-600">{dest.nights} nights</p>
                                        <p className="text-gray-700 mt-2">{dest.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Daily Plans */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Schedule</h3>
                            <div className="space-y-6">
                                {generatedItinerary.dailyPlans.map((plan, index) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-3">Day {plan.day}</h4>
                                        <div className="space-y-3">
                                            {plan.activities.map((activity, actIndex) => (
                                                <div key={actIndex} className="flex gap-4">
                                                    <div className="w-20 text-sm text-gray-600">
                                                        {activity.time}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {activity.activity}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            {activity.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Your Preferences</h3>
                            {formData.preferences.lookingFor && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-700">Looking For:</h4>
                                    <p className="text-gray-600 mt-1">{formData.preferences.lookingFor}</p>
                                </div>
                            )}
                            {formData.preferences.thingsToAvoid && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700">Avoiding:</h4>
                                    <p className="text-gray-600 mt-1">{formData.preferences.thingsToAvoid}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleViewInDashboard}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#00C48C] hover:bg-[#00B380] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00C48C]"
                            >
                                View in Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <TopNavigation />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-[80px]">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Create AI-Powered Itinerary</h1>
                        <p className="text-gray-600">Let our AI create a personalized travel plan based on your preferences</p>
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                                required
                            >
                                <option value="">Select a country</option>
                                {countries.map(country => (
                                    <option key={country} value={country}>
                                        {country}
                                    </option>
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Interests */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Travel Interests
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {interests.map(interest => (
                                    <button
                                        key={interest}
                                        type="button"
                                        onClick={() => handleInterestToggle(interest)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.preferences.interests.includes(interest)
                                            ? 'bg-[#00C48C] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
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
                            <div className="grid grid-cols-3 gap-2">
                                {travelStyles.map(style => (
                                    <button
                                        key={style.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            preferences: { ...prev.preferences, travelStyle: style.value }
                                        }))}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.preferences.travelStyle === style.value
                                            ? 'bg-[#00C48C] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {style.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Budget */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Budget Level
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {budgets.map(budget => (
                                    <button
                                        key={budget.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            preferences: { ...prev.preferences, budget: budget.value }
                                        }))}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.preferences.budget === budget.value
                                            ? 'bg-[#00C48C] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {budget.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pace */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Travel Pace
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {paces.map(pace => (
                                    <button
                                        key={pace.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            preferences: { ...prev.preferences, pace: pace.value }
                                        }))}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.preferences.pace === pace.value
                                            ? 'bg-[#00C48C] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {pace.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Looking For */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                What are you looking for in this trip?
                            </label>
                            <textarea
                                value={formData.preferences.lookingFor}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    preferences: { ...prev.preferences, lookingFor: e.target.value }
                                }))}
                                placeholder="Describe what you'd like to experience (e.g., local cuisine, specific activities, special interests, budget considerations)"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent h-32 resize-none"
                            />
                        </div>

                        {/* Things to Avoid */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                What would you like to avoid?
                            </label>
                            <textarea
                                value={formData.preferences.thingsToAvoid}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    preferences: { ...prev.preferences, thingsToAvoid: e.target.value }
                                }))}
                                placeholder="List things you'd prefer to avoid (e.g., crowded tourist spots, specific types of activities, certain environments)"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent h-32 resize-none"
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#00C48C] hover:bg-[#00B380] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00C48C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating Itinerary...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Generate Itinerary
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateAIItinerary; 