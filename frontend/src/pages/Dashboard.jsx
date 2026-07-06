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
  const totalSaved = profile?.stats?.totalSaved || 0;
  const couponOrders = profile?.stats?.couponOrders || 0;

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

  const cards = [
    { to: "/products", icon: "🛍️", label: "Shop Now", desc: "Browse products", bg: "bg-green-50", border: "border-green-200" },
    { to: "/orders", icon: "📦", label: "My Orders", desc: "Track & manage orders", bg: "bg-blue-50", border: "border-blue-200" },
    { to: "/cart", icon: "🛒", label: "My Cart", desc: `${cartCount} items in cart`, bg: "bg-orange-50", border: "border-orange-200" },
    { to: "/profile", icon: "👤", label: "My Profile", desc: "Edit personal info", bg: "bg-purple-50", border: "border-purple-200" },
    { to: "/wishlist", icon: "❤️", label: "Wishlist", desc: "Saved products", bg: "bg-rose-50", border: "border-rose-200" },
    { to: "/help", icon: "💬", label: "Help Center", desc: "FAQs & support", bg: "bg-sky-50", border: "border-sky-200" },
  ];

  const quickLinks = [
    { to: "/products?sort=newest", icon: "✨", label: "New Arrivals", desc: "Just landed on our platform" },
    { to: "/products?sort=popular", icon: "🔥", label: "Best Sellers", desc: "Most popular products" },
    { to: "/products?sort=rating", icon: "⭐", label: "Top Rated", desc: "Highest customer ratings" },
  ];

  const stats = [
    { value: cartCount, label: "Cart Items", icon: "🛒" },
    { value: addressCount, label: "Saved Addresses", icon: "📍" },
    { value: profile?.wishlist?.length || 0, label: "Wishlist", icon: "❤️" },
    { value: profile?.stats?.totalOrders || 0, label: "Total Orders", icon: "📦" },
  ];

  const accountInfo = [
    { label: "Name", value: `${profile?.firstName || ""} ${profile?.lastName || ""}` },
    { label: "Email", value: profile?.email },
    { label: "Phone", value: profile?.phone ? `+91 ${profile.phone}` : "Not set" },
    {
      label: "Member Since",
      value: profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
        : "—",
    },
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-[#1a1a2e] px-4 sm:px-6 pt-8 sm:pt-10 pb-14 relative overflow-hidden">
        <div className="absolute -top-14 -right-14 w-64 h-64 bg-[#D85A30]/12 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-10 left-[30%] w-48 h-48 bg-indigo-500/8 rounded-full blur-[50px] pointer-events-none" />

        <div className="max-w-[1000px] mx-auto relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#D85A30] to-[#FF8C5A] flex items-center justify-center overflow-hidden border-[3px] border-white/15 shadow-xl shadow-orange-500/30 shrink-0">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl sm:text-2xl font-black text-white">
                    {user?.firstName?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium m-0">{greeting()} 👋</p>
                <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5 mb-0">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-xs text-slate-500 mt-1 m-0 hidden sm:block">{profile?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="bg-white/[0.06] border border-white/[0.12] text-white rounded-xl px-4 sm:px-5 py-2.5 text-[13px] font-bold cursor-pointer hover:bg-white/10 transition shrink-0 font-[inherit] disabled:opacity-50"
            >
              {isLoading ? "..." : "Sign Out"}
            </button>
          </div>

          <div className="flex gap-3 sm:gap-4 mt-7 flex-wrap">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 bg-white/[0.06] border border-white/10 rounded-[14px] px-4 sm:px-5 py-3 min-w-[130px] sm:min-w-[140px]">
                <span className="text-xl sm:text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-lg sm:text-xl font-black text-white m-0">{stat.value}</p>
                  <p className="text-[11px] text-slate-500 m-0">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto -mt-7 px-3 sm:px-4 pb-10 relative">
        {totalSaved > 0 && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 sm:p-6 mb-4 shadow-xl shadow-green-500/20">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shrink-0 backdrop-blur-sm">
                🎟️
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-xs font-bold uppercase tracking-wide m-0">Lifetime Savings</p>
                <p className="text-2xl sm:text-3xl font-black text-white m-0 mt-0.5">
                  ₹{totalSaved.toLocaleString("en-IN")}
                </p>
                <p className="text-white/90 text-xs m-0 mt-0.5">
                  💰 Saved across {couponOrders} {couponOrders === 1 ? "order" : "orders"} with coupons!
                </p>
              </div>
              <Link
                to="/orders"
                className="bg-white text-green-700 no-underline px-5 py-2.5 rounded-xl text-[13px] font-extrabold hover:brightness-105 transition shrink-0"
              >
                View Savings →
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-7">
          {cards.map((item, i) => (
            <Link
              key={item.to}
              to={item.to}
              className="group bg-white border-[1.5px] border-gray-200 rounded-[18px] p-4 sm:p-5 no-underline flex flex-col items-center text-center transition-all duration-200 hover:border-[#D85A30] hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10 cursor-pointer"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className={`w-12 h-12 sm:w-[52px] sm:h-[52px] ${item.bg} border ${item.border} rounded-2xl flex items-center justify-center text-2xl sm:text-[26px] mb-3.5`}>
                {item.icon}
              </div>
              <p className="text-[13px] sm:text-sm font-extrabold text-gray-900 m-0 mb-1">{item.label}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 m-0">{item.desc}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2.5">
              <span className="text-lg">⚡</span>
              <h3 className="text-sm font-extrabold text-gray-900 m-0">Quick Links</h3>
            </div>
            <div className="p-3.5 flex flex-col gap-2">
              {quickLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3.5 p-3.5 bg-white border-[1.5px] border-gray-200 rounded-xl no-underline hover:border-[#D85A30] hover:bg-orange-50 transition-all"
                >
                  <div className="w-9 h-9 sm:w-[38px] sm:h-[38px] bg-gray-50 border border-gray-200 rounded-[10px] flex items-center justify-center text-lg shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[13px] font-bold text-gray-900 m-0">{item.label}</p>
                    <p className="text-[11px] text-gray-500 m-0">{item.desc}</p>
                  </div>
                  <svg width="14" height="14" fill="none" stroke="#9CA3AF" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2.5">
              <span className="text-lg">📋</span>
              <h3 className="text-sm font-extrabold text-gray-900 m-0">Account Info</h3>
            </div>
            <div className="px-5 py-4 flex flex-col gap-2.5">
              {accountInfo.map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-500 font-medium">{item.label}</span>
                  <span className="text-xs text-gray-900 font-bold">{item.value}</span>
                </div>
              ))}
              <Link
                to="/profile"
                className="flex items-center justify-center gap-1.5 bg-gray-50 border-[1.5px] border-gray-200 rounded-xl py-2.5 no-underline text-gray-700 text-[13px] font-bold mt-1 hover:bg-orange-50 hover:border-[#D85A30] hover:text-[#D85A30] transition-all"
              >
                ✏️ Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {profile?.stats?.couponsUsed && profile.stats.couponsUsed.length > 0 && (
          <div className="mt-4 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white flex items-center gap-2.5">
              <span className="text-lg">🎟️</span>
              <h3 className="text-sm font-extrabold text-gray-900 m-0">Your Coupon History</h3>
              <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                {profile.stats.uniqueCouponsUsed} used
              </span>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                {profile.stats.couponsUsed.map((code) => (
                  <div
                    key={code}
                    className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl px-4 py-2.5 flex items-center gap-2"
                  >
                    <span className="text-lg">🎟️</span>
                    <span className="text-sm font-extrabold text-orange-800">{code}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3 m-0">
                💰 You've saved <strong className="text-green-600">₹{totalSaved.toLocaleString("en-IN")}</strong> using coupons across {couponOrders} orders
              </p>
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-[#D85A30]/15 border border-[#D85A30]/30 rounded-[14px] flex items-center justify-center text-2xl shrink-0">
                🏪
              </div>
              <div>
                <p className="text-base font-black text-white m-0">Want to sell on our platform?</p>
                <p className="text-xs text-slate-500 mt-1 m-0">Join thousands of vendors and start selling today</p>
              </div>
            </div>
            <div className="flex gap-2.5 flex-wrap">
              <Link
                to="/vendor/signup"
                className="bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white no-underline px-5 py-2.5 rounded-xl text-[13px] font-extrabold shadow-lg shadow-orange-500/25"
              >
                Become a Seller →
              </Link>
              <Link
                to="/policy/seller-guidelines"
                className="bg-transparent text-slate-400 no-underline px-4.5 py-2.5 rounded-xl text-[13px] font-semibold border border-white/12 hover:text-white transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5 justify-center">
          {[
            { icon: "🚚", text: "Free delivery above ₹499" },
            { icon: "🔄", text: "Easy 10-day returns" },
            { icon: "🛡️", text: "100% secure payments" },
            { icon: "✅", text: "Verified sellers only" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-xs text-gray-500">
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