import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { authApi, useLogoutMutation } from "../features/auth/authApi";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import {
  useGetVendorProductsQuery, useGetVendorStatsQuery,
  useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation,
} from "../features/product/productApi";
import {
  useVendorGetOrdersQuery, useVendorUpdateOrderStatusMutation,
} from "../features/order/orderApi";
import { useVendorGetProductReviewsQuery } from "../features/review/reviewApi";
import { useNavigate, useSearchParams } from "react-router-dom";
import ImageUploader from "../components/ImageUploader";
import { toast } from "../components/Toast";

const formatRupee = (amt) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amt || 0);

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const orderStatusConfig = {
  confirmed: { bg: "bg-green-100", text: "text-green-800", label: "Confirmed" },
  processing: { bg: "bg-blue-100", text: "text-blue-800", label: "Processing" },
  shipped: { bg: "bg-purple-100", text: "text-purple-800", label: "Shipped" },
  out_for_delivery: { bg: "bg-orange-100", text: "text-orange-800", label: "Out for Delivery" },
  delivered: { bg: "bg-green-100", text: "text-green-800", label: "Delivered" },
  cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled" },
  approved: { bg: "bg-green-100", text: "text-green-800", label: "Live" },
  rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
  delisted: { bg: "bg-gray-100", text: "text-gray-700", label: "Delisted" },
};

