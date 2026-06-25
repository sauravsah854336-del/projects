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
  furniture: "🛋️", electronics: "📱", fashion: "👕", "home decor": "🏠",
  sports: "⚽", books: "📚", beauty: "💄", kitchen: "🍳", clothing: "👔",
  accessories: "⌚", toys: "🧸", health: "💊", grocery: "🛒",
  automotive: "🚗", garden: "🌿", office: "💼",
};

const ProductCard = ({ product, canShop, loading, isAdded, onAddToCart, onBuyNow, size = "normal" }) => {
  const [imgError, setImgError] = useState(false);
  const discount = product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-200 hover:border-[#D85A30]/40 hover:shadow-xl hover:shadow-orange-500/8 hover:-translate-y-0.5 no-underline"
    >
      {/* Image */}
      <div className="relative w-full bg-gray-50 overflow-hidden" style={{ paddingBottom: "100%" }}>
        <img
          src={imgError ? PLACEHOLDER_MEDIUM : (product.images?.[0]?.url || PLACEHOLDER_MEDIUM)}
          alt={product.name}
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isFeatured && size === "featured" && (
            <span className="bg-gray-900 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-sm">
              ⭐ Featured
            </span>
          )}
          {discount > 0 && (
            <span className="bg-[#D85A30] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md shadow-sm">
              -{discount}%
            </span>
          )}
        </div>

        {/* Out of stock overlay */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-gray-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-full">
              Out of Stock
            </span>
          </div>
        )}

        {/* Low stock */}
        {product.stock > 0 && product.stock <= 5 && (
          <div className="absolute bottom-2 left-2">
            <span className="bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              Only {product.stock} left
            </span>
          </div>
        )}

        {/* Wishlist */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
          <WishlistButton product={product} size="sm" />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3">
        <p className="text-[10px] text-gray-400 mb-1 truncate">
          {product.vendorStore?.storeName || "Vendor"}
          {product.category?.name && <span> · {product.category.name}</span>}
        </p>

        <h3 className="text-[12px] sm:text-[13px] font-medium text-gray-800 mb-1.5 line-clamp-2 leading-snug flex-1">
          {product.name}
        </h3>

        {product.averageRating > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={`text-[10px] ${s <= Math.round(product.averageRating) ? "text-yellow-400" : "text-gray-200"}`}>★</span>
              ))}
            </div>
            <span className="text-[10px] text-gray-400">({product.totalReviews || 0})</span>
          </div>
        )}

        <div className="flex items-baseline gap-1.5 mb-2.5">
          <span className="text-sm sm:text-base font-extrabold text-[#B12704]">
            {formatRupee(product.price)}
          </span>
          {product.comparePrice > product.price && (
            <span className="text-[10px] text-gray-400 line-through">
              {formatRupee(product.comparePrice)}
            </span>
          )}
        </div>

        {canShop && product.stock > 0 && (
          <div className="flex gap-1.5 mt-auto">
            <button
              onClick={(e) => onAddToCart(e, product)}
              disabled={loading === "cart"}
              className={`flex-1 text-[10px] sm:text-[11px] font-bold py-1.5 sm:py-2 rounded-lg border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isAdded
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 border-yellow-400 hover:brightness-95"
              }`}
            >
              {loading === "cart" ? (
                <span className="flex items-center justify-center gap-1">
                  <span className="w-2.5 h-2.5 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
                </span>
              ) : isAdded ? "✓ Added" : "Add to Cart"}
            </button>
            <button
              onClick={(e) => onBuyNow(e, product)}
              disabled={loading === "buy"}
              className="flex-1 bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white text-[10px] sm:text-[11px] font-bold py-1.5 sm:py-2 rounded-lg border-none cursor-pointer transition-all hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === "buy" ? (
                <span className="flex items-center justify-center gap-1">
                  <span className="w-2.5 h-2.5 border-[1.5px] border-white border-t-transparent rounded-full animate-spin" />
                </span>
              ) : "Buy Now"}
            </button>
          </div>
        )}

        {product.stock <= 0 && canShop && (
          <button disabled className="w-full py-1.5 sm:py-2 rounded-lg text-[11px] font-bold bg-gray-100 text-gray-400 border-none cursor-not-allowed mt-auto">
            Out of Stock
          </button>
        )}
      </div>
    </Link>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="w-full bg-gray-200" style={{ paddingBottom: "100%" }} />
    <div className="p-3 space-y-2">
      <div className="h-2.5 bg-gray-200 rounded-full w-1/2" />
      <div className="h-3 bg-gray-200 rounded-full w-4/5" />
      <div className="h-3 bg-gray-200 rounded-full w-3/5" />
      <div className="h-4 bg-gray-200 rounded-full w-2/5" />
      <div className="h-7 bg-gray-100 rounded-lg" />
    </div>
  </div>
);

