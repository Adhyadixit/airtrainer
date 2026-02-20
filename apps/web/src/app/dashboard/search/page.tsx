"use client";

import { useEffect, useState, useMemo } from "react";
import { getSession, AuthUser } from "@/lib/auth";
import { supabase, TrainerProfileRow } from "@/lib/supabase";

type TrainerWithUser = TrainerProfileRow & {
    user: { first_name: string; last_name: string; avatar_url: string | null };
    avg_rating: number;
    review_count: number;
    matchScore: number; // 0-100 how well they match athlete preferences
};

const SPORT_LABELS: Record<string, string> = {
    hockey: "🏒 Hockey", baseball: "⚾ Baseball", basketball: "🏀 Basketball",
    football: "🏈 Football", soccer: "⚽ Soccer", tennis: "🎾 Tennis",
    golf: "⛳ Golf", swimming: "🏊 Swimming", track_and_field: "🏃 Track & Field",
    volleyball: "🏐 Volleyball", lacrosse: "🥍 Lacrosse", wrestling: "🤼 Wrestling",
    boxing: "🥊 Boxing", martial_arts: "🥋 Martial Arts", gymnastics: "🤸 Gymnastics",
    softball: "🥎 Softball",
};

const SORT_OPTIONS = [
    { value: "match", label: "Best Match" },
    { value: "price_low", label: "Price: Low → High" },
    { value: "price_high", label: "Price: High → Low" },
    { value: "rating", label: "Highest Rated" },
    { value: "experience", label: "Most Experienced" },
    { value: "sessions", label: "Most Sessions" },
];

