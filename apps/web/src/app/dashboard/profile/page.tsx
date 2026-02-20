"use client";

import { useEffect, useState } from "react";
import { getSession, setSession, AuthUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        bio: "",
        headline: "",
        hourlyRate: "",
        yearsExperience: "",
        sports: [] as string[],
    });

    useEffect(() => {
        const session = getSession();
        if (session) {
            setUser(session);
            loadProfile(session);
        }
    }, []);

    const loadProfile = async (u: AuthUser) => {
        const { data: userData } = await supabase.from("users").select("*").eq("id", u.id).single();

        if (u.role === "trainer" && u.trainerProfile) {
            const { data: tp } = await supabase.from("trainer_profiles").select("*").eq("user_id", u.id).single();
            setForm({
                firstName: userData?.first_name || "",
                lastName: userData?.last_name || "",
                phone: userData?.phone || "",
                bio: tp?.bio || "",
                headline: tp?.headline || "",
                hourlyRate: String(tp?.hourly_rate || 50),
                yearsExperience: String(tp?.years_experience || 0),
                sports: tp?.sports || [],
            });
        } else {
            const { data: ap } = await supabase.from("athlete_profiles").select("*").eq("user_id", u.id).single();
            setForm({
                firstName: userData?.first_name || "",
                lastName: userData?.last_name || "",
                phone: userData?.phone || "",
                bio: "",
                headline: "",
                hourlyRate: "",
                yearsExperience: "",
                sports: ap?.sports || [],
            });
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);

        try {
            await supabase.from("users").update({
                first_name: form.firstName,
                last_name: form.lastName,
                phone: form.phone || null,
            }).eq("id", user.id);

            if (user.role === "trainer") {
                await supabase.from("trainer_profiles").update({
                    bio: form.bio || null,
                    headline: form.headline || null,
                    hourly_rate: Number(form.hourlyRate),
                    years_experience: Number(form.yearsExperience),
                    sports: form.sports,
                }).eq("user_id", user.id);
            } else {
                await supabase.from("athlete_profiles").update({
                    sports: form.sports,
                }).eq("user_id", user.id);
            }

            // Update session
            const updatedUser = { ...user, firstName: form.firstName, lastName: form.lastName };
            setSession(updatedUser);
            setUser(updatedUser);
            setSaved(true);
            setEditing(false);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error("Save failed:", err);
        } finally {
            setSaving(false);
        }
    };

    const SPORTS = [
        "hockey", "baseball", "basketball", "football", "soccer",
        "tennis", "golf", "swimming", "boxing", "lacrosse",
        "wrestling", "martial_arts", "gymnastics", "track_and_field", "volleyball",
    ];

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--gray-200)",
        fontSize: "14px",
        outline: "none",
        background: editing ? "var(--surface)" : "var(--gray-50)",
        color: "var(--foreground)",
        transition: "all var(--transition-fast)",
    };

    const isTrainer = user?.role === "trainer";

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: "4px" }}>My Profile</h1>
                    <p style={{ color: "var(--gray-500)", fontSize: "14px" }}>
                        Manage your personal information and {isTrainer ? "training profile" : "preferences"}
                    </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    {editing ? (
                        <>
                            <button onClick={() => setEditing(false)} style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-200)", background: "var(--surface)", color: "var(--gray-600)", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving} style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", background: "var(--gradient-primary)", color: "white", border: "none", fontWeight: 600, fontSize: "14px", cursor: "pointer", boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)" }}>
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setEditing(true)} style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", background: "var(--gradient-primary)", color: "white", border: "none", fontWeight: 600, fontSize: "14px", cursor: "pointer", boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)" }}>
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>

            {saved && (
                <div style={{ padding: "12px 16px", background: "#d1fae5", borderRadius: "var(--radius-md)", color: "#059669", fontSize: "14px", fontWeight: 600, marginBottom: "24px" }}>
                    ✅ Profile updated successfully!
                </div>
            )}

            {/* Profile Header */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", padding: "32px", marginBottom: "24px" }}>
                <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "var(--radius-full)", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "28px", fontFamily: "var(--font-display)" }}>
                        {form.firstName?.[0]}{form.lastName?.[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: "4px" }}>
                            {form.firstName} {form.lastName}
                        </h2>
                        <p style={{ color: "var(--gray-500)", fontSize: "14px", marginBottom: "8px" }}>{user?.email}</p>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <span style={{ padding: "4px 12px", borderRadius: "var(--radius-full)", background: "var(--primary-50)", color: "var(--primary)", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>
                                {user?.role}
                            </span>
                            {isTrainer && user?.trainerProfile?.is_verified && (
                                <span style={{ padding: "4px 12px", borderRadius: "var(--radius-full)", background: "#d1fae5", color: "#059669", fontSize: "12px", fontWeight: 600 }}>
                                    ✅ Verified
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Personal Info */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", padding: "32px", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px", fontFamily: "var(--font-display)" }}>Personal Information</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-600)" }}>First Name</label>
                        <input value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} disabled={!editing} style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-600)" }}>Last Name</label>
                        <input value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} disabled={!editing} style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-600)" }}>Phone</label>
                        <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} disabled={!editing} placeholder="(555) 123-4567" style={inputStyle} />
                    </div>
                </div>
            </div>

            {/* Trainer-specific fields */}
            {isTrainer && (
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", padding: "32px", marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px", fontFamily: "var(--font-display)" }}>Training Profile</h3>
                    <div style={{ display: "grid", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-600)" }}>Headline</label>
                            <input value={form.headline} onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))} disabled={!editing} placeholder="e.g. Former NCAA D1 Player" style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-600)" }}>Bio</label>
                            <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} disabled={!editing} placeholder="Tell athletes about your experience..."
                                style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-600)" }}>Hourly Rate ($)</label>
                                <input type="number" value={form.hourlyRate} onChange={(e) => setForm((p) => ({ ...p, hourlyRate: e.target.value }))} disabled={!editing} min={10} max={500} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-600)" }}>Years Experience</label>
                                <input type="number" value={form.yearsExperience} onChange={(e) => setForm((p) => ({ ...p, yearsExperience: e.target.value }))} disabled={!editing} min={0} max={50} style={inputStyle} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sports */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", padding: "32px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px", fontFamily: "var(--font-display)" }}>Sports</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {SPORTS.map((sport) => {
                        const selected = form.sports.includes(sport);
                        return (
                            <button
                                key={sport}
                                type="button"
                                disabled={!editing}
                                onClick={() => {
                                    if (!editing) return;
                                    setForm((p) => ({
                                        ...p,
                                        sports: selected ? p.sports.filter((s) => s !== sport) : [...p.sports, sport],
                                    }));
                                }}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "var(--radius-full)",
                                    border: `2px solid ${selected ? "var(--primary)" : "var(--gray-200)"}`,
                                    background: selected ? "var(--primary-50)" : "transparent",
                                    color: selected ? "var(--primary)" : "var(--gray-500)",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    cursor: editing ? "pointer" : "default",
                                    opacity: editing ? 1 : 0.8,
                                    textTransform: "capitalize",
                                    transition: "all var(--transition-fast)",
                                }}
                            >
                                {sport.replace(/_/g, " ")}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
