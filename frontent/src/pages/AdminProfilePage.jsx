import { useState } from "react";
import { useDispatch } from "react-redux";
import { setVerifiedUser } from "../features/auth/authSlice";
import { Link } from "react-router-dom";
import {
  useGetAdminProfileQuery,
  useUpdateAdminProfileMutation,
  useChangeAdminPasswordMutation,
} from "../features/auth/authApi";
import { toast } from "../components/Toast";

const Lbl = ({ children, required }) => (
  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-[0.05em] mb-1.5">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const Input = ({ className = "", ...props }) => (
  <input className={`w-full border-[1.5px] border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 bg-gray-50 outline-none focus:border-[#4338ca] focus:bg-white focus:ring-2 focus:ring-[#4338ca]/10 transition-all font-[inherit] box-border ${className}`} {...props} />
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

const AdminProfilePage = () => {
  const dispatch = useDispatch();
  const { data: profileData, isLoading } = useGetAdminProfileQuery();
  const [updateProfile, { isLoading: updatingProfile }] = useUpdateAdminProfileMutation();
  const [changePassword, { isLoading: changingPassword }] = useChangeAdminPasswordMutation();

  const user = profileData?.data;

  const [activeSection, setActiveSection] = useState("personal");
  const [profileForm, setProfileForm] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileError, setProfileError] = useState("");

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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg","image/jpg","image/png","image/webp"].includes(file.type)) {
      setProfileError("Only JPG, PNG, WebP allowed"); return;
    }
    if (file.size > 5 * 1024 * 1024) { setProfileError("Image must be under 5MB"); return; }
    setAvatarUploading(true); setProfileError("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("http://localhost:5005/api/upload/avatar", {
        method: "POST", headers: { authorization: `Bearer ${token}` }, body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setProfileForm((prev) => ({ ...(prev || currentProfile), avatar: data.data.url }));
        setProfileMsg({ type: "success", text: "Avatar uploaded! Click Save to apply." });
      } else setProfileError(data.message || "Upload failed");
    } catch { setProfileError("Upload failed"); }
    finally { setAvatarUploading(false); }
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
          <div className="w-9 h-9 border-[3px] border-[#4338ca] border-t-transparent rounded-full animate-spin mx-auto mb-3.5" />
          <p className="text-gray-500 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

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

        <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-gray-500 text-[13px] font-semibold no-underline mb-5 hover:text-gray-700 transition">
          ← Back to Dashboard
        </Link>

        <div className="flex flex-col xl:grid xl:grid-cols-[260px_1fr] gap-4 items-start">

          <div className="flex flex-col gap-3 xl:sticky xl:top-20 w-full">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center shadow-sm">
              <div className="relative w-[86px] h-[86px] mx-auto mb-3.5">
                <div className="w-[86px] h-[86px] rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
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
              <span className="text-[11px] bg-red-100 text-red-700 px-3 py-1 rounded-full font-extrabold">
                👑 Admin
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-2.5 shadow-sm">
              {[
                { key: "personal", icon: "👤", label: "Personal Info" },
                { key: "password", icon: "🔐", label: "Password" },
              ].map((item) => {
                const active = activeSection === item.key;
                return (
                  <button key={item.key} onClick={() => setActiveSection(item.key)}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-none cursor-pointer text-left font-[inherit] transition-all ${active ? "bg-indigo-50 text-[#4338ca]" : "bg-transparent text-gray-700 hover:bg-gray-100"}`}>
                    <span className="text-lg w-6 text-center">{item.icon}</span>
                    <span className={`text-sm flex-1 ${active ? "font-extrabold" : "font-medium"}`}>{item.label}</span>
                    {active && <span className="text-[#4338ca] text-sm">→</span>}
                  </button>
                );
              })}
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-red-800 m-0">⚠️ Admin Account</p>
              <p className="text-xs text-red-700 mt-1.5 m-0 leading-relaxed">
                You have full platform access. Keep your credentials secure.
              </p>
            </div>
          </div>

          <div className="w-full">

            {activeSection === "personal" && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <SectionHeader title="Personal Information" subtitle="Update your personal details" />
                <form onSubmit={handleProfileSubmit} className="p-5 sm:p-7">
                  {profileMsg && <Alert type={profileMsg.type} text={profileMsg.text} />}
                  {profileError && <Alert type="error" text={profileError} />}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Lbl required>First Name</Lbl>
                      <Input value={currentProfile.firstName} onChange={(e) => setProfileForm({ ...currentProfile, firstName: e.target.value })} />
                    </div>
                    <div>
                      <Lbl>Last Name</Lbl>
                      <Input value={currentProfile.lastName} onChange={(e) => setProfileForm({ ...currentProfile, lastName: e.target.value })} />
                    </div>
                  </div>

                  <div className="mb-4">
                    <Lbl>Email Address</Lbl>
                    <div className="flex items-center gap-2.5 w-full border-[1.5px] border-gray-200 rounded-xl px-3.5 py-3 bg-gray-100 text-gray-400 cursor-not-allowed text-sm">
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
                        <Input className="pl-[54px]" value={currentProfile.phone} onChange={(e) => setProfileForm({ ...currentProfile, phone: e.target.value })} maxLength={10} />
                      </div>
                    </div>
                    <div>
                      <Lbl>Date of Birth</Lbl>
                      <Input type="date" value={currentProfile.dateOfBirth} onChange={(e) => setProfileForm({ ...currentProfile, dateOfBirth: e.target.value })} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button type="submit" disabled={updatingProfile} className={`flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-extrabold text-white border-none cursor-pointer transition-all font-[inherit] ${updatingProfile ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-[#3730a3] to-[#4f46e5] shadow-lg shadow-indigo-200 hover:brightness-110"}`}>
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

            {activeSection === "password" && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <SectionHeader title="Change Password" subtitle="Keep your admin account secure" />
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
                          <Input type={showPasswords[item.key] ? "text" : "password"} value={passwordForm[item.field]} onChange={(e) => setPasswordForm((p) => ({ ...p, [item.field]: e.target.value }))} className="pr-12" />
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

export default AdminProfilePage;