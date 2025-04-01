import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Bed } from 'lucide-react';
import { cleanDestination } from '../utils/stringUtils';
import { supabase } from '../lib/supabase';

interface DayHotelSearchPopupProps {
    isOpen: boolean;
    onClose: () => void;
    destination: string;
    dayIndex: number;
    onHotelSelect: (hotel: string, dayIndex: number, description?: string) => void;
    selectedHotel?: string;
    hotelDesc?: string;
    itineraryId?: string;
}

const DayHotelSearchPopup: React.FC<DayHotelSearchPopupProps> = ({
    isOpen,
    onClose,
    destination,
    dayIndex,
    onHotelSelect,
    selectedHotel,
    hotelDesc,
    itineraryId
}) => {
    const [hotelName, setHotelName] = useState('');
    const [hotelDescription, setHotelDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch hotel data from user_itinerary_day_hotels when popup opens
    useEffect(() => {
        const fetchHotelData = async () => {
            if (!itineraryId || !isOpen) return;

            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('user_itinerary_day_hotels')
                    .select('hotel, hotel_desc')
                    .eq('itinerary_id', itineraryId)
                    .eq('day_index', dayIndex)
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching hotel data:', error);
                    return;
                }

                if (data) {
                    setHotelName(data.hotel || '');
                    setHotelDescription(data.hotel_desc || '');
                } else {
                    // If no data in user_itinerary_day_hotels, use the passed props
                    setHotelName(selectedHotel || '');
                    setHotelDescription(hotelDesc || '');
                }
            } catch (error) {
                console.error('Error fetching hotel data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHotelData();
    }, [itineraryId, dayIndex, isOpen]);

    // Reset form when popup closes
    useEffect(() => {
        if (!isOpen) {
            setError(null);
            setIsSaving(false);
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleSaveChanges = async () => {
        if (!hotelName.trim()) {
            setError('Hotel name is required');
            return;
        }

        setIsSaving(true);
        try {
            if (itineraryId) {
                // First check if a record exists
                const { data: existingRecord, error: checkError } = await supabase
                    .from('user_itinerary_day_hotels')
                    .select('*')
                    .eq('itinerary_id', itineraryId)
                    .eq('day_index', dayIndex)
                    .maybeSingle();

                if (checkError) {
                    throw checkError;
                }

                if (existingRecord) {
                    // Update existing record
                    const { error: updateError } = await supabase
                        .from('user_itinerary_day_hotels')
                        .update({
                            hotel: hotelName.trim(),
                            hotel_desc: hotelDescription.trim(),
                            created_at: new Date()
                        })
                        .eq('itinerary_id', itineraryId)
                        .eq('day_index', dayIndex);

                    if (updateError) {
                        throw updateError;
                    }
                } else {
                    // Insert new record
                    const { error: insertError } = await supabase
                        .from('user_itinerary_day_hotels')
                        .insert({
                            itinerary_id: itineraryId,
                            day_index: dayIndex,
                            hotel: hotelName.trim(),
                            hotel_desc: hotelDescription.trim(),
                            created_at: new Date()
                        });

                    if (insertError) {
                        throw insertError;
                    }
                }
            }

            // Call the parent handler
            onHotelSelect(hotelName.trim(), dayIndex, hotelDescription.trim());
            onClose();
        } catch (error) {
            console.error('Error saving hotel:', error);
            setError('Failed to save hotel. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteHotel = async () => {
        setIsSaving(true);
        try {
            if (itineraryId) {
                const { error: deleteError } = await supabase
                    .from('user_itinerary_day_hotels')
                    .delete()
                    .eq('itinerary_id', itineraryId)
                    .eq('day_index', dayIndex);

                if (deleteError) {
                    throw deleteError;
                }
            }

            // Call the parent handler
            onHotelSelect('', dayIndex, '');
            onClose();
        } catch (error) {
            console.error('Error deleting hotel:', error);
            setError('Failed to delete hotel. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            className="fixed inset-0 z-50 overflow-y-auto"
        >
            <div className="flex items-center justify-center min-h-screen p-3">
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

                <div className="relative bg-white rounded-xl w-full max-w-xl shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-[#F59E0B]/5 rounded-t-xl border-b border-[#F59E0B]/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                                <Bed className="w-5 h-5 text-[#F59E0B]" />
                            </div>
                            <div>
                                <Dialog.Title className="text-lg font-semibold text-gray-900">
                                    Hotel Details
                                </Dialog.Title>
                                <p className="text-sm text-gray-500">
                                    Day {dayIndex + 1} · {cleanDestination(destination)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-500 hover:bg-[#F59E0B]/5 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="bg-[#F59E0B]/5 rounded-lg p-4 space-y-3">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter hotel name"
                                            value={hotelName}
                                            onChange={(e) => {
                                                setHotelName(e.target.value);
                                                setError(null);
                                            }}
                                            className={`w-full p-2.5 border ${error ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent outline-none transition-shadow text-sm`}
                                        />
                                        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                        <textarea
                                            placeholder="Add any notes about the hotel"
                                            value={hotelDescription}
                                            onChange={(e) => setHotelDescription(e.target.value)}
                                            rows={3}
                                            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent outline-none transition-shadow text-sm resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
                        {selectedHotel ? (
                            <button
                                onClick={handleDeleteHotel}
                                disabled={isSaving}
                                className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Removing...' : 'Remove Hotel'}
                            </button>
                        ) : (
                            <div></div>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                disabled={isSaving}
                                className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveChanges}
                                disabled={isSaving}
                                className="px-3 py-1.5 bg-[#F59E0B] text-white rounded-lg hover:bg-[#D97706] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default DayHotelSearchPopup; 