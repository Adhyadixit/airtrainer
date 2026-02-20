"use client";

import { useEffect, useState } from "react";
import { getSession, clearSession, AuthUser } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Search,
    Calendar,
    Users,
    MessageSquare,
    Bell,
    Settings,
    LogOut,
    CreditCard,
    Star,
    Clock,
    ShieldAlert,
    ChevronRight,
    Zap
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            const session = await getSession();
            if (!session) {
                router.push("/auth/login");
                return;
            }

            // Redirect admins to the dedicated admin layout
            if (session.role === "admin") {
                router.push("/admin");
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">
                <div className="relative flex justify-center items-center">
                    <div className="absolute animate-ping w-12 h-12 rounded-full bg-indigo-500 opacity-20"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600"></div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const navItems = [
        ...(user.role === "trainer" ? [
            { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
            { label: "Availability", href: "/dashboard/availability", icon: Clock },
            { label: "Bookings", href: "/dashboard/bookings", icon: Calendar },
            { label: "Earnings", href: "/dashboard/earnings", icon: CreditCard },
            { label: "Reviews", href: "/dashboard/reviews", icon: Star },
        ] : []),
        ...(user.role === "athlete" ? [
            { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
            { label: "Find Trainers", href: "/dashboard/search", icon: Search },
            { label: "My Sessions", href: "/dashboard/bookings", icon: Calendar },
            { label: "Sub-Accounts", href: "/dashboard/sub-accounts", icon: Users },
        ] : []),
        ...(user.role === "admin" ? [
            { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
            { label: "Admin Panel", href: "/dashboard/admin", icon: ShieldAlert },
        ] : []),
        { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
        { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
        { label: "Profile", href: "/dashboard/profile", icon: Settings },
    ];

    // Pick the most important items for mobile bottom nav (max 5)
    const mobileNavItems = (() => {
        if (user.role === "trainer") {
            return [
                { label: "Home", href: "/dashboard", icon: LayoutDashboard },
                { label: "Bookings", href: "/dashboard/bookings", icon: Calendar },
                { label: "Earnings", href: "/dashboard/earnings", icon: CreditCard },
                { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
                { label: "Profile", href: "/dashboard/profile", icon: Settings },
            ];
        }
        if (user.role === "athlete") {
            return [
                { label: "Home", href: "/dashboard", icon: LayoutDashboard },
                { label: "Search", href: "/dashboard/search", icon: Search },
                { label: "Sessions", href: "/dashboard/bookings", icon: Calendar },
                { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
                { label: "Profile", href: "/dashboard/profile", icon: Settings },
            ];
        }
        return [
            { label: "Home", href: "/dashboard", icon: LayoutDashboard },
            { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
            { label: "Alerts", href: "/dashboard/notifications", icon: Bell },
            { label: "Profile", href: "/dashboard/profile", icon: Settings },
        ];
    })();

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans flex text-slate-900 selection:bg-indigo-500/30">
            {/* Desktop Sidebar — hidden on mobile */}
            <aside
                className="hidden lg:flex fixed top-0 h-screen inset-y-0 left-0 z-50 w-[280px] bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r border-slate-100 flex-col"
            >
                {/* Logo Area */}
                <div className="h-20 flex items-center justify-between px-8 border-b border-slate-100/60 bg-white/50 backdrop-blur-md">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white">
                            <Zap size={20} className="fill-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
                            AirTrainr
                        </span>
                    </Link>
                </div>

                {/* User Profile Card */}
                <div className="p-6">
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-600 font-bold text-lg shadow-inner">
                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 truncate text-sm">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs font-medium text-slate-500 capitalize flex items-center gap-1 mt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'trainer' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                                {user.role}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 pb-6 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200">
                    <div className="px-4 py-2 text-xs font-bold tracking-wider text-slate-400 uppercase mb-2">Menu</div>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${isActive
                                    ? "bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full"></div>
                                )}
                                <div className="flex items-center gap-3 relative z-10">
                                    <item.icon
                                        size={20}
                                        className={`transition-colors duration-300 ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`}
                                    />
                                    <span className={`font-semibold text-sm ${isActive ? "" : "font-medium"}`}>{item.label}</span>
                                </div>
                                {isActive && <ChevronRight size={16} className="text-indigo-400" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-all duration-300"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-50/30 lg:ml-[280px]">
                {/* Mobile Header — simplified, no hamburger needed */}
                <header className="lg:hidden h-16 bg-white/90 backdrop-blur-lg border-b border-slate-200/60 sticky top-0 flex items-center justify-between px-4 z-30 shadow-sm">
                    <Link href="/dashboard" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white">
                            <Zap size={16} className="fill-white" />
                        </div>
                        <span className="font-bold text-slate-900 text-lg tracking-tight">AirTrainr</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/notifications" className="relative p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <Bell size={18} className="text-slate-500" />
                        </Link>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-100 to-violet-100 flex items-center justify-center border border-slate-200">
                            <span className="text-xs font-bold text-indigo-700">{user.firstName.charAt(0)}{user.lastName.charAt(0)}</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto w-full dashboard-main-content">
                    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="mobile-bottom-nav lg:hidden">
                <div className="mobile-bottom-nav-items">
                    {mobileNavItems.map((item) => {
                        const isActive = pathname === item.href;
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
        </div>
    );
}

