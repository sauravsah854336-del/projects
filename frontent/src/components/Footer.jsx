import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const Footer = () => {
  const { user } = useSelector((state) => state.auth);
  const currentYear = new Date().getFullYear();

  const isCustomer = user?.role === "customer";
  const isVendor = user?.role === "vendor";
  const isAdmin = user?.role === "admin";

  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const checkScrollable = () => {
      const scrolled = window.scrollY > 400;
      const pageIsLongEnough = document.documentElement.scrollHeight > window.innerHeight + 300;
      setShowBackToTop(scrolled && pageIsLongEnough);
    };

    checkScrollable();
    window.addEventListener("scroll", checkScrollable, { passive: true });
    window.addEventListener("resize", checkScrollable);

    return () => {
      window.removeEventListener("scroll", checkScrollable);
      window.removeEventListener("resize", checkScrollable);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="mt-auto">

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="w-full bg-[#1E3A8A] hover:bg-[#2563EB] text-white text-sm font-semibold py-3.5 border-none cursor-pointer transition-colors font-[inherit]"
        >
          Back to top ↑
        </button>
      )}

      <div className="bg-gradient-to-b from-[#0F172A] to-[#0A0F1A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <div className="py-10 sm:py-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-6 border-b border-white/10">
            <div>
              <h4 className="text-sm font-extrabold text-white mb-4">Get to Know Us</h4>
              <ul className="space-y-2.5 list-none p-0 m-0">
                <li><Link to="/about" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Contact Us</Link></li>
                <li><Link to="/policy/terms" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Terms of Service</Link></li>
                <li><Link to="/policy/privacy" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Privacy Policy</Link></li>
                <li><Link to="/policy/cookies" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-white mb-4">Shop With Us</h4>
              <ul className="space-y-2.5 list-none p-0 m-0">
                <li><Link to="/products" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">All Products</Link></li>
                <li><Link to="/categories" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">All Categories</Link></li>
                <li><Link to="/products?filterType=latest" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">New Arrivals</Link></li>
                <li><Link to="/products?filterType=bestSeller" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Best Sellers</Link></li>
                <li><Link to="/products?filterType=discount" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Today's Deals</Link></li>
              </ul>
            </div>

            {(isCustomer || !user) && (
              <div>
                <h4 className="text-sm font-extrabold text-white mb-4">Your Account</h4>
                <ul className="space-y-2.5 list-none p-0 m-0">
                  {user ? (
                    <>
                      <li><Link to="/orders" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Your Orders</Link></li>
                      <li><Link to="/wishlist" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Your Wishlist</Link></li>
                      <li><Link to="/cart" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Your Cart</Link></li>
                      <li><Link to="/profile" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Your Profile</Link></li>
                    </>
                  ) : (
                    <>
                      <li><Link to="/login" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Sign In</Link></li>
                      <li><Link to="/signup" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Create Account</Link></li>
                      <li><Link to="/cart" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Your Cart</Link></li>
                      <li><Link to="/wishlist" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Your Wishlist</Link></li>
                    </>
                  )}
                </ul>
              </div>
            )}

            {isVendor && (
              <div>
                <h4 className="text-sm font-extrabold text-white mb-4">Seller Dashboard</h4>
                <ul className="space-y-2.5 list-none p-0 m-0">
                  <li><Link to="/vendor/dashboard" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Dashboard</Link></li>
                  <li><Link to="/vendor/dashboard?tab=products" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">My Products</Link></li>
                  <li><Link to="/vendor/dashboard?tab=orders" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Orders</Link></li>
                  <li><Link to="/vendor/profile" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Store Profile</Link></li>
                </ul>
              </div>
            )}

            {isAdmin && (
              <div>
                <h4 className="text-sm font-extrabold text-white mb-4">Admin Panel</h4>
                <ul className="space-y-2.5 list-none p-0 m-0">
                  <li><Link to="/admin/dashboard" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Dashboard</Link></li>
                  <li><Link to="/admin/dashboard?tab=vendors" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Vendors</Link></li>
                  <li><Link to="/admin/dashboard?tab=products" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Products</Link></li>
                  <li><Link to="/admin/dashboard?tab=orders" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Orders</Link></li>
                </ul>
              </div>
            )}

            <div>
              <h4 className="text-sm font-extrabold text-white mb-4">Help & Support</h4>
              <ul className="space-y-2.5 list-none p-0 m-0">
                <li><Link to="/help" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Help Center</Link></li>
                <li><Link to="/policy/shipping-info" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Shipping Info</Link></li>
                <li><Link to="/policy/returns" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Returns & Refunds</Link></li>
                <li><Link to="/policy/payment-pricing" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Payment Info</Link></li>
                <li><Link to="/policy/grievance" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Grievance Redressal</Link></li>
              </ul>
            </div>

            {!isVendor && !isAdmin && (
              <div>
                <h4 className="text-sm font-extrabold text-white mb-4">Sell on E-Commerce</h4>
                <ul className="space-y-2.5 list-none p-0 m-0">
                  <li><Link to="/vendor/signup" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Start Selling</Link></li>
                  <li><Link to="/vendor/login" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Seller Login</Link></li>
                  <li><Link to="/policy/seller-guidelines" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Seller Guidelines</Link></li>
                  <li><Link to="/policy/commission-policy" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Commission Rates</Link></li>
                  <li><Link to="/policy/vendor-agreement" className="text-blue-200/70 text-[13px] no-underline hover:text-white hover:underline transition-colors">Seller Agreement</Link></li>
                </ul>
              </div>
            )}
          </div>

          <div className="py-8 border-b border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg shadow-blue-500/30">
                  E
                </div>
                <div>
                  <p className="text-base font-black text-white m-0">E<span className="text-blue-400">·</span>Commerce</p>
                  <p className="text-[10px] text-blue-300/50 m-0 uppercase tracking-wider font-bold">Multi-Vendor Marketplace</p>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap justify-center">
                <p className="text-[11px] text-blue-200/50 font-bold uppercase tracking-wider m-0">Connect with us</p>
                <div className="flex gap-2">
                  {[
                    { href: "https://facebook.com", label: "Facebook", path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
                    { href: "https://twitter.com", label: "Twitter", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                    { href: "https://instagram.com", label: "Instagram", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
                    { href: "https://youtube.com", label: "YouTube", path: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
                  ].map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={social.label}
                      className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center no-underline transition-all duration-200 hover:bg-blue-500 hover:border-blue-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30"
                    >
                      <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                        <path d={social.path} />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="py-8 border-b border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-wrap justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-blue-200/50 font-bold uppercase tracking-wider">We Accept</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {["💳 Cards", "📱 UPI", "🏦 NetBanking", "💵 COD", "👛 Wallets"].map((method) => (
                    <span
                      key={method}
                      className="text-[10px] font-bold text-blue-200/60 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_#22C55E]" />
                  <span className="text-[10px] font-bold text-green-400">Secure & Encrypted</span>
                </div>
              </div>
            </div>
          </div>

          <div className="py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-blue-300/40 text-xs m-0 text-center sm:text-left">
              © {currentYear} <span className="text-white/70 font-semibold">E-Commerce</span> by Quleep Technologies. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-4 items-center justify-center">
              {[
                { to: "/policy/terms", label: "Terms" },
                { to: "/policy/privacy", label: "Privacy" },
                { to: "/policy/cookies", label: "Cookies" },
                { to: "/policy/accessibility", label: "Accessibility" },
                { to: "/policy/grievance", label: "Grievance" },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="text-blue-300/40 text-[11px] font-semibold no-underline hover:text-blue-300 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;