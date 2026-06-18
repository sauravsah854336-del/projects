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
import { useNavigate } from "react-router-dom";

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

  const { data: categoryData, isLoading: categoriesLoading } = useGetCategoryTreeQuery();
  const [createCategory, { isLoading: creatingCategory }] = useCreateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [productStatusFilter, setProductStatusFilter] = useState("pending");
  const { data: productsData, isLoading: productsLoading } = useAdminGetAllProductsQuery({
    status: productStatusFilter,
  });
  const [approveProduct] = useApproveProductMutation();
  const [rejectProduct] = useRejectProductMutation();
  const [featureProduct] = useFeatureProductMutation();
  const [productRejectReason, setProductRejectReason] = useState("");
  const [productRejectingId, setProductRejectingId] = useState(null);

  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const { data: ordersData, isLoading: ordersLoading } = useAdminGetAllOrdersQuery({
    status: orderStatusFilter,
    page: orderPage,
  });
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const [activeTab, setActiveTab] = useState("vendors");
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    parent: "",
  });
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
    } catch (err) {
      console.log(err);
    }
  };

  const handleReject = async (vendorId) => {
    try {
      await rejectVendor({ vendorId, reason: rejectReason }).unwrap();
      setRejectingId(null);
      setRejectReason("");
    } catch (err) {
      console.log(err);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCategoryError("");
    const name = categoryForm.name.trim();
    if (!name) {
      setCategoryError("Category name is required");
      return;
    }
    try {
      await createCategory({
        name,
        description: categoryForm.description.trim(),
        parent: categoryForm.parent || null,
      }).unwrap();
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
    } catch (err) {
      console.log(err);
    }
  };

  const handleRejectProduct = async (id) => {
    try {
      await rejectProduct({ id, reason: productRejectReason }).unwrap();
      setProductRejectingId(null);
      setProductRejectReason("");
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

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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

      <div className="flex gap-3 mb-6 flex-wrap">
        {["vendors", "categories", "products", "orders"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded font-medium capitalize ${
              activeTab === tab
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "vendors" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Pending Vendor Approvals</h2>
          {vendorsLoading && <p className="text-gray-500">Loading...</p>}
          {pendingData?.data?.length === 0 && (
            <p className="text-gray-500">No pending vendor requests</p>
          )}
          {pendingData?.data?.map((vendor) => (
            <div key={vendor._id} className="border rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{vendor.storeName}</h3>
                  <p className="text-gray-500 text-sm">
                    {vendor.userId?.firstName} {vendor.userId?.lastName}
                  </p>
                  <p className="text-gray-500 text-sm">{vendor.userId?.email}</p>
                  <p className="text-gray-500 text-sm">{vendor.userId?.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(vendor._id)}
                    className="bg-green-500 text-white px-4 py-2 rounded text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      setRejectingId(
                        rejectingId === vendor._id ? null : vendor._id
                      )
                    }
                    className="bg-red-500 text-white px-4 py-2 rounded text-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
              {rejectingId === vendor._id && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Rejection reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="flex-1 border p-2 rounded"
                  />
                  <button
                    onClick={() => handleReject(vendor._id)}
                    className="bg-red-600 text-white px-4 py-2 rounded text-sm"
                  >
                    Confirm
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "categories" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Category Management</h2>
          <form onSubmit={handleCreateCategory} className="mb-6 space-y-3">
            <input
              type="text"
              placeholder="Category Name"
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, name: e.target.value })
              }
              className="w-full border p-3 rounded"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={categoryForm.description}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, description: e.target.value })
              }
              className="w-full border p-3 rounded"
            />
            <select
              value={categoryForm.parent}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, parent: e.target.value })
              }
              className="w-full border p-3 rounded"
            >
              <option value="">No Parent (Main Category)</option>
              {categoryData?.data?.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {categoryError && (
              <p className="text-red-500 text-sm">{categoryError}</p>
            )}
            <button
              type="submit"
              disabled={creatingCategory}
              className="bg-black text-white px-6 py-3 rounded w-full"
            >
              {creatingCategory ? "Creating..." : "Create Category"}
            </button>
          </form>
          {categoriesLoading && <p className="text-gray-500">Loading...</p>}
          {categoryData?.data?.map((cat) => (
            <div key={cat._id} className="border rounded-lg p-4 mb-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">{cat.name}</h3>
                <button
                  onClick={() => handleDeleteCategory(cat._id)}
                  className="bg-red-500 text-white px-3 py-1.5 rounded text-sm"
                >
                  Delete
                </button>
              </div>
              {cat.children?.length > 0 && (
                <div className="mt-3 ml-6 space-y-2">
                  {cat.children.map((sub) => (
                    <div
                      key={sub._id}
                      className="flex justify-between items-center border-l-2 border-gray-200 pl-4 py-2"
                    >
                      <p className="font-medium text-sm">{sub.name}</p>
                      <button
                        onClick={() => handleDeleteCategory(sub._id)}
                        className="bg-red-400 text-white px-2 py-1 rounded text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "products" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Product Management</h2>
          <div className="flex gap-2 mb-4">
            {["pending", "approved", "rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setProductStatusFilter(status)}
                className={`px-4 py-2 rounded text-sm font-medium capitalize ${
                  productStatusFilter === status
                    ? "bg-black text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          {productsLoading && <p className="text-gray-500">Loading...</p>}
          {productsData?.data?.length === 0 && (
            <p className="text-gray-500">No {productStatusFilter} products</p>
          )}
          {productsData?.data?.map((product) => (
            <div key={product._id} className="border rounded-lg p-4 mb-3">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  {product.images?.[0] && (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src =
                          "https://placehold.co/80?text=No+Image";
                      }}
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-gray-500 text-sm">
                      {product.category?.name}
                    </p>
                    <p className="text-gray-500 text-sm">
                      Vendor: {product.vendor?.firstName}{" "}
                      {product.vendor?.lastName}
                    </p>
                    <p className="text-[#D85A30] font-bold mt-1">
                      {formatRupee(product.price)}
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
                  {product.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveProduct(product._id)}
                        className="bg-green-500 text-white px-3 py-1.5 rounded text-xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          setProductRejectingId(
                            productRejectingId === product._id
                              ? null
                              : product._id
                          )
                        }
                        className="bg-red-500 text-white px-3 py-1.5 rounded text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {product.status === "approved" && (
                    <button
                      onClick={() => handleFeatureProduct(product._id)}
                      className={`px-3 py-1.5 rounded text-xs ${
                        product.isFeatured
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {product.isFeatured ? "★ Featured" : "☆ Feature"}
                    </button>
                  )}
                </div>
              </div>
              {productRejectingId === product._id && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Rejection reason"
                    value={productRejectReason}
                    onChange={(e) => setProductRejectReason(e.target.value)}
                    className="flex-1 border p-2 rounded"
                  />
                  <button
                    onClick={() => handleRejectProduct(product._id)}
                    className="bg-red-600 text-white px-4 py-2 rounded text-sm"
                  >
                    Confirm
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Order Management</h2>

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
                    {order.user?.firstName} {order.user?.lastName} •{" "}
                    {order.user?.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    Phone: {order.user?.phone}
                  </p>
                  <p className="text-xs text-gray-400">
                    Placed on {formatDate(order.createdAt)}
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
                  <p className="text-lg font-bold text-[#D85A30] mt-1">
                    {formatRupee(order.total)}
                  </p>
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
                        {formatRupee(item.price * item.quantity)} •{" "}
                        {item.storeName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm">
                <p className="font-medium text-gray-700 mb-1">Ship to:</p>
                <p className="text-gray-600">
                  {order.shippingAddress?.fullName},{" "}
                  {order.shippingAddress?.phone}
                </p>
                <p className="text-gray-600">
                  {order.shippingAddress?.street}, {order.shippingAddress?.city},{" "}
                  {order.shippingAddress?.state} -{" "}
                  {order.shippingAddress?.postalCode}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
                <p className="text-sm text-gray-500">
                  Payment:{" "}
                  <span className="font-medium capitalize">
                    {order.paymentMethod === "cod"
                      ? "Cash on Delivery"
                      : "Online"}
                  </span>{" "}
                  •{" "}
                  <span
                    className={
                      order.paymentStatus === "paid"
                        ? "text-green-600 font-medium"
                        : "text-yellow-600 font-medium"
                    }
                  >
                    {order.paymentStatus}
                  </span>
                </p>

                {!["cancelled", "delivered", "refunded"].includes(
                  order.orderStatus
                ) && (
                  <select
                    value={order.orderStatus}
                    onChange={(e) =>
                      handleUpdateOrderStatus(order._id, e.target.value)
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
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
                <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-3">
                  <p className="text-xs text-red-600">
                    Cancel Reason: {order.cancelReason}
                  </p>
                </div>
              )}
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
              {Array.from(
                { length: ordersData.pagination.pages },
                (_, i) => i + 1
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => setOrderPage(p)}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    orderPage === p
                      ? "bg-black text-white"
                      : "border border-gray-300"
                  }`}
                >
                  {p}
                </button>
              ))}
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

export default AdminDashboard;