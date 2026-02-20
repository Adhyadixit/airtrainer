"use client";

import { useState } from "react";
import { registerUser } from "@/lib/auth";

const SPORTS = [
    "Hockey", "Baseball", "Basketball", "Football", "Soccer",
    "Tennis", "Golf", "Swimming", "Boxing", "Lacrosse",
    "Wrestling", "Martial Arts", "Gymnastics", "Track & Field", "Volleyball",
];

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState<"athlete" | "trainer" | "">("");
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        dateOfBirth: "",
        selectedSports: [] as string[],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const updateField = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleSport = (sport: string) => {
        setFormData((prev) => ({
            ...prev,
            selectedSports: prev.selectedSports.includes(sport)
                ? prev.selectedSports.filter((s) => s !== sport)
                : [...prev.selectedSports, sport],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters");
            setLoading(false);
            return;
        }

        try {
            await registerUser({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                role: role as "athlete" | "trainer",
                dateOfBirth: formData.dateOfBirth,
                sports: formData.selectedSports,
            });
            window.location.href = "/dashboard";
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "14px 16px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--gray-200)",
        fontSize: "15px",
        outline: "none",
        transition: "border-color var(--transition-fast)",
        background: "var(--surface)",
        color: "var(--foreground)",
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, var(--gray-50) 0%, var(--primary-50) 100%)",
                padding: "24px",
            }}
        >
            <div
                className="register-card"
                style={{
                    width: "100%",
                    maxWidth: "520px",
                    background: "var(--surface)",
                    borderRadius: "var(--radius-xl)",
                    boxShadow: "var(--shadow-xl)",
                    border: "1px solid var(--gray-200)",
                    padding: "48px 40px",
                    animation: "fadeInUp 0.6s ease-out",
                }}
            >
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none", marginBottom: "24px" }}>
                        <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "20px", fontFamily: "var(--font-display)" }}>A</div>
                        <span style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-display)", background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AirTrainr</span>
                    </a>
                    <h1 style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: "8px" }}>Create Your Account</h1>
                    <p style={{ color: "var(--gray-500)", fontSize: "15px" }}>
                        Step {step} of 3 — {step === 1 ? "Choose your role" : step === 2 ? "Your details" : "Your interests"}
                    </p>
                    <div style={{ height: "4px", background: "var(--gray-100)", borderRadius: "var(--radius-full)", marginTop: "20px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(step / 3) * 100}%`, background: "var(--gradient-primary)", borderRadius: "var(--radius-full)", transition: "width var(--transition-base)" }} />
                    </div>
                </div>

                {error && (
                    <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "#fef2f2", borderLeft: "4px solid var(--error)", color: "var(--error)", fontSize: "14px", marginBottom: "24px" }}>
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <div style={{ animation: "fadeInUp 0.4s ease-out" }}>
                        <p style={{ fontSize: "15px", color: "var(--gray-600)", marginBottom: "24px", textAlign: "center" }}>How would you like to use AirTrainr?</p>
                        <div style={{ display: "grid", gap: "16px" }}>
                            {[
                                { value: "athlete" as const, emoji: "🏋️", title: "I'm an Athlete", desc: "Find and book trainers in my area" },
                                { value: "trainer" as const, emoji: "🎯", title: "I'm a Trainer", desc: "Offer my training services and grow my business" },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => { setRole(option.value); setStep(2); }}
                                    style={{
                                        padding: "24px",
                                        borderRadius: "var(--radius-lg)",
                                        border: `2px solid ${role === option.value ? "var(--primary)" : "var(--gray-200)"}`,
                                        background: role === option.value ? "var(--primary-50)" : "var(--surface)",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        transition: "all var(--transition-fast)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "16px",
                                    }}
                                >
                                    <span style={{ fontSize: "36px" }}>{option.emoji}</span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: "17px", marginBottom: "4px" }}>{option.title}</div>
                                        <div style={{ fontSize: "14px", color: "var(--gray-500)" }}>{option.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} style={{ animation: "fadeInUp 0.4s ease-out" }}>
                        <div className="form-grid" style={{ display: "grid", gap: "16px", marginBottom: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "var(--gray-700)" }}>First Name</label>
                                <input type="text" value={formData.firstName} onChange={(e) => updateField("firstName", e.target.value)} placeholder="John" required style={inputStyle}
                                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gray-200)")} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "var(--gray-700)" }}>Last Name</label>
                                <input type="text" value={formData.lastName} onChange={(e) => updateField("lastName", e.target.value)} placeholder="Doe" required style={inputStyle}
                                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gray-200)")} />
                            </div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "var(--gray-700)" }}>Email Address</label>
                            <input type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} placeholder="you@example.com" required style={inputStyle}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gray-200)")} />
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "var(--gray-700)" }}>Date of Birth</label>
                            <input type="date" value={formData.dateOfBirth} onChange={(e) => updateField("dateOfBirth", e.target.value)} required style={inputStyle}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gray-200)")} />
                            <p style={{ fontSize: "12px", color: "var(--gray-400)", marginTop: "6px" }}>Must be at least 18 years old</p>
                        </div>

                        <div className="form-grid" style={{ display: "grid", gap: "16px", marginBottom: "24px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "var(--gray-700)" }}>Password</label>
                                <input type="password" value={formData.password} onChange={(e) => updateField("password", e.target.value)} placeholder="8+ characters" required minLength={8} style={inputStyle}
                                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gray-200)")} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "var(--gray-700)" }}>Confirm</label>
                                <input type="password" value={formData.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} placeholder="Re-enter" required style={inputStyle}
                                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gray-200)")} />
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-200)", background: "var(--surface)", color: "var(--foreground)", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}>Back</button>
                            <button type="submit" style={{ flex: 2, padding: "14px", borderRadius: "var(--radius-md)", background: "var(--gradient-primary)", color: "white", border: "none", fontWeight: 700, fontSize: "15px", cursor: "pointer", boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)" }}>Continue</button>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleSubmit} style={{ animation: "fadeInUp 0.4s ease-out" }}>
                        <p style={{ fontSize: "15px", color: "var(--gray-600)", marginBottom: "24px" }}>Select the sports you&apos;re interested in:</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "32px" }}>
                            {SPORTS.map((sport) => {
                                const key = sport.toLowerCase().replace(/\s+&\s+/g, "_and_").replace(/\s+/g, "_");
                                const selected = formData.selectedSports.includes(key);
                                return (
                                    <button key={sport} type="button" onClick={() => toggleSport(key)}
                                        style={{
                                            padding: "10px 18px",
                                            borderRadius: "var(--radius-full)",
                                            border: `2px solid ${selected ? "var(--primary)" : "var(--gray-200)"}`,
                                            background: selected ? "var(--primary-50)" : "transparent",
                                            color: selected ? "var(--primary-dark)" : "var(--gray-600)",
                                            fontSize: "14px", fontWeight: 600, cursor: "pointer",
                                            transition: "all var(--transition-fast)",
                                        }}
                                    >{sport}</button>
                                );
                            })}
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button type="button" onClick={() => setStep(2)} style={{ flex: 1, padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-200)", background: "var(--surface)", color: "var(--foreground)", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}>Back</button>
                            <button type="submit" disabled={loading}
                                style={{ flex: 2, padding: "14px", borderRadius: "var(--radius-md)", background: loading ? "var(--gray-300)" : "var(--gradient-primary)", color: "white", border: "none", fontWeight: 700, fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 2px 8px rgba(99, 102, 241, 0.3)" }}>
                                {loading ? "Creating account..." : "Create Account"}
                            </button>
                        </div>
                    </form>
                )}

                <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "var(--gray-500)" }}>
                    Already have an account?{" "}
                    <a href="/auth/login" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Sign in</a>
                </p>

                <style>{`
                  .form-grid { grid-template-columns: 1fr 1fr; }
                  @media (max-width: 480px) {
                    .form-grid { grid-template-columns: 1fr !important; }
                    .register-card { padding: 32px 20px !important; }
                  }
                `}</style>
            </div>
        </div>
    );
}
