import { useState } from "react";
import { useSelector } from "react-redux";
import {
  useAdminGetAllCouponsQuery,
  useAdminCreateCouponMutation,
  useAdminUpdateCouponMutation,
  useAdminDeleteCouponMutation,
  useAdminToggleCouponMutation,
} from "../../features/coupon/couponApi";
import { toast } from "../../components/Toast";

const AdminCouponsPage = () => {
  const { currentCountry } = useSelector((s) => s.country);
  const [filters, setFilters] = useState({ status: "", search: "", type: "" });
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const { data, isLoading, refetch } = useAdminGetAllCouponsQuery({ ...filters, page });
  const [createCoupon, { isLoading: creating }] = useAdminCreateCouponMutation();
  const [updateCoupon, { isLoading: updating }] = useAdminUpdateCouponMutation();
  const [deleteCoupon] = useAdminDeleteCouponMutation();
  const [toggleCoupon] = useAdminToggleCouponMutation();

  const coupons = data?.data || [];
  const stats = data?.stats || {};

  const initialForm = {
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    maxDiscountAmount: "",
    minOrderAmount: "",
    expiryDate: "",
    usageLimit: "",
    usageLimitPerUser: "1",
    firstTimeUserOnly: false,
    isPublic: true,
  };
  const [form, setForm] = useState(initialForm);

  const openCreate = () => {
    setEditingCoupon(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue || "",
      maxDiscountAmount: coupon.maxDiscountAmount || "",
      minOrderAmount: coupon.minOrderAmount || "",
      expiryDate: coupon.expiryDate?.split("T")[0] || "",
      usageLimit: coupon.usageLimit || "",
      usageLimitPerUser: coupon.usageLimitPerUser || 1,
      firstTimeUserOnly: coupon.firstTimeUserOnly,
      isPublic: coupon.isPublic,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue) || 0,
        maxDiscountAmount: Number(form.maxDiscountAmount) || null,
        minOrderAmount: Number(form.minOrderAmount) || 0,
        usageLimit: Number(form.usageLimit) || null,
        usageLimitPerUser: Number(form.usageLimitPerUser) || 1,
      };

      if (editingCoupon) {
        await updateCoupon({ id: editingCoupon._id, ...payload }).unwrap();
        toast.success("Coupon updated!");
      } else {
        await createCoupon(payload).unwrap();
        toast.success("Coupon created!");
      }
      setShowForm(false);
      setForm(initialForm);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save coupon");
    }
  };

  const handleDelete = async (id, code) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    try {
      await deleteCoupon(id).unwrap();
      toast.success("Coupon deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleCoupon(id).unwrap();
      toast.success("Status updated");
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  const getStatusBadge = (coupon) => {
    const now = new Date();
    if (!coupon.isActive) return { text: "Inactive", color: "bg-gray-100 text-gray-700" };
    if (new Date(coupon.expiryDate) < now)
      return { text: "Expired", color: "bg-red-100 text-red-700" };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
      return { text: "Fully Used", color: "bg-orange-100 text-orange-700" };
    return { text: "Active", color: "bg-green-100 text-green-700" };
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 m-0">
              🎟️ Coupon Management
            </h1>
            <p className="text-sm text-gray-500 mt-1 m-0">
              Create and manage promotional coupons
            </p>
          </div>
          <button
            onClick={openCreate}
            className="bg-gradient-to-r from-[#D85A30] to-[#e8734d] text-white px-5 py-2.5 rounded-xl font-bold text-sm border-none cursor-pointer hover:brightness-95 transition font-[inherit] shadow-md"
          >
            + Create Coupon
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Coupons", value: stats.totalCoupons || 0, icon: "🎟️", color: "orange" },
            { label: "Active Coupons", value: stats.activeCoupons || 0, icon: "✅", color: "green" },
            { label: "Total Usage", value: stats.totalUsage || 0, icon: "📊", color: "blue" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase m-0">{s.label}</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1 m-0">{s.value}</p>
                </div>
                <span className="text-3xl">{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search by code or description..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#D85A30] font-[inherit]"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm cursor-pointer font-[inherit]"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm cursor-pointer font-[inherit]"
            >
              <option value="">All Types</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-[#D85A30] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Loading coupons...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-5xl mb-3">🎟️</p>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No coupons yet</h3>
              <p className="text-gray-500 text-sm mb-5">Create your first coupon to boost sales</p>
              <button
                onClick={openCreate}
                className="bg-[#D85A30] text-white px-5 py-2.5 rounded-xl font-bold text-sm border-none cursor-pointer hover:brightness-95 font-[inherit]"
              >
                + Create Coupon
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Code</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Discount</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Min Order</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Usage</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Expiry</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => {
                    const badge = getStatusBadge(coupon);
                    return (
                      <tr key={coupon._id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm font-extrabold text-gray-900 m-0">{coupon.code}</p>
                            <p className="text-xs text-gray-400 m-0 mt-0.5 max-w-xs truncate">{coupon.description}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            {coupon.discountType === "percentage" && `${coupon.discountValue}% OFF`}
                            {coupon.discountType === "fixed" && `${currentCountry?.currency?.symbol || "₹"}${coupon.discountValue} OFF`}
                            {coupon.discountType === "free_shipping" && "FREE SHIP"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-700">
                            {currentCountry?.currency?.symbol || "₹"}{coupon.minOrderAmount || 0}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-700">
                            {coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs text-gray-500">
                            {new Date(coupon.expiryDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.color}`}>
                            {badge.text}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => handleToggle(coupon._id)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer border-none font-[inherit] ${
                                coupon.isActive
                                  ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                  : "bg-green-100 text-green-700 hover:bg-green-200"
                              }`}
                            >
                              {coupon.isActive ? "Disable" : "Enable"}
                            </button>
                            <button
                              onClick={() => openEdit(coupon)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer bg-blue-100 text-blue-700 hover:bg-blue-200 border-none font-[inherit]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(coupon._id, coupon.code)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer bg-red-100 text-red-700 hover:bg-red-200 border-none font-[inherit]"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-extrabold text-gray-900 m-0">
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-2xl text-gray-400 bg-transparent border-none cursor-pointer hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#D85A30] uppercase font-bold font-[inherit]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Get 20% off on your first order"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#D85A30] font-[inherit]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">
                    Discount Type *
                  </label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm cursor-pointer font-[inherit]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>

                {form.discountType !== "free_shipping" && (
                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      value={form.discountValue}
                      onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                      placeholder={form.discountType === "percentage" ? "20" : "100"}
                      min="0"
                      max={form.discountType === "percentage" ? "100" : ""}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#D85A30] font-[inherit]"
                    />
                  </div>
                )}

                {form.discountType === "percentage" && (
                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">
                      Max Discount Cap
                    </label>
                    <input
                      type="number"
                      value={form.maxDiscountAmount}
                      onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                      placeholder="500 (optional)"
                      min="0"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#D85A30] font-[inherit]"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">
                    Min Order Amount
                  </label>
                  <input
                    type="number"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                    placeholder="0"
                    min="0"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#D85A30] font-[inherit]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#D85A30] font-[inherit]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="Unlimited (leave empty)"
                    min="1"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#D85A30] font-[inherit]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">
                    Usage Limit Per User
                  </label>
                  <input
                    type="number"
                    value={form.usageLimitPerUser}
                    onChange={(e) => setForm({ ...form, usageLimitPerUser: e.target.value })}
                    placeholder="1"
                    min="1"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#D85A30] font-[inherit]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.firstTimeUserOnly}
                      onChange={(e) => setForm({ ...form, firstTimeUserOnly: e.target.checked })}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      🆕 First-time users only
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isPublic}
                      onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      🌐 Show publicly on cart page
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm cursor-pointer hover:bg-gray-50 font-[inherit] bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || updating}
                  className="flex-[2] bg-[#D85A30] text-white py-3 rounded-xl font-bold text-sm cursor-pointer disabled:opacity-70 hover:brightness-95 font-[inherit] border-none"
                >
                  {creating || updating
                    ? "Saving..."
                    : editingCoupon
                    ? "Update Coupon"
                    : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCouponsPage;