import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetAllProductsQuery } from "../features/product/productApi";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import { useCart } from "../hooks/useCart";
import { useSelector } from "react-redux";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";
import WishlistButton from "../components/WishlistButton";
import { toast } from "../components/Toast";

const formatRupee = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const categoryIcons = {
  furniture: "🛋️",
  electronics: "📱",
  fashion: "👕",
  "home decor": "🏠",
  sports: "⚽",
  books: "📚",
  beauty: "💄",
  kitchen: "🍳",
  clothing: "👔",
  accessories: "⌚",
  toys: "🧸",
  health: "💊",
  grocery: "🛒",
  automotive: "🚗",
  garden: "🌿",
  office: "💼",
};

const ProductCard = ({
  product,
  canShop,
  loading,
  isAdded,
  onAddToCart,
  onBuyNow,
  size = "normal",
}) => {
  const discount =
    product.comparePrice > product.price
      ? Math.round(
          ((product.comparePrice - product.price) / product.comparePrice) * 100,
        )
      : 0;

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group block bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:border-[#D85A30] hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-1 no-underline"
    >
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        <img
          src={product.images?.[0]?.url || PLACEHOLDER_MEDIUM}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = PLACEHOLDER_MEDIUM;
          }}
        />
        {product.isFeatured && size === "featured" && (
          <span className="absolute top-2.5 left-2.5 bg-gray-900 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md">
            ⭐ Featured
          </span>
        )}
        {discount > 0 && (
          <span className="absolute top-2.5 right-2.5 bg-[#D85A30] text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
            {discount}% OFF
          </span>
        )}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
            <span className="bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-md">
              Out of Stock
            </span>
          </div>
        )}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <WishlistButton product={product} size="sm" />
        </div>
      </div>

      <div className="p-3">
        <p className="text-[10px] text-gray-400 mb-1 truncate">
          {product.vendorStore?.storeName || "Vendor"}
        </p>
        <h3 className="text-[13px] font-medium text-gray-900 mb-1 line-clamp-2 leading-snug">
          {product.name}
        </h3>
        {product.averageRating > 0 && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-[11px] text-gray-500">
              {product.averageRating.toFixed(1)}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-base font-extrabold text-[#B12704]">
            {formatRupee(product.price)}
          </span>
          {product.comparePrice > product.price && (
            <span className="text-[11px] text-gray-400 line-through">
              {formatRupee(product.comparePrice)}
            </span>
          )}
        </div>
        {canShop && product.stock > 0 && (
          <div className="flex gap-1.5">
            <button
              onClick={(e) => onAddToCart(e, product)}
              disabled={loading === "cart"}
              className={`flex-1 text-[11px] font-bold py-2 rounded-md border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isAdded
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 border-yellow-400 hover:brightness-95"
              }`}
            >
              {loading === "cart" ? "..." : isAdded ? "✓ Added" : "Add to Cart"}
            </button>
            <button
              onClick={(e) => onBuyNow(e, product)}
              disabled={loading === "buy"}
              className="flex-1 bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white text-[11px] font-bold py-2 rounded-md border-none cursor-pointer transition-all hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === "buy" ? "..." : "Buy Now"}
            </button>
          </div>
        )}
      </div>
    </Link>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { addItem } = useCart();
  const [addedProducts, setAddedProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState({});

  const { data: productsData, isLoading: productsLoading } =
    useGetAllProductsQuery({ limit: 16, sort: "newest" });
  const { data: categoryData } = useGetCategoryTreeQuery();

  const isCustomer = user?.role === "customer";
  const canShop = !user || isCustomer;
  const categories = categoryData?.data || [];
  const products = productsData?.data || [];
  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 4);
  const latestProducts = products.slice(0, 16);

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (user && !isCustomer) return;
    setLoadingProducts((p) => ({ ...p, [product._id]: "cart" }));
    try {
      await addItem(product, 1);
      setAddedProducts((prev) => ({ ...prev, [product._id]: true }));
      toast.success("Added to cart!");
      setTimeout(
        () => setAddedProducts((prev) => ({ ...prev, [product._id]: false })),
        2000,
      );
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || "Failed to add to cart",
      );
    } finally {
      setLoadingProducts((p) => ({ ...p, [product._id]: null }));
    }
  };

  const handleBuyNow = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (user && !isCustomer) return;
    setLoadingProducts((p) => ({ ...p, [product._id]: "buy" }));
    try {
      await addItem(product, 1);
      if (!user) {
        navigate("/login?redirect=/checkout");
      } else {
        navigate("/checkout");
      }
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || "Failed to add to cart",
      );
      setLoadingProducts((p) => ({ ...p, [product._id]: null }));
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {categories.length > 0 && (
        <section className="bg-white py-8 sm:py-10 px-4 sm:px-5">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                  Shop by Category
                </h2>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                  Browse products across all departments
                </p>
              </div>
              <Link
                to="/products"
                className="text-xs sm:text-sm font-semibold text-blue-700 border border-blue-700 px-3 py-1.5 rounded-md no-underline hover:bg-blue-700 hover:text-white transition-all"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-3">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  onClick={() => navigate(`/products?category=${cat._id}`)}
                  className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-all duration-200 hover:border-[#D85A30] hover:-translate-y-1 hover:shadow-md hover:shadow-orange-500/10"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2 text-lg sm:text-2xl">
                    {categoryIcons[cat.name.toLowerCase()] || "📦"}
                  </div>
                  <p className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight">
                    {cat.name}
                  </p>
                  {cat.children?.length > 0 && (
                    <p className="text-[9px] sm:text-[10px] text-[#D85A30] font-semibold mt-1">
                      {cat.children.length} sub
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {featuredProducts.length > 0 && (
        <section className="bg-gradient-to-br from-orange-50 to-orange-50/50 py-8 sm:py-10 px-4 sm:px-5">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg sm:text-xl">⭐</span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                    Featured Products
                  </h2>
                </div>
                <p className="text-gray-500 text-xs sm:text-sm">
                  Handpicked by our team
                </p>
              </div>
              <Link
                to="/products?sort=popular"
                className="text-xs sm:text-sm font-semibold text-blue-700 border border-blue-700 px-3 py-1.5 rounded-md no-underline hover:bg-blue-700 hover:text-white transition-all"
              >
                See All
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  canShop={canShop}
                  loading={loadingProducts[product._id]}
                  isAdded={addedProducts[product._id]}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  size="featured"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-8 sm:py-10 px-4 sm:px-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg sm:text-xl">🆕</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                  Latest Products
                </h2>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm">
                Fresh arrivals from verified vendors
              </p>
            </div>
            <Link
              to="/products"
              className="text-xs sm:text-sm font-semibold text-blue-700 border border-blue-700 px-3 py-1.5 rounded-md no-underline hover:bg-blue-700 hover:text-white transition-all"
            >
              See All
            </Link>
          </div>

          {productsLoading && (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-[3px] border-[#D85A30] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Loading products...</p>
            </div>
          )}

          {!productsLoading && latestProducts.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <p className="text-5xl mb-3">📦</p>
              <p className="text-base font-bold text-gray-900">
                No products yet
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Check back soon for new arrivals
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
            {latestProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                canShop={canShop}
                loading={loadingProducts[product._id]}
                isAdded={addedProducts[product._id]}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-8 sm:py-10 px-4 sm:px-5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 text-center mb-2">
            Why Shop With Us?
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm text-center mb-8">
            Trusted by thousands of customers across India
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[
              {
                icon: "🚚",
                title: "Free Delivery",
                desc: "On orders above ₹499",
              },
              {
                icon: "🔄",
                title: "Easy Returns",
                desc: "10-day hassle-free policy",
              },
              {
                icon: "🛡️",
                title: "Secure Payments",
                desc: "100% safe transactions",
              },
              {
                icon: "✅",
                title: "Verified Vendors",
                desc: "Manually approved sellers",
              },
              {
                icon: "💬",
                title: "24/7 Support",
                desc: "Always here to help",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 text-center hover:border-[#D85A30] hover:shadow-md hover:shadow-orange-500/10 transition-all duration-200"
              >
                <div className="text-3xl sm:text-4xl mb-3">{item.icon}</div>
                <p className="font-bold text-sm text-gray-900 mb-1">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {canShop && (
        <section className="py-8 sm:py-10 px-4 sm:px-5">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#D85A30]/15 border border-[#D85A30]/30 rounded-full px-3 py-1 mb-4">
                  <span className="text-[#D85A30] text-xs font-bold">
                    FOR SELLERS
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                  Start Selling Today
                </h2>
                <p className="text-slate-400 text-sm max-w-md">
                  Join hundreds of vendors already selling on our platform.
                  Setup your store in minutes and reach thousands of customers.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/vendor/signup")}
                  className="bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white font-bold text-sm px-6 py-3 rounded-xl border-none cursor-pointer shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] transition-all duration-200"
                >
                  Register as Seller →
                </button>
                <button
                  onClick={() => navigate("/vendor/login")}
                  className="bg-transparent text-white font-semibold text-sm px-6 py-3 rounded-xl border border-white/30 cursor-pointer hover:bg-white/10 transition-all"
                >
                  Seller Login
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
