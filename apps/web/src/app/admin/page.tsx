"use client";

import { useEffect, useState } from "react";
import { getSession, AuthUser } from "@/lib/auth";
import { Users, Dumbbell, CalendarCheck, TrendingUp, ShieldAlert, CreditCard } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const session = await getSession();
            if (session) setUser(session);
        };
        fetchUser();
    }, []);

    const stats = [
        { label: "Total Athletes", value: "0", icon: <Users size={24} className="text-[#3b82f6]" />, trend: "0%", color: "bg-[#eff6ff]" },
        { label: "Active Trainers", value: "0", icon: <Dumbbell size={24} className="text-[#10b981]" />, trend: "0%", color: "bg-[#ecfdf5]" },
        { label: "Bookings Today", value: "0", icon: <CalendarCheck size={24} className="text-[#f59e0b]" />, trend: "0%", color: "bg-[#fffbeb]" },
        { label: "Open Disputes", value: "0", icon: <ShieldAlert size={24} className="text-[#ef4444]" />, trend: "0", color: "bg-[#fef2f2]" },
    ];

    const recentUsers: any[] = [];

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-[#0f172a] tracking-tight mb-2">Platform Overview</h2>
                    <p className="text-[#64748b] text-lg">
                        Welcome back{user ? `, ${user.firstName}` : ""}. Here's exactly what's happening.
                    </p>
                </div>
                <button className="h-11 px-6 rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white font-bold shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                    <TrendingUp size={18} />
                    Generate Report
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-14 h-14 rounded-xl ${stat.color} flex items-center justify-center`}>
                                {stat.icon}
                            </div>
                            <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${stat.trend.startsWith("+") ? "bg-[#ecfdf5] text-[#10b981]" : "bg-[#fef2f2] text-[#ef4444]"
                                }`}>
                                {stat.trend}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black text-[#0f172a] tracking-tight">{stat.value}</h3>
                            <p className="text-[#64748b] font-medium mt-1 uppercase tracking-wider text-xs">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Registrations */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-[#e2e8f0] flex items-center justify-between bg-white relative">
                        <h3 className="text-xl font-bold text-[#0f172a]">Recent Signups</h3>
                        <Link href="/admin/athletes" className="text-[#2563eb] text-sm font-semibold hover:text-[#1e3a8a] transition-colors">
                            View All
                        </Link>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                                    <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e2e8f0] bg-white">
                                {recentUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-[#64748b]">
                                            No recent signups to display.
                                        </td>
                                    </tr>
                                ) : (
                                    recentUsers.map((user, i) => (
                                        <tr key={i} className="hover:bg-[#f8fafc] transition-colors group cursor-pointer">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#94a3b8] to-[#cbd5e1] flex items-center justify-center text-white font-bold text-sm shadow-inner">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-[#0f172a] group-hover:text-[#2563eb] transition-colors">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-[#475569] font-medium">{user.role}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-[#64748b] text-sm font-medium">
                                                {user.date}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${user.status === "Active"
                                                    ? "bg-[#ecfdf5] text-[#10b981]"
                                                    : "bg-[#fffbeb] text-[#f59e0b]"
                                                    }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-0 flex flex-col">
                    <div className="px-6 py-5 border-b border-[#e2e8f0] bg-white">
                        <h3 className="text-xl font-bold text-[#0f172a]">Quick Actions</h3>
                    </div>
                    <div className="p-6 space-y-4 flex-1 bg-[#f8fafc]/50">
                        <Link href="/admin/trainers" className="w-full flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-xl hover:border-[#3b82f6] hover:shadow-md transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-[#eff6ff] text-[#2563eb] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Dumbbell size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-[#0f172a] group-hover:text-[#2563eb] transition-colors">Verify Trainers</p>
                                    <p className="text-xs text-[#64748b] mt-0.5">12 pending applications</p>
                                </div>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#64748b] group-hover:bg-[#2563eb] group-hover:text-white transition-colors">
                                &rarr;
                            </div>
                        </Link>
                        <Link href="/admin/disputes" className="w-full flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-xl hover:border-[#ef4444] hover:shadow-md transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-[#fef2f2] text-[#ef4444] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ShieldAlert size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-[#0f172a] group-hover:text-[#ef4444] transition-colors">Resolve Disputes</p>
                                    <p className="text-xs text-[#64748b] mt-0.5">3 require attention</p>
                                </div>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#64748b] group-hover:bg-[#ef4444] group-hover:text-white transition-colors">
                                &rarr;
                            </div>
                        </Link>
                        <Link href="/admin/payments" className="w-full flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-xl hover:border-[#10b981] hover:shadow-md transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-[#ecfdf5] text-[#10b981] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <CreditCard size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-[#0f172a] group-hover:text-[#10b981] transition-colors">Payouts</p>
                                    <p className="text-xs text-[#64748b] mt-0.5">$14,250 scheduled today</p>
                                </div>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#64748b] group-hover:bg-[#10b981] group-hover:text-white transition-colors">
                                &rarr;
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
