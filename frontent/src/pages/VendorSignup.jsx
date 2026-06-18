import { useState } from "react";
import { useVendorSignupMutation } from "../features/auth/authApi";
import { Link } from "react-router-dom";

const VendorSignup = () => {
  const [vendorSignup, { isLoading, error, isSuccess }] =
    useVendorSignupMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    storeName: "",
    storeDescription: "",
    gstNumber: "",
    panNumber: "",
  });

  const [formError, setFormError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const validateStep1 = () => {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();
    const storeName = form.storeName.trim();

    if (!firstName || !lastName || !email || !storeName) {
      setFormError("All fields are required");
      return false;
    }

    if (firstName.length < 2) {
      setFormError("First name must be at least 2 characters");
      return false;
    }

    if (lastName.length < 2) {
      setFormError("Last name must be at least 2 characters");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError("Please enter a valid email address");
      return false;
    }

    if (storeName.length < 3) {
      setFormError("Store name must be at least 3 characters");
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
      setFormError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const phone = form.phone.trim();
    const password = form.password.trim();

    if (!phone || !password) {
      setFormError("Phone and password are required");
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setFormError("Please enter a valid 10-digit phone number");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }

    try {
      await vendorSignup(form).unwrap();
    } catch (err) {
      console.log(err);
    }
  };

  const getPasswordStrength = () => {
    const password = form.password;
    if (!password) return { width: "0%", color: "bg-gray-200", text: "" };

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2)
      return {
        width: "33%",
        color: "bg-red-500",
        text: "Weak",
        textColor: "text-red-500",
      };
    if (score <= 3)
      return {
        width: "66%",
        color: "bg-yellow-500",
        text: "Medium",
        textColor: "text-yellow-500",
      };
    return {
      width: "100%",
      color: "bg-green-500",
      text: "Strong",
      textColor: "text-green-500",
    };
  };

  const strength = getPasswordStrength();

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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900">
            Application Submitted!
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Your vendor registration is under review. Our team will verify your details and notify you via email once approved.
          </p>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-8">
            <p className="text-sm text-purple-700 font-medium">
              ⏱️ Approval typically takes 24-48 hours
            </p>
          </div>
          <Link
            to="/vendor/login"
            className="inline-block w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 hover:scale-[1.01] transition-all duration-200 no-underline"
          >
            Go to Vendor Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[1000px] grid lg:grid-cols-2 bg-white rounded-3xl shadow-2xl shadow-black/5 overflow-hidden border border-gray-100">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-12 relative overflow-hidden">
          <div className="absolute top-10 right-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-[#D85A30]/10 rounded-full blur-3xl"></div>

          <div className="relative text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-600/30">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              Become a Seller
            </h2>
            <p className="text-gray-400 leading-relaxed max-w-xs mx-auto">
              Join thousands of successful vendors and start selling your products to millions of customers.
            </p>

            <div className="mt-10 space-y-4">
              {[
                { icon: "🚀", text: "Quick & easy onboarding" },
                { icon: "💳", text: "Low commission rates" },
                { icon: "📈", text: "Grow your business online" },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-3 bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-gray-300 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 sm:p-12">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Vendor Registration
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Step {step} of 2 —{" "}
              {step === 1 ? "Business Information" : "Contact & Security"}
            </p>

            <div className="flex gap-2 mt-4">
              <div
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  step >= 1 ? "bg-purple-600" : "bg-gray-200"
                }`}
              ></div>
              <div
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  step >= 2 ? "bg-purple-600" : "bg-gray-200"
                }`}
              ></div>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    First Name *
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <input
                      name="firstName"
                      placeholder="John"
                      value={form.firstName}
                      onChange={handleChange}
                      className="w-full border border-gray-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all text-[15px] bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Last Name *
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <input
                      name="lastName"
                      placeholder="Doe"
                      value={form.lastName}
                      onChange={handleChange}
                      className="w-full border border-gray-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all text-[15px] bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Email Address *
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
                    name="email"
                    type="email"
                    placeholder="vendor@example.com"
                    value={form.email}
                    autoComplete="username"
                    onChange={handleChange}
                    className="w-full border border-gray-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all text-[15px] bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Store Name *
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <input
                    name="storeName"
                    placeholder="My Awesome Store"
                    value={form.storeName}
                    onChange={handleChange}
                    className="w-full border border-gray-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all text-[15px] bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Store Description (Optional)
                </label>
                <textarea
                  name="storeDescription"
                  placeholder="Brief description of your store..."
                  value={form.storeDescription}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-200 px-4 py-3.5 rounded-xl outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all text-[15px] bg-gray-50 focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    GST Number (Optional)
                  </label>
                  <input
                    name="gstNumber"
                    placeholder="22AAAAA0000A1Z5"
                    value={form.gstNumber}
                    onChange={handleChange}
                    className="w-full border border-gray-200 px-4 py-3.5 rounded-xl outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all text-[15px] bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    PAN Number (Optional)
                  </label>
                  <input
                    name="panNumber"
                    placeholder="ABCDE1234F"
                    value={form.panNumber}
                    onChange={handleChange}
                    className="w-full border border-gray-200 px-4 py-3.5 rounded-xl outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all text-[15px] bg-gray-50 focus:bg-white"
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

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-semibold shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 hover:scale-[1.01] transition-all duration-200 text-[15px]"
              >
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <span className="text-gray-500 text-sm font-medium">
                      +91
                    </span>
                    <div className="w-px h-5 bg-gray-300 ml-1"></div>
                  </div>
                  <input
                    name="phone"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full border border-gray-200 pl-[4.5rem] pr-4 py-3.5 rounded-xl outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all text-[15px] bg-gray-50 focus:bg-white"
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Password *
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
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={form.password}
                    autoComplete="new-password"
                    onChange={handleChange}
                    className="w-full border border-gray-200 pl-12 pr-12 py-3.5 rounded-xl outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all text-[15px] bg-gray-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0"
                  >
                    {showPassword ? (
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
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden mr-3">
                        <div
                          className={`h-full ${strength.color} rounded-full transition-all duration-300`}
                          style={{ width: strength.width }}
                        ></div>
                      </div>
                      <span
                        className={`text-xs font-medium ${strength.textColor}`}
                      >
                        {strength.text}
                      </span>
                    </div>
                  </div>
                )}
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

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setFormError("");
                  }}
                  className="flex-1 border border-gray-200 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all text-[15px] cursor-pointer bg-white"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-[2] bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-semibold shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 hover:scale-[1.01] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 text-[15px]"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </div>
                  ) : (
                    "Submit Application"
                  )}
                </button>
              </div>

              <p className="text-center text-gray-400 text-xs mt-2">
                By registering, you agree to our{" "}
                <Link
                  to="/policy/vendor-terms"
                  className="text-purple-600 no-underline hover:underline"
                >
                  Vendor Terms
                </Link>
              </p>
            </form>
          )}

          <p className="text-center mt-8 text-gray-500 text-sm">
            Already registered?{" "}
            <Link
              to="/vendor/login"
              className="text-purple-600 font-semibold no-underline hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorSignup;