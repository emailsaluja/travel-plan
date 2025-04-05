import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PremiumItineraryService, PremiumItinerary } from '../services/premium-itinerary.service';
import { ChevronLeft, MapPin, Calendar, Share2 } from 'lucide-react';
import TopNavigation from '../components/TopNavigation';
import { useAuth } from '../contexts/AuthContext';

const ViewPremiumItinerary = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [itinerary, setItinerary] = useState<PremiumItinerary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
        loadItinerary();
    }, [id]);

    const loadItinerary = async () => {
        try {
            if (!id) return;
            const data = await PremiumItineraryService.getPremiumItinerary(id);
            setItinerary(data);
        } catch (error: any) {
            console.error('Error loading premium itinerary:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        try {
            if (!id || !itinerary) return;
            setPublishing(true);
            await PremiumItineraryService.updateStatus(id, 'published');
            // Reload the itinerary to get the updated status
            await loadItinerary();
        } catch (error: any) {
            console.error('Error publishing itinerary:', error);
            setError(error.message);
        } finally {
            setPublishing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <TopNavigation />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C48C] border-t-transparent"></div>
                </div>
            </div>
        );
    }

    if (error || !itinerary) {
        return (
            <div className="min-h-screen bg-gray-50">
                <TopNavigation />
                <div className="max-w-4xl mx-auto px-4 py-8 mt-[60px]">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            {error || 'Premium itinerary not found'}
                        </h2>
                        <button
                            onClick={() => navigate('/dashboard?tab=premium')}
                            className="text-[#00C48C] hover:text-[#00B380]"
                        >
                            Back to Premium Itineraries
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <TopNavigation />

            <div className="max-w-4xl mx-auto px-4 py-8 mt-[60px]">
                {/* Status and Actions Bar */}
                {itinerary.user_id === user?.id && (
                    <div className="bg-white rounded-xl p-4 mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">Status:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${itinerary.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {itinerary.status.charAt(0).toUpperCase() + itinerary.status.slice(1)}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            {itinerary.status !== 'published' && (
                                <button
                                    onClick={handlePublish}
                                    disabled={publishing}
                                    className="px-4 py-2 bg-[#00C48C] text-white rounded-lg text-sm font-medium hover:bg-[#00B380] transition-colors disabled:opacity-50"
                                >
                                    {publishing ? 'Publishing...' : 'Publish Itinerary'}
                                </button>
                            )}
                            <button
                                onClick={() => navigate(`/create-premium-itinerary/${itinerary.id}`)}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Edit Itinerary
                            </button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-semibold text-gray-900">{itinerary.title}</h1>
                    </div>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert('Link copied to clipboard!');
                        }}
                        className="p-2 text-gray-600 hover:text-gray-900"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Featured Image */}
                <div className="relative h-96 rounded-2xl overflow-hidden mb-8">
                    <img
                        src={itinerary.featured_image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop'}
                        alt={itinerary.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop';
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                        <div className="flex items-center gap-2 text-white/90 text-lg mb-2">
                            <MapPin className="w-6 h-6" />
                            <span>{itinerary.country}</span>
                            <span className="mx-2">•</span>
                            <Calendar className="w-6 h-6" />
                            <span>{itinerary.duration} days</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-semibold text-white">{itinerary.title}</h2>
                            <div className="px-4 py-2 bg-[#EAB308] text-white text-lg font-medium rounded-full">
                                {itinerary.currency} {itinerary.price}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="bg-white rounded-2xl p-8 mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">About this Premium Itinerary</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{itinerary.description}</p>
                </div>

                {/* Gallery */}
                {itinerary.gallery_image_urls && itinerary.gallery_image_urls.length > 0 && (
                    <div className="bg-white rounded-2xl p-8 mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Gallery</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {itinerary.gallery_image_urls.map((url, index) => (
                                <div key={index} className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
                                    <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Inclusions & Exclusions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white rounded-2xl p-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">What's Included</h3>
                        <ul className="space-y-2">
                            {itinerary.inclusions.map((item, index) => (
                                <li key={index} className="flex items-center gap-2 text-gray-600">
                                    <span className="w-2 h-2 bg-[#00C48C] rounded-full" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-white rounded-2xl p-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">What's Not Included</h3>
                        <ul className="space-y-2">
                            {itinerary.exclusions.map((item, index) => (
                                <li key={index} className="flex items-center gap-2 text-gray-600">
                                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Terms & Conditions */}
                <div className="bg-white rounded-2xl p-8 mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{itinerary.terms_and_conditions}</p>
                </div>

                {/* Cancellation Policy */}
                <div className="bg-white rounded-2xl p-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Cancellation Policy</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{itinerary.cancellation_policy}</p>
                </div>
            </div>
        </div>
    );
};

export default ViewPremiumItinerary; 