export default function SearchTrainersPage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [trainers, setTrainers] = useState<TrainerWithUser[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [sportFilter, setSportFilter] = useState<string>("");
    const [maxRate, setMaxRate] = useState<number>(300);
    const [minRating, setMinRating] = useState<number>(0);
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [minExperience, setMinExperience] = useState<number>(0);
    const [locationFilter, setLocationFilter] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("match");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [showFilters, setShowFilters] = useState(false);

    // Booking modal
    const [bookingModal, setBookingModal] = useState<TrainerWithUser | null>(null);
    const [bookingForm, setBookingForm] = useState({ date: "", time: "", duration: "60", sport: "", notes: "" });
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);

    useEffect(() => {
        const session = getSession();
        if (session) {
            setUser(session);
            loadTrainers(session);

            // Pre-fill sport filter from athlete's first sport preference
            if (session.athleteProfile?.sports?.length) {
                setSportFilter(session.athleteProfile.sports[0]);
            }
        }
    }, []);

    const loadTrainers = async (session: AuthUser) => {
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

            const ratingMap = new Map<string, { sum: number; count: number }>();
            (reviews || []).forEach((r: { reviewee_id: string; rating: number }) => {
                const existing = ratingMap.get(r.reviewee_id) || { sum: 0, count: 0 };
                ratingMap.set(r.reviewee_id, { sum: existing.sum + r.rating, count: existing.count + 1 });
            });

            // Calculate match scores based on athlete preferences
            const athleteProfile = session.athleteProfile;
            const enriched: TrainerWithUser[] = (profiles as TrainerProfileRow[]).map((p) => {
                let matchScore = 50; // Base score

                if (athleteProfile) {
                    // Sport match: +30 if trainer coaches athlete's sports
                    const sportOverlap = (athleteProfile.sports || []).filter((s: string) => (p.sports || []).includes(s));
                    if (sportOverlap.length > 0) matchScore += 30;

                    // Location match: +15 if same city/state
                    if (athleteProfile.city && p.city && athleteProfile.city.toLowerCase() === p.city.toLowerCase()) {
                        matchScore += 15;
                    } else if (athleteProfile.state && p.state && athleteProfile.state.toLowerCase() === p.state.toLowerCase()) {
                        matchScore += 8;
                    }

                    // Price match: +10 if within typical range
                    const rate = Number(p.hourly_rate);
                    if (rate <= 80) matchScore += 10;
                    else if (rate <= 120) matchScore += 5;

                    // Verification bonus: +10
                    if (p.is_verified) matchScore += 10;

                    // Experience bonus: +5 for 5+ years
                    if ((p.years_experience || 0) >= 5) matchScore += 5;

                    // Rating bonus
                    const rData = ratingMap.get(p.user_id);
                    if (rData && rData.count > 0) {
                        const avgR = rData.sum / rData.count;
                        if (avgR >= 4.5) matchScore += 10;
                        else if (avgR >= 4.0) matchScore += 5;
                    }
                }

                return {
                    ...p,
                    user: usersMap.get(p.user_id) as TrainerWithUser["user"],
                    avg_rating: ratingMap.has(p.user_id)
                        ? Math.round((ratingMap.get(p.user_id)!.sum / ratingMap.get(p.user_id)!.count) * 10) / 10
                        : 0,
                    review_count: ratingMap.get(p.user_id)?.count || 0,
                    matchScore: Math.min(100, matchScore),
                };
            });

            setTrainers(enriched);
        } catch (err) {
            console.error("Failed to load trainers:", err);
        } finally {
            setLoading(false);
        }
    };

    // Apply all filters
    const filteredTrainers = useMemo(() => {
        let result = trainers.filter((t) => {
            // Sport filter
            if (sportFilter && !t.sports.includes(sportFilter)) return false;
            // Max rate
            if (Number(t.hourly_rate) > maxRate) return false;
            // Verified only
            if (verifiedOnly && !t.is_verified) return false;
            // Min rating
            if (minRating > 0 && t.avg_rating < minRating) return false;
            // Min experience
            if (minExperience > 0 && (t.years_experience || 0) < minExperience) return false;
            // Location
            if (locationFilter) {
                const loc = `${t.city || ""} ${t.state || ""}`.toLowerCase();
                if (!loc.includes(locationFilter.toLowerCase())) return false;
            }
            // Search query (name, headline, bio)
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const name = `${t.user?.first_name || ""} ${t.user?.last_name || ""}`.toLowerCase();
                const headline = (t.headline || "").toLowerCase();
                const bio = (t.bio || "").toLowerCase();
                const sports = t.sports.join(" ").toLowerCase();
                if (!name.includes(q) && !headline.includes(q) && !bio.includes(q) && !sports.includes(q)) return false;
            }
            return true;
        });

        // Sort
        switch (sortBy) {
            case "match":
                result.sort((a, b) => b.matchScore - a.matchScore);
                break;
            case "price_low":
                result.sort((a, b) => Number(a.hourly_rate) - Number(b.hourly_rate));
                break;
            case "price_high":
                result.sort((a, b) => Number(b.hourly_rate) - Number(a.hourly_rate));
                break;
            case "rating":
                result.sort((a, b) => b.avg_rating - a.avg_rating);
                break;
            case "experience":
                result.sort((a, b) => (b.years_experience || 0) - (a.years_experience || 0));
                break;
            case "sessions":
                result.sort((a, b) => b.total_sessions - a.total_sessions);
                break;
        }

        return result;
    }, [trainers, sportFilter, maxRate, verifiedOnly, minRating, minExperience, locationFilter, searchQuery, sortBy]);

    const activeFilterCount = [
        sportFilter, maxRate < 300, verifiedOnly, minRating > 0, minExperience > 0, locationFilter,
    ].filter(Boolean).length;

    const clearFilters = () => {
        setSportFilter("");
        setMaxRate(300);
        setVerifiedOnly(false);
        setMinRating(0);
        setMinExperience(0);
        setLocationFilter("");
        setSearchQuery("");
    };

    const handleBookTrainer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookingModal || !user) return;
        setBookingLoading(true);
        setBookingError(null);

        try {
            const scheduledAt = new Date(`${bookingForm.date}T${bookingForm.time}`);
            const duration = Number(bookingForm.duration);
            const endTime = new Date(scheduledAt.getTime() + duration * 60 * 1000);

            const dayOfWeek = scheduledAt.getDay();
            const startTimeStr = `${String(scheduledAt.getHours()).padStart(2, '0')}:${String(scheduledAt.getMinutes()).padStart(2, '0')}:00`;
            const endTimeStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}:00`;

            const { data: availabilitySlots } = await supabase
                .from("availability_slots")
                .select("*")
                .eq("trainer_id", bookingModal.user_id)
                .eq("day_of_week", dayOfWeek)
                .eq("is_active", true);

            const isWithinAvailability = (availabilitySlots || []).some((slot: { start_time: string; end_time: string }) => {
                return startTimeStr >= slot.start_time && endTimeStr <= slot.end_time;
            });

            if (availabilitySlots && availabilitySlots.length > 0 && !isWithinAvailability) {
                setBookingError("This trainer is not available at the selected time. Please choose a time within their availability.");
                setBookingLoading(false);
                return;
            }

            const { data: existingBookings } = await supabase
                .from("bookings")
                .select("id, scheduled_at, duration_minutes")
                .eq("trainer_id", bookingModal.user_id)
                .in("status", ["pending", "confirmed"])
                .gte("scheduled_at", new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000).toISOString())
                .lte("scheduled_at", new Date(scheduledAt.getTime() + 24 * 60 * 60 * 1000).toISOString());

            const hasConflict = (existingBookings || []).some((booking: { scheduled_at: string; duration_minutes: number }) => {
                const existingStart = new Date(booking.scheduled_at);
                const existingEnd = new Date(existingStart.getTime() + booking.duration_minutes * 60 * 1000);
                return (scheduledAt < existingEnd && endTime > existingStart);
            });

            if (hasConflict) {
                setBookingError("This trainer already has a booking at this time. Please choose a different time slot.");
                setBookingLoading(false);
                return;
            }

            const rate = Number(bookingModal.hourly_rate);
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
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px 24px" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ width: "48px", height: "48px", border: "4px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                    <p style={{ color: "#64748b", fontSize: "15px" }}>Finding the best trainers for you...</p>
                </div>
            </div>
        );
    }

    const selectStyle: React.CSSProperties = {
        width: "100%", padding: "10px 12px", borderRadius: "10px",
        border: "1px solid #e2e8f0", fontSize: "14px", outline: "none",
        background: "#fff", color: "#0f172a",
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "4px" }}>Find Your Perfect Coach</h1>
                <p style={{ color: "#64748b", fontSize: "14px" }}>
                    {filteredTrainers.length} trainer{filteredTrainers.length !== 1 ? "s" : ""} match your preferences
                    {user?.athleteProfile?.sports?.length ? ` • Showing coaches for ${user.athleteProfile.sports.map((s: string) => s.replace(/_/g, " ")).join(", ")}` : ""}
                </p>
            </div>

            {/* Search + Sort Bar */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
                    <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "16px" }}>🔍</span>
                    <input
                        type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, sport, or keyword..."
                        style={{ ...selectStyle, paddingLeft: "40px", width: "100%" }}
                    />
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ ...selectStyle, width: "auto", minWidth: "160px" }}>
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                        padding: "10px 18px", borderRadius: "10px",
                        border: `1px solid ${activeFilterCount > 0 ? "#6366f1" : "#e2e8f0"}`,
                        background: activeFilterCount > 0 ? "#eef2ff" : "#fff",
                        color: activeFilterCount > 0 ? "#4338ca" : "#64748b",
                        fontSize: "14px", fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "6px",
                    }}
                >
                    ⚙️ Filters {activeFilterCount > 0 && <span style={{ background: "#6366f1", color: "#fff", borderRadius: "999px", padding: "1px 7px", fontSize: "11px", fontWeight: 700 }}>{activeFilterCount}</span>}
                </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div style={{
                    background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0",
                    padding: "24px", marginBottom: "24px", boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                    animation: "fadeInUp 0.3s ease-out",
                }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                        <h3 style={{ fontWeight: 700, fontSize: "16px", color: "#0f172a" }}>Filter Trainers</h3>
                        <button onClick={clearFilters} style={{ background: "none", border: "none", color: "#6366f1", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                            Clear All
                        </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                        {/* Sport */}
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Sport</label>
                            <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value)} style={selectStyle}>
                                <option value="">All Sports</option>
                                {Object.entries(SPORT_LABELS).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Max Rate */}
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Max Rate: ${maxRate}/hr
                            </label>
                            <input type="range" min={20} max={300} step={10} value={maxRate} onChange={(e) => setMaxRate(Number(e.target.value))} style={{ width: "100%", accentColor: "#6366f1" }} />
                        </div>

                        {/* Min Rating */}
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Minimum Rating
                            </label>
                            <div style={{ display: "flex", gap: "6px" }}>
                                {[0, 3, 3.5, 4, 4.5].map(r => (
                                    <button key={r} onClick={() => setMinRating(r)}
                                        style={{
                                            padding: "6px 10px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                                            border: `1px solid ${minRating === r ? "#6366f1" : "#e2e8f0"}`,
                                            background: minRating === r ? "#eef2ff" : "#fff",
                                            color: minRating === r ? "#4338ca" : "#64748b",
                                            cursor: "pointer",
                                        }}
                                    >{r === 0 ? "Any" : `${r}+⭐`}</button>
                                ))}
                            </div>
                        </div>

                        {/* Min Experience */}
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Min Experience
                            </label>
                            <select value={minExperience} onChange={(e) => setMinExperience(Number(e.target.value))} style={selectStyle}>
                                <option value={0}>Any Experience</option>
                                <option value={1}>1+ years</option>
                                <option value={3}>3+ years</option>
                                <option value={5}>5+ years</option>
                                <option value={10}>10+ years</option>
                            </select>
                        </div>

                        {/* Location */}
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Location</label>
                            <input type="text" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} placeholder="City or State..." style={selectStyle} />
                        </div>

                        {/* Verified Only */}
                        <div style={{ display: "flex", alignItems: "end" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${verifiedOnly ? "#6366f1" : "#e2e8f0"}`, background: verifiedOnly ? "#eef2ff" : "#fff", width: "100%" }}>
                                <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} style={{ accentColor: "#6366f1", width: "16px", height: "16px" }} />
                                <span style={{ fontSize: "14px", fontWeight: 600, color: verifiedOnly ? "#4338ca" : "#64748b" }}>✅ Verified Only</span>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* Athlete Preference Banner */}
            {user?.athleteProfile && user.athleteProfile.sports?.length > 0 && !showFilters && (
                <div style={{
                    display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px",
                    background: "linear-gradient(135deg, #eef2ff, #faf5ff)", borderRadius: "14px",
                    border: "1px solid #c7d2fe", marginBottom: "20px", flexWrap: "wrap",
                }}>
                    <span style={{ fontSize: "18px" }}>🎯</span>
                    <p style={{ fontSize: "13px", color: "#4338ca", fontWeight: 500, flex: 1 }}>
                        <strong>Showing coaches matched to your preferences.</strong> Sorted by best match based on your sport, location, and training preferences.
                    </p>
                    <button onClick={() => setShowFilters(true)}
                        style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid #c7d2fe", background: "#fff", color: "#4338ca", fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                        Customize Filters
                    </button>
                </div>
            )}

            {/* Results */}
            {filteredTrainers.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "60px 24px", textAlign: "center" }}>
                    <p style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</p>
                    <p style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>No trainers match your filters</p>
                    <p style={{ color: "#64748b", marginBottom: "20px" }}>Try broadening your search or adjusting your filters.</p>
                    <button onClick={clearFilters} style={{ padding: "10px 24px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
                        Clear All Filters
                    </button>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px", alignItems: "stretch" }}>
                    {filteredTrainers.map((trainer) => (
                        <div
                            key={trainer.id}
                            style={{
                                background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0",
                                overflow: "hidden", transition: "all 0.2s",
                                display: "flex", flexDirection: "column", height: "100%",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.03)"; }}
                        >
                            {/* Match Score Badge */}
                            {sortBy === "match" && trainer.matchScore >= 70 && (
                                <div style={{ padding: "8px 20px", background: "linear-gradient(135deg, #eef2ff, #faf5ff)", borderBottom: "1px solid #e0e7ff", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "13px" }}>🎯</span>
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#4338ca" }}>{trainer.matchScore}% Match</span>
                                    {trainer.matchScore >= 90 && <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", background: "#dcfce7", color: "#16a34a", fontWeight: 700 }}>TOP PICK</span>}
                                </div>
                            )}

                            {/* Card header */}
                            <div style={{ padding: "20px", borderBottom: "1px solid #f1f5f9" }}>
                                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                                    <div
                                        style={{
                                            width: "52px", height: "52px", borderRadius: "14px",
                                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: "white", fontWeight: 700, fontSize: "17px", flexShrink: 0,
                                        }}
                                    >
                                        {trainer.user?.first_name?.[0]}{trainer.user?.last_name?.[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                                            <span style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                                                {trainer.user?.first_name} {trainer.user?.last_name}
                                            </span>
                                            {trainer.is_verified && <span title="Verified" style={{ fontSize: "13px" }}>✅</span>}
                                        </div>
                                        {trainer.headline && (
                                            <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{trainer.headline}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card body */}
                            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
                                {/* Stats row */}
                                <div style={{ display: "flex", gap: "16px", marginBottom: "14px", flexWrap: "wrap" }}>
                                    <div>
                                        <div style={{ fontSize: "20px", fontWeight: 800, color: "#6366f1" }}>${Number(trainer.hourly_rate).toFixed(0)}</div>
                                        <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>per hour</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "20px", fontWeight: 800 }}>{trainer.avg_rating || "—"}</div>
                                        <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>⭐ ({trainer.review_count})</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "20px", fontWeight: 800 }}>{trainer.years_experience || 0}</div>
                                        <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>yrs exp</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "20px", fontWeight: 800 }}>{trainer.total_sessions}</div>
                                        <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>sessions</div>
                                    </div>
                                </div>

                                {/* Sports */}
                                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "12px" }}>
                                    {trainer.sports.map((sport) => {
                                        const isMySprt = user?.athleteProfile?.sports?.includes(sport);
                                        return (
                                            <span key={sport} style={{
                                                padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600,
                                                background: isMySprt ? "#dcfce7" : "#eef2ff",
                                                color: isMySprt ? "#16a34a" : "#4338ca",
                                                border: isMySprt ? "1px solid #bbf7d0" : "none",
                                            }}>
                                                {isMySprt && "✓ "}{SPORT_LABELS[sport] || sport.replace(/_/g, " ")}
                                            </span>
                                        );
                                    })}
                                </div>

                                {/* Location */}
                                {trainer.city && (
                                    <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "14px" }}>
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
                                            width: "100%", padding: "11px", borderRadius: "12px",
                                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                            color: "white", border: "none", fontWeight: 700, fontSize: "14px",
                                            cursor: "pointer", boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
                                            transition: "all 0.15s",
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
                    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "24px" }}
                    onClick={(e) => { if (e.target === e.currentTarget) setBookingModal(null); }}
                >
                    <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", animation: "fadeInUp 0.3s ease-out" }}>
                        {bookingSuccess ? (
                            <div style={{ textAlign: "center", padding: "40px 0" }}>
                                <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
                                <h3 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>Booking Confirmed!</h3>
                                <p style={{ color: "#64748b" }}>Payment processed successfully. Your trainer has been notified.</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                                    <h3 style={{ fontSize: "20px", fontWeight: 800 }}>Book {bookingModal.user?.first_name}</h3>
                                    <button onClick={() => setBookingModal(null)} style={{ border: "none", background: "#f1f5f9", borderRadius: "10px", padding: "8px 10px", fontSize: "16px", cursor: "pointer", color: "#64748b" }}>✕</button>
                                </div>

                                <form onSubmit={handleBookTrainer}>
                                    <div style={{ marginBottom: "16px" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>Sport</label>
                                        <select value={bookingForm.sport} onChange={(e) => setBookingForm((p) => ({ ...p, sport: e.target.value }))} required style={selectStyle}>
                                            {bookingModal.sports.map((s) => <option key={s} value={s}>{SPORT_LABELS[s] || s}</option>)}
                                        </select>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>Date</label>
                                            <input type="date" value={bookingForm.date} onChange={(e) => setBookingForm((p) => ({ ...p, date: e.target.value }))} required min={new Date().toISOString().split("T")[0]} style={selectStyle} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>Time</label>
                                            <input type="time" value={bookingForm.time} onChange={(e) => setBookingForm((p) => ({ ...p, time: e.target.value }))} required style={selectStyle} />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: "16px" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>Duration</label>
                                        <select value={bookingForm.duration} onChange={(e) => setBookingForm((p) => ({ ...p, duration: e.target.value }))} style={selectStyle}>
                                            <option value="30">30 minutes</option>
                                            <option value="60">60 minutes</option>
                                            <option value="90">90 minutes</option>
                                            <option value="120">120 minutes</option>
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: "20px" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>Notes (optional)</label>
                                        <textarea value={bookingForm.notes} onChange={(e) => setBookingForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Any specific goals or requests?"
                                            style={{ ...selectStyle, minHeight: "80px", resize: "vertical" }} />
                                    </div>

                                    <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}>
                                            <span>Session ({bookingForm.duration} min × ${Number(bookingModal.hourly_rate).toFixed(0)}/hr)</span>
                                            <span>${((Number(bookingModal.hourly_rate) * Number(bookingForm.duration)) / 60).toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px", color: "#94a3b8" }}>
                                            <span>Platform fee (3%)</span>
                                            <span>${((Number(bookingModal.hourly_rate) * Number(bookingForm.duration)) / 60 * 0.03).toFixed(2)}</span>
                                        </div>
                                        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 700 }}>
                                            <span>Total</span>
                                            <span style={{ color: "#6366f1" }}>${((Number(bookingModal.hourly_rate) * Number(bookingForm.duration)) / 60 * 1.03).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {bookingError && (
                                        <div style={{ padding: "12px", background: "#fee2e2", borderRadius: "10px", marginBottom: "16px", color: "#dc2626", fontSize: "14px" }}>
                                            ⚠️ {bookingError}
                                        </div>
                                    )}

                                    <button type="submit" disabled={bookingLoading}
                                        style={{
                                            width: "100%", padding: "14px", borderRadius: "12px",
                                            background: bookingLoading ? "#94a3b8" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                            color: "white", border: "none", fontWeight: 700, fontSize: "15px",
                                            cursor: bookingLoading ? "not-allowed" : "pointer",
                                            boxShadow: bookingLoading ? "none" : "0 4px 14px rgba(99,102,241,0.3)",
                                        }}
                                    >
                                        {bookingLoading ? "Processing Payment..." : "Book & Pay"}
                                    </button>
                                    <p style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", marginTop: "12px" }}>
                                        🔒 Payment is held in escrow until the session is completed.
                                    </p>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
