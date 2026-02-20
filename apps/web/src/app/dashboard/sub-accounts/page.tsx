"use client";

import { useEffect, useState } from "react";
import { getSession, AuthUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface SubAccount {
    id: string;
    parent_user_id: string;
    profile_data: {
        first_name: string;
        last_name: string;
        age?: number;
        sport?: string;
        skill_level?: string;
        notes?: string;
    };
    max_bookings_per_month: number;
    created_at: string;
}

const MAX_SUB_ACCOUNTS = 6;
const SPORTS = ["hockey", "baseball", "basketball", "football", "soccer", "tennis", "golf", "swimming", "boxing", "lacrosse"];
const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "pro"];

export default function SubAccountsPage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [accounts, setAccounts] = useState<SubAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        age: "",
        sport: "hockey",
        skill_level: "beginner",
        notes: "",
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        const session = getSession();
        if (session) {
            setUser(session);
            loadAccounts(session);
        }
    }, []);

    const loadAccounts = async (u: AuthUser) => {
        try {
            const { data } = await supabase
                .from("sub_accounts")
                .select("*")
                .eq("parent_user_id", u.id)
                .order("created_at");
            setAccounts((data || []) as SubAccount[]);
        } catch (err) {
            console.error("Failed to load sub-accounts:", err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({ first_name: "", last_name: "", age: "", sport: "hockey", skill_level: "beginner", notes: "" });
        setEditingId(null);
        setShowForm(false);
    };

    const startEdit = (acct: SubAccount) => {
        setForm({
            first_name: acct.profile_data.first_name || "",
            last_name: acct.profile_data.last_name || "",
            age: String(acct.profile_data.age || ""),
            sport: acct.profile_data.sport || "hockey",
            skill_level: acct.profile_data.skill_level || "beginner",
            notes: acct.profile_data.notes || "",
        });
        setEditingId(acct.id);
        setShowForm(true);
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        
        if (!form.first_name.trim()) {
            errors.first_name = "First name is required";
        } else if (form.first_name.trim().length < 2) {
            errors.first_name = "First name must be at least 2 characters";
        }
        
        if (!form.last_name.trim()) {
            errors.last_name = "Last name is required";
        } else if (form.last_name.trim().length < 2) {
            errors.last_name = "Last name must be at least 2 characters";
        }
        
        if (form.age && (Number(form.age) < 3 || Number(form.age) > 99)) {
            errors.age = "Age must be between 3 and 99";
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const saveAccount = async () => {
        if (!user || !validateForm()) return;
        setSaving(true);

        const profileData = {
            first_name: form.first_name,
            last_name: form.last_name,
            age: form.age ? Number(form.age) : undefined,
            sport: form.sport,
            skill_level: form.skill_level,
            notes: form.notes || undefined,
        };

        try {
            if (editingId) {
                await supabase.from("sub_accounts").update({ profile_data: profileData }).eq("id", editingId);
                setAccounts((prev) =>
                    prev.map((a) => (a.id === editingId ? { ...a, profile_data: profileData } : a))
                );
            } else {
                const { data, error } = await supabase
                    .from("sub_accounts")
                    .insert({
                        parent_user_id: user.id,
                        profile_data: profileData,
                        max_bookings_per_month: 10,
                    })
                    .select()
                    .single();

                if (error) throw error;
                setAccounts((prev) => [...prev, data as SubAccount]);
            }
            resetForm();
        } catch (err) {
            console.error("Save failed:", err);
        } finally {
            setSaving(false);
        }
    };

    const deleteAccount = async (id: string) => {
        if (!confirm("Remove this sub-account? This cannot be undone.")) return;
        setDeletingId(id);
        setDeleteError(null);
        try {
            const { error } = await supabase.from("sub_accounts").delete().eq("id", id);
            if (error) throw error;
            setAccounts((prev) => prev.filter((a) => a.id !== id));
        } catch (err) {
            console.error("Delete failed:", err);
            setDeleteError("Failed to delete sub-account. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "11px 14px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--gray-200)",
        fontSize: "14px",
        outline: "none",
        background: "var(--surface)",
        color: "var(--foreground)",
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: "4px" }}>Sub-Accounts</h1>
                    <p style={{ color: "var(--gray-500)", fontSize: "14px" }}>
                        Manage profiles for family members ({accounts.length}/{MAX_SUB_ACCOUNTS} used)
                    </p>
                </div>
                {accounts.length < MAX_SUB_ACCOUNTS && !showForm && (
                    <button onClick={() => { resetForm(); setShowForm(true); }} style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", background: "var(--gradient-primary)", color: "white", border: "none", fontWeight: 700, fontSize: "14px", cursor: "pointer", boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)" }}>
                        + Add Sub-Account
                    </button>
                )}
            </div>

            {/* Capacity bar */}
            <div style={{ marginBottom: "24px" }}>
                <div style={{ height: "6px", borderRadius: "var(--radius-full)", background: "var(--gray-100)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(accounts.length / MAX_SUB_ACCOUNTS) * 100}%`, borderRadius: "var(--radius-full)", background: accounts.length >= MAX_SUB_ACCOUNTS ? "#f59e0b" : "var(--gradient-primary)", transition: "width 0.3s" }} />
                </div>
            </div>

            {/* Add/Edit form */}
            {showForm && (
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "2px solid var(--primary-light)", padding: "28px", marginBottom: "24px", animation: "fadeInUp 0.3s" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px", fontFamily: "var(--font-display)" }}>
                        {editingId ? "Edit Sub-Account" : "New Sub-Account"}
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-600)" }}>First Name *</label>
                            <input value={form.first_name} onChange={(e) => { setForm((p) => ({ ...p, first_name: e.target.value })); setFormErrors((p) => ({ ...p, first_name: "" })); }} style={{ ...inputStyle, borderColor: formErrors.first_name ? "#ef4444" : "var(--gray-200)" }} placeholder="First name" />
                            {formErrors.first_name && <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", display: "block" }}>{formErrors.first_name}</span>}
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-600)" }}>Last Name *</label>
                            <input value={form.last_name} onChange={(e) => { setForm((p) => ({ ...p, last_name: e.target.value })); setFormErrors((p) => ({ ...p, last_name: "" })); }} style={{ ...inputStyle, borderColor: formErrors.last_name ? "#ef4444" : "var(--gray-200)" }} placeholder="Last name" />
                            {formErrors.last_name && <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", display: "block" }}>{formErrors.last_name}</span>}
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-600)" }}>Age</label>
                            <input type="number" value={form.age} onChange={(e) => { setForm((p) => ({ ...p, age: e.target.value })); setFormErrors((p) => ({ ...p, age: "" })); }} style={{ ...inputStyle, borderColor: formErrors.age ? "#ef4444" : "var(--gray-200)" }} min={3} max={99} placeholder="Age" />
                            {formErrors.age && <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", display: "block" }}>{formErrors.age}</span>}
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-600)" }}>Primary Sport</label>
                            <select value={form.sport} onChange={(e) => setForm((p) => ({ ...p, sport: e.target.value }))} style={inputStyle}>
                                {SPORTS.map((s) => (
                                    <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-600)" }}>Skill Level</label>
                            <select value={form.skill_level} onChange={(e) => setForm((p) => ({ ...p, skill_level: e.target.value }))} style={inputStyle}>
                                {SKILL_LEVELS.map((l) => (
                                    <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--gray-600)" }}>Notes</label>
                            <input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} style={inputStyle} placeholder="Any special notes" />
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
                        <button onClick={resetForm} style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-200)", background: "var(--surface)", color: "var(--gray-600)", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
                            Cancel
                        </button>
                        <button onClick={saveAccount} disabled={saving || !form.first_name || !form.last_name} style={{ padding: "10px 24px", borderRadius: "var(--radius-md)", background: "var(--gradient-primary)", color: "white", border: "none", fontWeight: 700, fontSize: "14px", cursor: "pointer", boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)", opacity: form.first_name && form.last_name ? 1 : 0.5 }}>
                            {saving ? "Saving..." : editingId ? "Update" : "Create"}
                        </button>
                    </div>
                </div>
            )}

            {/* Account cards */}
            {accounts.length === 0 && !showForm ? (
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", padding: "60px 24px", textAlign: "center" }}>
                    <p style={{ fontSize: "48px", marginBottom: "12px" }}>👨‍👩‍👧‍👦</p>
                    <h3 style={{ fontWeight: 700, marginBottom: "8px", fontFamily: "var(--font-display)" }}>No sub-accounts yet</h3>
                    <p style={{ color: "var(--gray-500)", fontSize: "14px", marginBottom: "20px" }}>
                        Add up to 6 family members who can book sessions under your account.
                    </p>
                    <button onClick={() => setShowForm(true)} style={{ padding: "10px 24px", borderRadius: "var(--radius-md)", background: "var(--gradient-primary)", color: "white", border: "none", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
                        + Add First Sub-Account
                    </button>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                    {accounts.map((acct) => (
                        <div key={acct.id} style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", padding: "24px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                                <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-full)", background: "var(--gradient-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "18px" }}>
                                    {acct.profile_data.first_name?.[0]}{acct.profile_data.last_name?.[0]}
                                </div>
                                <div>
                                    <h4 style={{ fontWeight: 700, fontSize: "15px", fontFamily: "var(--font-display)" }}>
                                        {acct.profile_data.first_name} {acct.profile_data.last_name}
                                    </h4>
                                    {acct.profile_data.age && (
                                        <span style={{ fontSize: "12px", color: "var(--gray-400)" }}>Age {acct.profile_data.age}</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                                {acct.profile_data.sport && (
                                    <span style={{ padding: "4px 10px", borderRadius: "var(--radius-full)", background: "var(--primary-50)", color: "var(--primary)", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>
                                        {acct.profile_data.sport.replace(/_/g, " ")}
                                    </span>
                                )}
                                {acct.profile_data.skill_level && (
                                    <span style={{ padding: "4px 10px", borderRadius: "var(--radius-full)", background: "var(--gray-100)", color: "var(--gray-600)", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>
                                        {acct.profile_data.skill_level}
                                    </span>
                                )}
                            </div>

                            {acct.profile_data.notes && (
                                <p style={{ fontSize: "13px", color: "var(--gray-500)", marginBottom: "16px", lineHeight: 1.4 }}>
                                    {acct.profile_data.notes}
                                </p>
                            )}

                            <div style={{ display: "flex", gap: "8px" }}>
                                <button onClick={() => startEdit(acct)} disabled={deletingId === acct.id} style={{ flex: 1, padding: "8px", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-200)", background: "var(--surface)", color: "var(--gray-600)", fontSize: "13px", fontWeight: 600, cursor: deletingId === acct.id ? "not-allowed" : "pointer", opacity: deletingId === acct.id ? 0.5 : 1 }}>
                                    Edit
                                </button>
                                <button onClick={() => deleteAccount(acct.id)} disabled={deletingId === acct.id} style={{ padding: "8px 14px", borderRadius: "var(--radius-md)", border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontSize: "13px", fontWeight: 600, cursor: deletingId === acct.id ? "not-allowed" : "pointer", opacity: deletingId === acct.id ? 0.7 : 1 }}>
                                    {deletingId === acct.id ? "Removing..." : "Remove"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {deleteError && (
                <div style={{ marginTop: "16px", padding: "12px 16px", background: "#fef2f2", borderRadius: "var(--radius-md)", color: "#dc2626", fontSize: "14px", fontWeight: 600, borderLeft: "4px solid #dc2626" }}>
                    ❌ {deleteError}
                </div>
            )}
        </div>
    );
}
