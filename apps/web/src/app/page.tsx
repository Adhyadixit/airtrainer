"use client";

import { useState, useEffect } from "react";

// =============================================
// ICONS (inline SVG components)
// =============================================

const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
);

const MapPin = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);

const Star = ({ filled = false }: { filled?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
);

const Shield = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 22-8-4.6V7a1 1 0 0 1 .5-.87l7-4a1 1 0 0 1 1 0l7 4A1 1 0 0 1 20 7v10.4Z" /><path d="m9 12 2 2 4-4" /></svg>
);

const Calendar = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
);

const Zap = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
);

const Users = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);

const DollarSign = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
);

const Search = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);

const Menu = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
);

const X = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);

// =============================================
// SPORTS DATA
// =============================================

const SPORTS = [
  { name: "Hockey", emoji: "🏒", color: "#1a73e8" },
  { name: "Baseball", emoji: "⚾", color: "#d63031" },
  { name: "Basketball", emoji: "🏀", color: "#e17055" },
  { name: "Football", emoji: "🏈", color: "#6c5ce7" },
  { name: "Soccer", emoji: "⚽", color: "#00b894" },
  { name: "Tennis", emoji: "🎾", color: "#fdcb6e" },
  { name: "Golf", emoji: "⛳", color: "#55efc4" },
  { name: "Swimming", emoji: "🏊", color: "#0984e3" },
  { name: "Boxing", emoji: "🥊", color: "#d63031" },
  { name: "Lacrosse", emoji: "🥍", color: "#a29bfe" },
];

const FEATURED_TRAINERS = [
  {
    name: "Marcus Johnson",
    sport: "Basketball",
    rating: 4.9,
    reviews: 127,
    rate: 85,
    location: "Los Angeles, CA",
    verified: true,
    tagline: "Former NCAA D1 Player",
    avatar: "MJ",
    color: "#e17055",
  },
  {
    name: "Sarah Chen",
    sport: "Hockey",
    rating: 5.0,
    reviews: 89,
    rate: 95,
    location: "Toronto, ON",
    verified: true,
    tagline: "Olympic Training Staff",
    avatar: "SC",
    color: "#1a73e8",
  },
  {
    name: "David Williams",
    sport: "Baseball",
    rating: 4.8,
    reviews: 204,
    rate: 75,
    location: "Houston, TX",
    verified: true,
    tagline: "15+ Years Coaching",
    avatar: "DW",
    color: "#d63031",
  },
  {
    name: "Emily Rodriguez",
    sport: "Soccer",
    rating: 4.9,
    reviews: 156,
    rate: 70,
    location: "Miami, FL",
    verified: true,
    tagline: "Licensed FIFA Coach",
    avatar: "ER",
    color: "#00b894",
  },
];

const STATS = [
  { number: "5,000+", label: "Verified Trainers" },
  { number: "50,000+", label: "Sessions Booked" },
  { number: "15+", label: "Sports Available" },
  { number: "98%", label: "Satisfaction Rate" },
];