const Badge = ({ status }) => {
  const cfg = orderStatusConfig[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
};

const inputCls = "w-full border-[1.5px] border-gray-200 rounded-xl px-3.5 py-[10px] text-sm text-gray-900 bg-gray-50 outline-none focus:border-[#D85A30] focus:bg-white focus:ring-[3px] focus:ring-[#D85A30]/8 transition-all font-[inherit] box-border placeholder:text-gray-400";
const selectCls = `${inputCls} cursor-pointer`;

const Lbl = ({ children, required }) => (
  <label className="block text-xs font-bold text-gray-700 mb-1.5">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const Hint = ({ text, color = "text-gray-400" }) => (
  <span className={`block text-[11px] ${color} mt-1`}>{text}</span>
);

const TabBtn = ({ active, onClick, icon, label, badge }) => (
  <button onClick={onClick} className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border transition-all font-[inherit] ${active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
    <span>{icon}</span>{label}
    {badge > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#D85A30] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">{badge > 9 ? "9+" : badge}</span>}
  </button>
);

const FilterBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer border transition-all font-[inherit] ${active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
    {children}
  </button>
);

const PageBtn = ({ active, onClick, disabled, children }) => (
  <button onClick={onClick} disabled={disabled} className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all font-[inherit] disabled:opacity-40 disabled:cursor-not-allowed ${active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"}`}>
    {children}
  </button>
);

const EmptyState = ({ icon, title, subtitle, action }) => (
  <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
    <p className="text-5xl mb-4">{icon}</p>
    <p className="text-base font-bold text-gray-900 m-0">{title}</p>
    {subtitle && <p className="text-[13px] text-gray-500 mt-1.5 mb-5">{subtitle}</p>}
    {action}
  </div>
);

const Spinner = ({ text }) => (
  <div className="text-center py-10">
    <div className="w-7 h-7 border-[3px] border-[#D85A30] border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
    <p className="text-gray-500 text-[13px] m-0">{text}</p>
  </div>
);

const StatCard = ({ icon, label, value, sub, iconBg = "bg-gray-50", trend }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex flex-col gap-3 shadow-sm">
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

const MiniBar = ({ percent, color = "bg-[#D85A30]" }) => (
  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
    <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(percent, 100)}%` }} />
  </div>
);

const EMPTY_FORM = {
  name: "", description: "", shortDescription: "", category: "", brand: "",
  price: "", comparePrice: "", costPrice: "", stock: "", lowStockThreshold: "5",
  sku: "", weight: "", dimensions: { length: "", width: "", height: "" }, tags: "",
};

const FORM_STEPS = [
  { label: "Basic Info", icon: "📝" },
  { label: "Pricing & Stock", icon: "💰" },
  { label: "Images", icon: "🖼️" },
  { label: "Variants", icon: "🎨" },
  { label: "Specifications", icon: "📋" },
];

const ORDER_STATUS_FLOW = {
  confirmed: { next: "processing", nextLabel: "⚙️ Start Processing", color: "bg-blue-500 hover:bg-blue-600 text-white" },
  processing: { next: "shipped", nextLabel: "🚚 Mark Shipped", color: "bg-purple-500 hover:bg-purple-600 text-white" },
  shipped: { next: "out_for_delivery", nextLabel: "🛵 Out for Delivery", color: "bg-orange-500 hover:bg-orange-600 text-white" },
  out_for_delivery: { next: "delivered", nextLabel: "✅ Mark Delivered", color: "bg-green-500 hover:bg-green-600 text-white" },
};

const VendorDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, refreshToken } = useSelector((state) => state.auth);
  const [logoutAPI] = useLogoutMutation();

  const activeTab = searchParams.get("tab") || "overview";
  const setActiveTab = (tab) => setSearchParams({ tab });

  const { data: statsData, isLoading: statsLoading } = useGetVendorStatsQuery();
  const stats = statsData?.data;

  const { data: categoryData } = useGetCategoryTreeQuery();
  const [statusFilter, setStatusFilter] = useState("");
  const { data: productsData, isLoading: productsLoading } = useGetVendorProductsQuery({ status: statusFilter });
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const { data: ordersData, isLoading: ordersLoading } = useVendorGetOrdersQuery({ status: orderStatusFilter, page: orderPage });
  const [vendorUpdateOrderStatus] = useVendorUpdateOrderStatusMutation();
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const [reviewSort, setReviewSort] = useState("newest");
  const [reviewRatingFilter, setReviewRatingFilter] = useState(undefined);
  const [reviewPage, setReviewPage] = useState(1);
  const { data: reviewsData, isLoading: reviewsLoading } = useVendorGetProductReviewsQuery({ sort: reviewSort, rating: reviewRatingFilter, page: reviewPage, limit: 10 });

  const [formStep, setFormStep] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formError, setFormError] = useState("");
  const [productImages, setProductImages] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [variants, setVariants] = useState([]);
  const [specifications, setSpecifications] = useState([]);

  const categories = categoryData?.data || [];
  const allCategoryOptions = [];
  categories.forEach((cat) => {
    allCategoryOptions.push({ _id: cat._id, name: cat.name, level: 0 });
    (cat.children || []).forEach((sub) => allCategoryOptions.push({ _id: sub._id, name: `↳ ${sub.name}`, level: 1 }));
  });

  const handleLogout = async () => {
    try { await logoutAPI({ refreshToken }).unwrap(); } catch (err) { console.log(err); }
    finally { dispatch(authApi.util.resetApiState()); dispatch(logout()); navigate("/login"); }
  };

  const resetForm = () => { setForm(EMPTY_FORM); setProductImages([]); setVariants([]); setSpecifications([]); setFormError(""); setFormStep(1); setEditingProduct(null); };
  const openAddForm = () => { resetForm(); setShowForm(true); setActiveTab("products"); };

  const openEditForm = (product) => {
    setEditingProduct(product);
    setForm({ name: product.name || "", description: product.description || "", shortDescription: product.shortDescription || "", category: product.category?._id || "", brand: product.brand || "", price: product.price || "", comparePrice: product.comparePrice || "", costPrice: product.costPrice || "", stock: product.stock || "", lowStockThreshold: product.lowStockThreshold || "5", sku: product.sku || "", weight: product.weight || "", dimensions: { length: product.dimensions?.length || "", width: product.dimensions?.width || "", height: product.dimensions?.height || "" }, tags: product.tags?.join(", ") || "" });
    setProductImages(product.images?.map((img) => ({ url: img.url, filename: img.url.split("/").pop(), isDefault: img.isDefault })) || []);
    setVariants(product.variants || []);
    setSpecifications(product.specifications || []);
    setFormStep(1);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); resetForm(); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("dim_")) {
      const key = name.replace("dim_", "");
      setForm((prev) => ({ ...prev, dimensions: { ...prev.dimensions, [key]: value } }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    setFormError("");
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!form.name.trim()) return "Product name is required";
      if (form.name.trim().length < 3) return "Product name must be at least 3 characters";
      if (!form.category) return "Category is required";
      if (!form.description.trim()) return "Description is required";
      if (form.description.trim().length < 20) return "Description must be at least 20 characters";
    }
    if (step === 2) {
      if (!form.price || Number(form.price) <= 0) return "Valid price is required";
      if (!form.stock || Number(form.stock) < 0) return "Valid stock quantity is required";
      if (form.comparePrice && Number(form.comparePrice) < Number(form.price)) return "Compare price should be higher than selling price";
    }
    if (step === 3) {
      if (productImages.length === 0) return "At least one product image is required";
    }
    return null;
  };

  const handleNext = () => { const err = validateStep(formStep); if (err) { setFormError(err); return; } setFormError(""); setFormStep((s) => s + 1); };
  const handleBack = () => { setFormError(""); setFormStep((s) => s - 1); };

  const addVariant = () => setVariants((prev) => [...prev, { name: "", options: [{ label: "", value: "", priceModifier: 0 }] }]);
  const updateVariantName = (i, name) => setVariants((prev) => prev.map((v, idx) => idx === i ? { ...v, name } : v));
  const addVariantOption = (vi) => setVariants((prev) => prev.map((v, i) => i === vi ? { ...v, options: [...v.options, { label: "", value: "", priceModifier: 0 }] } : v));
  const updateVariantOption = (vi, oi, key, value) => setVariants((prev) => prev.map((v, i) => i === vi ? { ...v, options: v.options.map((opt, j) => j === oi ? { ...opt, [key]: value } : opt) } : v));
  const removeVariantOption = (vi, oi) => setVariants((prev) => prev.map((v, i) => i === vi ? { ...v, options: v.options.filter((_, j) => j !== oi) } : v));
  const removeVariant = (i) => setVariants((prev) => prev.filter((_, idx) => idx !== i));
  const addSpec = () => setSpecifications((prev) => [...prev, { key: "", value: "" }]);
  const updateSpec = (i, field, value) => setSpecifications((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  const removeSpec = (i) => setSpecifications((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    setFormError("");
    const productData = {
      name: form.name.trim(), description: form.description.trim(), shortDescription: form.shortDescription.trim(),
      category: form.category, brand: form.brand.trim(), price: Number(form.price),
      comparePrice: Number(form.comparePrice) || 0, costPrice: Number(form.costPrice) || 0,
      stock: Number(form.stock), lowStockThreshold: Number(form.lowStockThreshold) || 5,
      sku: form.sku.trim(), weight: Number(form.weight) || 0,
      dimensions: { length: Number(form.dimensions.length) || 0, width: Number(form.dimensions.width) || 0, height: Number(form.dimensions.height) || 0 },
      tags: form.tags.split(",").map((t) => t.trim()).filter((t) => t),
      images: productImages.map((img, index) => ({ url: img.url, alt: form.name, isDefault: index === 0 })),
      variants: variants.filter((v) => v.name.trim()),
      specifications: specifications.filter((s) => s.key.trim() && s.value.trim()),
    };
    try {
      if (editingProduct) {
        await updateProduct({ id: editingProduct._id, ...productData }).unwrap();
        toast.success("Product updated successfully!");
      } else {
        await createProduct(productData).unwrap();
        toast.success("🎉 Product listed successfully! It's now live.");
      }
      closeForm();
    } catch (err) {
      const msg = err?.data?.message || "Failed to save product";
      setFormError(msg);
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    try { await deleteProduct(id).unwrap(); setDeletingId(null); toast.success("Product deleted"); }
    catch (err) { toast.error(err?.data?.message || "Failed to delete"); }
  };

  const handleVendorUpdateStatus = async (orderId, status, reason) => {
    try {
      await vendorUpdateOrderStatus({ id: orderId, status, reason }).unwrap();
      toast.success(`Order updated → ${orderStatusConfig[status]?.label || status}`);
      setCancellingOrderId(null);
      setCancelReason("");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update order status");
    }
  };

  const ratingBreakdown = reviewsData?.ratingBreakdown || {};
  const totalReviews = reviewsData?.pagination?.total || 0;
  const avgRating = totalReviews > 0
    ? (Object.entries(ratingBreakdown).reduce((sum, [star, count]) => sum + Number(star) * count, 0) / totalReviews).toFixed(1)
    : "0.0";

  const isSubmitting = creating || updating;

  const dailyData = stats?.revenue?.daily ? Object.entries(stats.revenue.daily) : [];
  const maxDaily = Math.max(...dailyData.map(([, v]) => v), 1);

  const pendingOrdersCount = ordersData?.data?.filter(o => o.orderStatus === "confirmed").length || 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } } .form-step { animation: slideIn 0.2s ease both; }`}</style>

      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 sm:px-6 py-5 sm:py-6">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#D85A30] to-[#FF8C5A] rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-orange-500/30">
              {user?.firstName?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-slate-400 text-xs m-0">Vendor Dashboard</p>
              <h1 className="text-white font-extrabold text-lg sm:text-xl m-0">{user?.firstName} {user?.lastName}</h1>
              <p className="text-slate-500 text-[11px] m-0 mt-0.5">
                {stats?.store?.storeName && <span className="text-[#FF8C5A] font-semibold">{stats.store.storeName}</span>}
                {stats?.store?.commission && <span className="ml-2 text-slate-400">· {stats.store.commission}% commission</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {pendingOrdersCount > 0 && (
              <button onClick={() => setActiveTab("orders")} className="bg-yellow-500/15 border border-yellow-400/30 text-yellow-300 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer hover:bg-yellow-500/25 transition font-[inherit]">
                🕐 {pendingOrdersCount} new order{pendingOrdersCount > 1 ? "s" : ""}
              </button>
            )}
            <button onClick={openAddForm} className="bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white border-none rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer shadow-md shadow-orange-500/25 font-[inherit]">
              + Add Product
            </button>
            <button onClick={handleLogout} className="bg-white/8 border border-white/15 text-white text-sm font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-white/15 transition font-[inherit]">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-5 sm:py-6">

        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: "overview", label: "Overview", icon: "📊" },
            { key: "products", label: "Products", icon: "📦" },
            { key: "orders", label: "Orders", icon: "🛒", badge: pendingOrdersCount },
            { key: "reviews", label: "Reviews", icon: "⭐" },
          ].map((tab) => (
            <TabBtn key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} icon={tab.icon} label={tab.label} badge={tab.badge} />
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="flex flex-col gap-5">
            {statsLoading ? (
              <Spinner text="Loading your dashboard..." />
            ) : (
              <>
                {stats?.products?.outOfStock > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3.5 flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-red-800 m-0">{stats.products.outOfStock} product{stats.products.outOfStock > 1 ? "s" : ""} out of stock</p>
                      <p className="text-xs text-red-600 m-0">Update your inventory to avoid losing sales</p>
                    </div>
                    <button onClick={() => setActiveTab("products")} className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-red-200 transition font-[inherit]">
                      Fix Now →
                    </button>
                  </div>
                )}

                {pendingOrdersCount > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3.5 flex items-center gap-3">
                    <span className="text-xl">🛒</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-blue-800 m-0">{pendingOrdersCount} new order{pendingOrdersCount > 1 ? "s" : ""} waiting to be processed</p>
                      <p className="text-xs text-blue-600 m-0">Process orders quickly to maintain good ratings</p>
                    </div>
                    <button onClick={() => setActiveTab("orders")} className="text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-blue-200 transition font-[inherit]">
                      Process Now →
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard icon="💰" label="Total Revenue" value={formatRupee(stats?.revenue?.total)} sub="All time" iconBg="bg-green-50" trend={stats?.revenue?.monthlyGrowth} />
                  <StatCard icon="📅" label="This Month" value={formatRupee(stats?.revenue?.thisMonth)} sub={`vs ${formatRupee(stats?.revenue?.lastMonth)} last month`} iconBg="bg-blue-50" />
                  <StatCard icon="🛒" label="Total Orders" value={stats?.orders?.total || 0} sub={`${stats?.orders?.last30Days || 0} in last 30 days`} iconBg="bg-purple-50" />
                  <StatCard icon="📦" label="Total Products" value={stats?.products?.total || 0} sub={`${stats?.products?.approved || 0} live`} iconBg="bg-orange-50" />
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
                                <div className="w-full bg-gradient-to-t from-[#D85A30] to-[#FF8C5A] rounded-t-lg transition-all duration-500 cursor-pointer group-hover:from-[#C04A20]" style={{ height: `${Math.max(pct, 4)}%` }} title={`${label}: ${formatRupee(value)}`} />
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
                    ) : (
                      <div className="h-32 flex items-center justify-center text-gray-400 text-sm">No revenue data yet</div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-5 m-0">Order Status</h3>
                    <div className="flex flex-col gap-3">
                      {[
                        { label: "Confirmed", value: stats?.orders?.confirmed || 0, color: "bg-green-400", total: stats?.orders?.total },
                        { label: "Processing", value: stats?.orders?.processing || 0, color: "bg-blue-400", total: stats?.orders?.total },
                        { label: "Shipped", value: stats?.orders?.shipped || 0, color: "bg-purple-400", total: stats?.orders?.total },
                        { label: "Delivered", value: stats?.orders?.delivered || 0, color: "bg-green-500", total: stats?.orders?.total },
                        { label: "Cancelled", value: stats?.orders?.cancelled || 0, color: "bg-red-400", total: stats?.orders?.total },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2.5">
                          <span className="text-xs text-gray-500 w-16 shrink-0">{item.label}</span>
                          <MiniBar percent={item.total ? (item.value / item.total) * 100 : 0} color={item.color} />
                          <span className="text-xs font-bold text-gray-700 w-6 text-right shrink-0">{item.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-gray-50 rounded-xl">
                        <p className="text-base font-extrabold text-gray-900 m-0">{stats?.orders?.last7Days || 0}</p>
                        <p className="text-[10px] text-gray-400 m-0">Last 7 days</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-xl">
                        <p className="text-base font-extrabold text-gray-900 m-0">{stats?.orders?.last30Days || 0}</p>
                        <p className="text-[10px] text-gray-400 m-0">Last 30 days</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-4 m-0">Product Health</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Live", value: stats?.products?.approved || 0, icon: "✅", bg: "bg-green-50", text: "text-green-700" },
                        { label: "Low Stock", value: stats?.products?.lowStock || 0, icon: "⚠️", bg: "bg-orange-50", text: "text-orange-700" },
                        { label: "Out of Stock", value: stats?.products?.outOfStock || 0, icon: "🚫", bg: "bg-red-50", text: "text-red-700" },
                        { label: "Total Listed", value: stats?.products?.total || 0, icon: "📦", bg: "bg-gray-50", text: "text-gray-700" },
                      ].map((item) => (
                        <div key={item.label} className={`${item.bg} rounded-xl p-3 flex items-center gap-2.5`}>
                          <span className="text-lg">{item.icon}</span>
                          <div>
                            <p className={`text-base font-extrabold ${item.text} m-0`}>{item.value}</p>
                            <p className="text-[10px] text-gray-500 m-0">{item.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => setActiveTab("products")} className="flex-1 bg-gray-900 text-white border-none rounded-xl py-2.5 text-xs font-bold cursor-pointer hover:bg-gray-800 transition font-[inherit]">Manage Products</button>
                      <button onClick={openAddForm} className="flex-1 bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white border-none rounded-xl py-2.5 text-xs font-bold cursor-pointer font-[inherit]">+ Add Product</button>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-4 m-0">Top Selling Products</h3>
                    {stats?.topProducts?.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {stats.topProducts.map((product, i) => (
                          <div key={product._id} className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-500"}`}>{i + 1}</span>
                            {product.images?.[0]?.url ? (
                              <img src={product.images[0].url} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg shrink-0">📦</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 m-0 truncate">{product.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-gray-500">{formatRupee(product.price)}</span>
                                {product.averageRating > 0 && <span className="text-[10px] text-yellow-500">★ {product.averageRating.toFixed(1)}</span>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-extrabold text-gray-900 m-0">{product.totalSold}</p>
                              <p className="text-[10px] text-gray-400 m-0">sold</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-3xl mb-2">📈</p>
                        <p className="text-sm text-gray-500 m-0">No sales data yet</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-4 m-0">Quick Actions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { icon: "➕", label: "Add Product", sub: "List a new product", onClick: openAddForm, color: "from-[#D85A30] to-[#FF8C5A]", text: "text-white" },
                      { icon: "📦", label: "View Orders", sub: `${pendingOrdersCount} need action`, onClick: () => setActiveTab("orders"), color: "from-blue-500 to-blue-600", text: "text-white" },
                      { icon: "⭐", label: "Reviews", sub: `${totalReviews} total`, onClick: () => setActiveTab("reviews"), color: "from-yellow-400 to-yellow-500", text: "text-gray-900" },
                      { icon: "📋", label: "My Products", sub: `${stats?.products?.total || 0} listed`, onClick: () => setActiveTab("products"), color: "from-slate-700 to-slate-800", text: "text-white" },
                    ].map((item) => (
                      <button key={item.label} onClick={item.onClick} className={`bg-gradient-to-br ${item.color} ${item.text} rounded-2xl p-4 text-left border-none cursor-pointer hover:scale-[1.02] transition-all shadow-sm font-[inherit]`}>
                        <span className="text-2xl block mb-2">{item.icon}</span>
                        <p className="text-sm font-extrabold m-0">{item.label}</p>
                        <p className={`text-[11px] m-0 mt-0.5 ${item.text === "text-white" ? "opacity-75" : "opacity-60"}`}>{item.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "products" && (
          <div>
            {showForm ? (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 sm:p-7">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-black text-white m-0">{editingProduct ? "Edit Product" : "Add New Product"}</h2>
                      <p className="text-xs text-slate-500 mt-1 m-0">Step {formStep} of {FORM_STEPS.length} — {FORM_STEPS[formStep - 1].label}</p>
                    </div>
                    <button onClick={closeForm} className="bg-white/10 border border-white/15 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer hover:bg-white/20 transition font-[inherit]">✕ Cancel</button>
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    {FORM_STEPS.map((step, i) => {
                      const isDone = formStep > i + 1;
                      const isActive = formStep === i + 1;
                      return (
                        <div key={step.label} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${isDone ? "bg-green-500 text-white" : isActive ? "bg-[#D85A30] text-white" : "bg-white/8 text-slate-500"}`}>
                            {isDone ? <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" /></svg> : step.icon}
                          </div>
                          <span className={`text-[10px] hidden sm:block ${isActive ? "text-white font-bold" : "text-slate-500"}`}>{step.label}</span>
                          <div className={`h-[3px] rounded-full w-full transition-all duration-300 ${isDone ? "bg-green-500" : isActive ? "bg-[#D85A30]" : "bg-white/10"}`} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-5 sm:p-7">
                  {formStep === 1 && (
                    <div className="form-step flex flex-col gap-4 sm:gap-[18px]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2"><Lbl required>Product Name</Lbl><input name="name" placeholder="Enter a clear, descriptive product name" value={form.name} onChange={handleChange} className={inputCls} /><Hint text="Good product names are specific and include key details" /></div>
                        <div><Lbl required>Category</Lbl><select name="category" value={form.category} onChange={handleChange} className={selectCls}><option value="">Select Category</option>{allCategoryOptions.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}</select></div>
                        <div><Lbl>Brand</Lbl><input name="brand" placeholder="e.g. Nike, Samsung, Generic" value={form.brand} onChange={handleChange} className={inputCls} /></div>
                        <div className="sm:col-span-2"><Lbl>Short Description</Lbl><input name="shortDescription" placeholder="One line summary shown on product cards" value={form.shortDescription} onChange={handleChange} className={inputCls} /></div>
                        <div className="sm:col-span-2">
                          <Lbl required>Full Description</Lbl>
                          <textarea name="description" placeholder="Write a detailed description. Minimum 20 characters." value={form.description} onChange={handleChange} rows={6} className={`${inputCls} resize-vertical`} />
                          <Hint text={`${form.description.length} characters ${form.description.length < 20 ? "(minimum 20)" : "✓"}`} color={form.description.length < 20 ? "text-red-500" : "text-green-600"} />
                        </div>
                      </div>
                    </div>
                  )}

                  {formStep === 2 && (
                    <div className="form-step flex flex-col gap-4 sm:gap-[18px]">
                      <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                        <span className="text-base shrink-0">💡</span>
                        <p className="text-xs text-orange-800 m-0 leading-relaxed">Set competitive prices. Compare Price (MRP) creates a discount badge. Cost Price is for internal tracking only.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[{ name: "price", label: "Selling Price (₹)", required: true }, { name: "comparePrice", label: "Compare Price / MRP (₹)", required: false }, { name: "costPrice", label: "Cost Price (₹)", required: false, hint: "Internal only" }].map((field) => (
                          <div key={field.name}>
                            <Lbl required={field.required}>{field.label}</Lbl>
                            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">₹</span><input name={field.name} type="number" min="0" placeholder="0" value={form[field.name]} onChange={handleChange} className={`${inputCls} pl-7`} /></div>
                            {field.hint && <Hint text={field.hint} />}
                          </div>
                        ))}
                      </div>
                      {form.price && form.comparePrice && Number(form.comparePrice) > Number(form.price) && <Hint text={`${Math.round(((form.comparePrice - form.price) / form.comparePrice) * 100)}% discount badge will show`} color="text-green-600" />}
                      {form.price && form.costPrice && Number(form.costPrice) > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                          <p className="text-xs text-green-700 font-semibold m-0">Profit: {formatRupee(Number(form.price) - Number(form.costPrice))} ({Math.round(((form.price - form.costPrice) / form.price) * 100)}% margin)</p>
                        </div>
                      )}
                      <div className="h-px bg-gray-200" />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div><Lbl required>Stock Quantity</Lbl><input name="stock" type="number" min="0" placeholder="0" value={form.stock} onChange={handleChange} className={inputCls} /></div>
                        <div><Lbl>Low Stock Alert</Lbl><input name="lowStockThreshold" type="number" min="1" placeholder="5" value={form.lowStockThreshold} onChange={handleChange} className={inputCls} /><Hint text="Alert when stock falls below this" /></div>
                        <div><Lbl>SKU / Product Code</Lbl><input name="sku" placeholder="e.g. PROD-001" value={form.sku} onChange={handleChange} className={inputCls} /></div>
                      </div>
                      <div className="h-px bg-gray-200" />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[{ name: "weight", label: "Weight (g)", ph: "e.g. 500" }, { name: "dim_length", label: "Length (cm)", ph: "0" }, { name: "dim_width", label: "Width (cm)", ph: "0" }, { name: "dim_height", label: "Height (cm)", ph: "0" }].map((f) => (
                          <div key={f.name}><Lbl>{f.label}</Lbl><input name={f.name} type="number" min="0" placeholder={f.ph} value={f.name === "weight" ? form.weight : form.dimensions[f.name.replace("dim_", "")]} onChange={handleChange} className={inputCls} /></div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formStep === 3 && (
                    <div className="form-step flex flex-col gap-4">
                      <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                        <p className="text-xs text-purple-800 font-bold mb-1.5 m-0">📸 Image Guidelines</p>
                        <ul className="text-[11px] text-purple-700 m-0 pl-4 leading-relaxed">
                          <li>Upload at least 1 image (maximum 10)</li>
                          <li>First image will be the main product image</li>
                          <li>Use square images (1:1 ratio) for best results</li>
                          <li>White or neutral background preferred</li>
                        </ul>
                      </div>
                      <ImageUploader images={productImages} setImages={setProductImages} maxImages={10} />
                    </div>
                  )}

                  {formStep === 4 && (
                    <div className="form-step flex flex-col gap-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div><h3 className="text-[15px] font-extrabold text-gray-900 m-0">Product Variants</h3><p className="text-xs text-gray-500 mt-1 m-0">Add variants like Size, Color, Material.</p></div>
                        <button type="button" onClick={addVariant} className="bg-gray-900 text-white border-none rounded-xl px-4 py-2.5 text-[13px] font-bold cursor-pointer font-[inherit]">+ Add Variant</button>
                      </div>
                      {variants.length === 0 && (
                        <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                          <p className="text-4xl mb-3">🎨</p>
                          <p className="text-sm font-bold text-gray-700 m-0">No Variants Added</p>
                          <p className="text-xs text-gray-500 mt-1 mb-4">Optional — Add if your product comes in different sizes, colors, or materials</p>
                          <button type="button" onClick={addVariant} className="bg-gray-900 text-white border-none rounded-xl px-5 py-2.5 text-[13px] font-bold cursor-pointer font-[inherit]">+ Add First Variant</button>
                        </div>
                      )}
                      <div className="flex flex-col gap-4">
                        {variants.map((variant, vi) => (
                          <div key={vi} className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
                              <select value={variant.name} onChange={(e) => updateVariantName(vi, e.target.value)} className={`${selectCls} flex-1`}>
                                <option value="">Select Variant Type</option>
                                {["Color", "Size", "Material", "Style", "Capacity", "Flavor", "Scent", "Pack Size", "Custom"].map((v) => <option key={v} value={v}>{v}</option>)}
                              </select>
                              <button type="button" onClick={() => removeVariant(vi)} className="bg-red-100 text-red-800 border border-red-200 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer font-[inherit]">Remove</button>
                            </div>
                            <div className="flex flex-col gap-2">
                              {variant.options.map((opt, oi) => (
                                <div key={oi} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                                  <input placeholder="Label (e.g. Red)" value={opt.label} onChange={(e) => updateVariantOption(vi, oi, "label", e.target.value)} className={inputCls} />
                                  <input placeholder="Value (e.g. red)" value={opt.value} onChange={(e) => updateVariantOption(vi, oi, "value", e.target.value)} className={inputCls} />
                                  <div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">{Number(opt.priceModifier) >= 0 ? "+₹" : "-₹"}</span><input type="number" placeholder="0" value={opt.priceModifier} onChange={(e) => updateVariantOption(vi, oi, "priceModifier", Number(e.target.value))} className={`${inputCls} pl-8`} /></div>
                                  <button type="button" onClick={() => removeVariantOption(vi, oi)} className="bg-red-100 text-red-800 border border-red-200 rounded-lg px-2.5 py-2 text-sm cursor-pointer font-[inherit]">×</button>
                                </div>
                              ))}
                              <button type="button" onClick={() => addVariantOption(vi)} className="bg-white text-gray-600 border-[1.5px] border-dashed border-gray-300 rounded-lg py-2 text-xs font-semibold cursor-pointer font-[inherit]">+ Add Option</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formStep === 5 && (
                    <div className="form-step flex flex-col gap-5">
                      <div>
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                          <div><h3 className="text-[15px] font-extrabold text-gray-900 m-0">Specifications</h3><p className="text-xs text-gray-500 mt-1 m-0">Technical details like material, dimensions, compatibility.</p></div>
                          <button type="button" onClick={addSpec} className="bg-gray-900 text-white border-none rounded-xl px-4 py-2.5 text-[13px] font-bold cursor-pointer font-[inherit]">+ Add Spec</button>
                        </div>
                        {specifications.length === 0 && (
                          <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <p className="text-3xl mb-2">📋</p>
                            <p className="text-sm font-bold text-gray-700 m-0">No Specifications</p>
                            <p className="text-xs text-gray-500 mt-1 m-0">Optional but improves discoverability</p>
                          </div>
                        )}
                        {specifications.length > 0 && (
                          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 pb-1.5">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.06em]">Specification</span>
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.06em]">Value</span>
                            <span />
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          {specifications.map((spec, i) => (
                            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                              <input placeholder="e.g. Material" value={spec.key} onChange={(e) => updateSpec(i, "key", e.target.value)} className={inputCls} />
                              <input placeholder="e.g. Stainless Steel" value={spec.value} onChange={(e) => updateSpec(i, "value", e.target.value)} className={inputCls} />
                              <button type="button" onClick={() => removeSpec(i)} className="bg-red-100 text-red-800 border border-red-200 rounded-lg px-2.5 py-2 text-sm cursor-pointer font-[inherit]">×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="h-px bg-gray-200" />
                      <div>
                        <Lbl>Tags</Lbl>
                        <input name="tags" placeholder="e.g. wireless, bluetooth, gaming (comma separated)" value={form.tags} onChange={handleChange} className={inputCls} />
                        <Hint text="Tags help customers find your product" />
                        {form.tags && (
                          <div className="flex gap-1.5 flex-wrap mt-2">
                            {form.tags.split(",").map((t) => t.trim()).filter((t) => t).map((tag) => (
                              <span key={tag} className="bg-gray-100 text-gray-700 text-[11px] px-2.5 py-1 rounded-full font-semibold">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="h-px bg-gray-200" />
                      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
                        <h4 className="text-[13px] font-extrabold text-gray-900 mb-3 m-0">📋 Product Summary</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { label: "Name", value: form.name || "—" },
                            { label: "Category", value: allCategoryOptions.find((c) => c._id === form.category)?.name || "—" },
                            { label: "Price", value: form.price ? formatRupee(Number(form.price)) : "—" },
                            { label: "Stock", value: form.stock || "—" },
                            { label: "Images", value: `${productImages.length} uploaded` },
                            { label: "Variants", value: `${variants.filter((v) => v.name).length} added` },
                          ].map((item) => (
                            <div key={item.label} className="flex justify-between py-1.5 border-b border-gray-100">
                              <span className="text-xs text-gray-500">{item.label}</span>
                              <span className="text-xs font-bold text-gray-900">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {formError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-4 flex items-center gap-2">
                      <span>⚠️</span>
                      <p className="text-[13px] text-red-600 font-medium m-0">{formError}</p>
                    </div>
                  )}

                  <div className="flex gap-2.5 mt-6 pt-5 border-t border-gray-200">
                    {formStep > 1 && (
                      <button type="button" onClick={handleBack} className="bg-white text-gray-700 border-[1.5px] border-gray-200 rounded-xl px-5 py-3 text-sm font-bold cursor-pointer hover:bg-gray-50 transition font-[inherit]">← Back</button>
                    )}
                    {formStep < FORM_STEPS.length ? (
                      <button type="button" onClick={handleNext} className="flex-1 bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white border-none rounded-xl py-3.5 text-[15px] font-extrabold cursor-pointer shadow-lg shadow-orange-500/25 font-[inherit]">
                        Continue to {FORM_STEPS[formStep].label} →
                      </button>
                    ) : (
                      <button type="button" onClick={handleSubmit} disabled={isSubmitting} className={`flex-1 text-white border-none rounded-xl py-3.5 text-[15px] font-extrabold cursor-pointer transition-all font-[inherit] ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-green-600 to-green-500 shadow-lg shadow-green-500/25"}`}>
                        {isSubmitting ? (
                          <span className="flex items-center justify-center gap-2"><span className="w-[18px] h-[18px] border-[2.5px] border-white/40 border-t-white rounded-full animate-spin inline-block" />{editingProduct ? "Saving..." : "Publishing..."}</span>
                        ) : (
                          <span>{editingProduct ? "✓ Save Changes" : "🚀 Publish Product"}</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-900 m-0">My Products</h2>
                    <p className="text-xs text-gray-500 mt-1 m-0">{productsData?.pagination?.total || 0} products total</p>
                  </div>
                  <button onClick={openAddForm} className="bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white border-none rounded-xl px-5 py-2.5 text-[13px] font-extrabold cursor-pointer shadow-lg shadow-orange-500/25 font-[inherit]">
                    + Add Product
                  </button>
                </div>

                <div className="flex gap-1.5 mb-4 flex-wrap">
                  {[{ label: "All", value: "" }, { label: "Live", value: "approved" }, { label: "Low Stock", value: "low_stock" }, { label: "Delisted", value: "delisted" }].map((item) => (
                    <FilterBtn key={item.value} active={statusFilter === item.value} onClick={() => setStatusFilter(item.value)}>{item.label}</FilterBtn>
                  ))}
                </div>

                {productsLoading && <Spinner text="Loading products..." />}
                {!productsLoading && productsData?.data?.length === 0 && (
                  <EmptyState icon="📦" title="No products yet" subtitle="Start selling by adding your first product"
                    action={<button onClick={openAddForm} className="bg-gray-900 text-white border-none rounded-xl px-6 py-3 text-sm font-bold cursor-pointer font-[inherit]">+ Add First Product</button>}
                  />
                )}

                <div className="flex flex-col gap-2.5">
                  {productsData?.data?.map((product) => (
                    <div key={product._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3.5 items-start">
                      <div className="w-20 h-20 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {product.images?.[0] ? (
                          <img src={product.images[0].url} alt={product.name} className="w-full h-full object-contain p-1" onError={(e) => { e.target.src = "https://placehold.co/80?text=No+Image"; }} />
                        ) : <span className="text-3xl">📦</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <h3 className="text-sm font-extrabold text-gray-900 m-0 mb-1">{product.name}</h3>
                            <div className="flex gap-2.5 flex-wrap text-xs text-gray-500">
                              {product.category?.name && <span>📂 {product.category.name}</span>}
                              {product.brand && <span>🏷️ {product.brand}</span>}
                              {product.sku && <span className="font-mono">SKU: {product.sku}</span>}
                            </div>
                            <div className="flex gap-3 mt-1.5 items-center flex-wrap">
                              <span className="text-base font-extrabold text-[#B12704]">{formatRupee(product.price)}</span>
                              {product.comparePrice > 0 && <span className="text-xs text-gray-400 line-through">{formatRupee(product.comparePrice)}</span>}
                              <span className={`text-xs font-semibold ${product.stock === 0 ? "text-red-500" : product.stock <= product.lowStockThreshold ? "text-yellow-600" : "text-gray-500"}`}>
                                {product.stock === 0 ? "🚫 Out of stock" : product.stock <= product.lowStockThreshold ? `⚠️ Low: ${product.stock}` : `Stock: ${product.stock}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <Badge status={product.status} />
                            <div className="flex gap-1.5">
                              <button onClick={() => openEditForm(product)} className="bg-purple-100 text-purple-800 border border-purple-200 rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer hover:bg-purple-200 transition font-[inherit]">✏️ Edit</button>
                              {deletingId === product._id ? (
                                <div className="flex gap-1">
                                  <button onClick={() => handleDelete(product._id)} className="bg-red-500 text-white border-none rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer font-[inherit]">Confirm</button>
                                  <button onClick={() => setDeletingId(null)} className="bg-white text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] cursor-pointer font-[inherit]">Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => setDeletingId(product._id)} className="bg-red-50 text-red-800 border border-red-200 rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer hover:bg-red-100 transition font-[inherit]">🗑️</button>
                              )}
                            </div>
                          </div>
                        </div>
                        {product.delistReason && product.status === "delisted" && (
                          <div className="mt-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                            <p className="text-xs text-gray-600 font-bold m-0">Delisted: {product.delistReason}</p>
                          </div>
                        )}
                        <div className="flex gap-3 mt-2">
                          {product.averageRating > 0 && <span className="text-[11px] text-gray-400">⭐ {product.averageRating.toFixed(1)} ({product.totalReviews})</span>}
                          {product.totalSold > 0 && <span className="text-[11px] text-gray-400">📦 {product.totalSold} sold</span>}
                          {product.views > 0 && <span className="text-[11px] text-gray-400">👁️ {product.views} views</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 m-0">My Orders</h2>
                <p className="text-xs text-gray-500 mt-1 m-0">{ordersData?.pagination?.total || 0} total orders</p>
              </div>
            </div>
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {[{ l: "All", v: "" }, { l: "Confirmed", v: "confirmed" }, { l: "Processing", v: "processing" }, { l: "Shipped", v: "shipped" }, { l: "Delivered", v: "delivered" }, { l: "Cancelled", v: "cancelled" }].map((item) => (
                <FilterBtn key={item.v} active={orderStatusFilter === item.v} onClick={() => { setOrderStatusFilter(item.v); setOrderPage(1); }}>{item.l}</FilterBtn>
              ))}
            </div>

            {ordersLoading && <Spinner text="Loading orders..." />}
            {ordersData?.data?.length === 0 && !ordersLoading && <EmptyState icon="🛒" title="No orders found" />}

            <div className="flex flex-col gap-3">
              {ordersData?.data?.map((order) => {
                const flow = ORDER_STATUS_FLOW[order.orderStatus];
                const canCancel = ["confirmed", "processing"].includes(order.orderStatus);
                const orderTotal = order.items?.reduce((s, item) => s + (item.price * item.quantity), 0) || 0;

                return (
                  <div key={order._id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4">
                      <div className="flex justify-between items-start gap-3 mb-3 flex-wrap">
                        <div>
                          <p className="text-sm font-extrabold text-gray-900 m-0">{order.orderNumber}</p>
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            <p className="text-xs text-gray-500 m-0">{order.user?.firstName} {order.user?.lastName}</p>
                            {order.user?.phone && <span className="text-xs text-gray-400">📱 {order.user.phone}</span>}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5 m-0">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <Badge status={order.orderStatus} />
                          <span className="text-sm font-extrabold text-[#B12704]">{formatRupee(orderTotal)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mb-3">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex gap-2.5 items-center">
                            <div className="w-11 h-11 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                              {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-contain p-0.5" onError={(e) => { e.target.src = "https://placehold.co/44?text=P"; }} /> : <span className="text-lg">📦</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-900 m-0 truncate">{item.name}</p>
                              <p className="text-[11px] text-gray-500 m-0">Qty: {item.quantity} · {formatRupee(item.price * item.quantity)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-gray-50 rounded-xl px-3.5 py-2.5 mb-3 text-xs flex items-start gap-2">
                        <span className="shrink-0 mt-0.5">📍</span>
                        <p className="text-gray-600 m-0">{order.shippingAddress?.fullName}, {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.postalCode}</p>
                      </div>

                      <div className="flex items-center justify-between gap-2 flex-wrap pt-2.5 border-t border-gray-100">
                        <p className="text-xs text-gray-500 m-0">
                          {order.paymentMethod === "cod" ? "💵 COD" : "💳 Online"} ·{" "}
                          <span className={`font-bold ${order.paymentStatus === "paid" ? "text-green-600" : order.paymentStatus === "refunded" ? "text-pink-600" : "text-yellow-600"}`}>
                            {order.paymentStatus}
                          </span>
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {flow && (
                            <button
                              onClick={() => handleVendorUpdateStatus(order._id, flow.next)}
                              className={`${flow.color} border-none rounded-lg px-4 py-2 text-xs font-bold cursor-pointer transition font-[inherit]`}
                            >
                              {flow.nextLabel}
                            </button>
                          )}
                          {canCancel && (
                            <button
                              onClick={() => setCancellingOrderId(cancellingOrderId === order._id ? null : order._id)}
                              className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3.5 py-2 text-xs font-bold cursor-pointer hover:bg-red-100 transition font-[inherit]"
                            >
                              ✕ Cancel
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
                      <div className="px-4 py-3 bg-red-50 border-t border-red-200">
                        <p className="text-xs font-bold text-red-700 mb-2 m-0">⚠️ Reason for cancellation</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Out of stock, Unable to fulfill..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="flex-1 border border-red-200 rounded-lg px-3 py-2.5 text-xs outline-none focus:border-red-400 bg-white font-[inherit]"
                          />
                          <button onClick={() => handleVendorUpdateStatus(order._id, "cancelled", cancelReason)} className="bg-red-500 text-white border-none rounded-lg px-4 py-2.5 text-xs font-bold cursor-pointer font-[inherit]">Confirm</button>
                          <button onClick={() => { setCancellingOrderId(null); setCancelReason(""); }} className="bg-white text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-semibold cursor-pointer font-[inherit]">Back</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {ordersData?.pagination?.pages > 1 && (
              <div className="flex justify-center gap-1.5 mt-5">
                <PageBtn onClick={() => setOrderPage(p => Math.max(1, p - 1))} disabled={orderPage === 1}>← Prev</PageBtn>
                <PageBtn onClick={() => setOrderPage(p => Math.min(ordersData.pagination.pages, p + 1))} disabled={orderPage === ordersData.pagination.pages}>Next →</PageBtn>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-5 m-0">My Product Reviews</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {[
                { value: totalReviews, label: "Total Reviews", color: "text-gray-900" },
                { value: `${avgRating} ★`, label: "Average Rating", color: "text-yellow-500" },
                { value: ratingBreakdown[5] || 0, label: "5 Star Reviews", color: "text-green-600" },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
                  <p className={`text-2xl sm:text-3xl font-extrabold ${stat.color} m-0`}>{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1 m-0">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mb-5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingBreakdown[star] || 0;
                const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-xs text-gray-500 w-4 text-right">{star}</span>
                    <span className="text-yellow-400 text-xs">★</span>
                    <MiniBar percent={percent} color="bg-yellow-400" />
                    <span className="text-xs text-gray-500 w-5 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2.5 mb-4 flex-wrap">
              <select value={reviewSort} onChange={(e) => { setReviewSort(e.target.value); setReviewPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-gray-900 transition font-[inherit]">
                <option value="newest">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
              <div className="flex gap-1.5 flex-wrap">
                {[5, 4, 3, 2, 1].map((star) => (
                  <FilterBtn key={star} active={reviewRatingFilter === star} onClick={() => { setReviewRatingFilter(reviewRatingFilter === star ? undefined : star); setReviewPage(1); }}>{star} ★</FilterBtn>
                ))}
                {reviewRatingFilter && <button onClick={() => { setReviewRatingFilter(undefined); setReviewPage(1); }} className="px-3 py-2 text-xs text-gray-500 bg-transparent border-none cursor-pointer font-[inherit]">Clear</button>}
              </div>
            </div>
            {reviewsLoading && <Spinner text="Loading reviews..." />}
            {reviewsData?.data?.length === 0 && !reviewsLoading && <EmptyState icon="💬" title="No reviews yet on your products" />}
            <div className="flex flex-col gap-3">
              {reviewsData?.data?.map((review) => (
                <div key={review._id} className="border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors">
                  <div className="flex gap-2.5 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-bold text-sm text-gray-700 shrink-0">
                      {review.user?.firstName?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <p className="font-bold text-[13px] text-gray-900 m-0">{review.user?.firstName} {review.user?.lastName}</p>
                        <p className="text-[11px] text-gray-400 m-0">{formatDate(review.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex">{[1, 2, 3, 4, 5].map((s) => <span key={s} className={s <= review.rating ? "text-yellow-400 text-[13px]" : "text-gray-200 text-[13px]"}>★</span>)}</div>
                        {review.isVerifiedPurchase && <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">✓ Verified</span>}
                      </div>
                    </div>
                  </div>
                  {review.product && (
                    <div className="flex items-center gap-1.5 mb-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
                      {review.product.images?.[0] && <img src={review.product.images[0].url} alt="" className="w-5 h-5 rounded object-cover" onError={(e) => { e.target.style.display = "none"; }} />}
                      <span className="text-[11px] text-gray-600 font-semibold">{review.product.name}</span>
                    </div>
                  )}
                  {review.title && <p className="font-bold text-[13px] text-gray-900 m-0 mb-1">{review.title}</p>}
                  {review.body && <p className="text-[13px] text-gray-700 m-0 leading-relaxed">{review.body}</p>}
                  {review.images?.length > 0 && (
                    <div className="flex gap-1.5 mt-2">{review.images.map((img, i) => <img key={i} src={img.url} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />)}</div>
                  )}
                  <p className="text-[11px] text-gray-400 mt-2 m-0">👍 {review.helpfulVotes?.length || 0} found helpful</p>
                </div>
              ))}
            </div>
            {reviewsData?.pagination?.pages > 1 && (
              <div className="flex justify-center gap-1.5 mt-5">
                <PageBtn onClick={() => setReviewPage(p => Math.max(1, p - 1))} disabled={reviewPage === 1}>← Prev</PageBtn>
                {Array.from({ length: reviewsData.pagination.pages }, (_, i) => i + 1).map((p) => (
                  <PageBtn key={p} active={reviewPage === p} onClick={() => setReviewPage(p)}>{p}</PageBtn>
                ))}
                <PageBtn onClick={() => setReviewPage(p => Math.min(reviewsData.pagination.pages, p + 1))} disabled={reviewPage === reviewsData.pagination.pages}>Next →</PageBtn>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;