import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../hooks/useUser';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

interface Conversation {
    id: string;
    buyer_id: string;
    seller_id: string;
    updated_at: string;
    itinerary_id?: string;
    otherUser: {
        id: string;
        username?: string;
        email?: string;
    };
    tripName?: string;
    lastMessage?: Message;
}

// Interface for grouped conversations
interface GroupedConversations {
    [tripName: string]: Conversation[];
}

const MessageInbox: React.FC = () => {
    const { user } = useUser();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [groupedConversations, setGroupedConversations] = useState<GroupedConversations>({});
    const [activeConversation, setActiveConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [roleFilter, setRoleFilter] = useState<'all' | 'seller' | 'buyer'>('all');

    // Helper function to get user display name with fallbacks
    const getUserDisplayName = (userId: string, userData: any) => {
        if (!userData) return `User ${userId.substring(0, 4)}`;
        return userData.username ||
            userData.full_name ||
            (userData.email ? userData.email.split('@')[0] : `User ${userId.substring(0, 4)}`);
    };

    // Fetch conversations
    useEffect(() => {
        if (!user) return;

        const fetchConversations = async () => {
            setLoading(true);
            try {
                // Add error logging for debugging
                console.log("Fetching conversations for user:", user.id);

                const { data: conversationsData, error } = await supabase
                    .from('conversations')
                    .select('*, messages(*)')
                    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
                    .order('updated_at', { ascending: false });

                if (error) {
                    console.error("Error fetching conversations:", error);
                    throw error;
                }

                console.log("Fetched conversations:", conversationsData);

                if (!conversationsData || conversationsData.length === 0) {
                    // No conversations found
                    setConversations([]);
                    setGroupedConversations({});
                    setLoading(false);
                    return;
                }

                // Get all unique user IDs from conversations
                const userIds = new Set<string>();
                conversationsData.forEach((conv) => {
                    if (conv.buyer_id !== user.id) userIds.add(conv.buyer_id);
                    if (conv.seller_id !== user.id) userIds.add(conv.seller_id);
                });

                console.log("User IDs to fetch:", Array.from(userIds));

                if (userIds.size === 0) {
                    // Handle case where there are no other users
                    setConversations([]);
                    setGroupedConversations({});
                    setLoading(false);
                    return;
                }

                // Fetch user data from profiles table
                const { data: userData, error: userError } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .in('user_id', Array.from(userIds));

                if (userError) {
                    console.error('Error fetching user data:', userError);
                    throw userError;
                }

                console.log("Fetched user profiles:", userData);

                // Also fetch profile data for additional details
                const { data: profileData, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('user_id, username, full_name')
                    .in('user_id', Array.from(userIds));

                if (profileError) {
                    console.error('Error fetching profile data:', profileError);
                }

                // No need to combine data since we're using profiles directly
                const enhancedConversations = await Promise.all((conversationsData || []).map(async (conv) => {
                    // Determine if the user is buyer or seller
                    const isUserBuyer = conv.buyer_id === user.id;
                    const otherUserId = isUserBuyer ? conv.seller_id : conv.buyer_id;

                    // Find the other user's data
                    const otherUserData = userData.find((u) => u.user_id === otherUserId);

                    // For debugging
                    if (!otherUserData) {
                        console.warn(`No user data found for ID: ${otherUserId}`);
                    } else {
                        console.log(`User data for ${otherUserId}:`, otherUserData);
                    }

                    // Get the last message in this conversation
                    const { data: lastMessageData } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('conversation_id', conv.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    // Get itinerary information if itinerary_id exists
                    let tripName = 'Other Conversations';
                    if (conv.itinerary_id) {
                        // Try to get title from 'itineraries' table
                        const { data: itineraryData } = await supabase
                            .from('itineraries')
                            .select('id, title')
                            .eq('id', conv.itinerary_id)
                            .maybeSingle();

                        if (itineraryData?.title) {
                            tripName = itineraryData.title;
                            console.log(`Found trip name: ${tripName} for itinerary ID: ${conv.itinerary_id}`);
                        } else {
                            // Also try premium_itineraries table
                            const { data: premiumData } = await supabase
                                .from('premium_itineraries')
                                .select('id, title')
                                .eq('id', conv.itinerary_id)
                                .maybeSingle();

                            if (premiumData?.title) {
                                tripName = premiumData.title;
                                console.log(`Found premium trip name: ${tripName} for itinerary ID: ${conv.itinerary_id}`);
                            }
                        }
                    }

                    return {
                        ...conv,
                        otherUser: {
                            id: otherUserId,
                            username: getUserDisplayName(otherUserId, otherUserData),
                            email: otherUserData?.email || '',
                            firstName: otherUserData?.first_name || '',
                            lastName: otherUserData?.last_name || ''
                        },
                        tripName,
                        lastMessage: lastMessageData
                    };
                }));

                setConversations(enhancedConversations);

                // Group conversations by trip name
                const grouped: GroupedConversations = {};
                enhancedConversations.forEach(conv => {
                    // Apply role filter
                    if (
                        (roleFilter === 'all') ||
                        (roleFilter === 'seller' && conv.seller_id === user.id) ||
                        (roleFilter === 'buyer' && conv.buyer_id === user.id)
                    ) {
                        const tripName = conv.tripName || 'Other Conversations';
                        if (!grouped[tripName]) {
                            grouped[tripName] = [];
                        }
                        grouped[tripName].push(conv);
                    }
                });

                // Sort each group by username
                Object.keys(grouped).forEach(tripName => {
                    grouped[tripName].sort((a, b) => {
                        const usernameA = a.otherUser.username || '';
                        const usernameB = b.otherUser.username || '';
                        return usernameA.localeCompare(usernameB);
                    });
                });

                setGroupedConversations(grouped);

                // Set active conversation to the first one if none is selected
                if (enhancedConversations.length > 0 && !activeConversation) {
                    setActiveConversation(enhancedConversations[0].id);
                    fetchMessages(enhancedConversations[0].id);
                }
            } catch (error) {
                console.error('Error fetching conversations:', error);
                toast.error('Failed to load conversations');
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();

        // Set up real-time subscription for new messages
        const subscription = supabase
            .channel('public:messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `recipient_id=eq.${user.id}`
            }, (payload) => {
                const newMessage = payload.new as Message;
                // Update messages if the new message belongs to active conversation
                if (newMessage.conversation_id === activeConversation) {
                    setMessages(prev => [...prev, newMessage]);
                }
                // Refetch conversations to update the last message preview
                fetchConversations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user, activeConversation, roleFilter]);

    // Fetch messages for a conversation
    const fetchMessages = async (conversationId: string) => {
        try {
            setLoading(true);

            // Mark all unread messages as read
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('conversation_id', conversationId)
                .eq('recipient_id', user?.id)
                .eq('is_read', false);

            // Get messages
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    // Handle conversation selection
    const handleSelectConversation = (conversationId: string) => {
        setActiveConversation(conversationId);
        fetchMessages(conversationId);
    };

    // Send a new message
    const handleSendMessage = async () => {
        if (!user || !activeConversation || !newMessage.trim()) return;

        try {
            setSendingMessage(true);

            // Get the recipient ID (the other user in the conversation)
            const conversation = conversations.find(c => c.id === activeConversation);
            if (!conversation) return;

            const recipientId = conversation.otherUser.id;

            // Send the message
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: activeConversation,
                    sender_id: user.id,
                    recipient_id: recipientId,
                    content: newMessage.trim(),
                    is_read: false
                })
                .select();

            if (error) throw error;

            // Update the conversation's updated_at timestamp
            await supabase
                .from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', activeConversation);

            // Add new message to the messages list
            setMessages(prev => [...prev, data[0]]);

            // Clear the input
            setNewMessage('');

            // Refetch conversations to update the last message preview
            const { data: updatedConversations } = await supabase
                .from('conversations')
                .select('*')
                .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
                .order('updated_at', { ascending: false });

            if (updatedConversations) {
                // Process the updated conversations with the same enhancement logic
                const enhancedConversations = await Promise.all((updatedConversations || []).map(async (conv) => {
                    // Determine if the user is buyer or seller
                    const isUserBuyer = conv.buyer_id === user.id;
                    const otherUserId = isUserBuyer ? conv.seller_id : conv.buyer_id;

                    // Get user data from profiles to get user metadata
                    const { data: userData } = await supabase
                        .from('user_profiles')
                        .select('*')
                        .eq('user_id', otherUserId)
                        .maybeSingle();

                    // Get the last message in this conversation
                    const { data: lastMessageData } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('conversation_id', conv.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    // Get itinerary information if itinerary_id exists
                    let tripName = 'Other Conversations';
                    if (conv.itinerary_id) {
                        // Try to get title from 'itineraries' table
                        const { data: itineraryData } = await supabase
                            .from('itineraries')
                            .select('id, title')
                            .eq('id', conv.itinerary_id)
                            .maybeSingle();

                        if (itineraryData?.title) {
                            tripName = itineraryData.title;
                        } else {
                            // Also try premium_itineraries table
                            const { data: premiumData } = await supabase
                                .from('premium_itineraries')
                                .select('id, title')
                                .eq('id', conv.itinerary_id)
                                .maybeSingle();

                            if (premiumData?.title) {
                                tripName = premiumData.title;
                            }
                        }
                    }

                    return {
                        ...conv,
                        otherUser: {
                            id: otherUserId,
                            username: getUserDisplayName(otherUserId, userData),
                            email: userData?.email || '',
                            firstName: userData?.first_name || '',
                            lastName: userData?.last_name || ''
                        },
                        tripName,
                        lastMessage: lastMessageData
                    };
                }));

                setConversations(enhancedConversations);

                // Group conversations by trip name
                const grouped: GroupedConversations = {};
                enhancedConversations.forEach(conv => {
                    // Apply role filter
                    if (
                        (roleFilter === 'all') ||
                        (roleFilter === 'seller' && conv.seller_id === user.id) ||
                        (roleFilter === 'buyer' && conv.buyer_id === user.id)
                    ) {
                        const tripName = conv.tripName || 'Other Conversations';
                        if (!grouped[tripName]) {
                            grouped[tripName] = [];
                        }
                        grouped[tripName].push(conv);
                    }
                });

                // Sort each group by username
                Object.keys(grouped).forEach(tripName => {
                    grouped[tripName].sort((a, b) => {
                        const usernameA = a.otherUser.username || '';
                        const usernameB = b.otherUser.username || '';
                        return usernameA.localeCompare(usernameB);
                    });
                });

                setGroupedConversations(grouped);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setSendingMessage(false);
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64">
                <p>Please sign in to view your messages</p>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-200px)] border border-gray-200 rounded-lg overflow-hidden">
            {/* Conversations list */}
            <div className="w-1/3 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                <div className="py-4 px-3 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Conversations</h2>
                </div>

                {/* Role filter */}
                <div className="flex px-3 py-2 border-b border-gray-200">
                    <button
                        onClick={() => setRoleFilter('all')}
                        className={`px-3 py-1 text-sm rounded-md ${roleFilter === 'all'
                            ? 'bg-[#00C48C] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setRoleFilter('seller')}
                        className={`ml-2 px-3 py-1 text-sm rounded-md ${roleFilter === 'seller'
                            ? 'bg-[#00C48C] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        As Seller
                    </button>
                    <button
                        onClick={() => setRoleFilter('buyer')}
                        className={`ml-2 px-3 py-1 text-sm rounded-md ${roleFilter === 'buyer'
                            ? 'bg-[#00C48C] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        As Buyer
                    </button>
                </div>

                {/* Conversation list grouped by trip */}
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <p>Loading conversations...</p>
                    </div>
                ) : Object.keys(groupedConversations).length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                        <p>No conversations found</p>
                    </div>
                ) : (
                    Object.keys(groupedConversations).map((tripName) => (
                        <div key={tripName} className="mt-2">
                            <div className="px-3 py-2 bg-[#e7f8f3] border-l-4 border-[#00C48C]">
                                <h3 className="text-sm font-medium text-gray-800">{tripName}</h3>
                            </div>
                            {groupedConversations[tripName].map((conversation) => {
                                // Calculate unread count
                                const unreadCount = conversation.lastMessage &&
                                    conversation.lastMessage.recipient_id === user?.id &&
                                    !conversation.lastMessage.is_read ? 1 : 0;

                                return (
                                    <div
                                        key={conversation.id}
                                        onClick={() => handleSelectConversation(conversation.id)}
                                        className={`px-3 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-100 ${activeConversation === conversation.id ? 'bg-gray-100' : ''}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-gray-800">{conversation.otherUser.username}</span>
                                            {unreadCount > 0 && (
                                                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        {conversation.lastMessage && (
                                            <div className="text-sm text-gray-500 truncate max-w-full mb-1">
                                                {conversation.lastMessage.content}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-400">
                                            {conversation.updated_at && format(new Date(conversation.updated_at), 'MMM d, h:mm a')}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>

            {/* Messages area */}
            <div className="flex-1 flex flex-col bg-white">
                {activeConversation ? (
                    <>
                        <div className="py-4 px-6 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-medium text-gray-900">
                                        {conversations.find(c => c.id === activeConversation)?.otherUser.username || 'Conversation'}
                                    </h2>
                                    {conversations.find(c => c.id === activeConversation)?.tripName &&
                                        conversations.find(c => c.id === activeConversation)?.tripName !== 'Other Conversations' && (
                                            <div className="flex items-center mt-1">
                                                <svg className="w-4 h-4 text-[#00C48C] mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                                                </svg>
                                                <p className="text-sm text-[#00C48C] font-medium">
                                                    {conversations.find(c => c.id === activeConversation)?.tripName}
                                                </p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`mb-4 max-w-[70%] ${message.sender_id === user?.id ? 'ml-auto' : 'mr-auto'}`}
                                    >
                                        <div
                                            className={`p-3 rounded-lg ${message.sender_id === user?.id
                                                ? 'bg-[#00C48C] text-white rounded-tr-none'
                                                : 'bg-gray-200 text-gray-800 rounded-tl-none'
                                                }`}
                                        >
                                            {message.content}
                                        </div>
                                        <div
                                            className={`text-xs text-gray-500 mt-1 ${message.sender_id === user?.id ? 'text-right' : ''}`}
                                        >
                                            {format(new Date(message.created_at), 'MMM d, h:mm a')}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Message input */}
                        <div className="border-t border-gray-200 p-4 flex-shrink-0">
                            <div className="flex">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#00C48C]"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={sendingMessage || !newMessage.trim()}
                                    className="px-4 py-2 bg-[#00C48C] text-white rounded-r-md hover:bg-[#00b380] focus:outline-none focus:ring-2 focus:ring-[#00C48C] disabled:bg-gray-400"
                                >
                                    {sendingMessage ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Select a conversation to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageInbox;