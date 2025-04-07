import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, ShoppingBag, Calendar, Clock, BarChart, Map, Users } from 'lucide-react';
import AdminLayout from './AdminLayout';

interface Sale {
    id: string;
    seller_id?: string;
    buyer_id?: string;
    itinerary_id: string;
    amount: number;
    platform_fee_amount: number;
    net_amount: number;
    currency: string;
    status: string;
    payment_intent_id: string;
    created_at: string;
    updated_at: string;
    title?: string;
    country?: string;
    duration?: number;
    featured_image_url?: string;
    buyer_profile?: {
        username?: string;
        full_name?: string;
    };
    seller_profile?: {
        username?: string;
        full_name?: string;
    };
}

interface SalesStats {
    totalRevenue: number;
    totalNetRevenue: number;
    totalFees: number;
    totalSold: number;
    last24Hours: {
        count: number;
        revenue: number;
        netRevenue: number;
    };
    lastWeek: {
        count: number;
        revenue: number;
        netRevenue: number;
    };
    lastMonth: {
        count: number;
        revenue: number;
        netRevenue: number;
    };
    monthlyRevenue: {
        month: string;
        revenue: number;
        netRevenue: number;
    }[];
    topBuyers: {
        userId: string;
        username: string;
        fullName: string;
        purchases: number;
        totalSpent: number;
    }[];
    topSellers: {
        userId: string;
        username: string;
        fullName: string;
        sales: number;
        totalEarned: number;
        netEarned: number;
    }[];
    byCurrency: {
        currency: string;
        count: number;
        revenue: number;
        netRevenue: number;
    }[];
}

// Define a type for the premium itinerary purchase response
interface PremiumItineraryPurchase {
    id: string;
    user_id: string;
    itinerary_id: string;
    purchase_date: string;
    payment_intent_id: string;
    premium_itineraries: {
        id: string;
        user_id: string;
        title: string;
        description: string;
        price: number;
        currency: string;
        duration: number;
        country: string;
        featured_image_url?: string;
    } | null;
}

