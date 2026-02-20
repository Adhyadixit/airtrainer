"use client";

import { useEffect, useState } from "react";
import { getSession, AuthUser } from "@/lib/auth";
import { supabase, BookingRow } from "@/lib/supabase";

type BookingWithUser = BookingRow & {
    other_user?: { first_name: string; last_name: string; email: string };
};

export default function BookingsPage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [bookings, setBookings] = useState<BookingWithUser[]>([]);
    const [filter, setFilter] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        const session = getSession();
        if (session) {
            setUser(session);
            loadBookings(session);
        }
    }, []);

    const loadBookings = async (u: AuthUser) => {
        try {
            const column = u.role === "trainer" ? "trainer_id" : "athlete_id";
            const { data: bookingData } = await supabase
                .from("bookings")
                .select("*")
                .eq(column, u.id)
                .order("scheduled_at", { ascending: false });

            const allBookings = (bookingData || []) as BookingRow[];
            const otherIds = allBookings.map((b) => (u.role === "trainer" ? b.athlete_id : b.trainer_id));

            const { data: users } = await supabase
                .from("users")
                .select("id, first_name, last_name, email")
                .in("id", [...new Set(otherIds)]);

            const usersMap = new Map(
                (users || []).map((u: { id: string; first_name: string; last_name: string; email: string }) => [u.id, u])
            );

            setBookings(
                allBookings.map((b) => ({
                    ...b,
                    other_user: usersMap.get(u.role === "trainer" ? b.athlete_id : b.trainer_id) as BookingWithUser["other_user"],
                }))
            );
        } catch (err) {
            console.error("Failed to load bookings:", err);
        } finally {
            setLoading(false);
        }
    };

    const updateBookingStatus = async (bookingId: string, newStatus: string) => {
        setActionLoading(bookingId);
        try {
            const updates: Record<string, unknown> = { status: newStatus };
            if (newStatus === "cancelled") {
                updates.cancelled_at = new Date().toISOString();
            }

            await supabase.from("bookings").update(updates).eq("id", bookingId);

            setBookings((prev) =>
                prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus as BookingRow["status"] } : b))
            );
        } catch (err) {
            console.error("Failed to update booking:", err);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredBookings = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

    const statusColors: Record<string, { bg: string; text: string }> = {
        pending: { bg: "#fef3c7", text: "#d97706" },
        confirmed: { bg: "#dbeafe", text: "#2563eb" },
        completed: { bg: "#d1fae5", text: "#059669" },
        cancelled: { bg: "#fee2e2", text: "#dc2626" },
        no_show: { bg: "#fae8ff", text: "#9333ea" },
        disputed: { bg: "#fecaca", text: "#b91c1c" },
    };

    const filters = ["all", "pending", "confirmed", "completed", "cancelled"];

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
                <div style={{ width: "40px", height: "40px", border: "3px solid var(--gray-200)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: "4px" }}>
                        {user?.role === "trainer" ? "My Sessions" : "My Bookings"}
                    </h1>
                    <p style={{ color: "var(--gray-500)", fontSize: "14px" }}>{bookings.length} total bookings</p>
                </div>
                {user?.role === "athlete" && (
                    <a
                        href="/dashboard/search"
                        style={{
                            padding: "10px 20px",
                            borderRadius: "var(--radius-md)",
                            background: "var(--gradient-primary)",
                            color: "white",
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: "14px",
                            boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
                        }}
                    >
                        + Book Trainer
                    </a>
                )}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
                {filters.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: "8px 18px",
                            borderRadius: "var(--radius-full)",
                            border: `1px solid ${filter === f ? "var(--primary)" : "var(--gray-200)"}`,
                            background: filter === f ? "var(--primary-50)" : "var(--surface)",
                            color: filter === f ? "var(--primary)" : "var(--gray-600)",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                            textTransform: "capitalize",
                            transition: "all var(--transition-fast)",
                        }}
                    >
                        {f === "all" ? `All (${bookings.length})` : `${f} (${bookings.filter((b) => b.status === f).length})`}
                    </button>
                ))}
            </div>

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", padding: "60px 24px", textAlign: "center" }}>
                    <p style={{ fontSize: "40px", marginBottom: "12px" }}>📭</p>
                    <p style={{ color: "var(--gray-500)" }}>No {filter !== "all" ? filter : ""} bookings found.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {filteredBookings.map((booking) => {
                        const sc = statusColors[booking.status] || statusColors.pending;
                        const date = new Date(booking.scheduled_at);
                        const isPast = date < new Date();
                        const isTrainer = user?.role === "trainer";

                        return (
                            <div
                                key={booking.id}
                                style={{
                                    background: "var(--surface)",
                                    borderRadius: "var(--radius-lg)",
                                    border: "1px solid var(--gray-200)",
                                    padding: "24px",
                                    transition: "all var(--transition-fast)",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                                    {/* Left: User + details */}
                                    <div style={{ display: "flex", gap: "16px", flex: 1, minWidth: "240px" }}>
                                        <div
                                            style={{
                                                width: "48px",
                                                height: "48px",
                                                borderRadius: "var(--radius-full)",
                                                background: "var(--gradient-primary)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "white",
                                                fontWeight: 700,
                                                fontSize: "16px",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {booking.other_user ? `${booking.other_user.first_name[0]}${booking.other_user.last_name[0]}` : "?"}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>
                                                {booking.other_user ? `${booking.other_user.first_name} ${booking.other_user.last_name}` : "Unknown User"}
                                            </div>
                                            <div style={{ fontSize: "13px", color: "var(--gray-500)", display: "flex", flexWrap: "wrap", gap: "12px" }}>
                                                <span>🏀 {booking.sport}</span>
                                                <span>⏱ {booking.duration_minutes} min</span>
                                                <span>💲 ${Number(booking.total_paid).toFixed(2)}</span>
                                            </div>
                                            {booking.address && (
                                                <div style={{ fontSize: "12px", color: "var(--gray-400)", marginTop: "6px" }}>📍 {booking.address}</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Date + status + actions */}
                                    <div style={{ textAlign: "right", minWidth: "180px" }}>
                                        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                                            {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                                        </div>
                                        <div style={{ fontSize: "13px", color: "var(--gray-500)", marginBottom: "8px" }}>
                                            {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                        </div>
                                        <span
                                            style={{
                                                display: "inline-block",
                                                padding: "4px 14px",
                                                borderRadius: "var(--radius-full)",
                                                background: sc.bg,
                                                color: sc.text,
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                textTransform: "capitalize",
                                            }}
                                        >
                                            {booking.status.replace("_", " ")}
                                        </span>

                                        {/* Action buttons */}
                                        <div style={{ marginTop: "12px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                            {booking.status === "pending" && isTrainer && (
                                                <button
                                                    onClick={() => updateBookingStatus(booking.id, "confirmed")}
                                                    disabled={actionLoading === booking.id}
                                                    style={{
                                                        padding: "6px 14px",
                                                        borderRadius: "var(--radius-md)",
                                                        background: "#059669",
                                                        color: "white",
                                                        border: "none",
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    {actionLoading === booking.id ? "..." : "✓ Confirm"}
                                                </button>
                                            )}
                                            {(booking.status === "pending" || booking.status === "confirmed") && !isPast && (
                                                <button
                                                    onClick={() => updateBookingStatus(booking.id, "cancelled")}
                                                    disabled={actionLoading === booking.id}
                                                    style={{
                                                        padding: "6px 14px",
                                                        borderRadius: "var(--radius-md)",
                                                        background: "transparent",
                                                        color: "#dc2626",
                                                        border: "1px solid #fca5a5",
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            {booking.status === "confirmed" && isTrainer && isPast && (
                                                <button
                                                    onClick={() => updateBookingStatus(booking.id, "completed")}
                                                    disabled={actionLoading === booking.id}
                                                    style={{
                                                        padding: "6px 14px",
                                                        borderRadius: "var(--radius-md)",
                                                        background: "var(--gradient-primary)",
                                                        color: "white",
                                                        border: "none",
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Mark Complete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {booking.athlete_notes && (
                                    <div style={{ marginTop: "16px", padding: "12px 16px", background: "var(--gray-50)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--gray-600)" }}>
                                        <strong>Notes:</strong> {booking.athlete_notes}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
