import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { authApi, useLogoutMutation } from "../features/auth/authApi";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import {
  useGetVendorProductsQuery, useCreateProductMutation,
  useUpdateProductMutation, useDeleteProductMutation,
} from "../features/product/productApi";
import { useVendorGetOrdersQuery } from "../features/order/orderApi";
import { useVendorGetProductReviewsQuery } from "../features/review/reviewApi";
import { useNavigate, useSearchParams } from "react-router-dom";
import ImageUploader from "../components/ImageUploader";
import { toast } from "../components/Toast";

const formatRupee = (amt) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amt);

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const statusTw = {
  pending: "bg-yellow-100 text-yellow-800", approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800", draft: "bg-gray-100 text-gray-700",
  processing: "bg-blue-100 text-blue-800", shipped: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-orange-100 text-orange-800", delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabel = {
  pending: "Pending Review", approved: "Approved", rejected: "Rejected", draft: "Draft",
  processing: "Processing", shipped: "Shipped", out_for_delivery: "Out for Delivery",
  delivered: "Delivered", cancelled: "Cancelled",
};

const Badge = ({ status }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusTw[status] || "bg-gray-100 text-gray-700"}`}>
    {statusLabel[status] || status}
  </span>
);

const inputCls = "w-full border-[1.5px] border-gray-200 rounded-xl px-3.5 py-[10px] text-sm text-gray-900 bg-gray-50 outline-none focus:border-[#D85A30] focus:bg-white focus:ring-[3px] focus:ring-[#D85A30]/8 transition-all font-[inherit] box-border placeholder:text-gray-400";
const selectCls = `${inputCls} cursor-pointer`;
const labelCls = "block text-xs font-bold text-gray-700 mb-1.5";

const Lbl = ({ children, required }) => (
  <label className={labelCls}>{children} {required && <span className="text-red-500">*</span>}</label>
);

const Hint = ({ text, color = "text-gray-400" }) => (
  <span className={`block text-[11px] ${color} mt-1`}>{text}</span>
);

const TabBtn = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border transition-all font-[inherit] ${active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
    <span>{icon}</span>{label}
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
  <div className="text-center py-14 bg-white rounded-2xl border border-gray-200">
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

const VendorDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, refreshToken } = useSelector((state) => state.auth);
  const [logoutAPI] = useLogoutMutation();

  const activeTab = searchParams.get("tab") || "products";
  const setActiveTab = (tab) => setSearchParams({ tab });

  const { data: categoryData } = useGetCategoryTreeQuery();
  const [statusFilter, setStatusFilter] = useState("");
  const { data: productsData, isLoading: productsLoading } = useGetVendorProductsQuery({ status: statusFilter });
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const { data: ordersData, isLoading: ordersLoading } = useVendorGetOrdersQuery({ status: orderStatusFilter, page: orderPage });

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
  const openAddForm = () => { resetForm(); setShowForm(true); };

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
        toast.success("Product submitted for approval!");
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

  const ratingBreakdown = reviewsData?.ratingBreakdown || {};
  const totalReviews = reviewsData?.pagination?.total || 0;
  const avgRating = totalReviews > 0
    ? (Object.entries(ratingBreakdown).reduce((sum, [star, count]) => sum + Number(star) * count, 0) / totalReviews).toFixed(1)
    : "0.0";

  const isSubmitting = creating || updating;

  return (
    <div className="bg-gray-100 min-h-screen py-5 sm:py-6 px-3 sm:px-4">
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } } .form-step { animation: slideIn 0.2s ease both; }`}</style>

      <div className="max-w-[1100px] mx-auto">

        <div className="flex items-center justify-between mb-6 sm:mb-7">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 m-0">Vendor Dashboard</h1>
            <p className="text-[13px] text-gray-500 mt-1 m-0">Welcome back, {user?.firstName}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {[{ key: "products", label: "Products", icon: "📦" }, { key: "orders", label: "Orders", icon: "🛒" }, { key: "reviews", label: "Reviews", icon: "⭐" }].map((tab) => (
            <TabBtn key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} icon={tab.icon} label={tab.label} />
          ))}
        </div>

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
                    <button onClick={closeForm} className="bg-white/10 border border-white/15 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer hover:bg-white/20 transition font-[inherit]">
                      ✕ Cancel
                    </button>
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
                        <div className="sm:col-span-2">
                          <Lbl required>Product Name</Lbl>
                          <input name="name" placeholder="Enter a clear, descriptive product name" value={form.name} onChange={handleChange} className={inputCls} />
                          <Hint text="Good product names are specific and include key details like size, color, or material" />
                        </div>
                        <div>
                          <Lbl required>Category</Lbl>
                          <select name="category" value={form.category} onChange={handleChange} className={selectCls}>
                            <option value="">Select Category</option>
                            {allCategoryOptions.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <Lbl>Brand</Lbl>
                          <input name="brand" placeholder="e.g. Nike, Samsung, Generic" value={form.brand} onChange={handleChange} className={inputCls} />
                        </div>
                        <div className="sm:col-span-2">
                          <Lbl>Short Description</Lbl>
                          <input name="shortDescription" placeholder="One line summary shown on product cards" value={form.shortDescription} onChange={handleChange} className={inputCls} />
                        </div>
                        <div className="sm:col-span-2">
                          <Lbl required>Full Description</Lbl>
                          <textarea name="description" placeholder="Write a detailed description. Include key features, materials, care instructions, etc. Minimum 20 characters." value={form.description} onChange={handleChange} rows={6} className={`${inputCls} resize-vertical`} />
                          <Hint text={`${form.description.length} characters ${form.description.length < 20 ? "(minimum 20)" : "✓"}`} color={form.description.length < 20 ? "text-red-500" : "text-green-600"} />
                        </div>
                      </div>
                    </div>
                  )}

                  {formStep === 2 && (
                    <div className="form-step flex flex-col gap-4 sm:gap-[18px]">
                      <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                        <span className="text-base shrink-0">💡</span>
                        <p className="text-xs text-orange-800 m-0 leading-relaxed">
                          Set competitive prices. Compare Price (MRP) creates a discount badge. Cost Price is for your internal profit tracking — customers cannot see it.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { name: "price", label: "Selling Price (₹)", required: true, hint: null },
                          { name: "comparePrice", label: "Compare Price / MRP (₹)", required: false, hint: null },
                          { name: "costPrice", label: "Cost Price (₹)", required: false, hint: "Internal only — not shown to customers" },
                        ].map((field) => (
                          <div key={field.name}>
                            <Lbl required={field.required}>{field.label}</Lbl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">₹</span>
                              <input name={field.name} type="number" min="0" placeholder="0" value={form[field.name]} onChange={handleChange} className={`${inputCls} pl-7`} />
                            </div>
                            {field.hint && <Hint text={field.hint} />}
                          </div>
                        ))}
                      </div>

                      {form.price && form.comparePrice && Number(form.comparePrice) > Number(form.price) && (
                        <Hint text={`${Math.round(((form.comparePrice - form.price) / form.comparePrice) * 100)}% discount badge will show`} color="text-green-600" />
                      )}

                      {form.price && form.costPrice && Number(form.costPrice) > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                          <p className="text-xs text-green-700 font-semibold m-0">
                            Estimated profit: {formatRupee(Number(form.price) - Number(form.costPrice))} ({Math.round(((form.price - form.costPrice) / form.price) * 100)}% margin)
                          </p>
                        </div>
                      )}

                      <div className="h-px bg-gray-200" />

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <Lbl required>Stock Quantity</Lbl>
                          <input name="stock" type="number" min="0" placeholder="0" value={form.stock} onChange={handleChange} className={inputCls} />
                        </div>
                        <div>
                          <Lbl>Low Stock Alert</Lbl>
                          <input name="lowStockThreshold" type="number" min="1" placeholder="5" value={form.lowStockThreshold} onChange={handleChange} className={inputCls} />
                          <Hint text="Alert when stock falls below this" />
                        </div>
                        <div>
                          <Lbl>SKU / Product Code</Lbl>
                          <input name="sku" placeholder="e.g. PROD-001" value={form.sku} onChange={handleChange} className={inputCls} />
                          <Hint text="Your internal product identifier" />
                        </div>
                      </div>

                      <div className="h-px bg-gray-200" />

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { name: "weight", label: "Weight (g)", ph: "e.g. 500" },
                          { name: "dim_length", label: "Length (cm)", ph: "0" },
                          { name: "dim_width", label: "Width (cm)", ph: "0" },
                          { name: "dim_height", label: "Height (cm)", ph: "0" },
                        ].map((f) => (
                          <div key={f.name}>
                            <Lbl>{f.label}</Lbl>
                            <input name={f.name} type="number" min="0" placeholder={f.ph} value={f.name === "weight" ? form.weight : form.dimensions[f.name.replace("dim_", "")]} onChange={handleChange} className={inputCls} />
                          </div>
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
                          <li>Minimum 500×500 pixels recommended</li>
                          <li>White or neutral background preferred</li>
                        </ul>
                      </div>
                      <ImageUploader images={productImages} setImages={setProductImages} maxImages={10} />
                    </div>
                  )}

                  {formStep === 4 && (
                    <div className="form-step flex flex-col gap-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <h3 className="text-[15px] font-extrabold text-gray-900 m-0">Product Variants</h3>
                          <p className="text-xs text-gray-500 mt-1 m-0">Add variants like Size, Color, Material with optional price adjustments.</p>
                        </div>
                        <button type="button" onClick={addVariant} className="bg-gray-900 text-white border-none rounded-xl px-4 py-2.5 text-[13px] font-bold cursor-pointer whitespace-nowrap font-[inherit]">
                          + Add Variant
                        </button>
                      </div>

                      {variants.length === 0 && (
                        <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                          <p className="text-4xl mb-3">🎨</p>
                          <p className="text-sm font-bold text-gray-700 m-0">No Variants Added</p>
                          <p className="text-xs text-gray-500 mt-1 mb-4">Optional — Add variants if your product comes in different sizes, colors, or materials</p>
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
                              <button type="button" onClick={() => removeVariant(vi)} className="bg-red-100 text-red-800 border border-red-200 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer whitespace-nowrap font-[inherit]">Remove</button>
                            </div>
                            <div className="flex flex-col gap-2">
                              {variant.options.map((opt, oi) => (
                                <div key={oi} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                                  <input placeholder="Label (e.g. Red)" value={opt.label} onChange={(e) => updateVariantOption(vi, oi, "label", e.target.value)} className={inputCls} />
                                  <input placeholder="Value (e.g. red)" value={opt.value} onChange={(e) => updateVariantOption(vi, oi, "value", e.target.value)} className={inputCls} />
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">{Number(opt.priceModifier) >= 0 ? "+₹" : "-₹"}</span>
                                    <input type="number" placeholder="0" value={opt.priceModifier} onChange={(e) => updateVariantOption(vi, oi, "priceModifier", Number(e.target.value))} className={`${inputCls} pl-8`} />
                                  </div>
                                  <button type="button" onClick={() => removeVariantOption(vi, oi)} className="bg-red-100 text-red-800 border border-red-200 rounded-lg px-2.5 py-2 text-sm cursor-pointer font-[inherit]">×</button>
                                </div>
                              ))}
                              <button type="button" onClick={() => addVariantOption(vi)} className="bg-white text-gray-600 border-[1.5px] border-dashed border-gray-300 rounded-lg py-2 text-xs font-semibold cursor-pointer font-[inherit] hover:border-gray-400 transition">
                                + Add Option
                              </button>
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
                          <div>
                            <h3 className="text-[15px] font-extrabold text-gray-900 m-0">Specifications</h3>
                            <p className="text-xs text-gray-500 mt-1 m-0">Add technical details like material, dimensions, compatibility, etc.</p>
                          </div>
                          <button type="button" onClick={addSpec} className="bg-gray-900 text-white border-none rounded-xl px-4 py-2.5 text-[13px] font-bold cursor-pointer font-[inherit]">+ Add Spec</button>
                        </div>

                        {specifications.length === 0 && (
                          <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <p className="text-3xl mb-2">📋</p>
                            <p className="text-sm font-bold text-gray-700 m-0">No Specifications</p>
                            <p className="text-xs text-gray-500 mt-1 m-0">Optional but improves product discoverability</p>
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
                        <Hint text="Tags help customers find your product through search" />
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
                            { label: "Name", value: form.name },
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
                      <button type="button" onClick={handleNext} className="flex-1 bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white border-none rounded-xl py-3.5 text-[15px] font-extrabold cursor-pointer shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.01] transition-all font-[inherit]">
                        Continue to {FORM_STEPS[formStep].label} →
                      </button>
                    ) : (
                      <button type="button" onClick={handleSubmit} disabled={isSubmitting} className={`flex-1 text-white border-none rounded-xl py-3.5 text-[15px] font-extrabold cursor-pointer transition-all font-[inherit] ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-green-600 to-green-500 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-[1.01]"}`}>
                        {isSubmitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-[18px] h-[18px] border-[2.5px] border-white/40 border-t-white rounded-full animate-spin inline-block" />
                            {editingProduct ? "Saving..." : "Submitting..."}
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            {editingProduct ? "✓ Save Changes" : "✓ Submit for Approval"}
                          </span>
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
                    <p className="text-xs text-gray-500 mt-1 m-0">{productsData?.data?.length || 0} products total</p>
                  </div>
                  <button onClick={openAddForm} className="bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white border-none rounded-xl px-5 py-2.5 text-[13px] font-extrabold cursor-pointer shadow-lg shadow-orange-500/25 font-[inherit]">
                    + Add Product
                  </button>
                </div>

                <div className="flex gap-1.5 mb-4 flex-wrap">
                  {[{ label: "All", value: "" }, { label: "Pending", value: "pending" }, { label: "Approved", value: "approved" }, { label: "Rejected", value: "rejected" }].map((item) => (
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
                    <div key={product._id} className="bg-white rounded-2xl border border-gray-200 p-4 flex gap-3.5 items-start">
                      {product.images?.[0] ? (
                        <img src={product.images[0].url} alt={product.name} className="w-20 h-20 object-cover rounded-xl border border-gray-200 shrink-0" onError={(e) => { e.target.src = "https://placehold.co/80?text=No+Image"; }} />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-3xl shrink-0">📦</div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <h3 className="text-sm font-extrabold text-gray-900 m-0 mb-1">{product.name}</h3>
                            <div className="flex gap-2.5 flex-wrap text-xs text-gray-500">
                              {product.category?.name && <span>📂 {product.category.name}</span>}
                              {product.brand && <span>🏷️ {product.brand}</span>}
                              {product.sku && <span className="font-mono">SKU: {product.sku}</span>}
                            </div>
                            <div className="flex gap-3 mt-1.5 items-center">
                              <span className="text-base font-extrabold text-[#B12704]">{formatRupee(product.price)}</span>
                              {product.comparePrice > 0 && <span className="text-xs text-gray-400 line-through">{formatRupee(product.comparePrice)}</span>}
                              <span className={`text-xs ${product.stock === 0 ? "text-red-500 font-bold" : product.stock <= product.lowStockThreshold ? "text-yellow-500 font-bold" : "text-gray-500"}`}>
                                {product.stock === 0 ? "Out of stock" : product.stock <= product.lowStockThreshold ? `⚠️ Low stock: ${product.stock}` : `Stock: ${product.stock}`}
                              </span>
                            </div>
                            {product.variants?.length > 0 && (
                              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                {product.variants.map((v) => (
                                  <span key={v.name} className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">{v.name}: {v.options?.length} options</span>
                                ))}
                              </div>
                            )}
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
                                <button onClick={() => setDeletingId(product._id)} className="bg-red-50 text-red-800 border border-red-200 rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer hover:bg-red-100 transition font-[inherit]">🗑️ Delete</button>
                              )}
                            </div>
                          </div>
                        </div>

                        {product.status === "rejected" && product.rejectionReason && (
                          <div className="mt-2.5 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                            <span>❌</span>
                            <div>
                              <p className="text-xs text-red-600 font-bold m-0">Rejected — Reason:</p>
                              <p className="text-xs text-red-500 mt-0.5 m-0">{product.rejectionReason}</p>
                              <button onClick={() => openEditForm(product)} className="mt-1.5 bg-[#D85A30] text-white border-none rounded-md px-3 py-1 text-[11px] font-bold cursor-pointer font-[inherit]">Edit & Resubmit →</button>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 mt-2">
                          {product.averageRating > 0 && <span className="text-[11px] text-gray-500">⭐ {product.averageRating.toFixed(1)} ({product.totalReviews} reviews)</span>}
                          {product.totalSold > 0 && <span className="text-[11px] text-gray-500">📦 {product.totalSold} sold</span>}
                          {product.views > 0 && <span className="text-[11px] text-gray-500">👁️ {product.views} views</span>}
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
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-4 m-0">My Orders</h2>
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {[{ l: "All", v: "" }, { l: "Pending", v: "pending" }, { l: "Processing", v: "processing" }, { l: "Shipped", v: "shipped" }, { l: "Delivered", v: "delivered" }, { l: "Cancelled", v: "cancelled" }].map((item) => (
                <FilterBtn key={item.v} active={orderStatusFilter === item.v} onClick={() => { setOrderStatusFilter(item.v); setOrderPage(1); }}>{item.l}</FilterBtn>
              ))}
            </div>

            {ordersLoading && <Spinner text="Loading orders..." />}
            {ordersData?.data?.length === 0 && !ordersLoading && <EmptyState icon="🛒" title="No orders found" />}

            <div className="flex flex-col gap-2.5">
              {ordersData?.data?.map((order) => (
                <div key={order._id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start gap-3 mb-3 flex-wrap">
                    <div>
                      <p className="text-sm font-extrabold text-gray-900 m-0">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500 mt-0.5 m-0">Customer: {order.user?.firstName} {order.user?.lastName}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 m-0">{formatDate(order.createdAt)}</p>
                    </div>
                    <Badge status={order.orderStatus} />
                  </div>
                  <div className="flex flex-col gap-2 mb-3">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex gap-2.5 items-center">
                        <img src={item.image || "https://placehold.co/44?text=P"} alt={item.name} className="w-11 h-11 object-cover rounded-lg border border-gray-200 shrink-0" onError={(e) => { e.target.src = "https://placehold.co/44?text=P"; }} />
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900 m-0">{item.name}</p>
                          <p className="text-[11px] text-gray-500 m-0">Qty: {item.quantity} • {formatRupee(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3.5 py-2.5 text-xs">
                    <p className="text-gray-700 font-semibold m-0">Ship to: {order.shippingAddress?.fullName}, {order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                  </div>
                </div>
              ))}
            </div>

            {ordersData?.pagination?.pages > 1 && (
              <div className="flex justify-center gap-1.5 mt-4">
                <PageBtn onClick={() => setOrderPage((p) => Math.max(1, p - 1))} disabled={orderPage === 1}>← Prev</PageBtn>
                <PageBtn onClick={() => setOrderPage((p) => Math.min(ordersData.pagination.pages, p + 1))} disabled={orderPage === ordersData.pagination.pages}>Next →</PageBtn>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-5 m-0">My Product Reviews</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {[
                { value: totalReviews, label: "Total Reviews", color: "text-gray-900" },
                { value: avgRating, label: "Avg Rating", color: "text-yellow-500" },
                { value: ratingBreakdown[5] || 0, label: "5 Star Reviews", color: "text-green-600" },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                  <p className={`text-3xl font-black ${stat.color} m-0`}>{stat.value}</p>
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
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                    </div>
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
                <div key={review._id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex gap-2.5 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm text-gray-700 shrink-0">
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
                    <div className="flex items-center gap-1.5 mb-2">
                      {review.product.images?.[0] && <img src={review.product.images[0].url} alt="" className="w-6 h-6 rounded-md object-cover" onError={(e) => { e.target.style.display = "none"; }} />}
                      <span className="text-[11px] text-gray-500 font-semibold">{review.product.name}</span>
                    </div>
                  )}
                  {review.title && <p className="font-bold text-[13px] text-gray-900 m-0 mb-1">{review.title}</p>}
                  {review.body && <p className="text-[13px] text-gray-700 m-0 leading-relaxed">{review.body}</p>}
                  {review.images?.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {review.images.map((img, i) => <img key={i} src={img.url} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />)}
                    </div>
                  )}
                  <p className="text-[11px] text-gray-400 mt-1.5 m-0">👍 {review.helpfulVotes?.length || 0} found helpful</p>
                </div>
              ))}
            </div>

            {reviewsData?.pagination?.pages > 1 && (
              <div className="flex justify-center gap-1.5 mt-4">
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

export default VendorDashboard;