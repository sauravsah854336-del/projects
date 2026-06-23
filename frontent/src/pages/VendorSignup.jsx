import { useState } from "react";
import { useVendorSignupMutation } from "../features/auth/authApi";
import { Link } from "react-router-dom";
import DocumentUploader from "../components/DocumentUploader";
import { verifyIFSC, verifyPinCode, checkStoreName, validateGSTNumber } from "../utils/verificationApis";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh",
];

const BUSINESS_TYPES = [
  { value: "individual", label: "Individual / Freelancer" },
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
  { value: "partnership", label: "Partnership Firm" },
  { value: "private_limited", label: "Private Limited Company" },
  { value: "llp", label: "LLP (Limited Liability Partnership)" },
  { value: "other", label: "Other" },
];

const Label = ({ children, required }) => (
  <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
    {children} {required && <span style={{ color: "#EF4444" }}>*</span>}
  </label>
);

const VerifiedBadge = ({ text }) => (
  <span style={{ fontSize: 11, color: "#22C55E", marginTop: 4, display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
    <svg width="10" height="10" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" />
    </svg>
    {text}
  </span>
);

const InputSpinner = () => (
  <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
    <div style={{ width: 16, height: 16, border: "2px solid #7C3AED", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }}></div>
  </div>
);

const InputCheck = () => (
  <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
    <svg width="18" height="18" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" />
    </svg>
  </div>
);

const InputCross = () => (
  <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
    <svg width="18" height="18" fill="none" stroke="#EF4444" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  </div>
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
    firstName: "",
    lastName: "",
    email: "",
    storeName: "",
    storeDescription: "",
    businessType: "individual",
    panNumber: "",
    gstNumber: "",
    bankDetails: {
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      confirmAccountNumber: "",
      ifscCode: "",
      accountType: "savings",
    },
    businessAddress: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
    },
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    agreeVendorPolicy: false,
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
        setForm((prev) => ({
          ...prev,
          bankDetails: {
            ...prev.bankDetails,
            ifscCode: ifsc,
            bankName: result.bankName || prev.bankDetails.bankName,
          },
        }));
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
        setForm((prev) => ({
          ...prev,
          businessAddress: {
            ...prev.businessAddress,
            postalCode: pin,
            city: result.city || prev.businessAddress.city,
            state: result.state || prev.businessAddress.state,
          },
        }));
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
    if (!p) return { width: "0%", color: "#E5E7EB", text: "", textColor: "#9CA3AF", score: 0 };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 2) return { width: "33%", color: "#EF4444", text: "Weak", textColor: "#EF4444", score };
    if (score <= 3) return { width: "66%", color: "#F59E0B", text: "Medium", textColor: "#F59E0B", score };
    return { width: "100%", color: "#22C55E", text: "Strong", textColor: "#22C55E", score };
  };

  const strength = getPasswordStrength();

  const validateStep1 = () => {
    const errors = {};
    if (!form.firstName.trim() || form.firstName.trim().length < 2) errors.firstName = "Minimum 2 characters required";
    if (!form.lastName.trim() || form.lastName.trim().length < 2) errors.lastName = "Minimum 2 characters required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email)) errors.email = "Valid email required";
    if (!form.storeName.trim() || form.storeName.trim().length < 3) errors.storeName = "Store name must be at least 3 characters";
    if (storeNameStatus?.available === false) errors.storeName = "Store name is already taken";
    if (!form.businessType) errors.businessType = "Business type required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!form.panNumber.trim() || !panRegex.test(form.panNumber.trim().toUpperCase())) errors.panNumber = "Enter valid PAN (e.g. ABCDE1234F)";
    if (!documents.panDocument.url) errors.panDocument = "PAN card document is required";
    if (!form.gstNumber.trim() || form.gstNumber.trim().length !== 15) {
  errors.gstNumber = "Valid 15-character GST number is required";
} else if (gstValidation && !gstValidation.valid) {
  errors.gstNumber = gstValidation.message;
}

if (!documents.gstDocument.url) {
  errors.gstDocument = "GST certificate document is required";
}
    if (!form.bankDetails.accountHolderName.trim()) errors.accountHolderName = "Account holder name required";
    if (!form.bankDetails.bankName.trim()) errors.bankName = "Bank name required";
    if (!form.bankDetails.accountNumber.trim() || form.bankDetails.accountNumber.trim().length < 9) errors.accountNumber = "Valid account number required";
    if (form.bankDetails.accountNumber !== form.bankDetails.confirmAccountNumber) errors.confirmAccountNumber = "Account numbers do not match";
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!form.bankDetails.ifscCode.trim() || !ifscRegex.test(form.bankDetails.ifscCode.trim().toUpperCase())) errors.ifscCode = "Enter valid IFSC code (e.g. SBIN0001234)";
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
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!form.phone.trim() || !phoneRegex.test(form.phone.trim())) errors.phone = "Valid 10-digit Indian phone number required";
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

  const handleBack = () => {
    setFieldErrors({});
    setStep((s) => s - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;
    try {
      await vendorSignup({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        storeName: form.storeName.trim(),
        storeDescription: form.storeDescription.trim(),
        businessType: form.businessType,
        panNumber: form.panNumber.trim().toUpperCase(),
        panDocument: documents.panDocument,
        gstNumber: form.gstNumber.trim().toUpperCase(),
        gstDocument: documents.gstDocument,
        businessRegistrationDoc: documents.businessRegistrationDoc,
        cancelledCheque: documents.cancelledCheque,
        bankDetails: {
          accountHolderName: form.bankDetails.accountHolderName.trim(),
          bankName: form.bankDetails.bankName.trim(),
          accountNumber: form.bankDetails.accountNumber.trim(),
          ifscCode: form.bankDetails.ifscCode.trim().toUpperCase(),
          accountType: form.bankDetails.accountType,
        },
        businessAddress: {
          street: form.businessAddress.street.trim(),
          city: form.businessAddress.city.trim(),
          state: form.businessAddress.state,
          postalCode: form.businessAddress.postalCode.trim(),
        },
        agreementsAccepted: true,
      }).unwrap();
    } catch (err) {
      console.log(err);
    }
  };

  if (isSuccess) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px", background: "linear-gradient(135deg, #F0F4FF 0%, #F5F3FF 100%)" }}>
        <div style={{ maxWidth: 520, width: "100%", background: "white", borderRadius: 28, padding: "52px 44px", textAlign: "center", border: "1px solid #E5E7EB", boxShadow: "0 24px 80px rgba(0,0,0,0.1)" }}>
          <div style={{ width: 90, height: 90, background: "linear-gradient(135deg, #22C55E, #16A34A)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", boxShadow: "0 16px 40px rgba(34,197,94,0.35)" }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 99, padding: "4px 14px", marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }}></span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#16A34A" }}>Application Received</span>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "#111", marginBottom: 12, lineHeight: 1.2 }}>You're Almost There!</h2>
          <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.8, marginBottom: 28 }}>
            Your vendor application has been submitted. Our team will review within <strong style={{ color: "#111" }}>24–48 hours</strong>.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link to="/vendor/login" style={{ display: "block", background: "linear-gradient(135deg, #7C3AED, #6D28D9)", color: "white", textDecoration: "none", padding: "15px", borderRadius: 14, fontWeight: 800, fontSize: 15, boxSizing: "border-box", boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}>
              Go to Vendor Login
            </Link>
            <Link to="/" style={{ display: "block", background: "transparent", color: "#6B7280", textDecoration: "none", padding: "13px", borderRadius: 14, fontWeight: 600, fontSize: 14, border: "1px solid #E5E7EB", boxSizing: "border-box" }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stepLabels = ["Business Info", "Tax & Banking", "Security"];
  const stepIcons = ["🏪", "🏦", "🔒"];
  const stepDescriptions = ["Tell us about your business", "Tax documents & bank details", "Set up your password & agreements"];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #F0F4FF 0%, #F5F3FF 50%, #FFF5F0 100%)", padding: "32px 16px", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
      <style>{`
        .vs-input { width:100%; border:1.5px solid #E5E7EB; border-radius:12px; padding:11px 14px; font-size:14px; color:#111; background:#FAFAFA; outline:none; transition:all 0.15s; box-sizing:border-box; font-family:inherit; }
        .vs-input:focus { border-color:#7C3AED; background:white; box-shadow:0 0 0 4px rgba(124,58,237,0.08); }
        .vs-input::placeholder { color:#9CA3AF; }
        .vs-select { width:100%; border:1.5px solid #E5E7EB; border-radius:12px; padding:11px 14px; font-size:14px; color:#111; background:#FAFAFA; outline:none; cursor:pointer; box-sizing:border-box; font-family:inherit; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:36px; }
        .vs-select:focus { border-color:#7C3AED; background-color:white; box-shadow:0 0 0 4px rgba(124,58,237,0.08); }
        .fe { font-size:11px; color:#EF4444; margin-top:5px; font-weight:600; display:flex; align-items:center; gap:4px; }
        .fh { font-size:11px; color:#6B7280; margin-top:4px; display:block; }
        .sl { font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:0.1em; color:#7C3AED; margin-bottom:16px; padding-bottom:10px; border-bottom:2px solid #EDE9FE; display:flex; align-items:center; gap:8px; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .step-content { animation:fadeIn 0.25s ease both; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 1100, display: "grid", gridTemplateColumns: "300px 1fr", background: "white", borderRadius: 28, boxShadow: "0 24px 80px rgba(0,0,0,0.1)", border: "1px solid rgba(255,255,255,0.8)", overflow: "hidden" }}>

        <div style={{ background: "linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #1e1b4b 100%)", padding: "44px 32px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, background: "rgba(124,58,237,0.15)", borderRadius: "50%", filter: "blur(60px)" }}></div>
          <div style={{ position: "absolute", bottom: -60, left: -60, width: 220, height: 220, background: "rgba(216,90,48,0.1)", borderRadius: "50%", filter: "blur(50px)" }}></div>

          <div style={{ position: "relative", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
              <div style={{ width: 42, height: 42, background: "linear-gradient(135deg, #7C3AED, #6D28D9)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(124,58,237,0.4)", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 900, color: "white", margin: 0 }}>E-Commerce</p>
                <p style={{ fontSize: 11, color: "#6366F1", margin: 0, fontWeight: 600 }}>Vendor Portal</p>
              </div>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 900, color: "white", marginBottom: 6, lineHeight: 1.3 }}>Start Selling Today</h2>
            <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, marginBottom: 32 }}>Join thousands of verified sellers.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
              {stepLabels.map((label, i) => {
                const isDone = step > i + 1;
                const isActive = step === i + 1;
                return (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: isActive ? "rgba(124,58,237,0.25)" : isDone ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)", border: isActive ? "1px solid rgba(124,58,237,0.5)" : isDone ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.06)", borderRadius: 14, transition: "all 0.25s" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: isDone ? "#22C55E" : isActive ? "#7C3AED" : "rgba(255,255,255,0.06)", flexShrink: 0, boxShadow: isDone ? "0 4px 12px rgba(34,197,94,0.3)" : isActive ? "0 4px 12px rgba(124,58,237,0.4)" : "none" }}>
                      {isDone ? <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" /></svg> : <span style={{ fontSize: isActive ? "14px" : "13px", fontWeight: 900, color: isActive ? "white" : "#475569" }}>{stepIcons[i]}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: isActive ? 800 : 500, color: isActive ? "white" : isDone ? "#86EFAC" : "#64748B", margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 11, color: isActive ? "#C4B5FD" : "#475569", margin: 0, marginTop: 1 }}>{stepDescriptions[i]}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px" }}>
              <p style={{ fontSize: 10, fontWeight: 900, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <span>🔍</span> Auto-Verification
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { icon: "🏪", text: "Store Name", status: storeNameStatus?.available === true ? "✅" : storeNameStatus?.available === false ? "❌" : "⏳" },
{ icon: "📄", text: "GST Validation", status: gstValidation?.valid ? "✅" : gstValidation && !gstValidation.valid ? "❌" : "⏳" },
{ icon: "🏦", text: "IFSC → Bank", status: ifscVerified?.success ? "✅" : ifscVerified && !ifscVerified.success ? "❌" : "⏳" },
{ icon: "📍", text: "PIN → Address", status: pinVerified?.success ? "✅" : pinVerified && !pinVerified.success ? "❌" : "⏳" },
                ].map((item) => (
                  <div key={item.text} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13 }}>{item.icon}</span>
                      <span style={{ fontSize: 11, color: "#64748B" }}>{item.text}</span>
                    </div>
                    <span style={{ fontSize: 11 }}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6, marginTop: 24 }}>
            {[
              { icon: "🛡️", text: "256-bit SSL encryption" },
              { icon: "⚡", text: "Approval within 24-48 hours" },
              { icon: "💰", text: "Commission from just 6%" },
            ].map((item) => (
              <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span style={{ fontSize: 11, color: "#64748B" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "44px 48px", overflowY: "auto", maxHeight: "94vh" }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: "#111", margin: 0 }}>Vendor Registration</h1>
                <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>Step {step} of 3 — {stepLabels[step - 1]}</p>
              </div>
              <div style={{ width: 48, height: 48, background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: "1px solid #DDD6FE" }}>
                {stepIcons[step - 1]}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
              {[1, 2, 3].map((s) => (
                <div key={s} style={{ flex: 1, height: 6, borderRadius: 99, background: step >= s ? "linear-gradient(90deg, #7C3AED, #6D28D9)" : "#F3F4F6", transition: "all 0.4s", boxShadow: step >= s ? "0 2px 8px rgba(124,58,237,0.3)" : "none" }}></div>
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="step-content" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="sl"><span>👤</span> Personal Information</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <Label required>First Name</Label>
                  <input name="firstName" placeholder="John" value={form.firstName} onChange={handleChange} className="vs-input" />
                  {fieldErrors.firstName && <span className="fe"><span>⚠</span>{fieldErrors.firstName}</span>}
                </div>
                <div>
                  <Label required>Last Name</Label>
                  <input name="lastName" placeholder="Doe" value={form.lastName} onChange={handleChange} className="vs-input" />
                  {fieldErrors.lastName && <span className="fe"><span>⚠</span>{fieldErrors.lastName}</span>}
                </div>
              </div>

              <div>
                <Label required>Email Address</Label>
                <input name="email" type="email" placeholder="business@example.com" value={form.email} onChange={handleChange} className="vs-input" autoComplete="username" />
                {fieldErrors.email && <span className="fe"><span>⚠</span>{fieldErrors.email}</span>}
              </div>

              <div style={{ height: 1, background: "linear-gradient(90deg, #EDE9FE, transparent)", margin: "4px 0" }}></div>
              <div className="sl"><span>🏪</span> Business Information</div>

              <div>
                <Label required>Business Type</Label>
                <select name="businessType" value={form.businessType} onChange={handleChange} className="vs-select">
                  {BUSINESS_TYPES.map((bt) => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                </select>
                {fieldErrors.businessType && <span className="fe"><span>⚠</span>{fieldErrors.businessType}</span>}
              </div>

              <div>
                <Label required>Store / Business Name</Label>
                <div style={{ position: "relative" }}>
                  <input name="storeName" placeholder="My Awesome Store" value={form.storeName} onChange={handleStoreNameChange} className="vs-input" style={{ paddingRight: 44 }} />
                  {storeNameChecking && <InputSpinner />}
                  {!storeNameChecking && storeNameStatus?.available === true && <InputCheck />}
                  {!storeNameChecking && storeNameStatus?.available === false && <InputCross />}
                </div>
                {storeNameStatus?.available === true && <VerifiedBadge text="Store name is available" />}
                {storeNameStatus?.available === false && <span style={{ fontSize: 11, color: "#EF4444", marginTop: 4, display: "block", fontWeight: 600 }}>⚠️ Store name is already taken</span>}
                {fieldErrors.storeName && <span className="fe"><span>⚠</span>{fieldErrors.storeName}</span>}
                <span className="fh">Displayed to customers on all your products</span>
              </div>

              <div>
                <Label>Store Description</Label>
                <textarea name="storeDescription" placeholder="Tell customers what makes your store special..." value={form.storeDescription} onChange={handleChange} rows={3} className="vs-input" style={{ resize: "none" }} />
                <span className="fh">Optional — helps customers understand your brand</span>
              </div>

              <div style={{ marginTop: 8 }}>
                <button type="button" onClick={handleNext} style={{ width: "100%", background: "linear-gradient(135deg, #7C3AED, #6D28D9)", color: "white", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 24px rgba(124,58,237,0.3)", fontFamily: "inherit" }}>
                  Continue to Tax & Banking →
                </button>
              </div>

              <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", margin: 0 }}>
                Already registered? <Link to="/vendor/login" style={{ color: "#7C3AED", fontWeight: 800, textDecoration: "none" }}>Login to Dashboard</Link>
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="step-content" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="sl"><span>📋</span> Tax Information & Documents</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <Label required>PAN Number</Label>
                  <input name="panNumber" placeholder="ABCDE1234F" value={form.panNumber} onChange={(e) => { setFieldErrors((p) => ({ ...p, panNumber: "" })); setForm((p) => ({ ...p, panNumber: e.target.value.toUpperCase() })); }} maxLength={10} className="vs-input" style={{ fontFamily: "monospace", letterSpacing: "0.08em", fontWeight: 600 }} />
                  {fieldErrors.panNumber && <span className="fe"><span>⚠</span>{fieldErrors.panNumber}</span>}
                </div>
                <div>
  <Label required>GST Number</Label>
  <div style={{ position: "relative" }}>
    <input name="gstNumber" placeholder="22AAAAA0000A1Z5" value={form.gstNumber} onChange={(e) => handleGSTChange(e.target.value)} maxLength={15} className="vs-input" style={{ fontFamily: "monospace", letterSpacing: "0.04em", paddingRight: 44 }} />
    {form.gstNumber.length === 15 && gstValidation?.valid && <InputCheck />}
    {form.gstNumber.length === 15 && gstValidation && !gstValidation.valid && <InputCross />}
  </div>
  {gstValidation?.valid && (
    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <VerifiedBadge text="GST format verified" />
      {form.panNumber && (
        <span style={{ fontSize: 10, color: "#16A34A", fontWeight: 600, background: "#F0FDF4", border: "1px solid #86EFAC", padding: "2px 8px", borderRadius: 99 }}>
          PAN Match ✓
        </span>
      )}
    </div>
  )}
  {gstValidation && !gstValidation.valid && (
    <span style={{ fontSize: 11, color: "#EF4444", marginTop: 4, display: "block", fontWeight: 600 }}>
      ⚠️ {gstValidation.message}
    </span>
  )}
  {fieldErrors.gstNumber && <span className="fe"><span>⚠</span>{fieldErrors.gstNumber}</span>}
  <span className="fh">15-character GST identification number</span>
</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <DocumentUploader label="PAN Card" required hint="Front side (JPG/PNG/PDF, max 5MB)" value={documents.panDocument} onChange={handleDocumentChange} docKey="panDocument" />
                  {fieldErrors.panDocument && <span className="fe"><span>⚠</span>{fieldErrors.panDocument}</span>}
                </div>
                <div>
                  <DocumentUploader label="GST Certificate" required hint="Upload GST registration certificate (JPG/PNG/PDF, max 5MB)" value={documents.gstDocument} onChange={handleDocumentChange} docKey="gstDocument" />
{fieldErrors.gstDocument && <span className="fe"><span>⚠</span>{fieldErrors.gstDocument}</span>}
                </div>
              </div>

              <DocumentUploader label="Business Registration Document" hint="Partnership deed / Certificate (optional)" value={documents.businessRegistrationDoc} onChange={handleDocumentChange} docKey="businessRegistrationDoc" />

              <div style={{ height: 1, background: "linear-gradient(90deg, #EDE9FE, transparent)", margin: "4px 0" }}></div>
              <div className="sl"><span>🏦</span> Bank Account Details</div>

              <div>
                <Label required>Account Holder Name</Label>
                <input name="accountHolderName" placeholder="Exactly as per bank records" value={form.bankDetails.accountHolderName} onChange={(e) => handleNestedChange("bankDetails", e)} className="vs-input" />
                {fieldErrors.accountHolderName && <span className="fe"><span>⚠</span>{fieldErrors.accountHolderName}</span>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <Label required>Bank Name</Label>
                  <input name="bankName" placeholder={ifscVerified?.success ? ifscVerified.bankName : "State Bank of India"} value={form.bankDetails.bankName} onChange={(e) => handleNestedChange("bankDetails", e)} className="vs-input" readOnly={ifscVerified?.success} style={{ background: ifscVerified?.success ? "#F0FDF4" : "#FAFAFA", borderColor: ifscVerified?.success ? "#86EFAC" : "#E5E7EB", color: ifscVerified?.success ? "#166534" : "#111", fontWeight: ifscVerified?.success ? 700 : 400, cursor: ifscVerified?.success ? "not-allowed" : "text" }} />
                  {ifscVerified?.success && <VerifiedBadge text="Auto-filled from IFSC" />}
                  {fieldErrors.bankName && <span className="fe"><span>⚠</span>{fieldErrors.bankName}</span>}
                </div>
                <div>
                  <Label required>Account Type</Label>
                  <select name="accountType" value={form.bankDetails.accountType} onChange={(e) => handleNestedChange("bankDetails", e)} className="vs-select">
                    <option value="savings">Savings Account</option>
                    <option value="current">Current Account</option>
                  </select>
                </div>
              </div>

              <div>
                <Label required>Account Number</Label>
                <input name="accountNumber" type="password" placeholder="Enter your account number" value={form.bankDetails.accountNumber} onChange={(e) => handleNestedChange("bankDetails", e)} className="vs-input" autoComplete="off" />
                {fieldErrors.accountNumber && <span className="fe"><span>⚠</span>{fieldErrors.accountNumber}</span>}
              </div>

              <div>
                <Label required>Confirm Account Number</Label>
                <input name="confirmAccountNumber" placeholder="Re-enter account number" value={form.bankDetails.confirmAccountNumber} onChange={(e) => handleNestedChange("bankDetails", e)} className="vs-input" autoComplete="off" />
                {form.bankDetails.confirmAccountNumber && form.bankDetails.accountNumber === form.bankDetails.confirmAccountNumber && <VerifiedBadge text="Account numbers match" />}
                {fieldErrors.confirmAccountNumber && <span className="fe"><span>⚠</span>{fieldErrors.confirmAccountNumber}</span>}
              </div>

              <div>
                <Label required>IFSC Code</Label>
                <div style={{ position: "relative" }}>
                  <input name="ifscCode" placeholder="SBIN0001234" value={form.bankDetails.ifscCode} onChange={(e) => handleIFSCChange(e.target.value)} maxLength={11} className="vs-input" style={{ fontFamily: "monospace", letterSpacing: "0.06em", fontWeight: 600, paddingRight: 44 }} />
                  {ifscVerifying && <InputSpinner />}
                  {!ifscVerifying && ifscVerified?.success && <InputCheck />}
                  {!ifscVerifying && ifscVerified && !ifscVerified.success && <InputCross />}
                </div>
                {ifscVerified?.success && (
                  <div style={{ marginTop: 8, background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <svg width="14" height="14" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" /></svg>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#16A34A" }}>IFSC Verified</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      <div><p style={{ fontSize: 10, color: "#6B7280", margin: 0, textTransform: "uppercase", fontWeight: 700 }}>Bank</p><p style={{ fontSize: 12, color: "#111", margin: "2px 0 0", fontWeight: 600 }}>{ifscVerified.bankName}</p></div>
                      <div><p style={{ fontSize: 10, color: "#6B7280", margin: 0, textTransform: "uppercase", fontWeight: 700 }}>Branch</p><p style={{ fontSize: 12, color: "#111", margin: "2px 0 0", fontWeight: 600 }}>{ifscVerified.branch}</p></div>
                    </div>
                  </div>
                )}
                {ifscVerified && !ifscVerified.success && <span style={{ fontSize: 11, color: "#EF4444", marginTop: 4, display: "block", fontWeight: 600 }}>⚠️ {ifscVerified.message}</span>}
                {fieldErrors.ifscCode && <span className="fe"><span>⚠</span>{fieldErrors.ifscCode}</span>}
              </div>

              <DocumentUploader label="Cancelled Cheque / Bank Passbook" required hint="First page of passbook or cancelled cheque (JPG/PNG/PDF)" value={documents.cancelledCheque} onChange={handleDocumentChange} docKey="cancelledCheque" />
              {fieldErrors.cancelledCheque && <span className="fe"><span>⚠</span>{fieldErrors.cancelledCheque}</span>}

              <div style={{ height: 1, background: "linear-gradient(90deg, #EDE9FE, transparent)", margin: "4px 0" }}></div>
              <div className="sl"><span>📍</span> Business Address</div>

              <div>
                <Label required>Street Address</Label>
                <input name="street" placeholder="Shop No, Building, Street, Area" value={form.businessAddress.street} onChange={(e) => handleNestedChange("businessAddress", e)} className="vs-input" />
                {fieldErrors.street && <span className="fe"><span>⚠</span>{fieldErrors.street}</span>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <Label required>City</Label>
                  <input name="city" placeholder={pinVerified?.success ? pinVerified.city : "Mumbai"} value={form.businessAddress.city} onChange={(e) => handleNestedChange("businessAddress", e)} className="vs-input" readOnly={pinVerified?.success} style={{ background: pinVerified?.success ? "#F0FDF4" : "#FAFAFA", borderColor: pinVerified?.success ? "#86EFAC" : "#E5E7EB", color: pinVerified?.success ? "#166534" : "#111", fontWeight: pinVerified?.success ? 700 : 400, cursor: pinVerified?.success ? "not-allowed" : "text" }} />
                  {pinVerified?.success && <VerifiedBadge text="Auto-filled from PIN" />}
                  {fieldErrors.city && <span className="fe"><span>⚠</span>{fieldErrors.city}</span>}
                </div>
                <div>
                  <Label required>PIN Code</Label>
                  <div style={{ position: "relative" }}>
                    <input name="postalCode" placeholder="400001" value={form.businessAddress.postalCode} onChange={(e) => handlePinCodeChange(e.target.value)} maxLength={6} className="vs-input" style={{ fontFamily: "monospace", letterSpacing: "0.1em", fontWeight: 600, paddingRight: 44 }} />
                    {pinVerifying && <InputSpinner />}
                    {!pinVerifying && pinVerified?.success && <InputCheck />}
                    {!pinVerifying && pinVerified && !pinVerified.success && <InputCross />}
                  </div>
                  {pinVerified?.success && (
                    <div style={{ marginTop: 8, background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="12" height="12" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" /></svg>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A" }}>PIN Verified — {pinVerified.area && `${pinVerified.area}, `}{pinVerified.city}, {pinVerified.state}</span>
                    </div>
                  )}
                  {pinVerified && !pinVerified.success && <span style={{ fontSize: 11, color: "#EF4444", marginTop: 4, display: "block", fontWeight: 600 }}>⚠️ {pinVerified.message}</span>}
                  {fieldErrors.postalCode && <span className="fe"><span>⚠</span>{fieldErrors.postalCode}</span>}
                </div>
              </div>

              <div>
                <Label required>State</Label>
                {pinVerified?.success ? (
                  <input value={form.businessAddress.state} readOnly className="vs-input" style={{ background: "#F0FDF4", borderColor: "#86EFAC", color: "#166534", fontWeight: 700, cursor: "not-allowed" }} />
                ) : (
                  <select name="state" value={form.businessAddress.state} onChange={(e) => handleNestedChange("businessAddress", e)} className="vs-select">
                    <option value="">Select your state</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
                {pinVerified?.success && <VerifiedBadge text="Auto-filled from PIN" />}
                {fieldErrors.state && <span className="fe"><span>⚠</span>{fieldErrors.state}</span>}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="button" onClick={handleBack} style={{ flex: 1, background: "white", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
                <button type="button" onClick={handleNext} style={{ flex: 2, background: "linear-gradient(135deg, #7C3AED, #6D28D9)", color: "white", border: "none", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 24px rgba(124,58,237,0.3)", fontFamily: "inherit" }}>Continue to Security →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form className="step-content" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="sl"><span>📱</span> Contact Details</div>

              <div>
                <Label required>Phone Number</Label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#374151" }}>+91</span>
                    <div style={{ width: 1, height: 18, background: "#E5E7EB" }}></div>
                  </div>
                  <input name="phone" placeholder="9876543210" value={form.phone} onChange={handleChange} className="vs-input" style={{ paddingLeft: 58 }} maxLength={10} />
                </div>
                {fieldErrors.phone && <span className="fe"><span>⚠</span>{fieldErrors.phone}</span>}
              </div>

              <div style={{ height: 1, background: "linear-gradient(90deg, #EDE9FE, transparent)", margin: "4px 0" }}></div>
              <div className="sl"><span>🔐</span> Create Password</div>

              <div>
                <Label required>Password</Label>
                <div style={{ position: "relative" }}>
                  <input name="password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={form.password} onChange={handleChange} className="vs-input" style={{ paddingRight: 48 }} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: 4 }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" /></svg>
                  </button>
                </div>
                {form.password && (
                  <div style={{ marginTop: 10, padding: "12px 14px", background: "#F9FAFB", borderRadius: 10, border: "1px solid #E5E7EB" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ flex: 1, height: 6, background: "#E5E7EB", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: strength.width, height: "100%", background: strength.color, borderRadius: 99, transition: "all 0.4s" }}></div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: strength.textColor, minWidth: 46, textAlign: "right" }}>{strength.text}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
                      {[
                        { check: form.password.length >= 6, label: "6+ characters" },
                        { check: /[A-Z]/.test(form.password), label: "Uppercase" },
                        { check: /[0-9]/.test(form.password), label: "Number" },
                        { check: /[^A-Za-z0-9]/.test(form.password), label: "Special char" },
                      ].map((item) => (
                        <span key={item.label} style={{ fontSize: 11, color: item.check ? "#22C55E" : "#9CA3AF", fontWeight: item.check ? 600 : 400, display: "flex", alignItems: "center", gap: 4 }}>
                          {item.check ? <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" /></svg> : <span style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid #D1D5DB", display: "inline-block" }}></span>}
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {fieldErrors.password && <span className="fe"><span>⚠</span>{fieldErrors.password}</span>}
              </div>

              <div>
                <Label required>Confirm Password</Label>
                <div style={{ position: "relative" }}>
                  <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter your password" value={form.confirmPassword} onChange={handleChange} className="vs-input" style={{ paddingRight: 48 }} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: 4 }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" /></svg>
                  </button>
                </div>
                {form.confirmPassword && form.password === form.confirmPassword && <VerifiedBadge text="Passwords match" />}
                {fieldErrors.confirmPassword && <span className="fe"><span>⚠</span>{fieldErrors.confirmPassword}</span>}
              </div>

              <div style={{ height: 1, background: "linear-gradient(90deg, #EDE9FE, transparent)", margin: "4px 0" }}></div>
              <div className="sl"><span>✅</span> Agreements</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: "#FAFAFA", border: `1px solid ${fieldErrors.agreeTerms ? "#FECACA" : "#E5E7EB"}`, borderRadius: 14, padding: "14px 16px" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                    <input type="checkbox" name="agreeTerms" checked={form.agreeTerms} onChange={handleChange} style={{ width: 18, height: 18, marginTop: 1, cursor: "pointer", accentColor: "#7C3AED", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                      I agree to the <Link to="/policy/terms" style={{ color: "#7C3AED", fontWeight: 700, textDecoration: "none" }} target="_blank">Terms</Link> and <Link to="/policy/privacy" style={{ color: "#7C3AED", fontWeight: 700, textDecoration: "none" }} target="_blank">Privacy Policy</Link>
                    </span>
                  </label>
                  {fieldErrors.agreeTerms && <span className="fe" style={{ marginLeft: 30, marginTop: 6 }}><span>⚠</span>{fieldErrors.agreeTerms}</span>}
                </div>

                <div style={{ background: "#FAFAFA", border: `1px solid ${fieldErrors.agreeVendorPolicy ? "#FECACA" : "#E5E7EB"}`, borderRadius: 14, padding: "14px 16px" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                    <input type="checkbox" name="agreeVendorPolicy" checked={form.agreeVendorPolicy} onChange={handleChange} style={{ width: 18, height: 18, marginTop: 1, cursor: "pointer", accentColor: "#7C3AED", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                      I agree to the <Link to="/policy/vendor-agreement" style={{ color: "#7C3AED", fontWeight: 700, textDecoration: "none" }} target="_blank">Vendor Agreement</Link>, <Link to="/policy/commission-policy" style={{ color: "#7C3AED", fontWeight: 700, textDecoration: "none" }} target="_blank">Commission</Link> and <Link to="/policy/vendor-privacy" style={{ color: "#7C3AED", fontWeight: 700, textDecoration: "none" }} target="_blank">Vendor Privacy</Link>
                    </span>
                  </label>
                  {fieldErrors.agreeVendorPolicy && <span className="fe" style={{ marginLeft: 30, marginTop: 6 }}><span>⚠</span>{fieldErrors.agreeVendorPolicy}</span>}
                </div>
              </div>

              {error && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>❌</span>
                  <p style={{ fontSize: 13, color: "#DC2626", margin: 0, fontWeight: 500 }}>{error?.data?.message || "Something went wrong."}</p>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="button" onClick={handleBack} style={{ flex: 1, background: "white", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
                <button type="submit" disabled={isLoading} style={{ flex: 2, background: isLoading ? "#A78BFA" : "linear-gradient(135deg, #7C3AED, #6D28D9)", color: "white", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 800, cursor: isLoading ? "not-allowed" : "pointer", boxShadow: isLoading ? "none" : "0 8px 24px rgba(124,58,237,0.35)", fontFamily: "inherit" }}>
                  {isLoading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }}></span>
                      Submitting...
                    </span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      Submit Application
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" /></svg>
                    </span>
                  )}
                </button>
              </div>

              <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", margin: 0, lineHeight: 1.6 }}>
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