import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserItineraryService } from '../services/user-itinerary.service';
import { PremiumItineraryService } from '../services/premium-itinerary.service';
import { Upload, X, ChevronLeft } from 'lucide-react';
import TopNavigation from '../components/TopNavigation';
import { supabase } from '../lib/supabase';

interface Itinerary {
    id: string;
    trip_name: string;
    country: string;
    duration: number;
    destinations: {
        destination: string;
        nights: number;
    }[];
}

const CreatePremiumItinerary = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { userEmail } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [selectedItinerary, setSelectedItinerary] = useState<string>('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        currency: 'USD',
        inclusions: [''],
        exclusions: [''],
        terms_and_conditions: '',
        cancellation_policy: '',
    });
    const [featuredImage, setFeaturedImage] = useState<File | null>(null);
    const [featuredImagePreview, setFeaturedImagePreview] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
        loadItineraries();
        if (id) {
            loadPremiumItinerary();
        }
    }, [id]);

    const loadItineraries = async () => {
        try {
            const { data } = await UserItineraryService.getUserItineraries();
            setItineraries(data as Itinerary[]);
        } catch (error) {
            console.error('Error loading itineraries:', error);
            setError('Failed to load itineraries');
        } finally {
            setLoading(false);
        }
    };

    const loadPremiumItinerary = async () => {
        try {
            if (!id) return;
            const itinerary = await PremiumItineraryService.getPremiumItinerary(id);
            if (itinerary) {
                setFormData({
                    title: itinerary.title,
                    description: itinerary.description,
                    price: itinerary.price.toString(),
                    currency: itinerary.currency,
                    inclusions: itinerary.inclusions.length > 0 ? itinerary.inclusions : [''],
                    exclusions: itinerary.exclusions.length > 0 ? itinerary.exclusions : [''],
                    terms_and_conditions: itinerary.terms_and_conditions,
                    cancellation_policy: itinerary.cancellation_policy,
                });
                setSelectedItinerary(itinerary.base_itinerary_id);
                if (itinerary.featured_image_url) {
                    setFeaturedImagePreview(itinerary.featured_image_url);
                }
            }
        } catch (error) {
            console.error('Error loading premium itinerary:', error);
            setError('Failed to load premium itinerary');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleArrayInputChange = (index: number, value: string, field: 'inclusions' | 'exclusions') => {
        setFormData(prev => {
            const newArray = [...prev[field]];
            newArray[index] = value;
            return {
                ...prev,
                [field]: newArray
            };
        });
    };

    const addArrayItem = (field: 'inclusions' | 'exclusions') => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], '']
        }));
    };

    const removeArrayItem = (index: number, field: 'inclusions' | 'exclusions') => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('Featured image must be less than 5MB');
                return;
            }
            console.log('Selected file details:', {
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified
            });
            setFeaturedImage(file);
            const reader = new FileReader();
            reader.onload = () => {
                setFeaturedImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent, shouldPublish: boolean = false) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            if (!selectedItinerary) {
                throw new Error('Please select a base itinerary');
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            let featuredImageUrl = featuredImagePreview;

            // Upload featured image if provided
            if (featuredImage) {
                console.log('About to upload featured image:', {
                    name: featuredImage.name,
                    type: featuredImage.type,
                    size: featuredImage.size,
                    lastModified: featuredImage.lastModified
                });
                try {
                    featuredImageUrl = await PremiumItineraryService.uploadFeaturedImage(featuredImage, user.id);
                } catch (error) {
                    console.error('Error uploading image:', error);
                    throw new Error('Failed to upload image. Please try again.');
                }
            }

            const selectedBaseItinerary = itineraries.find(i => i.id === selectedItinerary);
            if (!selectedBaseItinerary) {
                throw new Error('Selected base itinerary not found');
            }

            const itineraryData = {
                user_id: user.id,
                base_itinerary_id: selectedItinerary,
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price),
                currency: formData.currency,
                inclusions: formData.inclusions.filter(Boolean),
                exclusions: formData.exclusions.filter(Boolean),
                terms_and_conditions: formData.terms_and_conditions || '',
                cancellation_policy: formData.cancellation_policy || '',
                featured_image_url: featuredImageUrl,
                gallery_image_urls: [],
                status: shouldPublish ? 'published' as const : 'draft' as const,
                country: selectedBaseItinerary.country,
                duration: selectedBaseItinerary.duration
            };

            if (id) {
                await PremiumItineraryService.updatePremiumItinerary(id, itineraryData);
            } else {
                await PremiumItineraryService.createPremiumItinerary(itineraryData);
            }

            navigate('/dashboard?tab=premium');
        } catch (error: any) {
            console.error('Error saving premium itinerary:', error);
            setError(error.message);
        } finally {
            setSaving(false);
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

    return (
        <div className="min-h-screen bg-gray-50">
            <TopNavigation />

            <div className="max-w-4xl mx-auto px-4 py-8 mt-[60px]">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            {id ? 'Edit Premium Itinerary' : 'Create Premium Itinerary'}
                        </h1>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
                    {/* Base Itinerary Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Base Itinerary
                        </label>
                        <select
                            value={selectedItinerary}
                            onChange={(e) => setSelectedItinerary(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                            required
                        >
                            <option value="">Select an itinerary</option>
                            {itineraries.map((itinerary) => (
                                <option key={itinerary.id} value={itinerary.id}>
                                    {itinerary.trip_name} - {itinerary.duration} days in {itinerary.destinations.map(d => d.destination).join(', ')}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Currency
                                </label>
                                <select
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                                >
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                    <option value="AUD">AUD</option>
                                    <option value="CAD">CAD</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Inclusions */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Inclusions
                        </label>
                        {formData.inclusions.map((inclusion, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={inclusion}
                                    onChange={(e) => handleArrayInputChange(index, e.target.value, 'inclusions')}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                                    placeholder="Enter an inclusion"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeArrayItem(index, 'inclusions')}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => addArrayItem('inclusions')}
                            className="text-[#00C48C] hover:text-[#00B380] text-sm font-medium"
                        >
                            + Add Inclusion
                        </button>
                    </div>

                    {/* Exclusions */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Exclusions
                        </label>
                        {formData.exclusions.map((exclusion, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={exclusion}
                                    onChange={(e) => handleArrayInputChange(index, e.target.value, 'exclusions')}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                                    placeholder="Enter an exclusion"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeArrayItem(index, 'exclusions')}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => addArrayItem('exclusions')}
                            className="text-[#00C48C] hover:text-[#00B380] text-sm font-medium"
                        >
                            + Add Exclusion
                        </button>
                    </div>

                    {/* Terms and Conditions */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Terms and Conditions (Optional)
                        </label>
                        <textarea
                            name="terms_and_conditions"
                            value={formData.terms_and_conditions}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                        />
                    </div>

                    {/* Cancellation Policy */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cancellation Policy (Optional)
                        </label>
                        <textarea
                            name="cancellation_policy"
                            value={formData.cancellation_policy}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                        />
                    </div>

                    {/* Featured Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Featured Image
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                            <div className="space-y-1 text-center">
                                {featuredImagePreview ? (
                                    <div className="relative">
                                        <img
                                            src={featuredImagePreview}
                                            alt="Featured"
                                            className="mx-auto h-32 w-auto object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFeaturedImage(null);
                                                setFeaturedImagePreview('');
                                            }}
                                            className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md"
                                        >
                                            <X className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600">
                                            <label
                                                htmlFor="featured-image"
                                                className="relative cursor-pointer bg-white rounded-md font-medium text-[#00C48C] hover:text-[#00B380] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#00C48C]"
                                            >
                                                <span>Upload a file</span>
                                                <input
                                                    id="featured-image"
                                                    name="featured-image"
                                                    type="file"
                                                    accept="image/*"
                                                    className="sr-only"
                                                    onChange={handleFeaturedImageChange}
                                                />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, false)}
                            disabled={saving}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save as Draft'}
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, true)}
                            disabled={saving}
                            className="px-6 py-2 bg-[#00C48C] text-white rounded-lg hover:bg-[#00B380] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00C48C] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Publishing...' : 'Publish Now'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePremiumItinerary; 