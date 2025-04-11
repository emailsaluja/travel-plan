import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { useUser } from '../hooks/useUser';

interface DirectMessageProps {
    itineraryId: string;
    sellerId: string;
    onClose: () => void;
}

const DirectMessage: React.FC<DirectMessageProps> = ({ itineraryId, sellerId, onClose }) => {
    const { user } = useUser();
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tripName, setTripName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch itinerary details
    useEffect(() => {
        const fetchItineraryDetails = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('itineraries')
                    .select('title')
                    .eq('id', itineraryId)
                    .single();

                if (error) {
                    console.error('Error fetching itinerary details:', error);
                } else if (data) {
                    setTripName(data.title);
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchItineraryDetails();
    }, [itineraryId]);

    // Send a direct message to the seller
    const handleSendMessage = async () => {
        if (!user || !message.trim()) return;

        try {
            setIsSubmitting(true);
            console.log("Sending message from:", user.id, "to seller:", sellerId);

            // Check if a conversation already exists between these users for this itinerary
            const { data: existingConv, error: convQueryError } = await supabase
                .from('conversations')
                .select('id')
                .eq('buyer_id', user.id)
                .eq('seller_id', sellerId)
                .eq('itinerary_id', itineraryId)
                .maybeSingle();

            if (convQueryError) {
                console.error('Error checking for existing conversation:', convQueryError);
                throw convQueryError;
            }

            let conversationId;

            // If conversation exists, use it
            if (existingConv?.id) {
                conversationId = existingConv.id;
                console.log('Using existing conversation:', conversationId);
            } else {
                // Create a new conversation with itinerary_id
                const { data: newConv, error: createError } = await supabase
                    .from('conversations')
                    .insert({
                        buyer_id: user.id,
                        seller_id: sellerId,
                        itinerary_id: itineraryId,
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error('Error creating conversation:', createError);
                    throw createError;
                }

                conversationId = newConv.id;
                console.log('Created new conversation:', conversationId);

                // We don't need to add conversation_participants anymore if using buyer_id and seller_id directly
            }

            // Send message
            const { error: msgError } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    recipient_id: sellerId,
                    content: message.trim(),
                    is_read: false
                });

            if (msgError) {
                console.error('Error sending message:', msgError);
                throw msgError;
            }

            // Update conversation timestamp
            await supabase
                .from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', conversationId);

            setMessage('');
            toast.success('Message sent successfully! Check your messages tab for responses.');

            // Close the dialog after sending
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-medium text-gray-900">Message the Seller</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mb-5">
                        {tripName && (
                            <div className="mb-3 p-3 bg-[#00C48C]/10 rounded-lg">
                                <div className="flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-[#00C48C] mr-2"></div>
                                    <p className="text-sm font-medium text-[#00C48C]">
                                        Trip: {tripName}
                                    </p>
                                </div>
                            </div>
                        )}

                        <p className="text-gray-700 mb-2">
                            Send a message directly to the seller about this itinerary.
                            You'll receive a reply in your Messages tab.
                        </p>
                        <textarea
                            rows={5}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                            placeholder="Hi! I'm interested in this itinerary and have a question..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSendMessage}
                            disabled={isSubmitting || !message.trim()}
                            className="px-5 py-2.5 bg-[#00C48C] text-white font-medium rounded-lg hover:bg-[#00B380] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                </span>
                            ) : (
                                'Send Message'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DirectMessage; 