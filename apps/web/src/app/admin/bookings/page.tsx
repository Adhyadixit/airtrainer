"use client";

import { useEffect, useState } from "react";
import { getSession, AuthUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { CalendarCheck, Search, Filter, Eye, DollarSign, MapPin, Clock } from "lucide-react";

interface Booking {
    id: string;
    athlete_id: string;
    trainer_id: string;
    sport: string;
    scheduled_at: string;
    duration_minutes: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
    total_paid: number;
    address?: string;
    athlete?: {
        first_name: string;
        last_name: string;
        email: string;
    };
    trainer?: {
        first_name: string;
        last_name: string;
        email: string;
    };
}

export default function AdminBookingsPage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterSport, setFilterSport] = useState<string>("all");

    useEffect(() => {
        const session = getSession();
        if (session) {
            setUser(session);
            loadBookings();
        }
    }, []);

    const loadBookings = async () => {
        try {
            const { data: bookingData } = await supabase
                .from("bookings")
                .select("*")
                .order("scheduled_at", { ascending: false })
                .limit(100);

            if (bookingData) {
                // Get user details for athletes and trainers
                const athleteIds = [...new Set(bookingData.map((b: any) => b.athlete_id))];
                const trainerIds = [...new Set(bookingData.map((b: any) => b.trainer_id))];

                const { data: athletes } = await supabase
                    .from("users")
                    .select("id, first_name, last_name, email")
                    .in("id", athleteIds);

                const { data: trainers } = await supabase
                    .from("users")
                    .select("id, first_name, last_name, email")
                    .in("id", trainerIds);

                const athleteMap = new Map((athletes || []).map((u: any) => [u.id, u]));
                const trainerMap = new Map((trainers || []).map((u: any) => [u.id, u]));

                const bookingsWithUsers = bookingData.map((booking: any) => ({
                    ...booking,
                    athlete: athleteMap.get(booking.athlete_id),
                    trainer: trainerMap.get(booking.trainer_id),
                }));

                setBookings(bookingsWithUsers);
            }
        } catch (err) {
            console.error("Failed to load bookings:", err);
        } finally {
            setLoading(false);
        }
    };

    const statusColors: Record<string, { bg: string; text: string }> = {
        pending: { bg: "#fef3c7", text: "#d97706" },
        confirmed: { bg: "#dbeafe", text: "#2563eb" },
        completed: { bg: "#d1fae5", text: "#059669" },
        cancelled: { bg: "#fee2e2", text: "#dc2626" },
        rejected: { bg: "#fecaca", text: "#b91c1c" },
    };

    const sports = [...new Set(bookings.map(b => b.sport))];

    const filteredBookings = bookings.filter(booking => {
        const matchesSearch = `${booking.athlete?.first_name} ${booking.athlete?.last_name} ${booking.trainer?.first_name} ${booking.trainer?.last_name} ${booking.sport}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || booking.status === filterStatus;
        const matchesSport = filterSport === "all" || booking.sport === filterSport;
        return matchesSearch && matchesStatus && matchesSport;
    });

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === "pending").length,
        confirmed: bookings.filter(b => b.status === "confirmed").length,
        completed: bookings.filter(b => b.status === "completed").length,
        cancelled: bookings.filter(b => b.status === "cancelled").length,
        revenue: bookings.filter(b => b.status === "completed").reduce((sum, b) => sum + Number(b.total_paid), 0),
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
                    <h2 className="text-3xl font-black text-[#0f172a] tracking-tight mb-2">Booking Management</h2>
                    <p className="text-[#64748b] text-lg">
                        Monitor and manage all platform bookings
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                            <CalendarCheck size={24} className="text-[#3b82f6]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">{stats.total}</p>
                            <p className="text-sm text-[#64748b]">Total</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#fffbeb] flex items-center justify-center">
                            <Clock size={24} className="text-[#f59e0b]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">{stats.pending}</p>
                            <p className="text-sm text-[#64748b]">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#dbeafe] flex items-center justify-center">
                            <Eye size={24} className="text-[#2563eb]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">{stats.confirmed}</p>
                            <p className="text-sm text-[#64748b]">Confirmed</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#d1fae5] flex items-center justify-center">
                            <CalendarCheck size={24} className="text-[#10b981]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">{stats.completed}</p>
                            <p className="text-sm text-[#64748b]">Completed</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#fee2e2] flex items-center justify-center">
                            <CalendarCheck size={24} className="text-[#dc2626]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">{stats.cancelled}</p>
                            <p className="text-sm text-[#64748b]">Cancelled</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#ecfdf5] flex items-center justify-center">
                            <DollarSign size={24} className="text-[#10b981]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">${stats.revenue.toFixed(0)}</p>
                            <p className="text-sm text-[#64748b]">Revenue</p>
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
                                placeholder="Search bookings by athlete, trainer, or sport..."
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
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <select
                            value={filterSport}
                            onChange={(e) => setFilterSport(e.target.value)}
                            className="px-4 py-2 border border-[#e2e8f0] rounded-lg bg-white text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        >
                            <option value="all">All Sports</option>
                            {sports.map(sport => (
                                <option key={sport} value={sport}>{sport}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Booking</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Athlete</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Trainer</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0]">
                            {filteredBookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-[#f8fafc] transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold text-[#0f172a]">{booking.sport}</p>
                                            <p className="text-sm text-[#64748b]">ID: {booking.id.slice(0, 8)}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-[#0f172a]">
                                                {booking.athlete?.first_name} {booking.athlete?.last_name}
                                            </p>
                                            <p className="text-sm text-[#64748b]">{booking.athlete?.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-[#0f172a]">
                                                {booking.trainer?.first_name} {booking.trainer?.last_name}
                                            </p>
                                            <p className="text-sm text-[#64748b]">{booking.trainer?.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-[#0f172a]">
                                                {new Date(booking.scheduled_at).toLocaleDateString()}
                                            </p>
                                            <p className="text-sm text-[#64748b]">
                                                {new Date(booking.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-[#0f172a]">
                                            {booking.duration_minutes} min
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-[#0f172a]">
                                            ${Number(booking.total_paid).toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium"
                                            style={{
                                                backgroundColor: statusColors[booking.status]?.bg,
                                                color: statusColors[booking.status]?.text,
                                            }}
                                        >
                                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {filteredBookings.length === 0 && (
                    <div className="text-center py-12">
                        <CalendarCheck size={48} className="mx-auto text-[#cbd5e1] mb-4" />
                        <p className="text-[#64748b]">No bookings found matching your criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
}
