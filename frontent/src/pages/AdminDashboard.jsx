import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import {
  authApi, useLogoutMutation, useGetPendingVendorsQuery,
  useApproveVendorMutation, useRejectVendorMutation,
} from "../features/auth/authApi";
import {
  useGetCategoryTreeQuery, useCreateCategoryMutation, useDeleteCategoryMutation,
} from "../features/category/categoryApi";
import {
  useAdminGetAllProductsQuery, useApproveProductMutation,
  useRejectProductMutation, useFeatureProductMutation,
} from "../features/product/productApi";
import {
  useAdminGetAllOrdersQuery, useUpdateOrderStatusMutation,
} from "../features/order/orderApi";
import {
  useAdminGetAllReviewsQuery, useDeleteReviewMutation,
} from "../features/review/reviewApi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "../components/Toast";

const formatRupee = (amt) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amt);

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const statusMap = {
  pending: "bg-yellow-100 text-yellow-800", processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800", out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800",
  returned: "bg-gray-100 text-gray-700", refunded: "bg-pink-100 text-pink-800",
  approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800",
};

const statusLabel = {
  pending: "Pending", processing: "Processing", shipped: "Shipped",
  out_for_delivery: "Out for Delivery", delivered: "Delivered",
  cancelled: "Cancelled", returned: "Returned", refunded: "Refunded",
  approved: "Approved", rejected: "Rejected",
};

const Badge = ({ status }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusMap[status] || "bg-gray-100 text-gray-700"}`}>
    {statusLabel[status] || status}
  </span>
);

const InfoRow = ({ label, value, mono }) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-100">
    <span className="text-xs text-gray-500 font-medium shrink-0 mr-4">{label}</span>
    <span className={`text-xs text-gray-900 font-semibold text-right break-all ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
  </div>
);

const SecTitle = ({ icon, title }) => (
  <div className="flex items-center gap-2 pt-3 pb-2 mt-2">
    <span className="text-sm">{icon}</span>
    <span className="text-[10px] font-black uppercase tracking-[0.08em] text-purple-700">{title}</span>
  </div>
);

