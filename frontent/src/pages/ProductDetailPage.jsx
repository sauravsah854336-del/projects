import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useGetSingleProductQuery } from "../features/product/productApi";
import { useCart } from "../hooks/useCart";
import { useSelector } from "react-redux";
import ReviewList from "../components/reviews/ReviewList";
import WishlistButton from "../components/WishlistButton";
import { toast } from "../components/Toast";

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
  const { addItem, isLoading: addingToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [actionType, setActionType] = useState(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#D85A30] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-14 rounded-2xl border border-gray-200 max-w-sm">
          <p className="text-6xl mb-4">😕</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
          <p className="text-gray-500 text-sm mb-6">This product doesn't exist or has been removed.</p>
          <Link
            to="/products"
            className="bg-black text-white px-6 py-3 rounded-xl no-underline inline-block font-semibold hover:bg-[#D85A30] transition"
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
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

  const isCustomer = user?.role === "customer";
  const canShop = !user || isCustomer;

  const handleAddToCart = async () => {
    if (user && !isCustomer) return;
    setActionType("cart");
    try {
      await addItem(product, quantity);
      setAddedSuccess(true);
      toast.success(`Added ${quantity} × ${product.name} to cart!`);
      setTimeout(() => setAddedSuccess(false), 2500);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to add to cart");
    } finally {
      setActionType(null);
    }
  };

  const handleBuyNow = async () => {
    if (user && !isCustomer) return;
    setActionType("buy");
    try {
      await addItem(product, quantity);
      if (!user) {
        navigate("/login?redirect=/checkout");
      } else {
        navigate("/checkout");
      }
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to add to cart");
      setActionType(null);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10">

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap">
          <Link to="/" className="hover:text-black no-underline text-gray-500 transition">
            Home
          </Link>
          <span className="text-gray-300">/</span>
          <Link to="/products" className="hover:text-black no-underline text-gray-500 transition">
            Products
          </Link>
          <span className="text-gray-300">/</span>
          {product.category?.name && (
            <>
              <Link
                to={`/products?category=${product.category._id}`}
                className="hover:text-black no-underline text-gray-500 transition"
              >
                {product.category.name}
              </Link>
              <span className="text-gray-300">/</span>
            </>
          )}
          <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">

          <div>
            <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 mb-4 group">
              <img
                src={product.images?.[selectedImage]?.url || "https://via.placeholder.com/600x500?text=Product"}
                alt={product.name}
                className="w-full h-96 object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { e.target.src = "https://via.placeholder.com/600x500?text=Product"; }}
              />
              {discount > 0 && (
                <span className="absolute top-3 left-3 bg-[#D85A30] text-white text-xs font-bold px-3 py-1 rounded-full">
                  {discount}% OFF
                </span>
              )}
              {product.isFeatured && !discount && (
                <span className="absolute top-3 left-3 bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
                  ⭐ Featured
                </span>
              )}
              <div className="absolute top-3 right-3">
                <WishlistButton product={product} size="lg" />
              </div>
              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-white text-gray-900 font-bold px-4 py-2 rounded-lg text-sm">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {product.images?.length > 1 && (
              <div className="flex gap-3 flex-wrap">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? "border-black ring-2 ring-black/10"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = "https://via.placeholder.com/80?text=Img"; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.category?.name && (
              <Link
                to={`/products?category=${product.category._id}`}
                className="inline-block text-xs font-bold text-[#D85A30] bg-orange-50 border border-orange-200 px-3 py-1 rounded-full no-underline mb-3 hover:bg-orange-100 transition"
              >
                {product.category.name}
              </Link>
            )}

            <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-3xl font-extrabold text-[#B12704]">
                {formatRupee(product.price)}
              </span>
              {product.comparePrice > product.price && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    {formatRupee(product.comparePrice)}
                  </span>
                  {discount > 0 && (
                    <span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full">
                      Save {discount}%
                    </span>
                  )}
                </>
              )}
            </div>

            {product.averageRating > 0 && (
              <a href="#reviews" className="flex items-center gap-2 mb-5 no-underline group w-fit">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${star <= Math.round(product.averageRating) ? "text-yellow-400" : "text-gray-200"}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-[#D85A30] group-hover:underline font-medium">
                  {product.averageRating.toFixed(1)} ({product.totalReviews} {product.totalReviews === 1 ? "review" : "reviews"})
                </span>
              </a>
            )}

            {product.shortDescription && (
              <p className="text-gray-600 mb-5 leading-relaxed">{product.shortDescription}</p>
            )}

            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {product.stock > 0 ? `✓ In Stock (${product.stock} available)` : "✕ Out of Stock"}
              </span>
              {product.stock > 0 && product.stock <= product.lowStockThreshold && (
                <span className="text-sm text-orange-500 font-semibold bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200">
                  ⚠️ Only {product.stock} left!
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1 mb-5">
              {product.brand && (
                <p className="text-sm text-gray-600">
                  Brand: <span className="font-semibold text-gray-900">{product.brand}</span>
                </p>
              )}
              <p className="text-sm text-gray-600">
                Sold by:{" "}
                <span className="font-semibold text-gray-900">
                  {product.vendorStore?.storeName || "Vendor"}
                </span>
              </p>
            </div>

            {addedSuccess && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                <span className="text-xl">✅</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-800 m-0">Added to cart successfully!</p>
                  <p className="text-xs text-green-600 m-0">{quantity} × {product.name}</p>
                </div>
                <button
                  onClick={() => navigate("/cart")}
                  className="bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-lg border-none cursor-pointer hover:bg-green-600 transition whitespace-nowrap"
                >
                  View Cart →
                </button>
              </div>
            )}

            {canShop && product.stock > 0 && (
              <div className="flex items-center gap-4 mb-5">
                <p className="text-sm font-semibold text-gray-700">Quantity:</p>
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-4 py-2.5 text-lg font-bold hover:bg-gray-100 transition disabled:opacity-30 border-none bg-white cursor-pointer"
                  >
                    −
                  </button>
                  <span className="px-5 py-2.5 font-bold text-base border-x-2 border-gray-200 min-w-[56px] text-center bg-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="px-4 py-2.5 text-lg font-bold hover:bg-gray-100 transition disabled:opacity-30 border-none bg-white cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Total:{" "}
                  <span className="font-extrabold text-[#B12704] text-sm">
                    {formatRupee(product.price * quantity)}
                  </span>
                </p>
              </div>
            )}

            {canShop && (
              <div className="flex gap-3 mb-3">
                <button
                  disabled={product.stock <= 0 || addingToCart}
                  onClick={handleAddToCart}
                  className="flex-1 bg-black text-white py-4 rounded-xl font-bold text-sm hover:bg-[#D85A30] transition disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
                >
                  {actionType === "cart" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Adding...
                    </span>
                  ) : product.stock > 0 ? "🛒 Add to Cart" : "Out of Stock"}
                </button>
                <button
                  disabled={product.stock <= 0 || addingToCart}
                  onClick={handleBuyNow}
                  className="flex-1 bg-[#D85A30] text-white py-4 rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
                >
                  {actionType === "buy" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Processing...
                    </span>
                  ) : "⚡ Buy Now"}
                </button>
              </div>
            )}

            {canShop && (
              <div className="mb-5">
                <WishlistButton
                  product={product}
                  size="md"
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    height: 48,
                    fontSize: 14,
                    fontWeight: 700,
                    gap: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              </div>
            )}

            {!user && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                <span className="text-2xl">🔐</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-800 m-0">Sign in for better experience</p>
                  <p className="text-xs text-blue-600 m-0">Login to save cart, track orders & get personalized recommendations</p>
                </div>
                <button
                  onClick={() => navigate("/login")}
                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg border-none cursor-pointer hover:bg-blue-700 transition whitespace-nowrap"
                >
                  Sign In
                </button>
              </div>
            )}

            {user && !isCustomer && (
              <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5">
                <span className="text-2xl">ℹ️</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-yellow-800 m-0">
                    {user.role === "admin" ? "Admin Account" : "Vendor Account"}
                  </p>
                  <p className="text-xs text-yellow-700 m-0">
                    {user.role === "admin"
                      ? "Admins cannot purchase products. Use a customer account."
                      : "Vendors cannot purchase products. Use a customer account."}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 py-5 border-t border-gray-100 mt-2">
              {[
                { icon: "🚚", label: "Fast Delivery", sub: "2-5 business days" },
                { icon: "🔄", label: "Easy Returns", sub: "10-day policy" },
                { icon: "✅", label: "Verified Seller", sub: "Trusted vendor" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <p className="text-xs font-bold text-gray-700 m-0">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📄</span> Description
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
              {product.description}
            </p>
          </div>

          {product.specifications?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📋</span> Specifications
              </h2>
              <div className="space-y-2">
                {product.specifications.map((spec, index) => (
                  <div
                    key={index}
                    className={`flex justify-between py-2.5 px-3 rounded-lg text-sm ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                  >
                    <span className="text-gray-500 font-medium">{spec.key}</span>
                    <span className="text-gray-900 font-semibold">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {product.tags?.length > 0 && (
          <div className="mt-8">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Tags</p>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-600 text-sm px-3 py-1.5 rounded-full hover:bg-gray-200 transition cursor-default"
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
    </div>
  );
};

export default ProductDetailPage;