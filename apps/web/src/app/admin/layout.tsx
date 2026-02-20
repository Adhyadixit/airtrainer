"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, clearSession, AuthUser } from "@/lib/auth";
import {
    LayoutDashboard,
    Users,
    Dumbbell,
    CalendarCheck,
    CreditCard,
    ShieldAlert,
    Settings,
    LogOut,
    Bell,
    Zap
} from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const session = await getSession();
            if (!session) {
                router.push("/auth/login");
                return;
            }
            if (session.role !== "admin") {
                router.push("/dashboard");
                return;
            }
            setUser(session);
            setLoading(false);
        };

        checkAuth();
    }, [router]);

    const handleLogout = async () => {
        await clearSession();
        router.push("/auth/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!user) return null;
    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/admin", mobileIcon: LayoutDashboard },
        { icon: <Users size={20} />, label: "Athletes", href: "/admin/athletes", mobileIcon: Users },
        { icon: <Dumbbell size={20} />, label: "Trainers", href: "/admin/trainers", mobileIcon: Dumbbell },
        { icon: <CalendarCheck size={20} />, label: "Bookings", href: "/admin/bookings", mobileIcon: CalendarCheck },
        { icon: <CreditCard size={20} />, label: "Payments", href: "/admin/payments", mobileIcon: CreditCard },
        { icon: <ShieldAlert size={20} />, label: "Disputes", href: "/admin/disputes", mobileIcon: ShieldAlert },
        { icon: <Settings size={20} />, label: "Settings", href: "/admin/settings", mobileIcon: Settings },
    ];

    const mobileNavItems = [
        { label: "Home", href: "/admin", icon: LayoutDashboard },
        { label: "Athletes", href: "/admin/athletes", icon: Users },
        { label: "Trainers", href: "/admin/trainers", icon: Dumbbell },
        { label: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
        { label: "Settings", href: "/admin/settings", icon: Settings },
    ];

    return (
        <div className="flex h-[100dvh] bg-[#f8fafc] text-[#0f172a] font-sans overflow-hidden">
            {/* Desktop Sidebar — hidden on mobile */}
            <aside className="w-64 bg-white border-r border-[#e2e8f0] flex-col hidden md:flex z-10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="h-[80px] flex items-center px-6 border-b border-[#e2e8f0]">
                    <Link href="/admin" className="flex items-center gap-2">
                        <div className="w-[36px] h-[36px] rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
                            A
                        </div>
                        <span className="text-xl font-black bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] bg-clip-text text-transparent tracking-tight">
                            Admin
                        </span>
                    </Link>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    <div className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider mb-4 px-2">
                        Overview
                    </div>
                    {menuItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${item.label === "Dashboard"
                                ? "bg-[#eff6ff] text-[#2563eb] font-semibold"
                                : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] font-medium"
                                }`}
                        >
                            {item.label === "Dashboard" && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#2563eb] rounded-r-md"></div>
                            )}
                            <span className={`transition-transform duration-200 ${item.label === "Dashboard" ? "" : "group-hover:scale-110 group-hover:text-[#2563eb]"}`}>
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-[#e2e8f0]">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1e3a8a] to-[#3b82f6] flex items-center justify-center text-white font-bold shadow-md">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold truncate">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-[#64748b] truncate">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold text-[#ef4444] bg-[#fef2f2] hover:bg-[#fee2e2] transition-colors"
                    >
                        <LogOut size={16} />
                        Exit Admin Area
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative">
                {/* Mobile Header */}
                <header className="md:hidden h-14 bg-white/90 backdrop-blur-lg border-b border-[#e2e8f0] flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm">
                    <Link href="/admin" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            A
                        </div>
                        <span className="text-lg font-black bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] bg-clip-text text-transparent tracking-tight">
                            Admin
                        </span>
                    </Link>
                    <div className="flex items-center gap-2 relative">
                        <button
                            onClick={() => setMobileProfileOpen(!mobileProfileOpen)}
                            className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1e3a8a] to-[#3b82f6] flex items-center justify-center text-white text-xs font-bold"
                        >
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </button>

                        {/* Mobile Profile Dropdown */}
                        {mobileProfileOpen && (
                            <div className="absolute top-10 right-0 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 overflow-hidden">
                                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                                    <p className="text-sm font-bold text-slate-800">{user.firstName} {user.lastName}</p>
                                    <p className="text-xs text-slate-500">{user.email}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
                                >
                                    <LogOut size={16} />
                                    <span>Log Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Desktop Header */}
                <header className="hidden md:flex h-[80px] bg-white/80 backdrop-blur-md border-b border-[#e2e8f0] items-center justify-between px-8 sticky top-0 z-10 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
                    <h1 className="text-2xl font-black text-[#0f172a] tracking-tight">Dashboard Overview</h1>
                    <div className="flex items-center gap-4">
                        <div className="h-10 px-4 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] flex items-center gap-2 text-[#64748b] text-sm font-medium">
                            <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
                            System Online
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 dashboard-main-content">
                    <div className="max-w-7xl mx-auto animation-fade-in-up">
                        {children}
                    </div>
                </div>

                {/* Mobile Bottom Navigation Bar */}
                <div className="mobile-bottom-nav md:hidden">
                    <div className="mobile-bottom-nav-items">
                        {mobileNavItems.map((item) => {
                            const isActive = (() => {
                                if (item.href === "/admin") return typeof window !== "undefined" && window.location.pathname === "/admin";
                                return typeof window !== "undefined" && window.location.pathname.startsWith(item.href);
                            })();
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`mobile-bottom-nav-item ${isActive ? "active" : ""}`}
                                >
                                    <item.icon size={22} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </main>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
        .animation-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    );
}
