"use client";

import { useEffect, useState } from "react";
import { getSession, AuthUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Dumbbell, Search, Filter, Eye, Ban, Shield, Star, MapPin } from "lucide-react";

interface Trainer {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    is_approved: boolean;
    profile_data?: {
        headline?: string;
        hourly_rate?: number;
        years_experience?: number;
        total_sessions?: number;
        city?: string;
        state?: string;
        sports?: string[];
        is_verified?: boolean;
        avg_rating?: number;
        review_count?: number;
    };
}

export default function AdminTrainersPage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "pending">("all");
    const [filterVerified, setFilterVerified] = useState<"all" | "verified" | "unverified">("all");

    useEffect(() => {
        const session = getSession();
        if (session) {
            setUser(session);
            loadTrainers();
        }
    }, []);

    const loadTrainers = async () => {
        try {
            const { data } = await supabase
                .from("users")
                .select("*, trainer_profiles(*)")
                .eq("role", "trainer")
                .order("created_at", { ascending: false });

            if (data) {
                const trainersData = data.map((user: any) => ({
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    created_at: user.created_at,
                    is_approved: user.is_approved,
                    profile_data: user.trainer_profiles?.[0] || null,
                }));
                setTrainers(trainersData);
            }
        } catch (err) {
            console.error("Failed to load trainers:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleApproval = async (trainerId: string, currentStatus: boolean) => {
        try {
            await supabase
                .from("users")
                .update({ is_approved: !currentStatus })
                .eq("id", trainerId);
            
            setTrainers(prev => 
                prev.map(t => 
                    t.id === trainerId 
                        ? { ...t, is_approved: !currentStatus }
                        : t
                )
            );
        } catch (err) {
            console.error("Failed to update approval:", err);
        }
    };

    const toggleVerification = async (trainerId: string, currentStatus: boolean) => {
        try {
            await supabase
                .from("trainer_profiles")
                .update({ is_verified: !currentStatus })
                .eq("user_id", trainerId);
            
            setTrainers(prev => 
                prev.map(t => 
                    t.id === trainerId 
                        ? { ...t, profile_data: { ...t.profile_data, is_verified: !currentStatus } }
                        : t
                )
            );
        } catch (err) {
            console.error("Failed to update verification:", err);
        }
    };

    const filteredTrainers = trainers.filter(trainer => {
        const matchesSearch = `${trainer.first_name} ${trainer.last_name} ${trainer.email}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || 
            (filterStatus === "approved" && trainer.is_approved) ||
            (filterStatus === "pending" && !trainer.is_approved);
        const matchesVerified = filterVerified === "all" ||
            (filterVerified === "verified" && trainer.profile_data?.is_verified) ||
            (filterVerified === "unverified" && !trainer.profile_data?.is_verified);
        return matchesSearch && matchesStatus && matchesVerified;
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
                    <h2 className="text-3xl font-black text-[#0f172a] tracking-tight mb-2">Trainer Management</h2>
                    <p className="text-[#64748b] text-lg">
                        Manage trainer accounts, approvals, and verifications
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                            <Dumbbell size={24} className="text-[#3b82f6]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">{trainers.length}</p>
                            <p className="text-sm text-[#64748b]">Total Trainers</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#ecfdf5] flex items-center justify-center">
                            <Shield size={24} className="text-[#10b981]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">{trainers.filter(t => t.is_approved).length}</p>
                            <p className="text-sm text-[#64748b]">Approved</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#fef3c7] flex items-center justify-center">
                            <Star size={24} className="text-[#f59e0b]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">{trainers.filter(t => t.profile_data?.is_verified).length}</p>
                            <p className="text-sm text-[#64748b]">Verified</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#fffbeb] flex items-center justify-center">
                            <Eye size={24} className="text-[#f59e0b]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">{trainers.filter(t => !t.is_approved).length}</p>
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
                                placeholder="Search trainers by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="px-4 py-2 border border-[#e2e8f0] rounded-lg bg-white text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        >
                            <option value="all">All Status</option>
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                        </select>
                        <select
                            value={filterVerified}
                            onChange={(e) => setFilterVerified(e.target.value as any)}
                            className="px-4 py-2 border border-[#e2e8f0] rounded-lg bg-white text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        >
                            <option value="all">All Verification</option>
                            <option value="verified">Verified</option>
                            <option value="unverified">Unverified</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Trainers Table */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Trainer</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Rating</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Rate</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0]">
                            {filteredTrainers.map((trainer) => (
                                <tr key={trainer.id} className="hover:bg-[#f8fafc] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#10b981] to-[#059669] flex items-center justify-center text-white font-bold">
                                                {trainer.first_name[0]}{trainer.last_name[0]}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-[#0f172a]">
                                                        {trainer.first_name} {trainer.last_name}
                                                    </p>
                                                    {trainer.profile_data?.is_verified && (
                                                        <div className="w-5 h-5 rounded-full bg-[#f59e0b] flex items-center justify-center">
                                                            <Star size={12} className="text-white fill-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                {trainer.profile_data?.headline && (
                                                    <p className="text-sm text-[#64748b] truncate max-w-xs">{trainer.profile_data.headline}</p>
                                                )}
                                                {trainer.profile_data?.years_experience && (
                                                    <p className="text-sm text-[#64748b]">{trainer.profile_data.years_experience} years exp</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#64748b]">{trainer.email}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center">
                                                <Star size={14} className="text-[#f59e0b] fill-[#f59e0b]" />
                                                <span className="ml-1 text-sm font-medium text-[#0f172a]">
                                                    {trainer.profile_data?.avg_rating?.toFixed(1) || "—"}
                                                </span>
                                            </div>
                                            {trainer.profile_data?.review_count && (
                                                <span className="text-xs text-[#64748b]">({trainer.profile_data.review_count})</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-[#0f172a]">
                                            ${trainer.profile_data?.hourly_rate || "—"}/hr
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#64748b]">
                                        {trainer.profile_data?.city && trainer.profile_data?.state
                                            ? `${trainer.profile_data.city}, ${trainer.profile_data.state}`
                                            : "Not specified"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                trainer.is_approved
                                                    ? "bg-[#ecfdf5] text-[#10b981]"
                                                    : "bg-[#fffbeb] text-[#f59e0b]"
                                            }`}>
                                                <div className={`w-2 h-2 rounded-full ${
                                                    trainer.is_approved ? "bg-[#10b981]" : "bg-[#f59e0b]"
                                                }`} />
                                                {trainer.is_approved ? "Approved" : "Pending"}
                                            </span>
                                            {trainer.profile_data?.is_verified && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#fef3c7] text-[#f59e0b]">
                                                    <Star size={10} className="fill-[#f59e0b]" />
                                                    Verified
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleApproval(trainer.id, trainer.is_approved)}
                                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                    trainer.is_approved
                                                        ? "bg-[#fef2f2] text-[#ef4444] hover:bg-[#fee2e2]"
                                                        : "bg-[#ecfdf5] text-[#10b981] hover:bg-[#d1fae5]"
                                                }`}
                                            >
                                                {trainer.is_approved ? "Revoke" : "Approve"}
                                            </button>
                                            {trainer.is_approved && (
                                                <button
                                                    onClick={() => toggleVerification(trainer.id, trainer.profile_data?.is_verified || false)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                        trainer.profile_data?.is_verified
                                                            ? "bg-[#fef2f2] text-[#ef4444] hover:bg-[#fee2e2]"
                                                            : "bg-[#fef3c7] text-[#f59e0b] hover:bg-[#fde68a]"
                                                    }`}
                                                >
                                                    {trainer.profile_data?.is_verified ? "Unverify" : "Verify"}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {filteredTrainers.length === 0 && (
                    <div className="text-center py-12">
                        <Dumbbell size={48} className="mx-auto text-[#cbd5e1] mb-4" />
                        <p className="text-[#64748b]">No trainers found matching your criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
}
