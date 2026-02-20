"use client";

import { useEffect, useState } from "react";
import { getSession, AuthUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { CreditCard, Search, Filter, TrendingUp, DollarSign, Calendar, Download } from "lucide-react";

interface Payment {
    id: string;
    booking_id: string;
    amount: number;
    platform_fee: number;
    total_paid: number;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    payment_method: string;
    created_at: string;
    booking?: {
        athlete_name: string;
        trainer_name: string;
        sport: string;
    };
}

export default function AdminPaymentsPage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [dateRange, setDateRange] = useState<string>("all");

    useEffect(() => {
        const session = getSession();
        if (session) {
            setUser(session);
            loadPayments();
        }
    }, []);

    const loadPayments = async () => {
        try {
            // Since we don't have a separate payments table, we'll use bookings data
            const { data: bookingData } = await supabase
                .from("bookings")
                .select("*, users!bookings_athlete_id_fkey(first_name, last_name), users!bookings_trainer_id_fkey(first_name, last_name)")
                .order("created_at", { ascending: false })
                .limit(100);

            if (bookingData) {
                const paymentsData = bookingData.map((booking: any) => ({
                    id: booking.id,
                    booking_id: booking.id,
                    amount: Number(booking.price),
                    platform_fee: Number(booking.platform_fee),
                    total_paid: Number(booking.total_paid),
                    status: (booking.status === 'completed' ? 'completed' : booking.status === 'cancelled' ? 'refunded' : 'pending') as Payment['status'],
                    payment_method: "Credit Card", // Default since we don't have this field
                    created_at: booking.created_at,
                    booking: {
                        athlete_name: `${booking.users?.first_name || ''} ${booking.users?.last_name || ''}`.trim(),
                        trainer_name: `${booking.users?.first_name || ''} ${booking.users?.last_name || ''}`.trim(),
                        sport: booking.sport,
                    },
                }));
                setPayments(paymentsData);
            }
        } catch (err) {
            console.error("Failed to load payments:", err);
        } finally {
            setLoading(false);
        }
    };

    const statusColors: Record<string, { bg: string; text: string }> = {
        pending: { bg: "#fef3c7", text: "#d97706" },
        completed: { bg: "#d1fae5", text: "#059669" },
        failed: { bg: "#fee2e2", text: "#dc2626" },
        refunded: { bg: "#e0e7ff", text: "#6366f1" },
    };

    const filteredPayments = payments.filter(payment => {
        const matchesSearch = `${payment.booking?.athlete_name} ${payment.booking?.trainer_name} ${payment.booking?.sport}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || payment.status === filterStatus;

        let matchesDate = true;
        if (dateRange !== "all") {
            const paymentDate = new Date(payment.created_at);
            const now = new Date();
            const daysDiff = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));

            switch (dateRange) {
                case "7days":
                    matchesDate = daysDiff <= 7;
                    break;
                case "30days":
                    matchesDate = daysDiff <= 30;
                    break;
                case "90days":
                    matchesDate = daysDiff <= 90;
                    break;
            }
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const stats = {
        totalRevenue: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.total_paid, 0),
        platformFees: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.platform_fee, 0),
        netRevenue: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.total_paid - p.platform_fee), 0),
        totalTransactions: payments.length,
        completedTransactions: payments.filter(p => p.status === 'completed').length,
        pendingTransactions: payments.filter(p => p.status === 'pending').length,
    };

    const exportData = () => {
        const csv = [
            ['ID', 'Athlete', 'Trainer', 'Sport', 'Amount', 'Platform Fee', 'Total', 'Status', 'Date'],
            ...filteredPayments.map(p => [
                p.id.slice(0, 8),
                p.booking?.athlete_name || '',
                p.booking?.trainer_name || '',
                p.booking?.sport || '',
                p.amount.toFixed(2),
                p.platform_fee.toFixed(2),
                p.total_paid.toFixed(2),
                p.status,
                new Date(p.created_at).toLocaleDateString(),
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-[#0f172a] tracking-tight mb-2">Payment Management</h2>
                    <p className="text-[#64748b] text-lg">
                        Track all platform transactions and revenue
                    </p>
                </div>
                <button
                    onClick={exportData}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white font-bold shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#ecfdf5] flex items-center justify-center">
                            <DollarSign size={24} className="text-[#10b981]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">${stats.totalRevenue.toFixed(0)}</p>
                            <p className="text-sm text-[#64748b]">Total Revenue</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#dbeafe] flex items-center justify-center">
                            <TrendingUp size={24} className="text-[#2563eb]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">${stats.netRevenue.toFixed(0)}</p>
                            <p className="text-sm text-[#64748b]">Net Revenue</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#f3f4f6] flex items-center justify-center">
                            <CreditCard size={24} className="text-[#6b7280]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">{stats.totalTransactions}</p>
                            <p className="text-sm text-[#64748b]">Transactions</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#fef3c7] flex items-center justify-center">
                            <Calendar size={24} className="text-[#f59e0b]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">${stats.platformFees.toFixed(0)}</p>
                            <p className="text-sm text-[#64748b]">Platform Fees</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                            <input
                                type="text"
                                placeholder="Search payments by athlete, trainer, or sport..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-[#e2e8f0] rounded-lg bg-white text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        >
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                        </select>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="px-4 py-2 border border-[#e2e8f0] rounded-lg bg-white text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        >
                            <option value="all">All Time</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="90days">Last 90 Days</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Transaction ID</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Athlete</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Trainer</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Sport</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Platform Fee</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0]">
                            {filteredPayments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-[#f8fafc] transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-sm text-[#64748b]">
                                            #{payment.id.slice(0, 8)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-[#0f172a]">{payment.booking?.athlete_name || 'N/A'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-[#0f172a]">{payment.booking?.trainer_name || 'N/A'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-[#0f172a]">
                                            {payment.booking?.sport || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-[#0f172a]">
                                            ${payment.amount.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-[#f59e0b]">
                                            ${payment.platform_fee.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-[#0f172a]">
                                            ${payment.total_paid.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium"
                                            style={{
                                                backgroundColor: statusColors[payment.status]?.bg,
                                                color: statusColors[payment.status]?.text,
                                            }}
                                        >
                                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-[#64748b]">
                                            {new Date(payment.created_at).toLocaleDateString()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredPayments.length === 0 && (
                    <div className="text-center py-12">
                        <CreditCard size={48} className="mx-auto text-[#cbd5e1] mb-4" />
                        <p className="text-[#64748b]">No payments found matching your criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
}
