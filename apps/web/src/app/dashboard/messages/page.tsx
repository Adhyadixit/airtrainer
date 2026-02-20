"use client";

import { useEffect, useState, useRef } from "react";
import { getSession, AuthUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface Conversation {
    bookingId: string;
    otherUserId: string;
    otherUserName: string;
    otherUserInitials: string;
    sport: string;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
}

interface Message {
    id: string;
    booking_id: string;
    sender_id: string;
    content: string;
    created_at: string;
}

export default function MessagesPage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const session = getSession();
        if (session) {
            setUser(session);
            loadConversations(session);
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Subscribe to real-time messages
    useEffect(() => {
        if (!selectedBookingId) return;

        const subscription = supabase
            .channel(`messages:${selectedBookingId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `booking_id=eq.${selectedBookingId}`,
                },
                (payload) => {
                    const newMessage = payload.new as Message;
                    // Only add if not already in list (prevent duplicates)
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === newMessage.id)) {
                            return prev;
                        }
                        return [...prev, newMessage];
                    });

                    // Update conversation last message
                    setConversations((prev) =>
                        prev.map((c) =>
                            c.bookingId === selectedBookingId
                                ? { ...c, lastMessage: newMessage.content, lastMessageAt: newMessage.created_at }
                                : c
                        )
                    );
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [selectedBookingId]);

    const loadConversations = async (u: AuthUser) => {
        try {
            // Get all bookings where user is involved
            const isTrainer = u.role === "trainer";
            const col = isTrainer ? "trainer_id" : "athlete_id";
            const otherCol = isTrainer ? "athlete_id" : "trainer_id";

            const { data: bookings } = await supabase
                .from("bookings")
                .select("id, trainer_id, athlete_id, sport, status")
                .eq(col, u.id)
                .in("status", ["confirmed", "completed", "pending"]);

            if (!bookings || bookings.length === 0) {
                setLoading(false);
                return;
            }

            const otherUserIds = bookings.map((b: Record<string, string>) => b[otherCol]);
            const { data: otherUsers } = await supabase
                .from("users")
                .select("id, first_name, last_name")
                .in("id", [...new Set(otherUserIds)]);

            const userMap = new Map(
                (otherUsers || []).map((u: { id: string; first_name: string; last_name: string }) => [u.id, u])
            );

            // Get last messages for each booking
            const bookingIds = bookings.map((b: { id: string }) => b.id);
            const { data: allMessages } = await supabase
                .from("messages")
                .select("*")
                .in("booking_id", bookingIds)
                .order("created_at", { ascending: false });

            const convos: Conversation[] = bookings.map((b: Record<string, string>) => {
                const other = userMap.get(b[otherCol]) as { first_name: string; last_name: string } | undefined;
                const bookingMessages = (allMessages || []).filter((m: Message) => m.booking_id === b.id);
                const lastMsg = bookingMessages[0];

                return {
                    bookingId: b.id,
                    otherUserId: b[otherCol],
                    otherUserName: other ? `${other.first_name} ${other.last_name}` : "Unknown",
                    otherUserInitials: other ? `${other.first_name[0]}${other.last_name[0]}` : "?",
                    sport: b.sport,
                    lastMessage: lastMsg?.content || "No messages yet",
                    lastMessageAt: lastMsg?.created_at || b.id,
                    unreadCount: 0,
                };
            });

            convos.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
            setConversations(convos);

            if (convos.length > 0 && !selectedBookingId) {
                setSelectedBookingId(convos[0].bookingId);
                loadMessages(convos[0].bookingId);
            }
        } catch (err) {
            console.error("Failed to load conversations:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (bookingId: string) => {
        const { data } = await supabase
            .from("messages")
            .select("*")
            .eq("booking_id", bookingId)
            .order("created_at", { ascending: true });
        setMessages((data || []) as Message[]);
    };

    const selectConversation = (bookingId: string) => {
        setSelectedBookingId(bookingId);
        loadMessages(bookingId);
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !user || !selectedBookingId) return;
        setSending(true);

        try {
            const { data, error } = await supabase
                .from("messages")
                .insert({
                    booking_id: selectedBookingId,
                    sender_id: user.id,
                    content: newMessage.trim(),
                })
                .select()
                .single();

            if (error) throw error;
            setMessages((prev) => [...prev, data as Message]);
            setNewMessage("");

            // Update conversation list
            setConversations((prev) =>
                prev.map((c) =>
                    c.bookingId === selectedBookingId
                        ? { ...c, lastMessage: newMessage.trim(), lastMessageAt: new Date().toISOString() }
                        : c
                )
            );
        } catch (err) {
            console.error("Send failed:", err);
        } finally {
            setSending(false);
        }
    };

    const selectedConvo = conversations.find((c) => c.bookingId === selectedBookingId);

    const timeFormat = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        if (diff < 86400000) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        if (diff < 604800000) return d.toLocaleDateString("en-US", { weekday: "short" });
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
                <div style={{ width: "40px", height: "40px", border: "3px solid var(--gray-200)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: "4px" }}>Messages</h1>
                <p style={{ color: "var(--gray-500)", fontSize: "14px" }}>Chat with your {user?.role === "trainer" ? "athletes" : "trainers"}</p>
            </div>

            {conversations.length === 0 ? (
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", padding: "60px 24px", textAlign: "center" }}>
                    <p style={{ fontSize: "48px", marginBottom: "12px" }}>💬</p>
                    <h3 style={{ fontWeight: 700, marginBottom: "8px", fontFamily: "var(--font-display)" }}>No conversations yet</h3>
                    <p style={{ color: "var(--gray-500)", fontSize: "14px" }}>
                        Conversations will appear here once you have active bookings.
                    </p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", height: "calc(100vh - 200px)", background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", overflow: "hidden" }}>
                    {/* Sidebar */}
                    <div style={{ borderRight: "1px solid var(--gray-100)", overflowY: "auto" }}>
                        {conversations.map((c) => (
                            <div
                                key={c.bookingId}
                                onClick={() => selectConversation(c.bookingId)}
                                style={{
                                    padding: "14px 16px",
                                    display: "flex",
                                    gap: "12px",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    borderBottom: "1px solid var(--gray-50)",
                                    background: c.bookingId === selectedBookingId ? "var(--primary-50)" : "transparent",
                                    transition: "background var(--transition-fast)",
                                }}
                            >
                                <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-full)", background: "var(--gradient-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>
                                    {c.otherUserInitials}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                                        <span style={{ fontWeight: 600, fontSize: "14px" }}>{c.otherUserName}</span>
                                        <span style={{ fontSize: "11px", color: "var(--gray-400)" }}>{timeFormat(c.lastMessageAt)}</span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: "var(--gray-400)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {c.lastMessage}
                                    </div>
                                    <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 600, textTransform: "capitalize" }}>{c.sport.replace(/_/g, " ")}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat area */}
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {/* Chat header */}
                        {selectedConvo && (
                            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--gray-100)", display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-full)", background: "var(--gradient-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "12px" }}>
                                    {selectedConvo.otherUserInitials}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: "14px" }}>{selectedConvo.otherUserName}</div>
                                    <div style={{ fontSize: "12px", color: "var(--gray-400)", textTransform: "capitalize" }}>
                                        {selectedConvo.sport.replace(/_/g, " ")} session
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            {messages.length === 0 && (
                                <div style={{ textAlign: "center", color: "var(--gray-400)", marginTop: "40px" }}>
                                    <p style={{ fontSize: "28px", marginBottom: "8px" }}>👋</p>
                                    <p style={{ fontSize: "14px" }}>Start the conversation!</p>
                                </div>
                            )}
                            {messages.map((m) => {
                                const isOwn = m.sender_id === user?.id;
                                return (
                                    <div key={m.id} style={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start" }}>
                                        <div
                                            style={{
                                                maxWidth: "70%",
                                                padding: "10px 16px",
                                                borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                                background: isOwn ? "var(--gradient-primary)" : "var(--gray-100)",
                                                color: isOwn ? "white" : "var(--foreground)",
                                                fontSize: "14px",
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            <p>{m.content}</p>
                                            <div style={{ fontSize: "10px", marginTop: "4px", opacity: 0.7, textAlign: "right" }}>
                                                {new Date(m.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--gray-100)", display: "flex", gap: "10px" }}>
                            <input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                                placeholder="Type a message..."
                                style={{ flex: 1, padding: "12px 16px", borderRadius: "var(--radius-full)", border: "1px solid var(--gray-200)", outline: "none", fontSize: "14px" }}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={sending || !newMessage.trim()}
                                style={{
                                    width: "44px", height: "44px", borderRadius: "var(--radius-full)",
                                    background: newMessage.trim() ? "var(--gradient-primary)" : "var(--gray-200)",
                                    border: "none", color: "white", fontSize: "18px", cursor: newMessage.trim() ? "pointer" : "default",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                            >
                                ➤
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
