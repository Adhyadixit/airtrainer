"use client";

import { useState } from "react";
import { registerUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

const SPORTS = [
    "Hockey", "Baseball", "Basketball", "Football", "Soccer",
    "Tennis", "Golf", "Swimming", "Boxing", "Lacrosse",
    "Wrestling", "Martial Arts", "Gymnastics", "Track & Field", "Volleyball",
];

const SKILL_LEVELS = [
    { value: "beginner", label: "Beginner", desc: "Just getting started", emoji: "🌱" },
    { value: "intermediate", label: "Intermediate", desc: "Know the basics, want to improve", emoji: "📈" },
    { value: "advanced", label: "Advanced", desc: "Competitive level athlete", emoji: "🏆" },
    { value: "pro", label: "Pro / Elite", desc: "Professional or elite level", emoji: "⭐" },
];

const TIME_PREFERENCES = [
    { value: "morning", label: "Morning", time: "6am – 12pm", emoji: "🌅" },
    { value: "afternoon", label: "Afternoon", time: "12pm – 5pm", emoji: "☀️" },
    { value: "evening", label: "Evening", time: "5pm – 9pm", emoji: "🌆" },
];

const TRAINING_TYPES = [
    { value: "private", label: "Private (1‑on‑1)" },
    { value: "semi_private", label: "Semi-Private (2‑3)" },
    { value: "group", label: "Group (4+)" },
];

export default function RegisterPage() {
    const router = useRouter();
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
        // Athlete preferences (step 4)
        skillLevel: "",
        preferredTimes: [] as string[],
        trainingTypes: [] as string[],
        budgetMax: "100",
        city: "",
        state: "",
        travelRadius: "25",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const totalSteps = role === "athlete" ? 4 : 3;

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

    const toggleArrayItem = (field: string, item: string) => {
        setFormData((prev) => {
            const arr = prev[field as keyof typeof prev] as string[];
            return {
                ...prev,
                [field]: arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item],
            };
        });
    };

    const validateAge = (dob: string): boolean => {
        if (!dob) return false;
        const birthDate = new Date(dob);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            return age - 1 >= 18;
        }
        return age >= 18;
    };

    const handleStep2Submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAge(formData.dateOfBirth)) {
            setError("You must be at least 18 years old to register");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        setError("");
        setStep(3);
    };

    const handleStep3Submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.selectedSports.length === 0) {
            setError("Please select at least one sport");
            return;
        }
        setError("");
        if (role === "athlete") {
            setStep(4); // Go to athlete preferences step
        } else {
            doRegister();
        }
    };

    const doRegister = async () => {
        setLoading(true);
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
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
                // Athlete-specific preferences
                ...(role === "athlete" ? {
                    skillLevel: formData.skillLevel || undefined,
                    preferredTimes: formData.preferredTimes,
                    trainingTypes: formData.trainingTypes,
                    budgetMax: parseInt(formData.budgetMax) || undefined,
                    city: formData.city || undefined,
                    state: formData.state || undefined,
                    travelRadius: parseInt(formData.travelRadius) || undefined,
                } : {}),
            });
            router.push(role === "trainer" ? "/dashboard/trainer/setup" : "/dashboard");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        doRegister();
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
                        Step {step} of {totalSteps} — {step === 1 ? "Choose your role" : step === 2 ? "Your details" : step === 3 ? "Your sports" : "Training preferences"}
                    </p>
                    <div style={{ height: "4px", background: "var(--gray-100)", borderRadius: "var(--radius-full)", marginTop: "20px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(step / totalSteps) * 100}%`, background: "var(--gradient-primary)", borderRadius: "var(--radius-full)", transition: "width var(--transition-base)" }} />
                    </div>
                </div>

                {error && (
                    <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "#fef2f2", borderLeft: "4px solid var(--error)", color: "var(--error)", fontSize: "14px", marginBottom: "24px" }}>
                        {error}
                    </div>
                )}

                {/* Step 1: Role Selection */}
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

                {/* Step 2: Personal Details */}
                {step === 2 && (
                    <form onSubmit={handleStep2Submit} style={{ animation: "fadeInUp 0.4s ease-out" }}>
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
                            <input type="date" value={formData.dateOfBirth}
                                onChange={(e) => {
                                    updateField("dateOfBirth", e.target.value);
                                    if (error?.includes("18 years")) setError("");
                                }}
                                required style={inputStyle}
                                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = "var(--gray-200)";
                                    if (e.target.value && !validateAge(e.target.value)) setError("You must be at least 18 years old to register");
                                }} />
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

                {/* Step 3: Sports Selection */}
                {step === 3 && (
                    <form onSubmit={handleStep3Submit} style={{ animation: "fadeInUp 0.4s ease-out" }}>
                        <p style={{ fontSize: "15px", color: "var(--gray-600)", marginBottom: "24px" }}>
                            {role === "athlete" ? "Select the sports you want to train in:" : "Select the sports you coach:"}
                        </p>
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
                            <button type="submit" style={{ flex: 2, padding: "14px", borderRadius: "var(--radius-md)", background: "var(--gradient-primary)", color: "white", border: "none", fontWeight: 700, fontSize: "15px", cursor: "pointer", boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)" }}>
                                {role === "athlete" ? "Continue" : (loading ? "Creating account..." : "Create Account")}
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 4: Athlete Training Preferences (Only for Athletes) */}
                {step === 4 && role === "athlete" && (
                    <form onSubmit={handleSubmit} style={{ animation: "fadeInUp 0.4s ease-out" }}>
                        <p style={{ fontSize: "15px", color: "var(--gray-600)", marginBottom: "20px" }}>
                            Tell us your training preferences so we can match you with the perfect coach.
                        </p>

                        {/* Skill Level */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: "var(--gray-700)" }}>Your Skill Level</label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                {SKILL_LEVELS.map((sl) => {
                                    const selected = formData.skillLevel === sl.value;
                                    return (
                                        <button key={sl.value} type="button" onClick={() => setFormData(prev => ({ ...prev, skillLevel: sl.value }))}
                                            style={{
                                                padding: "14px 12px", borderRadius: "12px", textAlign: "left",
                                                border: `2px solid ${selected ? "var(--primary)" : "var(--gray-200)"}`,
                                                background: selected ? "var(--primary-50)" : "var(--surface)",
                                                cursor: "pointer", transition: "all 0.15s",
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{ fontSize: "20px" }}>{sl.emoji}</span>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: "13px", color: selected ? "var(--primary-dark)" : "var(--foreground)" }}>{sl.label}</div>
                                                    <div style={{ fontSize: "11px", color: "var(--gray-400)" }}>{sl.desc}</div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Preferred Training Times */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: "var(--gray-700)" }}>Preferred Training Times</label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                                {TIME_PREFERENCES.map((tp) => {
                                    const selected = formData.preferredTimes.includes(tp.value);
                                    return (
                                        <button key={tp.value} type="button" onClick={() => toggleArrayItem("preferredTimes", tp.value)}
                                            style={{
                                                padding: "12px 8px", borderRadius: "12px", textAlign: "center",
                                                border: `2px solid ${selected ? "var(--primary)" : "var(--gray-200)"}`,
                                                background: selected ? "var(--primary-50)" : "var(--surface)",
                                                cursor: "pointer", transition: "all 0.15s",
                                            }}
                                        >
                                            <div style={{ fontSize: "22px", marginBottom: "4px" }}>{tp.emoji}</div>
                                            <div style={{ fontWeight: 700, fontSize: "12px", color: selected ? "var(--primary-dark)" : "var(--foreground)" }}>{tp.label}</div>
                                            <div style={{ fontSize: "10px", color: "var(--gray-400)" }}>{tp.time}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Training Type */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: "var(--gray-700)" }}>Session Type Preference</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {TRAINING_TYPES.map((tt) => {
                                    const selected = formData.trainingTypes.includes(tt.value);
                                    return (
                                        <button key={tt.value} type="button" onClick={() => toggleArrayItem("trainingTypes", tt.value)}
                                            style={{
                                                padding: "10px 16px", borderRadius: "999px",
                                                border: `2px solid ${selected ? "var(--primary)" : "var(--gray-200)"}`,
                                                background: selected ? "var(--primary-50)" : "transparent",
                                                color: selected ? "var(--primary-dark)" : "var(--gray-600)",
                                                fontSize: "13px", fontWeight: 600, cursor: "pointer",
                                                transition: "all 0.15s",
                                            }}
                                        >{tt.label}</button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Budget & Location */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-700)" }}>
                                Max Budget: ${formData.budgetMax}/hr
                            </label>
                            <input
                                type="range" min="20" max="300" step="10"
                                value={formData.budgetMax}
                                onChange={(e) => updateField("budgetMax", e.target.value)}
                                style={{ width: "100%", accentColor: "var(--primary)" }}
                            />
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--gray-400)" }}>
                                <span>$20/hr</span><span>$300/hr</span>
                            </div>
                        </div>

                        <div className="form-grid" style={{ display: "grid", gap: "12px", marginBottom: "20px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-700)" }}>City</label>
                                <input type="text" value={formData.city} onChange={(e) => updateField("city", e.target.value)} placeholder="e.g. Toronto" style={inputStyle}
                                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gray-200)")} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-700)" }}>State / Province</label>
                                <input type="text" value={formData.state} onChange={(e) => updateField("state", e.target.value)} placeholder="e.g. Ontario" style={inputStyle}
                                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gray-200)")} />
                            </div>
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-700)" }}>
                                Travel Radius: {formData.travelRadius} miles
                            </label>
                            <input
                                type="range" min="5" max="100" step="5"
                                value={formData.travelRadius}
                                onChange={(e) => updateField("travelRadius", e.target.value)}
                                style={{ width: "100%", accentColor: "var(--primary)" }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button type="button" onClick={() => setStep(3)} style={{ flex: 1, padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-200)", background: "var(--surface)", color: "var(--foreground)", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}>Back</button>
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
