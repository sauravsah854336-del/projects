import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import {
  authApi,
  useLogoutMutation,
  useGetPendingVendorsQuery,
  useApproveVendorMutation,
  useRejectVendorMutation,
} from "../features/auth/authApi";
import {
  useGetCategoryTreeQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
} from "../features/category/categoryApi";
import {
  useAdminGetAllProductsQuery,
  useApproveProductMutation,
  useRejectProductMutation,
  useFeatureProductMutation,
} from "../features/product/productApi";
import {
  useAdminGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
} from "../features/order/orderApi";
import {
  useAdminGetAllReviewsQuery,
  useDeleteReviewMutation,
} from "../features/review/reviewApi";
import { useNavigate, useSearchParams } from "react-router-dom";

const formatRupee = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const StatusBadge = ({ status }) => {
  const map = {
    pending: { bg: "#FEF9C3", color: "#854D0E", label: "Pending" },
    processing: { bg: "#DBEAFE", color: "#1E40AF", label: "Processing" },
    shipped: { bg: "#EDE9FE", color: "#5B21B6", label: "Shipped" },
    out_for_delivery: { bg: "#FFEDD5", color: "#9A3412", label: "Out for Delivery" },
    delivered: { bg: "#DCFCE7", color: "#14532D", label: "Delivered" },
    cancelled: { bg: "#FEE2E2", color: "#7F1D1D", label: "Cancelled" },
    returned: { bg: "#F3F4F6", color: "#374151", label: "Returned" },
    refunded: { bg: "#FCE7F3", color: "#831843", label: "Refunded" },
    approved: { bg: "#DCFCE7", color: "#14532D", label: "Approved" },
    rejected: { bg: "#FEE2E2", color: "#7F1D1D", label: "Rejected" },
  };
  const s = map[status] || { bg: "#F3F4F6", color: "#374151", label: status };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

const InfoRow = ({ label, value, mono = false }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
    <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500, flexShrink: 0, marginRight: 16 }}>{label}</span>
    <span style={{ fontSize: 12, color: "#111", fontWeight: 600, textAlign: "right", fontFamily: mono ? "monospace" : "inherit", wordBreak: "break-all" }}>
      {value || "—"}
    </span>
  </div>
);

