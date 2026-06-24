import { useState } from "react";
import { useVendorSignupMutation } from "../features/auth/authApi";
import { Link } from "react-router-dom";
import DocumentUploader from "../components/DocumentUploader";
import { verifyIFSC, verifyPinCode, checkStoreName, validateGSTNumber } from "../utils/verificationApis";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya",
  "Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim",
  "Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand",
  "West Bengal","Delhi","Jammu & Kashmir","Ladakh",
];

const BUSINESS_TYPES = [
  { value: "individual", label: "Individual / Freelancer" },
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
  { value: "partnership", label: "Partnership Firm" },
  { value: "private_limited", label: "Private Limited Company" },
  { value: "llp", label: "LLP (Limited Liability Partnership)" },
  { value: "other", label: "Other" },
];

const inputCls = "w-full border-[1.5px] border-gray-200 rounded-xl px-3.5 py-[11px] text-sm text-gray-900 bg-gray-50 outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-600/8 transition-all placeholder:text-gray-400 font-[inherit] box-border";
const selectCls = `${inputCls} cursor-pointer appearance-none pr-9 bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_14px_center]`;

const Label = ({ children, required }) => (
  <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const FieldError = ({ msg }) =>
  msg ? (
    <span className="flex items-center gap-1 text-[11px] text-red-500 font-semibold mt-1.5">
      <span>⚠</span>{msg}
    </span>
  ) : null;

const FieldHint = ({ text }) => (
  <span className="block text-[11px] text-gray-400 mt-1">{text}</span>
);

const SectionLabel = ({ icon, children }) => (
  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-purple-700 mb-4 pb-2.5 border-b-2 border-purple-100">
    <span>{icon}</span>{children}
  </div>
);

const Divider = () => (
  <div className="h-px bg-gradient-to-r from-purple-100 to-transparent my-1" />
);

const VerifiedBadge = ({ text }) => (
  <span className="flex items-center gap-1 text-[11px] text-green-600 font-semibold mt-1">
    <svg width="10" height="10" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" />
    </svg>
    {text}
  </span>
);

const InputSpinner = () => (
  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const InputCheck = () => (
  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
    <svg width="18" height="18" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" />
    </svg>
  </div>
);

const InputCross = () => (
  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
    <svg width="18" height="18" fill="none" stroke="#EF4444" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  </div>
);

const EyeBtn = ({ show, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-500 hover:text-gray-700 transition-colors p-1"
  >
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      {show ? (
        <path strokeLinecap="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      ) : (
        <>
          <path strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </>
      )}
    </svg>
  </button>
);

const VendorSignup = () => {
  const [vendorSignup, { isLoading, error, isSuccess }] = useVendorSignupMutation();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [storeNameStatus, setStoreNameStatus] = useState(null);
  const [storeNameChecking, setStoreNameChecking] = useState(false);
  const [storeNameTimer, setStoreNameTimer] = useState(null);

  const [ifscVerified, setIfscVerified] = useState(null);
  const [ifscVerifying, setIfscVerifying] = useState(false);

  const [pinVerified, setPinVerified] = useState(null);
  const [pinVerifying, setPinVerifying] = useState(false);
  const [gstValidation, setGstValidation] = useState(null);

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", storeName: "", storeDescription: "",
    businessType: "individual", panNumber: "", gstNumber: "",
    bankDetails: { accountHolderName: "", bankName: "", accountNumber: "", confirmAccountNumber: "", ifscCode: "", accountType: "savings" },
    businessAddress: { street: "", city: "", state: "", postalCode: "" },
    phone: "", password: "", confirmPassword: "", agreeTerms: false, agreeVendorPolicy: false,
  });

  const [documents, setDocuments] = useState({
    panDocument: { url: "", filename: "" },
    gstDocument: { url: "", filename: "" },
    businessRegistrationDoc: { url: "", filename: "" },
    cancelledCheque: { url: "", filename: "" },
  });

  const handleDocumentChange = (key, value) => {
    setDocuments((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleNestedChange = (parent, e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [parent]: { ...prev[parent], [name]: value } }));
  };

  const handleStoreNameChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, storeName: value }));
    setFieldErrors((prev) => ({ ...prev, storeName: "" }));
    setStoreNameStatus(null);
    if (storeNameTimer) clearTimeout(storeNameTimer);
    if (value.trim().length >= 3) {
      setStoreNameChecking(true);
      const timer = setTimeout(async () => {
        const result = await checkStoreName(value);
        setStoreNameStatus(result);
        setStoreNameChecking(false);
      }, 500);
      setStoreNameTimer(timer);
    } else {
      setStoreNameChecking(false);
    }
  };

  const handleIFSCChange = async (value) => {
    const ifsc = value.toUpperCase();
    handleNestedChange("bankDetails", { target: { name: "ifscCode", value: ifsc } });
    setIfscVerified(null);
    if (ifsc.length === 11) {
      setIfscVerifying(true);
      const result = await verifyIFSC(ifsc);
      setIfscVerified(result);
      setIfscVerifying(false);
      if (result.success) {
        setForm((prev) => ({ ...prev, bankDetails: { ...prev.bankDetails, ifscCode: ifsc, bankName: result.bankName || prev.bankDetails.bankName } }));
      }
    }
  };

  const handlePinCodeChange = async (value) => {
    const pin = value.replace(/\D/g, "").slice(0, 6);
    handleNestedChange("businessAddress", { target: { name: "postalCode", value: pin } });
    setPinVerified(null);
    if (pin.length === 6) {
      setPinVerifying(true);
      const result = await verifyPinCode(pin);
      setPinVerified(result);
      setPinVerifying(false);
      if (result.success) {
        setForm((prev) => ({ ...prev, businessAddress: { ...prev.businessAddress, postalCode: pin, city: result.city || prev.businessAddress.city, state: result.state || prev.businessAddress.state } }));
      }
    }
  };

  const handleGSTChange = (value) => {
    const gst = value.toUpperCase();
    setForm((prev) => ({ ...prev, gstNumber: gst }));
    setGstValidation(null);
    setFieldErrors((prev) => ({ ...prev, gstNumber: "" }));
    if (gst.length === 15) {
      const result = validateGSTNumber(gst, form.panNumber);
      setGstValidation(result);
    }
  };

  const getPasswordStrength = () => {
    const p = form.password;
    if (!p) return { width: "w-0", color: "bg-gray-200", text: "", textColor: "text-gray-400", score: 0 };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 2) return { width: "w-1/3", color: "bg-red-500", text: "Weak", textColor: "text-red-500", score };
    if (score <= 3) return { width: "w-2/3", color: "bg-yellow-400", text: "Medium", textColor: "text-yellow-500", score };
    return { width: "w-full", color: "bg-green-500", text: "Strong", textColor: "text-green-500", score };
  };

  const strength = getPasswordStrength();

  const validateStep1 = () => {
    const errors = {};
    if (!form.firstName.trim() || form.firstName.trim().length < 2) errors.firstName = "Minimum 2 characters required";
    if (!form.lastName.trim() || form.lastName.trim().length < 2) errors.lastName = "Minimum 2 characters required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Valid email required";
    if (!form.storeName.trim() || form.storeName.trim().length < 3) errors.storeName = "Store name must be at least 3 characters";
    if (storeNameStatus?.available === false) errors.storeName = "Store name is already taken";
    if (!form.businessType) errors.businessType = "Business type required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!form.panNumber.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber.trim().toUpperCase())) errors.panNumber = "Enter valid PAN (e.g. ABCDE1234F)";
    if (!documents.panDocument.url) errors.panDocument = "PAN card document is required";
    if (!form.gstNumber.trim() || form.gstNumber.trim().length !== 15) errors.gstNumber = "Valid 15-character GST number is required";
    else if (gstValidation && !gstValidation.valid) errors.gstNumber = gstValidation.message;
    if (!documents.gstDocument.url) errors.gstDocument = "GST certificate document is required";
    if (!form.bankDetails.accountHolderName.trim()) errors.accountHolderName = "Account holder name required";
    if (!form.bankDetails.bankName.trim()) errors.bankName = "Bank name required";
    if (!form.bankDetails.accountNumber.trim() || form.bankDetails.accountNumber.trim().length < 9) errors.accountNumber = "Valid account number required";
    if (form.bankDetails.accountNumber !== form.bankDetails.confirmAccountNumber) errors.confirmAccountNumber = "Account numbers do not match";
    if (!form.bankDetails.ifscCode.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.bankDetails.ifscCode.trim().toUpperCase())) errors.ifscCode = "Enter valid IFSC code";
    if (ifscVerified && !ifscVerified.success) errors.ifscCode = "IFSC code could not be verified";
    if (!documents.cancelledCheque.url) errors.cancelledCheque = "Cancelled cheque is required";
    if (!form.businessAddress.street.trim()) errors.street = "Street address required";
    if (!form.businessAddress.city.trim()) errors.city = "City required";
    if (!form.businessAddress.state) errors.state = "State required";
    if (!form.businessAddress.postalCode.trim() || form.businessAddress.postalCode.trim().length !== 6) errors.postalCode = "Valid 6-digit PIN code required";
    if (pinVerified && !pinVerified.success) errors.postalCode = "PIN code could not be verified";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors = {};
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone.trim())) errors.phone = "Valid 10-digit Indian phone number required";
    if (!form.password || form.password.length < 6) errors.password = "Password must be at least 6 characters";
    if (!/[A-Z]/.test(form.password)) errors.password = "Must contain at least one uppercase letter";
    if (!/[0-9]/.test(form.password)) errors.password = "Must contain at least one number";
    if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match";
    if (!form.agreeTerms) errors.agreeTerms = "You must accept the Terms & Conditions";
    if (!form.agreeVendorPolicy) errors.agreeVendorPolicy = "You must accept the Vendor Agreement";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    setFieldErrors({});
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => { setFieldErrors({}); setStep((s) => s - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;
    try {
      await vendorSignup({
        firstName: form.firstName.trim(), lastName: form.lastName.trim(),
        email: form.email.trim(), phone: form.phone.trim(), password: form.password,
        storeName: form.storeName.trim(), storeDescription: form.storeDescription.trim(),
        businessType: form.businessType, panNumber: form.panNumber.trim().toUpperCase(),
        panDocument: documents.panDocument, gstNumber: form.gstNumber.trim().toUpperCase(),
        gstDocument: documents.gstDocument, businessRegistrationDoc: documents.businessRegistrationDoc,
        cancelledCheque: documents.cancelledCheque,
        bankDetails: { accountHolderName: form.bankDetails.accountHolderName.trim(), bankName: form.bankDetails.bankName.trim(), accountNumber: form.bankDetails.accountNumber.trim(), ifscCode: form.bankDetails.ifscCode.trim().toUpperCase(), accountType: form.bankDetails.accountType },
        businessAddress: { street: form.businessAddress.street.trim(), city: form.businessAddress.city.trim(), state: form.businessAddress.state, postalCode: form.businessAddress.postalCode.trim() },
        agreementsAccepted: true,
      }).unwrap();
    } catch (err) { console.log(err); }
  };

  const stepLabels = ["Business Info", "Tax & Banking", "Security"];
  const stepIcons = ["🏪", "🏦", "🔒"];
  const stepDescriptions = ["Tell us about your business", "Tax documents & bank details", "Set up your password & agreements"];

  const verificationItems = [
    { icon: "🏪", text: "Store Name", status: storeNameStatus?.available === true ? "✅" : storeNameStatus?.available === false ? "❌" : "⏳" },
    { icon: "📄", text: "GST Validation", status: gstValidation?.valid ? "✅" : gstValidation && !gstValidation.valid ? "❌" : "⏳" },
    { icon: "🏦", text: "IFSC → Bank", status: ifscVerified?.success ? "✅" : ifscVerified && !ifscVerified.success ? "❌" : "⏳" },
    { icon: "📍", text: "PIN → Address", status: pinVerified?.success ? "✅" : pinVerified && !pinVerified.success ? "❌" : "⏳" },
  ];

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-[#F0F4FF] to-[#F5F3FF]">
        <div className="max-w-[520px] w-full bg-white rounded-[28px] p-10 sm:p-14 text-center border border-gray-200 shadow-2xl shadow-black/10">
          <div className="w-[90px] h-[90px] bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-7 shadow-xl shadow-green-500/30">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3.5 py-1 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
            <span className="text-xs font-bold text-green-700">Application Received</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">You're Almost There!</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-7">
            Your vendor application has been submitted. Our team will review within <strong className="text-gray-900">24–48 hours</strong>.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link to="/vendor/login" className="block bg-gradient-to-r from-purple-700 to-purple-600 text-white no-underline py-4 rounded-2xl font-extrabold text-[15px] shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.01] transition-all">
              Go to Vendor Login
            </Link>
            <Link to="/" className="block bg-transparent text-gray-500 no-underline py-3.5 rounded-2xl font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#F5F3FF] to-[#FFF5F0] py-8 px-4 flex items-start justify-center">
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } } .step-content { animation: fadeIn 0.25s ease both; }`}</style>

      <div className="w-full max-w-[1100px] grid lg:grid-cols-[300px_1fr] bg-white rounded-[28px] shadow-2xl shadow-black/10 border border-white/80 overflow-hidden">

        <div className="bg-gradient-to-b from-slate-900 via-[#1a2744] to-indigo-950 p-8 sm:p-11 flex flex-col relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/15 rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-[#D85A30]/10 rounded-full blur-[50px] pointer-events-none" />

          <div className="relative flex-1">
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-700 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/40 shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-base font-black text-white m-0">E-Commerce</p>
                <p className="text-[11px] text-indigo-400 m-0 font-semibold">Vendor Portal</p>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white mb-1.5 leading-tight">Start Selling Today</h2>
            <p className="text-[13px] text-slate-500 leading-relaxed mb-8">Join thousands of verified sellers.</p>

            <div className="flex flex-col gap-2 mb-8">
              {stepLabels.map((label, i) => {
                const isDone = step > i + 1;
                const isActive = step === i + 1;
                return (
                  <div key={label} className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border transition-all ${isActive ? "bg-purple-600/25 border-purple-500/50" : isDone ? "bg-green-500/10 border-green-500/30" : "bg-white/[0.03] border-white/[0.06]"}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isDone ? "bg-green-500 shadow-lg shadow-green-500/30" : isActive ? "bg-purple-600 shadow-lg shadow-purple-600/40" : "bg-white/[0.06]"}`}>
                      {isDone ? (
                        <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" /></svg>
                      ) : (
                        <span className={`text-sm font-black ${isActive ? "text-white" : "text-slate-500"}`}>{stepIcons[i]}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-[13px] m-0 ${isActive ? "font-extrabold text-white" : isDone ? "font-semibold text-green-300" : "font-medium text-slate-500"}`}>{label}</p>
                      <p className={`text-[11px] m-0 mt-0.5 ${isActive ? "text-purple-300" : "text-slate-600"}`}>{stepDescriptions[i]}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] flex items-center gap-1.5 mb-3">
                <span>🔍</span> Auto-Verification
              </p>
              <div className="flex flex-col gap-2">
                {verificationItems.map((item) => (
                  <div key={item.text} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-[11px] text-slate-500">{item.text}</span>
                    </div>
                    <span className="text-[11px]">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative flex flex-col gap-1.5 mt-6">
            {[
              { icon: "🛡️", text: "256-bit SSL encryption" },
              { icon: "⚡", text: "Approval within 24-48 hours" },
              { icon: "💰", text: "Commission from just 6%" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2.5 px-3 py-2.5 bg-white/[0.03] border border-white/[0.05] rounded-xl">
                <span className="text-sm">{item.icon}</span>
                <span className="text-[11px] text-slate-500">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-11 overflow-y-auto max-h-[94vh]">
          <div className="mb-7">
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 m-0">Vendor Registration</h1>
                <p className="text-[13px] text-gray-500 mt-1 m-0">Step {step} of 3 — {stepLabels[step - 1]}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center text-2xl border border-purple-200">
                {stepIcons[step - 1]}
              </div>
            </div>
            <div className="flex gap-1.5 mt-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${step >= s ? "bg-gradient-to-r from-purple-700 to-purple-600 shadow-sm shadow-purple-500/30" : "bg-gray-100"}`} />
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="step-content flex flex-col gap-4 sm:gap-[18px]">
              <SectionLabel icon="👤">Personal Information</SectionLabel>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <Label required>First Name</Label>
                  <input name="firstName" placeholder="John" value={form.firstName} onChange={handleChange} className={inputCls} />
                  <FieldError msg={fieldErrors.firstName} />
                </div>
                <div>
                  <Label required>Last Name</Label>
                  <input name="lastName" placeholder="Doe" value={form.lastName} onChange={handleChange} className={inputCls} />
                  <FieldError msg={fieldErrors.lastName} />
                </div>
              </div>

              <div>
                <Label required>Email Address</Label>
                <input name="email" type="email" placeholder="business@example.com" value={form.email} onChange={handleChange} className={inputCls} autoComplete="username" />
                <FieldError msg={fieldErrors.email} />
              </div>

              <Divider />
              <SectionLabel icon="🏪">Business Information</SectionLabel>

              <div>
                <Label required>Business Type</Label>
                <select name="businessType" value={form.businessType} onChange={handleChange} className={selectCls}>
                  {BUSINESS_TYPES.map((bt) => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                </select>
                <FieldError msg={fieldErrors.businessType} />
              </div>

              <div>
                <Label required>Store / Business Name</Label>
                <div className="relative">
                  <input name="storeName" placeholder="My Awesome Store" value={form.storeName} onChange={handleStoreNameChange} className={`${inputCls} pr-11`} />
                  {storeNameChecking && <InputSpinner />}
                  {!storeNameChecking && storeNameStatus?.available === true && <InputCheck />}
                  {!storeNameChecking && storeNameStatus?.available === false && <InputCross />}
                </div>
                {storeNameStatus?.available === true && <VerifiedBadge text="Store name is available" />}
                {storeNameStatus?.available === false && <span className="block text-[11px] text-red-500 font-semibold mt-1">⚠️ Store name is already taken</span>}
                <FieldError msg={fieldErrors.storeName} />
                <FieldHint text="Displayed to customers on all your products" />
              </div>

              <div>
                <Label>Store Description</Label>
                <textarea name="storeDescription" placeholder="Tell customers what makes your store special..." value={form.storeDescription} onChange={handleChange} rows={3} className={`${inputCls} resize-none`} />
                <FieldHint text="Optional — helps customers understand your brand" />
              </div>

              <button type="button" onClick={handleNext} className="w-full bg-gradient-to-r from-purple-700 to-purple-600 text-white border-none rounded-2xl py-3.5 text-[15px] font-extrabold cursor-pointer shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.01] transition-all font-[inherit]">
                Continue to Tax & Banking →
              </button>

              <p className="text-center text-[13px] text-gray-500 m-0">
                Already registered?{" "}
                <Link to="/vendor/login" className="text-purple-700 font-extrabold no-underline hover:underline">Login to Dashboard</Link>
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="step-content flex flex-col gap-4 sm:gap-[18px]">
              <SectionLabel icon="📋">Tax Information & Documents</SectionLabel>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <Label required>PAN Number</Label>
                  <input name="panNumber" placeholder="ABCDE1234F" value={form.panNumber} onChange={(e) => { setFieldErrors((p) => ({ ...p, panNumber: "" })); setForm((p) => ({ ...p, panNumber: e.target.value.toUpperCase() })); }} maxLength={10} className={`${inputCls} font-mono tracking-[0.08em] font-semibold`} />
                  <FieldError msg={fieldErrors.panNumber} />
                </div>
                <div>
                  <Label required>GST Number</Label>
                  <div className="relative">
                    <input name="gstNumber" placeholder="22AAAAA0000A1Z5" value={form.gstNumber} onChange={(e) => handleGSTChange(e.target.value)} maxLength={15} className={`${inputCls} font-mono tracking-[0.04em] pr-11`} />
                    {form.gstNumber.length === 15 && gstValidation?.valid && <InputCheck />}
                    {form.gstNumber.length === 15 && gstValidation && !gstValidation.valid && <InputCross />}
                  </div>
                  {gstValidation?.valid && (
                    <div className="flex items-center gap-2 flex-wrap mt-1.5">
                      <VerifiedBadge text="GST format verified" />
                      {form.panNumber && (
                        <span className="text-[10px] text-green-700 font-semibold bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">PAN Match ✓</span>
                      )}
                    </div>
                  )}
                  {gstValidation && !gstValidation.valid && <span className="block text-[11px] text-red-500 font-semibold mt-1">⚠️ {gstValidation.message}</span>}
                  <FieldError msg={fieldErrors.gstNumber} />
                  <FieldHint text="15-character GST identification number" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <DocumentUploader label="PAN Card" required hint="Front side (JPG/PNG/PDF, max 5MB)" value={documents.panDocument} onChange={handleDocumentChange} docKey="panDocument" />
                  <FieldError msg={fieldErrors.panDocument} />
                </div>
                <div>
                  <DocumentUploader label="GST Certificate" required hint="Upload GST registration certificate (JPG/PNG/PDF, max 5MB)" value={documents.gstDocument} onChange={handleDocumentChange} docKey="gstDocument" />
                  <FieldError msg={fieldErrors.gstDocument} />
                </div>
              </div>

              <DocumentUploader label="Business Registration Document" hint="Partnership deed / Certificate (optional)" value={documents.businessRegistrationDoc} onChange={handleDocumentChange} docKey="businessRegistrationDoc" />

              <Divider />
              <SectionLabel icon="🏦">Bank Account Details</SectionLabel>

              <div>
                <Label required>Account Holder Name</Label>
                <input name="accountHolderName" placeholder="Exactly as per bank records" value={form.bankDetails.accountHolderName} onChange={(e) => handleNestedChange("bankDetails", e)} className={inputCls} />
                <FieldError msg={fieldErrors.accountHolderName} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <Label required>Bank Name</Label>
                  <input name="bankName" placeholder="State Bank of India" value={form.bankDetails.bankName} onChange={(e) => handleNestedChange("bankDetails", e)} readOnly={!!ifscVerified?.success}
                    className={`${inputCls} ${ifscVerified?.success ? "bg-green-50 border-green-300 text-green-800 font-bold cursor-not-allowed" : ""}`}
                  />
                  {ifscVerified?.success && <VerifiedBadge text="Auto-filled from IFSC" />}
                  <FieldError msg={fieldErrors.bankName} />
                </div>
                <div>
                  <Label required>Account Type</Label>
                  <select name="accountType" value={form.bankDetails.accountType} onChange={(e) => handleNestedChange("bankDetails", e)} className={selectCls}>
                    <option value="savings">Savings Account</option>
                    <option value="current">Current Account</option>
                  </select>
                </div>
              </div>

              <div>
                <Label required>Account Number</Label>
                <input name="accountNumber" type="password" placeholder="Enter your account number" value={form.bankDetails.accountNumber} onChange={(e) => handleNestedChange("bankDetails", e)} className={inputCls} autoComplete="off" />
                <FieldError msg={fieldErrors.accountNumber} />
              </div>

              <div>
                <Label required>Confirm Account Number</Label>
                <input name="confirmAccountNumber" placeholder="Re-enter account number" value={form.bankDetails.confirmAccountNumber} onChange={(e) => handleNestedChange("bankDetails", e)} className={inputCls} autoComplete="off" />
                {form.bankDetails.confirmAccountNumber && form.bankDetails.accountNumber === form.bankDetails.confirmAccountNumber && <VerifiedBadge text="Account numbers match" />}
                <FieldError msg={fieldErrors.confirmAccountNumber} />
              </div>

              <div>
                <Label required>IFSC Code</Label>
                <div className="relative">
                  <input name="ifscCode" placeholder="SBIN0001234" value={form.bankDetails.ifscCode} onChange={(e) => handleIFSCChange(e.target.value)} maxLength={11} className={`${inputCls} font-mono tracking-[0.06em] font-semibold pr-11`} />
                  {ifscVerifying && <InputSpinner />}
                  {!ifscVerifying && ifscVerified?.success && <InputCheck />}
                  {!ifscVerifying && ifscVerified && !ifscVerified.success && <InputCross />}
                </div>
                {ifscVerified?.success && (
                  <div className="mt-2 bg-green-50 border border-green-200 rounded-xl p-3.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg width="14" height="14" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" /></svg>
                      <span className="text-xs font-extrabold text-green-700">IFSC Verified</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div><p className="text-[10px] text-gray-500 uppercase font-bold m-0">Bank</p><p className="text-xs text-gray-900 font-semibold mt-0.5">{ifscVerified.bankName}</p></div>
                      <div><p className="text-[10px] text-gray-500 uppercase font-bold m-0">Branch</p><p className="text-xs text-gray-900 font-semibold mt-0.5">{ifscVerified.branch}</p></div>
                    </div>
                  </div>
                )}
                {ifscVerified && !ifscVerified.success && <span className="block text-[11px] text-red-500 font-semibold mt-1">⚠️ {ifscVerified.message}</span>}
                <FieldError msg={fieldErrors.ifscCode} />
              </div>

              <div>
                <DocumentUploader label="Cancelled Cheque / Bank Passbook" required hint="First page of passbook or cancelled cheque (JPG/PNG/PDF)" value={documents.cancelledCheque} onChange={handleDocumentChange} docKey="cancelledCheque" />
                <FieldError msg={fieldErrors.cancelledCheque} />
              </div>

              <Divider />
              <SectionLabel icon="📍">Business Address</SectionLabel>

              <div>
                <Label required>Street Address</Label>
                <input name="street" placeholder="Shop No, Building, Street, Area" value={form.businessAddress.street} onChange={(e) => handleNestedChange("businessAddress", e)} className={inputCls} />
                <FieldError msg={fieldErrors.street} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <Label required>City</Label>
                  <input name="city" placeholder="Mumbai" value={form.businessAddress.city} onChange={(e) => handleNestedChange("businessAddress", e)} readOnly={!!pinVerified?.success}
                    className={`${inputCls} ${pinVerified?.success ? "bg-green-50 border-green-300 text-green-800 font-bold cursor-not-allowed" : ""}`}
                  />
                  {pinVerified?.success && <VerifiedBadge text="Auto-filled from PIN" />}
                  <FieldError msg={fieldErrors.city} />
                </div>
                <div>
                  <Label required>PIN Code</Label>
                  <div className="relative">
                    <input name="postalCode" placeholder="400001" value={form.businessAddress.postalCode} onChange={(e) => handlePinCodeChange(e.target.value)} maxLength={6} className={`${inputCls} font-mono tracking-[0.1em] font-semibold pr-11`} />
                    {pinVerifying && <InputSpinner />}
                    {!pinVerifying && pinVerified?.success && <InputCheck />}
                    {!pinVerifying && pinVerified && !pinVerified.success && <InputCross />}
                  </div>
                  {pinVerified?.success && (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
                      <svg width="12" height="12" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" /></svg>
                      <span className="text-[11px] font-bold text-green-700">PIN Verified — {pinVerified.area && `${pinVerified.area}, `}{pinVerified.city}, {pinVerified.state}</span>
                    </div>
                  )}
                  {pinVerified && !pinVerified.success && <span className="block text-[11px] text-red-500 font-semibold mt-1">⚠️ {pinVerified.message}</span>}
                  <FieldError msg={fieldErrors.postalCode} />
                </div>
              </div>

              <div>
                <Label required>State</Label>
                {pinVerified?.success ? (
                  <input value={form.businessAddress.state} readOnly className={`${inputCls} bg-green-50 border-green-300 text-green-800 font-bold cursor-not-allowed`} />
                ) : (
                  <select name="state" value={form.businessAddress.state} onChange={(e) => handleNestedChange("businessAddress", e)} className={selectCls}>
                    <option value="">Select your state</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
                {pinVerified?.success && <VerifiedBadge text="Auto-filled from PIN" />}
                <FieldError msg={fieldErrors.state} />
              </div>

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={handleBack} className="flex-1 bg-white text-gray-700 border-[1.5px] border-gray-200 rounded-2xl py-3.5 text-sm font-bold cursor-pointer hover:bg-gray-50 transition font-[inherit]">
                  ← Back
                </button>
                <button type="button" onClick={handleNext} className="flex-[2] bg-gradient-to-r from-purple-700 to-purple-600 text-white border-none rounded-2xl py-3.5 text-sm font-extrabold cursor-pointer shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition font-[inherit]">
                  Continue to Security →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form className="step-content flex flex-col gap-4 sm:gap-[18px]" onSubmit={handleSubmit}>
              <SectionLabel icon="📱">Contact Details</SectionLabel>

              <div>
                <Label required>Phone Number</Label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <span className="text-[13px] font-extrabold text-gray-700">+91</span>
                    <div className="w-px h-[18px] bg-gray-300" />
                  </div>
                  <input name="phone" placeholder="9876543210" value={form.phone} onChange={handleChange} className={`${inputCls} pl-[58px]`} maxLength={10} />
                </div>
                <FieldError msg={fieldErrors.phone} />
              </div>

              <Divider />
              <SectionLabel icon="🔐">Create Password</SectionLabel>

              <div>
                <Label required>Password</Label>
                <div className="relative">
                  <input name="password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={form.password} onChange={handleChange} className={`${inputCls} pr-12`} autoComplete="new-password" />
                  <EyeBtn show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                </div>
                {form.password && (
                  <div className="mt-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${strength.color} ${strength.width} rounded-full transition-all duration-400`} />
                      </div>
                      <span className={`text-[11px] font-extrabold ${strength.textColor} min-w-[46px] text-right`}>{strength.text}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {[
                        { check: form.password.length >= 6, label: "6+ characters" },
                        { check: /[A-Z]/.test(form.password), label: "Uppercase" },
                        { check: /[0-9]/.test(form.password), label: "Number" },
                        { check: /[^A-Za-z0-9]/.test(form.password), label: "Special char" },
                      ].map((item) => (
                        <span key={item.label} className={`text-[11px] flex items-center gap-1 ${item.check ? "text-green-500 font-semibold" : "text-gray-400"}`}>
                          {item.check ? <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" /></svg> : <span className="w-2.5 h-2.5 rounded-full border-[1.5px] border-gray-300 inline-block" />}
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <FieldError msg={fieldErrors.password} />
              </div>

              <div>
                <Label required>Confirm Password</Label>
                <div className="relative">
                  <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter your password" value={form.confirmPassword} onChange={handleChange} className={`${inputCls} pr-12`} autoComplete="new-password" />
                  <EyeBtn show={showConfirmPassword} onToggle={() => setShowConfirmPassword((v) => !v)} />
                </div>
                {form.confirmPassword && form.password === form.confirmPassword && <VerifiedBadge text="Passwords match" />}
                <FieldError msg={fieldErrors.confirmPassword} />
              </div>

              <Divider />
              <SectionLabel icon="✅">Agreements</SectionLabel>

              <div className="flex flex-col gap-3">
                <div className={`bg-gray-50 border rounded-2xl px-4 py-3.5 ${fieldErrors.agreeTerms ? "border-red-200" : "border-gray-200"}`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" name="agreeTerms" checked={form.agreeTerms} onChange={handleChange} className="w-[18px] h-[18px] mt-0.5 cursor-pointer accent-purple-700 shrink-0" />
                    <span className="text-[13px] text-gray-700 leading-relaxed">
                      I agree to the{" "}
                      <Link to="/policy/terms" target="_blank" className="text-purple-700 font-bold no-underline hover:underline">Terms</Link>{" "}
                      and{" "}
                      <Link to="/policy/privacy" target="_blank" className="text-purple-700 font-bold no-underline hover:underline">Privacy Policy</Link>
                    </span>
                  </label>
                  <FieldError msg={fieldErrors.agreeTerms} />
                </div>

                <div className={`bg-gray-50 border rounded-2xl px-4 py-3.5 ${fieldErrors.agreeVendorPolicy ? "border-red-200" : "border-gray-200"}`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" name="agreeVendorPolicy" checked={form.agreeVendorPolicy} onChange={handleChange} className="w-[18px] h-[18px] mt-0.5 cursor-pointer accent-purple-700 shrink-0" />
                    <span className="text-[13px] text-gray-700 leading-relaxed">
                      I agree to the{" "}
                      <Link to="/policy/vendor-agreement" target="_blank" className="text-purple-700 font-bold no-underline hover:underline">Vendor Agreement</Link>,{" "}
                      <Link to="/policy/commission-policy" target="_blank" className="text-purple-700 font-bold no-underline hover:underline">Commission</Link>{" "}
                      and{" "}
                      <Link to="/policy/vendor-privacy" target="_blank" className="text-purple-700 font-bold no-underline hover:underline">Vendor Privacy</Link>
                    </span>
                  </label>
                  <FieldError msg={fieldErrors.agreeVendorPolicy} />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3.5 flex items-start gap-2.5">
                  <span className="text-lg shrink-0">❌</span>
                  <p className="text-[13px] text-red-600 font-medium m-0">{error?.data?.message || "Something went wrong."}</p>
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={handleBack} className="flex-1 bg-white text-gray-700 border-[1.5px] border-gray-200 rounded-2xl py-3.5 text-sm font-bold cursor-pointer hover:bg-gray-50 transition font-[inherit]">
                  ← Back
                </button>
                <button type="submit" disabled={isLoading}
                  className={`flex-[2] text-white border-none rounded-2xl py-3.5 text-[15px] font-extrabold cursor-pointer transition-all font-[inherit] ${isLoading ? "bg-purple-400 cursor-not-allowed" : "bg-gradient-to-r from-purple-700 to-purple-600 shadow-lg shadow-purple-500/35 hover:shadow-purple-500/50 hover:scale-[1.01]"}`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2.5">
                      <span className="w-[18px] h-[18px] border-[2.5px] border-white/40 border-t-white rounded-full animate-spin inline-block" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Submit Application
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" /></svg>
                    </span>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 leading-relaxed m-0">
                By submitting, you confirm all information is accurate and genuine.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorSignup;