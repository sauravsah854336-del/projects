import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { authApi, useLogoutMutation } from "../features/auth/authApi";
import { useGetCategoriesQuery } from "../features/category/categoryApi";
import {
  useGetVendorProductsQuery,
  useCreateProductMutation,
  useDeleteProductMutation,
} from "../features/product/productApi";
import { useVendorGetOrdersQuery } from "../features/order/orderApi";
import { useNavigate } from "react-router-dom";
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

const getStatusColor = (status) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    out_for_delivery: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    returned: "bg-gray-100 text-gray-700",
    refunded: "bg-pink-100 text-pink-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
};

const getStatusLabel = (status) => {
  const labels = {
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    returned: "Returned",
    refunded: "Refunded",
  };
  return labels[status] || status;
};

const VendorDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, refreshToken } = useSelector((state) => state.auth);
  const [logoutAPI, { isLoading: logoutLoading }] = useLogoutMutation();

  const { data: categoriesData } = useGetCategoriesQuery();
  const [statusFilter, setStatusFilter] = useState("");
  const { data: productsData, isLoading: productsLoading } =
    useGetVendorProductsQuery({ status: statusFilter });
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const { data: ordersData, isLoading: ordersLoading } =
    useVendorGetOrdersQuery({
      status: orderStatusFilter,
      page: orderPage,
    });

  const [activeTab, setActiveTab] = useState("products");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [productImages, setProductImages] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    shortDescription: "",
    category: "",
    brand: "",
    price: "",
    comparePrice: "",
    stock: "",
    sku: "",
    tags: "",
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setFormError("");

    if (
      !form.name ||
      !form.description ||
      !form.category ||
      !form.price ||
      !form.stock
    ) {
      setFormError(
        "Name, description, category, price and stock are required"
      );
      return;
    }

    try {
      const productData = {
        name: form.name.trim(),
        description: form.description.trim(),
        shortDescription: form.shortDescription.trim(),
        category: form.category,
        brand: form.brand.trim(),
        price: Number(form.price),
        comparePrice: Number(form.comparePrice) || 0,
        stock: Number(form.stock),
        sku: form.sku.trim(),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
        images: productImages.map((img) => ({
          url: img.url,
          isDefault: img.isDefault,
        })),
      };

      await createProduct(productData).unwrap();

      setForm({
        name: "",
        description: "",
        shortDescription: "",
        category: "",
        brand: "",
        price: "",
        comparePrice: "",
        stock: "",
        sku: "",
        tags: "",
      });
      setProductImages([]);
      setShowForm(false);
    } catch (err) {
      setFormError(err?.data?.message || "Failed to create product");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id).unwrap();
    } catch (err) {
      alert(err?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
          <p className="text-gray-500">Welcome, {user?.firstName}</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={logoutLoading}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          {logoutLoading ? "..." : "Logout"}
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2 rounded font-medium ${
            activeTab === "products"
              ? "bg-black text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          My Products
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 rounded font-medium ${
            activeTab === "orders"
              ? "bg-black text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Orders
        </button>
      </div>

      {activeTab === "products" && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">My Products</h2>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) {
                  setProductImages([]);
                  setForm({
                    name: "",
                    description: "",
                    shortDescription: "",
                    category: "",
                    brand: "",
                    price: "",
                    comparePrice: "",
                    stock: "",
                    sku: "",
                    tags: "",
                  });
                }
              }}
              className="bg-black text-white px-4 py-2 rounded text-sm"
            >
              {showForm ? "Cancel" : "+ Add Product"}
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            {[
              { label: "All", value: "" },
              { label: "Pending", value: "pending" },
              { label: "Approved", value: "approved" },
              { label: "Rejected", value: "rejected" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setStatusFilter(item.value)}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  statusFilter === item.value
                    ? "bg-black text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {showForm && (
            <form
              onSubmit={handleCreateProduct}
              className="mb-6 space-y-3 border rounded-lg p-4"
            >
              <input
                name="name"
                placeholder="Product Name *"
                value={form.name}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />
              <textarea
                name="description"
                placeholder="Description *"
                value={form.description}
                onChange={handleChange}
                className="w-full border p-3 rounded"
                rows={3}
              />
              <input
                name="shortDescription"
                placeholder="Short Description"
                value={form.shortDescription}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              >
                <option value="">Select Category *</option>
                {categoriesData?.data?.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                name="brand"
                placeholder="Brand"
                value={form.brand}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="price"
                  type="number"
                  placeholder="Price *"
                  value={form.price}
                  onChange={handleChange}
                  className="w-full border p-3 rounded"
                />
                <input
                  name="comparePrice"
                  type="number"
                  placeholder="Compare Price"
                  value={form.comparePrice}
                  onChange={handleChange}
                  className="w-full border p-3 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="stock"
                  type="number"
                  placeholder="Stock *"
                  value={form.stock}
                  onChange={handleChange}
                  className="w-full border p-3 rounded"
                />
                <input
                  name="sku"
                  placeholder="SKU"
                  value={form.sku}
                  onChange={handleChange}
                  className="w-full border p-3 rounded"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Product Images
                </p>
                <ImageUploader
                  images={productImages}
                  setImages={setProductImages}
                  maxImages={10}
                />
              </div>
              <input
                name="tags"
                placeholder="Tags (comma separated)"
                value={form.tags}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />
              {formError && (
                <p className="text-red-500 text-sm">{formError}</p>
              )}
              <button
                type="submit"
                disabled={creating}
                className="bg-[#D85A30] text-white px-6 py-3 rounded w-full font-medium"
              >
                {creating ? "Creating..." : "Create Product"}
              </button>
            </form>
          )}

          {productsLoading && <p className="text-gray-500">Loading...</p>}
          {productsData?.data?.length === 0 && (
            <p className="text-gray-500">No products found</p>
          )}
          {productsData?.data?.map((product) => (
            <div key={product._id} className="border rounded-lg p-4 mb-3">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src =
                          "https://placehold.co/80?text=No+Image";
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-gray-500 text-sm">
                      {product.category?.name}
                    </p>
                    <p className="text-[#D85A30] font-bold mt-1">
                      {formatRupee(product.price)}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Stock: {product.stock}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      product.status
                    )}`}
                  >
                    {product.status}
                  </span>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {product.status === "rejected" && product.rejectionReason && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm font-medium">
                    Rejection Reason:
                  </p>
                  <p className="text-red-500 text-sm">
                    {product.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">My Orders</h2>

          <div className="flex gap-2 mb-4 flex-wrap">
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
                onClick={() => {
                  setOrderStatusFilter(item.value);
                  setOrderPage(1);
                }}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  orderStatusFilter === item.value
                    ? "bg-black text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {ordersLoading && <p className="text-gray-500">Loading...</p>}

          {ordersData?.data?.length === 0 && (
            <p className="text-gray-500">No orders found</p>
          )}

          {ordersData?.data?.map((order) => (
            <div key={order._id} className="border rounded-lg p-4 mb-4">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                <div>
                  <p className="font-bold text-gray-900">
                    {order.orderNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    Customer: {order.user?.firstName} {order.user?.lastName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      order.orderStatus
                    )}`}
                  >
                    {getStatusLabel(order.orderStatus)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <img
                      src={
                        item.image ||
                        "https://placehold.co/50?text=Product"
                      }
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        e.target.src =
                          "https://placehold.co/50?text=Product";
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity} •{" "}
                        {formatRupee(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-700 mb-1">Ship to:</p>
                <p className="text-gray-600">
                  {order.shippingAddress?.fullName},{" "}
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}
                </p>
              </div>
            </div>
          ))}

          {ordersData?.pagination && ordersData.pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                disabled={orderPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setOrderPage((p) =>
                    Math.min(ordersData.pagination.pages, p + 1)
                  )
                }
                disabled={orderPage === ordersData.pagination.pages}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;