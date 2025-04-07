import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Check, Clock, DollarSign, Download, Filter, Search, X } from 'lucide-react';
import AdminLayout from './AdminLayout';

interface SellerEarnings {
    seller_id: string;
    username: string;
    full_name: string;
    total_earned: number;
    total_paid: number;
    pending_amount: number;
    sales_count: number;
    currency: string;
    last_payout_date: string | null;
}

interface PayoutRecord {
    id: string;
    seller_id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    created_at: string;
    payment_method: string;
    reference: string;
    notes: string;
}

interface PremiumItinerary {
    id: string;
    user_id: string;
    price: number;
    currency: string;
}

interface Purchase {
    id: string;
    user_id: string;
    purchase_date: string;
    premium_itineraries: PremiumItinerary;
}

export const UserPayouts: React.FC = () => {
    const [sellers, setSellers] = useState<SellerEarnings[]>([]);
    const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
    const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [payoutModalOpen, setPayoutModalOpen] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadSellerEarnings();
        loadRecentPayouts();
    }, []);

    const loadSellerEarnings = async () => {
        try {
            setLoading(true);

            // Get all premium_itinerary_purchases with seller info
            const { data: purchases, error: purchasesError } = await supabase
                .from('premium_itinerary_purchases')
                .select(`
                    id,
                    user_id,
                    purchase_date,
                    premium_itineraries (
                        id,
                        user_id,
                        price,
                        currency
                    )
                `);

            if (purchasesError) throw purchasesError;

            // Get all payouts
            const { data: payoutData, error: payoutError } = await supabase
                .from('seller_payouts')
                .select('*');

            if (payoutError) throw payoutError;

            // Get user profiles
            const uniqueSellerIds = [...new Set((purchases as any[])
                .filter(p => p.premium_itineraries)
                .map(p => (p.premium_itineraries as any).user_id))];

            const { data: profiles, error: profilesError } = await supabase
                .from('user_profiles')
                .select('user_id, username, full_name')
                .in('user_id', uniqueSellerIds);

            if (profilesError) throw profilesError;

            // Create a lookup for profiles
            const profileLookup: Record<string, { username: string, full_name: string }> = {};
            profiles.forEach(profile => {
                profileLookup[profile.user_id] = {
                    username: profile.username || '',
                    full_name: profile.full_name || 'Unknown'
                };
            });

            // Calculate earnings per seller
            const sellerEarnings: Record<string, SellerEarnings> = {};

            (purchases as any[]).forEach(purchase => {
                if (!purchase.premium_itineraries) return;

                // For premium_itineraries that are returned as an array, take the first element
                const premiumItinerary = Array.isArray(purchase.premium_itineraries)
                    ? purchase.premium_itineraries[0]
                    : purchase.premium_itineraries;

                if (!premiumItinerary) return;

                const sellerId = premiumItinerary.user_id;
                const price = premiumItinerary.price || 0;
                const netAmount = price * 0.8; // 80% to seller
                const currency = premiumItinerary.currency || 'USD';

                if (!sellerEarnings[sellerId]) {
                    sellerEarnings[sellerId] = {
                        seller_id: sellerId,
                        username: profileLookup[sellerId]?.username || '',
                        full_name: profileLookup[sellerId]?.full_name || 'Unknown',
                        total_earned: 0,
                        total_paid: 0,
                        pending_amount: 0,
                        sales_count: 0,
                        currency,
                        last_payout_date: null
                    };
                }

                sellerEarnings[sellerId].total_earned += netAmount;
                sellerEarnings[sellerId].sales_count += 1;
            });

            // Add payout information
            payoutData.forEach(payout => {
                const sellerId = payout.seller_id;
                if (sellerEarnings[sellerId]) {
                    if (payout.status === 'completed') {
                        sellerEarnings[sellerId].total_paid += payout.amount;
                    }

                    // Update last payout date if this is more recent
                    if (!sellerEarnings[sellerId].last_payout_date ||
                        new Date(payout.created_at) > new Date(sellerEarnings[sellerId].last_payout_date)) {
                        sellerEarnings[sellerId].last_payout_date = payout.created_at;
                    }
                }
            });

            // Calculate pending amounts
            Object.values(sellerEarnings).forEach(seller => {
                seller.pending_amount = seller.total_earned - seller.total_paid;
            });

            // Convert to array and sort by pending amount
            const sortedSellers = Object.values(sellerEarnings)
                .sort((a, b) => b.pending_amount - a.pending_amount);

            setSellers(sortedSellers);
        } catch (error) {
            console.error('Error loading seller earnings:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRecentPayouts = async () => {
        try {
            // Get recent payouts
            const { data, error } = await supabase
                .from('seller_payouts')
                .select(`
                    id,
                    seller_id,
                    amount,
                    currency,
                    status,
                    created_at,
                    payment_method,
                    reference,
                    notes
                `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            setPayouts(data);
        } catch (error) {
            console.error('Error loading payouts:', error);
        }
    };

    const handleCreatePayout = async () => {
        if (!selectedSellerId || !payoutAmount) return;

        try {
            setIsSubmitting(true);

            const seller = sellers.find(s => s.seller_id === selectedSellerId);
            if (!seller) return;

            const payoutData = {
                seller_id: selectedSellerId,
                amount: parseFloat(payoutAmount),
                currency: seller.currency,
                status: 'pending',
                payment_method: paymentMethod,
                reference: reference,
                notes: notes
            };

            const { error } = await supabase
                .from('seller_payouts')
                .insert(payoutData);

            if (error) throw error;

            // Refresh data
            await Promise.all([
                loadSellerEarnings(),
                loadRecentPayouts()
            ]);

            // Reset form
            setPayoutModalOpen(false);
            setPayoutAmount('');
            setPaymentMethod('bank_transfer');
            setReference('');
            setNotes('');
            setSelectedSellerId(null);

        } catch (error) {
            console.error('Error creating payout:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdatePayoutStatus = async (payoutId: string, newStatus: 'pending' | 'completed' | 'failed') => {
        try {
            const { error } = await supabase
                .from('seller_payouts')
                .update({ status: newStatus })
                .eq('id', payoutId);

            if (error) throw error;

            // Refresh data
            await Promise.all([
                loadSellerEarnings(),
                loadRecentPayouts()
            ]);

        } catch (error) {
            console.error('Error updating payout status:', error);
        }
    };

    const filteredSellers = searchTerm
        ? sellers.filter(seller =>
            seller.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            seller.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
        : sellers;

    const filteredPayouts = payouts.filter(payout => {
        if (statusFilter !== 'all' && payout.status !== statusFilter) {
            return false;
        }

        if (selectedSellerId && payout.seller_id !== selectedSellerId) {
            return false;
        }

        return true;
    });

    const formatCurrency = (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Never';

        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Seller Payouts Management</h2>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sellers List - 5 columns */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-800">Sellers with Earnings</h3>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search sellers..."
                                        className="pl-8 pr-4 py-1 border border-gray-300 rounded-md text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Seller
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Pending
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Last Payout
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredSellers.map(seller => (
                                            <tr
                                                key={seller.seller_id}
                                                className={`${selectedSellerId === seller.seller_id ? 'bg-blue-50' : ''} hover:bg-gray-50 cursor-pointer`}
                                                onClick={() => setSelectedSellerId(seller.seller_id === selectedSellerId ? null : seller.seller_id)}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <span className="text-gray-500 font-medium">
                                                                {seller.username.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                @{seller.username}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {seller.full_name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {formatCurrency(seller.pending_amount, seller.currency)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {seller.sales_count} sales
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {seller.last_payout_date ? formatDate(seller.last_payout_date) : 'Never'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedSellerId(seller.seller_id);
                                                            setPayoutAmount(seller.pending_amount.toString());
                                                            setPayoutModalOpen(true);
                                                        }}
                                                        disabled={seller.pending_amount <= 0}
                                                        className={`px-3 py-1 rounded-md text-xs font-medium ${seller.pending_amount > 0
                                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        Create Payout
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredSellers.length === 0 && (
                                <div className="py-8 text-center text-gray-500">
                                    No sellers found
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payouts History - 7 columns */}
                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <div className="flex items-center">
                                    <h3 className="text-lg font-medium text-gray-800">Payouts History</h3>
                                    {selectedSellerId && (
                                        <div className="ml-2 flex items-center bg-blue-50 px-2 py-1 rounded text-xs font-medium text-blue-700">
                                            Filtered by seller
                                            <button
                                                onClick={() => setSelectedSellerId(null)}
                                                className="ml-1 text-blue-500 hover:text-blue-700"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <select
                                            className="pl-7 pr-4 py-1 border border-gray-300 rounded-md text-sm"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="completed">Completed</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                        <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Seller
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Method
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredPayouts.map(payout => {
                                            const seller = sellers.find(s => s.seller_id === payout.seller_id);
                                            return (
                                                <tr key={payout.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                                <span className="text-gray-500 font-medium">
                                                                    {seller?.username.charAt(0).toUpperCase() || '?'}
                                                                </span>
                                                            </div>
                                                            <div className="ml-3">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {seller ? `@${seller.username}` : 'Unknown'}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {seller?.full_name || ''}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {formatCurrency(payout.amount, payout.currency)}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {payout.reference ? `Ref: ${payout.reference}` : ''}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(payout.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {payout.payment_method.replace('_', ' ')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                            {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                        {payout.status === 'pending' && (
                                                            <div className="flex justify-end gap-1">
                                                                <button
                                                                    onClick={() => handleUpdatePayoutStatus(payout.id, 'completed')}
                                                                    className="p-1 rounded bg-green-100 text-green-600 hover:bg-green-200"
                                                                    title="Mark as Completed"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdatePayoutStatus(payout.id, 'failed')}
                                                                    className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200"
                                                                    title="Mark as Failed"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {payout.status === 'completed' && (
                                                            <button className="p-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200" title="Download Receipt">
                                                                <Download className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {filteredPayouts.length === 0 && (
                                <div className="py-8 text-center text-gray-500">
                                    No payouts found
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Create Payout Modal */}
                {payoutModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg w-full max-w-md">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-800">Create New Payout</h3>
                            </div>
                            <div className="p-6">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Seller
                                    </label>
                                    <div className="text-sm">
                                        {sellers.find(s => s.seller_id === selectedSellerId)?.username
                                            ? `@${sellers.find(s => s.seller_id === selectedSellerId)?.username}`
                                            : 'Unknown'}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        value={payoutAmount}
                                        onChange={(e) => setPayoutAmount(e.target.value)}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Method
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    >
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="paypal">PayPal</option>
                                        <option value="stripe">Stripe</option>
                                        <option value="crypto">Cryptocurrency</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reference Number
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                        placeholder="Transaction ID, invoice number, etc."
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes
                                    </label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        placeholder="Additional payment details or instructions"
                                    ></textarea>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                                <button
                                    onClick={() => setPayoutModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreatePayout}
                                    disabled={!payoutAmount || isSubmitting}
                                    className={`px-4 py-2 rounded-md text-white ${!payoutAmount || isSubmitting
                                        ? 'bg-green-300 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                >
                                    {isSubmitting ? 'Processing...' : 'Create Payout'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}; 