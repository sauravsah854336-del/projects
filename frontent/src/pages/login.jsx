import { useState } from "react";
import { authApi, useLoginMutation } from "../features/auth/authApi";
import { useMergeGuestCartMutation } from "../features/cart/cartApi";
import { useMergeWishlistMutation } from "../features/wishlist/wishlistApi";
import { setCredentials, logout } from "../features/auth/authSlice";
import { setUserCountry, resetCountry } from "../features/country/countrySlice";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { getGuestCartForMerge, clearGuestCart } from "../utils/guestCart";
import { getGuestWishlistForMerge, clearGuestWishlist } from "../utils/guestWishlist";
import { toast } from "../components/Toast";

const ErrorAlert = ({ message, action }) => (
  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5">
    <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div className="flex-1">
      <p className="text-red-600 text-sm font-medium m-0">{message}</p>
      {action}
    </div>
  </div>
);

const RedirectBanner = ({ icon, text, color }) => (
  <div className={`mb-5 ${color} rounded-xl p-3.5 flex items-center gap-2.5`}>
    <span className="text-lg">{icon}</span>
    <p className="text-xs font-semibold m-0">{text}</p>
  </div>
);

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [login, { isLoading, error, reset: resetLoginMutation }] = useLoginMutation();
  const [mergeGuestCart] = useMergeGuestCartMutation();
  const [mergeWishlist] = useMergeWishlistMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [mergingData, setMergingData] = useState(false);
  const [formError, setFormError] = useState("");
  const [wrongPortalError, setWrongPortalError] = useState(null);

  const redirectPath = searchParams.get("redirect");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
    setWrongPortalError(null);
    if (error) resetLoginMutation();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setWrongPortalError(null);

    const email = form.email.trim();
    const password = form.password.trim();

    if (!email || !password) {
      setFormError("Email and password are required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter a valid email address");
      return;
    }

    try {
      const guestCartItems = getGuestCartForMerge();
      const guestWishlistIds = getGuestWishlistForMerge();

      const res = await login({ email, password }).unwrap();

      dispatch(setCredentials(res));

      if (res.userCountry) {
        dispatch(setUserCountry(res.userCountry));
      }

      const hasGuestData = guestCartItems.length > 0 || guestWishlistIds.length > 0;

      if (hasGuestData) {
        setMergingData(true);
        await new Promise((resolve) => setTimeout(resolve, 200));

        if (guestCartItems.length > 0) {
          try {
            await mergeGuestCart({ items: guestCartItems }).unwrap();
            clearGuestCart();
          } catch (mergeErr) {
            console.log("Cart merge failed:", mergeErr);
          }
        }

        if (guestWishlistIds.length > 0) {
          try {
            await mergeWishlist({ productIds: guestWishlistIds }).unwrap();
            clearGuestWishlist();
          } catch (mergeErr) {
            console.log("Wishlist merge failed:", mergeErr);
          }
        }

        setMergingData(false);
        toast.success("Welcome back! Your data has been synced.");
      } else {
        toast.success(`Welcome back, ${res.user.firstName}!`);
      }

      setTimeout(() => {
        const role = res.user?.role;
        if (role === "admin") navigate("/admin/dashboard", { replace: true });
        else if (role === "vendor") navigate("/vendor/dashboard", { replace: true });
        else navigate(redirectPath || "/", { replace: true });
      }, 150);
    } catch (err) {
      const errorData = err?.data;
      const status = err?.status;
      if (status === 403 && errorData?.redirectTo) {
        setWrongPortalError({ message: errorData.message, redirectTo: errorData.redirectTo });
      }
      console.log(err);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12 bg-gray-50">
      <div className="w-full max-w-[960px] grid lg:grid-cols-[1fr_1.2fr] bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-200">

        <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#0F172A] p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <Link to="/" className="flex items-center gap-2.5 no-underline mb-8">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/30">
                E
              </div>
              <div>
                <p className="text-base font-black text-white m-0">E<span className="text-blue-400">·</span>Commerce</p>
                <p className="text-[9px] text-blue-300/50 m-0 uppercase tracking-wider font-bold">Marketplace</p>
              </div>
            </Link>

            <h2 className="text-2xl font-extrabold text-white m-0 mb-2 leading-tight">
              Welcome back!
            </h2>
            <p className="text-sm text-blue-200/60 m-0 mb-8 leading-relaxed max-w-xs">
              Sign in to access your orders, wishlist, and personalized shopping experience.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "50K+", label: "Products", icon: "📦" },
                { value: "1200+", label: "Sellers", icon: "🏪" },
                { value: "99%", label: "Happy", icon: "😊" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <span className="text-lg block mb-1">{stat.icon}</span>
                  <p className="text-sm font-extrabold text-white m-0">{stat.value}</p>
                  <p className="text-[10px] text-blue-300/50 m-0 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-2">
              {[
                { icon: "🔒", text: "256-bit SSL encrypted" },
                { icon: "🛡️", text: "PCI-DSS compliant payments" },
                { icon: "✅", text: "Verified sellers only" },
              ].map((t) => (
                <div key={t.text} className="flex items-center gap-2.5">
                  <span className="text-sm">{t.icon}</span>
                  <span className="text-[11px] text-blue-200/50 font-medium">{t.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 no-underline mb-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#0F172A] to-[#1E3A8A] rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md">
                E
              </div>
              <span className="text-base font-extrabold text-gray-900">Commerce</span>
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 m-0">Sign In</h1>
            <p className="text-sm text-gray-500 mt-1 m-0">
              {redirectPath ? "Sign in to continue" : "Enter your credentials"}
            </p>
          </div>

          {redirectPath === "/checkout" && (
            <RedirectBanner icon="🛒" text="Sign in to complete checkout." color="bg-blue-50 border border-blue-200 text-blue-700" />
          )}
          {redirectPath === "/wishlist" && (
            <RedirectBanner icon="❤️" text="Sign in to save your wishlist." color="bg-pink-50 border border-pink-200 text-pink-700" />
          )}
          {redirectPath === "/cart" && (
            <RedirectBanner icon="🛍️" text="Sign in to manage your cart." color="bg-orange-50 border border-orange-200 text-orange-700" />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                autoComplete="username"
                onChange={handleChange}
                className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm bg-gray-50 focus:bg-white font-[inherit]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-blue-600 no-underline hover:underline font-semibold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  autoComplete="current-password"
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 px-4 pr-12 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm bg-gray-50 focus:bg-white font-[inherit]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {wrongPortalError && (
              <ErrorAlert
                message={wrongPortalError.message}
                action={
                  <button
                    type="button"
                    onClick={() => navigate(wrongPortalError.redirectTo)}
                    className="mt-2 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg border-none cursor-pointer transition font-[inherit]"
                  >
                    Go to {wrongPortalError.redirectTo.includes("vendor") ? "Vendor" : "Admin"} Portal →
                  </button>
                }
              />
            )}

            {formError && <ErrorAlert message={formError} />}
            {!formError && !wrongPortalError && error && (
              <ErrorAlert message={error?.data?.message || "Login failed"} />
            )}

            <button
              type="submit"
              disabled={isLoading || mergingData}
              className="w-full bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] hover:brightness-110 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-sm border-none cursor-pointer font-[inherit]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : mergingData ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Syncing data...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 space-y-2 text-center">
            <p className="text-gray-500 text-sm m-0">
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-600 font-bold no-underline hover:underline">
                Create Account
              </Link>
            </p>
            <p className="text-gray-400 text-xs m-0">
              Seller?{" "}
              <Link to="/vendor/login" className="text-blue-600 font-semibold no-underline hover:underline">
                Vendor Login →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;