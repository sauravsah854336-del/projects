import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import {
  authApi, useLogoutMutation, useGetPendingVendorsQuery,
  useGetAllVendorsQuery, useApproveVendorMutation, useRejectVendorMutation,
  useGetAdminStatsQuery, useGetAllAdminsQuery, useGetAllCustomersQuery,
  useGetSingleCustomerQuery, useBlockCustomerMutation, useUnblockCustomerMutation,
  useDeleteCustomerMutation, useSuspendVendorMutation, useUnsuspendVendorMutation,
  useUpdateVendorCommissionMutation, useCreateAdminMutation,
} from "../features/auth/authApi";
import {
  useGetCategoryTreeQuery, useCreateCategoryMutation, useDeleteCategoryMutation,
} from "../features/category/categoryApi";
import {
  useAdminGetAllProductsQuery, useFeatureProductMutation,
  useDelistProductMutation, useRelistProductMutation,
} from "../features/product/productApi";
import {
  useAdminGetAllOrdersQuery, useAdminCancelOrderMutation,
} from "../features/order/orderApi";
import {
  useAdminGetAllReviewsQuery, useDeleteReviewMutation,
} from "../features/review/reviewApi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "../components/Toast";

const formatRupee = (amt) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amt || 0);

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const statusMap = {
  confirmed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800", processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800", out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800",
  returned: "bg-gray-100 text-gray-700", refunded: "bg-pink-100 text-pink-800",
  approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800",
  suspended: "bg-orange-100 text-orange-800", active: "bg-green-100 text-green-800",
  blocked: "bg-red-100 text-red-800", inactive: "bg-gray-100 text-gray-700",
  delisted: "bg-gray-100 text-gray-600",
};

const statusLabel = {
  confirmed: "Confirmed",
  pending: "Pending", processing: "Processing", shipped: "Shipped",
  out_for_delivery: "Out for Delivery", delivered: "Delivered",
  cancelled: "Cancelled", returned: "Returned", refunded: "Refunded",
  approved: "Live", rejected: "Rejected", suspended: "Suspended",
  active: "Active", blocked: "Blocked", inactive: "Inactive",
  delisted: "Delisted",
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

const TabBtn = ({ active, onClick, icon, label, badge }) => (
  <button onClick={onClick} className={`relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-bold cursor-pointer border transition-all font-[inherit] ${active ? "bg-[#131921] text-white border-[#131921]" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
    <span>{icon}</span>{label}
    {badge > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#D85A30] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">{badge > 9 ? "9+" : badge}</span>}
  </button>
);

const FilterBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer border transition-all capitalize font-[inherit] ${active ? "bg-[#131921] text-white border-[#131921]" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
    {children}
  </button>
);

const ActionBtn = ({ variant = "view", onClick, children, className = "" }) => {
  const cls = {
    approve: "bg-green-100 text-green-800 border-green-200 hover:bg-green-500 hover:text-white",
    reject: "bg-red-100 text-red-800 border-red-200 hover:bg-red-500 hover:text-white",
    view: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-600 hover:text-white",
    delete: "bg-red-50 text-red-800 border-red-200 hover:bg-red-100",
    warn: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-500 hover:text-white",
    info: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-500 hover:text-white",
  };
  return (
    <button onClick={onClick} className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer border transition-all font-[inherit] ${cls[variant]} ${className}`}>
      {children}
    </button>
  );
};

const PageBtn = ({ active, onClick, disabled, children }) => (
  <button onClick={onClick} disabled={disabled} className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all font-[inherit] disabled:opacity-40 disabled:cursor-not-allowed ${active ? "bg-[#131921] text-white border-[#131921]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"}`}>
    {children}
  </button>
);

const EmptyState = ({ icon, title, subtitle }) => (
  <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
    <p className="text-4xl mb-3">{icon}</p>
    <p className="text-base font-bold text-gray-900 m-0">{title}</p>
    {subtitle && <p className="text-[13px] text-gray-500 mt-1 m-0">{subtitle}</p>}
  </div>
);

const Spinner = ({ text }) => (
  <div className="text-center py-10">
    <div className="w-7 h-7 border-[3px] border-[#D85A30] border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
    <p className="text-gray-500 text-[13px] m-0">{text}</p>
  </div>
);

const RejectPanel = ({ show, reason, setReason, onConfirm, onCancel, placeholder }) => {
  if (!show) return null;
  return (
    <div className="px-5 py-3 bg-red-50 border-t border-red-200">
      <p className="text-xs font-bold text-red-600 mb-2 m-0">⚠️ Provide a reason</p>
      <div className="flex gap-2">
        <input type="text" placeholder={placeholder || "Reason..."} value={reason} onChange={(e) => setReason(e.target.value)}
          className="flex-1 border border-red-200 rounded-lg px-3 py-2.5 text-[13px] outline-none focus:border-red-400 bg-white font-[inherit]"
        />
        <button onClick={onConfirm} className="bg-red-500 text-white border-none rounded-lg px-4 py-2.5 text-xs font-bold cursor-pointer font-[inherit]">Confirm</button>
        <button onClick={onCancel} className="bg-white text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-semibold cursor-pointer font-[inherit]">Cancel</button>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, iconBg = "bg-gray-50", trend }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center text-xl`}>{icon}</div>
      {trend !== undefined && (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div>
      <p className="text-xl sm:text-2xl font-extrabold text-gray-900 m-0">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5 m-0">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5 m-0">{sub}</p>}
    </div>
  </div>
);

