import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, ShoppingBag } from 'lucide-react';
import { useUser } from '../hooks/useUser';

const TopNavigation = () => {
    const [showAddMenu, setShowAddMenu] = useState(false);
    const location = useLocation();
    const { user } = useUser();

    // Add click handler for closing menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.add-menu') && !target.closest('.add-button')) {
                setShowAddMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="bg-white border-b-2 border-gray-300 fixed top-0 left-0 right-0 z-50">
            <div className="w-full mx-auto">
                <div className="flex items-center h-[60px] px-6">
                    <Link to="/" className="flex-shrink-0">
                        <img src="/images/stippl-logo.svg" alt="Stippl" className="h-8" />
                    </Link>

                    <div className="flex-1 flex justify-center gap-8">
                        {location.pathname !== '/dashboard' && (
                            <Link to="/dashboard" className="text-gray-500 font-['Inter_var'] font-[600]">
                                <span>Dashboard</span>
                            </Link>
                        )}
                        {location.pathname !== '/discover' && (
                            <Link to="/discover" className="text-gray-500 font-['Inter_var'] font-[600]">
                                <span>Discover</span>
                            </Link>
                        )}
                        {user && (
                            <Link
                                to="/dashboard/purchased-itineraries"
                                className="text-gray-500 font-['Inter_var'] font-[600] flex items-center gap-2"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                <span>My Purchases</span>
                            </Link>
                        )}
                    </div>

                    <div className="flex-shrink-0 relative">
                        <button
                            onClick={() => setShowAddMenu(!showAddMenu)}
                            className="add-button bg-[#00C48C] text-white px-4 py-1.5 rounded-lg flex items-center gap-2 hover:bg-[#00B380] transition-colors shadow-sm font-['Inter_var'] font-[600]"
                        >
                            <span>Add</span>
                            <Plus className="w-5 h-5" />
                        </button>

                        {/* Add Menu Popup */}
                        {showAddMenu && (
                            <div className="add-menu absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                <Link
                                    to="/create-itinerary"
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm font-['Inter_var'] font-[600]"
                                    onClick={() => setShowAddMenu(false)}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center text-[#00C48C]">
                                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 5V19M5 12H19" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <span>Create trip</span>
                                </Link>

                                <Link
                                    to="/create-ai-itinerary"
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm font-['Inter_var'] font-[600]"
                                    onClick={() => setShowAddMenu(false)}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center text-[#00C48C]">
                                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                                        </svg>
                                    </div>
                                    <span>Create AI Itinerary</span>
                                </Link>

                                <Link
                                    to="/add-article"
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm font-['Inter_var'] font-[600]"
                                    onClick={() => setShowAddMenu(false)}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center text-[#00C48C]">
                                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14 2Z" />
                                        </svg>
                                    </div>
                                    <span>Add article</span>
                                </Link>

                                <Link
                                    to="/add-place"
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm font-['Inter_var'] font-[600]"
                                    onClick={() => setShowAddMenu(false)}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center text-[#00C48C]">
                                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                        </svg>
                                    </div>
                                    <span>Add place to sleep</span>
                                </Link>

                                <Link
                                    to="/add-todo"
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm font-['Inter_var'] font-[600]"
                                    onClick={() => setShowAddMenu(false)}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center text-[#00C48C]">
                                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 11l3 3l8-8M20 12v7c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1V5c0-.6.4-1 1-1h11" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <span>Add to do</span>
                                </Link>

                                <Link
                                    to="/add-food"
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm font-['Inter_var'] font-[600]"
                                    onClick={() => setShowAddMenu(false)}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center text-[#00C48C]">
                                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" stroke="none">
                                            <path d="M8.1 13.34L3.91 9.16C2.35 7.59 2.35 5.06 3.91 3.5L10.93 10.5L8.1 13.34ZM13.41 13L20.29 19.88L18.88 21.29L12 14.41L5.12 21.29L3.71 19.88L13.36 10.22L13.41 10.27L13.46 10.22L19.76 3.93C21.34 5.5 21.34 8.03 19.78 9.6L13.41 13Z" />
                                        </svg>
                                    </div>
                                    <span>Add eat & drink</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default TopNavigation; 