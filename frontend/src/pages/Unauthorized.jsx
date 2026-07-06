import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const isCustomer = user?.role === "customer";
  const isVendor = user?.role === "vendor";
  const isAdmin = user?.role === "admin";

  const getDashboard = () => {
    if (isAdmin) return "/admin/dashboard";
    if (isVendor) return "/vendor/dashboard";
    if (isCustomer) return "/dashboard";
    return "/";
  };

  const getRoleLabel = () => {
    if (isAdmin) return "Admin";
    if (isVendor) return "Vendor";
    if (isCustomer) return "Customer";
    return "Guest";
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 64px)",
      background: "linear-gradient(135deg, #F3F4F6 0%, #FEF2F2 50%, #F3F4F6 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-8deg); }
          40% { transform: rotate(8deg); }
          60% { transform: rotate(-5deg); }
          80% { transform: rotate(5deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .unauth-content { animation: fadeUp 0.6s ease both; }
        .unauth-shield { animation: float 3s ease-in-out infinite; }
        .unauth-lock { animation: shake 2s ease-in-out infinite; }
        .unauth-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(239,68,68,0.15);
          animation: pulse-ring 3s ease-in-out infinite;
        }
        .unauth-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 28px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
          font-family: inherit;
          border: none;
        }
        .unauth-action:hover { transform: translateY(-2px); }
        .unauth-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: white;
          border: 1.5px solid #E5E7EB;
          border-radius: 12px;
          text-decoration: none;
          color: #374151;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .unauth-link:hover {
          border-color: #EF4444;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(239,68,68,0.1);
        }
      `}</style>

      <div className="unauth-ring" style={{ width: 400, height: 400, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}></div>
      <div className="unauth-ring" style={{ width: 550, height: 550, top: "50%", left: "50%", transform: "translate(-50%, -50%)", animationDelay: "0.5s" }}></div>
      <div className="unauth-ring" style={{ width: 700, height: 700, top: "50%", left: "50%", transform: "translate(-50%, -50%)", animationDelay: "1s" }}></div>

      <div style={{ position: "absolute", top: "15%", left: "10%", width: 200, height: 200, background: "rgba(239,68,68,0.08)", borderRadius: "50%", filter: "blur(50px)" }}></div>
      <div style={{ position: "absolute", bottom: "15%", right: "10%", width: 250, height: 250, background: "rgba(124,58,237,0.06)", borderRadius: "50%", filter: "blur(50px)" }}></div>

      <div className="unauth-content" style={{ maxWidth: 580, width: "100%", textAlign: "center", position: "relative", zIndex: 1 }}>

        <div style={{ position: "relative", display: "inline-block", marginBottom: 24 }}>
          <div className="unauth-shield" style={{
            width: 120,
            height: 120,
            background: "linear-gradient(135deg, #FEE2E2, #FECACA)",
            borderRadius: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
            border: "3px solid #FCA5A5",
            boxShadow: "0 20px 50px rgba(239,68,68,0.2)",
            position: "relative",
          }}>
            <div className="unauth-lock" style={{ fontSize: 52 }}>🔒</div>

            <div style={{
              position: "absolute",
              top: -8,
              right: -8,
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, #EF4444, #DC2626)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3px solid white",
              boxShadow: "0 4px 12px rgba(239,68,68,0.4)",
            }}>
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>

        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "linear-gradient(135deg, #FEE2E2, #FEF2F2)",
          border: "1px solid #FECACA",
          borderRadius: 99,
          padding: "6px 16px",
          marginBottom: 20,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", display: "inline-block", animation: "blink 2s ease-in-out infinite" }}></span>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#DC2626", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            ACCESS DENIED • ERROR 403
          </span>
        </div>

        <h1 style={{
          fontSize: 52,
          fontWeight: 900,
          color: "#111",
          margin: "0 0 8px",
          lineHeight: 1,
          letterSpacing: "-2px",
        }}>
          <span style={{
            background: "linear-gradient(135deg, #EF4444, #DC2626)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            403
          </span>
        </h1>

        <h2 style={{
          fontSize: 26,
          fontWeight: 900,
          color: "#111",
          margin: "0 0 12px",
          lineHeight: 1.2,
        }}>
          Access Restricted
        </h2>

        <p style={{
          fontSize: 15,
          color: "#6B7280",
          margin: "0 0 8px",
          lineHeight: 1.7,
        }}>
          You don't have permission to access this page.
        </p>

        {user && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "white",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: "10px 18px",
            marginBottom: 28,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: isAdmin ? "linear-gradient(135deg, #EF4444, #DC2626)"
                : isVendor ? "linear-gradient(135deg, #7C3AED, #6D28D9)"
                : "linear-gradient(135deg, #D85A30, #FF8C5A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 900,
              fontSize: 13,
            }}>
              {user.firstName?.[0]?.toUpperCase()}
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: "#111", margin: 0 }}>
                Logged in as {user.firstName}
              </p>
              <p style={{ fontSize: 10, color: "#9CA3AF", margin: 0, textTransform: "capitalize" }}>
                {getRoleLabel()} Account
              </p>
            </div>
          </div>
        )}

        {!user && (
          <p style={{ fontSize: 13, color: "#9CA3AF", margin: "0 0 28px" }}>
            You may need to sign in or use a different account.
          </p>
        )}

        <div style={{
          background: "white",
          border: "1px solid #E5E7EB",
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 28,
          textAlign: "left",
        }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: "#374151", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            💡 Why am I seeing this?
          </p>
          <ul style={{ margin: 0, padding: "0 0 0 18px", listStyleType: "none" }}>
            {[
              "This page requires a different account type to access",
              "You may have followed an outdated or incorrect link",
              "Your session may have expired — try logging in again",
              "The resource may have been moved or restricted",
            ].map((reason) => (
              <li key={reason} style={{
                fontSize: 13,
                color: "#6B7280",
                lineHeight: 1.6,
                marginBottom: 6,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}>
                <span style={{ color: "#EF4444", flexShrink: 0, marginTop: 2 }}>•</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
          <button
            onClick={() => navigate(-1)}
            className="unauth-action"
            style={{
              background: "white",
              color: "#374151",
              border: "1.5px solid #E5E7EB",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Go Back
          </button>

          <Link
            to={getDashboard()}
            className="unauth-action"
            style={{
              background: "linear-gradient(135deg, #D85A30, #FF8C5A)",
              color: "white",
              boxShadow: "0 8px 24px rgba(216,90,48,0.35)",
            }}
          >
            🏠 {user ? "My Dashboard" : "Home Page"}
          </Link>

          {!user && (
            <Link
              to="/login"
              className="unauth-action"
              style={{
                background: "linear-gradient(135deg, #111, #374151)",
                color: "white",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              }}
            >
              🔑 Sign In
            </Link>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
            Maybe you were looking for
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, maxWidth: 500, margin: "0 auto" }}>
            {[
              { icon: "🛍️", label: "Shop", path: "/products" },
              { icon: "💬", label: "Help Center", path: "/help" },
              { icon: "📬", label: "Contact Us", path: "/contact" },
              ...(user
                ? [{ icon: "📦", label: "Orders", path: isCustomer ? "/orders" : getDashboard() }]
                : [{ icon: "✨", label: "Sign Up", path: "/signup" }]
              ),
            ].map((link) => (
              <Link key={link.label} to={link.path} className="unauth-link">
                <span style={{ fontSize: 18 }}>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div style={{
          background: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 12, color: "#6B7280" }}>
            Error code: <strong style={{ color: "#111", fontFamily: "monospace" }}>403_FORBIDDEN</strong>
          </span>
          <span style={{ color: "#E5E7EB" }}>•</span>
          <span style={{ fontSize: 12, color: "#6B7280" }}>
            Need help? <Link to="/contact" style={{ color: "#D85A30", fontWeight: 700, textDecoration: "none" }}>Contact Support</Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;