const DocPreview = ({ label, doc }) => {
  if (!doc?.url) return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-[11px] text-gray-400 italic">Not uploaded</span>
    </div>
  );
  const isPdf = doc.url.endsWith(".pdf") || doc.filename?.endsWith(".pdf");
  return (
    <div className="py-2 border-b border-gray-100">
      <p className="text-xs text-gray-500 font-medium mb-1.5 m-0">{label}</p>
      <div className="flex items-center gap-2.5">
        {isPdf ? (
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
            <svg width="18" height="18" fill="none" stroke="#EF4444" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" /><path d="M14 2v6h6M9 13h6M9 17h4" strokeLinecap="round" /></svg>
          </div>
        ) : (
          <img src={doc.url} alt={label} className="w-10 h-10 rounded-lg object-cover border border-gray-200" onError={(e) => { e.target.style.display = "none"; }} />
        )}
        <div>
          <p className="text-[11px] text-gray-700 font-semibold m-0">{doc.filename || "Document"}</p>
          <a href={doc.url} target="_blank" rel="noreferrer" className="text-[11px] text-purple-700 font-semibold no-underline hover:underline">View Document →</a>
        </div>
      </div>
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border transition-all font-[inherit] ${active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
  >
    <span>{icon}</span>{label}
  </button>
);

const FilterBtn = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer border transition-all capitalize font-[inherit] ${active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
  >
    {children}
  </button>
);

const ActionBtn = ({ variant = "view", onClick, children, className = "" }) => {
  const cls = {
    approve: "bg-green-100 text-green-800 border-green-200 hover:bg-green-500 hover:text-white",
    reject: "bg-red-100 text-red-800 border-red-200 hover:bg-red-500 hover:text-white",
    view: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-600 hover:text-white",
    delete: "bg-red-50 text-red-800 border-red-200 hover:bg-red-100",
  };
  return (
    <button onClick={onClick} className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer border transition-all font-[inherit] ${cls[variant]} ${className}`}>
      {children}
    </button>
  );
};

const PageBtn = ({ active, onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all font-[inherit] disabled:opacity-40 disabled:cursor-not-allowed ${active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"}`}
  >
    {children}
  </button>
);

const EmptyState = ({ icon, title, subtitle }) => (
  <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
    <p className="text-4xl mb-3">{icon}</p>
    <p className="text-base font-bold text-gray-900 m-0">{title}</p>
    {subtitle && <p className="text-[13px] text-gray-500 mt-1 m-0">{subtitle}</p>}
  </div>
);

const Spinner = ({ text }) => (
  <div className="text-center py-10">
    <div className="w-7 h-7 border-[3px] border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
    <p className="text-gray-500 text-[13px] m-0">{text}</p>
  </div>
);

const RejectPanel = ({ show, reason, setReason, onConfirm, onCancel }) => {
  if (!show) return null;
  return (
    <div className="px-5 py-3 bg-red-50 border-t border-red-200">
      <p className="text-xs font-bold text-red-600 mb-2 m-0">⚠️ Provide a reason for rejection</p>
      <div className="flex gap-2">
        <input type="text" placeholder="e.g. Documents unclear..." value={reason} onChange={(e) => setReason(e.target.value)}
          className="flex-1 border border-red-200 rounded-lg px-3 py-2.5 text-[13px] outline-none focus:border-red-400 bg-white font-[inherit]"
        />
        <button onClick={onConfirm} className="bg-red-500 text-white border-none rounded-lg px-4 py-2.5 text-xs font-bold cursor-pointer font-[inherit]">
          Confirm
        </button>
        <button onClick={onCancel} className="bg-white text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-semibold cursor-pointer font-[inherit]">
          Cancel
        </button>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, refreshToken } = useSelector((state) => state.auth);
  const [logoutAPI] = useLogoutMutation();

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
  const setActiveTab = (tab) => setSearchParams({ tab });
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", parent: "" });
  const [categoryError, setCategoryError] = useState("");

  const handleLogout = async () => {
    try { await logoutAPI({ refreshToken }).unwrap(); } catch (err) { console.log(err); }
    finally { dispatch(authApi.util.resetApiState()); dispatch(logout()); navigate("/login"); }
  };

  const handleApprove = async (vendorId) => { try { await approveVendor(vendorId).unwrap(); setExpandedVendor(null); toast.success("Vendor approved!"); } catch (err) { toast.error("Failed to approve vendor"); } };
  const handleReject = async (vendorId) => { try { await rejectVendor({ vendorId, reason: rejectReason }).unwrap(); setRejectingId(null); setRejectReason(""); setExpandedVendor(null); toast.success("Vendor rejected"); } catch (err) { toast.error("Failed to reject vendor"); } };
  const handleCreateCategory = async (e) => { e.preventDefault(); setCategoryError(""); if (!categoryForm.name.trim()) { setCategoryError("Category name is required"); return; } try { await createCategory({ name: categoryForm.name.trim(), description: categoryForm.description.trim(), parent: categoryForm.parent || null }).unwrap(); setCategoryForm({ name: "", description: "", parent: "" }); toast.success("Category created!"); } catch (err) { setCategoryError(err?.data?.message || "Failed to create category"); } };
  const handleDeleteCategory = async (id) => { try { await deleteCategory(id).unwrap(); toast.success("Category deleted"); } catch (err) { toast.error(err?.data?.message || "Failed to delete"); } };
  const handleApproveProduct = async (id) => { try { await approveProduct(id).unwrap(); setExpandedProduct(null); toast.success("Product approved!"); } catch (err) { toast.error("Failed to approve product"); } };
  const handleRejectProduct = async (id) => { try { await rejectProduct({ id, reason: productRejectReason }).unwrap(); setProductRejectingId(null); setProductRejectReason(""); setExpandedProduct(null); toast.success("Product rejected"); } catch (err) { toast.error("Failed to reject product"); } };
  const handleFeatureProduct = async (id) => { try { await featureProduct(id).unwrap(); toast.success("Feature status toggled"); } catch (err) { toast.error("Failed to toggle feature"); } };
  const handleUpdateOrderStatus = async (orderId, status) => { try { await updateOrderStatus({ id: orderId, status }).unwrap(); toast.success(`Order status updated to ${status}`); } catch (err) { toast.error("Failed to update order status"); } };
  const handleDeleteReview = async (reviewId) => { try { await deleteReview({ reviewId }).unwrap(); setDeletingReviewId(null); toast.success("Review deleted"); } catch (err) { toast.error("Failed to delete review"); } };

  const tabs = [
    { key: "vendors", label: "Vendors", icon: "🏪" },
    { key: "categories", label: "Categories", icon: "📂" },
    { key: "products", label: "Products", icon: "📦" },
    { key: "orders", label: "Orders", icon: "🛒" },
    { key: "reviews", label: "Reviews", icon: "⭐" },
  ];

  return (
    <div className="bg-gray-100 min-h-screen py-5 sm:py-6 px-3 sm:px-4">
      <div className="max-w-[1100px] mx-auto">

        <div className="flex items-center justify-between mb-6 sm:mb-7">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 m-0">Admin Dashboard</h1>
            <p className="text-[13px] text-gray-500 mt-1 m-0">Welcome back, {user?.firstName}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((tab) => (
            <TabBtn key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} icon={tab.icon} label={tab.label} />
          ))}
        </div>

        {activeTab === "vendors" && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-lg font-extrabold text-gray-900 m-0 flex items-center gap-2.5">
                Pending Vendor Approvals
                {pendingData?.data?.length > 0 && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-yellow-200">
                    {pendingData.data.length} pending
                  </span>
                )}
              </h2>
            </div>

            {vendorsLoading && <Spinner text="Loading vendors..." />}
            {pendingData?.data?.length === 0 && !vendorsLoading && <EmptyState icon="🎉" title="All caught up!" subtitle="No pending vendor applications" />}

            <div className="flex flex-col gap-3">
              {pendingData?.data?.map((vendor) => (
                <div key={vendor._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex gap-3.5 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center text-2xl shrink-0 border border-purple-200">🏪</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-[15px] font-extrabold text-gray-900 m-0">{vendor.storeName}</h3>
                          {vendor.businessType && (
                            <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold capitalize">{vendor.businessType.replace(/_/g, " ")}</span>
                          )}
                        </div>
                        <p className="text-[13px] text-gray-700 font-semibold m-0 mb-0.5">{vendor.userId?.firstName} {vendor.userId?.lastName}</p>
                        <div className="flex gap-3 flex-wrap text-xs text-gray-500">
                          <span>📧 {vendor.userId?.email}</span>
                          <span>📱 {vendor.userId?.phone}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 m-0">Applied on {formatDate(vendor.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap shrink-0">
                      <ActionBtn variant="view" onClick={() => setExpandedVendor(expandedVendor === vendor._id ? null : vendor._id)}>
                        {expandedVendor === vendor._id ? "▲ Hide" : "▼ Details"}
                      </ActionBtn>
                      <ActionBtn variant="approve" onClick={() => handleApprove(vendor._id)}>✓ Approve</ActionBtn>
                      <ActionBtn variant="reject" onClick={() => setRejectingId(rejectingId === vendor._id ? null : vendor._id)}>✕ Reject</ActionBtn>
                    </div>
                  </div>

                  <RejectPanel show={rejectingId === vendor._id} reason={rejectReason} setReason={setRejectReason} onConfirm={() => handleReject(vendor._id)} onCancel={() => setRejectingId(null)} />

                  {expandedVendor === vendor._id && (
                    <div className="border-t border-gray-200 p-5 bg-gray-50 animate-in fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <SecTitle icon="👤" title="Personal & Business" />
                          <InfoRow label="Full Name" value={`${vendor.userId?.firstName} ${vendor.userId?.lastName}`} />
                          <InfoRow label="Email" value={vendor.userId?.email} />
                          <InfoRow label="Phone" value={vendor.userId?.phone} />
                          <InfoRow label="Store Name" value={vendor.storeName} />
                          <InfoRow label="Business Type" value={vendor.businessType?.replace(/_/g, " ")} />
                          {vendor.storeDescription && <div className="pt-2"><span className="text-xs text-gray-500 font-medium">Description</span><p className="text-xs text-gray-700 mt-1 leading-relaxed m-0">{vendor.storeDescription}</p></div>}
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <SecTitle icon="📋" title="Tax & Bank Details" />
                          <InfoRow label="PAN" value={vendor.panNumber} mono />
                          <InfoRow label="GST" value={vendor.gstNumber} mono />
                          <InfoRow label="Account Holder" value={vendor.bankDetails?.accountHolderName} />
                          <InfoRow label="Bank" value={vendor.bankDetails?.bankName} />
                          <InfoRow label="Account No" value={vendor.bankDetails?.accountNumber ? `••••${vendor.bankDetails.accountNumber.slice(-4)}` : "—"} mono />
                          <InfoRow label="IFSC" value={vendor.bankDetails?.ifscCode} mono />
                          <InfoRow label="Type" value={vendor.bankDetails?.accountType} />
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <SecTitle icon="📍" title="Business Address" />
                          <InfoRow label="Street" value={vendor.businessAddress?.street} />
                          <InfoRow label="City" value={vendor.businessAddress?.city} />
                          <InfoRow label="State" value={vendor.businessAddress?.state} />
                          <InfoRow label="PIN" value={vendor.businessAddress?.postalCode} mono />
                          <InfoRow label="Country" value={vendor.businessAddress?.country} />
                        </div>
                      </div>
                      <div className="mt-4 bg-white rounded-xl p-4 border border-gray-200">
                        <SecTitle icon="📁" title="Uploaded Documents" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <DocPreview label="PAN Card" doc={vendor.panDocument} />
                          <DocPreview label="GST Certificate" doc={vendor.gstDocument} />
                          <DocPreview label="Business Registration" doc={vendor.businessRegistrationDoc} />
                          <DocPreview label="Cancelled Cheque" doc={vendor.cancelledCheque} />
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2.5 justify-end">
                        <ActionBtn variant="reject" onClick={() => setRejectingId(rejectingId === vendor._id ? null : vendor._id)} className="px-5 py-2.5 text-[13px]">✕ Reject</ActionBtn>
                        <ActionBtn variant="approve" onClick={() => handleApprove(vendor._id)} className="px-6 py-2.5 text-[13px]">✓ Approve Vendor</ActionBtn>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-5 m-0">Category Management</h2>
            <form onSubmit={handleCreateCategory} className="mb-6 flex flex-col gap-2.5">
              <input type="text" placeholder="Category Name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="border-[1.5px] border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-gray-900 transition bg-white font-[inherit]"
              />
              <input type="text" placeholder="Description (optional)" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="border-[1.5px] border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-gray-900 transition bg-white font-[inherit]"
              />
              <select value={categoryForm.parent} onChange={(e) => setCategoryForm({ ...categoryForm, parent: e.target.value })}
                className="border-[1.5px] border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-gray-900 transition bg-white font-[inherit]"
              >
                <option value="">No Parent (Main Category)</option>
                {categoryData?.data?.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
              </select>
              {categoryError && <p className="text-red-500 text-xs font-semibold m-0">{categoryError}</p>}
              <button type="submit" disabled={creatingCategory}
                className="bg-gray-900 text-white border-none rounded-xl py-3 text-sm font-bold cursor-pointer disabled:opacity-50 transition font-[inherit]"
              >
                {creatingCategory ? "Creating..." : "Create Category"}
              </button>
            </form>

            {categoriesLoading && <p className="text-gray-500 text-sm">Loading...</p>}
            <div className="flex flex-col gap-2.5">
              {categoryData?.data?.map((cat) => (
                <div key={cat._id} className="border border-gray-200 rounded-xl px-4 py-3.5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-900 m-0">{cat.name}</h3>
                    <ActionBtn variant="delete" onClick={() => handleDeleteCategory(cat._id)}>Delete</ActionBtn>
                  </div>
                  {cat.children?.length > 0 && (
                    <div className="mt-2.5 ml-5 border-l-2 border-gray-200 pl-3.5 flex flex-col gap-1.5">
                      {cat.children.map((sub) => (
                        <div key={sub._id} className="flex justify-between items-center">
                          <p className="text-[13px] text-gray-700 m-0">{sub.name}</p>
                          <button onClick={() => handleDeleteCategory(sub._id)} className="bg-red-50 text-red-800 border border-red-200 rounded-md px-2.5 py-1 text-[11px] font-bold cursor-pointer font-[inherit]">
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
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-lg font-extrabold text-gray-900 m-0">Product Management</h2>
              <div className="flex gap-1.5">
                {["pending", "approved", "rejected"].map((s) => (
                  <FilterBtn key={s} active={productStatusFilter === s} onClick={() => setProductStatusFilter(s)}>{s}</FilterBtn>
                ))}
              </div>
            </div>

            {productsLoading && <Spinner text="Loading products..." />}
            {productsData?.data?.length === 0 && !productsLoading && <EmptyState icon="📦" title={`No ${productStatusFilter} products`} />}

            <div className="flex flex-col gap-3">
              {productsData?.data?.map((product) => (
                <div key={product._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="p-4 sm:p-5 flex items-start gap-3.5">
                    <img src={product.images?.[0]?.url || "https://placehold.co/80?text=No+Image"} alt={product.name}
                      className="w-[72px] h-[72px] object-cover rounded-xl border border-gray-200 shrink-0"
                      onError={(e) => { e.target.src = "https://placehold.co/80?text=No+Image"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="text-[15px] font-extrabold text-gray-900 m-0 mb-1">{product.name}</h3>
                          <div className="flex gap-2.5 flex-wrap text-xs text-gray-500">
                            <span>📂 {product.category?.name}</span>
                            <span>🏪 {product.vendor?.firstName} {product.vendor?.lastName}</span>
                            {product.brand && <span>🏷️ {product.brand}</span>}
                          </div>
                          <div className="flex gap-3 mt-1.5 items-center">
                            <span className="text-base font-extrabold text-[#B12704]">{formatRupee(product.price)}</span>
                            {product.comparePrice > 0 && <span className="text-xs text-gray-400 line-through">{formatRupee(product.comparePrice)}</span>}
                            <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <Badge status={product.status} />
                          <div className="flex gap-1.5 flex-wrap">
                            <ActionBtn variant="view" onClick={() => setExpandedProduct(expandedProduct === product._id ? null : product._id)}>
                              {expandedProduct === product._id ? "▲ Hide" : "▼ Details"}
                            </ActionBtn>
                            {product.status === "pending" && (
                              <>
                                <ActionBtn variant="approve" onClick={() => handleApproveProduct(product._id)}>✓ Approve</ActionBtn>
                                <ActionBtn variant="reject" onClick={() => setProductRejectingId(productRejectingId === product._id ? null : product._id)}>✕ Reject</ActionBtn>
                              </>
                            )}
                            {product.status === "approved" && (
                              <button onClick={() => handleFeatureProduct(product._id)}
                                className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer border transition-all font-[inherit] ${product.isFeatured ? "bg-yellow-100 text-yellow-800 border-yellow-200" : "bg-gray-100 text-gray-700 border-gray-200"}`}
                              >
                                {product.isFeatured ? "★ Featured" : "☆ Feature"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <RejectPanel show={productRejectingId === product._id} reason={productRejectReason} setReason={setProductRejectReason} onConfirm={() => handleRejectProduct(product._id)} onCancel={() => setProductRejectingId(null)} />

                  {product.status === "rejected" && product.rejectionReason && (
                    <div className="px-5 py-2.5 bg-red-50 border-t border-red-200">
                      <p className="text-xs text-red-600 font-semibold m-0">Rejection Reason: {product.rejectionReason}</p>
                    </div>
                  )}

                  {expandedProduct === product._id && (
                    <div className="border-t border-gray-200 p-5 bg-gray-50 animate-in fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <SecTitle icon="📦" title="Product Information" />
                          <InfoRow label="Name" value={product.name} />
                          <InfoRow label="Category" value={product.category?.name} />
                          <InfoRow label="Brand" value={product.brand} />
                          <InfoRow label="SKU" value={product.sku} mono />
                          <InfoRow label="Price" value={formatRupee(product.price)} />
                          <InfoRow label="Compare" value={product.comparePrice > 0 ? formatRupee(product.comparePrice) : "—"} />
                          <InfoRow label="Stock" value={product.stock} />
                          <InfoRow label="Low Stock Alert" value={product.lowStockThreshold} />
                          <InfoRow label="Weight" value={product.weight ? `${product.weight}g` : "—"} />
                          {product.shortDescription && <div className="pt-2"><span className="text-xs text-gray-500">Short Description</span><p className="text-xs text-gray-700 mt-1 leading-relaxed m-0">{product.shortDescription}</p></div>}
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <SecTitle icon="🏪" title="Vendor Information" />
                          <InfoRow label="Vendor" value={`${product.vendor?.firstName} ${product.vendor?.lastName}`} />
                          <InfoRow label="Email" value={product.vendor?.email} />
                          <InfoRow label="Store" value={product.vendorStore?.storeName} />
                          <InfoRow label="Status" value={product.status} />
                          <InfoRow label="Featured" value={product.isFeatured ? "Yes" : "No"} />
                          <InfoRow label="Views" value={product.views} />
                          <InfoRow label="Sold" value={product.totalSold} />
                          <InfoRow label="Rating" value={product.averageRating > 0 ? `${product.averageRating} ⭐` : "No reviews"} />
                          <InfoRow label="Listed" value={formatDate(product.createdAt)} />
                          {product.specifications?.length > 0 && <>
                            <SecTitle icon="📋" title="Specifications" />
                            {product.specifications.map((spec, i) => <InfoRow key={i} label={spec.key} value={spec.value} />)}
                          </>}
                        </div>
                      </div>
                      {product.description && (
                        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
                          <SecTitle icon="📝" title="Full Description" />
                          <p className="text-[13px] text-gray-700 m-0 leading-relaxed whitespace-pre-line">{product.description}</p>
                        </div>
                      )}
                      {product.images?.length > 0 && (
                        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
                          <SecTitle icon="🖼️" title="Product Images" />
                          <div className="flex gap-2.5 flex-wrap">
                            {product.images.map((img, i) => (
                              <a key={i} href={img.url} target="_blank" rel="noreferrer">
                                <img src={img.url} alt={`Product ${i + 1}`} className="w-[90px] h-[90px] object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-80 transition" onError={(e) => { e.target.src = "https://placehold.co/90?text=Img"; }} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {product.tags?.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mb-4">
                          {product.tags.map((tag) => <span key={tag} className="bg-gray-100 text-gray-700 text-[11px] px-2.5 py-1 rounded-full font-semibold">#{tag}</span>)}
                        </div>
                      )}
                      {product.status === "pending" && (
                        <div className="flex gap-2.5 justify-end">
                          <ActionBtn variant="reject" onClick={() => setProductRejectingId(productRejectingId === product._id ? null : product._id)} className="px-5 py-2.5 text-[13px]">✕ Reject</ActionBtn>
                          <ActionBtn variant="approve" onClick={() => handleApproveProduct(product._id)} className="px-6 py-2.5 text-[13px]">✓ Approve Product</ActionBtn>
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
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-4 m-0">Order Management</h2>
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {[{ l: "All", v: "" }, { l: "Pending", v: "pending" }, { l: "Processing", v: "processing" }, { l: "Shipped", v: "shipped" }, { l: "Delivered", v: "delivered" }, { l: "Cancelled", v: "cancelled" }].map((item) => (
                <FilterBtn key={item.v} active={orderStatusFilter === item.v} onClick={() => { setOrderStatusFilter(item.v); setOrderPage(1); }}>{item.l}</FilterBtn>
              ))}
            </div>

            {ordersLoading && <Spinner text="Loading orders..." />}
            {ordersData?.data?.length === 0 && !ordersLoading && <EmptyState icon="📦" title="No orders found" />}

            <div className="flex flex-col gap-3">
              {ordersData?.data?.map((order) => (
                <div key={order._id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                    <div>
                      <p className="text-sm font-extrabold text-gray-900 m-0">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500 mt-0.5 m-0">{order.user?.firstName} {order.user?.lastName} • {order.user?.email}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 m-0">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <Badge status={order.orderStatus} />
                      <p className="text-lg font-extrabold text-[#B12704] mt-1.5 m-0">{formatRupee(order.total)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mb-3">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex gap-2.5 items-center">
                        <img src={item.image || "https://placehold.co/44?text=P"} alt={item.name} className="w-11 h-11 object-cover rounded-lg border border-gray-200 shrink-0" onError={(e) => { e.target.src = "https://placehold.co/44?text=P"; }} />
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900 m-0">{item.name}</p>
                          <p className="text-[11px] text-gray-500 m-0">Qty: {item.quantity} • {formatRupee(item.price * item.quantity)} • {item.storeName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3.5 py-2.5 mb-3 text-xs">
                    <p className="font-bold text-gray-700 mb-1 m-0">Ship to:</p>
                    <p className="text-gray-500 m-0">{order.shippingAddress?.fullName}, {order.shippingAddress?.phone} • {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-gray-100">
                    <p className="text-xs text-gray-500 m-0">
                      Payment: <strong>{order.paymentMethod === "cod" ? "COD" : "Online"}</strong> •{" "}
                      <span className={order.paymentStatus === "paid" ? "text-green-600 font-bold" : "text-yellow-600 font-bold"}>{order.paymentStatus}</span>
                    </p>
                    {!["cancelled", "delivered", "refunded"].includes(order.orderStatus) && (
                      <select value={order.orderStatus} onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-gray-900 transition font-[inherit]"
                      >
                        {["pending", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"].map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                      </select>
                    )}
                  </div>
                  {order.cancelReason && (
                    <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <p className="text-[11px] text-red-600 font-semibold m-0">Cancel Reason: {order.cancelReason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {ordersData?.pagination?.pages > 1 && (
              <div className="flex justify-center gap-1.5 mt-5">
                <PageBtn onClick={() => setOrderPage((p) => Math.max(1, p - 1))} disabled={orderPage === 1}>← Prev</PageBtn>
                {Array.from({ length: ordersData.pagination.pages }, (_, i) => i + 1).map((p) => (
                  <PageBtn key={p} active={orderPage === p} onClick={() => setOrderPage(p)}>{p}</PageBtn>
                ))}
                <PageBtn onClick={() => setOrderPage((p) => Math.min(ordersData.pagination.pages, p + 1))} disabled={orderPage === ordersData.pagination.pages}>Next →</PageBtn>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-4 m-0">Review Management</h2>
            <div className="flex flex-wrap gap-2.5 mb-5">
              <select value={reviewSort} onChange={(e) => { setReviewSort(e.target.value); setReviewPage(1); }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-gray-900 transition font-[inherit]"
              >
                <option value="newest">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
              <div className="flex gap-1.5 flex-wrap">
                {[5, 4, 3, 2, 1].map((star) => (
                  <FilterBtn key={star} active={reviewRatingFilter === star} onClick={() => { setReviewRatingFilter(reviewRatingFilter === star ? undefined : star); setReviewPage(1); }}>
                    {star} ★
                  </FilterBtn>
                ))}
                {reviewRatingFilter && (
                  <button onClick={() => { setReviewRatingFilter(undefined); setReviewPage(1); }} className="px-3 py-2 text-xs text-gray-500 bg-transparent border-none cursor-pointer font-[inherit]">Clear</button>
                )}
              </div>
            </div>

            {reviewsLoading && <Spinner text="Loading reviews..." />}
            {reviewsData?.data?.length === 0 && !reviewsLoading && <EmptyState icon="💬" title="No reviews found" />}

            <div className="flex flex-col gap-3">
              {reviewsData?.data?.map((review) => (
                <div key={review._id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 font-bold text-sm text-gray-700">
                        {review.user?.firstName?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-bold text-[13px] text-gray-900 m-0">{review.user?.firstName} {review.user?.lastName}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 m-0">{review.user?.email}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex">{[1, 2, 3, 4, 5].map((s) => <span key={s} className={s <= review.rating ? "text-yellow-400 text-[13px]" : "text-gray-200 text-[13px]"}>★</span>)}</div>
                          {review.isVerifiedPurchase && <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">✓ Verified</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <p className="text-[11px] text-gray-400 m-0">{formatDate(review.createdAt)}</p>
                      {deletingReviewId === review._id ? (
                        <div className="flex gap-1.5">
                          <button onClick={() => handleDeleteReview(review._id)} className="bg-red-500 text-white border-none rounded-md px-3 py-1.5 text-[11px] font-bold cursor-pointer font-[inherit]">Confirm</button>
                          <button onClick={() => setDeletingReviewId(null)} className="bg-white text-gray-700 border border-gray-200 rounded-md px-2.5 py-1.5 text-[11px] cursor-pointer font-[inherit]">Cancel</button>
                        </div>
                      ) : (
                        <ActionBtn variant="delete" onClick={() => setDeletingReviewId(review._id)}>Delete</ActionBtn>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pl-[52px]">
                    {review.product && (
                      <div className="flex items-center gap-2 mb-2">
                        {review.product?.images?.[0] && <img src={review.product.images[0].url} alt="" className="w-7 h-7 rounded-md object-cover" onError={(e) => { e.target.style.display = "none"; }} />}
                        <span className="text-[11px] text-gray-500 font-semibold">{review.product?.name}</span>
                      </div>
                    )}
                    {review.title && <p className="font-bold text-[13px] text-gray-900 m-0 mb-1">{review.title}</p>}
                    {review.body && <p className="text-[13px] text-gray-700 m-0 leading-relaxed">{review.body}</p>}
                    {review.images?.length > 0 && (
                      <div className="flex gap-1.5 mt-2">{review.images.map((img, i) => <img key={i} src={img.url} alt="" className="w-[52px] h-[52px] rounded-lg object-cover border border-gray-200" />)}</div>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1.5 m-0">👍 {review.helpfulVotes?.length || 0} found helpful</p>
                  </div>
                </div>
              ))}
            </div>

            {reviewsData?.pagination?.pages > 1 && (
              <div className="flex justify-center gap-1.5 mt-5">
                <PageBtn onClick={() => setReviewPage((p) => Math.max(1, p - 1))} disabled={reviewPage === 1}>← Prev</PageBtn>
                {Array.from({ length: reviewsData.pagination.pages }, (_, i) => i + 1).map((p) => (
                  <PageBtn key={p} active={reviewPage === p} onClick={() => setReviewPage(p)}>{p}</PageBtn>
                ))}
                <PageBtn onClick={() => setReviewPage((p) => Math.min(reviewsData.pagination.pages, p + 1))} disabled={reviewPage === reviewsData.pagination.pages}>Next →</PageBtn>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;