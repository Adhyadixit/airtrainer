"use client";

import { useEffect, useState } from "react";
import { getSession, AuthUser } from "@/lib/auth";
import { supabase, NotificationRow } from "@/lib/supabase";

export default function NotificationsPage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [notifications, setNotifications] = useState<NotificationRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const session = getSession();
        if (session) {
            setUser(session);
            loadNotifications(session);
        }
    }, []);

    const loadNotifications = async (u: AuthUser) => {
        try {
            const { data } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", u.id)
                .order("created_at", { ascending: false })
                .limit(50);
            setNotifications((data || []) as NotificationRow[]);
        } catch (err) {
            console.error("Failed to load notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        await supabase.from("notifications").update({ read: true }).eq("id", id);
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    };

    const markAllRead = async () => {
        if (!user) return;
        await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const clearAllNotifications = async () => {
        if (!user) return;
        try {
            await supabase.from("notifications").delete().eq("user_id", user.id);
            setNotifications([]);
        } catch (err) {
            console.error("Failed to clear notifications:", err);
        }
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    const typeIcons: Record<string, string> = {
        BOOKING_CONFIRMED: "✅",
        BOOKING_CANCELLED: "❌",
        BOOKING_COMPLETED: "🎉",
        NEW_REQUEST_NEARBY: "📍",
        REVIEW_RECEIVED: "⭐",
        PAYMENT_RECEIVED: "💰",
        NEW_MESSAGE: "💬",
    };

    const timeAgo = (date: string) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return "just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
                <div style={{ width: "40px", height: "40px", border: "3px solid var(--gray-200)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "700px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: "4px" }}>Notifications</h1>
                    <p style={{ color: "var(--gray-500)", fontSize: "14px" }}>
                        {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                    </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    {unreadCount > 0 && (
                        <button onClick={markAllRead} style={{ padding: "8px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-200)", background: "var(--surface)", color: "var(--primary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                            Mark all read
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button onClick={clearAllNotifications} style={{ padding: "8px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-200)", background: "var(--surface)", color: "var(--error)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            {notifications.length === 0 ? (
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", padding: "60px 24px", textAlign: "center" }}>
                    <p style={{ fontSize: "40px", marginBottom: "12px" }}>🔔</p>
                    <p style={{ color: "var(--gray-500)" }}>No notifications yet.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", overflow: "hidden" }}>
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            onClick={() => !n.read && markAsRead(n.id)}
                            style={{
                                padding: "16px 20px",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "14px",
                                background: n.read ? "transparent" : "var(--primary-50)",
                                borderBottom: "1px solid var(--gray-50)",
                                cursor: n.read ? "default" : "pointer",
                                transition: "background var(--transition-fast)",
                            }}
                        >
                            <span style={{ fontSize: "22px", flexShrink: 0, marginTop: "2px" }}>
                                {typeIcons[n.type] || "🔔"}
                            </span>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                    <span style={{ fontSize: "14px", fontWeight: n.read ? 500 : 700 }}>{n.title}</span>
                                    {!n.read && (
                                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
                                    )}
                                </div>
                                <p style={{ fontSize: "13px", color: "var(--gray-500)", lineHeight: 1.4 }}>{n.body}</p>
                            </div>
                            <span style={{ fontSize: "12px", color: "var(--gray-400)", whiteSpace: "nowrap", flexShrink: 0 }}>
                                {timeAgo(n.created_at)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