export const SalesDashboard: React.FC = () => {
    const [salesStats, setSalesStats] = useState<SalesStats>({
        totalRevenue: 0,
        totalNetRevenue: 0,
        totalFees: 0,
        totalSold: 0,
        last24Hours: { count: 0, revenue: 0, netRevenue: 0 },
        lastWeek: { count: 0, revenue: 0, netRevenue: 0 },
        lastMonth: { count: 0, revenue: 0, netRevenue: 0 },
        monthlyRevenue: [],
        topBuyers: [],
        topSellers: [],
        byCurrency: []
    });
    const [recentSales, setRecentSales] = useState<Sale[]>([]);
    const [allSales, setAllSales] = useState<Sale[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSalesData();
    }, []);

    const loadSalesData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all sales with premium itinerary details
            const { data: purchases, error: salesError } = await supabase
                .from('premium_itinerary_purchases')
                .select(`
                    id,
                    user_id,
                    itinerary_id,
                    purchase_date,
                    payment_intent_id,
                    premium_itineraries (
                        id,
                        user_id,
                        title,
                        description,
                        price,
                        currency,
                        duration,
                        country,
                        featured_image_url
                    )
                `)
                .order('purchase_date', { ascending: false });

            if (salesError) throw salesError;

            console.log('Raw purchases data:', purchases);

            // Extract unique user IDs for buyers and sellers
            const buyerIds: string[] = [];
            const sellerIds: string[] = [];

            purchases?.forEach((purchase: any) => {
                if (purchase.user_id) buyerIds.push(purchase.user_id);
                if (purchase.premium_itineraries?.user_id) sellerIds.push(purchase.premium_itineraries.user_id);
            });

            // Combine IDs for a single query to save network requests
            const uniqueUserIds = [...new Set([...sellerIds, ...buyerIds])].filter(Boolean);

            console.log('Unique user IDs:', uniqueUserIds);

            let userProfiles: Record<string, { username?: string; full_name?: string }> = {};

            if (uniqueUserIds.length > 0) {
                // Fetch user profiles
                const { data, error: profilesError } = await supabase
                    .from('user_profiles')
                    .select('user_id, username, full_name')
                    .in('user_id', uniqueUserIds);

                if (profilesError) {
                    console.error('Error fetching user profiles:', profilesError);
                } else {
                    console.log('Fetched profiles:', data);

                    // Create a lookup map of user_id to profile
                    userProfiles = (data || []).reduce((acc, profile) => {
                        acc[profile.user_id] = {
                            username: profile.username,
                            full_name: profile.full_name
                        };
                        return acc;
                    }, {} as Record<string, { username?: string; full_name?: string }>);
                }
            }

            // Transform the data to match our interface
            const transformedSales: Sale[] = [];

            purchases?.forEach((purchase: any) => {
                if (!purchase.premium_itineraries) return;

                const buyerProfile = purchase.user_id ? userProfiles[purchase.user_id] : undefined;
                const sellerId = purchase.premium_itineraries.user_id;
                const sellerProfile = sellerId ? userProfiles[sellerId] : undefined;

                transformedSales.push({
                    id: purchase.id,
                    buyer_id: purchase.user_id,
                    seller_id: sellerId,
                    itinerary_id: purchase.itinerary_id,
                    amount: purchase.premium_itineraries.price || 0,
                    platform_fee_amount: (purchase.premium_itineraries.price || 0) * 0.2, // 20% platform fee
                    net_amount: (purchase.premium_itineraries.price || 0) * 0.8, // 80% to seller
                    currency: purchase.premium_itineraries.currency || 'USD',
                    status: 'completed', // Assuming all purchases are completed
                    payment_intent_id: purchase.payment_intent_id,
                    created_at: purchase.purchase_date,
                    updated_at: purchase.purchase_date,
                    title: purchase.premium_itineraries.title,
                    country: purchase.premium_itineraries.country,
                    duration: purchase.premium_itineraries.duration,
                    featured_image_url: purchase.premium_itineraries.featured_image_url,
                    buyer_profile: buyerProfile || {
                        username: undefined,
                        full_name: 'Unknown Buyer'
                    },
                    seller_profile: sellerProfile || {
                        username: undefined,
                        full_name: 'Unknown Seller'
                    }
                });
            });

            console.log('Transformed sales:', transformedSales);

            // Calculate date thresholds
            const now = new Date();
            const last24Hours = new Date(now);
            last24Hours.setHours(now.getHours() - 24);

            const lastWeek = new Date(now);
            lastWeek.setDate(now.getDate() - 7);

            const lastMonth = new Date(now);
            lastMonth.setMonth(now.getMonth() - 1);

            // Process sales data
            const totalRevenue = transformedSales?.reduce((sum, sale) => sum + (sale.amount || 0), 0) || 0;
            const totalNetRevenue = transformedSales?.reduce((sum, sale) => sum + (sale.net_amount || 0), 0) || 0;
            const totalFees = transformedSales?.reduce((sum, sale) => sum + (sale.platform_fee_amount || 0), 0) || 0;
            const totalSold = transformedSales?.length || 0;

            // Sales in time periods
            const last24HoursSales = transformedSales?.filter(sale =>
                new Date(sale.created_at) >= last24Hours
            ) || [];

            const lastWeekSales = transformedSales?.filter(sale =>
                new Date(sale.created_at) >= lastWeek
            ) || [];

            const lastMonthSales = transformedSales?.filter(sale =>
                new Date(sale.created_at) >= lastMonth
            ) || [];

            // Sales by currency
            const currencySales: { [key: string]: { count: number; revenue: number; netRevenue: number } } = {};

            (transformedSales || []).forEach(sale => {
                if (sale.currency) {
                    if (!currencySales[sale.currency]) {
                        currencySales[sale.currency] = { count: 0, revenue: 0, netRevenue: 0 };
                    }
                    currencySales[sale.currency].count += 1;
                    currencySales[sale.currency].revenue += (sale.amount || 0);
                    currencySales[sale.currency].netRevenue += (sale.net_amount || 0);
                }
            });

            const byCurrency = Object.entries(currencySales).map(([currency, data]) => ({
                currency,
                count: data.count,
                revenue: data.revenue,
                netRevenue: data.netRevenue
            })).sort((a, b) => b.revenue - a.revenue);

            // Monthly revenue
            const monthlyRevenue = await getMonthlyRevenueData(transformedSales || []);

            // Top buyers and sellers
            const buyerStats: { [key: string]: { purchases: number; totalSpent: number; username: string; fullName: string } } = {};
            const sellerStats: { [key: string]: { sales: number; totalEarned: number; netEarned: number; username: string; fullName: string } } = {};

            (transformedSales || []).forEach(sale => {
                // Process buyer stats
                if (sale.buyer_id) {
                    if (!buyerStats[sale.buyer_id]) {
                        buyerStats[sale.buyer_id] = {
                            purchases: 0,
                            totalSpent: 0,
                            username: sale.buyer_profile?.username || '',
                            fullName: sale.buyer_profile?.full_name || 'Unknown'
                        };
                    }
                    buyerStats[sale.buyer_id].purchases += 1;
                    buyerStats[sale.buyer_id].totalSpent += (sale.amount || 0);
                }

                // Process seller stats
                if (sale.seller_id) {
                    if (!sellerStats[sale.seller_id]) {
                        sellerStats[sale.seller_id] = {
                            sales: 0,
                            totalEarned: 0,
                            netEarned: 0,
                            username: sale.seller_profile?.username || '',
                            fullName: sale.seller_profile?.full_name || 'Unknown'
                        };
                    }
                    sellerStats[sale.seller_id].sales += 1;
                    sellerStats[sale.seller_id].totalEarned += (sale.amount || 0);
                    sellerStats[sale.seller_id].netEarned += (sale.net_amount || 0);
                }
            });

            const topBuyers = Object.entries(buyerStats).map(([userId, data]) => ({
                userId,
                username: data.username,
                fullName: data.fullName,
                purchases: data.purchases,
                totalSpent: data.totalSpent
            })).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);

            const topSellers = Object.entries(sellerStats).map(([userId, data]) => ({
                userId,
                username: data.username,
                fullName: data.fullName,
                sales: data.sales,
                totalEarned: data.totalEarned,
                netEarned: data.netEarned
            })).sort((a, b) => b.totalEarned - a.totalEarned).slice(0, 10);

            setSalesStats({
                totalRevenue,
                totalNetRevenue,
                totalFees,
                totalSold,
                last24Hours: {
                    count: last24HoursSales.length,
                    revenue: last24HoursSales.reduce((sum, sale) => sum + (sale.amount || 0), 0),
                    netRevenue: last24HoursSales.reduce((sum, sale) => sum + (sale.net_amount || 0), 0)
                },
                lastWeek: {
                    count: lastWeekSales.length,
                    revenue: lastWeekSales.reduce((sum, sale) => sum + (sale.amount || 0), 0),
                    netRevenue: lastWeekSales.reduce((sum, sale) => sum + (sale.net_amount || 0), 0)
                },
                lastMonth: {
                    count: lastMonthSales.length,
                    revenue: lastMonthSales.reduce((sum, sale) => sum + (sale.amount || 0), 0),
                    netRevenue: lastMonthSales.reduce((sum, sale) => sum + (sale.net_amount || 0), 0)
                },
                monthlyRevenue,
                topBuyers,
                topSellers,
                byCurrency
            });

            setRecentSales(transformedSales.slice(0, 10));
            setAllSales(transformedSales);
        } catch (error: any) {
            setError(error.message);
            console.error('Error loading sales data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMonthlyRevenueData = async (sales: Sale[]) => {
        try {
            // Group sales by month
            const monthlyData: { [key: string]: { revenue: number; netRevenue: number } } = {};
            const last12Months: string[] = [];

            // Generate last 12 months in format "MMM YYYY"
            const now = new Date();
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now);
                d.setMonth(d.getMonth() - i);
                const monthYear = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                last12Months.push(monthYear);
                monthlyData[monthYear] = { revenue: 0, netRevenue: 0 };
            }

            // Sum revenue per month
            sales.forEach(sale => {
                if (sale.created_at) {
                    const date = new Date(sale.created_at);
                    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                    // Only count if it's within our 12-month window
                    if (monthlyData[monthYear] !== undefined) {
                        monthlyData[monthYear].revenue += (sale.amount || 0);
                        monthlyData[monthYear].netRevenue += (sale.net_amount || 0);
                    }
                }
            });

            // Format data for the chart
            return last12Months.map(month => ({
                month,
                revenue: monthlyData[month].revenue,
                netRevenue: monthlyData[month].netRevenue
            }));
        } catch (error) {
            console.error('Error calculating monthly revenue data:', error);
            return [];
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
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
    const maxMonthlyRevenue = Math.max(
        ...salesStats.monthlyRevenue.map(item => item.revenue),
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
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Sales Analytics Dashboard</h2>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                <div className="mb-6 flex justify-between items-center">
                    <div></div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">Filter dashboard by status:</span>
                        <select
                            className="rounded-md border border-gray-300 px-3 py-1 text-sm"
                            value={statusFilter}
                            onChange={(e) => {
                                const newStatusFilter = e.target.value;
                                setStatusFilter(newStatusFilter);

                                // Filter sales based on status
                                const filteredSales = newStatusFilter === 'all'
                                    ? allSales
                                    : allSales.filter(sale => sale.status === newStatusFilter);

                                // Update recent sales table
                                setRecentSales(filteredSales.slice(0, 10));

                                // Recalculate all stats based on filtered data
                                if (newStatusFilter !== 'all') {
                                    // Date thresholds for period calculations
                                    const now = new Date();
                                    const last24Hours = new Date(now);
                                    last24Hours.setHours(now.getHours() - 24);

                                    const lastWeek = new Date(now);
                                    lastWeek.setDate(now.getDate() - 7);

                                    const lastMonth = new Date(now);
                                    lastMonth.setMonth(now.getMonth() - 1);

                                    // Filtered sales by time period
                                    const filteredLast24HoursSales = filteredSales.filter(sale =>
                                        new Date(sale.created_at) >= last24Hours
                                    );

                                    const filteredLastWeekSales = filteredSales.filter(sale =>
                                        new Date(sale.created_at) >= lastWeek
                                    );

                                    const filteredLastMonthSales = filteredSales.filter(sale =>
                                        new Date(sale.created_at) >= lastMonth
                                    );

                                    // Calculate currency stats
                                    const filteredCurrencySales: { [key: string]: { count: number; revenue: number; netRevenue: number } } = {};
                                    filteredSales.forEach(sale => {
                                        if (sale.currency) {
                                            if (!filteredCurrencySales[sale.currency]) {
                                                filteredCurrencySales[sale.currency] = { count: 0, revenue: 0, netRevenue: 0 };
                                            }
                                            filteredCurrencySales[sale.currency].count += 1;
                                            filteredCurrencySales[sale.currency].revenue += (sale.amount || 0);
                                            filteredCurrencySales[sale.currency].netRevenue += (sale.net_amount || 0);
                                        }
                                    });

                                    const filteredByCurrency = Object.entries(filteredCurrencySales).map(([currency, data]) => ({
                                        currency,
                                        count: data.count,
                                        revenue: data.revenue,
                                        netRevenue: data.netRevenue
                                    })).sort((a, b) => b.revenue - a.revenue);

                                    // Calculate buyer and seller stats
                                    const filteredBuyerStats: { [key: string]: { purchases: number; totalSpent: number; username: string; fullName: string } } = {};
                                    const filteredSellerStats: { [key: string]: { sales: number; totalEarned: number; netEarned: number; username: string; fullName: string } } = {};

                                    filteredSales.forEach(sale => {
                                        // Process buyer stats
                                        if (sale.buyer_id) {
                                            if (!filteredBuyerStats[sale.buyer_id]) {
                                                filteredBuyerStats[sale.buyer_id] = {
                                                    purchases: 0,
                                                    totalSpent: 0,
                                                    username: sale.buyer_profile?.username || '',
                                                    fullName: sale.buyer_profile?.full_name || 'Unknown'
                                                };
                                            }
                                            filteredBuyerStats[sale.buyer_id].purchases += 1;
                                            filteredBuyerStats[sale.buyer_id].totalSpent += (sale.amount || 0);
                                        }

                                        // Process seller stats
                                        if (sale.seller_id) {
                                            if (!filteredSellerStats[sale.seller_id]) {
                                                filteredSellerStats[sale.seller_id] = {
                                                    sales: 0,
                                                    totalEarned: 0,
                                                    netEarned: 0,
                                                    username: sale.seller_profile?.username || '',
                                                    fullName: sale.seller_profile?.full_name || 'Unknown'
                                                };
                                            }
                                            filteredSellerStats[sale.seller_id].sales += 1;
                                            filteredSellerStats[sale.seller_id].totalEarned += (sale.amount || 0);
                                            filteredSellerStats[sale.seller_id].netEarned += (sale.net_amount || 0);
                                        }
                                    });

                                    const filteredTopBuyers = Object.entries(filteredBuyerStats).map(([userId, data]) => ({
                                        userId,
                                        username: data.username,
                                        fullName: data.fullName,
                                        purchases: data.purchases,
                                        totalSpent: data.totalSpent
                                    })).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);

                                    const filteredTopSellers = Object.entries(filteredSellerStats).map(([userId, data]) => ({
                                        userId,
                                        username: data.username,
                                        fullName: data.fullName,
                                        sales: data.sales,
                                        totalEarned: data.totalEarned,
                                        netEarned: data.netEarned
                                    })).sort((a, b) => b.totalEarned - a.totalEarned).slice(0, 10);

                                    // Update stats with filtered data
                                    setSalesStats({
                                        totalRevenue: filteredSales.reduce((sum, sale) => sum + (sale.amount || 0), 0),
                                        totalNetRevenue: filteredSales.reduce((sum, sale) => sum + (sale.net_amount || 0), 0),
                                        totalFees: filteredSales.reduce((sum, sale) => sum + (sale.platform_fee_amount || 0), 0),
                                        totalSold: filteredSales.length,
                                        last24Hours: {
                                            count: filteredLast24HoursSales.length,
                                            revenue: filteredLast24HoursSales.reduce((sum, sale) => sum + (sale.amount || 0), 0),
                                            netRevenue: filteredLast24HoursSales.reduce((sum, sale) => sum + (sale.net_amount || 0), 0)
                                        },
                                        lastWeek: {
                                            count: filteredLastWeekSales.length,
                                            revenue: filteredLastWeekSales.reduce((sum, sale) => sum + (sale.amount || 0), 0),
                                            netRevenue: filteredLastWeekSales.reduce((sum, sale) => sum + (sale.net_amount || 0), 0)
                                        },
                                        lastMonth: {
                                            count: filteredLastMonthSales.length,
                                            revenue: filteredLastMonthSales.reduce((sum, sale) => sum + (sale.amount || 0), 0),
                                            netRevenue: filteredLastMonthSales.reduce((sum, sale) => sum + (sale.net_amount || 0), 0)
                                        },
                                        monthlyRevenue: [], // Would need to recalculate monthly revenue data here
                                        topBuyers: filteredTopBuyers,
                                        topSellers: filteredTopSellers,
                                        byCurrency: filteredByCurrency
                                    });
                                } else {
                                    // Reset to original statistics based on all sales
                                    loadSalesData();
                                }
                            }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="completed">Completed Only</option>
                            <option value="pending">Pending Only</option>
                            <option value="failed">Failed Only</option>
                            <option value="refunded">Refunded Only</option>
                        </select>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
                        <div className="rounded-full bg-blue-100 p-3 mr-4">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">
                                Total Revenue {statusFilter !== 'all' && `(${statusFilter})`}
                            </p>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(salesStats.totalRevenue)}</p>
                            {statusFilter === 'all' && (
                                <p className="text-xs text-gray-500">
                                    {allSales.filter(sale => sale.status === 'completed').length} completed,
                                    {' '}{allSales.filter(sale => sale.status === 'pending').length} pending
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
                        <div className="rounded-full bg-green-100 p-3 mr-4">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">
                                Net Revenue {statusFilter !== 'all' && `(${statusFilter})`}
                            </p>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(salesStats.totalNetRevenue)}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
                        <div className="rounded-full bg-green-100 p-3 mr-4">
                            <ShoppingBag className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">
                                Total Itineraries Sold {statusFilter !== 'all' && `(${statusFilter})`}
                            </p>
                            <p className="text-2xl font-bold text-gray-800">{salesStats.totalSold}</p>
                            {statusFilter === 'all' && (
                                <p className="text-xs text-gray-500">
                                    All transactions: {allSales.length}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
                        <div className="rounded-full bg-purple-100 p-3 mr-4">
                            <DollarSign className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Platform Fees</p>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(salesStats.totalFees)}</p>
                        </div>
                    </div>
                </div>

                {/* Recent Period Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Last 24 Hours</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-800">
                                    {salesStats.last24Hours.count}
                                </p>
                                <p className="text-sm text-gray-500">Sales</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[#00C48C]">
                                    {formatCurrency(salesStats.last24Hours.revenue)}
                                </p>
                                <p className="text-sm text-gray-500">Revenue</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Last Week</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-800">
                                    {salesStats.lastWeek.count}
                                </p>
                                <p className="text-sm text-gray-500">Sales</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[#00C48C]">
                                    {formatCurrency(salesStats.lastWeek.revenue)}
                                </p>
                                <p className="text-sm text-gray-500">Revenue</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Last Month</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-800">
                                    {salesStats.lastMonth.count}
                                </p>
                                <p className="text-sm text-gray-500">Sales</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[#00C48C]">
                                    {formatCurrency(salesStats.lastMonth.revenue)}
                                </p>
                                <p className="text-sm text-gray-500">Revenue</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Monthly Revenue Chart */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-800">Monthly Revenue (Last 12 Months)</h3>
                    </div>
                    <div className="p-6">
                        <div className="h-64">
                            <div className="flex h-full items-end">
                                {salesStats.monthlyRevenue.map((item, index) => (
                                    <div
                                        key={index}
                                        className="w-full h-full flex flex-col justify-end items-center mx-1 group"
                                    >
                                        <div
                                            className="w-full bg-[#00C48C] rounded-t opacity-80 hover:opacity-100 transition-opacity"
                                            style={{
                                                height: `${(item.revenue / maxMonthlyRevenue) * 100}%`,
                                                minHeight: item.revenue > 0 ? '8px' : '0'
                                            }}
                                        >
                                            <div className="relative w-full">
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded mb-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {formatCurrency(item.revenue)}
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

                {/* Currency-wise Sales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-800">Sales by Currency</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Currency
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sales
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Revenue
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Net Revenue
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {salesStats.byCurrency.map(currency => (
                                        <tr key={currency.currency}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {currency.currency}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {currency.count}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {formatCurrency(currency.revenue)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {formatCurrency(currency.netRevenue)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {salesStats.byCurrency.length === 0 && (
                            <div className="py-8 text-center text-gray-500">
                                No currency data available
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-800">Top Buyers</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Purchases
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Spent
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {salesStats.topBuyers.map(buyer => (
                                        <tr key={buyer.userId}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <span className="text-gray-500 font-medium">
                                                            {buyer.username ? buyer.username.charAt(0).toUpperCase() : '?'}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {buyer.username ? `@${buyer.username}` : 'Unknown'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {buyer.fullName || 'Not set'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {buyer.purchases}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {formatCurrency(buyer.totalSpent)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {salesStats.topBuyers.length === 0 && (
                            <div className="py-8 text-center text-gray-500">
                                No buyer data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Sellers Section */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-800">Top Sellers</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Seller
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sales
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Gross Revenue
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Net Revenue
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {salesStats.topSellers.map(seller => (
                                    <tr key={seller.userId}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <span className="text-gray-500 font-medium">
                                                        {seller.username ? seller.username.charAt(0).toUpperCase() : '?'}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {seller.username ? `@${seller.username}` : 'Unknown'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {seller.fullName || 'Not set'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {seller.sales}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {formatCurrency(seller.totalEarned)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {formatCurrency(seller.netEarned)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {salesStats.topSellers.length === 0 && (
                        <div className="py-8 text-center text-gray-500">
                            No seller data available
                        </div>
                    )}
                </div>

                {/* Recent Sales */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-800">Recent Sales</h3>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">Status view:</span>
                            <div className="relative">
                                <select
                                    className="rounded-md border border-gray-300 px-3 py-1 text-sm"
                                    onChange={(e) => {
                                        if (e.target.value === 'all') {
                                            setRecentSales(statusFilter === 'all'
                                                ? allSales.slice(0, 10)
                                                : allSales.filter(sale => sale.status === statusFilter).slice(0, 10));
                                        } else {
                                            setRecentSales(allSales
                                                .filter((sale: Sale) => sale.status === e.target.value)
                                                .slice(0, 10));
                                        }
                                    }}
                                >
                                    <option value="all">All</option>
                                    <option value="completed">Completed</option>
                                    <option value="pending">Pending</option>
                                    <option value="failed">Failed</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Buyer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Seller
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Currency
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {recentSales.map(sale => (
                                    <tr key={sale.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {sale.featured_image_url ? (
                                                    <div className="flex-shrink-0 h-10 w-10 mr-4">
                                                        <img className="h-10 w-10 rounded-md object-cover" src={sale.featured_image_url} alt="" />
                                                    </div>
                                                ) : (
                                                    <div className="flex-shrink-0 h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center mr-4">
                                                        <ShoppingBag className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="ml-0">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {sale.title || 'Untitled Itinerary'}
                                                    </div>
                                                    {sale.country && (
                                                        <div className="text-sm text-gray-500">
                                                            {sale.country}, {sale.duration} days
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(sale.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="ml-0">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {sale.buyer_profile?.username ? `@${sale.buyer_profile.username}` : 'Unknown'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="ml-0">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {sale.seller_profile?.username ? `@${sale.seller_profile.username}` : 'Unknown'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                                {sale.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {sale.currency}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                            {formatCurrency(sale.amount || 0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {recentSales.length === 0 && (
                        <div className="py-8 text-center text-gray-500">
                            No recent sales found
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}; 