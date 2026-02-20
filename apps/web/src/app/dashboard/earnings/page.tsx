"use client";

import { useEffect, useState } from "react";
import { getSession, AuthUser } from "@/lib/auth";
import { supabase, BookingRow } from "@/lib/supabase";

export default function EarningsPage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [completedBookings, setCompletedBookings] = useState<BookingRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const session = getSession();
        if (session) {
            setUser(session);
            loadEarnings(session);
        }
    }, []);

    const loadEarnings = async (u: AuthUser) => {
        try {
            const { data } = await supabase
                .from("bookings")
                .select("*")
                .eq("trainer_id", u.id)
                .eq("status", "completed")
                .order("scheduled_at", { ascending: false });

            setCompletedBookings((data || []) as BookingRow[]);
        } catch (err) {
            console.error("Failed to load earnings:", err);
        } finally {
            setLoading(false);
        }
    };

    const totalEarnings = completedBookings.reduce((s, b) => s + Number(b.price), 0);
    const totalFees = completedBookings.reduce((s, b) => s + Number(b.platform_fee), 0);
    const netEarnings = totalEarnings - totalFees;

    // Group by month
    const monthlyData = new Map<string, { earnings: number; sessions: number }>();
    completedBookings.forEach((b) => {
        const month = new Date(b.scheduled_at).toLocaleString("en-US", { month: "short", year: "numeric" });
        const existing = monthlyData.get(month) || { earnings: 0, sessions: 0 };
        monthlyData.set(month, {
            earnings: existing.earnings + Number(b.price),
            sessions: existing.sessions + 1,
        });
    });

    const months = Array.from(monthlyData.entries());

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
                <div style={{ width: "40px", height: "40px", border: "3px solid var(--gray-200)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: "4px" }}>Earnings</h1>
                <p style={{ color: "var(--gray-500)", fontSize: "14px" }}>Track your income from completed sessions.</p>
            </div>

            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" }}>
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "28px", border: "1px solid var(--gray-200)" }}>
                    <div style={{ fontSize: "13px", color: "var(--gray-500)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Total Earned</div>
                    <div style={{ fontSize: "32px", fontWeight: 800, fontFamily: "var(--font-display)", color: "#059669" }}>${totalEarnings.toFixed(2)}</div>
                </div>
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "28px", border: "1px solid var(--gray-200)" }}>
                    <div style={{ fontSize: "13px", color: "var(--gray-500)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Platform Fees</div>
                    <div style={{ fontSize: "32px", fontWeight: 800, fontFamily: "var(--font-display)", color: "#f59e0b" }}>-${totalFees.toFixed(2)}</div>
                </div>
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "28px", border: "1px solid var(--gray-200)" }}>
                    <div style={{ fontSize: "13px", color: "var(--gray-500)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Net Earnings</div>
                    <div style={{ fontSize: "32px", fontWeight: 800, fontFamily: "var(--font-display)", background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>${netEarnings.toFixed(2)}</div>
                </div>
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "28px", border: "1px solid var(--gray-200)" }}>
                    <div style={{ fontSize: "13px", color: "var(--gray-500)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Completed Sessions</div>
                    <div style={{ fontSize: "32px", fontWeight: 800, fontFamily: "var(--font-display)" }}>{completedBookings.length}</div>
                </div>
            </div>

            {/* Monthly Breakdown */}
            {months.length > 0 && (
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", marginBottom: "32px", overflow: "hidden" }}>
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--gray-100)" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-display)" }}>Monthly Breakdown</h3>
                    </div>
                    <div>
                        {months.map(([month, data], i) => (
                            <div key={month} style={{ padding: "16px 24px", borderBottom: i < months.length - 1 ? "1px solid var(--gray-50)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: "14px" }}>{month}</div>
                                    <div style={{ fontSize: "12px", color: "var(--gray-400)" }}>{data.sessions} session{data.sessions !== 1 ? "s" : ""}</div>
                                </div>
                                <div style={{ fontSize: "16px", fontWeight: 700, color: "#059669" }}>${data.earnings.toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Transactions */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--gray-100)" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-display)" }}>Session History</h3>
                </div>
                {completedBookings.length === 0 ? (
                    <div style={{ padding: "48px 24px", textAlign: "center" }}>
                        <p style={{ fontSize: "40px", marginBottom: "12px" }}>💰</p>
                        <p style={{ color: "var(--gray-500)" }}>No completed sessions yet. Start accepting bookings!</p>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                            <thead>
                                <tr style={{ background: "var(--gray-50)" }}>
                                    <th style={{ textAlign: "left", padding: "12px 24px", fontWeight: 600, color: "var(--gray-500)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date</th>
                                    <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--gray-500)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Sport</th>
                                    <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--gray-500)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Duration</th>
                                    <th style={{ textAlign: "right", padding: "12px 24px", fontWeight: 600, color: "var(--gray-500)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {completedBookings.map((b) => (
                                    <tr key={b.id} style={{ borderTop: "1px solid var(--gray-50)" }}>
                                        <td style={{ padding: "12px 24px" }}>{new Date(b.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                                        <td style={{ padding: "12px 16px", textTransform: "capitalize" }}>{b.sport.replace(/_/g, " ")}</td>
                                        <td style={{ padding: "12px 16px" }}>{b.duration_minutes} min</td>
                                        <td style={{ padding: "12px 24px", textAlign: "right", fontWeight: 600, color: "#059669" }}>${Number(b.price).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
