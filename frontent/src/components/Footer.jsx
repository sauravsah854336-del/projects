import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState } from "react";

const Footer = () => {
  const { user } = useSelector((state) => state.auth);
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const isCustomer = user?.role === "customer";
  const isVendor = user?.role === "vendor";
  const isAdmin = user?.role === "admin";
  const isGuest = !user;

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmail("");
    }, 3000);
  };

  return (
    <>
      <style>{`
        .footer-root {
          background: #0A0B0F;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .footer-glow-1 {
          position: absolute;
          top: -100px;
          left: 10%;
          width: 400px;
          height: 200px;
          background: radial-gradient(ellipse, rgba(216,90,48,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .footer-glow-2 {
          position: absolute;
          top: -50px;
          right: 10%;
          width: 350px;
          height: 200px;
          background: radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
        .footer-grid-pattern {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }
        .footer-cta-banner {
          background: linear-gradient(135deg, #D85A30 0%, #FF8C5A 50%, #D85A30 100%);
          border-radius: 24px;
          padding: 32px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 60px;
          margin-top: -40px;
          position: relative;
          z-index: 2;
          box-shadow: 0 24px 50px rgba(216,90,48,0.35);
          overflow: hidden;
        }
        .footer-cta-banner::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 200px;
          height: 200px;
          background: rgba(255,255,255,0.15);
          border-radius: 50%;
          filter: blur(40px);
        }
        .footer-cta-banner::after {
          content: '';
          position: absolute;
          bottom: -50%;
          left: -10%;
          width: 180px;
          height: 180px;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
          filter: blur(40px);
        }
        .footer-link {
          color: #9CA3AF;
          text-decoration: none;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: color 0.15s ease, gap 0.15s ease, transform 0.15s ease;
          padding: 2px 0;
        }
        .footer-link:hover {
          color: #FF8C5A;
          gap: 12px;
          transform: translateX(2px);
        }
        .footer-link .arrow {
          opacity: 0;
          transform: translateX(-6px);
          transition: all 0.2s ease;
        }
        .footer-link:hover .arrow {
          opacity: 1;
          transform: translateX(0);
        }
        .social-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .social-btn:hover {
          background: linear-gradient(135deg, #D85A30, #FF8C5A);
          border-color: transparent;
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(216,90,48,0.4);
        }
        .footer-section-title {
          color: white;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .footer-section-title::before {
          content: '';
          width: 3px;
          height: 14px;
          background: linear-gradient(135deg, #D85A30, #FF8C5A);
          border-radius: 99px;
        }
        .newsletter-form {
          display: flex;
          gap: 8px;
          padding: 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
        }
        .newsletter-input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 10px 14px;
          font-size: 13px;
          color: white;
          outline: none;
          font-family: inherit;
        }
        .newsletter-input::placeholder { color: #6B7280; }
        .newsletter-btn {
          background: linear-gradient(135deg, #D85A30, #FF8C5A);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(216,90,48,0.35);
          transition: all 0.2s ease;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .newsletter-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(216,90,48,0.5); }
        .newsletter-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .payment-chip {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          color: #D1D5DB;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
        }
        .payment-chip:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(216,90,48,0.3);
        }
        .contact-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(216,90,48,0.15), rgba(216,90,48,0.05));
          border: 1px solid rgba(216,90,48,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
        }
        .logo-footer {
          background: linear-gradient(135deg, #D85A30 0%, #FF8C5A 100%);
          box-shadow: 0 8px 20px rgba(216,90,48,0.35);
        }
        .trust-badge {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
        }
        .trust-badge:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(216,90,48,0.2);
        }
        .role-card {
          padding: 14px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
      `}</style>

      <footer className="footer-root mt-auto">
        <div className="footer-grid-pattern"></div>
        <div className="footer-glow-1"></div>
        <div className="footer-glow-2"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16">

          {isGuest && (
            <div className="footer-cta-banner">
              <div style={{ position: "relative", zIndex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>
                  🎉 Join Our Community
                </p>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: "white", margin: 0, lineHeight: 1.2 }}>
                  Get ₹100 OFF on your first order!
                </h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: "6px 0 0" }}>
                  Sign up today and start shopping with exclusive discounts
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
                <Link
                  to="/signup"
                  style={{
                    background: "white",
                    color: "#D85A30",
                    textDecoration: "none",
                    padding: "12px 28px",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 800,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                  }}
                >
                  Sign Up Free
                </Link>
                <Link
                  to="/login"
                  style={{
                    background: "rgba(0,0,0,0.2)",
                    color: "white",
                    textDecoration: "none",
                    padding: "12px 28px",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  Login
                </Link>
              </div>
            </div>
          )}

          {isVendor && (
            <div className="footer-cta-banner" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)" }}>
              <div style={{ position: "relative", zIndex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>
                  🏪 Vendor Tools
                </p>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: "white", margin: 0, lineHeight: 1.2 }}>
                  Manage your store efficiently
                </h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: "6px 0 0" }}>
                  Add products, track orders, view reviews and grow your business
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
                <Link
                  to="/vendor/dashboard?tab=products"
                  style={{
                    background: "white",
                    color: "#312e81",
                    textDecoration: "none",
                    padding: "12px 28px",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 800,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                  }}
                >
                  + Add Product
                </Link>
                <Link
                  to="/vendor/dashboard"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    textDecoration: "none",
                    padding: "12px 28px",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="footer-cta-banner" style={{ background: "linear-gradient(135deg, #7F1D1D 0%, #991B1B 50%, #7F1D1D 100%)" }}>
              <div style={{ position: "relative", zIndex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>
                  👑 Admin Control
                </p>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: "white", margin: 0, lineHeight: 1.2 }}>
                  Platform management center
                </h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: "6px 0 0" }}>
                  Approve vendors, moderate products and manage the marketplace
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
                <Link
                  to="/admin/dashboard?tab=vendors"
                  style={{
                    background: "white",
                    color: "#7F1D1D",
                    textDecoration: "none",
                    padding: "12px 28px",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 800,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                  }}
                >
                  Manage Vendors
                </Link>
                <Link
                  to="/admin/dashboard"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    textDecoration: "none",
                    padding: "12px 28px",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          )}

          {isCustomer && (
            <div className="footer-cta-banner" style={{ background: "linear-gradient(135deg, #166534 0%, #22C55E 50%, #166534 100%)" }}>
              <div style={{ position: "relative", zIndex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>
                  🎁 Member Benefits
                </p>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: "white", margin: 0, lineHeight: 1.2 }}>
                  Welcome back, {user.firstName}!
                </h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: "6px 0 0" }}>
                  Continue shopping or check your orders and wishlist
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
                <Link
                  to="/products"
                  style={{
                    background: "white",
                    color: "#166534",
                    textDecoration: "none",
                    padding: "12px 28px",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 800,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                  }}
                >
                  🛍️ Shop Now
                </Link>
                <Link
                  to="/orders"
                  style={{
                    background: "rgba(0,0,0,0.2)",
                    color: "white",
                    textDecoration: "none",
                    padding: "12px 28px",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  📦 My Orders
                </Link>
              </div>
            </div>
          )}

          {!isAdmin && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 48 }}>
              {[
                { icon: "🚚", title: "Free Delivery", desc: "On orders above ₹499" },
                { icon: "🔄", title: "Easy Returns", desc: "10-day return policy" },
                { icon: "🛡️", title: "Secure Payments", desc: "100% encrypted" },
                { icon: "✅", title: "Verified Sellers", desc: "Manually approved" },
              ].map((badge) => (
                <div key={badge.title} className="trust-badge">
                  <div style={{ fontSize: 24 }}>{badge.icon}</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "white", margin: 0 }}>{badge.title}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12">

            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-2.5 no-underline mb-5 group w-fit">
                <span className="logo-footer w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-[14px] tracking-widest">E</span>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 900, color: "white", margin: 0, letterSpacing: "-0.5px" }}>
                    E<span style={{ color: '#D85A30' }}>·</span>Commerce
                  </p>
                  <p style={{ fontSize: 10, color: "#6B7280", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
                    Multi-Vendor Marketplace
                  </p>
                </div>
              </Link>

              <p style={{ color: "#9CA3AF", fontSize: 13, lineHeight: 1.7, maxWidth: 320, marginBottom: 24 }}>
                Your trusted multi-vendor marketplace. Shop from verified sellers, compare prices, and enjoy a seamless shopping experience with secure payments and fast delivery.
              </p>

              {user && (
                <div className="role-card">
                  <div style={{
                    width: 38, height: 38,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #D85A30, #FF8C5A)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: 900, fontSize: 14,
                    flexShrink: 0,
                  }}>
                    {user.avatar ? (
                      <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      user.firstName?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: "white", margin: 0, fontWeight: 800 }}>
                      {user.firstName} {user.lastName}
                    </p>
                    <p style={{ fontSize: 10, color: "#9CA3AF", margin: "2px 0 0", textTransform: "capitalize" }}>
                      {user.role} Account
                    </p>
                  </div>
                  <span style={{
                    fontSize: 9,
                    background: isAdmin ? "rgba(239,68,68,0.15)" : isVendor ? "rgba(124,58,237,0.15)" : "rgba(34,197,94,0.15)",
                    color: isAdmin ? "#FCA5A5" : isVendor ? "#C4B5FD" : "#86EFAC",
                    padding: "3px 8px",
                    borderRadius: 99,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                    Active
                  </span>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-btn" title="Facebook">
                  <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-btn" title="Twitter">
                  <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-btn" title="Instagram">
                  <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-btn" title="LinkedIn">
                  <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-btn" title="YouTube">
                  <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>

            {isCustomer && (
              <>
                <div>
                  <h4 className="footer-section-title">My Account</h4>
                  <ul className="space-y-2.5">
                    {[
                      { to: "/dashboard", label: "Dashboard" },
                      { to: "/profile", label: "Profile & Addresses" },
                      { to: "/orders", label: "My Orders" },
                      { to: "/cart", label: "My Cart" },
                      { to: "/wishlist", label: "Wishlist" },
                    ].map((item) => (
                      <li key={item.to}>
                        <Link to={item.to} className="footer-link">
                          <svg className="arrow w-3 h-3 text-[#FF8C5A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="footer-section-title">Shop</h4>
                  <ul className="space-y-2.5">
                    {[
                      { to: "/products", label: "All Products" },
                      { to: "/products?sort=newest", label: "New Arrivals" },
                      { to: "/products?sort=popular", label: "Best Sellers" },
                      { to: "/products?sort=rating", label: "Top Rated" },
                      { to: "/products?sort=price_low", label: "Best Deals" },
                    ].map((item) => (
                      <li key={item.to + item.label}>
                        <Link to={item.to} className="footer-link">
                          <svg className="arrow w-3 h-3 text-[#FF8C5A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {isVendor && (
              <>
                <div>
                  <h4 className="footer-section-title">Vendor Panel</h4>
                  <ul className="space-y-2.5">
                    {[
                      { to: "/vendor/dashboard", label: "Dashboard" },
                      { to: "/vendor/dashboard?tab=products", label: "My Products" },
                      { to: "/vendor/dashboard?tab=orders", label: "Orders" },
                      { to: "/vendor/dashboard?tab=reviews", label: "Reviews" },
                    ].map((item) => (
                      <li key={item.to}>
                        <Link to={item.to} className="footer-link">
                          <svg className="arrow w-3 h-3 text-[#FF8C5A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="footer-section-title">Seller Resources</h4>
                  <ul className="space-y-2.5">
                    {[
                      { to: "/policy/seller-guidelines", label: "Seller Guidelines" },
                      { to: "/policy/commission-policy", label: "Commission Policy" },
                      { to: "/policy/vendor-agreement", label: "Vendor Agreement" },
                      { to: "/policy/vendor-privacy", label: "Vendor Privacy" },
                    ].map((item) => (
                      <li key={item.to}>
                        <Link to={item.to} className="footer-link">
                          <svg className="arrow w-3 h-3 text-[#FF8C5A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {isAdmin && (
              <>
                <div>
                  <h4 className="footer-section-title">Management</h4>
                  <ul className="space-y-2.5">
                    {[
                      { to: "/admin/dashboard", label: "Dashboard" },
                      { to: "/admin/dashboard?tab=vendors", label: "Vendors" },
                      { to: "/admin/dashboard?tab=categories", label: "Categories" },
                      { to: "/admin/dashboard?tab=products", label: "Products" },
                      { to: "/admin/dashboard?tab=orders", label: "Orders" },
                      { to: "/admin/dashboard?tab=reviews", label: "Reviews" },
                    ].map((item) => (
                      <li key={item.to}>
                        <Link to={item.to} className="footer-link">
                          <svg className="arrow w-3 h-3 text-[#FF8C5A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="footer-section-title">Quick Access</h4>
                  <ul className="space-y-2.5">
                    {[
                      { to: "/", label: "View Storefront" },
                      { to: "/products", label: "All Products" },
                      { to: "/policy/terms", label: "Platform Terms" },
                      { to: "/policy/privacy", label: "Privacy Policy" },
                    ].map((item) => (
                      <li key={item.to}>
                        <Link to={item.to} className="footer-link">
                          <svg className="arrow w-3 h-3 text-[#FF8C5A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {isGuest && (
              <>
                <div>
                  <h4 className="footer-section-title">Shop</h4>
                  <ul className="space-y-2.5">
                    {[
                      { to: "/products", label: "All Products" },
                      { to: "/products?sort=newest", label: "New Arrivals" },
                      { to: "/products?sort=popular", label: "Best Sellers" },
                      { to: "/products?sort=rating", label: "Top Rated" },
                      { to: "/cart", label: "My Cart" },
                    ].map((item) => (
                      <li key={item.to + item.label}>
                        <Link to={item.to} className="footer-link">
                          <svg className="arrow w-3 h-3 text-[#FF8C5A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="footer-section-title">Get Started</h4>
                  <ul className="space-y-2.5">
                    {[
                      { to: "/signup", label: "Create Account" },
                      { to: "/login", label: "Sign In" },
                      { to: "/vendor/signup", label: "Become a Seller" },
                      { to: "/vendor/login", label: "Seller Login" },
                    ].map((item) => (
                      <li key={item.to}>
                        <Link to={item.to} className="footer-link">
                          <svg className="arrow w-3 h-3 text-[#FF8C5A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <div>
              <h4 className="footer-section-title">Support</h4>
              <ul className="space-y-2.5">
                {[
                  { to: "/help", label: "Help Center" },
                  { to: "/contact", label: "Contact Us" },
                  { to: "/about", label: "About Us" },
                  { to: "/policy/shipping-info", label: "Shipping Info" },
                  { to: "/policy/returns", label: "Returns & Refunds" },
                  { to: "/policy/privacy", label: "Privacy Policy" },
                  { to: "/policy/terms", label: "Terms of Service" },
                ].map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="footer-link">
                      <svg className="arrow w-3 h-3 text-[#FF8C5A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="divider"></div>

          <div className="py-12 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h4 className="footer-section-title">Get in Touch</h4>
              <div className="space-y-4">
                <a href="mailto:info@quleep.in" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
                  <div className="contact-icon-wrap">
                    <svg width="16" height="16" fill="none" stroke="#FF8C5A" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: "#6B7280", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Email Us</p>
                    <p style={{ fontSize: 13, color: "#D1D5DB", margin: 0, fontWeight: 600 }}>info@quleep.in</p>
                  </div>
                </a>

                <a href="tel:+919883019518" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
                  <div className="contact-icon-wrap">
                    <svg width="16" height="16" fill="none" stroke="#FF8C5A" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: "#6B7280", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Call Us</p>
                    <p style={{ fontSize: 13, color: "#D1D5DB", margin: 0, fontWeight: 600 }}>+91 98830 19518</p>
                  </div>
                </a>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div className="contact-icon-wrap">
                    <svg width="16" height="16" fill="none" stroke="#FF8C5A" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: "#6B7280", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Office</p>
                    <p style={{ fontSize: 13, color: "#D1D5DB", margin: 0, lineHeight: 1.6 }}>
                      Bhutani Alphathum, 1432 B-Wing,<br />
                      Sector 90, Noida – 201305
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="contact-icon-wrap">
                    <svg width="16" height="16" fill="none" stroke="#FF8C5A" strokeWidth={2} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: "#6B7280", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Working Hours</p>
                    <p style={{ fontSize: 13, color: "#D1D5DB", margin: 0, fontWeight: 600 }}>Mon-Sat: 9AM - 6PM IST</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="footer-section-title">
                {isVendor ? "Vendor Updates" : isAdmin ? "Platform Updates" : "Newsletter"}
              </h4>
              <p style={{ color: "#9CA3AF", fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
                {isVendor && "Get vendor announcements, policy updates, and seller tips delivered to your inbox."}
                {isAdmin && "Stay updated with platform metrics, vendor reports, and system alerts."}
                {(isCustomer || isGuest) && "Subscribe to get updates on new products, exclusive deals, and special offers."}
              </p>

              {subscribed ? (
                <div style={{
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: 14,
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}>
                  <span style={{ fontSize: 22 }}>✅</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#86EFAC", margin: 0 }}>
                      Successfully subscribed!
                    </p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>
                      We'll keep you updated
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="newsletter-form">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="newsletter-input"
                  />
                  <button type="submit" className="newsletter-btn" disabled={!email.trim()}>
                    Subscribe
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </form>
              )}

              <p style={{ color: "#6B7280", fontSize: 11, marginTop: 12, lineHeight: 1.6 }}>
                By subscribing, you agree to our{" "}
                <Link to="/policy/privacy" style={{ color: "#FF8C5A", textDecoration: "none", fontWeight: 600 }}>Privacy Policy</Link>.
                Unsubscribe anytime.
              </p>

              {(isCustomer || isGuest) && (
                <div style={{ marginTop: 20, padding: "14px 18px", background: "rgba(216,90,48,0.08)", border: "1px solid rgba(216,90,48,0.2)", borderRadius: 14, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 22 }}>🎁</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 800, color: "#FF8C5A", margin: 0 }}>
                      First-time subscriber bonus
                    </p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>
                      Get ₹100 off coupon in your inbox
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

         

          <div className="divider"></div>

          <div className="py-7 flex flex-col md:flex-row justify-between items-center gap-4">
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <p style={{ color: "#6B7280", fontSize: 12, margin: 0 }}>
                © {currentYear} <span style={{ color: "white", fontWeight: 700 }}>E-Commerce</span>. All rights reserved.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 99 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block", boxShadow: "0 0 8px #22C55E" }}></span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#86EFAC" }}>All Systems Operational</span>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
              {[
                { to: "/policy/privacy", label: "Privacy" },
                { to: "/policy/terms", label: "Terms" },
                { to: "/help", label: "Help" },
                { to: "/contact", label: "Contact" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    color: "#6B7280",
                    fontSize: 12,
                    textDecoration: "none",
                    fontWeight: 600,
                    transition: "color 0.15s",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = "#FF8C5A"}
                  onMouseOut={(e) => e.currentTarget.style.color = "#6B7280"}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

         
        </div>
      </footer>
    </>
  );
};

export default Footer;