import { useState } from "react";
import { useDispatch } from "react-redux";
import { setVerifiedUser } from "../features/auth/authSlice";
import { API_URL } from "../utils/apiConfig";
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

const Label = ({ children, required }) => (
  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-[0.05em] mb-1.5">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full border-[1.5px] border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 bg-gray-50 outline-none focus:border-[#D85A30] focus:bg-white focus:ring-2 focus:ring-[#D85A30]/10 transition-all font-[inherit] box-border ${className}`}
    {...props}
  />
);

const Alert = ({ type, text }) => (
  <div
    className={`flex items-center gap-2 px-3.5 py-3 rounded-xl text-sm font-semibold mb-4 ${
      type === "success"
        ? "bg-green-50 border border-green-200 text-green-700"
        : "bg-red-50 border border-red-200 text-red-600"
    }`}
  >
    {type === "success" ? "✅" : "❌"} {text}
  </div>
);

const SectionHeader = ({ title, subtitle, gradientFrom = "from-orange-50", extra }) => (
  <div
    className={`px-5 sm:px-7 py-5 border-b border-gray-100 bg-gradient-to-r ${gradientFrom} to-white flex items-center justify-between gap-4`}
  >
    <div>
      <h2 className="text-lg font-black text-gray-900 m-0">{title}</h2>
      {subtitle && <p className="text-[13px] text-gray-500 mt-0.5 m-0">{subtitle}</p>}
    </div>
    {extra}
  </div>
);

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
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
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
    if (!p)
      return { width: "0%", color: "bg-gray-200", text: "", textColor: "text-gray-400" };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 2)
      return { width: "w-1/3", color: "bg-red-500", text: "Weak", textColor: "text-red-500" };
    if (score <= 3)
      return { width: "w-2/3", color: "bg-yellow-400", text: "Medium", textColor: "text-yellow-500" };
    return { width: "w-full", color: "bg-green-500", text: "Strong", textColor: "text-green-500" };
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
      const res = await fetch(`${API_URL}/upload/avatar`, {

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
        setProfileMsg({
          type: "success",
          text: "Avatar uploaded. Click Save Changes to apply.",
        });
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
    if (!passwordForm.currentPassword) {
      setPasswordError("Current password is required");
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordError("Min 6 characters required");
      return;
    }
    if (!/[A-Z]/.test(passwordForm.newPassword)) {
      setPasswordError("Must contain at least one uppercase letter");
      return;
    }
    if (!/[0-9]/.test(passwordForm.newPassword)) {
      setPasswordError("Must contain at least one number");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
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
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-9 h-9 border-[3px] border-[#D85A30] border-t-transparent rounded-full animate-spin mx-auto mb-3.5"></div>
          <p className="text-gray-500 text-sm">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { key: "profile", icon: "👤", label: "Personal Info" },
    { key: "password", icon: "🔐", label: "Password" },
    { key: "addresses", icon: "📍", label: "Addresses" },
  ];

  const EyeIcon = ({ open }) => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      {open ? (
        <>
          <path
            d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
            strokeLinecap="round"
          />
          <path d="M1 1l22 22" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );

  return (
    <div className="bg-gray-100 min-h-screen py-5 sm:py-7 px-3 sm:px-4">
      <div className="max-w-[1000px] mx-auto">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-gray-500 text-[13px] font-semibold no-underline mb-5 hover:text-gray-700 transition-colors"
        >
          ← Back to Dashboard
        </Link>

        <div className="flex flex-col xl:grid xl:grid-cols-[260px_1fr] gap-4 items-start">
          <div className="flex flex-col gap-3 xl:sticky xl:top-20 w-full">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 text-center">
              <div className="relative w-[86px] h-[86px] mx-auto mb-3.5">
                <div className="w-[86px] h-[86px] rounded-full bg-gradient-to-br from-[#D85A30] to-[#FF8C5A] flex items-center justify-center overflow-hidden border-4 border-white shadow-lg shadow-orange-500/20">
                  {currentProfile.avatar ? (
                    <img
                      src={currentProfile.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-[34px] font-black text-white">
                      {profile?.firstName?.[0]?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center cursor-pointer border-[2.5px] border-white shadow-md">
                  {avatarUploading ? (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path
                        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                        strokeLinecap="round"
                      />
                      <path
                        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-base font-black text-gray-900 m-0">
                {profile?.firstName} {profile?.lastName}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 mb-2.5">{profile?.email}</p>
              <span className="text-[11px] bg-green-100 text-green-700 px-3 py-1 rounded-full font-extrabold capitalize">
                ✓ {profile?.role}
              </span>
            </div>

            {profile?.stats && (profile.stats.totalSaved > 0 || profile.stats.couponOrders > 0) && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-md">
                    💰
                  </div>
                  <div>
                    <p className="text-[10px] text-green-700 font-bold uppercase tracking-wide m-0">
                      Total Savings
                    </p>
                    <p className="text-lg font-black text-green-800 m-0">
                      ₹{(profile.stats.totalSaved || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5 text-[11px] pt-2 border-t border-green-200">
                  <div className="flex justify-between text-green-700">
                    <span>📦 Total Orders</span>
                    <strong>{profile.stats.totalOrders || 0}</strong>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>🎟️ Coupon Orders</span>
                    <strong>{profile.stats.couponOrders || 0}</strong>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>💵 Total Spent</span>
                    <strong>
                      ₹{Math.round(profile.stats.totalSpent || 0).toLocaleString("en-IN")}
                    </strong>
                  </div>
                  {profile.stats.uniqueCouponsUsed > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>🏆 Unique Coupons</span>
                      <strong>{profile.stats.uniqueCouponsUsed}</strong>
                    </div>
                  )}
                </div>
                {profile.stats.couponsUsed && profile.stats.couponsUsed.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-green-200">
                    <p className="text-[10px] text-green-600 font-bold uppercase m-0 mb-1.5">
                      Coupons Used:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {profile.stats.couponsUsed.slice(0, 3).map((code) => (
                        <span
                          key={code}
                          className="text-[10px] bg-white text-green-700 border border-green-300 px-2 py-0.5 rounded font-bold"
                        >
                          🎟️ {code}
                        </span>
                      ))}
                      {profile.stats.couponsUsed.length > 3 && (
                        <span className="text-[10px] text-green-600 font-bold">
                          +{profile.stats.couponsUsed.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 p-2.5">
              {navItems.map((item) => {
                const active = activeSection === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-none cursor-pointer text-left font-[inherit] transition-all ${
                      active
                        ? "bg-orange-50 text-[#D85A30]"
                        : "bg-transparent text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-lg w-6 text-center">{item.icon}</span>
                    <span
                      className={`text-sm flex-1 ${
                        active ? "font-extrabold text-[#D85A30]" : "font-medium"
                      }`}
                    >
                      {item.label}
                    </span>
                    {active && <span className="text-[#D85A30] text-sm">→</span>}
                  </button>
                );
              })}
            </div>

            <Link
              to="/orders"
              className="bg-white border border-gray-200 rounded-2xl p-3.5 no-underline flex items-center gap-3 hover:border-[#D85A30] hover:bg-orange-50 transition-all"
            >
              <span className="text-xl">📦</span>
              <div>
                <p className="text-[13px] font-bold text-gray-900 m-0">My Orders</p>
                <p className="text-[11px] text-gray-500 m-0">View order history</p>
              </div>
            </Link>

            <Link
              to="/wishlist"
              className="bg-white border border-gray-200 rounded-2xl p-3.5 no-underline flex items-center gap-3 hover:border-[#D85A30] hover:bg-orange-50 transition-all"
            >
              <span className="text-xl">❤️</span>
              <div>
                <p className="text-[13px] font-bold text-gray-900 m-0">My Wishlist</p>
                <p className="text-[11px] text-gray-500 m-0">Saved products</p>
              </div>
            </Link>
          </div>

          <div className="w-full">
            {activeSection === "profile" && (
              <div className="animate-in fade-in bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <SectionHeader
                  title="Personal Information"
                  subtitle="Update your personal details and profile photo"
                  gradientFrom="from-orange-50"
                />
                <form onSubmit={handleProfileSubmit} className="p-5 sm:p-7">
                  {profileMsg && <Alert type={profileMsg.type} text={profileMsg.text} />}
                  {profileError && <Alert type="error" text={profileError} />}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label required>First Name</Label>
                      <Input
                        placeholder="John"
                        value={currentProfile.firstName}
                        onChange={(e) =>
                          setProfileForm({ ...currentProfile, firstName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input
                        placeholder="Doe"
                        value={currentProfile.lastName}
                        onChange={(e) =>
                          setProfileForm({ ...currentProfile, lastName: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label>Email Address</Label>
                    <div className="flex items-center gap-2.5 w-full border-[1.5px] border-gray-200 rounded-xl px-3.5 py-3 bg-gray-100 text-gray-400 cursor-not-allowed text-sm">
                      <svg width="16" height="16" fill="none" stroke="#9CA3AF" strokeWidth="1.8" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
                      </svg>
                      <span className="flex-1">{profile?.email}</span>
                      <span className="text-[11px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                        Cannot be changed
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label>Phone Number</Label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-gray-700">+91</span>
                          <div className="w-px h-4 bg-gray-300"></div>
                        </div>
                        <Input
                          className="pl-[54px]"
                          placeholder="9876543210"
                          value={currentProfile.phone}
                          onChange={(e) =>
                            setProfileForm({ ...currentProfile, phone: e.target.value })
                          }
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        value={currentProfile.dateOfBirth}
                        onChange={(e) =>
                          setProfileForm({ ...currentProfile, dateOfBirth: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={updatingProfile || avatarUploading}
                      className={`flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-extrabold text-white border-none cursor-pointer transition-all ${
                        updatingProfile
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
                      }`}
                    >
                      {updatingProfile && (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      )}
                      {updatingProfile ? "Saving..." : "Save Changes"}
                    </button>
                    {profileForm && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileForm(null);
                          setProfileMsg(null);
                          setProfileError("");
                        }}
                        className="px-5 py-3 rounded-xl text-sm font-bold text-gray-700 bg-white border-[1.5px] border-gray-200 cursor-pointer hover:bg-gray-50 transition font-[inherit]"
                      >
                        Discard
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {activeSection === "password" && (
              <div className="animate-in fade-in bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <SectionHeader
                  title="Change Password"
                  subtitle="Keep your account secure with a strong password"
                  gradientFrom="from-blue-50"
                />
                <form onSubmit={handlePasswordSubmit} className="p-5 sm:p-7">
                  {passwordMsg && <Alert type={passwordMsg.type} text={passwordMsg.text} />}
                  {passwordError && <Alert type="error" text={passwordError} />}

                  <div className="flex flex-col gap-4">
                    {[
                      {
                        key: "current",
                        label: "Current Password",
                        field: "currentPassword",
                        placeholder: "Enter your current password",
                      },
                      {
                        key: "new",
                        label: "New Password",
                        field: "newPassword",
                        placeholder: "Create a strong new password",
                      },
                      {
                        key: "confirm",
                        label: "Confirm New Password",
                        field: "confirmPassword",
                        placeholder: "Re-enter new password",
                      },
                    ].map((item) => (
                      <div key={item.key}>
                        <Label required>{item.label}</Label>
                        <div className="relative">
                          <Input
                            type={showPasswords[item.key] ? "text" : "password"}
                            placeholder={item.placeholder}
                            value={passwordForm[item.field]}
                            onChange={(e) =>
                              setPasswordForm((prev) => ({
                                ...prev,
                                [item.field]: e.target.value,
                              }))
                            }
                            className="pr-12"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                [item.key]: !prev[item.key],
                              }))
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-500 p-1"
                          >
                            <EyeIcon open={showPasswords[item.key]} />
                          </button>
                        </div>

                        {item.key === "new" && passwordForm.newPassword && (
                          <div className="mt-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex-1 h-[5px] bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${strength.color} ${strength.width} rounded-full transition-all duration-300`}
                                ></div>
                              </div>
                              <span
                                className={`text-[11px] font-extrabold ${strength.textColor} min-w-[50px]`}
                              >
                                {strength.text}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-3.5 gap-y-1">
                              {[
                                {
                                  check: passwordForm.newPassword.length >= 6,
                                  label: "6+ characters",
                                },
                                {
                                  check: /[A-Z]/.test(passwordForm.newPassword),
                                  label: "Uppercase",
                                },
                                {
                                  check: /[0-9]/.test(passwordForm.newPassword),
                                  label: "Number",
                                },
                                {
                                  check: /[^A-Za-z0-9]/.test(passwordForm.newPassword),
                                  label: "Special char",
                                },
                              ].map((r) => (
                                <span
                                  key={r.label}
                                  className={`text-[11px] flex items-center gap-1 ${
                                    r.check ? "text-green-500 font-bold" : "text-gray-400"
                                  }`}
                                >
                                  {r.check ? (
                                    <svg
                                      width="10"
                                      height="10"
                                      fill="none"
                                      stroke="#22C55E"
                                      strokeWidth="2.5"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M5 13l4 4L19 7" strokeLinecap="round" />
                                    </svg>
                                  ) : (
                                    <span className="w-2.5 h-2.5 rounded-full border-[1.5px] border-gray-300 inline-block"></span>
                                  )}
                                  {r.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.key === "confirm" && passwordForm.confirmPassword && (
                          <p
                            className={`text-xs mt-1.5 flex items-center gap-1 font-bold ${
                              passwordForm.newPassword === passwordForm.confirmPassword
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {passwordForm.newPassword === passwordForm.confirmPassword ? (
                              <>
                                <svg
                                  width="12"
                                  height="12"
                                  fill="none"
                                  stroke="#22C55E"
                                  strokeWidth="2.5"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M5 13l4 4L19 7" strokeLinecap="round" />
                                </svg>{" "}
                                Passwords match
                              </>
                            ) : (
                              <>
                                <svg
                                  width="12"
                                  height="12"
                                  fill="none"
                                  stroke="#EF4444"
                                  strokeWidth="2.5"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    d="M18 6L6 18M6 6l12 12"
                                    strokeLinecap="round"
                                  />
                                </svg>{" "}
                                Passwords do not match
                              </>
                            )}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className={`mt-6 flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-extrabold text-white border-none cursor-pointer transition-all ${
                      changingPassword
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gray-900 hover:bg-gray-800"
                    }`}
                  >
                    {changingPassword && (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    )}
                    {changingPassword ? "Changing..." : "Update Password"}
                  </button>
                </form>
              </div>
            )}

            {activeSection === "addresses" && (
              <div className="animate-in fade-in">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <SectionHeader
                    title="Address Book"
                    subtitle={`${profile?.addresses?.length || 0} saved ${
                      profile?.addresses?.length === 1 ? "address" : "addresses"
                    }`}
                    gradientFrom="from-green-50"
                    extra={
                      !showAddressForm && (
                        <button
                          onClick={openAddAddress}
                          className="bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white border-none rounded-xl px-5 py-2.5 text-[13px] font-extrabold cursor-pointer shadow-lg shadow-orange-500/25 font-[inherit]"
                        >
                          + Add Address
                        </button>
                      )
                    }
                  />

                  {addressMsg && (
                    <div className="px-5 sm:px-7 pt-4">
                      <Alert type={addressMsg.type} text={addressMsg.text} />
                    </div>
                  )}

                  {showAddressForm && (
                    <div className="p-5 sm:p-7 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[15px] font-extrabold text-gray-900 m-0">
                          {editingAddressId ? "Edit Address" : "Add New Address"}
                        </h3>
                        <button
                          onClick={() => {
                            setShowAddressForm(false);
                            setEditingAddressId(null);
                            setAddressError("");
                          }}
                          className="bg-gray-100 border-none text-gray-700 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-gray-200 transition font-[inherit]"
                        >
                          Cancel
                        </button>
                      </div>
                      <form onSubmit={handleAddressSubmit}>
                        {addressError && <Alert type="error" text={addressError} />}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                          <div>
                            <Label required>Full Name</Label>
                            <Input
                              placeholder="John Doe"
                              value={addressForm.fullName}
                              onChange={(e) =>
                                setAddressForm((p) => ({ ...p, fullName: e.target.value }))
                              }
                            />
                          </div>
                          <div>
                            <Label required>Phone</Label>
                            <div className="relative">
                              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                <span className="text-xs font-extrabold text-gray-700">+91</span>
                                <div className="w-px h-4 bg-gray-300"></div>
                              </div>
                              <Input
                                className="pl-[54px]"
                                placeholder="9876543210"
                                value={addressForm.phone}
                                onChange={(e) =>
                                  setAddressForm((p) => ({ ...p, phone: e.target.value }))
                                }
                                maxLength={10}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="mb-3.5">
                          <Label required>Street Address</Label>
                          <Input
                            placeholder="House No, Building, Street, Area, Landmark"
                            value={addressForm.street}
                            onChange={(e) =>
                              setAddressForm((p) => ({ ...p, street: e.target.value }))
                            }
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-3.5">
                          <div>
                            <Label required>City</Label>
                            <Input
                              placeholder="Mumbai"
                              value={addressForm.city}
                              onChange={(e) =>
                                setAddressForm((p) => ({ ...p, city: e.target.value }))
                              }
                            />
                          </div>
                          <div>
                            <Label required>State</Label>
                            <select
                              value={addressForm.state}
                              onChange={(e) =>
                                setAddressForm((p) => ({ ...p, state: e.target.value }))
                              }
                              className="w-full border-[1.5px] border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 bg-gray-50 outline-none focus:border-[#D85A30] focus:bg-white transition cursor-pointer appearance-none font-[inherit]"
                            >
                              <option value="">Select</option>
                              {INDIAN_STATES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label required>PIN Code</Label>
                            <Input
                              placeholder="400001"
                              value={addressForm.postalCode}
                              onChange={(e) =>
                                setAddressForm((p) => ({ ...p, postalCode: e.target.value }))
                              }
                              maxLength={6}
                              className="font-mono tracking-widest font-semibold"
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2.5 cursor-pointer mb-5">
                          <input
                            type="checkbox"
                            checked={addressForm.isDefault}
                            onChange={(e) =>
                              setAddressForm((p) => ({ ...p, isDefault: e.target.checked }))
                            }
                            className="w-[17px] h-[17px] accent-[#D85A30] cursor-pointer"
                          />
                          <span className="text-[13px] text-gray-700 font-semibold">
                            Set as my default delivery address
                          </span>
                        </label>
                        <div className="flex gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressForm(false);
                              setEditingAddressId(null);
                              setAddressError("");
                            }}
                            className="px-5 py-3 rounded-xl text-sm font-bold text-gray-700 bg-white border-[1.5px] border-gray-200 cursor-pointer hover:bg-gray-50 transition font-[inherit]"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={addingAddress || updatingAddress}
                            className={`flex-1 py-3 rounded-xl text-sm font-extrabold text-white border-none cursor-pointer font-[inherit] transition-all ${
                              addingAddress || updatingAddress
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-[#D85A30] to-[#FF8C5A]"
                            }`}
                          >
                            {addingAddress || updatingAddress
                              ? "Saving..."
                              : editingAddressId
                              ? "Update Address"
                              : "Add Address"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="p-5 sm:p-7">
                    {profile?.addresses?.length === 0 && !showAddressForm && (
                      <div className="text-center py-10 px-5 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="text-4xl mb-3">📍</p>
                        <p className="text-[15px] font-extrabold text-gray-700 m-0">
                          No saved addresses
                        </p>
                        <p className="text-[13px] text-gray-500 mt-1 mb-4">
                          Add a delivery address to speed up checkout
                        </p>
                        <button
                          onClick={openAddAddress}
                          className="bg-gray-900 text-white border-none rounded-xl px-5 py-2.5 text-[13px] font-bold cursor-pointer font-[inherit]"
                        >
                          + Add First Address
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      {profile?.addresses?.map((address) => (
                        <div
                          key={address._id}
                          className={`rounded-2xl p-4 sm:p-5 border-[1.5px] transition-all ${
                            address.isDefault
                              ? "border-[#D85A30] bg-gradient-to-br from-orange-50 to-orange-50/30"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3.5">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-sm font-black text-gray-900 m-0">
                                  {address.fullName}
                                </p>
                                {address.isDefault && (
                                  <span className="text-[10px] bg-[#D85A30] text-white px-2.5 py-0.5 rounded-full font-black">
                                    ✓ Default
                                  </span>
                                )}
                              </div>
                              <p className="text-[13px] text-gray-700 m-0 mb-0.5 leading-relaxed">
                                {address.street}
                              </p>
                              <p className="text-[13px] text-gray-700 m-0 mb-0.5">
                                {address.city}, {address.state} — {address.postalCode}
                              </p>
                              <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                <svg
                                  width="12"
                                  height="12"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 .01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"
                                    strokeLinecap="round"
                                  />
                                </svg>
                                +91 {address.phone}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1.5 shrink-0">
                              <button
                                onClick={() => openEditAddress(address)}
                                className="bg-purple-100 text-purple-800 border border-purple-300 rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer hover:bg-purple-200 transition font-[inherit]"
                              >
                                ✏️ Edit
                              </button>
                              {!address.isDefault && (
                                <button
                                  onClick={() => handleSetDefault(address._id)}
                                  className="bg-orange-50 text-[#D85A30] border border-orange-200 rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer hover:bg-orange-100 transition font-[inherit]"
                                >
                                  Set Default
                                </button>
                              )}
                              {deletingAddressId === address._id ? (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleDeleteAddress(address._id)}
                                    className="flex-1 bg-red-500 text-white border-none rounded-lg py-1.5 px-2.5 text-xs font-bold cursor-pointer font-[inherit]"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setDeletingAddressId(null)}
                                    className="flex-1 bg-white text-gray-700 border border-gray-200 rounded-lg py-1.5 px-2.5 text-xs cursor-pointer font-[inherit]"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeletingAddressId(address._id)}
                                  className="bg-red-50 text-red-900 border border-red-200 rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer hover:bg-red-100 transition font-[inherit]"
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