// =============================================
// NAVIGATION COMPONENT
// =============================================

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transition: "all var(--transition-base)",
        background: scrolled ? "var(--surface-glass)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        borderBottom: scrolled ? "1px solid var(--gray-200)" : "1px solid transparent",
        padding: scrolled ? "12px 0" : "20px 0",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "var(--gradient-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 800,
            fontSize: "18px",
            fontFamily: "var(--font-display)",
          }}>
            A
          </div>
          <span style={{
            fontSize: "22px",
            fontWeight: 800,
            fontFamily: "var(--font-display)",
            background: "var(--gradient-primary)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            AirTrainr
          </span>
        </a>

        {/* Desktop Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }} className="desktop-nav">
          {["Find Trainers", "How It Works", "Sports", "Pricing"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              style={{
                textDecoration: "none",
                color: "var(--gray-600)",
                fontSize: "14px",
                fontWeight: 500,
                transition: "color var(--transition-fast)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gray-600)")}
            >
              {item}
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }} className="desktop-nav">
          <a
            href="/auth/login"
            style={{
              textDecoration: "none",
              color: "var(--gray-700)",
              fontSize: "14px",
              fontWeight: 600,
              padding: "10px 20px",
              borderRadius: "var(--radius-md)",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--gray-100)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Log In
          </a>
          <a
            href="/auth/register"
            style={{
              textDecoration: "none",
              color: "white",
              fontSize: "14px",
              fontWeight: 600,
              padding: "10px 24px",
              borderRadius: "var(--radius-md)",
              background: "var(--gradient-primary)",
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(99, 102, 241, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(99, 102, 241, 0.3)";
            }}
          >
            Get Started
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-menu-btn"
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--foreground)",
            padding: "8px",
          }}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--surface)",
            borderBottom: "1px solid var(--gray-200)",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            animation: "fadeInUp 0.3s ease-out",
          }}
        >
          {["Find Trainers", "How It Works", "Sports", "Pricing"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              style={{ textDecoration: "none", color: "var(--foreground)", fontSize: "16px", fontWeight: 500, padding: "8px 0" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <a href="/auth/login" style={{ flex: 1, textAlign: "center", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-200)", textDecoration: "none", color: "var(--foreground)", fontWeight: 600 }}>Log In</a>
            <a href="/auth/register" style={{ flex: 1, textAlign: "center", padding: "12px", borderRadius: "var(--radius-md)", background: "var(--gradient-primary)", color: "white", textDecoration: "none", fontWeight: 600 }}>Get Started</a>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}

// =============================================
// HERO SECTION
// =============================================

function HeroSection() {
  const [activeSport, setActiveSport] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSport((prev) => (prev + 1) % SPORTS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="hero"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        background: "var(--gradient-hero)",
      }}
    >
      {/* Background decorative elements */}
      <div style={{
        position: "absolute",
        top: "-20%",
        right: "-10%",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} className="animate-float" />
      <div style={{
        position: "absolute",
        bottom: "-15%",
        left: "-5%",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div id="hero-content" style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "120px 24px 80px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "64px",
        alignItems: "center",
        width: "100%",
      }}>
        {/* Left - Copy */}
        <div className="animate-fade-in-up">
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "var(--radius-full)",
            background: "var(--primary-50)",
            border: "1px solid var(--primary-100)",
            marginBottom: "24px",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--primary-dark)",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--success)", animation: "pulse-soft 2s infinite" }} />
            Now available across USA & Canada
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 900,
            fontFamily: "var(--font-display)",
            lineHeight: 1.1,
            marginBottom: "24px",
            color: "var(--foreground)",
          }}>
            Train with the{" "}
            <span style={{
              background: "var(--gradient-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Best{" "}
              <span
                key={activeSport}
                style={{
                  display: "inline-block",
                  animation: "fadeInUp 0.5s ease-out",
                }}
              >
                {SPORTS[activeSport].name}
              </span>
            </span>
            <br />
            Trainers Near You
          </h1>

          <p style={{
            fontSize: "18px",
            lineHeight: 1.7,
            color: "var(--gray-500)",
            marginBottom: "40px",
            maxWidth: "520px",
          }}>
            Connect with verified, world-class sports trainers in your area.
            Book personalized 1-on-1 sessions and take your game to the next level.
          </p>

          {/* Search Bar */}
          <div className="hero-search-bar" style={{
            display: "flex",
            gap: "0",
            background: "var(--surface)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-xl)",
            border: "1px solid var(--gray-200)",
            overflow: "hidden",
            maxWidth: "520px",
            width: "100%",
          }}>
            <div className="hero-search-input" style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px" }}>
              <Search />
              <input
                type="text"
                placeholder="Enter your city or zip code..."
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: "15px",
                  width: "100%",
                  background: "transparent",
                  color: "var(--foreground)",
                }}
              />
            </div>
            <button
              className="hero-search-button"
              style={{
                padding: "16px 32px",
                background: "var(--gradient-primary)",
                color: "white",
                border: "none",
                fontWeight: 700,
                fontSize: "15px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all var(--transition-fast)",
                whiteSpace: "nowrap",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              Find Trainers <ChevronRight />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="hero-quick-stats" style={{ display: "flex", gap: "24px", marginTop: "48px", flexWrap: "wrap" }}>
            {STATS.slice(0, 3).map((stat) => (
              <div key={stat.label}>
                <div style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{stat.number}</div>
                <div style={{ fontSize: "13px", color: "var(--gray-400)", fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Visual */}
        <div style={{ position: "relative" }} className="animate-slide-right hero-visual">
          {/* Floating trainer cards */}
          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: "500px",
            margin: "0 auto",
          }}>
            {/* Main card */}
            <div style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-xl)",
              padding: "32px",
              boxShadow: "var(--shadow-xl)",
              border: "1px solid var(--gray-200)",
              position: "relative",
              zIndex: 2,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <div style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "var(--radius-lg)",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "24px",
                  fontWeight: 800,
                  fontFamily: "var(--font-display)",
                }}>
                  SC
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "18px" }}>Sarah Chen</div>
                  <div style={{ fontSize: "13px", color: "var(--gray-400)" }}>🏒 Hockey • Toronto, ON</div>
                </div>
                <div style={{
                  marginLeft: "auto",
                  background: "var(--primary-50)",
                  color: "var(--primary-dark)",
                  padding: "4px 12px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "12px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}>
                  <Shield /> Verified
                </div>
              </div>

              <p style={{ color: "var(--gray-500)", fontSize: "14px", lineHeight: 1.6, marginBottom: "20px" }}>
                Former Olympic training staff with 12+ years of experience. Specialized in skating technique, stick handling, and game strategy.
              </p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--gray-100)", paddingTop: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} filled />
                  ))}
                  <span style={{ fontSize: "14px", fontWeight: 700, marginLeft: "4px" }}>5.0</span>
                  <span style={{ fontSize: "13px", color: "var(--gray-400)" }}>(89)</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: "20px", color: "var(--primary)" }}>$95<span style={{ fontSize: "13px", fontWeight: 500, color: "var(--gray-400)" }}>/hr</span></div>
              </div>

              <button style={{
                width: "100%",
                marginTop: "20px",
                padding: "14px",
                borderRadius: "var(--radius-md)",
                background: "var(--gradient-primary)",
                color: "white",
                border: "none",
                fontWeight: 700,
                fontSize: "15px",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
              }}>
                Book Session
              </button>
            </div>

            {/* Floating badge - Reviews */}
            <div style={{
              position: "absolute",
              top: "-16px",
              right: "-20px",
              background: "var(--surface)",
              borderRadius: "var(--radius-lg)",
              padding: "16px 20px",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--gray-200)",
              zIndex: 3,
              animation: "float 4s ease-in-out infinite",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex" }}>
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} filled />)}
                </div>
              </div>
              <div style={{ fontSize: "13px", color: "var(--gray-500)", marginTop: "4px" }}>
                <span style={{ fontWeight: 700, color: "var(--foreground)" }}>4.9</span> avg rating
              </div>
            </div>

            {/* Floating badge - Booked */}
            <div style={{
              position: "absolute",
              bottom: "60px",
              left: "-30px",
              background: "var(--surface)",
              borderRadius: "var(--radius-lg)",
              padding: "14px 18px",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--gray-200)",
              zIndex: 3,
              animation: "float 5s ease-in-out infinite reverse",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--success), #34d399)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>Session Booked!</div>
                  <div style={{ fontSize: "12px", color: "var(--gray-400)" }}>Just now</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @media (max-width: 968px) {
            #hero-content { grid-template-columns: 1fr !important; padding: 100px 16px 60px !important; gap: 32px !important; }
            .hero-visual { display: none !important; }
          }
          @media (max-width: 480px) {
            .hero-search-bar { flex-direction: column !important; background: transparent !important; box-shadow: none !important; border: none !important; gap: 10px !important; max-width: 100% !important; }
            .hero-search-input { background: var(--surface); border: 1px solid var(--gray-200); border-radius: var(--radius-lg); }
            .hero-search-button { width: 100% !important; border-radius: var(--radius-lg); padding: 14px 24px !important; }
            .hero-quick-stats { gap: 16px !important; }
            .hero-quick-stats > div { min-width: 80px; }
          }
        `}</style>
      </div>
    </section>
  );
}

// =============================================
// HOW IT WORKS SECTION
// =============================================

function HowItWorksSection() {
  const steps = [
    {
      icon: <Search />,
      title: "Find Your Trainer",
      description: "Search by sport, location, and skill level. Browse profiles, reviews, and certifications.",
      color: "var(--primary)",
      bgColor: "var(--primary-50)",
    },
    {
      icon: <Calendar />,
      title: "Book a Session",
      description: "Pick a date, time, and location that works for both of you. Pay securely through the platform.",
      color: "var(--accent)",
      bgColor: "#ecfeff",
    },
    {
      icon: <Zap />,
      title: "Train & Improve",
      description: "Meet your trainer and get personalized coaching. Track progress and book again.",
      color: "var(--success)",
      bgColor: "#ecfdf5",
    },
  ];

  return (
    <section id="how-it-works" style={{ padding: "80px 16px", background: "var(--surface-elevated)", overflowX: "hidden" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }} className="animate-fade-in-up">
          <div style={{
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: "var(--radius-full)",
            background: "var(--primary-50)",
            color: "var(--primary-dark)",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}>
            How It Works
          </div>
          <h2 style={{
            fontSize: "clamp(28px, 3.5vw, 44px)",
            fontWeight: 800,
            fontFamily: "var(--font-display)",
            marginBottom: "16px",
          }}>
            Start Training in <span style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>3 Simple Steps</span>
          </h2>
          <p style={{ fontSize: "17px", color: "var(--gray-500)", maxWidth: "560px", margin: "0 auto" }}>
            From finding your ideal trainer to booking your first session — we've made it effortless.
          </p>
        </div>

        <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px" }}>
          {steps.map((step, index) => (
            <div
              key={step.title}
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-xl)",
                padding: "40px 32px",
                position: "relative",
                border: "1px solid var(--gray-200)",
                transition: "all var(--transition-base)",
                cursor: "default",
                animation: `fadeInUp 0.6s ease-out ${index * 0.15}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "var(--shadow-xl)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                position: "absolute",
                top: "20px",
                right: "24px",
                fontSize: "64px",
                fontWeight: 900,
                fontFamily: "var(--font-display)",
                color: "var(--gray-100)",
                lineHeight: 1,
              }}>
                {index + 1}
              </div>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "var(--radius-lg)",
                background: step.bgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: step.color,
                marginBottom: "24px",
              }}>
                {step.icon}
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", fontFamily: "var(--font-display)" }}>{step.title}</h3>
              <p style={{ fontSize: "15px", color: "var(--gray-500)", lineHeight: 1.7 }}>{step.description}</p>
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 768px) {
            .steps-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
            #how-it-works { padding: 60px 16px !important; }
          }
        `}</style>
      </div>
    </section>
  );
}

// =============================================
// FEATURED TRAINERS SECTION
// =============================================

function FeaturedTrainersSection() {
  return (
    <section id="find-trainers" style={{ padding: "80px 16px", overflowX: "hidden" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "48px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{
              display: "inline-block",
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              background: "var(--primary-50)",
              color: "var(--primary-dark)",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}>
              Top Rated
            </div>
            <h2 style={{
              fontSize: "clamp(28px, 3.5vw, 44px)",
              fontWeight: 800,
              fontFamily: "var(--font-display)",
            }}>
              Featured <span style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Trainers</span>
            </h2>
          </div>
          <a href="/trainers" style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--primary)",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "15px",
            transition: "gap var(--transition-fast)",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.gap = "10px"; }}
            onMouseLeave={(e) => { e.currentTarget.style.gap = "6px"; }}
          >
            View All Trainers <ChevronRight />
          </a>
        </div>

        <div className="trainers-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
          {FEATURED_TRAINERS.map((trainer, index) => (
            <div
              key={trainer.name}
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-xl)",
                overflow: "hidden",
                border: "1px solid var(--gray-200)",
                transition: "all var(--transition-base)",
                cursor: "pointer",
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "var(--shadow-xl)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Header gradient */}
              <div style={{
                height: "100px",
                background: `linear-gradient(135deg, ${trainer.color}22, ${trainer.color}44)`,
                position: "relative",
              }}>
                <div style={{
                  position: "absolute",
                  bottom: "-32px",
                  left: "20px",
                  width: "64px",
                  height: "64px",
                  borderRadius: "var(--radius-lg)",
                  background: `linear-gradient(135deg, ${trainer.color}, ${trainer.color}cc)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 800,
                  fontSize: "20px",
                  fontFamily: "var(--font-display)",
                  border: "3px solid var(--surface)",
                }}>
                  {trainer.avatar}
                </div>
                {trainer.verified && (
                  <div style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: "rgba(255,255,255,0.95)",
                    borderRadius: "var(--radius-full)",
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--primary-dark)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}>
                    <Shield /> Verified
                  </div>
                )}
              </div>

              <div style={{ padding: "44px 20px 20px" }}>
                <h3 style={{ fontWeight: 700, fontSize: "17px", marginBottom: "4px" }}>{trainer.name}</h3>
                <p style={{ fontSize: "13px", color: "var(--gray-400)", marginBottom: "4px" }}>{trainer.tagline}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "var(--gray-500)", marginBottom: "16px" }}>
                  <MapPin /> {trainer.location}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Star filled />
                    <span style={{ fontWeight: 700, fontSize: "14px" }}>{trainer.rating}</span>
                    <span style={{ fontSize: "13px", color: "var(--gray-400)" }}>({trainer.reviews})</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "18px", color: "var(--primary)" }}>
                    ${trainer.rate}<span style={{ fontSize: "12px", fontWeight: 500, color: "var(--gray-400)" }}>/hr</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 1024px) {
            .trainers-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (max-width: 640px) {
            .trainers-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
            #find-trainers { padding: 60px 16px !important; }
          }
        `}</style>
      </div>
    </section>
  );
}

// =============================================
// SPORTS SECTION
// =============================================

function SportsSection() {
  return (
    <section id="sports" style={{ padding: "80px 16px", background: "var(--surface-elevated)", overflowX: "hidden" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <div style={{
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: "var(--radius-full)",
            background: "var(--primary-50)",
            color: "var(--primary-dark)",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}>
            Sports We Cover
          </div>
          <h2 style={{
            fontSize: "clamp(28px, 3.5vw, 44px)",
            fontWeight: 800,
            fontFamily: "var(--font-display)",
            marginBottom: "16px",
          }}>
            15+ Sports, <span style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>One Platform</span>
          </h2>
        </div>

        <div className="sports-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
          {SPORTS.map((sport, index) => (
            <div
              key={sport.name}
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-lg)",
                padding: "24px 16px",
                textAlign: "center",
                border: "1px solid var(--gray-200)",
                transition: "all var(--transition-base)",
                cursor: "pointer",
                animation: `fadeInUp 0.5s ease-out ${index * 0.06}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
                e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                e.currentTarget.style.borderColor = sport.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "var(--gray-200)";
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>{sport.emoji}</div>
              <div style={{ fontWeight: 600, fontSize: "14px" }}>{sport.name}</div>
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 768px) {
            .sports-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 12px !important; }
            #sports { padding: 60px 16px !important; }
          }
          @media (max-width: 480px) {
            .sports-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
            .sports-grid > div { padding: 20px 12px !important; }
          }
        `}</style>
      </div>
    </section>
  );
}

// =============================================
// WHY AIRTRAINR SECTION
// =============================================

function WhySection() {
  const features = [
    {
      icon: <Shield />,
      title: "Verified Trainers",
      description: "Every trainer is background-checked and credentials-verified before joining the platform.",
      color: "var(--primary)",
      bg: "var(--primary-50)",
    },
    {
      icon: <DollarSign />,
      title: "Secure Payments",
      description: "Escrow system protects your money. Funds are only released after session completion.",
      color: "var(--accent)",
      bg: "#ecfeff",
    },
    {
      icon: <Calendar />,
      title: "Flexible Scheduling",
      description: "Book sessions that fit your calendar. Sync with Google Calendar or Apple Calendar.",
      color: "var(--success)",
      bg: "#ecfdf5",
    },
    {
      icon: <Users />,
      title: "Family Accounts",
      description: "Create up to 6 sub-accounts for family members. One account, multiple athletes.",
      color: "var(--warning)",
      bg: "#fffbeb",
    },
  ];

  return (
    <section id="why-airtrainr" style={{ padding: "80px 16px", overflowX: "hidden" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div className="why-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          <div>
            <div style={{
              display: "inline-block",
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              background: "var(--primary-50)",
              color: "var(--primary-dark)",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}>
              Why AirTrainr
            </div>
            <h2 style={{
              fontSize: "clamp(28px, 3.5vw, 44px)",
              fontWeight: 800,
              fontFamily: "var(--font-display)",
              marginBottom: "24px",
            }}>
              Built for <span style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Athletes & Trainers</span>
            </h2>
            <p style={{ fontSize: "17px", color: "var(--gray-500)", lineHeight: 1.7, marginBottom: "40px" }}>
              We've created the most trusted platform for connecting athletes with trainers.
              Every feature is designed to make training accessible, safe, and effective.
            </p>

            <div className="stats-row" style={{
              display: "flex",
              gap: "16px",
              padding: "24px",
              background: "var(--surface-elevated)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--gray-200)",
            }}>
              {STATS.map((stat) => (
                <div key={stat.label} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--primary)" }}>{stat.number}</div>
                  <div style={{ fontSize: "12px", color: "var(--gray-400)", marginTop: "4px" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {features.map((feature, index) => (
              <div
                key={feature.title}
                style={{
                  background: "var(--surface)",
                  borderRadius: "var(--radius-xl)",
                  padding: "28px 24px",
                  border: "1px solid var(--gray-200)",
                  transition: "all var(--transition-base)",
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-md)",
                  background: feature.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: feature.color,
                  marginBottom: "16px",
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "16px", marginBottom: "8px" }}>{feature.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--gray-500)", lineHeight: 1.6 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 968px) {
            .why-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          }
          @media (max-width: 640px) {
            .features-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
            #why-airtrainr { padding: 60px 16px !important; }
            .stats-row { flex-wrap: wrap !important; gap: 12px !important; }
            .stats-row > div { flex: 1 1 40% !important; text-align: center !important; }
          }
        `}</style>
      </div>
    </section>
  );
}

