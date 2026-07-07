import { useState } from "react";
import { authApi, useVendorLoginMutation } from "../features/auth/authApi";
import { setCredentials } from "../features/auth/authSlice";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import PlatformLogo from "../assets/PlatformLogo.jpeg";

const ErrorAlert = ({ message }) => (
  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5">
    <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <p className="text-red-600 text-sm font-medium m-0">{message}</p>
  </div>
);

const VendorLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [vendorLogin, { isLoading, error }] = useVendorLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [formError, setFormError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      dispatch(authApi.util.resetApiState());
      const res = await vendorLogin({ email, password }).unwrap();
      dispatch(setCredentials(res));
      setTimeout(() => {
        navigate("/vendor/dashboard", { replace: true });
      }, 100);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 py-6 sm:py-8 bg-gray-50">
      <div className="w-full max-w-[900px] grid lg:grid-cols-2 bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-200">

        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#0F172A] p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <Link to="/" className="flex items-center gap-2.5 no-underline mb-6">
              <div className="w-11 h-11 rounded-xl overflow-hidden ring-2 ring-blue-400/40 shadow-lg shadow-blue-500/30 shrink-0">
                <img
                  src={PlatformLogo}
                  alt="shop.design"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-black text-white m-0 leading-tight">
                  shop<span className="text-blue-400">.</span>design
                </p>
                <p className="text-[9px] text-blue-300/60 m-0 uppercase tracking-wider font-bold">
                  Seller Central
                </p>
              </div>
            </Link>

            <div className="inline-flex items-center gap-1.5 bg-indigo-500/15 border border-indigo-400/20 px-2.5 py-1 rounded-full mb-3">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Vendor Portal</span>
            </div>

            <h2 className="text-xl font-extrabold text-white m-0 mb-2 leading-tight">
              Grow Your Design Business
            </h2>
            <p className="text-xs text-blue-200/60 m-0 leading-relaxed max-w-[240px]">
              Access your seller dashboard to manage products, track orders, and scale your business on shop.design.
            </p>
          </div>

          <div className="relative">
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { value: "25+", label: "Sellers", icon: "🏪" },
                { value: "120+", label: "Buyers", icon: "👥" },
                { value: "24/7", label: "Support", icon: "🎧" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-center">
                  <span className="text-base block mb-0.5">{stat.icon}</span>
                  <p className="text-xs font-extrabold text-white m-0">{stat.value}</p>
                  <p className="text-[9px] text-blue-300/50 m-0">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {[
                { icon: "📦", text: "Manage inventory in real-time" },
                { icon: "📊", text: "Sales analytics & insights" },
                { icon: "💰", text: "Weekly settlements" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2">
                  <span className="text-xs">{item.icon}</span>
                  <span className="text-[11px] text-blue-200/50 font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-white/10">
              <p className="text-[9px] text-blue-300/40 m-0 uppercase tracking-wider font-bold">
                A product of
              </p>
              <p className="text-[11px] text-blue-200/70 font-bold m-0 mt-0.5">
                Quleep Pvt Ltd
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="lg:hidden text-center mb-5">
            <Link to="/" className="inline-flex items-center gap-2 no-underline">
              <div className="w-10 h-10 rounded-lg overflow-hidden ring-2 ring-blue-500/20 shadow-md shrink-0">
                <img
                  src={PlatformLogo}
                  alt="shop.design"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-extrabold text-gray-900 m-0 leading-tight">
                  shop<span className="text-blue-600">.</span>design
                </p>
                <p className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider m-0">
                  Seller Central
                </p>
              </div>
            </Link>
          </div>

          <div className="mb-5">
            <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full mb-2">
              <svg className="w-3 h-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">Vendor Portal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 m-0">Sign In</h1>
            <p className="text-xs text-gray-500 mt-1 m-0">Access your seller dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Email Address</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  name="email"
                  type="email"
                  placeholder="vendor@example.com"
                  value={form.email}
                  autoComplete="username"
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 pl-9 pr-3 py-2.5 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm bg-gray-50 focus:bg-white font-[inherit]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700">Password</label>
                <Link to="/vendor/forgot-password" className="text-xs text-indigo-600 no-underline hover:underline font-semibold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  autoComplete="current-password"
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 pl-9 pr-10 py-2.5 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm bg-gray-50 focus:bg-white font-[inherit]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

            {formError && <ErrorAlert message={formError} />}
            {!formError && error && <ErrorAlert message={error?.data?.message || "Login failed"} />}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] hover:brightness-110 text-white py-3 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-sm border-none cursor-pointer font-[inherit]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Login to Dashboard"
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100 text-center space-y-1.5">
            <p className="text-gray-500 text-xs m-0">
              Not registered as a vendor?{" "}
              <Link to="/vendor/signup" className="text-indigo-600 font-bold no-underline hover:underline">
                Apply Now
              </Link>
            </p>
            <p className="text-gray-400 text-xs m-0">
              Looking to shop?{" "}
              <Link to="/login" className="text-blue-600 font-semibold no-underline hover:underline">
                Customer Login →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorLogin;