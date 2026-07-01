import { useState } from "react";
import { authApi, useSignupMutation } from "../features/auth/authApi";
import { useMergeGuestCartMutation } from "../features/cart/cartApi";
import { useMergeWishlistMutation } from "../features/wishlist/wishlistApi";
import { setCredentials } from "../features/auth/authSlice";
import { setUserCountry } from "../features/country/countrySlice";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { getGuestCartForMerge, clearGuestCart } from "../utils/guestCart";
import {
  getGuestWishlistForMerge,
  clearGuestWishlist,
} from "../utils/guestWishlist";
import { toast } from "../components/Toast";
import PhoneInput, { COUNTRIES } from "../components/PhoneInput";

const ErrorAlert = ({ message }) => (
  <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-2">
    <svg
      className="w-4 h-4 text-red-500 shrink-0"
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
    <p className="text-red-600 text-sm">{message}</p>
  </div>
);

const FormInput = ({ icon, children, ...props }) => (
  <div className="relative">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
      {icon}
    </div>
    <input
      className="w-full border border-gray-200 pl-12 pr-4 py-3 sm:py-3.5 rounded-xl outline-none focus:border-[#D85A30] focus:ring-4 focus:ring-[#D85A30]/10 transition-all text-[15px] bg-gray-50 focus:bg-white"
      {...props}
    />
    {children}
  </div>
);

const UserIcon = () => (
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
);

const EmailIcon = () => (
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
);

const LockIcon = () => (
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
);

const EyeIcon = ({ open }) => (
  <svg
    className="w-5 h-5 text-gray-400 hover:text-gray-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    {open ? (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    ) : (
      <>
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
      </>
    )}
  </svg>
);

