import { useState } from "react";
import { Link } from "react-router-dom";
import { useForgotPasswordMutation } from "../features/auth/authApi";

const ForgotPassword = () => {
  const [forgotPassword, { isLoading, error, isSuccess }] =
    useForgotPasswordMutation();

  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setFormError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setFormError("Please enter a valid email address");
      return;
    }

    try {
      await forgotPassword({ email: trimmedEmail }).unwrap();
    } catch (err) {
      console.log(err);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white p-8 sm:p-12 rounded-3xl shadow-2xl shadow-black/5 text-center border border-gray-100">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
              />
            </svg>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900">
            Check Your Email
          </h2>
          <p className="text-gray-500 mb-2 leading-relaxed">
            We've sent a password reset link to
          </p>
          <p className="text-[#D85A30] font-semibold mb-8">{email}</p>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-left">
                <p className="text-sm text-blue-700 font-medium mb-1">
                  Didn't receive the email?
                </p>
                <p className="text-xs text-blue-600">
                  Check your spam folder or try again with a different email
                  address.
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/login"
            className="inline-block w-full bg-gradient-to-r from-[#D85A30] to-[#e8734d] text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-[#D85A30]/20 hover:shadow-[#D85A30]/40 hover:scale-[1.01] transition-all duration-200 no-underline mb-4"
          >
            Back to Login
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="w-full text-gray-600 text-sm hover:text-gray-900 transition-colors bg-transparent border-none cursor-pointer"
          >
            Try another email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[1000px] grid lg:grid-cols-2 bg-white rounded-3xl shadow-2xl shadow-black/5 overflow-hidden border border-gray-100">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-12 relative overflow-hidden">
          <div className="absolute top-10 left-10 w-48 h-48 bg-[#D85A30]/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>

          <div className="relative text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#D85A30] to-[#e8734d] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#D85A30]/30">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              Forgot Password?
            </h2>
            <p className="text-gray-400 leading-relaxed max-w-xs mx-auto mb-8">
              No worries! Enter your email address and we'll send you
              instructions to reset your password.
            </p>

            <div className="space-y-3">
              {[
                {
                  icon: "🔒",
                  title: "Secure Process",
                  desc: "Your data is encrypted",
                },
                {
                  icon: "⚡",
                  title: "Quick Recovery",
                  desc: "Reset link sent instantly",
                },
                {
                  icon: "✅",
                  title: "Easy Steps",
                  desc: "Simple & straightforward",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-left"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-white text-sm font-semibold">
                      {item.title}
                    </p>
                    <p className="text-gray-400 text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 sm:p-12">
          <div className="mb-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 no-underline transition-colors text-sm font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Login
            </Link>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Reset Password
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Enter your registered email address
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFormError("");
                  }}
                  className="w-full border border-gray-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-[#D85A30] focus:ring-4 focus:ring-[#D85A30]/10 transition-all text-[15px] bg-gray-50 focus:bg-white"
                  autoComplete="email"
                />
              </div>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-red-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-red-600 text-sm">{formError}</p>
              </div>
            )}

            {!formError && error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-red-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-red-600 text-sm">{error?.data?.message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#D85A30] to-[#e8734d] text-white py-4 rounded-xl font-semibold shadow-lg shadow-[#D85A30]/20 hover:shadow-[#D85A30]/40 hover:scale-[1.01] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 text-[15px]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </div>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-gray-500 text-sm">
              Remember your password?{" "}
              <Link
                to="/login"
                className="text-[#D85A30] font-semibold no-underline hover:underline"
              >
                Login
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <p className="text-center text-gray-400 text-xs">
              Need help?{" "}
              <Link
                to="/contact"
                className="text-gray-600 no-underline hover:underline"
              >
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;