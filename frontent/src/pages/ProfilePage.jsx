import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setVerifiedUser } from "../features/auth/authSlice";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} from "../features/customer/customerApi";
import { Link } from "react-router-dom";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh",
];

const EMPTY_ADDRESS = {
  fullName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
};

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: updatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: changingPassword }] = useChangePasswordMutation();
  const [addAddress, { isLoading: addingAddress }] = useAddAddressMutation();
  const [updateAddress, { isLoading: updatingAddress }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();

  const profile = profileData?.data;

  const [activeSection, setActiveSection] = useState("profile");
  const [profileForm, setProfileForm] = useState(null);
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordError, setPasswordError] = useState("");

  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);
  const [addressMsg, setAddressMsg] = useState(null);
  const [addressError, setAddressError] = useState("");
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState(null);

  const currentProfile = profileForm || {
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    phone: profile?.phone || "",
    dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.split("T")[0] : "",
    avatar: profile?.avatar || "",
  };

  const getPasswordStrength = () => {
    const p = passwordForm.newPassword;
    if (!p) return { width: "0%", color: "#E5E7EB", text: "", textColor: "#9CA3AF" };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 2) return { width: "33%", color: "#EF4444", text: "Weak", textColor: "#EF4444" };
    if (score <= 3) return { width: "66%", color: "#F59E0B", text: "Medium", textColor: "#F59E0B" };
    return { width: "100%", color: "#22C55E", text: "Strong", textColor: "#22C55E" };
  };

  const strength = getPasswordStrength();

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setProfileError("Only JPG, PNG, or WebP images allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Image must be under 5MB");
      return;
    }

    setAvatarUploading(true);
    setProfileError("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("http://localhost:5005/api/upload/avatar", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setProfileForm((prev) => ({
          ...(prev || currentProfile),
          avatar: data.data.url,
        }));
        setProfileMsg({ type: "success", text: "Avatar uploaded. Click Save Changes to apply." });
      } else {
        setProfileError(data.message || "Failed to upload avatar");
      }
    } catch {
      setProfileError("Upload failed. Please try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileError("");

    if (!currentProfile.firstName.trim()) {
      setProfileError("First name is required");
      return;
    }

    try {
      const res = await updateProfile({
        firstName: currentProfile.firstName.trim(),
        lastName: currentProfile.lastName.trim(),
        phone: currentProfile.phone.trim(),
        dateOfBirth: currentProfile.dateOfBirth || null,
        avatar: currentProfile.avatar,
      }).unwrap();

      dispatch(setVerifiedUser(res.data));
      setProfileMsg({ type: "success", text: "Profile updated successfully" });
      setProfileForm(null);
    } catch (err) {
      setProfileError(err?.data?.message || "Failed to update profile");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordError("");

    if (!passwordForm.currentPassword) { setPasswordError("Current password is required"); return; }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) { setPasswordError("Min 6 characters required"); return; }
    if (!/[A-Z]/.test(passwordForm.newPassword)) { setPasswordError("Must contain at least one uppercase letter"); return; }
    if (!/[0-9]/.test(passwordForm.newPassword)) { setPasswordError("Must contain at least one number"); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setPasswordError("Passwords do not match"); return; }

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }).unwrap();
      setPasswordMsg({ type: "success", text: "Password changed successfully" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordError(err?.data?.message || "Failed to change password");
    }
  };

  const openAddAddress = () => {
    setAddressForm(EMPTY_ADDRESS);
    setEditingAddressId(null);
    setAddressError("");
    setAddressMsg(null);
    setShowAddressForm(true);
  };

  const openEditAddress = (address) => {
    setAddressForm({
      fullName: address.fullName || "",
      phone: address.phone || "",
      street: address.street || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      country: address.country || "India",
      isDefault: address.isDefault || false,
    });
    setEditingAddressId(address._id);
    setAddressError("");
    setAddressMsg(null);
    setShowAddressForm(true);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setAddressMsg(null);
    setAddressError("");

    const { fullName, phone, street, city, state, postalCode } = addressForm;
    if (!fullName.trim() || !phone.trim() || !street.trim() || !city.trim() || !state || !postalCode.trim()) {
      setAddressError("All fields are required");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setAddressError("Enter a valid 10-digit Indian phone number");
      return;
    }
    if (postalCode.trim().length !== 6) {
      setAddressError("PIN code must be 6 digits");
      return;
    }

    try {
      if (editingAddressId) {
        await updateAddress({ addressId: editingAddressId, ...addressForm }).unwrap();
        setAddressMsg({ type: "success", text: "Address updated successfully" });
      } else {
        await addAddress(addressForm).unwrap();
        setAddressMsg({ type: "success", text: "Address added successfully" });
      }
      setShowAddressForm(false);
      setEditingAddressId(null);
      setAddressForm(EMPTY_ADDRESS);
    } catch (err) {
      setAddressError(err?.data?.message || "Failed to save address");
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await deleteAddress(addressId).unwrap();
      setDeletingAddressId(null);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await setDefaultAddress(addressId).unwrap();
    } catch (err) {
      console.log(err);
    }
  };

  if (profileLoading) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #D85A30", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 14px" }}></div>
          <p style={{ color: "#6B7280", fontSize: 14 }}>Loading your profile...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const navItems = [
    { key: "profile", icon: "👤", label: "Personal Info" },
    { key: "password", icon: "🔐", label: "Password" },
    { key: "addresses", icon: "📍", label: "Addresses" },
  ];

  const inputStyle = {
    width: "100%",
    border: "1.5px solid #E5E7EB",
    borderRadius: 12,
    padding: "11px 14px",
    fontSize: 14,
    color: "#111",
    background: "#F9FAFB",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "all 0.15s",
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 700,
    color: "#6B7280",
    display: "block",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const Alert = ({ type, text }) => (
    <div style={{
      background: type === "success" ? "#F0FDF4" : "#FEF2F2",
      border: `1px solid ${type === "success" ? "#86EFAC" : "#FECACA"}`,
      color: type === "success" ? "#16A34A" : "#DC2626",
      borderRadius: 10,
      padding: "11px 14px",
      fontSize: 13,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 16,
    }}>
      {type === "success" ? "✅" : "❌"} {text}
    </div>
  );

  return (
    <div style={{ background: "#F3F4F6", minHeight: "100vh" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .section-anim { animation: fadeIn 0.2s ease both; }
        .p-input:focus {
          border-color: #D85A30 !important;
          background: white !important;
          box-shadow: 0 0 0 3px rgba(216,90,48,0.1) !important;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          cursor: pointer;
          border: none;
          background: transparent;
          text-align: left;
          width: 100%;
          font-family: inherit;
          transition: all 0.15s;
        }
        .nav-item:hover { background: #F3F4F6; }
        .nav-item.active { background: #FFF5F0; color: #D85A30; }
        .addr-card { border: 1.5px solid #E5E7EB; border-radius: 16px; padding: 18px 20px; background: white; transition: all 0.15s; }
        .addr-card.default-card { border-color: #D85A30; background: linear-gradient(135deg, #FFF5F0, #FFFBF9); }
      `}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <Link to="/dashboard" style={{ color: "#6B7280", textDecoration: "none", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            ← Back to Dashboard
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, alignItems: "flex-start" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "sticky", top: 80 }}>
            <div style={{ background: "white", borderRadius: 20, border: "1px solid #E5E7EB", padding: "24px", textAlign: "center" }}>
              <div style={{ position: "relative", width: 86, height: 86, margin: "0 auto 14px" }}>
                <div style={{ width: 86, height: 86, borderRadius: "50%", background: "linear-gradient(135deg, #D85A30, #FF8C5A)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "4px solid white", boxShadow: "0 8px 24px rgba(216,90,48,0.25)" }}>
                  {currentProfile.avatar ? (
                    <img
                      src={currentProfile.avatar}
                      alt="Avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <span style={{ fontSize: 34, fontWeight: 900, color: "white" }}>
                      {profile?.firstName?.[0]?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>

                <label style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, background: "#111", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2.5px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                  {avatarUploading ? (
                    <div style={{ width: 12, height: 12, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }}></div>
                  ) : (
                    <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" />
                    </svg>
                  )}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleAvatarUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              <p style={{ fontSize: 16, fontWeight: 900, color: "#111", margin: "0 0 3px" }}>
                {profile?.firstName} {profile?.lastName}
              </p>
              <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 10px" }}>{profile?.email}</p>
              <span style={{ fontSize: 11, background: "#DCFCE7", color: "#16A34A", padding: "3px 12px", borderRadius: 99, fontWeight: 800, textTransform: "capitalize" }}>
                ✓ {profile?.role}
              </span>
            </div>

            <div style={{ background: "white", borderRadius: 20, border: "1px solid #E5E7EB", padding: "10px" }}>
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className={`nav-item ${activeSection === item.key ? "active" : ""}`}
                >
                  <span style={{ fontSize: 18, width: 26, textAlign: "center" }}>{item.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: activeSection === item.key ? 800 : 500, color: activeSection === item.key ? "#D85A30" : "#374151" }}>
                    {item.label}
                  </span>
                  {activeSection === item.key && (
                    <span style={{ marginLeft: "auto", color: "#D85A30", fontSize: 14 }}>→</span>
                  )}
                </button>
              ))}
            </div>

            <Link
              to="/orders"
              style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: "12px 16px", textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}
            >
              <span style={{ fontSize: 18 }}>📦</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: 0 }}>My Orders</p>
                <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>View order history</p>
              </div>
            </Link>
          </div>

          <div>
            {activeSection === "profile" && (
              <div className="section-anim" style={{ background: "white", borderRadius: 20, border: "1px solid #E5E7EB", overflow: "hidden" }}>
                <div style={{ padding: "20px 28px", borderBottom: "1px solid #F3F4F6", background: "linear-gradient(135deg, #FFF5F0, white)" }}>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: "#111", margin: 0 }}>Personal Information</h2>
                  <p style={{ fontSize: 13, color: "#6B7280", margin: "3px 0 0" }}>Update your personal details and profile photo</p>
                </div>

                <form onSubmit={handleProfileSubmit} style={{ padding: "28px" }}>
                  {profileMsg && <Alert type={profileMsg.type} text={profileMsg.text} />}
                  {profileError && <Alert type="error" text={profileError} />}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={labelStyle}>First Name <span style={{ color: "#EF4444" }}>*</span></label>
                      <input
                        className="p-input"
                        placeholder="John"
                        value={currentProfile.firstName}
                        onChange={(e) => setProfileForm({ ...currentProfile, firstName: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Last Name</label>
                      <input
                        className="p-input"
                        placeholder="Doe"
                        value={currentProfile.lastName}
                        onChange={(e) => setProfileForm({ ...currentProfile, lastName: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Email Address</label>
                    <div style={{ ...inputStyle, background: "#F3F4F6", color: "#9CA3AF", display: "flex", alignItems: "center", gap: 10, cursor: "not-allowed" }}>
                      <svg width="16" height="16" fill="none" stroke="#9CA3AF" strokeWidth="1.8" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
                      </svg>
                      {profile?.email}
                      <span style={{ marginLeft: "auto", fontSize: 11, background: "#E5E7EB", color: "#6B7280", padding: "2px 8px", borderRadius: 99 }}>Cannot be changed</span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                    <div>
                      <label style={labelStyle}>Phone Number</label>
                      <div style={{ position: "relative" }}>
                        <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>+91</span>
                          <div style={{ width: 1, height: 16, background: "#E5E7EB" }}></div>
                        </div>
                        <input
                          className="p-input"
                          placeholder="9876543210"
                          value={currentProfile.phone}
                          onChange={(e) => setProfileForm({ ...currentProfile, phone: e.target.value })}
                          maxLength={10}
                          style={{ ...inputStyle, paddingLeft: 54 }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Date of Birth</label>
                      <input
                        className="p-input"
                        type="date"
                        value={currentProfile.dateOfBirth}
                        onChange={(e) => setProfileForm({ ...currentProfile, dateOfBirth: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      type="submit"
                      disabled={updatingProfile || avatarUploading}
                      style={{
                        background: updatingProfile ? "#9CA3AF" : "linear-gradient(135deg, #D85A30, #FF8C5A)",
                        color: "white", border: "none", borderRadius: 12,
                        padding: "12px 28px", fontSize: 14, fontWeight: 800,
                        cursor: updatingProfile ? "not-allowed" : "pointer",
                        boxShadow: updatingProfile ? "none" : "0 4px 16px rgba(216,90,48,0.3)",
                        fontFamily: "inherit",
                      }}
                    >
                      {updatingProfile ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }}></span>
                          Saving...
                        </span>
                      ) : "Save Changes"}
                    </button>
                    {profileForm && (
                      <button
                        type="button"
                        onClick={() => { setProfileForm(null); setProfileMsg(null); setProfileError(""); }}
                        style={{ background: "white", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        Discard
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {activeSection === "password" && (
              <div className="section-anim" style={{ background: "white", borderRadius: 20, border: "1px solid #E5E7EB", overflow: "hidden" }}>
                <div style={{ padding: "20px 28px", borderBottom: "1px solid #F3F4F6", background: "linear-gradient(135deg, #F0F9FF, white)" }}>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: "#111", margin: 0 }}>Change Password</h2>
                  <p style={{ fontSize: 13, color: "#6B7280", margin: "3px 0 0" }}>Keep your account secure with a strong password</p>
                </div>

                <form onSubmit={handlePasswordSubmit} style={{ padding: "28px" }}>
                  {passwordMsg && <Alert type={passwordMsg.type} text={passwordMsg.text} />}
                  {passwordError && <Alert type="error" text={passwordError} />}

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[
                      { key: "current", label: "Current Password", field: "currentPassword", placeholder: "Enter your current password" },
                      { key: "new", label: "New Password", field: "newPassword", placeholder: "Create a strong new password" },
                      { key: "confirm", label: "Confirm New Password", field: "confirmPassword", placeholder: "Re-enter new password" },
                    ].map((item) => (
                      <div key={item.key}>
                        <label style={labelStyle}>
                          {item.label} <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <div style={{ position: "relative" }}>
                          <input
                            className="p-input"
                            type={showPasswords[item.key] ? "text" : "password"}
                            placeholder={item.placeholder}
                            value={passwordForm[item.field]}
                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, [item.field]: e.target.value }))}
                            style={{ ...inputStyle, paddingRight: 46 }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: 4 }}
                          >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                              {showPasswords[item.key] ? (
                                <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" /><path d="M1 1l22 22" strokeLinecap="round" /></>
                              ) : (
                                <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                              )}
                            </svg>
                          </button>
                        </div>

                        {item.key === "new" && passwordForm.newPassword && (
                          <div style={{ marginTop: 10, padding: "10px 14px", background: "#F9FAFB", borderRadius: 10, border: "1px solid #E5E7EB" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <div style={{ flex: 1, height: 5, background: "#E5E7EB", borderRadius: 99, overflow: "hidden" }}>
                                <div style={{ width: strength.width, height: "100%", background: strength.color, borderRadius: 99, transition: "all 0.3s" }}></div>
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 800, color: strength.textColor, minWidth: 50 }}>{strength.text}</span>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 14px" }}>
                              {[
                                { check: passwordForm.newPassword.length >= 6, label: "6+ characters" },
                                { check: /[A-Z]/.test(passwordForm.newPassword), label: "Uppercase" },
                                { check: /[0-9]/.test(passwordForm.newPassword), label: "Number" },
                                { check: /[^A-Za-z0-9]/.test(passwordForm.newPassword), label: "Special char" },
                              ].map((r) => (
                                <span key={r.label} style={{ fontSize: 11, color: r.check ? "#22C55E" : "#9CA3AF", fontWeight: r.check ? 700 : 400, display: "flex", alignItems: "center", gap: 4 }}>
                                  {r.check ? (
                                    <svg width="10" height="10" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" /></svg>
                                  ) : (
                                    <span style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid #D1D5DB", display: "inline-block" }}></span>
                                  )}
                                  {r.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.key === "confirm" && passwordForm.confirmPassword && (
                          <p style={{ fontSize: 12, marginTop: 5, color: passwordForm.newPassword === passwordForm.confirmPassword ? "#22C55E" : "#EF4444", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                            {passwordForm.newPassword === passwordForm.confirmPassword ? (
                              <><svg width="12" height="12" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" /></svg> Passwords match</>
                            ) : (
                              <><svg width="12" height="12" fill="none" stroke="#EF4444" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg> Passwords do not match</>
                            )}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    style={{ marginTop: 24, background: changingPassword ? "#9CA3AF" : "#111", color: "white", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 800, cursor: changingPassword ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                  >
                    {changingPassword ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }}></span>
                        Changing...
                      </span>
                    ) : "Update Password"}
                  </button>
                </form>
              </div>
            )}

            {activeSection === "addresses" && (
              <div className="section-anim">
                <div style={{ background: "white", borderRadius: 20, border: "1px solid #E5E7EB", overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ padding: "20px 28px", borderBottom: "1px solid #F3F4F6", background: "linear-gradient(135deg, #F0FDF4, white)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <h2 style={{ fontSize: 18, fontWeight: 900, color: "#111", margin: 0 }}>Address Book</h2>
                      <p style={{ fontSize: 13, color: "#6B7280", margin: "3px 0 0" }}>
                        {profile?.addresses?.length || 0} saved {profile?.addresses?.length === 1 ? "address" : "addresses"}
                      </p>
                    </div>
                    {!showAddressForm && (
                      <button
                        onClick={openAddAddress}
                        style={{ background: "linear-gradient(135deg, #D85A30, #FF8C5A)", color: "white", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(216,90,48,0.25)", fontFamily: "inherit" }}
                      >
                        + Add Address
                      </button>
                    )}
                  </div>

                  {addressMsg && (
                    <div style={{ padding: "0 28px", paddingTop: 16 }}>
                      <Alert type={addressMsg.type} text={addressMsg.text} />
                    </div>
                  )}

                  {showAddressForm && (
                    <div style={{ padding: "24px 28px", borderBottom: "1px solid #E5E7EB" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111", margin: 0 }}>
                          {editingAddressId ? "Edit Address" : "Add New Address"}
                        </h3>
                        <button
                          onClick={() => { setShowAddressForm(false); setEditingAddressId(null); setAddressError(""); }}
                          style={{ background: "#F3F4F6", border: "none", color: "#374151", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </div>

                      <form onSubmit={handleAddressSubmit}>
                        {addressError && <Alert type="error" text={addressError} />}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                          <div>
                            <label style={labelStyle}>Full Name <span style={{ color: "#EF4444" }}>*</span></label>
                            <input className="p-input" placeholder="John Doe" value={addressForm.fullName} onChange={(e) => setAddressForm((p) => ({ ...p, fullName: e.target.value }))} style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>Phone <span style={{ color: "#EF4444" }}>*</span></label>
                            <div style={{ position: "relative" }}>
                              <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>+91</span>
                                <div style={{ width: 1, height: 16, background: "#E5E7EB" }}></div>
                              </div>
                              <input className="p-input" placeholder="9876543210" value={addressForm.phone} onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))} maxLength={10} style={{ ...inputStyle, paddingLeft: 54 }} />
                            </div>
                          </div>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <label style={labelStyle}>Street Address <span style={{ color: "#EF4444" }}>*</span></label>
                          <input className="p-input" placeholder="House No, Building, Street, Area, Landmark" value={addressForm.street} onChange={(e) => setAddressForm((p) => ({ ...p, street: e.target.value }))} style={inputStyle} />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                          <div>
                            <label style={labelStyle}>City <span style={{ color: "#EF4444" }}>*</span></label>
                            <input className="p-input" placeholder="Mumbai" value={addressForm.city} onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))} style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>State <span style={{ color: "#EF4444" }}>*</span></label>
                            <select value={addressForm.state} onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))} style={{ ...inputStyle, cursor: "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32 }}>
                              <option value="">Select</option>
                              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={labelStyle}>PIN Code <span style={{ color: "#EF4444" }}>*</span></label>
                            <input className="p-input" placeholder="400001" value={addressForm.postalCode} onChange={(e) => setAddressForm((p) => ({ ...p, postalCode: e.target.value }))} maxLength={6} style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: "0.1em", fontWeight: 600 }} />
                          </div>
                        </div>

                        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 20 }}>
                          <input
                            type="checkbox"
                            checked={addressForm.isDefault}
                            onChange={(e) => setAddressForm((p) => ({ ...p, isDefault: e.target.checked }))}
                            style={{ width: 17, height: 17, accentColor: "#D85A30", cursor: "pointer" }}
                          />
                          <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>
                            Set as my default delivery address
                          </span>
                        </label>

                        <div style={{ display: "flex", gap: 10 }}>
                          <button
                            type="button"
                            onClick={() => { setShowAddressForm(false); setEditingAddressId(null); setAddressError(""); }}
                            style={{ background: "white", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "11px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={addingAddress || updatingAddress}
                            style={{ flex: 1, background: addingAddress || updatingAddress ? "#9CA3AF" : "linear-gradient(135deg, #D85A30, #FF8C5A)", color: "white", border: "none", borderRadius: 12, padding: "11px", fontSize: 14, fontWeight: 800, cursor: addingAddress || updatingAddress ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                          >
                            {addingAddress || updatingAddress ? "Saving..." : editingAddressId ? "Update Address" : "Add Address"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div style={{ padding: "20px 28px" }}>
                    {profile?.addresses?.length === 0 && !showAddressForm && (
                      <div style={{ textAlign: "center", padding: "40px 20px", background: "#F9FAFB", borderRadius: 16, border: "2px dashed #E5E7EB" }}>
                        <p style={{ fontSize: 36, margin: "0 0 12px" }}>📍</p>
                        <p style={{ fontSize: 15, fontWeight: 800, color: "#374151", margin: 0 }}>No saved addresses</p>
                        <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 16px" }}>Add a delivery address to speed up checkout</p>
                        <button
                          onClick={openAddAddress}
                          style={{ background: "#111", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                        >
                          + Add First Address
                        </button>
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {profile?.addresses?.map((address) => (
                        <div key={address._id} className={`addr-card ${address.isDefault ? "default-card" : ""}`}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <p style={{ fontSize: 14, fontWeight: 900, color: "#111", margin: 0 }}>{address.fullName}</p>
                                {address.isDefault && (
                                  <span style={{ fontSize: 10, background: "#D85A30", color: "white", padding: "2px 10px", borderRadius: 99, fontWeight: 900 }}>
                                    ✓ Default
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: 13, color: "#374151", margin: "0 0 3px", lineHeight: 1.5 }}>
                                {address.street}
                              </p>
                              <p style={{ fontSize: 13, color: "#374151", margin: "0 0 3px" }}>
                                {address.city}, {address.state} — {address.postalCode}
                              </p>
                              <p style={{ fontSize: 12, color: "#6B7280", margin: "6px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 .01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" strokeLinecap="round" />
                                </svg>
                                +91 {address.phone}
                              </p>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                              <button
                                onClick={() => openEditAddress(address)}
                                style={{ background: "#EDE9FE", color: "#5B21B6", border: "1px solid #C4B5FD", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                              >
                                ✏️ Edit
                              </button>
                              {!address.isDefault && (
                                <button
                                  onClick={() => handleSetDefault(address._id)}
                                  style={{ background: "#FFF5F0", color: "#D85A30", border: "1px solid #FDBA74", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                                >
                                  Set Default
                                </button>
                              )}
                              {deletingAddressId === address._id ? (
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button
                                    onClick={() => handleDeleteAddress(address._id)}
                                    style={{ flex: 1, background: "#EF4444", color: "white", border: "none", borderRadius: 8, padding: "7px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setDeletingAddressId(null)}
                                    style={{ flex: 1, background: "white", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 8, padding: "7px 10px", fontSize: 12, cursor: "pointer" }}
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeletingAddressId(address._id)}
                                  style={{ background: "#FEE2E2", color: "#7F1D1D", border: "1px solid #FCA5A5", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                                >
                                  🗑️ Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;