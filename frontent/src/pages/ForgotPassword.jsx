import { useState } from "react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Please enter a valid email address"); return; }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
    setStep(2);
    startResendTimer();
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    setError("");
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
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
    if (otpValue.length < 6) { setError("Please enter the complete 6-digit OTP"); return; }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
    setStep(3);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
    startResendTimer();
    document.getElementById("otp-0")?.focus();
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
    if (!newPassword || newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (!/[A-Z]/.test(newPassword)) { setError("Password must contain at least one uppercase letter"); return; }
    if (!/[0-9]/.test(newPassword)) { setError("Password must contain at least one number"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
    setStep(4);
  };

  const stepLabels = ["Email", "Verify OTP", "New Password", "Done"];

  const EyeToggle = ({ show, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 text-gray-400 hover:text-gray-600 transition-colors"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {show ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        ) : (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </>
        )}
      </svg>
    </button>
  );

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10 sm:py-12 bg-gray-50">
      <div className="w-full max-w-[1000px] grid lg:grid-cols-2 bg-white rounded-3xl shadow-2xl shadow-black/5 overflow-hidden border border-gray-100">

        <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-10 xl:p-12 relative overflow-hidden">
          <div className="absolute top-10 left-10 w-48 h-48 bg-[#D85A30]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative text-center w-full max-w-xs">
            <div className="w-16 h-16 bg-gradient-to-br from-[#D85A30] to-[#e8734d] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#D85A30]/30">
              <span className="text-white font-extrabold text-2xl">E</span>
            </div>

            <h2 className="text-2xl xl:text-3xl font-bold text-white mb-3">Reset Password</h2>
            <p className="text-gray-400 leading-relaxed text-sm xl:text-base mb-10">
              Follow the simple steps to securely reset your account password.
            </p>

            <div className="space-y-3">
              {stepLabels.map((label, i) => {
                const num = i + 1;
                const isDone = step > num;
                const isActive = step === num;
                return (
                  <div key={label} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 transition-all ${isDone ? "bg-green-500 text-white" : isActive ? "bg-[#D85A30] text-white shadow-lg shadow-[#D85A30]/40" : "bg-white/10 text-gray-500"}`}>
                      {isDone ? (
                        <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : num}
                    </div>
                    <span className={`text-sm font-semibold transition-colors ${isActive ? "text-white" : isDone ? "text-green-400" : "text-gray-500"}`}>
                      {label}
                    </span>
                    {isActive && (
                      <span className="ml-auto text-[10px] bg-[#D85A30]/20 text-[#FF8C5A] border border-[#D85A30]/30 px-2 py-0.5 rounded-full font-bold">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-10 p-4 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-left">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Security Note</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                OTP expires in <span className="text-[#FF8C5A] font-bold">10 minutes</span>. Never share your OTP with anyone. Our team will never ask for it.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 xl:p-12">

          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            {step < 4 && (
              <button
                onClick={() => { if (step > 1) { setStep(step - 1); setError(""); } }}
                className={`p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition cursor-pointer font-[inherit] ${step === 1 ? "opacity-0 pointer-events-none" : ""}`}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                {step === 1 && "Forgot Password?"}
                {step === 2 && "Verify OTP"}
                {step === 3 && "Create New Password"}
                {step === 4 && "Password Reset!"}
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                {step === 1 && "Enter your registered email to receive a reset OTP"}
                {step === 2 && `OTP sent to ${email}`}
                {step === 3 && "Choose a strong password for your account"}
                {step === 4 && "Your password has been updated successfully"}
              </p>
            </div>
          </div>

          <div className="flex gap-1.5 mb-6 sm:mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${step >= s ? "bg-[#D85A30]" : "bg-gray-200"}`}
              />
            ))}
          </div>

          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email Address</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    autoComplete="email"
                    className="w-full border border-gray-200 pl-12 pr-4 py-3 sm:py-3.5 rounded-xl outline-none focus:border-[#D85A30] focus:ring-4 focus:ring-[#D85A30]/10 transition-all text-[15px] bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#D85A30] to-[#e8734d] text-white py-3.5 sm:py-4 rounded-xl font-semibold shadow-lg shadow-[#D85A30]/20 hover:shadow-[#D85A30]/40 hover:scale-[1.01] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 text-[15px] border-none cursor-pointer font-[inherit]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Sending OTP...
                  </span>
                ) : "Send OTP →"}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-400 font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 border border-gray-200 py-3 rounded-xl text-sm font-medium text-gray-700 no-underline hover:bg-gray-50 transition-all"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Back to Login
              </Link>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex items-start gap-3">
                <span className="text-xl shrink-0">📧</span>
                <div>
                  <p className="text-sm font-bold text-blue-800 m-0">Check your inbox</p>
                  <p className="text-xs text-blue-600 m-0 mt-0.5">
                    We sent a 6-digit OTP to <strong>{email}</strong>. Check spam if not found.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block text-center">
                  Enter 6-digit OTP
                </label>
                <div className="flex gap-2 sm:gap-3 justify-center" onPaste={handleOtpPaste}>
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
                      className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-extrabold border-2 rounded-xl outline-none transition-all bg-gray-50 focus:bg-white ${
                        digit
                          ? "border-[#D85A30] bg-orange-50 text-[#D85A30]"
                          : "border-gray-200 text-gray-900 focus:border-[#D85A30] focus:ring-4 focus:ring-[#D85A30]/10"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otp.join("").length < 6}
                className="w-full bg-gradient-to-r from-[#D85A30] to-[#e8734d] text-white py-3.5 sm:py-4 rounded-xl font-semibold shadow-lg shadow-[#D85A30]/20 hover:shadow-[#D85A30]/40 hover:scale-[1.01] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-[15px] border-none cursor-pointer font-[inherit]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Verifying...
                  </span>
                ) : "Verify OTP →"}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Didn't receive the OTP?{" "}
                  {resendTimer > 0 ? (
                    <span className="text-gray-400 font-medium">Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isLoading}
                      className="text-[#D85A30] font-semibold bg-transparent border-none cursor-pointer hover:underline disabled:opacity-50 font-[inherit]"
                    >
                      Resend OTP
                    </button>
                  )}
                </p>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">New Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                    autoComplete="new-password"
                    className="w-full border border-gray-200 pl-12 pr-12 py-3 sm:py-3.5 rounded-xl outline-none focus:border-[#D85A30] focus:ring-4 focus:ring-[#D85A30]/10 transition-all text-[15px] bg-gray-50 focus:bg-white"
                  />
                  <EyeToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                </div>

                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${strength.color} rounded-full transition-all duration-300`} style={{ width: strength.width }} />
                      </div>
                      <span className={`text-xs font-bold ${strength.textColor} min-w-[50px]`}>{strength.text}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {[
                        { check: newPassword.length >= 6, label: "6+ characters" },
                        { check: /[A-Z]/.test(newPassword), label: "Uppercase" },
                        { check: /[0-9]/.test(newPassword), label: "Number" },
                        { check: /[^A-Za-z0-9]/.test(newPassword), label: "Special" },
                      ].map((r) => (
                        <span key={r.label} className={`text-[11px] ${r.check ? "text-green-500" : "text-gray-400"}`}>
                          {r.check ? "✓" : "○"} {r.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className={`w-5 h-5 ${confirmPassword && newPassword === confirmPassword ? "text-green-500" : "text-gray-400"}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    autoComplete="new-password"
                    className="w-full border border-gray-200 pl-12 pr-12 py-3 sm:py-3.5 rounded-xl outline-none focus:border-[#D85A30] focus:ring-4 focus:ring-[#D85A30]/10 transition-all text-[15px] bg-gray-50 focus:bg-white"
                  />
                  <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-500 text-xs mt-1.5">Passwords do not match</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-green-500 text-xs mt-1.5">✓ Passwords match</p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#D85A30] to-[#e8734d] text-white py-3.5 sm:py-4 rounded-xl font-semibold shadow-lg shadow-[#D85A30]/20 hover:shadow-[#D85A30]/40 hover:scale-[1.01] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 text-[15px] border-none cursor-pointer font-[inherit]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Updating Password...
                  </span>
                ) : "Reset Password →"}
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">Password Updated! 🎉</h2>
              <p className="text-gray-500 text-sm mb-2">Your password has been reset successfully.</p>
              <p className="text-gray-400 text-sm mb-8">You can now log in with your new password.</p>

              <div className="space-y-3">
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#D85A30] to-[#e8734d] text-white py-3.5 sm:py-4 rounded-xl font-semibold shadow-lg shadow-[#D85A30]/20 hover:shadow-[#D85A30]/40 hover:scale-[1.01] transition-all no-underline text-[15px]"
                >
                  Login to Your Account →
                </Link>
                <Link
                  to="/"
                  className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-3 rounded-xl font-medium text-sm no-underline hover:bg-gray-50 transition-all"
                >
                  Go to Homepage
                </Link>
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-xl text-left">
                <p className="text-xs font-bold text-green-700 mb-1">✅ Security tip</p>
                <p className="text-xs text-green-600 leading-relaxed">
                  For your security, all other sessions have been logged out. Enable 2FA for extra protection.
                </p>
              </div>
            </div>
          )}

          {step < 4 && (
            <p className="text-center mt-6 text-gray-500 text-sm">
              Remember your password?{" "}
              <Link to="/login" className="text-[#D85A30] font-semibold no-underline hover:underline">
                Login
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;