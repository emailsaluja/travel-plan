import React from 'react';
import MessageInbox from '../components/MessageInbox';
import { useUser } from '../hooks/useUser';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { MessageSquare, Globe, Heart, MapPin, ShoppingBag, Star, Settings, LogOut, Share2 } from 'lucide-react';
import { cleanDestination } from '../utils/stringUtils';

const Messages: React.FC = () => {
    const { user, loading } = useUser();
    const navigate = useNavigate();

    // Redirect if not logged in
    if (!loading && !user) {
        return <Navigate to="/signin" />;
    }

    const handleSignOut = async () => {
        try {
            // Use your actual sign out logic here
            navigate('/signin');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="flex">
            {/* Left Side Navigation */}
            <div className="w-[320px] border-r border-gray-200 fixed left-0 top-0 bottom-0 flex flex-col overflow-hidden">
                <div className="pt-6 px-7 flex items-center">
                    <Link to="/" className="font-semibold text-2xl text-[#1e293b]">
                        <span className="flex items-center gap-2">
                            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M25.5 13C25.5 19.9036 19.9036 25.5 13 25.5C6.09644 25.5 0.5 19.9036 0.5 13C0.5 6.09644 6.09644 0.5 13 0.5C19.9036 0.5 25.5 6.09644 25.5 13Z" stroke="#00C48C" strokeWidth="1" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M15.026 9.635C16.076 8.936 17.359 8.76 18.539 9.155C19.72 9.55 20.682 10.476 21.122 11.64L19.27 12.347C19.023 11.683 18.483 11.171 17.812 10.952C17.14 10.732 16.409 10.829 15.808 11.218C15.207 11.608 14.796 12.252 14.687 12.977C14.577 13.702 14.78 14.437 15.24 15.002C15.699 15.566 16.376 15.908 17.098 15.94C17.821 15.972 18.528 15.691 19.041 15.168L20.417 16.557C19.583 17.386 18.459 17.86 17.273 17.878C16.086 17.896 14.947 17.456 14.087 16.651C13.228 15.846 12.718 14.736 12.673 13.55C12.629 12.365 13.051 11.22 13.849 10.356C14.163 10.025 14.527 9.744 14.926 9.525L14.15 8.748L14.151 8.747L13.006 7.602C12.941 7.538 12.864 7.488 12.78 7.455C12.696 7.423 12.606 7.409 12.516 7.415C12.426 7.42 12.338 7.446 12.258 7.489C12.179 7.533 12.11 7.592 12.055 7.665L5.554 16.335C5.498 16.409 5.459 16.494 5.439 16.584C5.419 16.674 5.419 16.767 5.439 16.857C5.459 16.947 5.498 17.032 5.554 17.105C5.609 17.179 5.68 17.24 5.761 17.284L12.261 20.784C12.343 20.829 12.433 20.854 12.526 20.858C12.619 20.862 12.711 20.845 12.797 20.808C12.883 20.771 12.959 20.715 13.021 20.645C13.082 20.574 13.126 20.49 13.15 20.4L14.25 16.5L15.75 17.1L14.65 21C14.552 21.374 14.348 21.713 14.063 21.981C13.778 22.25 13.423 22.437 13.038 22.522C12.654 22.606 12.253 22.585 11.881 22.46C11.509 22.335 11.18 22.111 10.93 21.815L4.43 18.315C4.175 18.024 3.991 17.682 3.893 17.312C3.795 16.942 3.784 16.555 3.862 16.18C3.94 15.805 4.104 15.452 4.342 15.147C4.58 14.842 4.885 14.594 5.235 14.423L11.736 5.753C12.002 5.422 12.331 5.149 12.704 4.949C13.077 4.75 13.485 4.628 13.905 4.592C14.326 4.556 14.749 4.607 15.147 4.741C15.546 4.875 15.911 5.089 16.22 5.372L17.22 6.372L18.78 7.932L15.026 9.635Z" fill="#00C48C" />
                            </svg>
                            <span>Stippl</span>
                        </span>
                    </Link>
                </div>

                <div className="flex flex-col h-full overflow-y-auto pt-8">
                    {/* User Profile */}
                    <div className="px-7 mb-8">
                        <div className="mb-2">
                            <div className="w-[92px] h-[92px] bg-blue-400 rounded-md overflow-hidden">
                                <img
                                    src={user?.user_metadata?.avatar_url || "/images/profile-icon.svg"}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        <h2 className="text-[17px] text-[#333] font-medium mb-1">
                            {user?.user_metadata?.full_name || "User"}
                        </h2>
                        <p className="text-[14px] text-gray-500 mb-1">
                            localhost:3000/{cleanDestination(user?.user_metadata?.username?.replace('@', '') || "user")}
                        </p>
                        <p className="text-[14px] text-gray-500">
                            {user?.user_metadata?.bio || "I am a world traveller"}
                        </p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1">
                        <div className="px-4">
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-4 px-3 py-2.5 text-gray-500 hover:text-gray-700 rounded-lg"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                                    <rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                                    <rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                                    <rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                <span className="font-medium">Overview</span>
                            </Link>

                            <div className="flex items-center gap-4 px-3 py-2.5 bg-[#e7f8f3] text-[#00C48C] rounded-lg mt-1">
                                <MessageSquare className="w-5 h-5" />
                                <span className="font-medium">Messages</span>
                            </div>

                            <Link
                                to="/trips"
                                className="flex items-center gap-4 px-3 py-2.5 text-gray-500 hover:text-gray-700 rounded-lg mt-1"
                            >
                                <Globe className="w-5 h-5" />
                                <span className="font-medium">Trips</span>
                            </Link>

                            <Link
                                to="/purchases"
                                className="flex items-center gap-4 px-3 py-2.5 text-gray-500 hover:text-gray-700 rounded-lg mt-1"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                <span className="font-medium">Purchases</span>
                            </Link>

                            <Link
                                to="/ai-itineraries"
                                className="flex items-center gap-4 px-3 py-2.5 text-gray-500 hover:text-gray-700 rounded-lg mt-1"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span className="font-medium">AI Itineraries</span>
                            </Link>

                            <Link
                                to="/premium-itineraries"
                                className="flex items-center gap-4 px-3 py-2.5 text-gray-500 hover:text-gray-700 rounded-lg mt-1"
                            >
                                <Star className="w-5 h-5" />
                                <span className="font-medium">Premium Itineraries</span>
                            </Link>

                            <Link
                                to="/liked-trips"
                                className="flex items-center gap-4 px-3 py-2.5 text-gray-500 hover:text-gray-700 rounded-lg mt-1"
                            >
                                <Heart className="w-5 h-5" />
                                <span className="font-medium">Liked Trips</span>
                            </Link>

                            <Link
                                to="/countries"
                                className="flex items-center gap-4 px-3 py-2.5 text-gray-500 hover:text-gray-700 rounded-lg mt-1"
                            >
                                <MapPin className="w-5 h-5" />
                                <span className="font-medium">Countries</span>
                            </Link>
                        </div>
                    </nav>

                    {/* Footer */}
                    <div className="px-4 py-6">
                        <Link
                            to="/share-profile"
                            className="flex items-center gap-4 px-3 py-2.5 text-gray-500 hover:text-gray-700 rounded-lg"
                        >
                            <Share2 className="w-5 h-5" />
                            <span className="font-medium">Share profile</span>
                        </Link>

                        <Link
                            to="/settings"
                            className="flex items-center gap-4 px-3 py-2.5 text-gray-500 hover:text-gray-700 rounded-lg mt-1"
                        >
                            <Settings className="w-5 h-5" />
                            <span className="font-medium">Settings</span>
                        </Link>

                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-4 px-3 py-2.5 text-gray-500 hover:text-gray-700 rounded-lg mt-1 w-full text-left"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Sign out</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="ml-[320px] flex-1 min-h-screen">
                <header className="py-3 px-6 border-b border-gray-200 flex items-center justify-between bg-white">
                    <div className="flex items-center space-x-8">
                        <Link to="/dashboard" className="text-gray-500 font-medium px-3 py-2">
                            Dashboard
                        </Link>
                        <Link to="/discover" className="text-gray-500 font-medium px-3 py-2">
                            Discover
                        </Link>
                    </div>
                </header>

                <main className="px-8 py-8">
                    <div className="flex items-center mb-6">
                        <div className="mr-3 p-2 rounded-lg bg-[#00C48C]/10">
                            <MessageSquare className="w-5 h-5 text-[#00C48C]" />
                        </div>
                        <h1 className="text-2xl font-medium text-gray-900">Messages</h1>
                    </div>
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                        <MessageInbox />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Messages; 