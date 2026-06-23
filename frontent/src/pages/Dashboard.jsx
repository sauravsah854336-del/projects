import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { authApi, useLogoutMutation } from "../features/auth/authApi";
import { useGetCartQuery } from "../features/cart/cartApi";
import { useGetProfileQuery } from "../features/customer/customerApi";
import { useNavigate, Link } from "react-router-dom";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, refreshToken } = useSelector((state) => state.auth);
  const [logoutAPI, { isLoading }] = useLogoutMutation();

  const { data: cartData } = useGetCartQuery();
  const { data: profileData } = useGetProfileQuery();

  const profile = profileData?.data;
  const cartCount = cartData?.data?.totalItems || 0;
  const addressCount = profile?.addresses?.length || 0;

  const handleLogout = async () => {
    try {
      await logoutAPI({ refreshToken }).unwrap();
    } catch (err) {
      console.log(err);
    } finally {
      dispatch(authApi.util.resetApiState());
      dispatch(logout());
      navigate("/login");
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div style={{ background: "#F3F4F6", minHeight: "100vh" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .dash-card {
          background: white;
          border: 1.5px solid #E5E7EB;
          border-radius: 18px;
          padding: 22px;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: all 0.2s;
          cursor: pointer;
          animation: fadeUp 0.3s ease both;
        }
        .dash-card:hover {
          border-color: #D85A30;
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(216,90,48,0.12);
        }
        .dash-card:active { transform: translateY(-2px); }
        .quick-link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          background: white;
          border: 1.5px solid #E5E7EB;
          border-radius: 14px;
          text-decoration: none;
          transition: all 0.15s;
        }
        .quick-link:hover {
          border-color: #D85A30;
          background: #FFF5F0;
        }
      `}</style>

      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #1a1a2e 100%)",
        padding: "40px 20px 52px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, background: "rgba(216,90,48,0.12)", borderRadius: "50%", filter: "blur(60px)" }}></div>
        <div style={{ position: "absolute", bottom: -40, left: "30%", width: 200, height: 200, background: "rgba(99,102,241,0.08)", borderRadius: "50%", filter: "blur(50px)" }}></div>

        <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "linear-gradient(135deg, #D85A30, #FF8C5A)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
                border: "3px solid rgba(255,255,255,0.15)",
                boxShadow: "0 8px 24px rgba(216,90,48,0.35)",
              }}>
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 26, fontWeight: 900, color: "white" }}>
                    {user?.firstName?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p style={{ fontSize: 14, color: "#64748B", margin: 0, fontWeight: 500 }}>
                  {greeting()} 👋
                </p>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", margin: "2px 0 0" }}>
                  {user?.firstName} {user?.lastName}
                </h1>
                <p style={{ fontSize: 12, color: "#64748B", margin: "4px 0 0" }}>
                  {profile?.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoading}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
                borderRadius: 12,
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {isLoading ? "..." : "Sign Out"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 28, flexWrap: "wrap" }}>
            {[
              { value: cartCount, label: "Cart Items", icon: "🛒" },
              { value: addressCount, label: "Saved Addresses", icon: "📍" },
              { value: profile?.wishlist?.length || 0, label: "Wishlist", icon: "❤️" },
            ].map((stat) => (
              <div key={stat.label} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                padding: "12px 20px",
                minWidth: 140,
              }}>
                <span style={{ fontSize: 22 }}>{stat.icon}</span>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 900, color: "white", margin: 0 }}>{stat.value}</p>
                  <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "-28px auto 0", padding: "0 20px 40px", position: "relative" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14, marginBottom: 28 }}>
          {[
            { to: "/orders", icon: "📦", label: "My Orders", desc: "Track & manage orders", color: "#EFF6FF", border: "#93C5FD", delay: "0s" },
            { to: "/cart", icon: "🛒", label: "My Cart", desc: `${cartCount} items in cart`, color: "#FFF5F0", border: "#FDBA74", delay: "0.05s" },
            { to: "/profile", icon: "👤", label: "My Profile", desc: "Edit personal info", color: "#F5F3FF", border: "#C4B5FD", delay: "0.1s" },
            { to: "/wishlist", icon: "❤️", label: "Wishlist", desc: "Saved products", color: "#FFF1F2", border: "#FECDD3", delay: "0.15s" },
            { to: "/products", icon: "🛍️", label: "Shop Now", desc: "Browse products", color: "#F0FDF4", border: "#86EFAC", delay: "0.2s" },
            { to: "/help", icon: "💬", label: "Help Center", desc: "FAQs & support", color: "#F0F9FF", border: "#7DD3FC", delay: "0.25s" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="dash-card"
              style={{ animationDelay: item.delay }}
            >
              <div style={{
                width: 52, height: 52,
                background: item.color,
                borderRadius: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, marginBottom: 14,
                border: `1px solid ${item.border}`,
              }}>
                {item.icon}
              </div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>{item.label}</p>
              <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>{item.desc}</p>
            </Link>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          <div style={{ background: "white", borderRadius: 20, border: "1px solid #E5E7EB", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 10, background: "#FAFAFA" }}>
              <span style={{ fontSize: 18 }}>⚡</span>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: 0 }}>Quick Links</h3>
            </div>
            <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { to: "/products?sort=newest", icon: "✨", label: "New Arrivals", desc: "Just landed on our platform" },
                { to: "/products?sort=popular", icon: "🔥", label: "Best Sellers", desc: "Most popular products" },
                { to: "/products?sort=rating", icon: "⭐", label: "Top Rated", desc: "Highest customer ratings" },
              ].map((item) => (
                <Link key={item.to} to={item.to} className="quick-link">
                  <div style={{
                    width: 38, height: 38,
                    background: "#F9FAFB", borderRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0,
                    border: "1px solid #E5E7EB",
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>{item.desc}</p>
                  </div>
                  <svg width="14" height="14" fill="none" stroke="#9CA3AF" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          <div style={{ background: "white", borderRadius: 20, border: "1px solid #E5E7EB", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 10, background: "#FAFAFA" }}>
              <span style={{ fontSize: 18 }}>📋</span>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: 0 }}>Account Info</h3>
            </div>
            <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Name", value: `${profile?.firstName || ""} ${profile?.lastName || ""}` },
                { label: "Email", value: profile?.email },
                { label: "Phone", value: profile?.phone ? `+91 ${profile.phone}` : "Not set" },
                { label: "Member Since", value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: 12, color: "#111", fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}
              <Link
                to="/profile"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: "#F9FAFB", border: "1.5px solid #E5E7EB",
                  borderRadius: 10, padding: "10px",
                  textDecoration: "none", color: "#374151",
                  fontSize: 13, fontWeight: 700,
                  marginTop: 4,
                  transition: "all 0.15s",
                }}
              >
                ✏️ Edit Profile
              </Link>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{
            background: "linear-gradient(135deg, #0f172a, #1e293b)",
            borderRadius: 20,
            padding: "28px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 50, height: 50,
                background: "rgba(216,90,48,0.15)",
                borderRadius: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24,
                border: "1px solid rgba(216,90,48,0.3)",
              }}>
                🏪
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 900, color: "white", margin: 0 }}>
                  Want to sell on our platform?
                </p>
                <p style={{ fontSize: 12, color: "#64748B", margin: "3px 0 0" }}>
                  Join thousands of vendors and start selling today
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link
                to="/vendor/signup"
                style={{
                  background: "linear-gradient(135deg, #D85A30, #FF8C5A)",
                  color: "white", textDecoration: "none",
                  padding: "10px 22px", borderRadius: 10,
                  fontSize: 13, fontWeight: 800,
                  boxShadow: "0 4px 16px rgba(216,90,48,0.3)",
                }}
              >
                Become a Seller →
              </Link>
              <Link
                to="/policy/seller-guidelines"
                style={{
                  background: "transparent",
                  color: "#94A3B8", textDecoration: "none",
                  padding: "10px 18px", borderRadius: 10,
                  fontSize: 13, fontWeight: 600,
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { icon: "🚚", text: "Free delivery above ₹499" },
            { icon: "🔄", text: "Easy 10-day returns" },
            { icon: "🛡️", text: "100% secure payments" },
            { icon: "✅", text: "Verified sellers only" },
          ].map((item) => (
            <div key={item.text} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "white", border: "1px solid #E5E7EB",
              borderRadius: 99, padding: "8px 16px",
              fontSize: 12, color: "#6B7280",
            }}>
              <span>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;