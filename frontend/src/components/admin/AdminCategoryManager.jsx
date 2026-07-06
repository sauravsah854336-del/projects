import { useState } from "react";
import {
  useGetCategoryTreeQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "../../features/category/categoryApi";
import { useUploadSingleImageMutation } from "../../features/upload/uploadApi";
import { toast } from "../Toast";

const categoryIcons = {
  furniture: "🛋️", kitchen: "🍳", electronics: "📱", walls: "🧱",
  decorative: "🖼️", upholstery: "🧵", finishes: "🎨", floors: "🪵",
  furnishing: "🪟", bathroom: "🚿", sofas: "🛋️", chairs: "🪑",
  tables: "🪑", beds: "🛏️", wardrobes: "🚪", shelves: "📚",
  desks: "🖥️", cabinets: "🗄️", cookware: "🍳", appliances: "🔌",
  ac: "❄️", microwave: "🔥", refrigerator: "🧊", tv: "📺",
  "washing machine": "🌀", smartphones: "📱", laptops: "💻",
  headphones: "🎧", cameras: "📷", speakers: "🔊", gaming: "🎮",
  fashion: "👗", clothing: "👔", shoes: "👟", bedroom: "🛏️",
  outdoor: "🏡", garden: "🌿", lighting: "💡", beauty: "💄",
  health: "💊", sports: "⚽", books: "📚", toys: "🧸",
  grocery: "🛒", automotive: "🚗", office: "💼", pets: "🐾",
  tools: "🔧", gifts: "🎁", storage: "📦", dining: "🍽️",
};

const inputCls =
  "w-full border-[1.5px] border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#4338ca] focus:ring-2 focus:ring-[#4338ca]/10 transition bg-white font-[inherit]";

const Spinner = ({ text }) => (
  <div className="text-center py-12">
    <div className="w-8 h-8 border-[3px] border-[#4338ca] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
    <p className="text-gray-500 text-[13px] m-0">{text}</p>
  </div>
);

const AdminCategoryManager = () => {
  const { data: categoryData, isLoading: categoriesLoading } =
    useGetCategoryTreeQuery();
  const [createCategory, { isLoading: creatingCategory }] =
    useCreateCategoryMutation();
  const [updateCategoryMutation] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [uploadImage] = useUploadSingleImageMutation();

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    parent: "",
    image: "",
  });
  const [categoryError, setCategoryError] = useState("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const [categoryImageUploading, setCategoryImageUploading] = useState(false);
  const [updatingCategoryLoading, setUpdatingCategoryLoading] = useState(false);

  const handleCategoryImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setCategoryError("Only JPG, PNG, WebP allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCategoryError("Image must be under 5MB");
      return;
    }
    setCategoryImageUploading(true);
    setCategoryError("");
    try {
      const res = await uploadImage({ file }).unwrap();
      if (res.success) {
        setCategoryForm((prev) => ({ ...prev, image: res.data.url }));
        toast.success("Image uploaded!");
      } else {
        setCategoryError(res.message || "Upload failed");
      }
    } catch (err) {
      setCategoryError(err?.data?.message || "Upload failed");
    } finally {
      setCategoryImageUploading(false);
    }
  };

  const openEditCategory = (category, parentId) => {
    setEditingCategoryId(category._id);
    setCategoryForm({
      name: category.name || "",
      description: category.description || "",
      parent: parentId || category.parent?._id || "",
      image: category.image || "",
    });
    setShowCategoryForm(true);
    setCategoryError("");
  };

  const openAddSub = (parentCatId) => {
    setCategoryForm({
      name: "",
      description: "",
      parent: parentCatId,
      image: "",
    });
    setEditingCategoryId(null);
    setShowCategoryForm(true);
    setCategoryError("");
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCategoryError("");
    if (!categoryForm.name.trim()) {
      setCategoryError("Category name is required");
      return;
    }
    try {
      if (editingCategoryId) {
        setUpdatingCategoryLoading(true);
        await updateCategoryMutation({
          id: editingCategoryId,
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim(),
          parent: categoryForm.parent || null,
          image: categoryForm.image || "",
        }).unwrap();
        toast.success("Category updated!");
      } else {
        const res = await createCategory({
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim(),
          parent: categoryForm.parent || null,
          image: categoryForm.image || "",
        }).unwrap();
        if (res.message?.includes("restored")) {
          toast.success("🔄 Category restored (was previously deleted)");
        } else {
          toast.success(
            categoryForm.parent
              ? `Subcategory "${categoryForm.name}" created!`
              : `Department "${categoryForm.name}" created!`
          );
        }
      }
      setCategoryForm({ name: "", description: "", parent: "", image: "" });
      setShowCategoryForm(false);
      setEditingCategoryId(null);
    } catch (err) {
      setCategoryError(err?.data?.message || "Failed to save category");
    } finally {
      setUpdatingCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategory(id).unwrap();
      setDeletingCategoryId(null);
      toast.success("Category deleted");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete");
      setDeletingCategoryId(null);
    }
  };

  return (
    <div className="fade-up">
      {/* Stats Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          {
            label: "Total Departments",
            value: categoryData?.data?.length || 0,
            icon: "📂",
            color: "from-indigo-500 to-blue-500",
          },
          {
            label: "Subcategories",
            value: categoryData?.data?.reduce((sum, c) => sum + (c.children?.length || 0), 0) || 0,
            icon: "📁",
            color: "from-purple-500 to-pink-500",
          },
          {
            label: "Total Products",
            value: categoryData?.data?.reduce((sum, c) => sum + (c.productCount || 0), 0) || 0,
            icon: "📦",
            color: "from-emerald-500 to-teal-500",
          },
          {
            label: "Total Items",
            value:
              (categoryData?.data?.length || 0) +
              (categoryData?.data?.reduce((sum, c) => sum + (c.children?.length || 0), 0) || 0),
            icon: "🎯",
            color: "from-orange-500 to-red-500",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl shadow-md mb-3`}
            >
              {s.icon}
            </div>
            <p className="text-2xl font-black text-gray-900 m-0 leading-none">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1 m-0">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 m-0">
            🗂️ Category Management
          </h2>
          <p className="text-xs text-gray-500 mt-1 m-0">
            Organize products with 2-level hierarchy (Departments → Subcategories)
          </p>
        </div>
        <button
          onClick={() => {
            setCategoryForm({ name: "", description: "", parent: "", image: "" });
            setEditingCategoryId(null);
            setShowCategoryForm(!showCategoryForm);
            setCategoryError("");
          }}
          className="bg-gradient-to-r from-[#4338ca] to-[#6366f1] text-white border-none rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer font-[inherit] hover:brightness-110 transition shadow-lg shadow-indigo-200 flex items-center gap-2"
        >
          {showCategoryForm && !editingCategoryId ? (
            "✕ Cancel"
          ) : (
            <>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Department
            </>
          )}
        </button>
      </div>

      {/* Form */}
      {showCategoryForm && (
        <div className="bg-white rounded-2xl border-2 border-indigo-100 shadow-lg p-5 sm:p-7 mb-5">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-gray-100">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl shadow-md">
              {editingCategoryId ? "✏️" : categoryForm.parent ? "📁" : "📂"}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 m-0">
                {editingCategoryId
                  ? "Edit Category"
                  : categoryForm.parent
                  ? "Add Subcategory"
                  : "Create New Department"}
              </h3>
              <p className="text-xs text-gray-500 m-0 mt-0.5">
                {editingCategoryId
                  ? "Update category details"
                  : categoryForm.parent
                  ? "Add a subcategory under a parent department"
                  : "Create a new main category (department)"}
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateCategory} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wide mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Electronics, Fashion, Furniture"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className={inputCls}
                autoFocus
              />
              {categoryForm.name && (
                <p className="text-[11px] text-gray-500 mt-1 m-0 font-mono">
                  URL slug:{" "}
                  <span className="text-indigo-600 font-bold">
                    {categoryForm.name
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "")}
                  </span>
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wide mb-1.5">
                Description
              </label>
              <textarea
                placeholder="Optional description shown to customers"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                rows={2}
                className={`${inputCls} resize-vertical`}
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wide mb-1.5">
                Parent Category
              </label>
              <select
                value={categoryForm.parent}
                onChange={(e) => setCategoryForm({ ...categoryForm, parent: e.target.value })}
                className={inputCls}
              >
                <option value="">📂 Main Department (No Parent)</option>
                {categoryData?.data?.map((cat) => (
                  <option
                    key={cat._id}
                    value={cat._id}
                    disabled={editingCategoryId === cat._id}
                  >
                    📁 Under: {cat.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 mt-1 m-0">
                💡 Leave empty to create a main department
              </p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wide mb-1.5">
                Category Image
              </label>
              <div className="flex items-center gap-3">
                {categoryForm.image ? (
                  <div className="relative w-14 h-14 rounded-xl border-2 border-indigo-200 overflow-hidden shrink-0 shadow-sm">
                    <img
                      src={categoryForm.image}
                      alt="Category"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                    <button
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, image: "" })}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full border-none cursor-pointer text-[10px] flex items-center justify-center shadow"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-dashed border-indigo-300 rounded-xl flex items-center justify-center text-2xl shrink-0">
                    {categoryIcons[categoryForm.name?.toLowerCase()] || "📷"}
                  </div>
                )}
                <div className="flex-1">
                  <label className="inline-flex items-center gap-2 bg-indigo-50 text-[#4338ca] border-2 border-indigo-200 rounded-lg px-3.5 py-2 text-xs font-bold cursor-pointer hover:bg-indigo-100 transition">
                    {categoryImageUploading ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-[#4338ca] border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </span>
                    ) : (
                      <>📤 Upload Image</>
                    )}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleCategoryImageUpload}
                      className="hidden"
                      disabled={categoryImageUploading}
                    />
                  </label>
                  <p className="text-[10px] text-gray-400 mt-1 m-0">
                    Auto emoji if empty · Max 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Live Preview */}
            {categoryForm.name && (
              <div className="sm:col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4">
                <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider m-0 mb-2">
                  👁️ Live Preview
                </p>
                <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-indigo-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl shrink-0 border border-indigo-200">
                    {categoryForm.image ? (
                      <img
                        src={categoryForm.image}
                        alt=""
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      categoryIcons[categoryForm.name.toLowerCase()] ||
                      (categoryForm.parent ? "📁" : "📂")
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-extrabold text-gray-900 m-0 truncate">
                        {categoryForm.name}
                      </p>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          categoryForm.parent
                            ? "bg-purple-100 text-purple-700"
                            : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {categoryForm.parent ? "SUBCATEGORY" : "DEPARTMENT"}
                      </span>
                    </div>
                    {categoryForm.description && (
                      <p className="text-[11px] text-gray-500 m-0 mt-0.5 truncate">
                        {categoryForm.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {categoryError && (
              <div className="sm:col-span-2 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <p className="text-xs text-red-700 font-semibold m-0">{categoryError}</p>
              </div>
            )}

            <div className="sm:col-span-2 flex gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowCategoryForm(false);
                  setEditingCategoryId(null);
                  setCategoryError("");
                  setCategoryForm({ name: "", description: "", parent: "", image: "" });
                }}
                className="flex-1 bg-white text-gray-700 border-2 border-gray-200 rounded-xl px-6 py-3 text-sm font-bold cursor-pointer hover:bg-gray-50 transition font-[inherit]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  creatingCategory ||
                  updatingCategoryLoading ||
                  !categoryForm.name.trim()
                }
                className="flex-[2] bg-gradient-to-r from-[#4338ca] to-[#6366f1] text-white border-none rounded-xl py-3 text-sm font-extrabold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition font-[inherit] hover:brightness-110 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                {creatingCategory || updatingCategoryLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : editingCategoryId ? (
                  "✓ Update Category"
                ) : (
                  "🚀 Create Category"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {categoriesLoading && <Spinner text="Loading categories..." />}

      {/* Empty state */}
      {categoryData?.data?.length === 0 && !categoriesLoading && !showCategoryForm && (
        <div className="bg-white rounded-3xl border-2 border-dashed border-indigo-200 text-center py-16 px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-5 text-5xl shadow-inner">
            📂
          </div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-2">
            No categories yet
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Create your first department to start organizing products
          </p>
          <button
            onClick={() => {
              setCategoryForm({ name: "", description: "", parent: "", image: "" });
              setEditingCategoryId(null);
              setShowCategoryForm(true);
            }}
            className="bg-gradient-to-r from-[#4338ca] to-[#6366f1] text-white border-none rounded-xl px-6 py-3 text-sm font-bold cursor-pointer hover:brightness-110 transition font-[inherit] shadow-lg shadow-indigo-200"
          >
            + Create First Department
          </button>
        </div>
      )}

      {/* Categories Tree */}
      <div className="flex flex-col gap-3">
        {categoryData?.data?.map((cat) => {
          const icon = categoryIcons?.[cat.name?.toLowerCase()] || "📂";
          return (
            <div
              key={cat._id}
              className="bg-white rounded-2xl border-2 border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all overflow-hidden"
            >
              {/* Main Category Row */}
              <div className="p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-sm border-2 border-indigo-100">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover rounded-2xl"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      icon
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-base sm:text-lg font-extrabold text-gray-900 m-0">
                        {cat.name}
                      </h3>
                      <span className="text-[9px] font-extrabold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase">
                        Department
                      </span>
                      {cat.productCount > 0 && (
                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          📦 {cat.productCount} products
                        </span>
                      )}
                      {cat.children?.length > 0 && (
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          📁 {cat.children.length} sub{cat.children.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-xs text-gray-600 m-0 mb-1 line-clamp-1">
                        {cat.description}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 m-0 font-mono">
                      slug: {cat.slug}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 shrink-0 flex-wrap">
                    <button
                      onClick={() => openAddSub(cat._id)}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer transition font-[inherit] flex items-center gap-1"
                      title="Add subcategory"
                    >
                      <span className="text-sm">+</span>
                      <span className="hidden sm:inline">Add Sub</span>
                    </button>
                    <button
                      onClick={() => openEditCategory(cat)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer transition font-[inherit]"
                      title="Edit"
                    >
                      ✏️ <span className="hidden sm:inline">Edit</span>
                    </button>
                    {deletingCategoryId === cat._id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDeleteCategory(cat._id)}
                          className="bg-red-500 hover:bg-red-600 text-white border-none rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer transition font-[inherit]"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingCategoryId(null)}
                          className="bg-white text-gray-700 border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-gray-50 font-[inherit]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingCategoryId(cat._id)}
                        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer transition font-[inherit]"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Subcategories */}
              {cat.children?.length > 0 && (
                <div className="border-t-2 border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white p-3 sm:p-4">
                  <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider mb-3 px-1">
                    Subcategories ({cat.children.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {cat.children.map((sub) => {
                      const subIcon = categoryIcons?.[sub.name?.toLowerCase()] || "📁";
                      return (
                        <div
                          key={sub._id}
                          className="group bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md p-3 flex items-center gap-3 transition-all"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg flex items-center justify-center text-lg shrink-0 border border-indigo-100">
                            {sub.image ? (
                              <img
                                src={sub.image}
                                alt={sub.name}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => { e.target.style.display = "none"; }}
                              />
                            ) : (
                              subIcon
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 m-0 truncate">
                              {sub.name}
                            </p>
                            <p className="text-[10px] text-gray-400 m-0 font-mono truncate">
                              {sub.slug}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openEditCategory(sub, cat._id)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md px-2 py-1 text-[10px] font-bold cursor-pointer font-[inherit] transition"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            {deletingCategoryId === sub._id ? (
                              <>
                                <button
                                  onClick={() => handleDeleteCategory(sub._id)}
                                  className="bg-red-500 text-white border-none rounded-md px-2 py-1 text-[10px] font-bold cursor-pointer font-[inherit]"
                                >
                                  OK
                                </button>
                                <button
                                  onClick={() => setDeletingCategoryId(null)}
                                  className="bg-white text-gray-700 border border-gray-200 rounded-md px-1.5 py-1 text-[10px] cursor-pointer font-[inherit]"
                                >
                                  ×
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setDeletingCategoryId(sub._id)}
                                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md px-2 py-1 text-[10px] font-bold cursor-pointer font-[inherit] transition"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Add subcategory tile */}
                    <button
                      onClick={() => openAddSub(cat._id)}
                      className="bg-white border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-all text-indigo-600 hover:text-indigo-700 font-bold text-xs font-[inherit]"
                    >
                      <span className="text-lg">+</span>
                      Add Subcategory
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminCategoryManager;