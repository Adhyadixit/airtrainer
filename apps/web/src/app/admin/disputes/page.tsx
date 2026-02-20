"use client";

import { useEffect, useState } from "react";
import { getSession, AuthUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ShieldAlert, Search, Filter, AlertTriangle, CheckCircle, XCircle, MessageSquare } from "lucide-react";

interface Dispute {
    id: string;
    booking_id: string;
    reporter_id: string;
    reported_user_id: string;
    reason: string;
    description: string;
    status: 'open' | 'investigating' | 'resolved' | 'dismissed';
    resolution?: string;
    created_at: string;
    updated_at: string;
    reporter?: {
        first_name: string;
        last_name: string;
        email: string;
    };
    reported_user?: {
        first_name: string;
        last_name: string;
        email: string;
    };
    booking?: {
        sport: string;
        scheduled_at: string;
    };
}

export default function AdminDisputesPage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [resolution, setResolution] = useState("");
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const session = getSession();
        if (session) {
            setUser(session);
            loadDisputes();
        }
    }, []);

    const loadDisputes = async () => {
        try {
            // Since we don't have a disputes table, we'll create mock data for demonstration
            const mockDisputes: Dispute[] = [
                {
                    id: "1",
                    booking_id: "booking-1",
                    reporter_id: "user-1",
                    reported_user_id: "user-2",
                    reason: "no_show",
                    description: "Trainer did not show up for the scheduled session",
                    status: "open",
                    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    reporter: {
                        first_name: "John",
                        last_name: "Doe",
                        email: "john@example.com",
                    },
                    reported_user: {
                        first_name: "Jane",
                        last_name: "Smith",
                        email: "jane@example.com",
                    },
                    booking: {
                        sport: "Basketball",
                        scheduled_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                    },
                },
                {
                    id: "2",
                    booking_id: "booking-2",
                    reporter_id: "user-3",
                    reported_user_id: "user-4",
                    reason: "unprofessional",
                    description: "Trainer was unprofessional and cancelled last minute",
                    status: "investigating",
                    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                    reporter: {
                        first_name: "Alice",
                        last_name: "Johnson",
                        email: "alice@example.com",
                    },
                    reported_user: {
                        first_name: "Bob",
                        last_name: "Wilson",
                        email: "bob@example.com",
                    },
                    booking: {
                        sport: "Tennis",
                        scheduled_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
                    },
                },
                {
                    id: "3",
                    booking_id: "booking-3",
                    reporter_id: "user-5",
                    reported_user_id: "user-6",
                    reason: "payment_issue",
                    description: "Charged extra amount without consent",
                    status: "resolved",
                    resolution: "Refund processed and trainer warned",
                    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                    updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
                    reporter: {
                        first_name: "Charlie",
                        last_name: "Brown",
                        email: "charlie@example.com",
                    },
                    reported_user: {
                        first_name: "Diana",
                        last_name: "Miller",
                        email: "diana@example.com",
                    },
                    booking: {
                        sport: "Soccer",
                        scheduled_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
                    },
                },
            ];
            setDisputes(mockDisputes);
        } catch (err) {
            console.error("Failed to load disputes:", err);
        } finally {
            setLoading(false);
        }
    };

    const updateDisputeStatus = async (disputeId: string, newStatus: string, resolutionText?: string) => {
        setUpdating(true);
        try {
            // In a real implementation, this would update the database
            setDisputes(prev => 
                prev.map(d => 
                    d.id === disputeId 
                        ? { ...d, status: newStatus as any, resolution: resolutionText, updated_at: new Date().toISOString() }
                        : d
                )
            );
            
            if (selectedDispute?.id === disputeId) {
                setSelectedDispute(prev => prev ? { ...prev, status: newStatus as any, resolution: resolutionText } : null);
            }
            
            setResolution("");
            setSelectedDispute(null);
        } catch (err) {
            console.error("Failed to update dispute:", err);
        } finally {
            setUpdating(false);
        }
    };

    const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
        open: { bg: "#fef3c7", text: "#d97706", icon: <AlertTriangle size={16} /> },
        investigating: { bg: "#dbeafe", text: "#2563eb", icon: <MessageSquare size={16} /> },
        resolved: { bg: "#d1fae5", text: "#059669", icon: <CheckCircle size={16} /> },
        dismissed: { bg: "#fee2e2", text: "#dc2626", icon: <XCircle size={16} /> },
    };

    const reasonLabels: Record<string, string> = {
        no_show: "No Show",
        unprofessional: "Unprofessional Behavior",
        payment_issue: "Payment Issue",
        safety_concern: "Safety Concern",
        other: "Other",
    };

    const filteredDisputes = disputes.filter(dispute => {
        const matchesSearch = `${dispute.reporter?.first_name} ${dispute.reporter?.last_name} ${dispute.reported_user?.first_name} ${dispute.reported_user?.last_name} ${dispute.reason}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || dispute.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: disputes.length,
        open: disputes.filter(d => d.status === 'open').length,
        investigating: disputes.filter(d => d.status === 'investigating').length,
        resolved: disputes.filter(d => d.status === 'resolved').length,
        dismissed: disputes.filter(d => d.status === 'dismissed').length,
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
                    <h2 className="text-3xl font-black text-[#0f172a] tracking-tight mb-2">Dispute Management</h2>
                    <p className="text-[#64748b] text-lg">
                        Handle and resolve platform disputes
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                            <ShieldAlert size={24} className="text-[#3b82f6]" />
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
                            <AlertTriangle size={24} className="text-[#f59e0b]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">{stats.open}</p>
                            <p className="text-sm text-[#64748b]">Open</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#dbeafe] flex items-center justify-center">
                            <MessageSquare size={24} className="text-[#2563eb]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">{stats.investigating}</p>
                            <p className="text-sm text-[#64748b]">Investigating</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#d1fae5] flex items-center justify-center">
                            <CheckCircle size={24} className="text-[#10b981]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">{stats.resolved}</p>
                            <p className="text-sm text-[#64748b]">Resolved</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#fee2e2] flex items-center justify-center">
                            <XCircle size={24} className="text-[#dc2626]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0f172a]">{stats.dismissed}</p>
                            <p className="text-sm text-[#64748b]">Dismissed</p>
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
                                placeholder="Search disputes by reporter, reported user, or reason..."
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
                            <option value="open">Open</option>
                            <option value="investigating">Investigating</option>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Disputes Table */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Dispute ID</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Reporter</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Reported User</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Created</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0]">
                            {filteredDisputes.map((dispute) => (
                                <tr key={dispute.id} className="hover:bg-[#f8fafc] transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-sm text-[#64748b]">
                                            #{dispute.id.padStart(6, '0')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-[#0f172a]">
                                                {dispute.reporter?.first_name} {dispute.reporter?.last_name}
                                            </p>
                                            <p className="text-sm text-[#64748b]">{dispute.reporter?.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-[#0f172a]">
                                                {dispute.reported_user?.first_name} {dispute.reported_user?.last_name}
                                            </p>
                                            <p className="text-sm text-[#64748b]">{dispute.reported_user?.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-[#0f172a]">
                                            {reasonLabels[dispute.reason] || dispute.reason}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium"
                                            style={{
                                                backgroundColor: statusColors[dispute.status]?.bg,
                                                color: statusColors[dispute.status]?.text,
                                            }}
                                        >
                                            {statusColors[dispute.status]?.icon}
                                            {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-[#64748b]">
                                            {new Date(dispute.created_at).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSelectedDispute(dispute)}
                                                className="px-3 py-1 rounded-lg text-xs font-medium bg-[#eff6ff] text-[#3b82f6] hover:bg-[#dbeafe] transition-colors"
                                            >
                                                View Details
                                            </button>
                                            {dispute.status === 'open' && (
                                                <button
                                                    onClick={() => updateDisputeStatus(dispute.id, 'investigating')}
                                                    className="px-3 py-1 rounded-lg text-xs font-medium bg-[#dbeafe] text-[#2563eb] hover:bg-[#bfdbfe] transition-colors"
                                                >
                                                    Investigate
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {filteredDisputes.length === 0 && (
                    <div className="text-center py-12">
                        <ShieldAlert size={48} className="mx-auto text-[#cbd5e1] mb-4" />
                        <p className="text-[#64748b]">No disputes found matching your criteria</p>
                    </div>
                )}
            </div>

            {/* Dispute Details Modal */}
            {selectedDispute && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-[#e2e8f0]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-[#0f172a]">Dispute Details</h3>
                                <button
                                    onClick={() => setSelectedDispute(null)}
                                    className="text-[#64748b] hover:text-[#0f172a]"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-[#64748b] mb-2">Status</label>
                                <span
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium"
                                    style={{
                                        backgroundColor: statusColors[selectedDispute.status]?.bg,
                                        color: statusColors[selectedDispute.status]?.text,
                                    }}
                                >
                                    {statusColors[selectedDispute.status]?.icon}
                                    {selectedDispute.status.charAt(0).toUpperCase() + selectedDispute.status.slice(1)}
                                </span>
                            </div>

                            {/* Parties */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#64748b] mb-2">Reporter</label>
                                    <div className="bg-[#f8fafc] rounded-lg p-3">
                                        <p className="font-medium text-[#0f172a]">
                                            {selectedDispute.reporter?.first_name} {selectedDispute.reporter?.last_name}
                                        </p>
                                        <p className="text-sm text-[#64748b]">{selectedDispute.reporter?.email}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#64748b] mb-2">Reported User</label>
                                    <div className="bg-[#f8fafc] rounded-lg p-3">
                                        <p className="font-medium text-[#0f172a]">
                                            {selectedDispute.reported_user?.first_name} {selectedDispute.reported_user?.last_name}
                                        </p>
                                        <p className="text-sm text-[#64748b]">{selectedDispute.reported_user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium text-[#64748b] mb-2">Reason</label>
                                <p className="font-medium text-[#0f172a]">{reasonLabels[selectedDispute.reason] || selectedDispute.reason}</p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-[#64748b] mb-2">Description</label>
                                <p className="text-[#64748b] bg-[#f8fafc] rounded-lg p-3">{selectedDispute.description}</p>
                            </div>

                            {/* Booking Info */}
                            {selectedDispute.booking && (
                                <div>
                                    <label className="block text-sm font-medium text-[#64748b] mb-2">Related Booking</label>
                                    <div className="bg-[#f8fafc] rounded-lg p-3">
                                        <p className="font-medium text-[#0f172a]">{selectedDispute.booking.sport}</p>
                                        <p className="text-sm text-[#64748b]">
                                            {new Date(selectedDispute.booking.scheduled_at).toLocaleDateString()} at{' '}
                                            {new Date(selectedDispute.booking.scheduled_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Resolution */}
                            {selectedDispute.resolution && (
                                <div>
                                    <label className="block text-sm font-medium text-[#64748b] mb-2">Resolution</label>
                                    <p className="text-[#64748b] bg-[#d1fae5] rounded-lg p-3">{selectedDispute.resolution}</p>
                                </div>
                            )}

                            {/* Actions */}
                            {selectedDispute.status !== 'resolved' && selectedDispute.status !== 'dismissed' && (
                                <div>
                                    <label className="block text-sm font-medium text-[#64748b] mb-2">Resolution</label>
                                    <textarea
                                        value={resolution}
                                        onChange={(e) => setResolution(e.target.value)}
                                        placeholder="Enter resolution details..."
                                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Modal Actions */}
                        <div className="p-6 border-t border-[#e2e8f0] flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedDispute(null)}
                                className="px-4 py-2 rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] transition-colors"
                            >
                                Close
                            </button>
                            
                            {selectedDispute.status === 'open' && (
                                <button
                                    onClick={() => updateDisputeStatus(selectedDispute.id, 'investigating')}
                                    disabled={updating}
                                    className="px-4 py-2 rounded-lg bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
                                >
                                    {updating ? 'Updating...' : 'Start Investigation'}
                                </button>
                            )}
                            
                            {selectedDispute.status === 'investigating' && (
                                <>
                                    <button
                                        onClick={() => updateDisputeStatus(selectedDispute.id, 'resolved', resolution)}
                                        disabled={updating || !resolution}
                                        className="px-4 py-2 rounded-lg bg-[#10b981] text-white hover:bg-[#059669] transition-colors disabled:opacity-50"
                                    >
                                        {updating ? 'Updating...' : 'Resolve'}
                                    </button>
                                    <button
                                        onClick={() => updateDisputeStatus(selectedDispute.id, 'dismissed', resolution)}
                                        disabled={updating || !resolution}
                                        className="px-4 py-2 rounded-lg bg-[#ef4444] text-white hover:bg-[#dc2626] transition-colors disabled:opacity-50"
                                    >
                                        {updating ? 'Updating...' : 'Dismiss'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
