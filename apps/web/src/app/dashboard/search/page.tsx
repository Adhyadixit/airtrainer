"use client";

import { useEffect, useState } from "react";
import { getSession, AuthUser } from "@/lib/auth";
import { supabase, TrainerProfileRow } from "@/lib/supabase";

type TrainerWithUser = TrainerProfileRow & {
    user: { first_name: string; last_name: string; avatar_url: string | null };
    avg_rating: number;
    review_count: number;
};

const SPORT_LABELS: Record<string, string> = {
    hockey: "🏒 Hockey",
    baseball: "⚾ Baseball",
    basketball: "🏀 Basketball",
    football: "🏈 Football",
    soccer: "⚽ Soccer",
    tennis: "🎾 Tennis",
    golf: "⛳ Golf",
    swimming: "🏊 Swimming",
    track_and_field: "🏃 Track & Field",
    volleyball: "🏐 Volleyball",
    lacrosse: "🥍 Lacrosse",
    wrestling: "🤼 Wrestling",
    boxing: "🥊 Boxing",
    martial_arts: "🥋 Martial Arts",
    gymnastics: "🤸 Gymnastics",
    softball: "🥎 Softball",
};

export default function SearchTrainersPage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [trainers, setTrainers] = useState<TrainerWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [sportFilter, setSportFilter] = useState<string>("");
    const [maxRate, setMaxRate] = useState<number>(200);
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [bookingModal, setBookingModal] = useState<TrainerWithUser | null>(null);
    const [bookingForm, setBookingForm] = useState({ date: "", time: "", duration: "60", sport: "", notes: "" });
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    useEffect(() => {
        const session = getSession();
        if (session) {
            setUser(session);
            loadTrainers();
        }
    }, []);

    const loadTrainers = async () => {
        try {
            const { data: profiles } = await supabase
                .from("trainer_profiles")
                .select("*")
                .in("subscription_status", ["trial", "active"]);

            if (!profiles || profiles.length === 0) { setTrainers([]); setLoading(false); return; }

            const userIds = profiles.map((p: TrainerProfileRow) => p.user_id);
            const { data: users } = await supabase
                .from("users")
                .select("id, first_name, last_name, avatar_url")
                .in("id", userIds);

            const { data: reviews } = await supabase
                .from("reviews")
                .select("reviewee_id, rating")
                .in("reviewee_id", userIds);

            const usersMap = new Map((users || []).map((u: { id: string; first_name: string; last_name: string; avatar_url: string | null }) => [u.id, u]));

            // Calculate average ratings
            const ratingMap = new Map<string, { sum: number; count: number }>();
            (reviews || []).forEach((r: { reviewee_id: string; rating: number }) => {
                const existing = ratingMap.get(r.reviewee_id) || { sum: 0, count: 0 };
                ratingMap.set(r.reviewee_id, { sum: existing.sum + r.rating, count: existing.count + 1 });
            });

            const enriched: TrainerWithUser[] = (profiles as TrainerProfileRow[]).map((p) => ({
                ...p,
                user: usersMap.get(p.user_id) as TrainerWithUser["user"],
                avg_rating: ratingMap.has(p.user_id)
                    ? Math.round((ratingMap.get(p.user_id)!.sum / ratingMap.get(p.user_id)!.count) * 10) / 10
                    : 0,
                review_count: ratingMap.get(p.user_id)?.count || 0,
            }));

            setTrainers(enriched);
        } catch (err) {
            console.error("Failed to load trainers:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredTrainers = trainers.filter((t) => {
        if (sportFilter && !t.sports.includes(sportFilter)) return false;
        if (Number(t.hourly_rate) > maxRate) return false;
        if (verifiedOnly && !t.is_verified) return false;
        return true;
    });

    const handleBookTrainer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookingModal || !user) return;
        setBookingLoading(true);

        try {
            const scheduledAt = new Date(`${bookingForm.date}T${bookingForm.time}`).toISOString();
            const rate = Number(bookingModal.hourly_rate);
            const duration = Number(bookingForm.duration);
            const price = (rate * duration) / 60;
            const platformFee = price * 0.03;
            const totalPaid = price + platformFee;

            await supabase.from("bookings").insert({
                athlete_id: user.id,
                trainer_id: bookingModal.user_id,
                sport: bookingForm.sport || bookingModal.sports[0],
                scheduled_at: scheduledAt,
                duration_minutes: duration,
                price: price.toFixed(2),
                platform_fee: platformFee.toFixed(2),
                total_paid: totalPaid.toFixed(2),
                athlete_notes: bookingForm.notes || null,
                status: "pending",
            });

            // Dummy payment success — no Stripe
            setBookingSuccess(true);
            setTimeout(() => {
                setBookingModal(null);
                setBookingSuccess(false);
                setBookingForm({ date: "", time: "", duration: "60", sport: "", notes: "" });
            }, 2000);
        } catch (err) {
            console.error("Booking failed:", err);
        } finally {
            setBookingLoading(false);
        }
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
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: "4px" }}>Find Trainers</h1>
                <p style={{ color: "var(--gray-500)", fontSize: "14px" }}>
                    Discover verified trainers near you. {trainers.length} trainers available.
                </p>
            </div>

            {/* Filters */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", padding: "20px 24px", marginBottom: "24px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "end" }}>
                <div style={{ flex: 1, minWidth: "140px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--gray-500)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Sport</label>
                    <select
                        value={sportFilter}
                        onChange={(e) => setSportFilter(e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-200)", fontSize: "14px", outline: "none", background: "var(--surface)", color: "var(--foreground)" }}
                    >
                        <option value="">All Sports</option>
                        {Object.entries(SPORT_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                </div>
                <div style={{ flex: 1, minWidth: "140px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--gray-500)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Max Rate: ${maxRate}/hr</label>
                    <input
                        type="range"
                        min={20}
                        max={200}
                        value={maxRate}
                        onChange={(e) => setMaxRate(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--primary)" }}
                    />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                        type="checkbox"
                        id="verified-only"
                        checked={verifiedOnly}
                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                        style={{ accentColor: "var(--primary)", width: "16px", height: "16px" }}
                    />
                    <label htmlFor="verified-only" style={{ fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>Verified Only</label>
                </div>
            </div>

            {/* Results */}
            {filteredTrainers.length === 0 ? (
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", padding: "60px 24px", textAlign: "center" }}>
                    <p style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</p>
                    <p style={{ color: "var(--gray-500)" }}>No trainers match your filters. Try broadening your search.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px", alignItems: "stretch" }}>
                    {filteredTrainers.map((trainer) => (
                        <div
                            key={trainer.id}
                            style={{
                                background: "var(--surface)",
                                borderRadius: "var(--radius-lg)",
                                border: "1px solid var(--gray-200)",
                                overflow: "hidden",
                                transition: "all var(--transition-fast)",
                                display: "flex",
                                flexDirection: "column",
                                height: "100%",
                            }}
                        >
                            {/* Card header */}
                            <div style={{ padding: "24px", borderBottom: "1px solid var(--gray-50)" }}>
                                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                                    <div
                                        style={{
                                            width: "56px",
                                            height: "56px",
                                            borderRadius: "var(--radius-full)",
                                            background: "var(--gradient-primary)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "white",
                                            fontWeight: 700,
                                            fontSize: "18px",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {trainer.user?.first_name?.[0]}{trainer.user?.last_name?.[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                            <span style={{ fontSize: "17px", fontWeight: 700 }}>
                                                {trainer.user?.first_name} {trainer.user?.last_name}
                                            </span>
                                            {trainer.is_verified && (
                                                <span title="Verified" style={{ fontSize: "14px" }}>✅</span>
                                            )}
                                        </div>
                                        {trainer.headline && (
                                            <div style={{ fontSize: "13px", color: "var(--gray-500)", lineHeight: 1.4 }}>{trainer.headline}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card body */}
                            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", flex: 1 }}>
                                <div style={{ display: "flex", gap: "20px", marginBottom: "16px", flexWrap: "wrap" }}>
                                    <div>
                                        <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--primary)" }}>${Number(trainer.hourly_rate).toFixed(0)}</div>
                                        <div style={{ fontSize: "11px", color: "var(--gray-400)" }}>per hour</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "22px", fontWeight: 800 }}>{trainer.avg_rating || "—"}</div>
                                        <div style={{ fontSize: "11px", color: "var(--gray-400)" }}>⭐ ({trainer.review_count})</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "22px", fontWeight: 800 }}>{trainer.years_experience}</div>
                                        <div style={{ fontSize: "11px", color: "var(--gray-400)" }}>years exp</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "22px", fontWeight: 800 }}>{trainer.total_sessions}</div>
                                        <div style={{ fontSize: "11px", color: "var(--gray-400)" }}>sessions</div>
                                    </div>
                                </div>

                                {/* Sports */}
                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
                                    {trainer.sports.map((sport) => (
                                        <span key={sport} style={{ padding: "4px 10px", borderRadius: "var(--radius-full)", background: "var(--primary-50)", color: "var(--primary)", fontSize: "12px", fontWeight: 600 }}>
                                            {SPORT_LABELS[sport] || sport}
                                        </span>
                                    ))}
                                </div>

                                {/* Location */}
                                {trainer.city && (
                                    <div style={{ fontSize: "13px", color: "var(--gray-500)", marginBottom: "16px" }}>
                                        📍 {trainer.city}, {trainer.state} • {trainer.travel_radius_miles}mi radius
                                    </div>
                                )}

                                <div style={{ marginTop: "auto" }}>
                                    <button
                                        onClick={() => {
                                            setBookingModal(trainer);
                                            setBookingForm((prev) => ({ ...prev, sport: trainer.sports[0] || "" }));
                                        }}
                                        style={{
                                            width: "100%",
                                            padding: "12px",
                                            borderRadius: "var(--radius-md)",
                                            background: "var(--gradient-primary)",
                                            color: "white",
                                            border: "none",
                                            fontWeight: 700,
                                            fontSize: "14px",
                                            cursor: "pointer",
                                            transition: "all var(--transition-fast)",
                                            boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
                                        }}
                                    >
                                        Book Session
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Booking Modal */}
            {bookingModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 50,
                        padding: "24px",
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) setBookingModal(null); }}
                >
                    <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: "36px", width: "100%", maxWidth: "480px", animation: "fadeInUp 0.3s ease-out" }}>
                        {bookingSuccess ? (
                            <div style={{ textAlign: "center", padding: "40px 0" }}>
                                <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
                                <h3 style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: "8px" }}>Booking Confirmed!</h3>
                                <p style={{ color: "var(--gray-500)" }}>Payment processed successfully. Your trainer has been notified.</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                                    <h3 style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-display)" }}>
                                        Book {bookingModal.user?.first_name}
                                    </h3>
                                    <button onClick={() => setBookingModal(null)} style={{ border: "none", background: "none", fontSize: "20px", cursor: "pointer", color: "var(--gray-400)" }}>✕</button>
                                </div>

                                <form onSubmit={handleBookTrainer}>
                                    <div style={{ marginBottom: "16px" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-700)" }}>Sport</label>
                                        <select
                                            value={bookingForm.sport}
                                            onChange={(e) => setBookingForm((p) => ({ ...p, sport: e.target.value }))}
                                            required
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-200)", fontSize: "14px", outline: "none" }}
                                        >
                                            {bookingModal.sports.map((s) => (
                                                <option key={s} value={s}>{SPORT_LABELS[s] || s}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-700)" }}>Date</label>
                                            <input type="date" value={bookingForm.date} onChange={(e) => setBookingForm((p) => ({ ...p, date: e.target.value }))} required
                                                min={new Date().toISOString().split("T")[0]}
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-200)", fontSize: "14px", outline: "none" }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-700)" }}>Time</label>
                                            <input type="time" value={bookingForm.time} onChange={(e) => setBookingForm((p) => ({ ...p, time: e.target.value }))} required
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-200)", fontSize: "14px", outline: "none" }} />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: "16px" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-700)" }}>Duration</label>
                                        <select value={bookingForm.duration} onChange={(e) => setBookingForm((p) => ({ ...p, duration: e.target.value }))}
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-200)", fontSize: "14px", outline: "none" }}>
                                            <option value="30">30 minutes</option>
                                            <option value="60">60 minutes</option>
                                            <option value="90">90 minutes</option>
                                            <option value="120">120 minutes</option>
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: "20px" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-700)" }}>Notes (optional)</label>
                                        <textarea value={bookingForm.notes} onChange={(e) => setBookingForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Any specific goals or requests?"
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-200)", fontSize: "14px", outline: "none", minHeight: "80px", resize: "vertical" }} />
                                    </div>

                                    {/* Price breakdown */}
                                    <div style={{ background: "var(--gray-50)", borderRadius: "var(--radius-md)", padding: "16px", marginBottom: "20px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}>
                                            <span>Session ({bookingForm.duration} min × ${Number(bookingModal.hourly_rate).toFixed(0)}/hr)</span>
                                            <span>${((Number(bookingModal.hourly_rate) * Number(bookingForm.duration)) / 60).toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px", color: "var(--gray-500)" }}>
                                            <span>Platform fee (3%)</span>
                                            <span>${((Number(bookingModal.hourly_rate) * Number(bookingForm.duration)) / 60 * 0.03).toFixed(2)}</span>
                                        </div>
                                        <div style={{ borderTop: "1px solid var(--gray-200)", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 700 }}>
                                            <span>Total</span>
                                            <span style={{ color: "var(--primary)" }}>
                                                ${((Number(bookingModal.hourly_rate) * Number(bookingForm.duration)) / 60 * 1.03).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={bookingLoading}
                                        style={{
                                            width: "100%",
                                            padding: "14px",
                                            borderRadius: "var(--radius-md)",
                                            background: bookingLoading ? "var(--gray-300)" : "var(--gradient-primary)",
                                            color: "white",
                                            border: "none",
                                            fontWeight: 700,
                                            fontSize: "15px",
                                            cursor: bookingLoading ? "not-allowed" : "pointer",
                                            boxShadow: bookingLoading ? "none" : "0 2px 8px rgba(99, 102, 241, 0.3)",
                                        }}
                                    >
                                        {bookingLoading ? "Processing Payment..." : "Book & Pay"}
                                    </button>
                                    <p style={{ fontSize: "12px", color: "var(--gray-400)", textAlign: "center", marginTop: "12px" }}>
                                        🔒 Payment is held in escrow until the session is completed.
                                    </p>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
