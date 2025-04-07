import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, UserPlus, Calendar, Clock, BarChart } from 'lucide-react';
import AdminLayout from './AdminLayout';

interface UserStats {
    total: number;
    last24Hours: number;
    lastWeek: number;
    lastMonth: number;
    monthlyGrowth: {
        month: string;
        count: number;
    }[];
}

interface RecentUser {
    id: string;
    username: string;
    full_name: string;
    created_at: string;
}

export const UserDashboard: React.FC = () => {
    const [userStats, setUserStats] = useState<UserStats>({
        total: 0,
        last24Hours: 0,
        lastWeek: 0,
        lastMonth: 0,
        monthlyGrowth: []
    });
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get total users
            const { data, error: countError } = await supabase
                .from('user_profiles')
                .select('id');

            if (countError) throw countError;

            const total = data?.length || 0;

            // Calculate date thresholds
            const now = new Date();
            const last24Hours = new Date(now);
            last24Hours.setHours(now.getHours() - 24);

            const lastWeek = new Date(now);
            lastWeek.setDate(now.getDate() - 7);

            const lastMonth = new Date(now);
            lastMonth.setMonth(now.getMonth() - 1);

            // Get users in last 24 hours
            const { data: last24HoursData, error: last24HoursError } = await supabase
                .from('user_profiles')
                .select('id')
                .gte('created_at', last24Hours.toISOString());

            if (last24HoursError) throw last24HoursError;
            const last24HoursCount = last24HoursData?.length || 0;

            // Get users in last week
            const { data: lastWeekData, error: lastWeekError } = await supabase
                .from('user_profiles')
                .select('id')
                .gte('created_at', lastWeek.toISOString());

            if (lastWeekError) throw lastWeekError;
            const lastWeekCount = lastWeekData?.length || 0;

            // Get users in last month
            const { data: lastMonthData, error: lastMonthError } = await supabase
                .from('user_profiles')
                .select('id')
                .gte('created_at', lastMonth.toISOString());

            if (lastMonthError) throw lastMonthError;
            const lastMonthCount = lastMonthData?.length || 0;

            // Get monthly growth data for the last 12 months
            const monthlyGrowth = await getMonthlyGrowthData();

            // Get 10 most recent users
            const { data: recentUsersData, error: recentUsersError } = await supabase
                .from('user_profiles')
                .select('id, username, full_name, created_at')
                .order('created_at', { ascending: false })
                .limit(10);

            if (recentUsersError) throw recentUsersError;

            setUserStats({
                total,
                last24Hours: last24HoursCount,
                lastWeek: lastWeekCount,
                lastMonth: lastMonthCount,
                monthlyGrowth
            });

            setRecentUsers(recentUsersData || []);
        } catch (error: any) {
            setError(error.message);
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMonthlyGrowthData = async () => {
        try {
            // Get all users with their created_at dates
            const { data, error } = await supabase
                .from('user_profiles')
                .select('created_at')
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Group users by month
            const monthlyData: { [key: string]: number } = {};
            const last12Months: string[] = [];

            // Generate last 12 months in format "MMM YYYY"
            const now = new Date();
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now);
                d.setMonth(d.getMonth() - i);
                const monthYear = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                last12Months.push(monthYear);
                monthlyData[monthYear] = 0;
            }

            // Count users per month
            (data || []).forEach(user => {
                if (user.created_at) {
                    const date = new Date(user.created_at);
                    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                    // Only count if it's within our 12-month window
                    if (monthlyData[monthYear] !== undefined) {
                        monthlyData[monthYear]++;
                    }
                }
            });

            // Format data for the chart
            return last12Months.map(month => ({
                month,
                count: monthlyData[month]
            }));
        } catch (error) {
            console.error('Error calculating monthly growth data:', error);
            return [];
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get the maximum value for chart scaling
    const maxMonthlyUsers = Math.max(
        ...userStats.monthlyGrowth.map(item => item.count),
        1 // Ensure we have at least 1 as max
    );

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C48C] border-t-transparent"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">User Analytics Dashboard</h2>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
                        <div className="rounded-full bg-blue-100 p-3 mr-4">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Users</p>
                            <p className="text-2xl font-bold text-gray-800">{userStats.total}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
                        <div className="rounded-full bg-green-100 p-3 mr-4">
                            <Clock className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Last 24 Hours</p>
                            <p className="text-2xl font-bold text-gray-800">{userStats.last24Hours}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
                        <div className="rounded-full bg-purple-100 p-3 mr-4">
                            <Calendar className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Last Week</p>
                            <p className="text-2xl font-bold text-gray-800">{userStats.lastWeek}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
                        <div className="rounded-full bg-amber-100 p-3 mr-4">
                            <Calendar className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Last Month</p>
                            <p className="text-2xl font-bold text-gray-800">{userStats.lastMonth}</p>
                        </div>
                    </div>
                </div>

                {/* User Growth Chart */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-800">User Growth (Last 12 Months)</h3>
                    </div>
                    <div className="p-6">
                        <div className="h-64">
                            <div className="flex h-full items-end">
                                {userStats.monthlyGrowth.map((item, index) => (
                                    <div
                                        key={index}
                                        className="w-full h-full flex flex-col justify-end items-center mx-1"
                                    >
                                        <div
                                            className="w-full bg-[#00C48C] rounded-t opacity-80 hover:opacity-100 transition-opacity"
                                            style={{
                                                height: `${(item.count / maxMonthlyUsers) * 100}%`,
                                                minHeight: item.count > 0 ? '8px' : '0'
                                            }}
                                        >
                                            <div className="relative w-full">
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded mb-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {item.count} users
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left h-14 flex items-start">
                                            {item.month}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recently Joined Users */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-800">Recently Joined Users</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Username
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Full Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Joined
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {recentUsers.map(user => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <span className="text-gray-500 font-medium">
                                                        {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        @{user.username || 'unknown'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{user.full_name || 'Not set'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(user.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {recentUsers.length === 0 && (
                        <div className="py-8 text-center text-gray-500">
                            No recent users found
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}; 