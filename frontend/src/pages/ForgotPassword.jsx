import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useForgotPasswordMutation,
  useVerifyOTPMutation,
  useResetPasswordMutation,
  useResendOTPMutation,
} from "../features/auth/authApi";
import { toast } from "../components/Toast";

const ForgotPassword = () => {
  const [forgotPassword] = useForgotPasswordMutation();
  const [verifyOTP] = useVerifyOTPMutation();
  const [resetPassword] = useResetPasswordMutation();
  const [resendOTP] = useResendOTPMutation();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    setIsLoading(true);
    try {
      await forgotPassword({ email: email.trim() }).unwrap();
      toast.success("OTP sent to your email!");
      setStep(2);
      startResendTimer();
    } catch (err) {
      const msg = err?.data?.message || "Failed to send OTP. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    setError("");
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const updated = [...otp];
    pasted.split("").forEach((char, i) => { updated[i] = char; });
    setOtp(updated);
    document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus();
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const otpValue = otp.join("");
    if (otpValue.length < 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      await verifyOTP({ email: email.trim(), otp: otpValue }).unwrap();
      toast.success("OTP verified successfully!");
      setStep(3);
    } catch (err) {
      const msg = err?.data?.message || "Invalid OTP. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    try {
      await resendOTP({ email: email.trim() }).unwrap();
      toast.success("New OTP sent to your email!");
      startResendTimer();
      document.getElementById("otp-0")?.focus();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const p = newPassword;
    if (!p) return { width: "0%", color: "bg-gray-200", text: "", textColor: "text-gray-400" };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 2) return { width: "33%", color: "bg-red-500", text: "Weak", textColor: "text-red-500" };
    if (score <= 3) return { width: "66%", color: "bg-yellow-400", text: "Medium", textColor: "text-yellow-500" };
    return { width: "100%", color: "bg-green-500", text: "Strong", textColor: "text-green-500" };
  };

  const strength = getPasswordStrength();

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setError("Password must contain at least one number");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword({
        email: email.trim(),
        otp: otp.join(""),
        newPassword,
      }).unwrap();
      toast.success("Password reset successfully!");
      setStep(4);
    } catch (err) {
      const msg = err?.data?.message || "Failed to reset password. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const stepLabels = ["Email", "Verify OTP", "New Password", "Done"];


  const ErrorAlert = ({ msg }) =>
    msg ? (
      <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5">
        <svg
          className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
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
        <p className="text-red-600 text-sm font-medium m-0">{msg}</p>
      </div>
    ) : null;

  const EyeToggle = ({ show, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 text-gray-400 hover:text-gray-600 transition-colors"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {show ? (
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
    </button>
  );

  const SubmitBtn = ({ label, loadingLabel }) => (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] hover:brightness-110 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-sm border-none cursor-pointer font-[inherit]"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          {loadingLabel}
        </span>
      ) : (
        label
      )}
    </button>
  );


  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12 bg-gray-50">
      <div className="w-full max-w-[960px] grid lg:grid-cols-[1fr_1.2fr] bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-200">

        <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#0F172A] p-10 relative overflow-hidden">
          {/* blobs */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            {/* Logo — same as Login */}
            <Link to="/" className="flex items-center gap-2.5 no-underline mb-8">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/30">
                E
              </div>
              <div>
                <p className="text-base font-black text-white m-0">
                  E<span className="text-blue-400">·</span>Commerce
                </p>
                <p className="text-[9px] text-blue-300/50 m-0 uppercase tracking-wider font-bold">
                  Marketplace
                </p>
              </div>
            </Link>

            <h2 className="text-2xl font-extrabold text-white m-0 mb-2 leading-tight">
              Reset Password
            </h2>
            <p className="text-sm text-blue-200/60 m-0 mb-8 leading-relaxed max-w-xs">
              Follow the steps to securely reset your account password.
            </p>

            <div className="space-y-3 mb-8">
              {stepLabels.map((label, i) => {
                const num = i + 1;
                const isDone = step > num;
                const isActive = step === num;
                return (
                  <div key={label} className="flex items-center gap-3">
                    {/* circle */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 transition-all duration-300 ${
                        isDone
                          ? "bg-green-500 text-white shadow-md shadow-green-500/30"
                          : isActive
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/40"
                          : "bg-white/10 text-blue-300/50"
                      }`}
                    >
                      {isDone ? (
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          stroke="white"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        num
                      )}
                    </div>

                    <span
                      className={`text-sm font-semibold transition-colors ${
                        isActive ? "text-white" : isDone ? "text-green-400" : "text-blue-300/40"
                      }`}
                    >
                      {label}
                    </span>

                    {isActive && (
                      <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2">
              {[
                { icon: "🔒", text: "OTP expires in 10 minutes" },
                { icon: "🛡️", text: "Never share your OTP with anyone" },
                { icon: "✅", text: "All sessions cleared after reset" },
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

          <div className="flex gap-1.5 mb-6">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${
                  step >= s ? "bg-gradient-to-r from-[#0F172A] to-[#1E3A8A]" : "bg-gray-100"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 mb-6">
            {step < 4 && (
              <button
                onClick={() => {
                  if (step > 1) { setStep(step - 1); setError(""); }
                }}
                className={`p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition cursor-pointer font-[inherit] ${
                  step === 1 ? "opacity-0 pointer-events-none" : ""
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 m-0">
                {step === 1 && "Forgot Password?"}
                {step === 2 && "Verify OTP"}
                {step === 3 && "Create New Password"}
                {step === 4 && "Password Reset! 🎉"}
              </h1>
              <p className="text-sm text-gray-500 mt-1 m-0">
                {step === 1 && "Enter your registered email to receive a reset OTP"}
                {step === 2 && (
                  <>OTP sent to <strong className="text-gray-700">{email}</strong></>
                )}
                {step === 3 && "Choose a strong password for your account"}
                {step === 4 && "Your password has been updated successfully"}
              </p>
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  autoComplete="email"
                  className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm bg-gray-50 focus:bg-white font-[inherit]"
                />
                <p className="text-xs text-gray-400 mt-1.5 m-0">
                  We'll send a 6-digit OTP to this email
                </p>
              </div>

              <ErrorAlert msg={error} />

              <SubmitBtn label="Send OTP →" loadingLabel="Sending OTP..." />

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 border border-gray-200 py-3 rounded-xl text-sm font-semibold text-gray-600 no-underline hover:bg-gray-50 transition-all"
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Back to Login
              </Link>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5">
                <span className="text-lg shrink-0">📧</span>
                <div>
                  <p className="text-sm font-semibold text-blue-800 m-0">Check your inbox</p>
                  <p className="text-xs text-blue-600 m-0 mt-0.5">
                    We sent a 6-digit OTP to <strong>{email}</strong>
                  </p>
                  <p className="text-[11px] text-blue-400 mt-1 m-0">
                    Check spam folder if not found · Expires in 10 minutes
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block text-center">
                  Enter 6-digit OTP
                </label>
                <div
                  className="flex gap-2 sm:gap-3 justify-center"
                  onPaste={handleOtpPaste}
                >
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-extrabold border-2 rounded-xl outline-none transition-all ${
                        digit
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-center text-xs text-gray-400 mt-2 m-0">
                  {otp.filter(Boolean).length}/6 digits entered
                </p>
              </div>

              <ErrorAlert msg={error} />

              <SubmitBtn label="Verify OTP →" loadingLabel="Verifying..." />

              <div className="text-center">
                <p className="text-sm text-gray-500 m-0">
                  Didn't receive the OTP?{" "}
                  {resendTimer > 0 ? (
                    <span className="text-gray-400 font-medium">
                      Resend in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isLoading}
                      className="text-blue-600 font-semibold bg-transparent border-none cursor-pointer hover:underline disabled:opacity-50 font-[inherit]"
                    >
                      Resend OTP
                    </button>
                  )}
                </p>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                    autoComplete="new-password"
                    className="w-full border-2 border-gray-200 px-4 pr-12 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm bg-gray-50 focus:bg-white font-[inherit]"
                  />
                  <EyeToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                </div>

                {newPassword && (
                  <div className="mt-2.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strength.color} rounded-full transition-all duration-300`}
                          style={{ width: strength.width }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${strength.textColor} min-w-[50px]`}>
                        {strength.text}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {[
                        { check: newPassword.length >= 6, label: "6+ characters" },
                        { check: /[A-Z]/.test(newPassword), label: "Uppercase" },
                        { check: /[0-9]/.test(newPassword), label: "Number" },
                        { check: /[^A-Za-z0-9]/.test(newPassword), label: "Special" },
                      ].map((r) => (
                        <span
                          key={r.label}
                          className={`text-[11px] flex items-center gap-1 ${
                            r.check ? "text-green-500 font-semibold" : "text-gray-400"
                          }`}
                        >
                          {r.check ? (
                            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" />
                            </svg>
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full border-[1.5px] border-gray-300 inline-block" />
                          )}
                          {r.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    autoComplete="new-password"
                    className="w-full border-2 border-gray-200 px-4 pr-12 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm bg-gray-50 focus:bg-white font-[inherit]"
                  />
                  <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
                </div>

                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-500 text-xs mt-1.5 m-0 flex items-center gap-1">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                    Passwords do not match
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-green-500 text-xs mt-1.5 m-0 flex items-center gap-1">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" />
                    </svg>
                    Passwords match
                  </p>
                )}
              </div>

              <ErrorAlert msg={error} />
              <SubmitBtn label="Reset Password →" loadingLabel="Updating Password..." />
            </form>
          )}

          {step === 4 && (
            <div className="text-center py-4">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-base shadow-md">
                  🎉
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">
                Password Updated!
              </h2>
              <p className="text-gray-500 text-sm mb-1 m-0">
                Your password has been reset successfully.
              </p>
              <p className="text-gray-400 text-sm mb-8 m-0">
                You can now log in with your new password.
              </p>

              <div className="space-y-3 mb-6">
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] hover:brightness-110 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all no-underline text-sm"
                >
                  Login to Your Account →
                </Link>
                <Link
                  to="/"
                  className="w-full flex items-center justify-center border border-gray-200 text-gray-600 py-3 rounded-xl font-medium text-sm no-underline hover:bg-gray-50 transition-all"
                >
                  Go to Homepage
                </Link>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-left">
                <p className="text-xs font-bold text-blue-700 mb-1.5 m-0 flex items-center gap-1.5">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" />
                  </svg>
                  Security tip
                </p>
                <p className="text-xs text-blue-600 leading-relaxed m-0">
                  All other sessions have been logged out for your security. Consider enabling 2FA for extra protection.
                </p>
              </div>
            </div>
          )}

          {step < 4 && (
            <p className="text-center mt-6 text-gray-400 text-sm m-0">
              Remember your password?{" "}
              <Link to="/login" className="text-blue-600 font-semibold no-underline hover:underline">
                Sign In
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;