const SectionHeader = ({ icon, title, subtitle, link, linkLabel }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-6">
    <div>
      {icon && (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg sm:text-xl">{icon}</span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">{title}</h2>
        </div>
      )}
      {!icon && <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-1">{title}</h2>}
      {subtitle && <p className="text-gray-500 text-xs sm:text-sm">{subtitle}</p>}
    </div>
    {link && (
      <Link to={link} className="text-xs sm:text-sm font-semibold text-[#D85A30] border border-[#D85A30]/40 bg-orange-50 px-4 py-1.5 rounded-full no-underline hover:bg-[#D85A30] hover:text-white transition-all shrink-0">
        {linkLabel} →
      </Link>
    )}
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { addItem } = useCart();
  const [addedProducts, setAddedProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState({});

  const { data: productsData, isLoading: productsLoading } = useGetAllProductsQuery({ limit: 16, sort: "newest" });
  const { data: categoryData } = useGetCategoryTreeQuery();

  const isCustomer = user?.role === "customer";
  const canShop = !user || isCustomer;
  const categories = categoryData?.data || [];
  const products = productsData?.data || [];
  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 4);
  const latestProducts = products.slice(0, 16);

  const handleAddToCart = async (e, product) => {
    e.preventDefault(); e.stopPropagation();
    if (user && !isCustomer) return;
    setLoadingProducts((p) => ({ ...p, [product._id]: "cart" }));
    try {
      await addItem(product, 1);
      setAddedProducts((prev) => ({ ...prev, [product._id]: true }));
      toast.success("Added to cart!");
      setTimeout(() => setAddedProducts((prev) => ({ ...prev, [product._id]: false })), 2000);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to add to cart");
    } finally {
      setLoadingProducts((p) => ({ ...p, [product._id]: null }));
    }
  };

  const handleBuyNow = async (e, product) => {
    e.preventDefault(); e.stopPropagation();
    if (user && !isCustomer) return;
    setLoadingProducts((p) => ({ ...p, [product._id]: "buy" }));
    try {
      await addItem(product, 1);
      if (!user) navigate("/login?redirect=/checkout");
      else navigate("/checkout");
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to add to cart");
      setLoadingProducts((p) => ({ ...p, [product._id]: null }));
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ─── CATEGORIES ─── */}
      {categories.length > 0 && (
        <section className="bg-white py-8 sm:py-10 px-4 sm:px-6 border-b border-gray-100">
          <div className="max-w-7xl mx-auto">
            <SectionHeader title="Shop by Category" subtitle="Browse products across all departments" link="/products" linkLabel="View All" />
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  onClick={() => navigate(`/products?category=${cat._id}`)}
                  className="group flex flex-col items-center gap-2 p-2.5 sm:p-3 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-orange-50 hover:border-[#D85A30]/30 hover:-translate-y-0.5 hover:shadow-md hover:shadow-orange-500/10"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-sm group-hover:scale-110 transition-transform duration-200">
                    {categoryIcons[cat.name.toLowerCase()] || "📦"}
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-bold text-gray-700 text-center leading-tight group-hover:text-[#D85A30] transition-colors">
                    {cat.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── FEATURED ─── */}
      {featuredProducts.length > 0 && (
        <section className="py-8 sm:py-10 px-4 sm:px-6 bg-gradient-to-b from-orange-50/60 to-white">
          <div className="max-w-7xl mx-auto">
            <SectionHeader icon="⭐" title="Featured Products" subtitle="Handpicked by our team" link="/products?sort=popular" linkLabel="See All" />
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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

      {/* ─── LATEST ─── */}
      <section className="py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader icon="🆕" title="Latest Products" subtitle="Fresh arrivals from verified vendors" link="/products" linkLabel="See All" />

          {productsLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3.5">
              {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!productsLoading && latestProducts.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <p className="text-5xl mb-4">📦</p>
              <p className="text-base font-bold text-gray-900">No products yet</p>
              <p className="text-sm text-gray-400 mt-1">Check back soon for new arrivals</p>
            </div>
          )}

          {!productsLoading && latestProducts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3.5">
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
          )}
        </div>
      </section>

      {/* ─── TRUST BADGES ─── */}
      <section className="py-8 sm:py-10 px-4 sm:px-6 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 text-center mb-1">Why Shop With Us?</h2>
          <p className="text-gray-400 text-xs sm:text-sm text-center mb-8">Trusted by thousands of customers across India</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[
              { icon: "🚚", title: "Free Delivery", desc: "On orders above ₹499", color: "from-blue-50 to-blue-50/50 border-blue-100 hover:border-blue-300" },
              { icon: "🔄", title: "Easy Returns", desc: "10-day hassle-free", color: "from-green-50 to-green-50/50 border-green-100 hover:border-green-300" },
              { icon: "🛡️", title: "Secure Payments", desc: "100% safe & encrypted", color: "from-purple-50 to-purple-50/50 border-purple-100 hover:border-purple-300" },
              { icon: "✅", title: "Verified Vendors", desc: "Manually approved", color: "from-orange-50 to-orange-50/50 border-orange-100 hover:border-orange-300" },
              { icon: "💬", title: "24/7 Support", desc: "Always here to help", color: "from-pink-50 to-pink-50/50 border-pink-100 hover:border-pink-300" },
            ].map((item) => (
              <div key={item.title} className={`bg-gradient-to-br ${item.color} border rounded-2xl p-4 sm:p-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
                <div className="text-3xl sm:text-4xl mb-3">{item.icon}</div>
                <p className="font-bold text-sm text-gray-900 mb-1">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VENDOR BANNER ─── */}
      {canShop && (
        <section className="py-8 sm:py-10 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-7 sm:p-10 lg:p-12 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D85A30]/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="max-w-lg">
                  <div className="inline-flex items-center gap-2 bg-[#D85A30]/20 border border-[#D85A30]/30 rounded-full px-3.5 py-1 mb-4">
                    <span className="w-1.5 h-1.5 bg-[#D85A30] rounded-full" />
                    <span className="text-[#FF8C5A] text-xs font-bold">FOR SELLERS</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 leading-tight">
                    Start Selling Today
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Join hundreds of vendors already selling on our platform. Setup your store in minutes and reach thousands of customers.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 shrink-0">
                  <button
                    onClick={() => navigate("/vendor/signup")}
                    className="bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white font-bold text-sm px-6 py-3 rounded-xl border-none cursor-pointer shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] transition-all duration-200 font-[inherit]"
                  >
                    Register as Seller →
                  </button>
                  <button
                    onClick={() => navigate("/vendor/login")}
                    className="bg-white/8 text-white font-semibold text-sm px-6 py-3 rounded-xl border border-white/20 cursor-pointer hover:bg-white/15 transition-all font-[inherit]"
                  >
                    Seller Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;