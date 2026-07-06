import { useState } from "react";
import { useDispatch } from "react-redux";
import { setVerifiedUser } from "../features/auth/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { API_URL } from "../utils/apiConfig";
import {
  useGetVendorProfileQuery,
  useUpdateVendorProfileMutation,
  useUpdateVendorStoreMutation,
  useChangeVendorPasswordMutation,
} from "../features/auth/authApi";
import { toast } from "../components/Toast";

const INDIAN_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh"];

const Lbl = ({ children, required }) => (
  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-[0.05em] mb-1.5">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const Input = ({ className = "", ...props }) => (
  <input className={`w-full border-[1.5px] border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 bg-gray-50 outline-none focus:border-[#4f46e5] focus:bg-white focus:ring-2 focus:ring-[#4f46e5]/10 transition-all font-[inherit] box-border ${className}`} {...props} />
);

const Alert = ({ type, text }) => (
  <div className={`flex items-center gap-2 px-3.5 py-3 rounded-xl text-sm font-semibold mb-4 ${type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"}`}>
    {type === "success" ? "✅" : "❌"} {text}
  </div>
);

const SectionHeader = ({ title, subtitle }) => (
  <div className="px-5 sm:px-7 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
    <h2 className="text-lg font-black text-gray-900 m-0">{title}</h2>
    {subtitle && <p className="text-[13px] text-gray-500 mt-0.5 m-0">{subtitle}</p>}
  </div>
);

const VendorProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data: profileData, isLoading } = useGetVendorProfileQuery();
  const [updateProfile, { isLoading: updatingProfile }] = useUpdateVendorProfileMutation();
  const [updateStore, { isLoading: updatingStore }] = useUpdateVendorStoreMutation();
  const [changePassword, { isLoading: changingPassword }] = useChangeVendorPasswordMutation();

  const user = profileData?.data?.user;
  const vendor = profileData?.data?.vendor;

  const [activeSection, setActiveSection] = useState("personal");
  const [profileForm, setProfileForm] = useState(null);
  const [storeForm, setStoreForm] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [storeMsg, setStoreMsg] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [storeError, setStoreError] = useState("");

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordError, setPasswordError] = useState("");

  const currentProfile = profileForm || {
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
    avatar: user?.avatar || "",
  };

  const currentStore = storeForm || {
    storeName: vendor?.storeName || "",
    storeDescription: vendor?.storeDescription || "",
    storeLogo: vendor?.storeLogo || "",
    bankDetails: {
      accountHolderName: vendor?.bankDetails?.accountHolderName || "",
      bankName: vendor?.bankDetails?.bankName || "",
      accountNumber: vendor?.bankDetails?.accountNumber || "",
      ifscCode: vendor?.bankDetails?.ifscCode || "",
      accountType: vendor?.bankDetails?.accountType || "savings",
    },
    businessAddress: {
      street: vendor?.businessAddress?.street || "",
      city: vendor?.businessAddress?.city || "",
      state: vendor?.businessAddress?.state || "",
      postalCode: vendor?.businessAddress?.postalCode || "",
    },
  };

  const getPasswordStrength = () => {
    const p = passwordForm.newPassword;
    if (!p) return { width: "w-0", color: "bg-gray-200", text: "", textColor: "text-gray-400" };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 2) return { width: "w-1/3", color: "bg-red-500", text: "Weak", textColor: "text-red-500" };
    if (score <= 3) return { width: "w-2/3", color: "bg-yellow-400", text: "Medium", textColor: "text-yellow-500" };
    return { width: "w-full", color: "bg-green-500", text: "Strong", textColor: "text-green-500" };
  };
  const strength = getPasswordStrength();

  const uploadImage = async (file, type = "avatar") => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${API_URL}/upload/avatar`, {

      method: "POST", headers: { authorization: `Bearer ${token}` }, body: formData,
    });
    return await res.json();
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg","image/jpg","image/png","image/webp"].includes(file.type)) {
      setProfileError("Only JPG, PNG, WebP allowed"); return;
    }
    if (file.size > 5 * 1024 * 1024) { setProfileError("Image must be under 5MB"); return; }
    setAvatarUploading(true); setProfileError("");
    try {
      const data = await uploadImage(file);
      if (data.success) {
        setProfileForm((prev) => ({ ...(prev || currentProfile), avatar: data.data.url }));
        setProfileMsg({ type: "success", text: "Avatar uploaded! Click Save to apply." });
      } else setProfileError(data.message || "Upload failed");
    } catch { setProfileError("Upload failed"); }
    finally { setAvatarUploading(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setStoreError("Image must be under 5MB"); return; }
    setLogoUploading(true); setStoreError("");
    try {
      const data = await uploadImage(file);
      if (data.success) {
        setStoreForm((prev) => ({ ...(prev || currentStore), storeLogo: data.data.url }));
        setStoreMsg({ type: "success", text: "Logo uploaded! Click Save to apply." });
      } else setStoreError(data.message || "Upload failed");
    } catch { setStoreError("Upload failed"); }
    finally { setLogoUploading(false); }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault(); setProfileMsg(null); setProfileError("");
    if (!currentProfile.firstName.trim()) { setProfileError("First name required"); return; }
    try {
      const res = await updateProfile({
        firstName: currentProfile.firstName.trim(),
        lastName: currentProfile.lastName.trim(),
        phone: currentProfile.phone.trim(),
        dateOfBirth: currentProfile.dateOfBirth || null,
        avatar: currentProfile.avatar,
      }).unwrap();
      dispatch(setVerifiedUser(res.data));
      toast.success("Profile updated!");
      setProfileMsg({ type: "success", text: "Profile updated successfully" });
      setProfileForm(null);
    } catch (err) { setProfileError(err?.data?.message || "Failed"); }
  };

  const handleStoreSubmit = async (e) => {
    e.preventDefault(); setStoreMsg(null); setStoreError("");
    if (!currentStore.storeName.trim() || currentStore.storeName.trim().length < 3) {
      setStoreError("Store name must be at least 3 characters"); return;
    }
    try {
      await updateStore(currentStore).unwrap();
      toast.success("Store updated!");
      setStoreMsg({ type: "success", text: "Store details updated successfully" });
      setStoreForm(null);
    } catch (err) { setStoreError(err?.data?.message || "Failed"); }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault(); setPasswordMsg(null); setPasswordError("");
    if (!passwordForm.currentPassword) { setPasswordError("Current password required"); return; }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) { setPasswordError("Min 6 characters"); return; }
    if (!/[A-Z]/.test(passwordForm.newPassword)) { setPasswordError("Need 1 uppercase letter"); return; }
    if (!/[0-9]/.test(passwordForm.newPassword)) { setPasswordError("Need 1 number"); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setPasswordError("Passwords don't match"); return; }
    try {
      await changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }).unwrap();
      toast.success("Password changed!");
      setPasswordMsg({ type: "success", text: "Password changed successfully" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) { setPasswordError(err?.data?.message || "Failed"); }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-9 h-9 border-[3px] border-[#4f46e5] border-t-transparent rounded-full animate-spin mx-auto mb-3.5" />
          <p className="text-gray-500 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { key: "personal", icon: "👤", label: "Personal Info" },
    { key: "store", icon: "🏪", label: "Store Details" },
    { key: "bank", icon: "🏦", label: "Bank & Address" },
    { key: "password", icon: "🔐", label: "Password" },
  ];

  const EyeIcon = ({ open }) => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      {open ? (
        <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" /><path d="M1 1l22 22" strokeLinecap="round" /></>
      ) : (
        <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
      )}
    </svg>
  );

  return (
    <div className="bg-gray-100 min-h-screen py-5 sm:py-7 px-3 sm:px-4">
      <div className="max-w-[1000px] mx-auto">

        <Link to="/vendor/dashboard" className="inline-flex items-center gap-1.5 text-gray-500 text-[13px] font-semibold no-underline mb-5 hover:text-gray-700 transition">
          ← Back to Dashboard
        </Link>

        <div className="flex flex-col xl:grid xl:grid-cols-[260px_1fr] gap-4 items-start">

          <div className="flex flex-col gap-3 xl:sticky xl:top-20 w-full">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center shadow-sm">
              <div className="relative w-[86px] h-[86px] mx-auto mb-3.5">
                <div className="w-[86px] h-[86px] rounded-full bg-gradient-to-br from-[#4338ca] to-[#6366f1] flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                  {currentProfile.avatar ? (
                    <img src={currentProfile.avatar} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                  ) : (
                    <span className="text-[34px] font-black text-white">{user?.firstName?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center cursor-pointer border-[2.5px] border-white shadow-md">
                  {avatarUploading ? (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" /></svg>
                  )}
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
              <p className="text-base font-black text-gray-900 m-0">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500 mt-0.5 mb-2.5">{user?.email}</p>
              <span className="text-[11px] bg-indigo-100 text-[#4f46e5] px-3 py-1 rounded-full font-extrabold">
                🏪 Vendor
              </span>
              {vendor?.approvalStatus === "approved" && (
                <div className="mt-2">
                  <span className="text-[10px] bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full font-bold">✓ Approved Store</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-2.5 shadow-sm">
              {navItems.map((item) => {
                const active = activeSection === item.key;
                return (
                  <button key={item.key} onClick={() => setActiveSection(item.key)}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-none cursor-pointer text-left font-[inherit] transition-all ${active ? "bg-indigo-50 text-[#4f46e5]" : "bg-transparent text-gray-700 hover:bg-gray-100"}`}>
                    <span className="text-lg w-6 text-center">{item.icon}</span>
                    <span className={`text-sm flex-1 ${active ? "font-extrabold" : "font-medium"}`}>{item.label}</span>
                    {active && <span className="text-[#4f46e5] text-sm">→</span>}
                  </button>
                );
              })}
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-indigo-800 m-0">💡 Quick Info</p>
              <p className="text-xs text-indigo-700 mt-1.5 m-0 leading-relaxed">
                Commission: <strong>{vendor?.commission || 10}%</strong><br />
                Member since {vendor?.createdAt ? new Date(vendor.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>

          <div className="w-full">

            {activeSection === "personal" && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <SectionHeader title="Personal Information" subtitle="Update your personal details and avatar" />
                <form onSubmit={handleProfileSubmit} className="p-5 sm:p-7">
                  {profileMsg && <Alert type={profileMsg.type} text={profileMsg.text} />}
                  {profileError && <Alert type="error" text={profileError} />}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Lbl required>First Name</Lbl>
                      <Input placeholder="John" value={currentProfile.firstName} onChange={(e) => setProfileForm({ ...currentProfile, firstName: e.target.value })} />
                    </div>
                    <div>
                      <Lbl>Last Name</Lbl>
                      <Input placeholder="Doe" value={currentProfile.lastName} onChange={(e) => setProfileForm({ ...currentProfile, lastName: e.target.value })} />
                    </div>
                  </div>

                  <div className="mb-4">
                    <Lbl>Email Address</Lbl>
                    <div className="flex items-center gap-2.5 w-full border-[1.5px] border-gray-200 rounded-xl px-3.5 py-3 bg-gray-100 text-gray-400 cursor-not-allowed text-sm">
                      <svg width="16" height="16" fill="none" stroke="#9CA3AF" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" /></svg>
                      <span className="flex-1">{user?.email}</span>
                      <span className="text-[11px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Cannot change</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Lbl>Phone Number</Lbl>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                          <span className="text-xs font-extrabold text-gray-700">+91</span>
                          <div className="w-px h-4 bg-gray-300" />
                        </div>
                        <Input className="pl-[54px]" placeholder="9876543210" value={currentProfile.phone} onChange={(e) => setProfileForm({ ...currentProfile, phone: e.target.value })} maxLength={10} />
                      </div>
                    </div>
                    <div>
                      <Lbl>Date of Birth</Lbl>
                      <Input type="date" value={currentProfile.dateOfBirth} onChange={(e) => setProfileForm({ ...currentProfile, dateOfBirth: e.target.value })} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button type="submit" disabled={updatingProfile} className={`flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-extrabold text-white border-none cursor-pointer transition-all font-[inherit] ${updatingProfile ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-[#4338ca] to-[#6366f1] shadow-lg shadow-indigo-200 hover:brightness-110"}`}>
                      {updatingProfile && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      {updatingProfile ? "Saving..." : "Save Changes"}
                    </button>
                    {profileForm && (
                      <button type="button" onClick={() => { setProfileForm(null); setProfileMsg(null); setProfileError(""); }} className="px-5 py-3 rounded-xl text-sm font-bold text-gray-700 bg-white border-[1.5px] border-gray-200 cursor-pointer hover:bg-gray-50 transition font-[inherit]">
                        Discard
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {activeSection === "store" && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <SectionHeader title="Store Details" subtitle="Manage your store information and branding" />
                <form onSubmit={handleStoreSubmit} className="p-5 sm:p-7">
                  {storeMsg && <Alert type={storeMsg.type} text={storeMsg.text} />}
                  {storeError && <Alert type="error" text={storeError} />}

                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 border-[2.5px] border-white shadow-md flex items-center justify-center overflow-hidden">
                      {currentStore.storeLogo ? (
                        <img src={currentStore.storeLogo} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                      ) : (
                        <span className="text-3xl">🏪</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 m-0">Store Logo</p>
                      <p className="text-xs text-gray-500 mt-0.5 mb-2">PNG, JPG up to 5MB</p>
                      <label className="inline-flex items-center gap-2 bg-indigo-50 text-[#4f46e5] border border-indigo-200 rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer hover:bg-indigo-100 transition">
                        {logoUploading ? "Uploading..." : "📤 Upload Logo"}
                        <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleLogoUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Lbl required>Store Name</Lbl>
                    <Input placeholder="My Awesome Store" value={currentStore.storeName} onChange={(e) => setStoreForm({ ...currentStore, storeName: e.target.value })} />
                  </div>

                  <div className="mb-6">
                    <Lbl>Store Description</Lbl>
                    <textarea placeholder="Tell customers about your store..." value={currentStore.storeDescription} onChange={(e) => setStoreForm({ ...currentStore, storeDescription: e.target.value })} rows={4} className="w-full border-[1.5px] border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 bg-gray-50 outline-none focus:border-[#4f46e5] focus:bg-white focus:ring-2 focus:ring-[#4f46e5]/10 transition resize-vertical font-[inherit]" />
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                    <p className="text-xs font-bold text-gray-700 mb-2 m-0">📌 Read-Only Information</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Business Type:</span> <strong className="text-gray-900 capitalize">{vendor?.businessType?.replace(/_/g, " ")}</strong></div>
                      <div><span className="text-gray-500">PAN:</span> <strong className="text-gray-900 font-mono">{vendor?.panNumber}</strong></div>
                      <div><span className="text-gray-500">GST:</span> <strong className="text-gray-900 font-mono">{vendor?.gstNumber}</strong></div>
                      <div><span className="text-gray-500">Commission:</span> <strong className="text-gray-900">{vendor?.commission}%</strong></div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2 m-0">Contact support to change these</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button type="submit" disabled={updatingStore} className={`flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-extrabold text-white border-none cursor-pointer transition-all font-[inherit] ${updatingStore ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-[#4338ca] to-[#6366f1] shadow-lg shadow-indigo-200 hover:brightness-110"}`}>
                      {updatingStore && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      {updatingStore ? "Saving..." : "Save Store Details"}
                    </button>
                    {storeForm && (
                      <button type="button" onClick={() => { setStoreForm(null); setStoreMsg(null); setStoreError(""); }} className="px-5 py-3 rounded-xl text-sm font-bold text-gray-700 bg-white border-[1.5px] border-gray-200 cursor-pointer hover:bg-gray-50 transition font-[inherit]">
                        Discard
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {activeSection === "bank" && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <SectionHeader title="Bank & Business Address" subtitle="Manage payment and business location" />
                <form onSubmit={handleStoreSubmit} className="p-5 sm:p-7">
                  {storeMsg && <Alert type={storeMsg.type} text={storeMsg.text} />}
                  {storeError && <Alert type="error" text={storeError} />}

                  <h3 className="text-sm font-extrabold text-gray-900 mb-3 m-0">🏦 Bank Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div>
                      <Lbl required>Account Holder</Lbl>
                      <Input value={currentStore.bankDetails.accountHolderName} onChange={(e) => setStoreForm({ ...currentStore, bankDetails: { ...currentStore.bankDetails, accountHolderName: e.target.value } })} />
                    </div>
                    <div>
                      <Lbl required>Bank Name</Lbl>
                      <Input value={currentStore.bankDetails.bankName} onChange={(e) => setStoreForm({ ...currentStore, bankDetails: { ...currentStore.bankDetails, bankName: e.target.value } })} />
                    </div>
                    <div>
                      <Lbl required>Account Number</Lbl>
                      <Input className="font-mono" value={currentStore.bankDetails.accountNumber} onChange={(e) => setStoreForm({ ...currentStore, bankDetails: { ...currentStore.bankDetails, accountNumber: e.target.value } })} />
                    </div>
                    <div>
                      <Lbl required>IFSC Code</Lbl>
                      <Input className="font-mono uppercase tracking-widest" value={currentStore.bankDetails.ifscCode} onChange={(e) => setStoreForm({ ...currentStore, bankDetails: { ...currentStore.bankDetails, ifscCode: e.target.value.toUpperCase() } })} maxLength={11} />
                    </div>
                    <div>
                      <Lbl>Account Type</Lbl>
                      <select value={currentStore.bankDetails.accountType} onChange={(e) => setStoreForm({ ...currentStore, bankDetails: { ...currentStore.bankDetails, accountType: e.target.value } })} className="w-full border-[1.5px] border-gray-200 rounded-xl px-3.5 py-3 text-sm bg-gray-50 outline-none focus:border-[#4f46e5] focus:bg-white transition cursor-pointer font-[inherit]">
                        <option value="savings">Savings</option>
                        <option value="current">Current</option>
                      </select>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100 my-6" />

                  <h3 className="text-sm font-extrabold text-gray-900 mb-3 m-0">📍 Business Address</h3>
                  <div className="mb-4">
                    <Lbl required>Street Address</Lbl>
                    <Input value={currentStore.businessAddress.street} onChange={(e) => setStoreForm({ ...currentStore, businessAddress: { ...currentStore.businessAddress, street: e.target.value } })} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div>
                      <Lbl required>City</Lbl>
                      <Input value={currentStore.businessAddress.city} onChange={(e) => setStoreForm({ ...currentStore, businessAddress: { ...currentStore.businessAddress, city: e.target.value } })} />
                    </div>
                    <div>
                      <Lbl required>State</Lbl>
                      <select value={currentStore.businessAddress.state} onChange={(e) => setStoreForm({ ...currentStore, businessAddress: { ...currentStore.businessAddress, state: e.target.value } })} className="w-full border-[1.5px] border-gray-200 rounded-xl px-3.5 py-3 text-sm bg-gray-50 outline-none focus:border-[#4f46e5] focus:bg-white transition cursor-pointer font-[inherit]">
                        <option value="">Select</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <Lbl required>PIN Code</Lbl>
                      <Input className="font-mono tracking-widest" value={currentStore.businessAddress.postalCode} onChange={(e) => setStoreForm({ ...currentStore, businessAddress: { ...currentStore.businessAddress, postalCode: e.target.value } })} maxLength={6} />
                    </div>
                  </div>

                  <button type="submit" disabled={updatingStore} className={`flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-extrabold text-white border-none cursor-pointer transition-all font-[inherit] ${updatingStore ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-[#4338ca] to-[#6366f1] shadow-lg shadow-indigo-200 hover:brightness-110"}`}>
                    {updatingStore && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {updatingStore ? "Saving..." : "Save Bank & Address"}
                  </button>
                </form>
              </div>
            )}

            {activeSection === "password" && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <SectionHeader title="Change Password" subtitle="Keep your account secure" />
                <form onSubmit={handlePasswordSubmit} className="p-5 sm:p-7">
                  {passwordMsg && <Alert type={passwordMsg.type} text={passwordMsg.text} />}
                  {passwordError && <Alert type="error" text={passwordError} />}

                  <div className="flex flex-col gap-4">
                    {[
                      { key: "current", label: "Current Password", field: "currentPassword" },
                      { key: "new", label: "New Password", field: "newPassword" },
                      { key: "confirm", label: "Confirm New Password", field: "confirmPassword" },
                    ].map((item) => (
                      <div key={item.key}>
                        <Lbl required>{item.label}</Lbl>
                        <div className="relative">
                          <Input type={showPasswords[item.key] ? "text" : "password"} placeholder={`Enter ${item.label.toLowerCase()}`} value={passwordForm[item.field]} onChange={(e) => setPasswordForm((p) => ({ ...p, [item.field]: e.target.value }))} className="pr-12" />
                          <button type="button" onClick={() => setShowPasswords((p) => ({ ...p, [item.key]: !p[item.key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-500 p-1">
                            <EyeIcon open={showPasswords[item.key]} />
                          </button>
                        </div>
                        {item.key === "new" && passwordForm.newPassword && (
                          <div className="mt-2.5 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex-1 h-[5px] bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full ${strength.color} ${strength.width} rounded-full transition-all`} />
                              </div>
                              <span className={`text-[11px] font-extrabold ${strength.textColor}`}>{strength.text}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                              {[
                                { check: passwordForm.newPassword.length >= 6, label: "6+ chars" },
                                { check: /[A-Z]/.test(passwordForm.newPassword), label: "Uppercase" },
                                { check: /[0-9]/.test(passwordForm.newPassword), label: "Number" },
                                { check: /[^A-Za-z0-9]/.test(passwordForm.newPassword), label: "Special" },
                              ].map((r) => (
                                <span key={r.label} className={`text-[11px] flex items-center gap-1 ${r.check ? "text-green-500 font-bold" : "text-gray-400"}`}>
                                  {r.check ? "✓" : "○"} {r.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {item.key === "confirm" && passwordForm.confirmPassword && (
                          <p className={`text-xs mt-1.5 font-bold ${passwordForm.newPassword === passwordForm.confirmPassword ? "text-green-500" : "text-red-500"}`}>
                            {passwordForm.newPassword === passwordForm.confirmPassword ? "✓ Passwords match" : "✕ Passwords don't match"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <button type="submit" disabled={changingPassword} className={`mt-6 flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-extrabold text-white border-none cursor-pointer transition font-[inherit] ${changingPassword ? "bg-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-800"}`}>
                    {changingPassword && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {changingPassword ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfilePage;