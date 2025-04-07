import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const location = useLocation();

    return (
        <div className="container mx-auto px-4 py-8 mt-[80px]">
            <div className="mb-8 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <Link
                        to="/admin"
                        className={`${location.pathname === '/admin'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        Manage Data
                    </Link>
                    <Link
                        to="/admin/country-images"
                        className={`${location.pathname === '/admin/country-images'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        Country Images
                    </Link>
                    <Link
                        to="/admin/discover-sections"
                        className={`${location.pathname === '/admin/discover-sections'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        Discover Sections
                    </Link>
                    <Link
                        to="/admin/user-dashboard"
                        className={`${location.pathname === '/admin/user-dashboard'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        User Dashboard
                    </Link>
                    <Link
                        to="/admin/sales-dashboard"
                        className={`${location.pathname === '/admin/sales-dashboard'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        Sales Dashboard
                    </Link>
                    <Link
                        to="/admin/user-payouts"
                        className={`${location.pathname === '/admin/user-payouts'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        Users Payout
                    </Link>
                </nav>
            </div>
            {children}
        </div>
    );
};

export default AdminLayout; 