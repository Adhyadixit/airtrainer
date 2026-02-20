"use client";

import { useState } from "react";
import { loginUser } from "@/lib/auth";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await loginUser(email, password);
            window.location.href = "/dashboard";
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                    "linear-gradient(135deg, var(--gray-50) 0%, var(--primary-50) 100%)",
                padding: "24px",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "440px",
                    background: "var(--surface)",
                    borderRadius: "var(--radius-xl)",
                    boxShadow: "var(--shadow-xl)",
                    border: "1px solid var(--gray-200)",
                    padding: "48px 40px",
                    animation: "fadeInUp 0.6s ease-out",
                }}
            >
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <a
                        href="/"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            textDecoration: "none",
                            marginBottom: "24px",
                        }}
                    >
                        <div
                            style={{
                                width: "44px",
                                height: "44px",
                                borderRadius: "14px",
                                background: "var(--gradient-primary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontWeight: 800,
                                fontSize: "20px",
                                fontFamily: "var(--font-display)",
                            }}
                        >
                            A
                        </div>
                        <span
                            style={{
                                fontSize: "24px",
                                fontWeight: 800,
                                fontFamily: "var(--font-display)",
                                background: "var(--gradient-primary)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            AirTrainr
                        </span>
                    </a>
                    <h1
                        style={{
                            fontSize: "24px",
                            fontWeight: 800,
                            fontFamily: "var(--font-display)",
                            marginBottom: "8px",
                        }}
                    >
                        Welcome Back
                    </h1>
                    <p style={{ color: "var(--gray-500)", fontSize: "15px" }}>
                        Sign in to your account to continue
                    </p>
                </div>

                {error && (
                    <div
                        style={{
                            padding: "12px 16px",
                            borderRadius: "var(--radius-md)",
                            background: "#fef2f2",
                            borderLeft: "4px solid var(--error)",
                            color: "var(--error)",
                            fontSize: "14px",
                            marginBottom: "24px",
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "20px" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: 600,
                                marginBottom: "8px",
                                color: "var(--gray-700)",
                            }}
                        >
                            Email Address
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid var(--gray-200)",
                                fontSize: "15px",
                                outline: "none",
                                transition: "border-color var(--transition-fast)",
                                background: "var(--surface)",
                                color: "var(--foreground)",
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gray-200)")}
                        />
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "8px",
                            }}
                        >
                            <label
                                style={{ fontSize: "14px", fontWeight: 600, color: "var(--gray-700)" }}
                            >
                                Password
                            </label>
                            <a
                                href="/auth/forgot-password"
                                style={{
                                    fontSize: "13px",
                                    color: "var(--primary)",
                                    textDecoration: "none",
                                    fontWeight: 500,
                                }}
                            >
                                Forgot password?
                            </a>
                        </div>
                        <input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid var(--gray-200)",
                                fontSize: "15px",
                                outline: "none",
                                transition: "border-color var(--transition-fast)",
                                background: "var(--surface)",
                                color: "var(--foreground)",
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gray-200)")}
                        />
                    </div>

                    <button
                        id="login-submit"
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "16px",
                            borderRadius: "var(--radius-md)",
                            background: loading ? "var(--gray-300)" : "var(--gradient-primary)",
                            color: "white",
                            border: "none",
                            fontWeight: 700,
                            fontSize: "16px",
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "all var(--transition-fast)",
                            boxShadow: loading ? "none" : "0 2px 8px rgba(99, 102, 241, 0.3)",
                        }}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p
                    style={{
                        textAlign: "center",
                        marginTop: "24px",
                        fontSize: "14px",
                        color: "var(--gray-500)",
                    }}
                >
                    Don&apos;t have an account?{" "}
                    <a
                        href="/auth/register"
                        style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}
                    >
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
}
