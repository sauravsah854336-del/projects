import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useGetSingleProductQuery } from "../features/product/productApi";
import { useAddToCartMutation } from "../features/cart/cartApi";
import { useSelector } from "react-redux";
import ReviewList from "../components/reviews/ReviewList";

const formatRupee = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { data, isLoading, error } = useGetSingleProductQuery(slug);
  const [addToCart, { isLoading: addingToCart }] = useAddToCartMutation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [actionType, setActionType] = useState(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">😕</p>
          <h2 className="text-2xl font-bold mb-2">Product not found</h2>
          <Link
            to="/products"
            className="bg-black text-white px-6 py-3 rounded-xl no-underline inline-block mt-4"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const product = data.data;

  const discount =
    product.comparePrice > product.price
      ? Math.round(
          ((product.comparePrice - product.price) / product.comparePrice) * 100,
        )
      : 0;

  const isCustomer = user?.role === "customer";
  const isLoggedIn = !!user;
  const canShop = !user || isCustomer;

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (!isCustomer) return;
    setActionType("cart");
    try {
      await addToCart({ productId: product._id, quantity }).unwrap();
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2500);
    } catch (err) {
      alert(err?.data?.message || "Failed to add to cart");
    } finally {
      setActionType(null);
    }
  };

  const handleBuyNow = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (!isCustomer) return;
    setActionType("buy");
    try {
      await addToCart({ productId: product._id, quantity }).unwrap();
      navigate("/checkout");
    } catch (err) {
      alert(err?.data?.message || "Failed to add to cart");
      setActionType(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-black no-underline text-gray-500">
          Home
        </Link>
        <span>/</span>
        <Link
          to="/products"
          className="hover:text-black no-underline text-gray-500"
        >
          Products
        </Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 mb-4">
            <img
              src={
                product.images?.[selectedImage]?.url ||
                "https://via.placeholder.com/600x500?text=Product"
              }
              alt={product.name}
              className="w-full h-96 object-cover"
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/600x500?text=Product";
              }}
            />
          </div>

          {product.images?.length > 1 && (
            <div className="flex gap-3 flex-wrap">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition ${selectedImage === index ? "border-black" : "border-gray-200"}`}
                >
                  <img
                    src={img.url}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/80?text=Img";
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category?.name && (
            <p className="text-sm text-gray-500 mb-2">
              {product.category.name}
            </p>
          )}

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-bold text-[#D85A30]">
              {formatRupee(product.price)}
            </span>
            {product.comparePrice > 0 && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  {formatRupee(product.comparePrice)}
                </span>
                {discount > 0 && (
                  <span className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                    {discount}% OFF
                  </span>
                )}
              </>
            )}
          </div>

          {product.averageRating > 0 && (
            <a
              href="#reviews"
              className="flex items-center gap-2 mb-4 no-underline group w-fit"
            >
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={
                      star <= Math.round(product.averageRating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm text-[#D85A30] group-hover:underline">
                {product.averageRating.toFixed(1)} ({product.totalReviews}{" "}
                {product.totalReviews === 1 ? "review" : "reviews"})
              </span>
            </a>
          )}

          {product.shortDescription && (
            <p className="text-gray-600 mb-6">{product.shortDescription}</p>
          )}

          <div className="flex items-center gap-3 mb-4">
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full ${product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              {product.stock > 0
                ? `In Stock (${product.stock} available)`
                : "Out of Stock"}
            </span>
            {product.stock > 0 &&
              product.stock <= product.lowStockThreshold && (
                <span className="text-sm text-orange-500 font-medium">
                  ⚠️ Only {product.stock} left!
                </span>
              )}
          </div>

          {product.brand && (
            <p className="text-sm text-gray-600 mb-2">
              Brand:{" "}
              <span className="font-medium text-gray-900">{product.brand}</span>
            </p>
          )}

          <p className="text-sm text-gray-600 mb-6">
            Sold by:{" "}
            <span className="font-medium text-gray-900">
              {product.vendorStore?.storeName || "Vendor"}
            </span>
          </p>

          {addedSuccess && (
            <div
              style={{
                background: "#F0FDF4",
                border: "1px solid #86EFAC",
                borderRadius: 10,
                padding: "12px 16px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>✅</span>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#166534",
                    margin: 0,
                  }}
                >
                  Added to cart successfully!
                </p>
                <p style={{ fontSize: 11, color: "#16A34A", margin: 0 }}>
                  {quantity} × {product.name}
                </p>
              </div>
              <button
                onClick={() => navigate("/cart")}
                style={{
                  background: "#22C55E",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                View Cart →
              </button>
            </div>
          )}

          {canShop && product.stock > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <p className="text-sm font-medium text-gray-700">Quantity:</p>
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="px-4 py-2 text-lg font-medium hover:bg-gray-100 transition disabled:opacity-40"
                >
                  −
                </button>
                <span className="px-4 py-2 font-medium border-x border-gray-300 min-w-[50px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                  disabled={quantity >= product.stock}
                  className="px-4 py-2 text-lg font-medium hover:bg-gray-100 transition disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Total:{" "}
                <span className="font-bold text-[#D85A30]">
                  {formatRupee(product.price * quantity)}
                </span>
              </p>
            </div>
          )}

          {canShop && (
            <div className="flex gap-3 mb-8">
              <button
                disabled={product.stock <= 0 || addingToCart}
                onClick={handleAddToCart}
                className="flex-1 bg-black text-white py-4 rounded-xl font-semibold hover:bg-[#D85A30] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionType === "cart"
                  ? "Adding..."
                  : product.stock > 0
                    ? "Add to Cart"
                    : "Out of Stock"}
              </button>
              <button
                disabled={product.stock <= 0 || addingToCart}
                onClick={handleBuyNow}
                className="flex-1 bg-[#D85A30] text-white py-4 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionType === "buy" ? "Processing..." : "Buy Now"}
              </button>
            </div>
          )}

          {!user && (
            <div
              style={{
                background: "#EFF6FF",
                border: "1px solid #93C5FD",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 20 }}>🔐</span>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#1E40AF",
                    margin: 0,
                  }}
                >
                  Sign in to purchase
                </p>
                <p style={{ fontSize: 11, color: "#2563EB", margin: 0 }}>
                  Login or create account to add items to cart
                </p>
              </div>
              <button
                onClick={() => navigate("/login")}
                style={{
                  background: "#2563EB",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Sign In
              </button>
            </div>
          )}

          {user && !isCustomer && (
            <div
              style={{
                background: "#FEF9C3",
                border: "1px solid #FDE68A",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 20 }}>ℹ️</span>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#854D0E",
                    margin: 0,
                  }}
                >
                  {user.role === "admin" ? "Admin Account" : "Vendor Account"}
                </p>
                <p style={{ fontSize: 11, color: "#A16207", margin: 0 }}>
                  {user.role === "admin"
                    ? "Admins cannot purchase products. Use a customer account."
                    : "Vendors cannot purchase products. Use a customer account."}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 py-6 border-t border-gray-100">
            {[
              { icon: "🚚", label: "Fast Delivery" },
              { icon: "🔄", label: "Easy Returns" },
              { icon: "✅", label: "Verified Seller" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-2xl mb-1">{item.icon}</div>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-4">Description</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>

        {product.specifications?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-4">Specifications</h2>
            <div className="space-y-3">
              {product.specifications.map((spec, index) => (
                <div
                  key={index}
                  className="flex justify-between py-2 border-b border-gray-50"
                >
                  <span className="text-gray-500 text-sm">{spec.key}</span>
                  <span className="text-gray-900 text-sm font-medium">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {product.tags?.length > 0 && (
        <div className="mt-8">
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-100 text-gray-600 text-sm px-3 py-1.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div id="reviews" className="mt-16 scroll-mt-8">
        <ReviewList product={product} />
      </div>
    </div>
  );
};

export default ProductDetailPage;