const DocPreview = ({ label, doc }) => {
  if (!doc?.url) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
      <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 11, color: "#9CA3AF", fontStyle: "italic" }}>Not uploaded</span>
    </div>
  );

  const isPdf = doc.url.endsWith(".pdf") || doc.filename?.endsWith(".pdf");

  return (
    <div style={{ padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
      <p style={{ fontSize: 12, color: "#6B7280", fontWeight: 500, margin: "0 0 6px" }}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {isPdf ? (
          <div style={{ width: 40, height: 40, background: "#FEF2F2", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" fill="none" stroke="#EF4444" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" />
              <path d="M14 2v6h6M9 13h6M9 17h4" strokeLinecap="round" />
            </svg>
          </div>
        ) : (
          <img
            src={doc.url}
            alt={label}
            style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", border: "1px solid #E5E7EB" }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )}
        <div>
          <p style={{ fontSize: 11, color: "#374151", margin: 0, fontWeight: 600 }}>{doc.filename || "Document"}</p>
          <a
            href={doc.url}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11, color: "#7C3AED", textDecoration: "none", fontWeight: 600 }}
          >
            View Document →
          </a>
        </div>
      </div>
    </div>
  );
};

const SectionTitle = ({ icon, title }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0 8px", marginTop: 8 }}>
    <span style={{ fontSize: 14 }}>{icon}</span>
    <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7C3AED" }}>{title}</span>
  </div>
);

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, refreshToken } = useSelector((state) => state.auth);
  const [logoutAPI, { isLoading: logoutLoading }] = useLogoutMutation();

  const { data: pendingData, isLoading: vendorsLoading } = useGetPendingVendorsQuery();
  const [approveVendor] = useApproveVendorMutation();
  const [rejectVendor] = useRejectVendorMutation();
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [expandedVendor, setExpandedVendor] = useState(null);

  const { data: categoryData, isLoading: categoriesLoading } = useGetCategoryTreeQuery();
  const [createCategory, { isLoading: creatingCategory }] = useCreateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [productStatusFilter, setProductStatusFilter] = useState("pending");
  const { data: productsData, isLoading: productsLoading } = useAdminGetAllProductsQuery({ status: productStatusFilter });
  const [approveProduct] = useApproveProductMutation();
  const [rejectProduct] = useRejectProductMutation();
  const [featureProduct] = useFeatureProductMutation();
  const [productRejectReason, setProductRejectReason] = useState("");
  const [productRejectingId, setProductRejectingId] = useState(null);
  const [expandedProduct, setExpandedProduct] = useState(null);

  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const { data: ordersData, isLoading: ordersLoading } = useAdminGetAllOrdersQuery({ status: orderStatusFilter, page: orderPage });
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const [reviewRatingFilter, setReviewRatingFilter] = useState(undefined);
  const [reviewSort, setReviewSort] = useState("newest");
  const [reviewPage, setReviewPage] = useState(1);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const { data: reviewsData, isLoading: reviewsLoading } = useAdminGetAllReviewsQuery({ rating: reviewRatingFilter, sort: reviewSort, page: reviewPage, limit: 10 });
  const [deleteReview] = useDeleteReviewMutation();

const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get("tab") || "vendors";
const setActiveTab = (tab) => {
  setSearchParams({ tab });
};
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", parent: "" });
  const [categoryError, setCategoryError] = useState("");

  const handleLogout = async () => {
    try {
      await logoutAPI({ refreshToken }).unwrap();
    } catch (err) {
      console.log(err);
    } finally {
      dispatch(authApi.util.resetApiState());
      dispatch(logout());
      navigate("/login");
    }
  };

  const handleApprove = async (vendorId) => {
    try {
      await approveVendor(vendorId).unwrap();
      setExpandedVendor(null);
    } catch (err) {
      console.log(err);
    }
  };

  const handleReject = async (vendorId) => {
    try {
      await rejectVendor({ vendorId, reason: rejectReason }).unwrap();
      setRejectingId(null);
      setRejectReason("");
      setExpandedVendor(null);
    } catch (err) {
      console.log(err);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCategoryError("");
    const name = categoryForm.name.trim();
    if (!name) { setCategoryError("Category name is required"); return; }
    try {
      await createCategory({ name, description: categoryForm.description.trim(), parent: categoryForm.parent || null }).unwrap();
      setCategoryForm({ name: "", description: "", parent: "" });
    } catch (err) {
      setCategoryError(err?.data?.message || "Failed to create category");
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategory(id).unwrap();
    } catch (err) {
      alert(err?.data?.message || "Failed to delete");
    }
  };

  const handleApproveProduct = async (id) => {
    try {
      await approveProduct(id).unwrap();
      setExpandedProduct(null);
    } catch (err) {
      console.log(err);
    }
  };

  const handleRejectProduct = async (id) => {
    try {
      await rejectProduct({ id, reason: productRejectReason }).unwrap();
      setProductRejectingId(null);
      setProductRejectReason("");
      setExpandedProduct(null);
    } catch (err) {
      console.log(err);
    }
  };

  const handleFeatureProduct = async (id) => {
    try {
      await featureProduct(id).unwrap();
    } catch (err) {
      console.log(err);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await updateOrderStatus({ id: orderId, status }).unwrap();
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview({ reviewId }).unwrap();
      setDeletingReviewId(null);
    } catch (err) {
      console.log(err);
    }
  };

  const tabs = [
    { key: "vendors", label: "Vendors", icon: "🏪" },
    { key: "categories", label: "Categories", icon: "📂" },
    { key: "products", label: "Products", icon: "📦" },
    { key: "orders", label: "Orders", icon: "🛒" },
    { key: "reviews", label: "Reviews", icon: "⭐" },
  ];

  return (
    <div style={{ background: "#F3F4F6", minHeight: "100vh", padding: "24px 16px" }}>
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .detail-panel { animation: slideDown 0.2s ease both; }
        .tab-btn { padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; transition: all 0.15s; display: flex; align-items: center; gap: 6px; }
        .tab-btn.active { background: #111; color: white; }
        .tab-btn.inactive { background: white; color: #374151; border: 1px solid #E5E7EB; }
        .tab-btn.inactive:hover { background: #F9FAFB; }
        .action-btn { padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; border: none; transition: all 0.15s; font-family: inherit; }
        .btn-approve { background: #DCFCE7; color: #14532D; border: 1px solid #86EFAC; }
        .btn-approve:hover { background: #22C55E; color: white; }
        .btn-reject { background: #FEE2E2; color: #7F1D1D; border: 1px solid #FCA5A5; }
        .btn-reject:hover { background: #EF4444; color: white; }
        .btn-view { background: #EDE9FE; color: #5B21B6; border: 1px solid #C4B5FD; }
        .btn-view:hover { background: #7C3AED; color: white; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#111", margin: 0 }}>Admin Dashboard</h1>
            <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>Welcome back, {user?.firstName}</p>
          </div>
          
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab-btn ${activeTab === tab.key ? "active" : "inactive"}`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "vendors" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0 }}>
                Pending Vendor Approvals
                {pendingData?.data?.length > 0 && (
                  <span style={{ marginLeft: 10, background: "#FEF9C3", color: "#854D0E", fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 99, border: "1px solid #FDE68A" }}>
                    {pendingData.data.length} pending
                  </span>
                )}
              </h2>
            </div>

            {vendorsLoading && (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ width: 28, height: 28, border: "3px solid #7C3AED", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 10px" }}></div>
                <p style={{ color: "#6B7280", fontSize: 13 }}>Loading vendors...</p>
              </div>
            )}

            {pendingData?.data?.length === 0 && !vendorsLoading && (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "white", borderRadius: 16, border: "1px solid #E5E7EB" }}>
                <p style={{ fontSize: 40, margin: "0 0 12px" }}>🎉</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: 0 }}>All caught up!</p>
                <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>No pending vendor applications</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pendingData?.data?.map((vendor) => (
                <div key={vendor._id} style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden" }}>
                  <div style={{ padding: "18px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                    <div style={{ display: "flex", gap: 14, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 48, height: 48, background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, border: "1px solid #DDD6FE" }}>
                        🏪
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111", margin: 0 }}>{vendor.storeName}</h3>
                          {vendor.businessType && (
                            <span style={{ fontSize: 10, background: "#EDE9FE", color: "#5B21B6", padding: "2px 8px", borderRadius: 99, fontWeight: 700, textTransform: "capitalize" }}>
                              {vendor.businessType.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 13, color: "#374151", fontWeight: 600, margin: "0 0 2px" }}>
                          {vendor.userId?.firstName} {vendor.userId?.lastName}
                        </p>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, color: "#6B7280" }}>📧 {vendor.userId?.email}</span>
                          <span style={{ fontSize: 12, color: "#6B7280" }}>📱 {vendor.userId?.phone}</span>
                        </div>
                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: "4px 0 0" }}>
                          Applied on {formatDate(vendor.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => setExpandedVendor(expandedVendor === vendor._id ? null : vendor._id)}
                        className="action-btn btn-view"
                      >
                        {expandedVendor === vendor._id ? "▲ Hide Details" : "▼ View Details"}
                      </button>
                      <button onClick={() => handleApprove(vendor._id)} className="action-btn btn-approve">
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => setRejectingId(rejectingId === vendor._id ? null : vendor._id)}
                        className="action-btn btn-reject"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>

                  {rejectingId === vendor._id && (
                    <div style={{ padding: "12px 20px", background: "#FEF2F2", borderTop: "1px solid #FECACA" }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", margin: "0 0 8px" }}>
                        ⚠️ Provide a reason for rejection (will be shown to vendor)
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="text"
                          placeholder="e.g. Documents unclear, Invalid PAN number..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          style={{ flex: 1, border: "1px solid #FECACA", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }}
                        />
                        <button
                          onClick={() => handleReject(vendor._id)}
                          style={{ background: "#EF4444", color: "white", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        >
                          Confirm Rejection
                        </button>
                        <button
                          onClick={() => setRejectingId(null)}
                          style={{ background: "white", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {expandedVendor === vendor._id && (
                    <div className="detail-panel" style={{ borderTop: "1px solid #E5E7EB", padding: "20px", background: "#FAFAFA" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>

                        <div style={{ background: "white", borderRadius: 12, padding: "16px", border: "1px solid #E5E7EB" }}>
                          <SectionTitle icon="👤" title="Personal & Business" />
                          <InfoRow label="Full Name" value={`${vendor.userId?.firstName} ${vendor.userId?.lastName}`} />
                          <InfoRow label="Email" value={vendor.userId?.email} />
                          <InfoRow label="Phone" value={vendor.userId?.phone} />
                          <InfoRow label="Store Name" value={vendor.storeName} />
                          <InfoRow label="Business Type" value={vendor.businessType?.replace(/_/g, " ")} />
                          {vendor.storeDescription && (
                            <div style={{ padding: "8px 0" }}>
                              <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Description</span>
                              <p style={{ fontSize: 12, color: "#374151", margin: "4px 0 0", lineHeight: 1.6 }}>{vendor.storeDescription}</p>
                            </div>
                          )}
                        </div>

                        <div style={{ background: "white", borderRadius: 12, padding: "16px", border: "1px solid #E5E7EB" }}>
                          <SectionTitle icon="📋" title="Tax & Bank Details" />
                          <InfoRow label="PAN Number" value={vendor.panNumber} mono />
                          <InfoRow label="GST Number" value={vendor.gstNumber} mono />
                          <div style={{ height: 8 }}></div>
                          <InfoRow label="Account Holder" value={vendor.bankDetails?.accountHolderName} />
                          <InfoRow label="Bank Name" value={vendor.bankDetails?.bankName} />
                          <InfoRow label="Account Number" value={vendor.bankDetails?.accountNumber ? `••••${vendor.bankDetails.accountNumber.slice(-4)}` : "—"} mono />
                          <InfoRow label="IFSC Code" value={vendor.bankDetails?.ifscCode} mono />
                          <InfoRow label="Account Type" value={vendor.bankDetails?.accountType} />
                        </div>

                        <div style={{ background: "white", borderRadius: 12, padding: "16px", border: "1px solid #E5E7EB" }}>
                          <SectionTitle icon="📍" title="Business Address" />
                          <InfoRow label="Street" value={vendor.businessAddress?.street} />
                          <InfoRow label="City" value={vendor.businessAddress?.city} />
                          <InfoRow label="State" value={vendor.businessAddress?.state} />
                          <InfoRow label="PIN Code" value={vendor.businessAddress?.postalCode} mono />
                          <InfoRow label="Country" value={vendor.businessAddress?.country} />
                        </div>
                      </div>

                      <div style={{ marginTop: 16, background: "white", borderRadius: 12, padding: "16px", border: "1px solid #E5E7EB" }}>
                        <SectionTitle icon="📁" title="Uploaded Documents" />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
                          <DocPreview label="PAN Card" doc={vendor.panDocument} />
                          <DocPreview label="GST Certificate" doc={vendor.gstDocument} />
                          <DocPreview label="Business Registration" doc={vendor.businessRegistrationDoc} />
                          <DocPreview label="Cancelled Cheque" doc={vendor.cancelledCheque} />
                        </div>
                      </div>

                      <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setRejectingId(rejectingId === vendor._id ? null : vendor._id)}
                          className="action-btn btn-reject"
                          style={{ padding: "10px 20px", fontSize: 13 }}
                        >
                          ✕ Reject Application
                        </button>
                        <button
                          onClick={() => handleApprove(vendor._id)}
                          className="action-btn btn-approve"
                          style={{ padding: "10px 24px", fontSize: 13 }}
                        >
                          ✓ Approve Vendor
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", padding: "24px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 20px" }}>Category Management</h2>
            <form onSubmit={handleCreateCategory} style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="text"
                placeholder="Category Name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }}
              />
              <select
                value={categoryForm.parent}
                onChange={(e) => setCategoryForm({ ...categoryForm, parent: e.target.value })}
                style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }}
              >
                <option value="">No Parent (Main Category)</option>
                {categoryData?.data?.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              {categoryError && <p style={{ color: "#EF4444", fontSize: 12, margin: 0 }}>{categoryError}</p>}
              <button
                type="submit"
                disabled={creatingCategory}
                style={{ background: "#111", color: "white", border: "none", borderRadius: 10, padding: "11px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                {creatingCategory ? "Creating..." : "Create Category"}
              </button>
            </form>

            {categoriesLoading && <p style={{ color: "#6B7280" }}>Loading...</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {categoryData?.data?.map((cat) => (
                <div key={cat._id} style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: 0 }}>{cat.name}</h3>
                    <button onClick={() => handleDeleteCategory(cat._id)} style={{ background: "#FEE2E2", color: "#7F1D1D", border: "1px solid #FCA5A5", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Delete
                    </button>
                  </div>
                  {cat.children?.length > 0 && (
                    <div style={{ marginTop: 10, marginLeft: 20, borderLeft: "2px solid #E5E7EB", paddingLeft: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                      {cat.children.map((sub) => (
                        <div key={sub._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>{sub.name}</p>
                          <button onClick={() => handleDeleteCategory(sub._id)} style={{ background: "#FEE2E2", color: "#7F1D1D", border: "1px solid #FCA5A5", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0 }}>Product Management</h2>
              <div style={{ display: "flex", gap: 6 }}>
                {["pending", "approved", "rejected"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setProductStatusFilter(status)}
                    style={{
                      padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                      cursor: "pointer", border: "none", textTransform: "capitalize",
                      background: productStatusFilter === status ? "#111" : "white",
                      color: productStatusFilter === status ? "white" : "#374151",
                      border: productStatusFilter === status ? "none" : "1px solid #E5E7EB",
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {productsLoading && (
              <div style={{ textAlign: "center", padding: 40 }}>
                <p style={{ color: "#6B7280", fontSize: 13 }}>Loading products...</p>
              </div>
            )}

            {productsData?.data?.length === 0 && !productsLoading && (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "white", borderRadius: 16, border: "1px solid #E5E7EB" }}>
                <p style={{ fontSize: 36, margin: "0 0 12px" }}>📦</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>No {productStatusFilter} products</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {productsData?.data?.map((product) => (
                <div key={product._id} style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <img
                      src={product.images?.[0]?.url || "https://placehold.co/80?text=No+Image"}
                      alt={product.name}
                      style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: "1px solid #E5E7EB", flexShrink: 0 }}
                      onError={(e) => { e.target.src = "https://placehold.co/80?text=No+Image"; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>{product.name}</h3>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "#6B7280" }}>📂 {product.category?.name}</span>
                            <span style={{ fontSize: 12, color: "#6B7280" }}>🏪 {product.vendor?.firstName} {product.vendor?.lastName}</span>
                            {product.brand && <span style={{ fontSize: 12, color: "#6B7280" }}>🏷️ {product.brand}</span>}
                          </div>
                          <div style={{ display: "flex", gap: 12, marginTop: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: "#B12704" }}>{formatRupee(product.price)}</span>
                            {product.comparePrice > 0 && (
                              <span style={{ fontSize: 12, color: "#9CA3AF", textDecoration: "line-through" }}>{formatRupee(product.comparePrice)}</span>
                            )}
                            <span style={{ fontSize: 12, color: "#6B7280" }}>Stock: {product.stock}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                          <StatusBadge status={product.status} />
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button
                              onClick={() => setExpandedProduct(expandedProduct === product._id ? null : product._id)}
                              className="action-btn btn-view"
                            >
                              {expandedProduct === product._id ? "▲ Hide" : "▼ Details"}
                            </button>
                            {product.status === "pending" && (
                              <>
                                <button onClick={() => handleApproveProduct(product._id)} className="action-btn btn-approve">
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() => setProductRejectingId(productRejectingId === product._id ? null : product._id)}
                                  className="action-btn btn-reject"
                                >
                                  ✕ Reject
                                </button>
                              </>
                            )}
                            {product.status === "approved" && (
                              <button
                                onClick={() => handleFeatureProduct(product._id)}
                                style={{
                                  padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                                  cursor: "pointer", border: "none",
                                  background: product.isFeatured ? "#FEF9C3" : "#F3F4F6",
                                  color: product.isFeatured ? "#854D0E" : "#374151",
                                  border: product.isFeatured ? "1px solid #FDE68A" : "1px solid #E5E7EB",
                                }}
                              >
                                {product.isFeatured ? "★ Featured" : "☆ Feature"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {productRejectingId === product._id && (
                    <div style={{ padding: "12px 20px", background: "#FEF2F2", borderTop: "1px solid #FECACA" }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", margin: "0 0 8px" }}>
                        ⚠️ Provide a reason for rejection (will be shown to vendor)
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="text"
                          placeholder="e.g. Images unclear, Description misleading..."
                          value={productRejectReason}
                          onChange={(e) => setProductRejectReason(e.target.value)}
                          style={{ flex: 1, border: "1px solid #FECACA", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }}
                        />
                        <button
                          onClick={() => handleRejectProduct(product._id)}
                          style={{ background: "#EF4444", color: "white", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        >
                          Confirm Rejection
                        </button>
                        <button
                          onClick={() => setProductRejectingId(null)}
                          style={{ background: "white", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {product.status === "rejected" && product.rejectionReason && (
                    <div style={{ padding: "10px 20px", background: "#FEF2F2", borderTop: "1px solid #FECACA" }}>
                      <p style={{ fontSize: 12, color: "#DC2626", margin: 0, fontWeight: 600 }}>
                        Rejection Reason: {product.rejectionReason}
                      </p>
                    </div>
                  )}

                  {expandedProduct === product._id && (
                    <div className="detail-panel" style={{ borderTop: "1px solid #E5E7EB", padding: "20px", background: "#FAFAFA" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

                        <div style={{ background: "white", borderRadius: 12, padding: "16px", border: "1px solid #E5E7EB" }}>
                          <SectionTitle icon="📦" title="Product Information" />
                          <InfoRow label="Name" value={product.name} />
                          <InfoRow label="Category" value={product.category?.name} />
                          <InfoRow label="Brand" value={product.brand} />
                          <InfoRow label="SKU" value={product.sku} mono />
                          <InfoRow label="Price" value={formatRupee(product.price)} />
                          <InfoRow label="Compare Price" value={product.comparePrice > 0 ? formatRupee(product.comparePrice) : "—"} />
                          <InfoRow label="Stock" value={product.stock} />
                          <InfoRow label="Low Stock Alert" value={product.lowStockThreshold} />
                          <InfoRow label="Weight" value={product.weight ? `${product.weight}g` : "—"} />
                          {product.shortDescription && (
                            <div style={{ padding: "8px 0" }}>
                              <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Short Description</span>
                              <p style={{ fontSize: 12, color: "#374151", margin: "4px 0 0", lineHeight: 1.6 }}>{product.shortDescription}</p>
                            </div>
                          )}
                        </div>

                        <div style={{ background: "white", borderRadius: 12, padding: "16px", border: "1px solid #E5E7EB" }}>
                          <SectionTitle icon="🏪" title="Vendor Information" />
                          <InfoRow label="Vendor Name" value={`${product.vendor?.firstName} ${product.vendor?.lastName}`} />
                          <InfoRow label="Vendor Email" value={product.vendor?.email} />
                          <InfoRow label="Store Name" value={product.vendorStore?.storeName} />
                          <InfoRow label="Status" value={product.status} />
                          <InfoRow label="Featured" value={product.isFeatured ? "Yes" : "No"} />
                          <InfoRow label="Total Views" value={product.views} />
                          <InfoRow label="Total Sold" value={product.totalSold} />
                          <InfoRow label="Avg Rating" value={product.averageRating > 0 ? `${product.averageRating} ⭐` : "No reviews"} />
                          <InfoRow label="Listed On" value={formatDate(product.createdAt)} />

                          {product.specifications?.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <SectionTitle icon="📋" title="Specifications" />
                              {product.specifications.map((spec, i) => (
                                <InfoRow key={i} label={spec.key} value={spec.value} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {product.description && (
                        <div style={{ background: "white", borderRadius: 12, padding: "16px", border: "1px solid #E5E7EB", marginBottom: 16 }}>
                          <SectionTitle icon="📝" title="Full Description" />
                          <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.7, whiteSpace: "pre-line" }}>{product.description}</p>
                        </div>
                      )}

                      {product.images?.length > 0 && (
                        <div style={{ background: "white", borderRadius: 12, padding: "16px", border: "1px solid #E5E7EB", marginBottom: 16 }}>
                          <SectionTitle icon="🖼️" title="Product Images" />
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {product.images.map((img, i) => (
                              <a key={i} href={img.url} target="_blank" rel="noreferrer">
                                <img
                                  src={img.url}
                                  alt={`Product ${i + 1}`}
                                  style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 10, border: "1px solid #E5E7EB", cursor: "pointer" }}
                                  onError={(e) => { e.target.src = "https://placehold.co/90?text=Img"; }}
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {product.tags?.length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {product.tags.map((tag) => (
                            <span key={tag} style={{ background: "#F3F4F6", color: "#374151", fontSize: 11, padding: "4px 10px", borderRadius: 99, fontWeight: 600 }}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {product.status === "pending" && (
                        <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                          <button
                            onClick={() => setProductRejectingId(productRejectingId === product._id ? null : product._id)}
                            className="action-btn btn-reject"
                            style={{ padding: "10px 20px", fontSize: 13 }}
                          >
                            ✕ Reject Product
                          </button>
                          <button
                            onClick={() => handleApproveProduct(product._id)}
                            className="action-btn btn-approve"
                            style={{ padding: "10px 24px", fontSize: 13 }}
                          >
                            ✓ Approve Product
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", padding: "24px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 16px" }}>Order Management</h2>
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {[
                { label: "All", value: "" },
                { label: "Pending", value: "pending" },
                { label: "Processing", value: "processing" },
                { label: "Shipped", value: "shipped" },
                { label: "Delivered", value: "delivered" },
                { label: "Cancelled", value: "cancelled" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => { setOrderStatusFilter(item.value); setOrderPage(1); }}
                  style={{
                    padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    cursor: "pointer",
                    background: orderStatusFilter === item.value ? "#111" : "white",
                    color: orderStatusFilter === item.value ? "white" : "#374151",
                    border: orderStatusFilter === item.value ? "none" : "1px solid #E5E7EB",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {ordersLoading && <p style={{ color: "#6B7280" }}>Loading...</p>}
            {ordersData?.data?.length === 0 && <p style={{ color: "#6B7280" }}>No orders found</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {ordersData?.data?.map((order) => (
                <div key={order._id} style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    <div>
                      <p style={{ fontWeight: 800, color: "#111", margin: 0, fontSize: 14 }}>{order.orderNumber}</p>
                      <p style={{ fontSize: 12, color: "#6B7280", margin: "2px 0 0" }}>
                        {order.user?.firstName} {order.user?.lastName} • {order.user?.email}
                      </p>
                      <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <StatusBadge status={order.orderStatus} />
                      <p style={{ fontSize: 18, fontWeight: 800, color: "#B12704", margin: "6px 0 0" }}>{formatRupee(order.total)}</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    {order.items?.map((item, index) => (
                      <div key={index} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <img
                          src={item.image || "https://placehold.co/44?text=P"}
                          alt={item.name}
                          style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, border: "1px solid #E5E7EB", flexShrink: 0 }}
                          onError={(e) => { e.target.src = "https://placehold.co/44?text=P"; }}
                        />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#111", margin: 0 }}>{item.name}</p>
                          <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>
                            Qty: {item.quantity} • {formatRupee(item.price * item.quantity)} • {item.storeName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 12 }}>
                    <p style={{ fontWeight: 700, color: "#374151", margin: "0 0 4px" }}>Ship to:</p>
                    <p style={{ color: "#6B7280", margin: 0 }}>
                      {order.shippingAddress?.fullName}, {order.shippingAddress?.phone} • {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
                    </p>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, paddingTop: 10, borderTop: "1px solid #F3F4F6" }}>
                    <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
                      Payment: <strong>{order.paymentMethod === "cod" ? "Cash on Delivery" : "Online"}</strong>
                      {" • "}
                      <span style={{ color: order.paymentStatus === "paid" ? "#16A34A" : "#D97706", fontWeight: 700 }}>
                        {order.paymentStatus}
                      </span>
                    </p>
                    {!["cancelled", "delivered", "refunded"].includes(order.orderStatus) && (
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                        style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: "7px 12px", fontSize: 12, outline: "none" }}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                  </div>

                  {order.cancelReason && (
                    <div style={{ marginTop: 8, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px" }}>
                      <p style={{ fontSize: 11, color: "#DC2626", margin: 0, fontWeight: 600 }}>Cancel Reason: {order.cancelReason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {ordersData?.pagination && ordersData.pagination.pages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
                <button onClick={() => setOrderPage((p) => Math.max(1, p - 1))} disabled={orderPage === 1} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, cursor: "pointer", opacity: orderPage === 1 ? 0.4 : 1 }}>
                  ← Prev
                </button>
                {Array.from({ length: ordersData.pagination.pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setOrderPage(p)}
                    style={{ padding: "8px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", background: orderPage === p ? "#111" : "white", color: orderPage === p ? "white" : "#111", border: orderPage === p ? "none" : "1px solid #E5E7EB" }}
                  >
                    {p}
                  </button>
                ))}
                <button onClick={() => setOrderPage((p) => Math.min(ordersData.pagination.pages, p + 1))} disabled={orderPage === ordersData.pagination.pages} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, cursor: "pointer", opacity: orderPage === ordersData.pagination.pages ? 0.4 : 1 }}>
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", padding: "24px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 16px" }}>Review Management</h2>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
              <select
                value={reviewSort}
                onChange={(e) => { setReviewSort(e.target.value); setReviewPage(1); }}
                style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}
              >
                <option value="newest">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[5, 4, 3, 2, 1].map((star) => (
                  <button
                    key={star}
                    onClick={() => { setReviewRatingFilter(reviewRatingFilter === star ? undefined : star); setReviewPage(1); }}
                    style={{
                      padding: "7px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      background: reviewRatingFilter === star ? "#111" : "white",
                      color: reviewRatingFilter === star ? "white" : "#374151",
                      border: reviewRatingFilter === star ? "none" : "1px solid #E5E7EB",
                    }}
                  >
                    {star} ★
                  </button>
                ))}
                {reviewRatingFilter && (
                  <button onClick={() => { setReviewRatingFilter(undefined); setReviewPage(1); }} style={{ padding: "7px 12px", fontSize: 12, color: "#6B7280", background: "transparent", border: "none", cursor: "pointer" }}>
                    Clear
                  </button>
                )}
              </div>
            </div>

            {reviewsLoading && <p style={{ color: "#6B7280" }}>Loading...</p>}
            {reviewsData?.data?.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <p style={{ fontSize: 36, margin: "0 0 12px" }}>💬</p>
                <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>No reviews found</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reviewsData?.data?.map((review) => (
                <div key={review._id} style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700, fontSize: 14, color: "#374151" }}>
                        {review.user?.firstName?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 13, color: "#111", margin: 0 }}>
                          {review.user?.firstName} {review.user?.lastName}
                        </p>
                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0" }}>{review.user?.email}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ display: "flex" }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span key={s} style={{ color: s <= review.rating ? "#F59E0B" : "#E5E7EB", fontSize: 13 }}>★</span>
                            ))}
                          </div>
                          {review.isVerifiedPurchase && (
                            <span style={{ fontSize: 10, background: "#DCFCE7", color: "#14532D", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>
                              ✓ Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>{formatDate(review.createdAt)}</p>
                      {deletingReviewId === review._id ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => handleDeleteReview(review._id)} style={{ background: "#EF4444", color: "white", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            Confirm
                          </button>
                          <button onClick={() => setDeletingReviewId(null)} style={{ background: "white", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 10px", fontSize: 11, cursor: "pointer" }}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeletingReviewId(review._id)} style={{ background: "#FEE2E2", color: "#7F1D1D", border: "1px solid #FCA5A5", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: 12, paddingLeft: 52 }}>
                    {review.product && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        {review.product?.images?.[0] && (
                          <img src={review.product.images[0].url} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} />
                        )}
                        <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>{review.product?.name}</span>
                      </div>
                    )}
                    {review.title && <p style={{ fontWeight: 700, fontSize: 13, color: "#111", margin: "0 0 4px" }}>{review.title}</p>}
                    {review.body && <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.6 }}>{review.body}</p>}
                    {review.images?.length > 0 && (
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        {review.images.map((img, i) => (
                          <img key={i} src={img.url} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", border: "1px solid #E5E7EB" }} />
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: 11, color: "#9CA3AF", margin: "6px 0 0" }}>
                      👍 {review.helpfulVotes?.length || 0} found helpful
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {reviewsData?.pagination && reviewsData.pagination.pages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
                <button onClick={() => setReviewPage((p) => Math.max(1, p - 1))} disabled={reviewPage === 1} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, cursor: "pointer", opacity: reviewPage === 1 ? 0.4 : 1 }}>
                  ← Prev
                </button>
                {Array.from({ length: reviewsData.pagination.pages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setReviewPage(p)} style={{ padding: "8px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", background: reviewPage === p ? "#111" : "white", color: reviewPage === p ? "white" : "#111", border: reviewPage === p ? "none" : "1px solid #E5E7EB" }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setReviewPage((p) => Math.min(reviewsData.pagination.pages, p + 1))} disabled={reviewPage === reviewsData.pagination.pages} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, cursor: "pointer", opacity: reviewPage === reviewsData.pagination.pages ? 0.4 : 1 }}>
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminDashboard;