import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { authApi, useLogoutMutation } from "../features/auth/authApi";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import {
  useGetVendorProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "../features/product/productApi";
import { useVendorGetOrdersQuery } from "../features/order/orderApi";
import { useVendorGetProductReviewsQuery } from "../features/review/reviewApi";
import { useNavigate, useSearchParams } from "react-router-dom";
import ImageUploader from "../components/ImageUploader";

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

const statusMap = {
  pending: { bg: "#FEF9C3", color: "#854D0E", label: "Pending Review" },
  approved: { bg: "#DCFCE7", color: "#14532D", label: "Approved" },
  rejected: { bg: "#FEE2E2", color: "#7F1D1D", label: "Rejected" },
  draft: { bg: "#F3F4F6", color: "#374151", label: "Draft" },
  processing: { bg: "#DBEAFE", color: "#1E40AF", label: "Processing" },
  shipped: { bg: "#EDE9FE", color: "#5B21B6", label: "Shipped" },
  out_for_delivery: { bg: "#FFEDD5", color: "#9A3412", label: "Out for Delivery" },
  delivered: { bg: "#DCFCE7", color: "#14532D", label: "Delivered" },
  cancelled: { bg: "#FEE2E2", color: "#7F1D1D", label: "Cancelled" },
};

const StatusBadge = ({ status }) => {
  const s = statusMap[status] || { bg: "#F3F4F6", color: "#374151", label: status };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

const EMPTY_FORM = {
  name: "",
  description: "",
  shortDescription: "",
  category: "",
  brand: "",
  price: "",
  comparePrice: "",
  costPrice: "",
  stock: "",
  lowStockThreshold: "5",
  sku: "",
  weight: "",
  dimensions: { length: "", width: "", height: "" },
  tags: "",
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
  const [logoutAPI, { isLoading: logoutLoading }] = useLogoutMutation();

  const activeTab = searchParams.get("tab") || "products";
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

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
    (cat.children || []).forEach((sub) => {
      allCategoryOptions.push({ _id: sub._id, name: `↳ ${sub.name}`, level: 1 });
    });
  });

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

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setProductImages([]);
    setVariants([]);
    setSpecifications([]);
    setFormError("");
    setFormStep(1);
    setEditingProduct(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || "",
      description: product.description || "",
      shortDescription: product.shortDescription || "",
      category: product.category?._id || "",
      brand: product.brand || "",
      price: product.price || "",
      comparePrice: product.comparePrice || "",
      costPrice: product.costPrice || "",
      stock: product.stock || "",
      lowStockThreshold: product.lowStockThreshold || "5",
      sku: product.sku || "",
      weight: product.weight || "",
      dimensions: {
        length: product.dimensions?.length || "",
        width: product.dimensions?.width || "",
        height: product.dimensions?.height || "",
      },
      tags: product.tags?.join(", ") || "",
    });
    setProductImages(
      product.images?.map((img) => ({ url: img.url, filename: img.url.split("/").pop(), isDefault: img.isDefault })) || []
    );
    setVariants(product.variants || []);
    setSpecifications(product.specifications || []);
    setFormStep(1);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

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

  const handleNext = () => {
    const error = validateStep(formStep);
    if (error) { setFormError(error); return; }
    setFormError("");
    setFormStep((s) => s + 1);
  };

  const handleBack = () => {
    setFormError("");
    setFormStep((s) => s - 1);
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, { name: "", options: [{ label: "", value: "", priceModifier: 0 }] }]);
  };

  const updateVariantName = (index, name) => {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, name } : v));
  };

  const addVariantOption = (variantIndex) => {
    setVariants((prev) => prev.map((v, i) =>
      i === variantIndex ? { ...v, options: [...v.options, { label: "", value: "", priceModifier: 0 }] } : v
    ));
  };

  const updateVariantOption = (variantIndex, optionIndex, key, value) => {
    setVariants((prev) => prev.map((v, i) =>
      i === variantIndex ? {
        ...v,
        options: v.options.map((opt, j) => j === optionIndex ? { ...opt, [key]: value } : opt)
      } : v
    ));
  };

  const removeVariantOption = (variantIndex, optionIndex) => {
    setVariants((prev) => prev.map((v, i) =>
      i === variantIndex ? { ...v, options: v.options.filter((_, j) => j !== optionIndex) } : v
    ));
  };

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const addSpec = () => {
    setSpecifications((prev) => [...prev, { key: "", value: "" }]);
  };

  const updateSpec = (index, field, value) => {
    setSpecifications((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeSpec = (index) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setFormError("");
    const productData = {
      name: form.name.trim(),
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim(),
      category: form.category,
      brand: form.brand.trim(),
      price: Number(form.price),
      comparePrice: Number(form.comparePrice) || 0,
      costPrice: Number(form.costPrice) || 0,
      stock: Number(form.stock),
      lowStockThreshold: Number(form.lowStockThreshold) || 5,
      sku: form.sku.trim(),
      weight: Number(form.weight) || 0,
      dimensions: {
        length: Number(form.dimensions.length) || 0,
        width: Number(form.dimensions.width) || 0,
        height: Number(form.dimensions.height) || 0,
      },
      tags: form.tags.split(",").map((t) => t.trim()).filter((t) => t),
      images: productImages.map((img, index) => ({
        url: img.url,
        alt: form.name,
        isDefault: index === 0,
      })),
      variants: variants.filter((v) => v.name.trim()),
      specifications: specifications.filter((s) => s.key.trim() && s.value.trim()),
    };

    try {
      if (editingProduct) {
        await updateProduct({ id: editingProduct._id, ...productData }).unwrap();
      } else {
        await createProduct(productData).unwrap();
      }
      closeForm();
    } catch (err) {
      setFormError(err?.data?.message || "Failed to save product");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id).unwrap();
      setDeletingId(null);
    } catch (err) {
      alert(err?.data?.message || "Failed to delete");
    }
  };

  const ratingBreakdown = reviewsData?.ratingBreakdown || {};
  const totalReviews = reviewsData?.pagination?.total || 0;
  const avgRating = totalReviews > 0
    ? (Object.entries(ratingBreakdown).reduce((sum, [star, count]) => sum + Number(star) * count, 0) / totalReviews).toFixed(1)
    : "0.0";

  const isSubmitting = creating || updating;

  return (
    <div style={{ background: "#F3F4F6", minHeight: "100vh", padding: "24px 16px" }}>
      <style>{`
        .vd-input {
          width: 100%;
          border: 1.5px solid #E5E7EB;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
          color: #111;
          background: #FAFAFA;
          outline: none;
          transition: all 0.15s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .vd-input:focus {
          border-color: #D85A30;
          background: white;
          box-shadow: 0 0 0 3px rgba(216,90,48,0.08);
        }
        .vd-select {
          width: 100%;
          border: 1.5px solid #E5E7EB;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
          color: #111;
          background: #FAFAFA;
          outline: none;
          cursor: pointer;
          box-sizing: border-box;
          font-family: inherit;
        }
        .vd-select:focus { border-color: #D85A30; background: white; }
        .vd-label { font-size: 12px; font-weight: 700; color: #374151; display: block; margin-bottom: 5px; }
        .vd-req { color: #EF4444; }
        .tab-btn { padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; transition: all 0.15s; display: flex; align-items: center; gap: 6px; font-family: inherit; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .form-step { animation: slideIn 0.2s ease both; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#111", margin: 0 }}>Vendor Dashboard</h1>
            <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>Welcome back, {user?.firstName}</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { key: "products", label: "Products", icon: "📦" },
            { key: "orders", label: "Orders", icon: "🛒" },
            { key: "reviews", label: "Reviews", icon: "⭐" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="tab-btn"
              style={{
                background: activeTab === tab.key ? "#111" : "white",
                color: activeTab === tab.key ? "white" : "#374151",
                border: activeTab === tab.key ? "none" : "1px solid #E5E7EB",
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "products" && (
          <div>
            {showForm ? (
              <div style={{ background: "white", borderRadius: 20, border: "1px solid #E5E7EB", overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", padding: "20px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <h2 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: 0 }}>
                        {editingProduct ? "Edit Product" : "Add New Product"}
                      </h2>
                      <p style={{ fontSize: 12, color: "#64748B", margin: "3px 0 0" }}>
                        Step {formStep} of {FORM_STEPS.length} — {FORM_STEPS[formStep - 1].label}
                      </p>
                    </div>
                    <button
                      onClick={closeForm}
                      style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "white", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      ✕ Cancel
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    {FORM_STEPS.map((step, i) => {
                      const isDone = formStep > i + 1;
                      const isActive = formStep === i + 1;
                      return (
                        <div key={step.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: isDone ? "#22C55E" : isActive ? "#D85A30" : "rgba(255,255,255,0.08)",
                            fontSize: 14, fontWeight: 900,
                            color: isDone || isActive ? "white" : "#475569",
                            transition: "all 0.2s",
                          }}>
                            {isDone ? (
                              <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path d="M5 13l4 4L19 7" strokeLinecap="round" />
                              </svg>
                            ) : step.icon}
                          </div>
                          <span style={{ fontSize: 10, color: isActive ? "white" : "#64748B", fontWeight: isActive ? 700 : 400 }}>
                            {step.label}
                          </span>
                          <div style={{ height: 3, borderRadius: 99, width: "100%", background: isDone ? "#22C55E" : isActive ? "#D85A30" : "rgba(255,255,255,0.1)", transition: "all 0.3s" }}></div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ padding: "28px" }}>
                  {formStep === 1 && (
                    <div className="form-step" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label className="vd-label">Product Name <span className="vd-req">*</span></label>
                          <input name="name" placeholder="Enter a clear, descriptive product name" value={form.name} onChange={handleChange} className="vd-input" />
                          <span style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4, display: "block" }}>
                            Good product names are specific and include key details like size, color, or material
                          </span>
                        </div>

                        <div>
                          <label className="vd-label">Category <span className="vd-req">*</span></label>
                          <select name="category" value={form.category} onChange={handleChange} className="vd-select">
                            <option value="">Select Category</option>
                            {allCategoryOptions.map((cat) => (
                              <option key={cat._id} value={cat._id} style={{ paddingLeft: cat.level > 0 ? 20 : 0 }}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="vd-label">Brand</label>
                          <input name="brand" placeholder="e.g. Nike, Samsung, Generic" value={form.brand} onChange={handleChange} className="vd-input" />
                        </div>

                        <div style={{ gridColumn: "1 / -1" }}>
                          <label className="vd-label">Short Description</label>
                          <input name="shortDescription" placeholder="One line summary shown on product cards" value={form.shortDescription} onChange={handleChange} className="vd-input" />
                        </div>

                        <div style={{ gridColumn: "1 / -1" }}>
                          <label className="vd-label">Full Description <span className="vd-req">*</span></label>
                          <textarea
                            name="description"
                            placeholder="Write a detailed description. Include key features, what's in the box, materials used, care instructions, etc. Minimum 20 characters."
                            value={form.description}
                            onChange={handleChange}
                            rows={6}
                            className="vd-input"
                            style={{ resize: "vertical" }}
                          />
                          <span style={{ fontSize: 11, color: form.description.length < 20 ? "#EF4444" : "#22C55E", marginTop: 4, display: "block" }}>
                            {form.description.length} characters {form.description.length < 20 ? `(minimum 20)` : "✓"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {formStep === 2 && (
                    <div className="form-step" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                      <div style={{ background: "#FFF5F0", border: "1px solid #FDBA74", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span style={{ fontSize: 16 }}>💡</span>
                        <p style={{ fontSize: 12, color: "#92400E", margin: 0, lineHeight: 1.6 }}>
                          Set competitive prices. Compare Price (MRP) creates a discount badge. Cost Price is for your internal profit tracking only — customers cannot see it.
                        </p>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                        <div>
                          <label className="vd-label">Selling Price (₹) <span className="vd-req">*</span></label>
                          <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: "#6B7280" }}>₹</span>
                            <input name="price" type="number" min="0" placeholder="0" value={form.price} onChange={handleChange} className="vd-input" style={{ paddingLeft: 28 }} />
                          </div>
                        </div>

                        <div>
                          <label className="vd-label">Compare Price / MRP (₹)</label>
                          <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: "#6B7280" }}>₹</span>
                            <input name="comparePrice" type="number" min="0" placeholder="0" value={form.comparePrice} onChange={handleChange} className="vd-input" style={{ paddingLeft: 28 }} />
                          </div>
                          {form.price && form.comparePrice && Number(form.comparePrice) > Number(form.price) && (
                            <span style={{ fontSize: 11, color: "#22C55E", marginTop: 4, display: "block", fontWeight: 600 }}>
                              {Math.round(((form.comparePrice - form.price) / form.comparePrice) * 100)}% discount badge will show
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="vd-label">Cost Price (₹)</label>
                          <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: "#6B7280" }}>₹</span>
                            <input name="costPrice" type="number" min="0" placeholder="0" value={form.costPrice} onChange={handleChange} className="vd-input" style={{ paddingLeft: 28 }} />
                          </div>
                          <span style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4, display: "block" }}>Internal only — not shown to customers</span>
                        </div>
                      </div>

                      {form.price && form.costPrice && Number(form.costPrice) > 0 && (
                        <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: "10px 14px" }}>
                          <p style={{ fontSize: 12, color: "#16A34A", fontWeight: 600, margin: 0 }}>
                            Estimated profit per unit: {formatRupee(Number(form.price) - Number(form.costPrice))}
                            {" "}({Math.round(((form.price - form.costPrice) / form.price) * 100)}% margin)
                          </p>
                        </div>
                      )}

                      <div style={{ height: 1, background: "#E5E7EB" }}></div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                        <div>
                          <label className="vd-label">Stock Quantity <span className="vd-req">*</span></label>
                          <input name="stock" type="number" min="0" placeholder="0" value={form.stock} onChange={handleChange} className="vd-input" />
                        </div>

                        <div>
                          <label className="vd-label">Low Stock Alert Threshold</label>
                          <input name="lowStockThreshold" type="number" min="1" placeholder="5" value={form.lowStockThreshold} onChange={handleChange} className="vd-input" />
                          <span style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4, display: "block" }}>Alert when stock falls below this</span>
                        </div>

                        <div>
                          <label className="vd-label">SKU / Product Code</label>
                          <input name="sku" placeholder="e.g. PROD-001, SKU-XYZ" value={form.sku} onChange={handleChange} className="vd-input" />
                          <span style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4, display: "block" }}>Your internal product identifier</span>
                        </div>
                      </div>

                      <div style={{ height: 1, background: "#E5E7EB" }}></div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
                        <div>
                          <label className="vd-label">Weight (grams)</label>
                          <input name="weight" type="number" min="0" placeholder="e.g. 500" value={form.weight} onChange={handleChange} className="vd-input" />
                        </div>
                        <div>
                          <label className="vd-label">Length (cm)</label>
                          <input name="dim_length" type="number" min="0" placeholder="0" value={form.dimensions.length} onChange={handleChange} className="vd-input" />
                        </div>
                        <div>
                          <label className="vd-label">Width (cm)</label>
                          <input name="dim_width" type="number" min="0" placeholder="0" value={form.dimensions.width} onChange={handleChange} className="vd-input" />
                        </div>
                        <div>
                          <label className="vd-label">Height (cm)</label>
                          <input name="dim_height" type="number" min="0" placeholder="0" value={form.dimensions.height} onChange={handleChange} className="vd-input" />
                        </div>
                      </div>
                    </div>
                  )}

                  {formStep === 3 && (
                    <div className="form-step" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 12, padding: "12px 16px" }}>
                        <p style={{ fontSize: 12, color: "#5B21B6", fontWeight: 600, margin: "0 0 4px" }}>📸 Image Guidelines</p>
                        <ul style={{ fontSize: 11, color: "#6D28D9", margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
                          <li>Upload at least 1 image (maximum 10)</li>
                          <li>First image will be the main product image</li>
                          <li>Use square images (1:1 ratio) for best results</li>
                          <li>Minimum 500x500 pixels recommended</li>
                          <li>White or neutral background preferred</li>
                        </ul>
                      </div>
                      <ImageUploader
                        images={productImages}
                        setImages={setProductImages}
                        maxImages={10}
                      />
                    </div>
                  )}

                  {formStep === 4 && (
                    <div className="form-step" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111", margin: 0 }}>Product Variants</h3>
                          <p style={{ fontSize: 12, color: "#6B7280", margin: "3px 0 0" }}>
                            Add variants like Size, Color, Material. Each variant can have multiple options with optional price adjustments.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={addVariant}
                          style={{ background: "#111", color: "white", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                        >
                          + Add Variant
                        </button>
                      </div>

                      {variants.length === 0 && (
                        <div style={{ textAlign: "center", padding: "40px 20px", background: "#F9FAFB", borderRadius: 14, border: "2px dashed #E5E7EB" }}>
                          <p style={{ fontSize: 32, margin: "0 0 12px" }}>🎨</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>No Variants Added</p>
                          <p style={{ fontSize: 12, color: "#6B7280", margin: "4px 0 16px" }}>Optional — Add variants if your product comes in different sizes, colors, or materials</p>
                          <button type="button" onClick={addVariant} style={{ background: "#111", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                            + Add First Variant
                          </button>
                        </div>
                      )}

                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {variants.map((variant, vi) => (
                          <div key={vi} style={{ background: "#F9FAFB", borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                              <select
                                value={variant.name}
                                onChange={(e) => updateVariantName(vi, e.target.value)}
                                className="vd-select"
                                style={{ flex: 1 }}
                              >
                                <option value="">Select Variant Type</option>
                                {["Color", "Size", "Material", "Style", "Capacity", "Flavor", "Scent", "Pack Size", "Custom"].map((v) => (
                                  <option key={v} value={v}>{v}</option>
                                ))}
                              </select>
                              {variant.name === "Custom" && (
                                <input
                                  placeholder="Custom variant name"
                                  value={variant.customName || ""}
                                  onChange={(e) => updateVariantName(vi, e.target.value)}
                                  className="vd-input"
                                  style={{ flex: 1 }}
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => removeVariant(vi)}
                                style={{ background: "#FEE2E2", color: "#7F1D1D", border: "1px solid #FCA5A5", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                              >
                                Remove
                              </button>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {variant.options.map((opt, oi) => (
                                <div key={oi} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, alignItems: "center" }}>
                                  <input
                                    placeholder="Label (e.g. Red, Large)"
                                    value={opt.label}
                                    onChange={(e) => updateVariantOption(vi, oi, "label", e.target.value)}
                                    className="vd-input"
                                  />
                                  <input
                                    placeholder="Value (e.g. red, XL)"
                                    value={opt.value}
                                    onChange={(e) => updateVariantOption(vi, oi, "value", e.target.value)}
                                    className="vd-input"
                                  />
                                  <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#6B7280" }}>
                                      {Number(opt.priceModifier) >= 0 ? "+₹" : "-₹"}
                                    </span>
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={opt.priceModifier}
                                      onChange={(e) => updateVariantOption(vi, oi, "priceModifier", Number(e.target.value))}
                                      className="vd-input"
                                      style={{ paddingLeft: 36 }}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeVariantOption(vi, oi)}
                                    style={{ background: "#FEE2E2", color: "#7F1D1D", border: "1px solid #FCA5A5", borderRadius: 8, padding: "8px 10px", fontSize: 14, cursor: "pointer" }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addVariantOption(vi)}
                                style={{ background: "white", color: "#374151", border: "1.5px dashed #D1D5DB", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "center" }}
                              >
                                + Add Option
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formStep === 5 && (
                    <div className="form-step" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <div>
                            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111", margin: 0 }}>Specifications</h3>
                            <p style={{ fontSize: 12, color: "#6B7280", margin: "3px 0 0" }}>
                              Add technical details like material, dimensions, compatibility, etc.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={addSpec}
                            style={{ background: "#111", color: "white", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                          >
                            + Add Spec
                          </button>
                        </div>

                        {specifications.length === 0 && (
                          <div style={{ textAlign: "center", padding: "32px 20px", background: "#F9FAFB", borderRadius: 14, border: "2px dashed #E5E7EB" }}>
                            <p style={{ fontSize: 28, margin: "0 0 8px" }}>📋</p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: 0 }}>No Specifications Added</p>
                            <p style={{ fontSize: 12, color: "#6B7280", margin: "4px 0 0" }}>Optional but improves product discoverability</p>
                          </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {specifications.length > 0 && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, padding: "0 0 4px" }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Specification</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Value</span>
                              <span></span>
                            </div>
                          )}
                          {specifications.map((spec, i) => (
                            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
                              <input
                                placeholder="e.g. Material, Color, Battery Life"
                                value={spec.key}
                                onChange={(e) => updateSpec(i, "key", e.target.value)}
                                className="vd-input"
                              />
                              <input
                                placeholder="e.g. Stainless Steel, Red, 10 hours"
                                value={spec.value}
                                onChange={(e) => updateSpec(i, "value", e.target.value)}
                                className="vd-input"
                              />
                              <button
                                type="button"
                                onClick={() => removeSpec(i)}
                                style={{ background: "#FEE2E2", color: "#7F1D1D", border: "1px solid #FCA5A5", borderRadius: 8, padding: "8px 12px", fontSize: 14, cursor: "pointer" }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ height: 1, background: "#E5E7EB" }}></div>

                      <div>
                        <label className="vd-label">Tags</label>
                        <input
                          name="tags"
                          placeholder="e.g. wireless, bluetooth, gaming, ergonomic (comma separated)"
                          value={form.tags}
                          onChange={handleChange}
                          className="vd-input"
                        />
                        <span style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4, display: "block" }}>
                          Tags help customers find your product through search
                        </span>
                        {form.tags && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                            {form.tags.split(",").map((t) => t.trim()).filter((t) => t).map((tag) => (
                              <span key={tag} style={{ background: "#F3F4F6", color: "#374151", fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 600 }}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ height: 1, background: "#E5E7EB" }}></div>

                      <div style={{ background: "#F9FAFB", borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px" }}>
                        <h4 style={{ fontSize: 13, fontWeight: 800, color: "#111", margin: "0 0 12px" }}>📋 Product Summary</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {[
                            { label: "Name", value: form.name },
                            { label: "Category", value: allCategoryOptions.find((c) => c._id === form.category)?.name || "—" },
                            { label: "Price", value: form.price ? formatRupee(Number(form.price)) : "—" },
                            { label: "Stock", value: form.stock || "—" },
                            { label: "Images", value: `${productImages.length} uploaded` },
                            { label: "Variants", value: `${variants.filter((v) => v.name).length} added` },
                          ].map((item) => (
                            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>
                              <span style={{ fontSize: 12, color: "#6B7280" }}>{item.label}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {formError && (
                    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 14px", marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>⚠️</span>
                      <p style={{ fontSize: 13, color: "#DC2626", margin: 0, fontWeight: 500 }}>{formError}</p>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, marginTop: 24, paddingTop: 20, borderTop: "1px solid #E5E7EB" }}>
                    {formStep > 1 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        style={{ background: "white", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                      >
                        ← Back
                      </button>
                    )}
                    {formStep < FORM_STEPS.length ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        style={{ flex: 1, background: "linear-gradient(135deg, #D85A30, #FF8C5A)", color: "white", border: "none", borderRadius: 12, padding: "13px", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 24px rgba(216,90,48,0.3)" }}
                      >
                        Continue to {FORM_STEPS[formStep].label} →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        style={{
                          flex: 1,
                          background: isSubmitting ? "#9CA3AF" : "linear-gradient(135deg, #22C55E, #16A34A)",
                          color: "white", border: "none", borderRadius: 12, padding: "13px",
                          fontSize: 15, fontWeight: 800,
                          cursor: isSubmitting ? "not-allowed" : "pointer",
                          boxShadow: isSubmitting ? "none" : "0 8px 24px rgba(34,197,94,0.3)",
                        }}
                      >
                        {isSubmitting ? (
                          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            <span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }}></span>
                            {editingProduct ? "Saving..." : "Submitting..."}
                          </span>
                        ) : (
                          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0 }}>My Products</h2>
                    <p style={{ fontSize: 12, color: "#6B7280", margin: "3px 0 0" }}>
                      {productsData?.data?.length || 0} products total
                    </p>
                  </div>
                  <button
                    onClick={openAddForm}
                    style={{ background: "linear-gradient(135deg, #D85A30, #FF8C5A)", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px rgba(216,90,48,0.3)" }}
                  >
                    + Add Product
                  </button>
                </div>

                <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                  {[
                    { label: "All", value: "" },
                    { label: "Pending", value: "pending" },
                    { label: "Approved", value: "approved" },
                    { label: "Rejected", value: "rejected" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setStatusFilter(item.value)}
                      style={{
                        padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                        cursor: "pointer", border: "none",
                        background: statusFilter === item.value ? "#111" : "white",
                        color: statusFilter === item.value ? "white" : "#374151",
                        border: statusFilter === item.value ? "none" : "1px solid #E5E7EB",
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {productsLoading && (
                  <div style={{ textAlign: "center", padding: 40 }}>
                    <div style={{ width: 28, height: 28, border: "3px solid #D85A30", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 10px" }}></div>
                    <p style={{ color: "#6B7280", fontSize: 13 }}>Loading products...</p>
                  </div>
                )}

                {!productsLoading && productsData?.data?.length === 0 && (
                  <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 16, border: "1px solid #E5E7EB" }}>
                    <p style={{ fontSize: 48, margin: "0 0 16px" }}>📦</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: 0 }}>No products yet</p>
                    <p style={{ fontSize: 13, color: "#6B7280", margin: "6px 0 20px" }}>Start selling by adding your first product</p>
                    <button
                      onClick={openAddForm}
                      style={{ background: "#111", color: "white", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                    >
                      + Add First Product
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {productsData?.data?.map((product) => (
                    <div key={product._id} style={{ background: "white", borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, border: "1px solid #E5E7EB", flexShrink: 0 }}
                          onError={(e) => { e.target.src = "https://placehold.co/80?text=No+Image"; }}
                        />
                      ) : (
                        <div style={{ width: 80, height: 80, background: "#F3F4F6", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
                          📦
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                          <div>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>{product.name}</h3>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                              {product.category?.name && (
                                <span style={{ fontSize: 11, color: "#6B7280" }}>📂 {product.category.name}</span>
                              )}
                              {product.brand && (
                                <span style={{ fontSize: 11, color: "#6B7280" }}>🏷️ {product.brand}</span>
                              )}
                              {product.sku && (
                                <span style={{ fontSize: 11, color: "#6B7280", fontFamily: "monospace" }}>SKU: {product.sku}</span>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 12, marginTop: 6, alignItems: "center" }}>
                              <span style={{ fontSize: 16, fontWeight: 800, color: "#B12704" }}>{formatRupee(product.price)}</span>
                              {product.comparePrice > 0 && (
                                <span style={{ fontSize: 11, color: "#9CA3AF", textDecoration: "line-through" }}>{formatRupee(product.comparePrice)}</span>
                              )}
                              <span style={{ fontSize: 11, color: product.stock <= product.lowStockThreshold && product.stock > 0 ? "#F59E0B" : product.stock === 0 ? "#EF4444" : "#6B7280", fontWeight: product.stock <= product.lowStockThreshold ? 700 : 400 }}>
                                {product.stock === 0 ? "Out of stock" : product.stock <= product.lowStockThreshold ? `⚠️ Low stock: ${product.stock}` : `Stock: ${product.stock}`}
                              </span>
                            </div>
                            {product.variants?.length > 0 && (
                              <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                                {product.variants.map((v) => (
                                  <span key={v.name} style={{ fontSize: 10, background: "#EDE9FE", color: "#5B21B6", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>
                                    {v.name}: {v.options?.length} options
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                            <StatusBadge status={product.status} />
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() => openEditForm(product)}
                                style={{ background: "#EDE9FE", color: "#5B21B6", border: "1px solid #C4B5FD", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                              >
                                ✏️ Edit
                              </button>
                              {deletingId === product._id ? (
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button
                                    onClick={() => handleDelete(product._id)}
                                    style={{ background: "#EF4444", color: "white", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setDeletingId(null)}
                                    style={{ background: "white", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 10px", fontSize: 11, cursor: "pointer" }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeletingId(product._id)}
                                  style={{ background: "#FEE2E2", color: "#7F1D1D", border: "1px solid #FCA5A5", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                                >
                                  🗑️ Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {product.status === "rejected" && product.rejectionReason && (
                          <div style={{ marginTop: 10, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                            <span>❌</span>
                            <div>
                              <p style={{ fontSize: 12, color: "#DC2626", fontWeight: 700, margin: 0 }}>Rejected — Reason:</p>
                              <p style={{ fontSize: 12, color: "#EF4444", margin: "2px 0 0" }}>{product.rejectionReason}</p>
                              <button
                                onClick={() => openEditForm(product)}
                                style={{ marginTop: 6, background: "#D85A30", color: "white", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                              >
                                Edit & Resubmit →
                              </button>
                            </div>
                          </div>
                        )}

                        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                          {product.averageRating > 0 && (
                            <span style={{ fontSize: 11, color: "#6B7280" }}>⭐ {product.averageRating.toFixed(1)} ({product.totalReviews} reviews)</span>
                          )}
                          {product.totalSold > 0 && (
                            <span style={{ fontSize: 11, color: "#6B7280" }}>📦 {product.totalSold} sold</span>
                          )}
                          {product.views > 0 && (
                            <span style={{ fontSize: 11, color: "#6B7280" }}>👁️ {product.views} views</span>
                          )}
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
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", padding: "24px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 16px" }}>My Orders</h2>
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
                    padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
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
            {ordersData?.data?.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <p style={{ fontSize: 36, margin: "0 0 12px" }}>🛒</p>
                <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>No orders found</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ordersData?.data?.map((order) => (
                <div key={order._id} style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    <div>
                      <p style={{ fontWeight: 800, color: "#111", margin: 0, fontSize: 14 }}>{order.orderNumber}</p>
                      <p style={{ fontSize: 12, color: "#6B7280", margin: "2px 0 0" }}>
                        Customer: {order.user?.firstName} {order.user?.lastName}
                      </p>
                      <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>{formatDate(order.createdAt)}</p>
                    </div>
                    <StatusBadge status={order.orderStatus} />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                    {order.items?.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <img
                          src={item.image || "https://placehold.co/44?text=P"}
                          alt={item.name}
                          style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, border: "1px solid #E5E7EB", flexShrink: 0 }}
                          onError={(e) => { e.target.src = "https://placehold.co/44?text=P"; }}
                        />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#111", margin: 0 }}>{item.name}</p>
                          <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>
                            Qty: {item.quantity} • {formatRupee(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
                    <p style={{ color: "#374151", margin: 0, fontWeight: 600 }}>
                      Ship to: {order.shippingAddress?.fullName}, {order.shippingAddress?.city}, {order.shippingAddress?.state}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {ordersData?.pagination && ordersData.pagination.pages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
                <button onClick={() => setOrderPage((p) => Math.max(1, p - 1))} disabled={orderPage === 1} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, cursor: "pointer", opacity: orderPage === 1 ? 0.4 : 1 }}>
                  ← Prev
                </button>
                <button onClick={() => setOrderPage((p) => Math.min(ordersData.pagination.pages, p + 1))} disabled={orderPage === ordersData.pagination.pages} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, cursor: "pointer", opacity: orderPage === ordersData.pagination.pages ? 0.4 : 1 }}>
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", padding: "24px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 20px" }}>My Product Reviews</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { value: totalReviews, label: "Total Reviews", color: "#111" },
                { value: avgRating, label: "Avg Rating", color: "#F59E0B" },
                { value: ratingBreakdown[5] || 0, label: "5 Star Reviews", color: "#22C55E" },
              ].map((stat) => (
                <div key={stat.label} style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px", textAlign: "center" }}>
                  <p style={{ fontSize: 28, fontWeight: 900, color: stat.color, margin: 0 }}>{stat.value}</p>
                  <p style={{ fontSize: 12, color: "#6B7280", margin: "4px 0 0" }}>{stat.label}</p>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingBreakdown[star] || 0;
                const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#6B7280", width: 16, textAlign: "right" }}>{star}</span>
                    <span style={{ color: "#F59E0B", fontSize: 12 }}>★</span>
                    <div style={{ flex: 1, background: "#F3F4F6", borderRadius: 99, height: 8, overflow: "hidden" }}>
                      <div style={{ width: `${percent}%`, height: "100%", background: "#F59E0B", borderRadius: 99, transition: "width 0.5s" }}></div>
                    </div>
                    <span style={{ fontSize: 12, color: "#6B7280", width: 20, textAlign: "right" }}>{count}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <select value={reviewSort} onChange={(e) => { setReviewSort(e.target.value); setReviewPage(1); }} style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}>
                <option value="newest">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[5, 4, 3, 2, 1].map((star) => (
                  <button key={star} onClick={() => { setReviewRatingFilter(reviewRatingFilter === star ? undefined : star); setReviewPage(1); }} style={{ padding: "7px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer", background: reviewRatingFilter === star ? "#111" : "white", color: reviewRatingFilter === star ? "white" : "#374151", border: reviewRatingFilter === star ? "none" : "1px solid #E5E7EB" }}>
                    {star} ★
                  </button>
                ))}
                {reviewRatingFilter && (
                  <button onClick={() => { setReviewRatingFilter(undefined); setReviewPage(1); }} style={{ fontSize: 12, color: "#6B7280", background: "transparent", border: "none", cursor: "pointer" }}>Clear</button>
                )}
              </div>
            </div>

            {reviewsLoading && <p style={{ color: "#6B7280" }}>Loading...</p>}
            {reviewsData?.data?.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <p style={{ fontSize: 36, margin: "0 0 12px" }}>💬</p>
                <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>No reviews yet on your products</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reviewsData?.data?.map((review) => (
                <div key={review._id} style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px" }}>
                  <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#374151", flexShrink: 0 }}>
                      {review.user?.firstName?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <p style={{ fontWeight: 700, fontSize: 13, color: "#111", margin: 0 }}>{review.user?.firstName} {review.user?.lastName}</p>
                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>{formatDate(review.createdAt)}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <div style={{ display: "flex" }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} style={{ color: s <= review.rating ? "#F59E0B" : "#E5E7EB", fontSize: 13 }}>★</span>
                          ))}
                        </div>
                        {review.isVerifiedPurchase && (
                          <span style={{ fontSize: 10, background: "#DCFCE7", color: "#14532D", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>✓ Verified</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {review.product && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      {review.product.images?.[0] && (
                        <img src={review.product.images[0].url} alt="" style={{ width: 24, height: 24, borderRadius: 5, objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} />
                      )}
                      <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>{review.product.name}</span>
                    </div>
                  )}
                  {review.title && <p style={{ fontWeight: 700, fontSize: 13, color: "#111", margin: "0 0 4px" }}>{review.title}</p>}
                  {review.body && <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.6 }}>{review.body}</p>}
                  {review.images?.length > 0 && (
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      {review.images.map((img, i) => (
                        <img key={i} src={img.url} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: "1px solid #E5E7EB" }} />
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: 11, color: "#9CA3AF", margin: "6px 0 0" }}>👍 {review.helpfulVotes?.length || 0} found helpful</p>
                </div>
              ))}
            </div>

            {reviewsData?.pagination && reviewsData.pagination.pages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
                <button onClick={() => setReviewPage((p) => Math.max(1, p - 1))} disabled={reviewPage === 1} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, cursor: "pointer", opacity: reviewPage === 1 ? 0.4 : 1 }}>← Prev</button>
                {Array.from({ length: reviewsData.pagination.pages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setReviewPage(p)} style={{ padding: "8px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", background: reviewPage === p ? "#111" : "white", color: reviewPage === p ? "white" : "#111", border: reviewPage === p ? "none" : "1px solid #E5E7EB" }}>{p}</button>
                ))}
                <button onClick={() => setReviewPage((p) => Math.min(reviewsData.pagination.pages, p + 1))} disabled={reviewPage === reviewsData.pagination.pages} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, cursor: "pointer", opacity: reviewPage === reviewsData.pagination.pages ? 0.4 : 1 }}>Next →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;