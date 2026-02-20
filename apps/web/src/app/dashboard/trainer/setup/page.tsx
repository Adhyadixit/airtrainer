"use client";

import { useEffect, useState } from "react";
import { getSession, setSession, AuthUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
    User, Award, Calendar, CheckCircle, ChevronRight, ChevronLeft,
    MapPin, DollarSign, Clock, Briefcase, Shield, Upload, Star, Zap
} from "lucide-react";

const SPORTS = [
    "Hockey", "Baseball", "Basketball", "Football", "Soccer",
    "Tennis", "Golf", "Swimming", "Boxing", "Lacrosse",
    "Wrestling", "Martial Arts", "Gymnastics", "Track & Field", "Volleyball",
];

const SESSION_TYPES = [
    { value: "private", label: "Private (1-on-1)", desc: "One athlete, full attention" },
    { value: "semi_private", label: "Semi-Private (2-3)", desc: "Small group training" },
    { value: "group", label: "Group (4+)", desc: "Team or group sessions" },
];

const SESSION_LENGTHS = [30, 45, 60, 90];

const TIME_PREFERENCES = [
    { value: "morning", label: "Morning", time: "6am – 12pm", emoji: "🌅" },
    { value: "afternoon", label: "Afternoon", time: "12pm – 5pm", emoji: "☀️" },
    { value: "evening", label: "Evening", time: "5pm – 9pm", emoji: "🌆" },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TrainerSetupPage() {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);
    const totalSteps = 4;

    const [formData, setFormData] = useState({
        // Step 1: Profile
        headline: "",
        bio: "",
        sports: [] as string[],
        yearsExperience: "",
        coachingStyle: "",
        // Step 2: Verification
        certifications: "",
        idUploaded: false,
        stripeSetup: false,
        agreedToTerms: false,
        // Step 3: Schedule & Pricing
        availableDays: [] as string[],
        preferredTimes: [] as string[],
        sessionTypes: [] as string[],
        sessionLengths: [] as number[],
        hourlyRate: "50",
        travelRadius: "25",
        city: "",
        state: "",
        // Step 4: Review
    });

    useEffect(() => {
        const session = getSession();
        if (!session) {
            router.push("/auth/login");
            return;
        }
        if (session.role !== "trainer") {
            router.push("/dashboard");
            return;
        }
        setUser(session);

        // Pre-fill from existing profile
        if (session.trainerProfile) {
            const tp = session.trainerProfile;
            setFormData(prev => ({
                ...prev,
                headline: tp.headline || "",
                bio: tp.bio || "",
                sports: tp.sports || [],
                yearsExperience: tp.years_experience?.toString() || "",
                hourlyRate: tp.hourly_rate?.toString() || "50",
                travelRadius: tp.travel_radius_miles?.toString() || "25",
                city: tp.city || "",
                state: tp.state || "",
            }));
        }
        setLoading(false);
    }, [router]);

    const toggleArrayItem = (field: string, item: string | number) => {
        setFormData(prev => {
            const arr = prev[field as keyof typeof prev] as (string | number)[];
            return {
                ...prev,
                [field]: arr.includes(item)
                    ? arr.filter(i => i !== item)
                    : [...arr, item],
            };
        });
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setSaving(true);

        try {
            const updateData: Record<string, unknown> = {
                headline: formData.headline,
                bio: formData.bio,
                sports: formData.sports,
                years_experience: parseInt(formData.yearsExperience) || null,
                hourly_rate: parseFloat(formData.hourlyRate) || 50,
                travel_radius_miles: parseInt(formData.travelRadius) || 25,
                city: formData.city || null,
                state: formData.state || null,
            };

            const { error } = await supabase
                .from("trainer_profiles")
                .update(updateData)
                .eq("user_id", user.id);

            if (error) throw error;

            // Save availability slots
            if (formData.availableDays.length > 0 && formData.preferredTimes.length > 0) {
                // Delete existing slots first
                await supabase
                    .from("availability_slots")
                    .delete()
                    .eq("trainer_id", user.trainerProfile?.id || "");

                const dayMap: Record<string, number> = {
                    Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4,
                    Friday: 5, Saturday: 6, Sunday: 0,
                };
                const timeMap: Record<string, { start: string; end: string }> = {
                    morning: { start: "06:00", end: "12:00" },
                    afternoon: { start: "12:00", end: "17:00" },
                    evening: { start: "17:00", end: "21:00" },
                };

                const slots = [];
                for (const day of formData.availableDays) {
                    for (const time of formData.preferredTimes) {
                        slots.push({
                            trainer_id: user.trainerProfile?.id,
                            day_of_week: dayMap[day],
                            start_time: timeMap[time].start,
                            end_time: timeMap[time].end,
                            is_recurring: true,
                        });
                    }
                }

                if (slots.length > 0) {
                    await supabase.from("availability_slots").insert(slots);
                }
            }

            // Update local session
            const updatedSession = {
                ...user,
                trainerProfile: {
                    ...user.trainerProfile,
                    headline: formData.headline,
                    bio: formData.bio,
                    sports: formData.sports,
                    years_experience: parseInt(formData.yearsExperience) || 0,
                    hourly_rate: parseFloat(formData.hourlyRate) || 50,
                    travel_radius_miles: parseInt(formData.travelRadius) || 25,
                    city: formData.city,
                    state: formData.state,
                },
            };
            setSession(updatedSession as AuthUser);

            if (step === totalSteps) {
                router.push("/dashboard");
            } else {
                setStep(step + 1);
            }
        } catch (err) {
            console.error("Failed to save:", err);
            alert("Failed to save profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <div style={{ width: "48px", height: "48px", border: "4px solid var(--gray-200)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
        );
    }

    const stepIcons = [
        { icon: <User size={20} />, label: "Profile" },
        { icon: <Shield size={20} />, label: "Verify" },
        { icon: <Calendar size={20} />, label: "Schedule" },
        { icon: <CheckCircle size={20} />, label: "Review" },
    ];

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "12px 16px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        fontSize: "15px",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        background: "#fff",
        color: "#0f172a",
    };

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
                    Set Up Your Trainer Profile
                </h1>
                <p style={{ color: "#64748b", fontSize: "16px" }}>
                    Complete your profile to start connecting with athletes in your area.
                </p>
            </div>

            {/* Progress Steps */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "40px", padding: "16px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                {stepIcons.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                        <button
                            onClick={() => i + 1 <= step && setStep(i + 1)}
                            style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                padding: "10px 14px", borderRadius: "12px", border: "none",
                                background: step === i + 1 ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : step > i + 1 ? "#d1fae5" : "transparent",
                                color: step === i + 1 ? "white" : step > i + 1 ? "#059669" : "#94a3b8",
                                cursor: i + 1 <= step ? "pointer" : "default",
                                fontWeight: 600, fontSize: "13px", transition: "all 0.2s",
                                whiteSpace: "nowrap", width: "100%", justifyContent: "center",
                            }}
                        >
                            {step > i + 1 ? <CheckCircle size={18} /> : s.icon}
                            <span className="step-label">{s.label}</span>
                        </button>
                        {i < stepIcons.length - 1 && (
                            <div style={{ height: "2px", width: "24px", background: step > i + 1 ? "#10b981" : "#e2e8f0", flexShrink: 0, margin: "0 4px" }} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <div style={{ background: "white", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                {/* Step 1: Profile Info */}
                {step === 1 && (
                    <div style={{ animation: "fadeInUp 0.4s ease-out" }}>
                        <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <User size={24} style={{ color: "#6366f1" }} /> Your Coaching Profile
                        </h2>
                        <p style={{ color: "#64748b", marginBottom: "28px" }}>Tell athletes about your experience and what makes you a great coach.</p>

                        <div style={{ display: "grid", gap: "20px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
                                    Profile Headline <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.headline}
                                    onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                                    placeholder="e.g. Former NCAA D1 Hockey Coach — 15 Years of Elite Training"
                                    style={inputStyle}
                                    maxLength={200}
                                />
                                <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>{formData.headline.length}/200 characters</p>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
                                    About You / Bio <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                    placeholder="Tell athletes about your coaching philosophy, experience, achievements, and what they can expect from training with you..."
                                    rows={5}
                                    style={{ ...inputStyle, resize: "vertical" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: "#374151" }}>
                                    Sports You Coach <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    {SPORTS.map((sport) => {
                                        const key = sport.toLowerCase().replace(/\s+&\s+/g, "_and_").replace(/\s+/g, "_");
                                        const selected = formData.sports.includes(key);
                                        return (
                                            <button key={sport} type="button" onClick={() => toggleArrayItem("sports", key)}
                                                style={{
                                                    padding: "8px 16px", borderRadius: "999px",
                                                    border: `2px solid ${selected ? "#6366f1" : "#e2e8f0"}`,
                                                    background: selected ? "#eef2ff" : "#fff",
                                                    color: selected ? "#4338ca" : "#64748b",
                                                    fontSize: "13px", fontWeight: 600, cursor: "pointer",
                                                    transition: "all 0.15s",
                                                }}
                                            >{sport}</button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
                                        Years of Experience
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.yearsExperience}
                                        onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: e.target.value }))}
                                        placeholder="e.g. 10"
                                        min="0" max="50"
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
                                        Coaching Style
                                    </label>
                                    <select
                                        value={formData.coachingStyle}
                                        onChange={(e) => setFormData(prev => ({ ...prev, coachingStyle: e.target.value }))}
                                        style={inputStyle}
                                    >
                                        <option value="">Select style...</option>
                                        <option value="motivational">Motivational & Supportive</option>
                                        <option value="technical">Technical & Detail-Focused</option>
                                        <option value="competitive">Competitive & High-Intensity</option>
                                        <option value="developmental">Developmental & Patient</option>
                                        <option value="flexible">Flexible / Adaptive</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Verification */}
                {step === 2 && (
                    <div style={{ animation: "fadeInUp 0.4s ease-out" }}>
                        <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <Shield size={24} style={{ color: "#6366f1" }} /> Verification & Credentials
                        </h2>
                        <p style={{ color: "#64748b", marginBottom: "28px" }}>Verify your identity to build trust with athletes. Verified trainers get 3x more bookings.</p>

                        <div style={{ display: "grid", gap: "20px" }}>
                            {/* ID Verification */}
                            <div style={{ padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", background: formData.idUploaded ? "#f0fdf4" : "#fafafa" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: formData.idUploaded ? "#dcfce7" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {formData.idUploaded ? <CheckCircle size={22} style={{ color: "#16a34a" }} /> : <Upload size={22} style={{ color: "#64748b" }} />}
                                        </div>
                                        <div>
                                            <h3 style={{ fontWeight: 700, fontSize: "16px", color: "#0f172a" }}>Identity Verification</h3>
                                            <p style={{ fontSize: "13px", color: "#64748b" }}>Upload a government-issued ID</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, idUploaded: !prev.idUploaded }))}
                                        style={{
                                            padding: "8px 16px", borderRadius: "10px", border: "none",
                                            background: formData.idUploaded ? "#dcfce7" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                            color: formData.idUploaded ? "#16a34a" : "white",
                                            fontWeight: 600, fontSize: "13px", cursor: "pointer",
                                        }}
                                    >
                                        {formData.idUploaded ? "✓ Uploaded" : "Upload ID"}
                                    </button>
                                </div>
                            </div>

                            {/* Certifications */}
                            <div>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
                                    Certifications & Accreditations
                                </label>
                                <textarea
                                    value={formData.certifications}
                                    onChange={(e) => setFormData(prev => ({ ...prev, certifications: e.target.value }))}
                                    placeholder="List your coaching certifications, licenses, and qualifications (one per line)&#10;&#10;e.g.&#10;USA Hockey Level 4 Coach&#10;NASM Certified Personal Trainer&#10;CPR/First Aid Certified"
                                    rows={5}
                                    style={{ ...inputStyle, resize: "vertical" }}
                                />
                                <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>Optional but greatly improves your profile ranking</p>
                            </div>

                            {/* Stripe Setup */}
                            <div style={{ padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", background: formData.stripeSetup ? "#f0fdf4" : "#fafafa" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: formData.stripeSetup ? "#dcfce7" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {formData.stripeSetup ? <CheckCircle size={22} style={{ color: "#16a34a" }} /> : <DollarSign size={22} style={{ color: "#64748b" }} />}
                                        </div>
                                        <div>
                                            <h3 style={{ fontWeight: 700, fontSize: "16px", color: "#0f172a" }}>Payment Setup</h3>
                                            <p style={{ fontSize: "13px", color: "#64748b" }}>Connect Stripe to receive payouts</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, stripeSetup: !prev.stripeSetup }))}
                                        style={{
                                            padding: "8px 16px", borderRadius: "10px", border: "none",
                                            background: formData.stripeSetup ? "#dcfce7" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                            color: formData.stripeSetup ? "#16a34a" : "white",
                                            fontWeight: 600, fontSize: "13px", cursor: "pointer",
                                        }}
                                    >
                                        {formData.stripeSetup ? "✓ Connected" : "Connect Stripe"}
                                    </button>
                                </div>
                            </div>

                            {/* Terms Agreement */}
                            <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", cursor: "pointer", background: formData.agreedToTerms ? "#eef2ff" : "#fff" }}>
                                <input
                                    type="checkbox"
                                    checked={formData.agreedToTerms}
                                    onChange={(e) => setFormData(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
                                    style={{ width: "20px", height: "20px", marginTop: "2px", accentColor: "#6366f1" }}
                                />
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>I agree to the Trainer Agreement & Platform Policies</p>
                                    <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                                        By checking this box, you confirm that you have read and agree to our trainer terms of service, code of conduct, and cancellation policies.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                {/* Step 3: Schedule & Pricing */}
                {step === 3 && (
                    <div style={{ animation: "fadeInUp 0.4s ease-out" }}>
                        <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <Calendar size={24} style={{ color: "#6366f1" }} /> Schedule & Pricing
                        </h2>
                        <p style={{ color: "#64748b", marginBottom: "28px" }}>Set your availability and pricing so athletes can find and book you.</p>

                        <div style={{ display: "grid", gap: "24px" }}>
                            {/* Available Days */}
                            <div>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: "#374151" }}>
                                    Available Days <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    {DAYS.map((day) => {
                                        const selected = formData.availableDays.includes(day);
                                        return (
                                            <button key={day} type="button" onClick={() => toggleArrayItem("availableDays", day)}
                                                style={{
                                                    padding: "10px 18px", borderRadius: "12px",
                                                    border: `2px solid ${selected ? "#6366f1" : "#e2e8f0"}`,
                                                    background: selected ? "#eef2ff" : "#fff",
                                                    color: selected ? "#4338ca" : "#64748b",
                                                    fontSize: "13px", fontWeight: 600, cursor: "pointer",
                                                    transition: "all 0.15s",
                                                }}
                                            >{day.slice(0, 3)}</button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Preferred Times */}
                            <div>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: "#374151" }}>
                                    Preferred Training Times <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                                    {TIME_PREFERENCES.map((tp) => {
                                        const selected = formData.preferredTimes.includes(tp.value);
                                        return (
                                            <button key={tp.value} type="button" onClick={() => toggleArrayItem("preferredTimes", tp.value)}
                                                style={{
                                                    padding: "16px", borderRadius: "14px", textAlign: "center",
                                                    border: `2px solid ${selected ? "#6366f1" : "#e2e8f0"}`,
                                                    background: selected ? "#eef2ff" : "#fff",
                                                    cursor: "pointer", transition: "all 0.15s",
                                                }}
                                            >
                                                <div style={{ fontSize: "28px", marginBottom: "6px" }}>{tp.emoji}</div>
                                                <div style={{ fontWeight: 700, fontSize: "14px", color: selected ? "#4338ca" : "#0f172a" }}>{tp.label}</div>
                                                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{tp.time}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Session Types */}
                            <div>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: "#374151" }}>
                                    Session Types Offered
                                </label>
                                <div style={{ display: "grid", gap: "10px" }}>
                                    {SESSION_TYPES.map((st) => {
                                        const selected = formData.sessionTypes.includes(st.value);
                                        return (
                                            <button key={st.value} type="button" onClick={() => toggleArrayItem("sessionTypes", st.value)}
                                                style={{
                                                    padding: "14px 18px", borderRadius: "12px", textAlign: "left",
                                                    border: `2px solid ${selected ? "#6366f1" : "#e2e8f0"}`,
                                                    background: selected ? "#eef2ff" : "#fff",
                                                    cursor: "pointer", transition: "all 0.15s",
                                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: "14px", color: selected ? "#4338ca" : "#0f172a" }}>{st.label}</div>
                                                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{st.desc}</div>
                                                </div>
                                                {selected && <CheckCircle size={20} style={{ color: "#6366f1" }} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Session Lengths */}
                            <div>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: "#374151" }}>
                                    Session Lengths (minutes)
                                </label>
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                    {SESSION_LENGTHS.map((len) => {
                                        const selected = formData.sessionLengths.includes(len);
                                        return (
                                            <button key={len} type="button" onClick={() => toggleArrayItem("sessionLengths", len)}
                                                style={{
                                                    padding: "10px 20px", borderRadius: "12px",
                                                    border: `2px solid ${selected ? "#6366f1" : "#e2e8f0"}`,
                                                    background: selected ? "#eef2ff" : "#fff",
                                                    color: selected ? "#4338ca" : "#64748b",
                                                    fontSize: "14px", fontWeight: 700, cursor: "pointer",
                                                    transition: "all 0.15s", minWidth: "70px",
                                                }}
                                            >{len} min</button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Pricing & Location */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
                                        <DollarSign size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Hourly Rate (USD)
                                    </label>
                                    <input type="number" value={formData.hourlyRate} onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))} placeholder="50" min="10" max="500" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
                                        <MapPin size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Travel Radius (miles)
                                    </label>
                                    <input type="number" value={formData.travelRadius} onChange={(e) => setFormData(prev => ({ ...prev, travelRadius: e.target.value }))} placeholder="25" min="1" max="100" style={inputStyle} />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>City</label>
                                    <input type="text" value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} placeholder="e.g. Toronto" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>State / Province</label>
                                    <input type="text" value={formData.state} onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))} placeholder="e.g. Ontario" style={inputStyle} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Review & Go Live */}
                {step === 4 && (
                    <div style={{ animation: "fadeInUp 0.4s ease-out" }}>
                        <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <Zap size={24} style={{ color: "#6366f1" }} /> Review & Go Live
                        </h2>
                        <p style={{ color: "#64748b", marginBottom: "28px" }}>Here&apos;s a summary of your profile. Once you&apos;re happy, go live!</p>

                        <div style={{ display: "grid", gap: "16px" }}>
                            {/* Profile Summary */}
                            <div style={{ padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", background: "#fafafa" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                                    <User size={18} style={{ color: "#6366f1" }} />
                                    <h3 style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>Profile</h3>
                                </div>
                                <div style={{ display: "grid", gap: "8px", fontSize: "14px" }}>
                                    <div><span style={{ color: "#64748b" }}>Headline:</span> <strong>{formData.headline || "Not set"}</strong></div>
                                    <div><span style={{ color: "#64748b" }}>Sports:</span> <strong>{formData.sports.length > 0 ? formData.sports.map(s => s.replace(/_/g, " ")).join(", ") : "None selected"}</strong></div>
                                    <div><span style={{ color: "#64748b" }}>Experience:</span> <strong>{formData.yearsExperience ? `${formData.yearsExperience} years` : "Not set"}</strong></div>
                                </div>
                            </div>

                            {/* Verification */}
                            <div style={{ padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", background: "#fafafa" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                                    <Shield size={18} style={{ color: "#6366f1" }} />
                                    <h3 style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>Verification</h3>
                                </div>
                                <div style={{ display: "grid", gap: "8px", fontSize: "14px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        {formData.idUploaded ? <CheckCircle size={16} style={{ color: "#16a34a" }} /> : <Clock size={16} style={{ color: "#f59e0b" }} />}
                                        <span>ID Verification: <strong>{formData.idUploaded ? "Uploaded" : "Pending"}</strong></span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        {formData.stripeSetup ? <CheckCircle size={16} style={{ color: "#16a34a" }} /> : <Clock size={16} style={{ color: "#f59e0b" }} />}
                                        <span>Payment Setup: <strong>{formData.stripeSetup ? "Connected" : "Pending"}</strong></span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        {formData.agreedToTerms ? <CheckCircle size={16} style={{ color: "#16a34a" }} /> : <Clock size={16} style={{ color: "#f59e0b" }} />}
                                        <span>Terms Accepted: <strong>{formData.agreedToTerms ? "Yes" : "No"}</strong></span>
                                    </div>
                                </div>
                            </div>

                            {/* Schedule & Pricing */}
                            <div style={{ padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", background: "#fafafa" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                                    <Calendar size={18} style={{ color: "#6366f1" }} />
                                    <h3 style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>Schedule & Pricing</h3>
                                </div>
                                <div style={{ display: "grid", gap: "8px", fontSize: "14px" }}>
                                    <div><span style={{ color: "#64748b" }}>Days:</span> <strong>{formData.availableDays.length > 0 ? formData.availableDays.map(d => d.slice(0, 3)).join(", ") : "Not set"}</strong></div>
                                    <div><span style={{ color: "#64748b" }}>Times:</span> <strong>{formData.preferredTimes.length > 0 ? formData.preferredTimes.join(", ") : "Not set"}</strong></div>
                                    <div><span style={{ color: "#64748b" }}>Rate:</span> <strong>${formData.hourlyRate}/hr</strong></div>
                                    <div><span style={{ color: "#64748b" }}>Location:</span> <strong>{formData.city && formData.state ? `${formData.city}, ${formData.state}` : "Not set"}</strong></div>
                                    <div><span style={{ color: "#64748b" }}>Travel Radius:</span> <strong>{formData.travelRadius} miles</strong></div>
                                </div>
                            </div>

                            {/* Go Live Notice */}
                            <div style={{ padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg, #eef2ff, #faf5ff)", border: "1px solid #c7d2fe" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                    <Star size={20} style={{ color: "#6366f1" }} />
                                    <strong style={{ color: "#4338ca", fontSize: "15px" }}>You&apos;re Almost Live!</strong>
                                </div>
                                <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6 }}>
                                    Once you save, your profile will be submitted for verification review. You&apos;ll start appearing in athlete searches within your service area and receive notifications when athletes are looking for trainers in your sport.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid #f1f5f9" }}>
                    {step > 1 ? (
                        <button onClick={() => setStep(step - 1)}
                            style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                padding: "12px 24px", borderRadius: "12px",
                                border: "1px solid #e2e8f0", background: "#fff",
                                color: "#64748b", fontWeight: 600, fontSize: "14px", cursor: "pointer",
                            }}
                        >
                            <ChevronLeft size={18} /> Back
                        </button>
                    ) : <div />}

                    <button
                        onClick={step === totalSteps ? handleSaveProfile : () => setStep(step + 1)}
                        disabled={saving}
                        style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "12px 28px", borderRadius: "12px", border: "none",
                            background: saving ? "#94a3b8" : step === totalSteps ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            color: "white", fontWeight: 700, fontSize: "15px",
                            cursor: saving ? "not-allowed" : "pointer",
                            boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
                            transition: "all 0.2s",
                        }}
                    >
                        {saving ? "Saving..." : step === totalSteps ? (
                            <><CheckCircle size={18} /> Save & Go Live</>
                        ) : (
                            <>Continue <ChevronRight size={18} /></>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @media (max-width: 640px) {
                    .step-label { display: none; }
                }
            `}</style>
        </div>
    );
}
