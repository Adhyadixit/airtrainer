"use client";

import { useEffect, useState } from "react";
import { getSession, AuthUser } from "@/lib/auth";
import { supabase, BookingRow } from "@/lib/supabase";
import {
    Calendar,
    Clock,
    CheckCircle,
    Wallet,
    Star,
    MessageSquare,
    TrendingUp,
    ArrowUpRight,
    Search,
    ChevronRight,
    Activity,
    Users
} from "lucide-react";
import Link from "next/link";

interface Stats {
    totalBookings: number;
    upcomingBookings: number;
    completedBookings: number;
    totalEarnings: number;
    averageRating: number;
    totalReviews: number;
}

export default function DashboardOverview() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [stats, setStats] = useState<Stats>({
        totalBookings: 0,
        upcomingBookings: 0,
        completedBookings: 0,
        totalEarnings: 0,
        averageRating: 0,
        totalReviews: 0,
    });
    const [recentBookings, setRecentBookings] = useState<(BookingRow & { other_user?: { first_name: string; last_name: string } })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const session = getSession();
        if (session) {
            setUser(session);
            loadDashboardData(session);
        }
    }, []);

    const loadDashboardData = async (u: AuthUser) => {
        try {
            const isTrainer = u.role === "trainer";
            const column = isTrainer ? "trainer_id" : "athlete_id";

            const { data: bookings } = await supabase
                .from("bookings")
                .select("*")
                .eq(column, u.id)
                .order("scheduled_at", { ascending: false });

            const allBookings = (bookings || []) as BookingRow[];
            const now = new Date().toISOString();

            const reviewColumn = isTrainer ? "reviewee_id" : "reviewer_id";
            const { data: reviews } = await supabase
                .from("reviews")
                .select("*")
                .eq(reviewColumn, u.id);

            const avgRating = reviews && reviews.length > 0
                ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
                : 0;

            setStats({
                totalBookings: allBookings.length,
                upcomingBookings: allBookings.filter((b) => b.status === "confirmed" && b.scheduled_at > now).length,
                completedBookings: allBookings.filter((b) => b.status === "completed").length,
                totalEarnings: isTrainer
                    ? allBookings.filter((b) => b.status === "completed").reduce((s, b) => s + Number(b.price), 0)
                    : allBookings.filter((b) => b.status === "completed").reduce((s, b) => s + Number(b.total_paid), 0),
                averageRating: Math.round(avgRating * 10) / 10,
                totalReviews: reviews?.length || 0,
            });

            const recentIds = allBookings.slice(0, 5);
            const otherUserIds = recentIds.map((b) => (isTrainer ? b.athlete_id : b.trainer_id));

            if (otherUserIds.length > 0) {
                const { data: otherUsers } = await supabase
                    .from("users")
                    .select("id, first_name, last_name")
                    .in("id", otherUserIds);

                const usersMap = new Map((otherUsers || []).map((u: { id: string; first_name: string; last_name: string }) => [u.id, u]));
                setRecentBookings(
                    recentIds.map((b) => ({
                        ...b,
                        other_user: usersMap.get(isTrainer ? b.athlete_id : b.trainer_id) as { first_name: string; last_name: string } | undefined,
                    }))
                );
            }
        } catch (err) {
            console.error("Failed to load dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="relative flex justify-center items-center">
                    <div className="absolute animate-ping w-16 h-16 rounded-full bg-indigo-500 opacity-20"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600"></div>
                </div>
            </div>
        );
    }

    const isTrainer = user?.role === "trainer";
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    const statCards = isTrainer
        ? [
            { label: "Total Sessions", value: stats.totalBookings, icon: Activity, color: "text-blue-600", bg: "bg-blue-100" },
            { label: "Upcoming", value: stats.upcomingBookings, icon: Clock, color: "text-emerald-600", bg: "bg-emerald-100" },
            { label: "Completed", value: stats.completedBookings, icon: CheckCircle, color: "text-indigo-600", bg: "bg-indigo-100" },
            { label: "Total Earnings", value: `$${stats.totalEarnings.toFixed(2)}`, icon: Wallet, color: "text-amber-600", bg: "bg-amber-100" },
            { label: "Avg Rating", value: stats.averageRating || "N/A", icon: Star, color: "text-amber-500", bg: "bg-amber-100" },
            { label: "Reviews", value: stats.totalReviews, icon: MessageSquare, color: "text-violet-600", bg: "bg-violet-100" },
        ]
        : [
            { label: "Total Bookings", value: stats.totalBookings, icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
            { label: "Upcoming", value: stats.upcomingBookings, icon: Clock, color: "text-emerald-600", bg: "bg-emerald-100" },
            { label: "Completed", value: stats.completedBookings, icon: CheckCircle, color: "text-indigo-600", bg: "bg-indigo-100" },
            { label: "Total Spent", value: `$${stats.totalEarnings.toFixed(2)}`, icon: Wallet, color: "text-amber-600", bg: "bg-amber-100" },
        ];

    const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
        pending: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
        confirmed: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
        completed: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
        cancelled: { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
        no_show: { bg: "bg-violet-50 border-violet-200", text: "text-violet-700", dot: "bg-violet-500" },
        disputed: { bg: "bg-red-50 border-red-200", text: "text-red-700", dot: "bg-red-500" },
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-50/50 to-white/0 select-none pointer-events-none"></div>
                <div className="relative p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            {greeting}, {user?.firstName}!
                            <span className="text-4xl animate-[pulse_3s_ease-in-out_infinite]">👋</span>
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">
                            Here's what's happening with your {isTrainer ? "training business" : "training journey"} today.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {statCards.map((card, i) => (
                    <div
                        key={i}
                        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-lg transition-all duration-300 group hover:-translate-y-1"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6 duration-300 ${card.bg}`}>
                                <card.icon size={24} className={card.color} strokeWidth={2.5} />
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowUpRight size={16} className="text-slate-400" />
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1 group-hover:text-indigo-600 transition-colors">
                                {card.value}
                            </div>
                            <div className="text-sm font-semibold text-slate-500">
                                {card.label}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Grid: Recent Bookings & Quick Actions */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Recent Bookings */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Calendar size={20} className="text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Sessions</h3>
                        </div>
                        <Link
                            href="/dashboard/bookings"
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full transition-colors flex items-center gap-1"
                        >
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div className="flex-1 p-2">
                        {recentBookings.length === 0 ? (
                            <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center bg-slate-50/30 rounded-xl m-4 border-2 border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-3xl shadow-inner">
                                    📭
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 mb-2">No upcoming sessions</h4>
                                <p className="text-slate-500 text-sm max-w-sm font-medium">
                                    It looks like you don't have any bookings yet.
                                    {isTrainer ? " Ensure your calendar availability is up to date." : " Find a trainer to get started on your journey!"}
                                </p>
                                {!isTrainer && (
                                    <Link
                                        href="/dashboard/search"
                                        className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                                    >
                                        <Search size={18} />
                                        Find a Trainer
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {recentBookings.map((booking) => {
                                    const status = statusStyles[booking.status] || statusStyles.pending;
                                    const date = new Date(booking.scheduled_at);

                                    return (
                                        <div
                                            key={booking.id}
                                            className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors rounded-xl m-2 group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                                                    {booking.other_user
                                                        ? `${booking.other_user.first_name[0]}${booking.other_user.last_name[0]}`
                                                        : "?"}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">
                                                        {booking.other_user
                                                            ? `${booking.other_user.first_name} ${booking.other_user.last_name}`
                                                            : "Unknown User"}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1 font-semibold">
                                                        <span className="flex items-center gap-1">
                                                            <Activity size={14} className="text-indigo-400" />
                                                            {booking.sport}
                                                        </span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={14} className="text-indigo-400" />
                                                            {booking.duration_minutes} min
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 gap-3 sm:gap-2">
                                                <div className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                                    {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} •{" "}
                                                    {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                                </div>
                                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${status.bg} text-xs font-bold uppercase tracking-wider`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                                                    <span className={status.text}>{booking.status.replace("_", " ")}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Performance banner */}
                <div className="bg-gradient-to-br from-indigo-900 via-violet-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between h-[400px] xl:h-auto group">
                    {/* Background decorations */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/50 rounded-full blur-3xl group-hover:bg-indigo-400/50 transition-colors duration-700"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/50 rounded-full blur-3xl group-hover:bg-fuchsia-400/50 transition-colors duration-700"></div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
                                <TrendingUp size={14} className="text-indigo-300" />
                                Insights
                            </div>
                            <h2 className="text-3xl font-extrabold tracking-tight mb-4 text-white">
                                Keep the momentum going!
                            </h2>
                            <p className="text-indigo-100/90 leading-relaxed text-lg font-medium">
                                {isTrainer
                                    ? "Trainers with completed profiles and up-to-date calendars get 3x more bookings."
                                    : "Consistent training is the key to mastering your sport. Book your next session now."}
                            </p>
                        </div>

                        <div className="mt-8">
                            <Link
                                href={isTrainer ? "/dashboard/profile" : "/dashboard/search"}
                                className="inline-flex items-center justify-center gap-2 w-full py-4 bg-white text-indigo-950 font-bold rounded-xl hover:bg-indigo-50 hover:scale-[1.02] transition-all shadow-xl shadow-black/20"
                            >
                                {isTrainer ? "Update Profile" : "Find a Trainer"}
                                <ArrowUpRight size={20} className="text-indigo-600" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
