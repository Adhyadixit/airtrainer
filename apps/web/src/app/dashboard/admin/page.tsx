"use client";

import { useEffect, useState } from "react";
import { getSession, AuthUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface AdminStats {
    totalUsers: number;
    totalTrainers: number;
    totalAthletes: number;
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    totalRevenue: number;
    pendingVerifications: number;
    openDisputes: number;
}

interface UserRow {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    email_verified: boolean;
    created_at: string;
}

interface TrainerRow {
    user_id: string;
    is_verified: boolean;
    verification_status: string;
    sports: string[];
    hourly_rate: number;
    user?: { first_name: string; last_name: string; email: string };
}

export default function AdminPage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [pendingTrainers, setPendingTrainers] = useState<TrainerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"overview" | "users" | "trainers" | "bookings">("overview");
    const router = useRouter();

    useEffect(() => {
        const session = getSession();
        if (!session || session.role !== "admin") {
            router.push("/dashboard");
            return;
        }
        setUser(session);
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        try {
            // Get counts
            const [usersRes, trainersRes, athletesRes, bookingsRes, completedRes, pendingRes, revenueRes, pendingVerRes, disputesRes] = await Promise.all([
                supabase.from("users").select("id", { count: "exact", head: true }),
                supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "trainer"),
                supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "athlete"),
                supabase.from("bookings").select("id", { count: "exact", head: true }),
                supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "completed"),
                supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
                supabase.from("bookings").select("price").eq("status", "completed"),
                supabase.from("trainer_profiles").select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
                supabase.from("disputes").select("id", { count: "exact", head: true }).eq("status", "under_review"),
            ]);

            const totalRevenue = ((revenueRes.data || []) as { price: number }[]).reduce((s, b) => s + Number(b.price), 0);

            setStats({
                totalUsers: usersRes.count || 0,
                totalTrainers: trainersRes.count || 0,
                totalAthletes: athletesRes.count || 0,
                totalBookings: bookingsRes.count || 0,
                completedBookings: completedRes.count || 0,
                pendingBookings: pendingRes.count || 0,
                totalRevenue,
                pendingVerifications: pendingVerRes.count || 0,
                openDisputes: disputesRes.count || 0,
            });

            // Load user list
            const { data: allUsers } = await supabase
                .from("users")
                .select("id, email, first_name, last_name, role, email_verified, created_at")
                .order("created_at", { ascending: false })
                .limit(50);
            setUsers((allUsers || []) as UserRow[]);

            // Load pending trainer verifications
            const { data: ptData } = await supabase
                .from("trainer_profiles")
                .select("*")
                .eq("verification_status", "pending");

            if (ptData && ptData.length > 0) {
                const trainerIds = (ptData as TrainerRow[]).map((t) => t.user_id);
                const { data: trainerUsers } = await supabase
                    .from("users")
                    .select("id, first_name, last_name, email")
                    .in("id", trainerIds);

                const uMap = new Map(
                    (trainerUsers || []).map((u: { id: string; first_name: string; last_name: string; email: string }) => [u.id, u])
                );
                setPendingTrainers(
                    (ptData as TrainerRow[]).map((t) => ({
                        ...t,
                        user: uMap.get(t.user_id) as { first_name: string; last_name: string; email: string } | undefined,
                    }))
                );
            }
        } catch (err) {
            console.error("Admin data error:", err);
        } finally {
            setLoading(false);
        }
    };

    const verifyTrainer = async (userId: string, decision: "approve" | "reject") => {
        try {
            await supabase.from("trainer_profiles").update({
                verification_status: decision === "approve" ? "verified" : "rejected",
                is_verified: decision === "approve",
            }).eq("user_id", userId);

            setPendingTrainers((prev) => prev.filter((t) => t.user_id !== userId));
            if (stats) {
                setStats({ ...stats, pendingVerifications: Math.max(0, stats.pendingVerifications - 1) });
            }
        } catch (err) {
            console.error("Verification failed:", err);
        }
    };

    const tabStyle = (active: boolean): React.CSSProperties => ({
        padding: "10px 20px",
        borderRadius: "var(--radius-md)",
        border: "none",
        background: active ? "var(--primary)" : "transparent",
        color: active ? "white" : "var(--gray-500)",
        fontWeight: 600,
        fontSize: "14px",
        cursor: "pointer",
        transition: "all var(--transition-fast)",
    });

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
                <h1 style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: "4px" }}>
                    🛡️ Admin Dashboard
                </h1>
                <p style={{ color: "var(--gray-500)", fontSize: "14px" }}>Platform overview and management</p>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "var(--gray-50)", padding: "4px", borderRadius: "var(--radius-md)", width: "fit-content" }}>
                <button onClick={() => setTab("overview")} style={tabStyle(tab === "overview")}>Overview</button>
                <button onClick={() => setTab("users")} style={tabStyle(tab === "users")}>Users</button>
                <button onClick={() => setTab("trainers")} style={tabStyle(tab === "trainers")}>
                    Verifications {stats && stats.pendingVerifications > 0 && (
                        <span style={{ background: "#ef4444", color: "white", borderRadius: "var(--radius-full)", padding: "1px 7px", fontSize: "11px", marginLeft: "4px" }}>
                            {stats.pendingVerifications}
                        </span>
                    )}
                </button>
                <button onClick={() => setTab("bookings")} style={tabStyle(tab === "bookings")}>Bookings</button>
            </div>

            {/* OVERVIEW TAB */}
            {tab === "overview" && stats && (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" }}>
                        {[
                            { label: "Total Users", value: stats.totalUsers, icon: "👥" },
                            { label: "Trainers", value: stats.totalTrainers, icon: "🏋️" },
                            { label: "Athletes", value: stats.totalAthletes, icon: "🏃" },
                            { label: "Total Bookings", value: stats.totalBookings, icon: "📅" },
                            { label: "Completed", value: stats.completedBookings, icon: "✅" },
                            { label: "Pending", value: stats.pendingBookings, icon: "⏳" },
                            { label: "Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: "💰" },
                            { label: "Open Disputes", value: stats.openDisputes, icon: "⚠️", alert: stats.openDisputes > 0 },
                        ].map((s, i) => (
                            <div key={i} style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "24px", border: `1px solid ${s.alert ? "#fecaca" : "var(--gray-200)"}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: 600, color: "var(--gray-500)", letterSpacing: "0.5px" }}>{s.label}</span>
                                    <span style={{ fontSize: "20px" }}>{s.icon}</span>
                                </div>
                                <div style={{ fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-display)", color: s.alert ? "#ef4444" : "var(--foreground)" }}>
                                    {s.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pending verifications alert */}
                    {stats.pendingVerifications > 0 && (
                        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "var(--radius-md)", padding: "16px 20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "24px" }}>⚠️</span>
                            <div>
                                <strong>{stats.pendingVerifications} trainer{stats.pendingVerifications > 1 ? "s" : ""}</strong> awaiting verification.
                                <button onClick={() => setTab("trainers")} style={{ marginLeft: "8px", color: "var(--primary)", fontWeight: 600, border: "none", background: "none", cursor: "pointer", textDecoration: "underline" }}>
                                    Review now →
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* USERS TAB */}
            {tab === "users" && (
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                        <thead>
                            <tr style={{ background: "var(--gray-50)" }}>
                                <th style={{ textAlign: "left", padding: "12px 20px", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", color: "var(--gray-500)" }}>Name</th>
                                <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", color: "var(--gray-500)" }}>Email</th>
                                <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", color: "var(--gray-500)" }}>Role</th>
                                <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", color: "var(--gray-500)" }}>Verified</th>
                                <th style={{ textAlign: "left", padding: "12px 20px", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", color: "var(--gray-500)" }}>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} style={{ borderTop: "1px solid var(--gray-50)" }}>
                                    <td style={{ padding: "12px 20px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-full)", background: u.role === "trainer" ? "var(--gradient-primary)" : "var(--gradient-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "11px" }}>
                                                {u.first_name?.[0]}{u.last_name?.[0]}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{u.first_name} {u.last_name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "12px", color: "var(--gray-500)" }}>{u.email}</td>
                                    <td style={{ padding: "12px" }}>
                                        <span style={{ padding: "3px 10px", borderRadius: "var(--radius-full)", fontSize: "12px", fontWeight: 600, textTransform: "capitalize", background: u.role === "trainer" ? "var(--primary-50)" : u.role === "admin" ? "#fef3c7" : "#dbeafe", color: u.role === "trainer" ? "var(--primary)" : u.role === "admin" ? "#d97706" : "#2563eb" }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: "12px" }}>{u.email_verified ? "✅" : "❌"}</td>
                                    <td style={{ padding: "12px 20px", fontSize: "13px", color: "var(--gray-400)" }}>
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* TRAINER VERIFICATIONS TAB */}
            {tab === "trainers" && (
                <div>
                    {pendingTrainers.length === 0 ? (
                        <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", padding: "60px 24px", textAlign: "center" }}>
                            <p style={{ fontSize: "40px", marginBottom: "12px" }}>✅</p>
                            <p style={{ color: "var(--gray-500)" }}>All trainers have been reviewed. No pending verifications.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {pendingTrainers.map((t) => (
                                <div key={t.user_id} style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", padding: "24px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                                    <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-full)", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "16px" }}>
                                        {t.user ? `${t.user.first_name[0]}${t.user.last_name[0]}` : "?"}
                                    </div>
                                    <div style={{ flex: 1, minWidth: "200px" }}>
                                        <div style={{ fontWeight: 700, fontSize: "15px" }}>
                                            {t.user ? `${t.user.first_name} ${t.user.last_name}` : "Unknown"}
                                        </div>
                                        <div style={{ fontSize: "13px", color: "var(--gray-400)" }}>{t.user?.email}</div>
                                        <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
                                            {t.sports.map((s) => (
                                                <span key={s} style={{ padding: "2px 8px", borderRadius: "var(--radius-full)", background: "var(--primary-50)", color: "var(--primary)", fontSize: "11px", fontWeight: 600, textTransform: "capitalize" }}>
                                                    {s.replace(/_/g, " ")}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: "14px", fontWeight: 600 }}>${Number(t.hourly_rate)}/hr</div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button onClick={() => verifyTrainer(t.user_id, "approve")} style={{ padding: "8px 20px", borderRadius: "var(--radius-md)", background: "#059669", color: "white", border: "none", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                                            ✓ Approve
                                        </button>
                                        <button onClick={() => verifyTrainer(t.user_id, "reject")} style={{ padding: "8px 20px", borderRadius: "var(--radius-md)", background: "#ef4444", color: "white", border: "none", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                                            ✕ Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* BOOKINGS TAB — placeholder for now */}
            {tab === "bookings" && (
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", padding: "40px 24px", textAlign: "center" }}>
                    <p style={{ fontSize: "40px", marginBottom: "12px" }}>📊</p>
                    <p style={{ color: "var(--gray-500)" }}>
                        Booking analytics and management coming in the next sprint. View bookings from the main dashboard for now.
                    </p>
                </div>
            )}
        </div>
    );
}
