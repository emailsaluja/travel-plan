import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Check, Plus, X, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TripPreparation {
    id: string;
    itinerary_id: string;
    category: 'documents' | 'packing' | 'bookings' | 'health' | 'other';
    item: string;
    is_completed: boolean;
    due_date?: string;
    notes?: string;
    created_at: string;
}

interface Itinerary {
    id: string;
    trip_name: string;
    country: string;
    start_date: string;
    duration: number;
    user_id: string;
}

const TripPreparations = () => {
    const { id } = useParams<{ id: string }>();
    const [itinerary, setItinerary] = useState<Itinerary | null>(null);
    const [preparations, setPreparations] = useState<TripPreparation[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<TripPreparation['category']>('documents');
    const [isAddingItem, setIsAddingItem] = useState(false);

    const categories = {
        documents: { label: 'Travel Documents', icon: '📄' },
        packing: { label: 'Packing List', icon: '🎒' },
        bookings: { label: 'Bookings & Reservations', icon: '🏨' },
        health: { label: 'Health & Safety', icon: '🏥' },
        other: { label: 'Other', icon: '📝' }
    };

    useEffect(() => {
        loadTripData();
    }, [id]);

    const loadTripData = async () => {
        try {
            setLoading(true);

            // Fetch itinerary details
            const { data: itineraryData, error: itineraryError } = await supabase
                .from('user_itineraries')
                .select('*')
                .eq('id', id)
                .single();

            if (itineraryError) throw itineraryError;
            setItinerary(itineraryData);

            // Fetch preparation items
            const { data: prepData, error: prepError } = await supabase
                .from('trip_preparations')
                .select('*')
                .eq('itinerary_id', id)
                .order('created_at', { ascending: true });

            if (prepError) throw prepError;
            setPreparations(prepData || []);

        } catch (error) {
            console.error('Error loading trip data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async () => {
        if (!newItem.trim() || !itinerary) return;

        try {
            const newPreparation = {
                itinerary_id: itinerary.id,
                category: selectedCategory,
                item: newItem.trim(),
                is_completed: false,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('trip_preparations')
                .insert([newPreparation])
                .select()
                .single();

            if (error) throw error;

            setPreparations(prev => [...prev, data]);
            setNewItem('');
            setIsAddingItem(false);
        } catch (error) {
            console.error('Error adding preparation item:', error);
        }
    };

    const toggleItemCompletion = async (prepId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('trip_preparations')
                .update({ is_completed: !currentStatus })
                .eq('id', prepId);

            if (error) throw error;

            setPreparations(prev =>
                prev.map(prep =>
                    prep.id === prepId
                        ? { ...prep, is_completed: !currentStatus }
                        : prep
                )
            );
        } catch (error) {
            console.error('Error toggling preparation item:', error);
        }
    };

    const deleteItem = async (prepId: string) => {
        try {
            const { error } = await supabase
                .from('trip_preparations')
                .delete()
                .eq('id', prepId);

            if (error) throw error;

            setPreparations(prev => prev.filter(prep => prep.id !== prepId));
        } catch (error) {
            console.error('Error deleting preparation item:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getDaysUntilTrip = (startDate: string) => {
        const today = new Date();
        const tripDate = new Date(startDate);
        const diffTime = tripDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C48C] border-t-transparent"></div>
            </div>
        );
    }

    if (!itinerary) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Itinerary Not Found</h1>
                    <p className="text-gray-600 mb-4">The itinerary you're looking for doesn't exist.</p>
                    <Link
                        to="/dashboard"
                        className="text-[#00C48C] hover:text-[#00B380] transition-colors"
                    >
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-5xl mx-auto px-4">
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">{itinerary.trip_name}</h1>
                        <Link
                            to={`/view-itinerary/${itinerary.id}`}
                            className="text-[#00C48C] hover:text-[#00B380] transition-colors text-sm font-medium"
                        >
                            View Full Itinerary
                        </Link>
                    </div>
                    <div className="flex items-center gap-6 text-gray-600">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-[#00C48C]" />
                            <span>{itinerary.country}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-[#00C48C]" />
                            <span>{formatDate(itinerary.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-[#00C48C]" />
                            <span>{itinerary.duration} days</span>
                        </div>
                    </div>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#00C48C]/10 text-[#00C48C] rounded-full text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        {getDaysUntilTrip(itinerary.start_date)} days until trip
                    </div>
                </div>

                {/* Preparation Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {Object.entries(categories).map(([key, { label, icon }]) => (
                        <button
                            key={key}
                            onClick={() => setSelectedCategory(key as TripPreparation['category'])}
                            className={`p-4 rounded-xl border transition-all ${selectedCategory === key
                                ? 'border-[#00C48C] bg-[#00C48C]/5'
                                : 'border-gray-100 bg-white hover:border-[#00C48C]/30'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{icon}</span>
                                <div className="text-left">
                                    <div className="font-medium text-gray-900">{label}</div>
                                    <div className="text-sm text-gray-500">
                                        {preparations.filter(p => p.category === key).length} items
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Preparation Items */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {categories[selectedCategory].icon} {categories[selectedCategory].label}
                        </h2>
                        <button
                            onClick={() => setIsAddingItem(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C48C] text-white rounded-lg text-sm font-medium hover:bg-[#00B380] transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Item
                        </button>
                    </div>

                    {/* Add New Item Form */}
                    {isAddingItem && (
                        <div className="flex items-center gap-4 mb-6">
                            <input
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="Enter preparation item..."
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                            />
                            <button
                                onClick={handleAddItem}
                                className="px-4 py-2 bg-[#00C48C] text-white rounded-lg text-sm font-medium hover:bg-[#00B380] transition-colors"
                            >
                                Add
                            </button>
                            <button
                                onClick={() => {
                                    setIsAddingItem(false);
                                    setNewItem('');
                                }}
                                className="p-2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Preparation Items List */}
                    <div className="space-y-2">
                        {preparations
                            .filter(prep => prep.category === selectedCategory)
                            .map(prep => (
                                <div
                                    key={prep.id}
                                    className={`flex items-center gap-4 p-4 rounded-lg border ${prep.is_completed
                                        ? 'bg-gray-50 border-gray-100'
                                        : 'bg-white border-gray-200'
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleItemCompletion(prep.id, prep.is_completed)}
                                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${prep.is_completed
                                            ? 'bg-[#00C48C] border-[#00C48C]'
                                            : 'border-gray-300 hover:border-[#00C48C]'
                                            }`}
                                    >
                                        {prep.is_completed && (
                                            <Check className="w-3 h-3 text-white" />
                                        )}
                                    </button>
                                    <span className={`flex-1 ${prep.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                        {prep.item}
                                    </span>
                                    <button
                                        onClick={() => deleteItem(prep.id)}
                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                        {preparations.filter(prep => prep.category === selectedCategory).length === 0 && (
                            <div className="text-center py-8">
                                <div className="text-gray-400 mb-2">{categories[selectedCategory].icon}</div>
                                <p className="text-gray-600 font-medium">No items added yet</p>
                                <p className="text-sm text-gray-500">
                                    Click the "Add Item" button to start your preparation list
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TripPreparations; 