const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [signup, { isLoading, error }] = useSignupMutation();
  const [mergeGuestCart] = useMergeGuestCartMutation();
  const [mergeWishlist] = useMergeWishlistMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [step, setStep] = useState(1);
  const [mergingData, setMergingData] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "IN",
    password: "",
    confirmPassword: "",
  });

  const selectedCountry =
    COUNTRIES.find((c) => c.code === form.countryCode) || COUNTRIES[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setFormError("");
  };

  const handlePhoneChange = (phone) => {
    setForm((prev) => ({ ...prev, phone }));
    if (phone.length === selectedCountry.length) {
      if (!selectedCountry.pattern.test(phone)) {
        setPhoneError(`Enter valid ${selectedCountry.name} mobile number`);
      } else {
        setPhoneError("");
      }
    } else {
      setPhoneError("");
    }
    setFormError("");
  };

  const handleCountryChange = (countryCode) => {
    setForm((prev) => ({ ...prev, countryCode, phone: "" }));
    setPhoneError("");
    setFormError("");
  };

  const validateStep1 = () => {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();
    if (!firstName || !lastName || !email) {
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter a valid email address");
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
    setFormError("");

    const phone = form.phone.trim();
    const password = form.password.trim();
    const confirmPassword = form.confirmPassword.trim();
    const country = selectedCountry;

    if (!phone || !password || !confirmPassword) {
      setFormError("All fields are required");
      return;
    }

    if (phone.length !== country.length) {
      setFormError(
        `Phone number must be ${country.length} digits for ${country.name}`
      );
      return;
    }

    if (!country.pattern.test(phone)) {
      setFormError(`Enter valid ${country.name} mobile number`);
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setFormError("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setFormError("Password must contain at least one number");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    try {
      const guestCartItems = getGuestCartForMerge();
      const guestWishlistIds = getGuestWishlistForMerge();
      const fullPhone = `${country.dial}${phone}`;

      dispatch(authApi.util.resetApiState());
      const res = await signup({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone,
        countryCode: form.countryCode,
        dialCode: country.dial,
        fullPhone,
        password,
      }).unwrap();

      dispatch(setCredentials(res));

      if (res.userCountry) {
        dispatch(setUserCountry(res.userCountry));
        toast.success(
          `🌍 ${res.userCountry.flag} Prices in ${res.userCountry.currency.symbol} ${res.userCountry.currency.code}`,
          { duration: 4000 }
        );
      }

      if (res.user?.role === "customer") {
        const hasGuestData =
          guestCartItems.length > 0 || guestWishlistIds.length > 0;
        if (hasGuestData) {
          setMergingData(true);
          await new Promise((resolve) => setTimeout(resolve, 300));

          if (guestCartItems.length > 0) {
            try {
              await mergeGuestCart({ items: guestCartItems }).unwrap();
              clearGuestCart();
            } catch (mergeErr) {
              console.log("Cart merge failed:", mergeErr);
              toast.warning("Some cart items could not be synced");
            }
          }

          if (guestWishlistIds.length > 0) {
            try {
              await mergeWishlist({ productIds: guestWishlistIds }).unwrap();
              clearGuestWishlist();
            } catch (mergeErr) {
              console.log("Wishlist merge failed:", mergeErr);
              toast.warning("Some wishlist items could not be synced");
            }
          }

          setMergingData(false);
          toast.success("Account created! Your data has been synced.");
        } else {
          toast.success(
            `Welcome, ${res.user.firstName}! Account created successfully.`
          );
        }
      }

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 200);
    } catch (err) {
      console.log(err);
    }
  };

  const getPasswordStrength = () => {
    const p = form.password;
    if (!p)
      return {
        width: "0%",
        color: "bg-gray-200",
        text: "",
        textColor: "text-gray-400",
      };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
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

  const benefits = [
    { icon: "🚚", text: "Free delivery on orders above ₹499" },
    { icon: "🔄", text: "Easy 10-day returns" },
    { icon: "🛡️", text: "100% secure payments" },
  ];

  const passwordChecks = [
    { check: form.password.length >= 6, label: "6+ characters" },
    { check: /[A-Z]/.test(form.password), label: "Uppercase" },
    { check: /[0-9]/.test(form.password), label: "Number" },
    { check: /[^A-Za-z0-9]/.test(form.password), label: "Special" },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10 sm:py-12 bg-gray-50">
      <div className="w-full max-w-[1000px] grid lg:grid-cols-2 bg-white rounded-3xl shadow-2xl shadow-black/5 overflow-hidden border border-gray-100">
        <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-10 xl:p-12 relative overflow-hidden">
          <div className="absolute top-10 right-10 w-48 h-48 bg-[#D85A30]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#D85A30] to-[#e8734d] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#D85A30]/30">
              <span className="text-white font-extrabold text-2xl">E</span>
            </div>
            <h2 className="text-2xl xl:text-3xl font-bold text-white mb-3">
              Join Us Today!
            </h2>
            <p className="text-gray-400 leading-relaxed max-w-xs mx-auto text-sm xl:text-base">
              Create your account and start shopping from thousands of products
              across multiple categories from verified sellers.
            </p>
            <div className="mt-8 xl:mt-10 space-y-3">
              {benefits.map((item) => (
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

        <div className="p-6 sm:p-8 xl:p-12">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Create Account
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Step {step} of 2 —{" "}
              {step === 1 ? "Personal Information" : "Security Details"}
            </p>
            <div className="flex gap-2 mt-3">
              <div
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  step >= 1 ? "bg-[#D85A30]" : "bg-gray-200"
                }`}
              />
              <div
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  step >= 2 ? "bg-[#D85A30]" : "bg-gray-200"
                }`}
              />
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    First Name
                  </label>
                  <FormInput
                    name="firstName"
                    placeholder="John"
                    value={form.firstName}
                    onChange={handleChange}
                    icon={<UserIcon />}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Last Name
                  </label>
                  <FormInput
                    name="lastName"
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={handleChange}
                    icon={<UserIcon />}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Email Address
                </label>
                <FormInput
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  autoComplete="username"
                  onChange={handleChange}
                  icon={<EmailIcon />}
                />
              </div>
              {formError && <ErrorAlert message={formError} />}
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full bg-gradient-to-r from-[#D85A30] to-[#e8734d] text-white py-3.5 sm:py-4 rounded-xl font-semibold shadow-lg shadow-[#D85A30]/20 hover:shadow-[#D85A30]/40 hover:scale-[1.01] transition-all duration-200 text-[15px] border-none cursor-pointer font-[inherit]"
              >
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Phone Number
                </label>

                <PhoneInput
                  value={form.phone}
                  countryCode={form.countryCode}
                  onChange={handlePhoneChange}
                  onCountryChange={handleCountryChange}
                  error={phoneError}
                />

                {phoneError && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <span>⚠</span> {phoneError}
                  </p>
                )}

                {form.phone.length === selectedCountry.length &&
                  !phoneError && (
                    <p className="text-green-500 text-xs mt-1.5">
                      ✓ Valid {selectedCountry.name} mobile number
                    </p>
                  )}

                {form.phone.length === 0 && !phoneError && (
                  <p className="text-gray-400 text-xs mt-1.5">
                    Click the flag {selectedCountry.flag} to change country •{" "}
                    {selectedCountry.length} digits required
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <LockIcon />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={form.password}
                    autoComplete="new-password"
                    onChange={handleChange}
                    className="w-full border border-gray-200 pl-12 pr-12 py-3 sm:py-3.5 rounded-xl outline-none focus:border-[#D85A30] focus:ring-4 focus:ring-[#D85A30]/10 transition-all text-[15px] bg-gray-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden mr-3">
                        <div
                          className={`h-full ${strength.color} rounded-full transition-all duration-300`}
                          style={{ width: strength.width }}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium ${strength.textColor}`}
                      >
                        {strength.text}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      {passwordChecks.map((r) => (
                        <span
                          key={r.label}
                          className={`text-[11px] ${
                            r.check ? "text-green-500" : "text-gray-400"
                          }`}
                        >
                          {r.check ? "✓" : "○"} {r.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className={`w-5 h-5 ${
                        form.confirmPassword &&
                        form.password === form.confirmPassword
                          ? "text-green-500"
                          : "text-gray-400"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={form.confirmPassword}
                    autoComplete="new-password"
                    onChange={handleChange}
                    className="w-full border border-gray-200 pl-12 pr-4 py-3 sm:py-3.5 rounded-xl outline-none focus:border-[#D85A30] focus:ring-4 focus:ring-[#D85A30]/10 transition-all text-[15px] bg-gray-50 focus:bg-white"
                  />
                </div>
                {form.confirmPassword &&
                  form.password !== form.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1.5">
                      Passwords do not match
                    </p>
                  )}
                {form.confirmPassword &&
                  form.password === form.confirmPassword && (
                    <p className="text-green-500 text-xs mt-1.5">
                      ✓ Passwords match
                    </p>
                  )}
              </div>

              {formError && <ErrorAlert message={formError} />}
              {!formError && error && (
                <ErrorAlert message={error?.data?.message} />
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setFormError("");
                  }}
                  className="flex-1 border border-gray-200 text-gray-700 py-3.5 sm:py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all text-[15px] cursor-pointer bg-white font-[inherit]"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || mergingData}
                  className="flex-[2] bg-gradient-to-r from-[#D85A30] to-[#e8734d] text-white py-3.5 sm:py-4 rounded-xl font-semibold shadow-lg shadow-[#D85A30]/20 hover:shadow-[#D85A30]/40 hover:scale-[1.01] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 text-[15px] border-none cursor-pointer font-[inherit]"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : mergingData ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Syncing...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
              <p className="text-center text-gray-400 text-xs mt-2">
                By creating an account, you agree to our{" "}
                <Link
                  to="/policy/terms"
                  className="text-[#D85A30] no-underline hover:underline"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  to="/policy/privacy"
                  className="text-[#D85A30] no-underline hover:underline"
                >
                  Privacy Policy
                </Link>
              </p>
            </form>
          )}

          <p className="text-center mt-6 sm:mt-8 text-gray-500 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#D85A30] font-semibold no-underline hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;