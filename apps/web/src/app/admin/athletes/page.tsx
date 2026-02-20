"use client";

import { useEffect, useState } from "react";
import { getSession, AuthUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Users, Search, Filter, Eye, Ban, Shield } from "lucide-react";

interface Athlete {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    is_approved: boolean;
    profile_data?: {
        age?: number;
        sports?: string[];
        city?: string;
        state?: string;
    };
}

export default function AdminAthletesPage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "pending">("all");

    useEffect(() => {
        const session = getSession();
        if (session) {
            setUser(session);
            loadAthletes();
        }
    }, []);

    const loadAthletes = async () => {
        try {
            const { data } = await supabase
                .from("users")
                .select("*, athlete_profiles(*)")
                .eq("role", "athlete")
                .order("created_at", { ascending: false });

            if (data) {
                const athletesData = data.map((user: any) => ({
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    created_at: user.created_at,
                    is_approved: user.is_approved,
                    profile_data: user.athlete_profiles?.[0] || null,
                }));
                setAthletes(athletesData);
            }
        } catch (err) {
            console.error("Failed to load athletes:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleApproval = async (athleteId: string, currentStatus: boolean) => {
        try {
            await supabase
                .from("users")
                .update({ is_approved: !currentStatus })
                .eq("id", athleteId);
            
            setAthletes(prev => 
                prev.map(a => 
                    a.id === athleteId 
                        ? { ...a, is_approved: !currentStatus }
                        : a
                )
            );
        } catch (err) {
            console.error("Failed to update approval:", err);
        }
    };

    const filteredAthletes = athletes.filter(athlete => {
        const matchesSearch = `${athlete.first_name} ${athlete.last_name} ${athlete.email}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === "all" || 
            (filterStatus === "approved" && athlete.is_approved) ||
            (filterStatus === "pending" && !athlete.is_approved);
        return matchesSearch && matchesFilter;
    });

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
                    <h2 className="text-3xl font-black text-[#0f172a] tracking-tight mb-2">Athlete Management</h2>
                    <p className="text-[#64748b] text-lg">
                        Manage all athlete accounts and approvals
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                            <Users size={24} className="text-[#3b82f6]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">{athletes.length}</p>
                            <p className="text-sm text-[#64748b]">Total Athletes</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#ecfdf5] flex items-center justify-center">
                            <Shield size={24} className="text-[#10b981]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">{athletes.filter(a => a.is_approved).length}</p>
                            <p className="text-sm text-[#64748b]">Approved</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#fffbeb] flex items-center justify-center">
                            <Eye size={24} className="text-[#f59e0b]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">{athletes.filter(a => !a.is_approved).length}</p>
                            <p className="text-sm text-[#64748b]">Pending Approval</p>
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
                                placeholder="Search athletes by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterStatus("all")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                filterStatus === "all"
                                    ? "bg-[#3b82f6] text-white"
                                    : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterStatus("approved")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                filterStatus === "approved"
                                    ? "bg-[#10b981] text-white"
                                    : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                            }`}
                        >
                            Approved
                        </button>
                        <button
                            onClick={() => setFilterStatus("pending")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                filterStatus === "pending"
                                    ? "bg-[#f59e0b] text-white"
                                    : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                            }`}
                        >
                            Pending
                        </button>
                    </div>
                </div>
            </div>

            {/* Athletes Table */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Athlete</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Sports</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0]">
                            {filteredAthletes.map((athlete) => (
                                <tr key={athlete.id} className="hover:bg-[#f8fafc] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3b82f6] to-[#2563eb] flex items-center justify-center text-white font-bold">
                                                {athlete.first_name[0]}{athlete.last_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[#0f172a]">
                                                    {athlete.first_name} {athlete.last_name}
                                                </p>
                                                {athlete.profile_data?.age && (
                                                    <p className="text-sm text-[#64748b]">Age {athlete.profile_data.age}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#64748b]">{athlete.email}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {athlete.profile_data?.sports?.slice(0, 2).map((sport, i) => (
                                                <span key={i} className="px-2 py-1 bg-[#eff6ff] text-[#3b82f6] text-xs rounded-full font-medium">
                                                    {sport}
                                                </span>
                                            ))}
                                            {athlete.profile_data?.sports && athlete.profile_data.sports.length > 2 && (
                                                <span className="px-2 py-1 bg-[#f1f5f9] text-[#64748b] text-xs rounded-full font-medium">
                                                    +{athlete.profile_data.sports.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#64748b]">
                                        {athlete.profile_data?.city && athlete.profile_data?.state
                                            ? `${athlete.profile_data.city}, ${athlete.profile_data.state}`
                                            : "Not specified"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#64748b]">
                                        {new Date(athlete.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                            athlete.is_approved
                                                ? "bg-[#ecfdf5] text-[#10b981]"
                                                : "bg-[#fffbeb] text-[#f59e0b]"
                                        }`}>
                                            <div className={`w-2 h-2 rounded-full ${
                                                athlete.is_approved ? "bg-[#10b981]" : "bg-[#f59e0b]"
                                            }`} />
                                            {athlete.is_approved ? "Approved" : "Pending"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleApproval(athlete.id, athlete.is_approved)}
                                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                    athlete.is_approved
                                                        ? "bg-[#fef2f2] text-[#ef4444] hover:bg-[#fee2e2]"
                                                        : "bg-[#ecfdf5] text-[#10b981] hover:bg-[#d1fae5]"
                                                }`}
                                            >
                                                {athlete.is_approved ? "Revoke" : "Approve"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {filteredAthletes.length === 0 && (
                    <div className="text-center py-12">
                        <Users size={48} className="mx-auto text-[#cbd5e1] mb-4" />
                        <p className="text-[#64748b]">No athletes found matching your criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
}