// =============================================
// CTA SECTION
// =============================================

function CTASection() {
  return (
    <section style={{
      padding: "80px 16px",
      background: "var(--gradient-dark)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background decoration */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <h2 style={{
          fontSize: "clamp(28px, 4vw, 48px)",
          fontWeight: 900,
          fontFamily: "var(--font-display)",
          color: "white",
          marginBottom: "20px",
          lineHeight: 1.2,
        }}>
          Ready to Unlock Your Athletic Potential?
        </h2>
        <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", marginBottom: "48px", lineHeight: 1.7 }}>
          Join thousands of athletes training smarter with AirTrainr. Your perfect trainer is just a click away.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="/auth/register?role=athlete"
            style={{
              padding: "16px 40px",
              borderRadius: "var(--radius-md)",
              background: "var(--gradient-primary)",
              color: "white",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 16px rgba(99, 102, 241, 0.4)",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 24px rgba(99, 102, 241, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(99, 102, 241, 0.4)";
            }}
          >
            Find a Trainer <ChevronRight />
          </a>
          <a
            href="/auth/register?role=trainer"
            style={{
              padding: "16px 40px",
              borderRadius: "var(--radius-md)",
              background: "transparent",
              color: "white",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "16px",
              border: "2px solid rgba(255,255,255,0.25)",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Become a Trainer
          </a>
        </div>
      </div>
    </section>
  );
}

// =============================================
// FOOTER
// =============================================

function Footer() {
  return (
    <footer style={{
      padding: "60px 16px 40px",
      background: "var(--gray-950)",
      color: "var(--gray-400)",
      overflowX: "hidden",
    }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "48px", marginBottom: "64px" }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "var(--gradient-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 800,
                fontSize: "16px",
              }}>A</div>
              <span style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-display)", color: "white" }}>AirTrainr</span>
            </div>
            <p style={{ fontSize: "14px", lineHeight: 1.7, maxWidth: "320px" }}>
              The premier marketplace connecting athletes with verified sports trainers across USA & Canada.
            </p>
          </div>

          {/* Links */}
          {[
            {
              title: "Platform",
              links: ["Find Trainers", "Become a Trainer", "Sports", "Pricing", "Download App"],
            },
            {
              title: "Company",
              links: ["About Us", "Careers", "Blog", "Press", "Contact"],
            },
            {
              title: "Legal",
              links: ["Terms of Service", "Privacy Policy", "Cookie Policy", "Safety"],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 style={{ color: "white", fontWeight: 700, fontSize: "14px", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{col.title}</h4>
              <ul style={{ listStyle: "none" }}>
                {col.links.map((link) => (
                  <li key={link} style={{ marginBottom: "10px" }}>
                    <a
                      href="#"
                      style={{ color: "var(--gray-400)", textDecoration: "none", fontSize: "14px", transition: "color var(--transition-fast)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gray-400)")}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--gray-800)", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <p style={{ fontSize: "13px" }}>© 2026 AirTrainr. All rights reserved.</p>
          <div style={{ display: "flex", gap: "20px" }}>
            {["🇺🇸 United States", "🇨🇦 Canada"].map((region) => (
              <span key={region} style={{ fontSize: "13px" }}>{region}</span>
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
          }
          @media (max-width: 480px) {
            .footer-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          }
        `}</style>
      </div>
    </footer>
  );
}

// =============================================
// MAIN PAGE
// =============================================

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <FeaturedTrainersSection />
      <SportsSection />
      <WhySection />
      <CTASection />
      <Footer />
    </>
  );
}