const ProductImg = ({ src, alt, size = "72px" }) => (
  <div className="bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shrink-0" style={{ width: size, height: size }}>
    <img src={src || "https://placehold.co/80?text=No"} alt={alt} className="w-full h-full object-contain p-1" onError={(e) => { e.target.src = "https://placehold.co/80?text=No"; }} />
  </div>
);

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, refreshToken } = useSelector((state) => state.auth);
  const [logoutAPI] = useLogoutMutation();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const setActiveTab = (tab) => setSearchParams({ tab });

  const { data: statsData, isLoading: statsLoading } = useGetAdminStatsQuery();
  const stats = statsData?.data;

  const { data: pendingData, isLoading: vendorsLoading } = useGetPendingVendorsQuery();
  const [vendorStatusFilter, setVendorStatusFilter] = useState("");
  const [vendorPage, setVendorPage] = useState(1);
  const { data: allVendorsData, isLoading: allVendorsLoading } = useGetAllVendorsQuery({ status: vendorStatusFilter, page: vendorPage });
  const [approveVendor] = useApproveVendorMutation();
  const [rejectVendor] = useRejectVendorMutation();
  const [suspendVendor] = useSuspendVendorMutation();
  const [unsuspendVendor] = useUnsuspendVendorMutation();
  const [updateVendorCommission] = useUpdateVendorCommissionMutation();
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendingId, setSuspendingId] = useState(null);
  const [expandedVendor, setExpandedVendor] = useState(null);
  const [commissionEdit, setCommissionEdit] = useState({});
  const [commissionValue, setCommissionValue] = useState("");
  const [vendorView, setVendorView] = useState("pending");

  const [customerPage, setCustomerPage] = useState(1);
  const [customerStatusFilter, setCustomerStatusFilter] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearchInput, setCustomerSearchInput] = useState("");
  const { data: customersData, isLoading: customersLoading } = useGetAllCustomersQuery({ page: customerPage, status: customerStatusFilter, search: customerSearch });
  const [blockCustomer] = useBlockCustomerMutation();
  const [unblockCustomer] = useUnblockCustomerMutation();
  const [deleteCustomer] = useDeleteCustomerMutation();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { data: customerDetailData } = useGetSingleCustomerQuery(selectedCustomer, { skip: !selectedCustomer });
  const [blockingId, setBlockingId] = useState(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState(null);

  const { data: adminsData, isLoading: adminsLoading } = useGetAllAdminsQuery();
  const [createAdmin] = useCreateAdminMutation();
  const [adminForm, setAdminForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [adminFormError, setAdminFormError] = useState("");
  const [adminFormLoading, setAdminFormLoading] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const { data: categoryData, isLoading: categoriesLoading } = useGetCategoryTreeQuery();
  const [createCategory, { isLoading: creatingCategory }] = useCreateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", parent: "" });
  const [categoryError, setCategoryError] = useState("");

  const [productStatusFilter, setProductStatusFilter] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productSearchInput, setProductSearchInput] = useState("");
  const { data: productsData, isLoading: productsLoading } = useAdminGetAllProductsQuery({ status: productStatusFilter, search: productSearch });
  const [featureProduct] = useFeatureProductMutation();
  const [delistProduct] = useDelistProductMutation();
  const [relistProduct] = useRelistProductMutation();
  const [delistingId, setDelistingId] = useState(null);
  const [delistReason, setDelistReason] = useState("");
  const [expandedProduct, setExpandedProduct] = useState(null);

  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderSearchInput, setOrderSearchInput] = useState("");
  const { data: ordersData, isLoading: ordersLoading } = useAdminGetAllOrdersQuery({ status: orderStatusFilter, page: orderPage, search: orderSearch });
  const [adminCancelOrder] = useAdminCancelOrderMutation();
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelOrderReason, setCancelOrderReason] = useState("");

  const [reviewRatingFilter, setReviewRatingFilter] = useState(undefined);
  const [reviewSort, setReviewSort] = useState("newest");
  const [reviewPage, setReviewPage] = useState(1);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const { data: reviewsData, isLoading: reviewsLoading } = useAdminGetAllReviewsQuery({ rating: reviewRatingFilter, sort: reviewSort, page: reviewPage, limit: 10 });
  const [deleteReview] = useDeleteReviewMutation();

  const handleLogout = async () => {
    try { await logoutAPI({ refreshToken }).unwrap(); } catch (err) { console.log(err); }
    finally { dispatch(authApi.util.resetApiState()); dispatch(logout()); navigate("/login"); }
  };

  const handleApprove = async (vendorId) => { try { await approveVendor(vendorId).unwrap(); setExpandedVendor(null); toast.success("Vendor approved!"); } catch { toast.error("Failed to approve vendor"); } };
  const handleReject = async (vendorId) => { try { await rejectVendor({ vendorId, reason: rejectReason }).unwrap(); setRejectingId(null); setRejectReason(""); setExpandedVendor(null); toast.success("Vendor rejected"); } catch { toast.error("Failed to reject vendor"); } };
  const handleSuspend = async (vendorId) => { try { await suspendVendor({ vendorId, reason: suspendReason }).unwrap(); setSuspendingId(null); setSuspendReason(""); toast.success("Vendor suspended"); } catch { toast.error("Failed to suspend vendor"); } };
  const handleUnsuspend = async (vendorId) => { try { await unsuspendVendor(vendorId).unwrap(); toast.success("Vendor unsuspended"); } catch { toast.error("Failed to unsuspend vendor"); } };
  const handleUpdateCommission = async (vendorId) => { try { await updateVendorCommission({ vendorId, commission: Number(commissionValue) }).unwrap(); setCommissionEdit({}); setCommissionValue(""); toast.success("Commission updated!"); } catch { toast.error("Failed to update commission"); } };

  const handleCreateCategory = async (e) => { e.preventDefault(); setCategoryError(""); if (!categoryForm.name.trim()) { setCategoryError("Category name is required"); return; } try { await createCategory({ name: categoryForm.name.trim(), description: categoryForm.description.trim(), parent: categoryForm.parent || null }).unwrap(); setCategoryForm({ name: "", description: "", parent: "" }); toast.success("Category created!"); } catch (err) { setCategoryError(err?.data?.message || "Failed"); } };
  const handleDeleteCategory = async (id) => { try { await deleteCategory(id).unwrap(); toast.success("Category deleted"); } catch (err) { toast.error(err?.data?.message || "Failed"); } };

  const handleFeatureProduct = async (id) => { try { await featureProduct(id).unwrap(); toast.success("Feature toggled"); } catch { toast.error("Failed"); } };
  const handleDelistProduct = async (id) => { try { await delistProduct({ id, reason: delistReason }).unwrap(); setDelistingId(null); setDelistReason(""); toast.success("Product delisted"); } catch { toast.error("Failed to delist"); } };
  const handleRelistProduct = async (id) => { try { await relistProduct(id).unwrap(); toast.success("Product relisted — now live"); } catch { toast.error("Failed to relist"); } };

  const handleAdminCancelOrder = async (orderId, reason) => {
    try { await adminCancelOrder({ id: orderId, reason }).unwrap(); setCancellingOrderId(null); setCancelOrderReason(""); toast.success("Order cancelled"); }
    catch { toast.error("Failed to cancel order"); }
  };

  const handleDeleteReview = async (reviewId) => { try { await deleteReview({ reviewId }).unwrap(); setDeletingReviewId(null); toast.success("Review deleted"); } catch { toast.error("Failed"); } };

  const handleBlockCustomer = async (userId) => { try { await blockCustomer(userId).unwrap(); setBlockingId(null); toast.success("Customer blocked"); } catch { toast.error("Failed"); } };
  const handleUnblockCustomer = async (userId) => { try { await unblockCustomer(userId).unwrap(); toast.success("Customer unblocked"); } catch { toast.error("Failed"); } };
  const handleDeleteCustomer = async (userId) => { try { await deleteCustomer(userId).unwrap(); setDeletingCustomerId(null); setSelectedCustomer(null); toast.success("Customer deleted"); } catch { toast.error("Failed"); } };

  const handleCreateAdmin = async (e) => {
    e.preventDefault(); setAdminFormError("");
    const { firstName, lastName, email, phone, password } = adminForm;
    if (!firstName || !lastName || !email || !phone || !password) { setAdminFormError("All fields are required"); return; }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) { setAdminFormError("Enter valid 10-digit phone"); return; }
    setAdminFormLoading(true);
    try {
      await createAdmin({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim(), password }).unwrap();
      setAdminForm({ firstName: "", lastName: "", email: "", phone: "", password: "" });
      setShowAdminForm(false);
      toast.success("Admin created successfully!");
    } catch (err) { setAdminFormError(err?.data?.message || "Failed to create admin"); }
    finally { setAdminFormLoading(false); }
  };

  const pendingVendorCount = pendingData?.data?.length || 0;
  const inputCls = "w-full border-[1.5px] border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#D85A30] focus:ring-2 focus:ring-[#D85A30]/10 transition bg-white font-[inherit]";

  const dailyData = stats?.revenue?.daily ? Object.entries(stats.revenue.daily) : [];
  const maxDaily = Math.max(...dailyData.map(([, v]) => v), 1);

  const tabs = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "vendors", label: "Vendors", icon: "🏪", badge: pendingVendorCount },
    { key: "customers", label: "Customers", icon: "👥" },
    { key: "admins", label: "Admins", icon: "👑" },
    { key: "categories", label: "Categories", icon: "📂" },
    { key: "products", label: "Products", icon: "📦" },
    { key: "orders", label: "Orders", icon: "🛒" },
    { key: "reviews", label: "Reviews", icon: "⭐" },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">

      <div className="bg-[#131921] px-4 sm:px-6 py-4 sm:py-5">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-gradient-to-br from-[#D85A30] to-[#FF8C5A] rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-orange-500/30">
              {user?.firstName?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-white font-extrabold text-base sm:text-lg m-0">{user?.firstName} {user?.lastName}</p>
                <span className="text-[9px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold uppercase">Admin</span>
              </div>
              <p className="text-gray-500 text-[11px] m-0">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {pendingVendorCount > 0 && (
              <button onClick={() => { setActiveTab("vendors"); setVendorView("pending"); }} className="bg-yellow-500/15 border border-yellow-400/30 text-yellow-300 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer hover:bg-yellow-500/25 transition font-[inherit]">
                🕐 {pendingVendorCount} pending vendor{pendingVendorCount > 1 ? "s" : ""}
              </button>
            )}
            <button onClick={handleLogout} className="bg-white/8 border border-white/15 text-white text-sm font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-white/15 transition font-[inherit]">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-5 sm:py-6">

        <div className="flex gap-1.5 sm:gap-2 mb-6 flex-wrap">
          {tabs.map((tab) => (
            <TabBtn key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} icon={tab.icon} label={tab.label} badge={tab.badge} />
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="flex flex-col gap-5">
            {statsLoading ? <Spinner text="Loading dashboard..." /> : (
              <>
                {pendingVendorCount > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-3.5 flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <div className="flex-1"><p className="text-sm font-bold text-yellow-800 m-0">{pendingVendorCount} vendor application{pendingVendorCount > 1 ? "s" : ""} awaiting review</p></div>
                    <button onClick={() => { setActiveTab("vendors"); setVendorView("pending"); }} className="text-xs font-bold text-yellow-700 bg-yellow-100 border border-yellow-200 rounded-lg px-3 py-1.5 cursor-pointer font-[inherit]">Review Now →</button>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard icon="💰" label="Total Revenue" value={formatRupee(stats?.revenue?.total)} sub="All delivered orders" iconBg="bg-green-50" />
                  <StatCard icon="📅" label="This Month" value={formatRupee(stats?.revenue?.thisMonth)} sub={`Last month: ${formatRupee(stats?.revenue?.lastMonth)}`} iconBg="bg-blue-50" />
                  <StatCard icon="🛒" label="Total Orders" value={stats?.orders?.total || 0} sub={`${stats?.orders?.thisMonth || 0} this month`} iconBg="bg-purple-50" />
                  <StatCard icon="👥" label="Customers" value={stats?.customers?.total || 0} sub={`${stats?.customers?.active || 0} active`} iconBg="bg-orange-50" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard icon="🏪" label="Total Vendors" value={stats?.vendors?.total || 0} sub={`${stats?.vendors?.approved || 0} approved`} iconBg="bg-indigo-50" />
                  <StatCard icon="⏳" label="Pending Vendors" value={stats?.vendors?.pending || 0} sub="Awaiting review" iconBg="bg-yellow-50" />
                  <StatCard icon="📦" label="Total Products" value={stats?.products?.total || 0} sub={`${stats?.products?.approved || 0} live`} iconBg="bg-teal-50" />
                  <StatCard icon="👑" label="Admins" value={stats?.admins?.total || 0} sub="Platform admins" iconBg="bg-red-50" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-sm font-extrabold text-gray-900 m-0">Revenue — Last 7 Days</h3>
                        <p className="text-xs text-gray-400 mt-0.5 m-0">{formatRupee(dailyData.reduce((s, [, v]) => s + v, 0))} this week</p>
                      </div>
                    </div>
                    {dailyData.length > 0 ? (
                      <div className="flex items-end gap-2 h-32">
                        {dailyData.map(([date, value]) => {
                          const pct = maxDaily > 0 ? (value / maxDaily) * 100 : 0;
                          const label = new Date(date).toLocaleDateString("en-IN", { weekday: "short" });
                          return (
                            <div key={date} className="flex-1 flex flex-col items-center gap-1.5 group">
                              <div className="relative w-full flex items-end justify-center" style={{ height: "96px" }}>
                                <div className="w-full bg-gradient-to-t from-[#D85A30] to-[#FF8C5A] rounded-t-lg transition-all duration-500 group-hover:from-[#C04A20]" style={{ height: `${Math.max(pct, 4)}%` }} title={`${label}: ${formatRupee(value)}`} />
                                {value > 0 && (
                                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {formatRupee(value)}
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 font-medium">{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : <div className="h-32 flex items-center justify-center text-gray-400 text-sm">No data yet</div>}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-4 m-0">Platform Overview</h3>
                    <div className="flex flex-col gap-3">
                      {[
                        { label: "Delivered Orders", value: stats?.orders?.delivered || 0, color: "bg-green-500", total: stats?.orders?.total },
                        { label: "Pending Orders", value: stats?.orders?.pending || 0, color: "bg-yellow-400", total: stats?.orders?.total },
                        { label: "Cancelled", value: stats?.orders?.cancelled || 0, color: "bg-red-400", total: stats?.orders?.total },
                        { label: "Active Customers", value: stats?.customers?.active || 0, color: "bg-blue-500", total: stats?.customers?.total },
                        { label: "Blocked Customers", value: stats?.customers?.blocked || 0, color: "bg-gray-400", total: stats?.customers?.total },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2.5">
                          <span className="text-xs text-gray-500 w-28 shrink-0">{item.label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.total ? (item.value / item.total) * 100 : 0}%` }} />
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-6 text-right shrink-0">{item.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button onClick={() => setActiveTab("vendors")} className="bg-gray-50 border border-gray-200 rounded-xl py-2.5 text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-100 transition font-[inherit]">Manage Vendors</button>
                      <button onClick={() => setActiveTab("customers")} className="bg-[#131921] text-white border-none rounded-xl py-2.5 text-xs font-bold cursor-pointer font-[inherit]">Manage Users</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "vendors" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <FilterBtn active={vendorView === "pending"} onClick={() => setVendorView("pending")}>🕐 Pending ({pendingVendorCount})</FilterBtn>
              <FilterBtn active={vendorView === "all"} onClick={() => setVendorView("all")}>📋 All Vendors</FilterBtn>
            </div>

            {vendorView === "pending" && (
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 mb-4 m-0">Pending Vendor Applications</h2>
                {vendorsLoading && <Spinner text="Loading vendors..." />}
                {pendingData?.data?.length === 0 && !vendorsLoading && <EmptyState icon="🎉" title="All caught up!" subtitle="No pending vendor applications" />}
                <div className="flex flex-col gap-3">
                  {pendingData?.data?.map((vendor) => (
                    <div key={vendor._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex gap-3.5 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center text-2xl shrink-0 border border-purple-200">🏪</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="text-[15px] font-extrabold text-gray-900 m-0">{vendor.storeName}</h3>
                              {vendor.businessType && <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold capitalize">{vendor.businessType.replace(/_/g, " ")}</span>}
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
                      <RejectPanel show={rejectingId === vendor._id} reason={rejectReason} setReason={setRejectReason} onConfirm={() => handleReject(vendor._id)} onCancel={() => setRejectingId(null)} placeholder="e.g. Documents unclear, Invalid PAN..." />
                      {expandedVendor === vendor._id && (
                        <div className="border-t border-gray-200 p-5 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl p-4 border border-gray-200">
                              <SecTitle icon="👤" title="Personal & Business" />
                              <InfoRow label="Full Name" value={`${vendor.userId?.firstName} ${vendor.userId?.lastName}`} />
                              <InfoRow label="Email" value={vendor.userId?.email} />
                              <InfoRow label="Phone" value={vendor.userId?.phone} />
                              <InfoRow label="Store" value={vendor.storeName} />
                              <InfoRow label="Business Type" value={vendor.businessType?.replace(/_/g, " ")} />
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-gray-200">
                              <SecTitle icon="📋" title="Tax & Bank" />
                              <InfoRow label="PAN" value={vendor.panNumber} mono />
                              <InfoRow label="GST" value={vendor.gstNumber} mono />
                              <InfoRow label="Account Holder" value={vendor.bankDetails?.accountHolderName} />
                              <InfoRow label="Bank" value={vendor.bankDetails?.bankName} />
                              <InfoRow label="Account" value={vendor.bankDetails?.accountNumber ? `••••${vendor.bankDetails.accountNumber.slice(-4)}` : "—"} mono />
                              <InfoRow label="IFSC" value={vendor.bankDetails?.ifscCode} mono />
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-gray-200">
                              <SecTitle icon="📍" title="Business Address" />
                              <InfoRow label="Street" value={vendor.businessAddress?.street} />
                              <InfoRow label="City" value={vendor.businessAddress?.city} />
                              <InfoRow label="State" value={vendor.businessAddress?.state} />
                              <InfoRow label="PIN" value={vendor.businessAddress?.postalCode} mono />
                            </div>
                          </div>
                          <div className="mt-4 bg-white rounded-xl p-4 border border-gray-200">
                            <SecTitle icon="📁" title="Documents" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <DocPreview label="PAN Card" doc={vendor.panDocument} />
                              <DocPreview label="GST Certificate" doc={vendor.gstDocument} />
                              <DocPreview label="Business Reg." doc={vendor.businessRegistrationDoc} />
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

            {vendorView === "all" && (
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h2 className="text-lg font-extrabold text-gray-900 m-0">All Vendors ({allVendorsData?.pagination?.total || 0})</h2>
                  <div className="flex gap-1.5 flex-wrap">
                    {["", "approved", "pending", "rejected", "suspended"].map((s) => (
                      <FilterBtn key={s} active={vendorStatusFilter === s} onClick={() => { setVendorStatusFilter(s); setVendorPage(1); }}>{s || "All"}</FilterBtn>
                    ))}
                  </div>
                </div>
                {allVendorsLoading && <Spinner text="Loading vendors..." />}
                {allVendorsData?.data?.length === 0 && !allVendorsLoading && <EmptyState icon="🏪" title="No vendors found" />}
                <div className="flex flex-col gap-3">
                  {allVendorsData?.data?.map((vendor) => (
                    <div key={vendor._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex gap-3 flex-1 min-w-0">
                          <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center text-xl border border-purple-100 shrink-0">🏪</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-extrabold text-gray-900 m-0">{vendor.storeName}</h3>
                              <Badge status={vendor.approvalStatus} />
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5 m-0">{vendor.userId?.firstName} {vendor.userId?.lastName} · {vendor.userId?.email}</p>
                            <div className="flex gap-3 mt-1 flex-wrap text-[11px] text-gray-400">
                              <span>Commission: <strong className="text-gray-700">{vendor.commission}%</strong></span>
                              {vendor.approvedAt && <span>Approved: {formatDate(vendor.approvedAt)}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-wrap shrink-0">
                          {vendor.approvalStatus === "approved" && (
                            <>
                              <button onClick={() => { setCommissionEdit({ [vendor._id]: true }); setCommissionValue(vendor.commission); }} className="bg-blue-50 text-blue-800 border border-blue-200 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-blue-100 transition font-[inherit]">💰 Commission</button>
                              <ActionBtn variant="warn" onClick={() => setSuspendingId(suspendingId === vendor._id ? null : vendor._id)}>🚫 Suspend</ActionBtn>
                            </>
                          )}
                          {vendor.approvalStatus === "suspended" && <ActionBtn variant="approve" onClick={() => handleUnsuspend(vendor._id)}>✓ Unsuspend</ActionBtn>}
                          {vendor.approvalStatus === "rejected" && <ActionBtn variant="approve" onClick={() => handleApprove(vendor._id)}>✓ Approve</ActionBtn>}
                        </div>
                      </div>
                      {commissionEdit[vendor._id] && (
                        <div className="mt-3 flex gap-2 items-center bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                          <span className="text-xs font-bold text-blue-800">Commission %:</span>
                          <input type="number" min="0" max="100" value={commissionValue} onChange={(e) => setCommissionValue(e.target.value)} className="border border-blue-200 rounded-lg px-3 py-1.5 text-sm w-20 outline-none focus:border-blue-500 font-[inherit]" />
                          <button onClick={() => handleUpdateCommission(vendor._id)} className="bg-blue-600 text-white border-none rounded-lg px-4 py-1.5 text-xs font-bold cursor-pointer font-[inherit]">Save</button>
                          <button onClick={() => setCommissionEdit({})} className="bg-white text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 text-xs cursor-pointer font-[inherit]">Cancel</button>
                        </div>
                      )}
                      {suspendingId === vendor._id && <RejectPanel show={true} reason={suspendReason} setReason={setSuspendReason} onConfirm={() => handleSuspend(vendor._id)} onCancel={() => setSuspendingId(null)} placeholder="Reason for suspension..." />}
                      {vendor.rejectionReason && ["rejected", "suspended"].includes(vendor.approvalStatus) && (
                        <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          <p className="text-[11px] text-red-600 font-semibold m-0">Reason: {vendor.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {allVendorsData?.pagination?.pages > 1 && (
                  <div className="flex justify-center gap-1.5 mt-5">
                    <PageBtn onClick={() => setVendorPage(p => Math.max(1, p - 1))} disabled={vendorPage === 1}>← Prev</PageBtn>
                    {Array.from({ length: allVendorsData.pagination.pages }, (_, i) => i + 1).map(p => <PageBtn key={p} active={vendorPage === p} onClick={() => setVendorPage(p)}>{p}</PageBtn>)}
                    <PageBtn onClick={() => setVendorPage(p => Math.min(allVendorsData.pagination.pages, p + 1))} disabled={vendorPage === allVendorsData.pagination.pages}>Next →</PageBtn>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "customers" && (
          <div>
            {selectedCustomer && customerDetailData?.data ? (
              <div>
                <button onClick={() => setSelectedCustomer(null)} className="flex items-center gap-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-2 cursor-pointer hover:bg-gray-50 transition mb-4 font-[inherit]">← Back to Customers</button>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#D85A30] to-[#FF8C5A] flex items-center justify-center text-white font-extrabold text-xl shrink-0">
                        {customerDetailData.data.firstName?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-gray-900 m-0">{customerDetailData.data.firstName} {customerDetailData.data.lastName}</h3>
                        <Badge status={customerDetailData.data.status} />
                      </div>
                    </div>
                    <InfoRow label="Email" value={customerDetailData.data.email} />
                    <InfoRow label="Phone" value={customerDetailData.data.phone} />
                    <InfoRow label="Joined" value={formatDate(customerDetailData.data.createdAt)} />
                    <InfoRow label="Last Login" value={customerDetailData.data.lastLogin ? formatDate(customerDetailData.data.lastLogin) : "Never"} />
                    <InfoRow label="Total Orders" value={customerDetailData.data.totalOrders} />
                    <InfoRow label="Total Spent" value={formatRupee(customerDetailData.data.totalSpent)} />
                    <div className="flex gap-2 mt-4">
                      {customerDetailData.data.status === "active" ? (
                        <button onClick={() => handleBlockCustomer(customerDetailData.data._id)} className="flex-1 bg-red-50 text-red-700 border border-red-200 rounded-xl py-2.5 text-xs font-bold cursor-pointer hover:bg-red-100 transition font-[inherit]">🚫 Block</button>
                      ) : (
                        <button onClick={() => handleUnblockCustomer(customerDetailData.data._id)} className="flex-1 bg-green-50 text-green-700 border border-green-200 rounded-xl py-2.5 text-xs font-bold cursor-pointer hover:bg-green-100 transition font-[inherit]">✓ Unblock</button>
                      )}
                      {deletingCustomerId === customerDetailData.data._id ? (
                        <div className="flex gap-1.5 flex-1">
                          <button onClick={() => handleDeleteCustomer(customerDetailData.data._id)} className="flex-1 bg-red-500 text-white border-none rounded-xl py-2.5 text-xs font-bold cursor-pointer font-[inherit]">Confirm</button>
                          <button onClick={() => setDeletingCustomerId(null)} className="bg-white text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 text-xs cursor-pointer font-[inherit]">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeletingCustomerId(customerDetailData.data._id)} className="flex-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl py-2.5 text-xs font-bold cursor-pointer hover:bg-gray-100 transition font-[inherit]">🗑️ Delete</button>
                      )}
                    </div>
                  </div>
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-4 m-0">Recent Orders ({customerDetailData.data.totalOrders})</h3>
                    {customerDetailData.data.recentOrders?.length === 0 ? <EmptyState icon="📦" title="No orders yet" /> : (
                      <div className="flex flex-col gap-2.5">
                        {customerDetailData.data.recentOrders?.map((order) => (
                          <div key={order._id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-3">
                            <div>
                              <p className="text-xs font-bold text-gray-900 m-0">{order.orderNumber}</p>
                              <p className="text-[11px] text-gray-400 m-0">{formatDate(order.createdAt)} · {order.items?.length} item{order.items?.length > 1 ? "s" : ""}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge status={order.orderStatus} />
                              <span className="text-sm font-extrabold text-[#B12704]">{formatRupee(order.total)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-900 m-0">Customer Management</h2>
                    <p className="text-xs text-gray-500 mt-1 m-0">{customersData?.pagination?.total || 0} total customers</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <form onSubmit={(e) => { e.preventDefault(); setCustomerSearch(customerSearchInput); setCustomerPage(1); }} className="flex gap-2 flex-1">
                    <input type="text" placeholder="Search by name, email, phone..." value={customerSearchInput} onChange={(e) => setCustomerSearchInput(e.target.value)} className={`${inputCls} flex-1`} />
                    <button type="submit" className="bg-[#131921] text-white border-none rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer font-[inherit]">Search</button>
                    {customerSearch && <button type="button" onClick={() => { setCustomerSearch(""); setCustomerSearchInput(""); }} className="bg-white text-gray-700 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer font-[inherit]">Clear</button>}
                  </form>
                  <div className="flex gap-1.5 flex-wrap">
                    {["", "active", "blocked"].map((s) => <FilterBtn key={s} active={customerStatusFilter === s} onClick={() => { setCustomerStatusFilter(s); setCustomerPage(1); }}>{s || "All"}</FilterBtn>)}
                  </div>
                </div>
                {customersLoading && <Spinner text="Loading customers..." />}
                {customersData?.data?.length === 0 && !customersLoading && <EmptyState icon="👥" title="No customers found" />}
                <div className="flex flex-col gap-2.5">
                  {customersData?.data?.map((customer) => (
                    <div key={customer._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 flex-wrap">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-bold text-base text-gray-700 shrink-0">
                        {customer.firstName?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-extrabold text-gray-900 m-0">{customer.firstName} {customer.lastName}</h3>
                          <Badge status={customer.status} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 m-0">{customer.email} · {customer.phone}</p>
                        <div className="flex gap-4 mt-1 text-[11px] text-gray-400">
                          <span>📦 {customer.orderCount || 0} orders</span>
                          <span>💰 {formatRupee(customer.totalSpent || 0)}</span>
                          <span>Joined {formatDate(customer.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 flex-wrap">
                        <button onClick={() => setSelectedCustomer(customer._id)} className="bg-purple-100 text-purple-800 border border-purple-200 rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer hover:bg-purple-200 transition font-[inherit]">View Details</button>
                        {customer.status === "active" ? (
                          blockingId === customer._id ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleBlockCustomer(customer._id)} className="bg-red-500 text-white border-none rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer font-[inherit]">Confirm</button>
                              <button onClick={() => setBlockingId(null)} className="bg-white text-gray-700 border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] cursor-pointer font-[inherit]">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setBlockingId(customer._id)} className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer hover:bg-red-100 transition font-[inherit]">🚫 Block</button>
                          )
                        ) : (
                          <button onClick={() => handleUnblockCustomer(customer._id)} className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer hover:bg-green-100 transition font-[inherit]">✓ Unblock</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {customersData?.pagination?.pages > 1 && (
                  <div className="flex justify-center gap-1.5 mt-5">
                    <PageBtn onClick={() => setCustomerPage(p => Math.max(1, p - 1))} disabled={customerPage === 1}>← Prev</PageBtn>
                    {Array.from({ length: customersData.pagination.pages }, (_, i) => i + 1).map(p => <PageBtn key={p} active={customerPage === p} onClick={() => setCustomerPage(p)}>{p}</PageBtn>)}
                    <PageBtn onClick={() => setCustomerPage(p => Math.min(customersData.pagination.pages, p + 1))} disabled={customerPage === customersData.pagination.pages}>Next →</PageBtn>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "admins" && (
          <div>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 m-0">Admin Management</h2>
                <p className="text-xs text-gray-500 mt-1 m-0">{adminsData?.data?.length || 0} admins total</p>
              </div>
              <button onClick={() => setShowAdminForm(!showAdminForm)} className="bg-[#131921] text-white border-none rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer font-[inherit] hover:bg-gray-800 transition">
                {showAdminForm ? "✕ Cancel" : "+ Create Admin"}
              </button>
            </div>
            {showAdminForm && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
                <h3 className="text-sm font-extrabold text-gray-900 mb-4 m-0">Create New Admin Account</h3>
                <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-gray-700 mb-1.5">First Name *</label><input type="text" placeholder="John" value={adminForm.firstName} onChange={(e) => setAdminForm({ ...adminForm, firstName: e.target.value })} className={inputCls} /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1.5">Last Name *</label><input type="text" placeholder="Doe" value={adminForm.lastName} onChange={(e) => setAdminForm({ ...adminForm, lastName: e.target.value })} className={inputCls} /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1.5">Email *</label><input type="email" placeholder="admin@example.com" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} className={inputCls} /></div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Phone *</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none"><span className="text-xs font-bold text-gray-600">+91</span><div className="w-px h-4 bg-gray-300" /></div>
                      <input type="text" placeholder="9876543210" value={adminForm.phone} maxLength={10} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} className={`${inputCls} pl-[54px]`} />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Password *</label>
                    <div className="relative">
                      <input type={showAdminPassword ? "text" : "password"} placeholder="Min 6 chars, 1 uppercase, 1 number" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} className={`${inputCls} pr-12`} />
                      <button type="button" onClick={() => setShowAdminPassword(!showAdminPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {showAdminPassword ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /> : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}
                        </svg>
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Min 6 characters, 1 uppercase letter, 1 number</p>
                  </div>
                  {adminFormError && <div className="sm:col-span-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3"><p className="text-xs text-red-600 font-semibold m-0">⚠️ {adminFormError}</p></div>}
                  <div className="sm:col-span-2 flex gap-3">
                    <button type="submit" disabled={adminFormLoading} className="flex-1 bg-[#131921] text-white border-none rounded-xl py-3 text-sm font-bold cursor-pointer disabled:opacity-50 transition font-[inherit] hover:bg-gray-800">
                      {adminFormLoading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</span> : "Create Admin Account"}
                    </button>
                    <button type="button" onClick={() => { setShowAdminForm(false); setAdminFormError(""); setAdminForm({ firstName: "", lastName: "", email: "", phone: "", password: "" }); }} className="bg-white text-gray-700 border border-gray-200 rounded-xl px-6 py-3 text-sm font-bold cursor-pointer font-[inherit]">Cancel</button>
                  </div>
                </form>
              </div>
            )}
            {adminsLoading && <Spinner text="Loading admins..." />}
            <div className="flex flex-col gap-2.5">
              {adminsData?.data?.map((admin) => (
                <div key={admin._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 flex-wrap">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center font-extrabold text-base text-red-700 shrink-0">{admin.firstName?.[0]?.toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-extrabold text-gray-900 m-0">{admin.firstName} {admin.lastName}</h3>
                      <span className="text-[9px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-extrabold uppercase">Admin</span>
                      {admin._id === (user?.id || user?._id) && <span className="text-[9px] bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-extrabold">You</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 m-0">{admin.email} · {admin.phone}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 m-0">Joined {formatDate(admin.createdAt)}</p>
                  </div>
                  <Badge status={admin.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-5 m-0">Category Management</h2>
            <form onSubmit={handleCreateCategory} className="mb-6 flex flex-col gap-3 max-w-lg">
              <div><label className="block text-xs font-bold text-gray-700 mb-1.5">Category Name *</label><input type="text" placeholder="e.g. Electronics, Fashion" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className={inputCls} /></div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1.5">Description (optional)</label><input type="text" placeholder="Brief description" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} className={inputCls} /></div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1.5">Parent Category</label><select value={categoryForm.parent} onChange={(e) => setCategoryForm({ ...categoryForm, parent: e.target.value })} className={inputCls}><option value="">No Parent (Main Category)</option>{categoryData?.data?.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}</select></div>
              {categoryError && <p className="text-red-500 text-xs font-semibold m-0">{categoryError}</p>}
              <button type="submit" disabled={creatingCategory} className="bg-[#131921] text-white border-none rounded-xl py-3 text-sm font-bold cursor-pointer disabled:opacity-50 transition font-[inherit] hover:bg-gray-800">{creatingCategory ? "Creating..." : "Create Category"}</button>
            </form>
            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-extrabold text-gray-700 mb-3">All Categories ({categoryData?.data?.length || 0})</h3>
              {categoriesLoading && <Spinner text="Loading..." />}
              <div className="flex flex-col gap-2.5">
                {categoryData?.data?.map((cat) => (
                  <div key={cat._id} className="border border-gray-100 rounded-xl px-4 py-3.5 hover:border-gray-200 transition">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 m-0">{cat.name}</h3>
                        {cat.description && <p className="text-xs text-gray-400 mt-0.5 m-0">{cat.description}</p>}
                        {cat.children?.length > 0 && <p className="text-[11px] text-gray-400 mt-0.5 m-0">{cat.children.length} subcategories</p>}
                      </div>
                      <ActionBtn variant="delete" onClick={() => handleDeleteCategory(cat._id)}>Delete</ActionBtn>
                    </div>
                    {cat.children?.length > 0 && (
                      <div className="mt-2.5 ml-5 border-l-2 border-gray-100 pl-3.5 flex flex-col gap-1.5">
                        {cat.children.map((sub) => (
                          <div key={sub._id} className="flex justify-between items-center">
                            <p className="text-xs font-semibold text-gray-700 m-0">{sub.name}</p>
                            <button onClick={() => handleDeleteCategory(sub._id)} className="bg-red-50 text-red-800 border border-red-200 rounded-md px-2.5 py-1 text-[11px] font-bold cursor-pointer font-[inherit]">Delete</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 m-0">Product Monitoring</h2>
                <p className="text-xs text-gray-500 mt-1 m-0">{productsData?.pagination?.total || 0} total products</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <form onSubmit={(e) => { e.preventDefault(); setProductSearch(productSearchInput); }} className="flex gap-2 flex-1">
                <input type="text" placeholder="Search by name, brand, SKU..." value={productSearchInput} onChange={(e) => setProductSearchInput(e.target.value)} className={`${inputCls} flex-1`} />
                <button type="submit" className="bg-[#131921] text-white border-none rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer font-[inherit]">Search</button>
                {productSearch && <button type="button" onClick={() => { setProductSearch(""); setProductSearchInput(""); }} className="bg-white text-gray-700 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer font-[inherit]">Clear</button>}
              </form>
              <div className="flex gap-1.5 flex-wrap">
                {[{ l: "All", v: "" }, { l: "Live", v: "approved" }, { l: "Delisted", v: "delisted" }].map((s) => (
                  <FilterBtn key={s.v} active={productStatusFilter === s.v} onClick={() => setProductStatusFilter(s.v)}>{s.l}</FilterBtn>
                ))}
              </div>
            </div>

            {productsLoading && <Spinner text="Loading products..." />}
            {productsData?.data?.length === 0 && !productsLoading && <EmptyState icon="📦" title="No products found" />}

            <div className="flex flex-col gap-3">
              {productsData?.data?.map((product) => (
                <div key={product._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 flex items-start gap-3.5">
                    <ProductImg src={product.images?.[0]?.url} alt={product.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="text-[15px] font-extrabold text-gray-900 m-0 mb-1">{product.name}</h3>
                          <div className="flex gap-2.5 flex-wrap text-xs text-gray-500">
                            <span>📂 {product.category?.name}</span>
                            <span>🏪 {product.vendorStore?.storeName || `${product.vendor?.firstName} ${product.vendor?.lastName}`}</span>
                            {product.brand && <span>🏷️ {product.brand}</span>}
                            {product.sku && <span className="font-mono">SKU: {product.sku}</span>}
                          </div>
                          <div className="flex gap-3 mt-1.5 items-center flex-wrap">
                            <span className="text-base font-extrabold text-[#B12704]">{formatRupee(product.price)}</span>
                            {product.comparePrice > 0 && <span className="text-xs text-gray-400 line-through">{formatRupee(product.comparePrice)}</span>}
                            <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                            <span className="text-xs text-gray-500">👁 {product.views || 0} views</span>
                            <span className="text-xs text-gray-500">📦 {product.totalSold || 0} sold</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <Badge status={product.status} />
                            {product.isFeatured && <span className="text-[10px] bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-extrabold">⭐ Featured</span>}
                          </div>
                          <div className="flex gap-1.5 flex-wrap">
                            <ActionBtn variant="view" onClick={() => setExpandedProduct(expandedProduct === product._id ? null : product._id)}>
                              {expandedProduct === product._id ? "▲ Hide" : "▼ Details"}
                            </ActionBtn>
                            <button onClick={() => handleFeatureProduct(product._id)}
                              className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer border transition-all font-[inherit] ${product.isFeatured ? "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200" : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"}`}>
                              {product.isFeatured ? "★ Unfeature" : "☆ Feature"}
                            </button>
                            {product.status === "approved" && (
                              <button onClick={() => setDelistingId(delistingId === product._id ? null : product._id)}
                                className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3.5 py-2 text-xs font-bold cursor-pointer hover:bg-red-100 transition font-[inherit]">
                                🚫 Delist
                              </button>
                            )}
                            {product.status === "delisted" && (
                              <button onClick={() => handleRelistProduct(product._id)}
                                className="bg-green-100 text-green-800 border border-green-200 rounded-lg px-3.5 py-2 text-xs font-bold cursor-pointer hover:bg-green-200 transition font-[inherit]">
                                ✓ Relist
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {delistingId === product._id && (
                    <div className="px-5 py-3 bg-red-50 border-t border-red-200">
                      <p className="text-xs font-bold text-red-600 mb-2 m-0">⚠️ Reason for delisting (will be shown to vendor)</p>
                      <div className="flex gap-2">
                        <input type="text" placeholder="e.g. Counterfeit product, Policy violation, False description..." value={delistReason} onChange={(e) => setDelistReason(e.target.value)} className="flex-1 border border-red-200 rounded-lg px-3 py-2.5 text-[13px] outline-none focus:border-red-400 bg-white font-[inherit]" />
                        <button onClick={() => handleDelistProduct(product._id)} className="bg-red-500 text-white border-none rounded-lg px-4 py-2.5 text-xs font-bold cursor-pointer font-[inherit]">Confirm Delist</button>
                        <button onClick={() => { setDelistingId(null); setDelistReason(""); }} className="bg-white text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-semibold cursor-pointer font-[inherit]">Cancel</button>
                      </div>
                    </div>
                  )}

                  {product.delistReason && product.status === "delisted" && (
                    <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200">
                      <p className="text-xs text-gray-600 font-semibold m-0">Delist Reason: {product.delistReason}</p>
                    </div>
                  )}

                  {expandedProduct === product._id && (
                    <div className="border-t border-gray-200 p-5 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <SecTitle icon="📦" title="Product Information" />
                          <InfoRow label="Name" value={product.name} />
                          <InfoRow label="Category" value={product.category?.name} />
                          <InfoRow label="Brand" value={product.brand} />
                          <InfoRow label="SKU" value={product.sku} mono />
                          <InfoRow label="Price" value={formatRupee(product.price)} />
                          <InfoRow label="Compare Price" value={product.comparePrice > 0 ? formatRupee(product.comparePrice) : "—"} />
                          <InfoRow label="Stock" value={product.stock} />
                          <InfoRow label="Low Stock Alert" value={product.lowStockThreshold} />
                          <InfoRow label="Weight" value={product.weight ? `${product.weight}g` : "—"} />
                          <InfoRow label="Views" value={product.views || 0} />
                          <InfoRow label="Sold" value={product.totalSold || 0} />
                          <InfoRow label="Rating" value={product.averageRating > 0 ? `${product.averageRating} ⭐` : "No reviews"} />
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <SecTitle icon="🏪" title="Vendor Information" />
                          <InfoRow label="Vendor" value={`${product.vendor?.firstName} ${product.vendor?.lastName}`} />
                          <InfoRow label="Email" value={product.vendor?.email} />
                          <InfoRow label="Store" value={product.vendorStore?.storeName} />
                          <InfoRow label="Status" value={product.status} />
                          <InfoRow label="Featured" value={product.isFeatured ? "Yes" : "No"} />
                          <InfoRow label="Listed" value={formatDate(product.createdAt)} />
                          {product.specifications?.length > 0 && <>
                            <SecTitle icon="📋" title="Specifications" />
                            {product.specifications.map((spec, i) => <InfoRow key={i} label={spec.key} value={spec.value} />)}
                          </>}
                        </div>
                      </div>
                      {product.images?.length > 0 && (
                        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
                          <SecTitle icon="🖼️" title="Product Images" />
                          <div className="flex gap-2.5 flex-wrap">
                            {product.images.map((img, i) => (
                              <a key={i} href={img.url} target="_blank" rel="noreferrer">
                                <ProductImg src={img.url} alt={`Product ${i + 1}`} size="90px" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {product.description && (
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <SecTitle icon="📝" title="Description" />
                          <p className="text-[13px] text-gray-700 m-0 leading-relaxed whitespace-pre-line">{product.description}</p>
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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 m-0">Order Monitoring</h2>
                <p className="text-xs text-gray-500 mt-1 m-0">{ordersData?.pagination?.total || 0} total orders · {formatRupee(ordersData?.summary?.totalRevenue)} revenue</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <form onSubmit={(e) => { e.preventDefault(); setOrderSearch(orderSearchInput); setOrderPage(1); }} className="flex gap-2 flex-1">
                <input type="text" placeholder="Search order number..." value={orderSearchInput} onChange={(e) => setOrderSearchInput(e.target.value)} className={`${inputCls} flex-1`} />
                <button type="submit" className="bg-[#131921] text-white border-none rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer font-[inherit]">Search</button>
                {orderSearch && <button type="button" onClick={() => { setOrderSearch(""); setOrderSearchInput(""); }} className="bg-white text-gray-700 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer font-[inherit]">Clear</button>}
              </form>
              <div className="flex gap-1.5 flex-wrap">
                {[{ l: "All", v: "" }, { l: "Confirmed", v: "confirmed" }, { l: "Processing", v: "processing" }, { l: "Shipped", v: "shipped" }, { l: "Delivered", v: "delivered" }, { l: "Cancelled", v: "cancelled" }].map((item) => (
                  <FilterBtn key={item.v} active={orderStatusFilter === item.v} onClick={() => { setOrderStatusFilter(item.v); setOrderPage(1); }}>{item.l}</FilterBtn>
                ))}
              </div>
            </div>

            {ordersLoading && <Spinner text="Loading orders..." />}
            {ordersData?.data?.length === 0 && !ordersLoading && <EmptyState icon="📦" title="No orders found" />}

            <div className="flex flex-col gap-3">
              {ordersData?.data?.map((order) => (
                <div key={order._id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4">
                    <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                      <div>
                        <p className="text-sm font-extrabold text-gray-900 m-0">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500 mt-0.5 m-0">{order.user?.firstName} {order.user?.lastName} · {order.user?.email}</p>
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
                          <div className="w-11 h-11 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                            <img src={item.image || "https://placehold.co/44?text=P"} alt={item.name} className="w-full h-full object-contain p-0.5" onError={(e) => { e.target.src = "https://placehold.co/44?text=P"; }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 m-0 truncate">{item.name}</p>
                            <p className="text-[11px] text-gray-500 m-0">Qty: {item.quantity} · {formatRupee(item.price * item.quantity)} · {item.storeName}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-50 rounded-xl px-3.5 py-2.5 mb-3 text-xs">
                      <p className="text-gray-600 m-0 font-medium">📍 {order.shippingAddress?.fullName}, {order.shippingAddress?.phone}</p>
                      <p className="text-gray-500 m-0">{order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.postalCode}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-gray-100">
                      <p className="text-xs text-gray-500 m-0">
                        <strong>{order.paymentMethod === "cod" ? "💵 COD" : "💳 Online"}</strong> ·{" "}
                        <span className={`font-bold ${order.paymentStatus === "paid" ? "text-green-600" : order.paymentStatus === "refunded" ? "text-pink-600" : "text-yellow-600"}`}>
                          {order.paymentStatus}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <span>Status managed by vendor</span>
                        {!["cancelled", "delivered", "refunded"].includes(order.orderStatus) && (
                          <button
                            onClick={() => setCancellingOrderId(cancellingOrderId === order._id ? null : order._id)}
                            className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-red-100 transition font-[inherit]"
                          >
                            Cancel (Admin)
                          </button>
                        )}
                      </div>
                    </div>

                    {order.cancelReason && (
                      <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <p className="text-[11px] text-red-600 font-semibold m-0">Cancel Reason: {order.cancelReason}</p>
                      </div>
                    )}
                  </div>

                  {cancellingOrderId === order._id && (
                    <div className="px-5 py-3 bg-red-50 border-t border-red-200">
                      <p className="text-xs font-bold text-red-600 mb-2 m-0">⚠️ Admin cancellation — extreme cases only (fraud, dispute)</p>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Reason for admin cancellation..." value={cancelOrderReason} onChange={(e) => setCancelOrderReason(e.target.value)} className="flex-1 border border-red-200 rounded-lg px-3 py-2.5 text-[13px] outline-none focus:border-red-400 bg-white font-[inherit]" />
                        <button onClick={() => handleAdminCancelOrder(order._id, cancelOrderReason)} className="bg-red-500 text-white border-none rounded-lg px-4 py-2.5 text-xs font-bold cursor-pointer font-[inherit]">Confirm</button>
                        <button onClick={() => { setCancellingOrderId(null); setCancelOrderReason(""); }} className="bg-white text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-semibold cursor-pointer font-[inherit]">Back</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {ordersData?.pagination?.pages > 1 && (
              <div className="flex justify-center gap-1.5 mt-5">
                <PageBtn onClick={() => setOrderPage(p => Math.max(1, p - 1))} disabled={orderPage === 1}>← Prev</PageBtn>
                {Array.from({ length: ordersData.pagination.pages }, (_, i) => i + 1).map(p => <PageBtn key={p} active={orderPage === p} onClick={() => setOrderPage(p)}>{p}</PageBtn>)}
                <PageBtn onClick={() => setOrderPage(p => Math.min(ordersData.pagination.pages, p + 1))} disabled={orderPage === ordersData.pagination.pages}>Next →</PageBtn>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-4 m-0">Review Management</h2>
            <div className="flex flex-wrap gap-2.5 mb-5">
              <select value={reviewSort} onChange={(e) => { setReviewSort(e.target.value); setReviewPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-gray-900 transition font-[inherit]">
                <option value="newest">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
              <div className="flex gap-1.5 flex-wrap">
                {[5, 4, 3, 2, 1].map((star) => <FilterBtn key={star} active={reviewRatingFilter === star} onClick={() => { setReviewRatingFilter(reviewRatingFilter === star ? undefined : star); setReviewPage(1); }}>{star} ★</FilterBtn>)}
                {reviewRatingFilter && <button onClick={() => { setReviewRatingFilter(undefined); setReviewPage(1); }} className="px-3 py-2 text-xs text-gray-500 bg-transparent border-none cursor-pointer font-[inherit]">Clear</button>}
              </div>
            </div>
            {reviewsLoading && <Spinner text="Loading reviews..." />}
            {reviewsData?.data?.length === 0 && !reviewsLoading && <EmptyState icon="💬" title="No reviews found" />}
            <div className="flex flex-col gap-3">
              {reviewsData?.data?.map((review) => (
                <div key={review._id} className="border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 font-bold text-sm text-gray-700">{review.user?.firstName?.[0]?.toUpperCase() || "U"}</div>
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
                      <div className="flex items-center gap-2 mb-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
                        {review.product?.images?.[0] && <img src={review.product.images[0].url} alt="" className="w-5 h-5 rounded object-cover" onError={(e) => { e.target.style.display = "none"; }} />}
                        <span className="text-[11px] text-gray-600 font-semibold">{review.product?.name}</span>
                      </div>
                    )}
                    {review.title && <p className="font-bold text-[13px] text-gray-900 m-0 mb-1">{review.title}</p>}
                    {review.body && <p className="text-[13px] text-gray-700 m-0 leading-relaxed">{review.body}</p>}
                    {review.images?.length > 0 && <div className="flex gap-1.5 mt-2">{review.images.map((img, i) => <img key={i} src={img.url} alt="" className="w-[52px] h-[52px] rounded-lg object-cover border border-gray-200" />)}</div>}
                    <p className="text-[11px] text-gray-400 mt-1.5 m-0">👍 {review.helpfulVotes?.length || 0} found helpful</p>
                  </div>
                </div>
              ))}
            </div>
            {reviewsData?.pagination?.pages > 1 && (
              <div className="flex justify-center gap-1.5 mt-5">
                <PageBtn onClick={() => setReviewPage(p => Math.max(1, p - 1))} disabled={reviewPage === 1}>← Prev</PageBtn>
                {Array.from({ length: reviewsData.pagination.pages }, (_, i) => i + 1).map(p => <PageBtn key={p} active={reviewPage === p} onClick={() => setReviewPage(p)}>{p}</PageBtn>)}
                <PageBtn onClick={() => setReviewPage(p => Math.min(reviewsData.pagination.pages, p + 1))} disabled={reviewPage === reviewsData.pagination.pages}>Next →</PageBtn>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;