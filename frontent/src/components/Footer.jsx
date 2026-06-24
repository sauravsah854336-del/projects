import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState } from "react";

const FooterLink = ({ to, children }) => (
  <li>
    <Link
      to={to}
      className="group flex items-center gap-2 text-gray-400 text-[13px] no-underline py-0.5 transition-all duration-150 hover:text-[#FF8C5A] hover:gap-3 hover:translate-x-0.5"
    >
      <svg
        className="w-3 h-3 text-[#FF8C5A] shrink-0 opacity-0 -translate-x-1.5 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
      </svg>
      {children}
    </Link>
  </li>
);

const SectionTitle = ({ children }) => (
  <h4 className="text-white text-[11px] font-extrabold uppercase tracking-[0.12em] mb-5 flex items-center gap-2 before:content-[''] before:w-[3px] before:h-3.5 before:bg-gradient-to-b before:from-[#D85A30] before:to-[#FF8C5A] before:rounded-full">
    {children}
  </h4>
);

const ContactItem = ({ href, icon, label, value, isLink = true }) => {
  const Wrapper = isLink ? "a" : "div";
  const wrapperProps = isLink ? { href, target: href?.startsWith("http") ? "_blank" : undefined, rel: href?.startsWith("http") ? "noopener noreferrer" : undefined } : {};

  return (
    <Wrapper {...wrapperProps} className="flex items-start gap-3 no-underline">
      <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#D85A30]/15 to-[#D85A30]/5 border border-[#D85A30]/20 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.08em] mb-0.5">{label}</p>
        <p className="text-[13px] text-gray-300 font-semibold m-0 leading-relaxed">{value}</p>
      </div>
    </Wrapper>
  );
};

const SocialBtn = ({ href, title, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    title={title}
    className="w-[38px] h-[38px] rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center no-underline transition-all duration-200 hover:bg-gradient-to-br hover:from-[#D85A30] hover:to-[#FF8C5A] hover:border-transparent hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/40"
  >
    {children}
  </a>
);

const CtaBanner = ({ gradient, badge, title, subtitle, primaryLink, primaryLabel, primaryColor, secondaryLink, secondaryLabel }) => (
  <div className={`${gradient} rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 mb-12 sm:mb-14 -mt-8 sm:-mt-10 relative z-[2] shadow-2xl overflow-hidden`}>
    <div className="absolute -top-1/2 -right-[10%] w-48 h-48 bg-white/15 rounded-full blur-[40px] pointer-events-none" />
    <div className="absolute -bottom-1/2 -left-[10%] w-44 h-44 bg-white/10 rounded-full blur-[40px] pointer-events-none" />
    <div className="relative z-[1]">
      <p className="text-[11px] font-extrabold text-white/85 uppercase tracking-[0.1em] mb-1.5">{badge}</p>
      <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mb-1.5">{title}</h3>
      <p className="text-[13px] text-white/85 m-0">{subtitle}</p>
    </div>
    <div className="flex flex-wrap gap-2.5 relative z-[1]">
      <Link to={primaryLink} className={`bg-white ${primaryColor} no-underline px-5 sm:px-7 py-3 rounded-xl text-sm font-extrabold shadow-lg shadow-black/20`}>
        {primaryLabel}
      </Link>
      <Link to={secondaryLink} className="bg-black/20 text-white no-underline px-5 sm:px-7 py-3 rounded-xl text-sm font-bold border border-white/20">
        {secondaryLabel}
      </Link>
    </div>
  </div>
);

const Footer = () => {
  const { user } = useSelector((state) => state.auth);
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const isCustomer = user?.role === "customer";
  const isVendor = user?.role === "vendor";
  const isAdmin = user?.role === "admin";
  const isGuest = !user;

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setSubscribed(true);
    setTimeout(() => { setSubscribed(false); setEmail(""); }, 3000);
  };

  return (
    <footer className="bg-[#0A0B0F] text-white relative overflow-hidden mt-auto">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute -top-24 left-[10%] w-96 h-48 bg-[radial-gradient(ellipse,rgba(216,90,48,0.15),transparent_70%)] pointer-events-none" />
      <div className="absolute -top-12 right-[10%] w-80 h-48 bg-[radial-gradient(ellipse,rgba(124,58,237,0.1),transparent_70%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-14 sm:pt-16">

        {isGuest && (
          <CtaBanner
            gradient="bg-gradient-to-r from-[#D85A30] via-[#FF8C5A] to-[#D85A30]"
            badge="🎉 Join Our Community"
            title="Get ₹100 OFF on your first order!"
            subtitle="Sign up today and start shopping with exclusive discounts"
            primaryLink="/signup" primaryLabel="Sign Up Free" primaryColor="text-[#D85A30]"
            secondaryLink="/login" secondaryLabel="Login"
          />
        )}

        {isCustomer && (
          <CtaBanner
            gradient="bg-gradient-to-r from-green-800 via-green-500 to-green-800"
            badge={`🎁 Member Benefits`}
            title={`Welcome back, ${user.firstName}!`}
            subtitle="Continue shopping or check your orders and wishlist"
            primaryLink="/products" primaryLabel="🛍️ Shop Now" primaryColor="text-green-800"
            secondaryLink="/orders" secondaryLabel="📦 My Orders"
          />
        )}

        {isVendor && (
          <CtaBanner
            gradient="bg-gradient-to-r from-indigo-900 via-indigo-700 to-indigo-900"
            badge="🏪 Vendor Tools"
            title="Manage your store efficiently"
            subtitle="Add products, track orders, view reviews and grow your business"
            primaryLink="/vendor/dashboard?tab=products" primaryLabel="+ Add Product" primaryColor="text-indigo-900"
            secondaryLink="/vendor/dashboard" secondaryLabel="View Dashboard"
          />
        )}

        {isAdmin && (
          <CtaBanner
            gradient="bg-gradient-to-r from-red-900 via-red-700 to-red-900"
            badge="👑 Admin Control"
            title="Platform management center"
            subtitle="Approve vendors, moderate products and manage the marketplace"
            primaryLink="/admin/dashboard?tab=vendors" primaryLabel="Manage Vendors" primaryColor="text-red-900"
            secondaryLink="/admin/dashboard" secondaryLabel="View Dashboard"
          />
        )}

        {!isAdmin && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10 sm:mb-12">
            {[
              { icon: "🚚", title: "Free Delivery", desc: "On orders above ₹499" },
              { icon: "🔄", title: "Easy Returns", desc: "10-day return policy" },
              { icon: "🛡️", title: "Secure Payments", desc: "100% encrypted" },
              { icon: "✅", title: "Verified Sellers", desc: "Manually approved" },
            ].map((b) => (
              <div key={b.title} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3.5 sm:p-4 flex items-center gap-3 hover:bg-white/[0.06] hover:border-[#D85A30]/20 transition-all duration-200">
                <span className="text-xl sm:text-2xl">{b.icon}</span>
                <div>
                  <p className="text-xs sm:text-[13px] font-extrabold text-white m-0">{b.title}</p>
                  <p className="text-[10px] sm:text-[11px] text-gray-400 m-0 mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 pb-10 sm:pb-12">

          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 no-underline mb-5 group w-fit">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D85A30] to-[#FF8C5A] flex items-center justify-center text-white font-black text-sm tracking-widest shadow-lg shadow-orange-500/30">
                E
              </span>
              <div>
                <p className="text-lg font-black text-white m-0 tracking-tight">
                  E<span className="text-[#D85A30]">·</span>Commerce
                </p>
                <p className="text-[10px] text-gray-500 m-0 uppercase tracking-[0.1em] font-bold">
                  Multi-Vendor Marketplace
                </p>
              </div>
            </Link>

            <p className="text-gray-400 text-[13px] leading-relaxed max-w-xs mb-5">
              Your trusted multi-vendor marketplace. Shop from verified sellers, compare prices, and enjoy seamless shopping with secure payments.
            </p>

            {user && (
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3.5 flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D85A30] to-[#FF8C5A] flex items-center justify-center text-white font-black text-sm shrink-0 overflow-hidden shadow-md shadow-orange-500/20">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    user.firstName?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-extrabold m-0 truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-[10px] text-gray-400 m-0 mt-0.5 capitalize">{user.role} Account</p>
                </div>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                  isAdmin ? "bg-red-500/15 text-red-300" : isVendor ? "bg-purple-500/15 text-purple-300" : "bg-green-500/15 text-green-300"
                }`}>
                  Active
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <SocialBtn href="https://facebook.com" title="Facebook">
                <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </SocialBtn>
              <SocialBtn href="https://twitter.com" title="Twitter">
                <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </SocialBtn>
              <SocialBtn href="https://instagram.com" title="Instagram">
                <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
              </SocialBtn>
              <SocialBtn href="https://linkedin.com" title="LinkedIn">
                <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </SocialBtn>
              <SocialBtn href="https://youtube.com" title="YouTube">
                <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </SocialBtn>
            </div>
          </div>

          {isCustomer && (
            <>
              <div>
                <SectionTitle>My Account</SectionTitle>
                <ul className="space-y-2.5 list-none p-0 m-0">
                  <FooterLink to="/dashboard">Dashboard</FooterLink>
                  <FooterLink to="/profile">Profile & Addresses</FooterLink>
                  <FooterLink to="/orders">My Orders</FooterLink>
                  <FooterLink to="/cart">My Cart</FooterLink>
                  <FooterLink to="/wishlist">Wishlist</FooterLink>
                </ul>
              </div>
              <div>
                <SectionTitle>Shop</SectionTitle>
                <ul className="space-y-2.5 list-none p-0 m-0">
                  <FooterLink to="/products">All Products</FooterLink>
                  <FooterLink to="/products?sort=newest">New Arrivals</FooterLink>
                  <FooterLink to="/products?sort=popular">Best Sellers</FooterLink>
                  <FooterLink to="/products?sort=rating">Top Rated</FooterLink>
                  <FooterLink to="/products?sort=price_low">Best Deals</FooterLink>
                </ul>
              </div>
            </>
          )}

          {isVendor && (
            <>
              <div>
                <SectionTitle>Vendor Panel</SectionTitle>
                <ul className="space-y-2.5 list-none p-0 m-0">
                  <FooterLink to="/vendor/dashboard">Dashboard</FooterLink>
                  <FooterLink to="/vendor/dashboard?tab=products">My Products</FooterLink>
                  <FooterLink to="/vendor/dashboard?tab=orders">Orders</FooterLink>
                  <FooterLink to="/vendor/dashboard?tab=reviews">Reviews</FooterLink>
                </ul>
              </div>
              <div>
                <SectionTitle>Seller Resources</SectionTitle>
                <ul className="space-y-2.5 list-none p-0 m-0">
                  <FooterLink to="/policy/seller-guidelines">Seller Guidelines</FooterLink>
                  <FooterLink to="/policy/commission-policy">Commission Policy</FooterLink>
                  <FooterLink to="/policy/vendor-agreement">Vendor Agreement</FooterLink>
                </ul>
              </div>
            </>
          )}

          {isAdmin && (
            <>
              <div>
                <SectionTitle>Management</SectionTitle>
                <ul className="space-y-2.5 list-none p-0 m-0">
                  <FooterLink to="/admin/dashboard">Dashboard</FooterLink>
                  <FooterLink to="/admin/dashboard?tab=vendors">Vendors</FooterLink>
                  <FooterLink to="/admin/dashboard?tab=categories">Categories</FooterLink>
                  <FooterLink to="/admin/dashboard?tab=products">Products</FooterLink>
                  <FooterLink to="/admin/dashboard?tab=orders">Orders</FooterLink>
                  <FooterLink to="/admin/dashboard?tab=reviews">Reviews</FooterLink>
                </ul>
              </div>
              <div>
                <SectionTitle>Quick Access</SectionTitle>
                <ul className="space-y-2.5 list-none p-0 m-0">
                  <FooterLink to="/">View Storefront</FooterLink>
                  <FooterLink to="/products">All Products</FooterLink>
                </ul>
              </div>
            </>
          )}

          {isGuest && (
            <>
              <div>
                <SectionTitle>Shop</SectionTitle>
                <ul className="space-y-2.5 list-none p-0 m-0">
                  <FooterLink to="/products">All Products</FooterLink>
                  <FooterLink to="/products?sort=newest">New Arrivals</FooterLink>
                  <FooterLink to="/products?sort=popular">Best Sellers</FooterLink>
                  <FooterLink to="/products?sort=rating">Top Rated</FooterLink>
                  <FooterLink to="/cart">My Cart</FooterLink>
                </ul>
              </div>
              <div>
                <SectionTitle>Get Started</SectionTitle>
                <ul className="space-y-2.5 list-none p-0 m-0">
                  <FooterLink to="/signup">Create Account</FooterLink>
                  <FooterLink to="/login">Sign In</FooterLink>
                  <FooterLink to="/vendor/signup">Become a Seller</FooterLink>
                  <FooterLink to="/vendor/login">Seller Login</FooterLink>
                </ul>
              </div>
            </>
          )}

          <div>
            <SectionTitle>Support</SectionTitle>
            <ul className="space-y-2.5 list-none p-0 m-0">
              <FooterLink to="/help">Help Center</FooterLink>
              <FooterLink to="/contact">Contact Us</FooterLink>
              <FooterLink to="/about">About Us</FooterLink>
              <FooterLink to="/policy/shipping-info">Shipping Info</FooterLink>
              <FooterLink to="/policy/returns">Returns & Refunds</FooterLink>
              <FooterLink to="/policy/privacy">Privacy Policy</FooterLink>
              <FooterLink to="/policy/terms">Terms of Service</FooterLink>
            </ul>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        <div className="py-10 sm:py-12 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
          <div>
            <SectionTitle>Get in Touch</SectionTitle>
            <div className="space-y-4">
              <ContactItem
                href="mailto:info@quleep.in"
                label="Email Us"
                value="info@quleep.in"
                icon={<svg width="16" height="16" fill="none" stroke="#FF8C5A" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              />
              <ContactItem
                href="tel:+919883019518"
                label="Call Us"
                value="+91 98830 19518"
                icon={<svg width="16" height="16" fill="none" stroke="#FF8C5A" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
              />
              <ContactItem
                isLink={false}
                label="Office"
                value={<>Bhutani Alphathum, 1432 B-Wing,<br />Sector 90, Noida – 201305</>}
                icon={<svg width="16" height="16" fill="none" stroke="#FF8C5A" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              />
              <ContactItem
                isLink={false}
                label="Working Hours"
                value="Mon-Sat: 9AM - 6PM IST"
                icon={<svg width="16" height="16" fill="none" stroke="#FF8C5A" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" /></svg>}
              />
            </div>
          </div>

          <div>
            <SectionTitle>
              {isVendor ? "Vendor Updates" : isAdmin ? "Platform Updates" : "Newsletter"}
            </SectionTitle>
            <p className="text-gray-400 text-[13px] leading-relaxed mb-4">
              {isVendor && "Get vendor announcements, policy updates, and seller tips."}
              {isAdmin && "Stay updated with platform metrics and system alerts."}
              {(isCustomer || isGuest) && "Subscribe to get updates on new products, deals, and offers."}
            </p>

            {subscribed ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3.5 flex items-center gap-2.5">
                <span className="text-xl">✅</span>
                <div>
                  <p className="text-[13px] font-extrabold text-green-300 m-0">Successfully subscribed!</p>
                  <p className="text-[11px] text-gray-400 m-0 mt-0.5">We'll keep you updated</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2 p-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xl">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent border-none px-3.5 py-2.5 text-[13px] text-white outline-none placeholder:text-gray-500 font-[inherit]"
                />
                <button
                  type="submit"
                  disabled={!email.trim()}
                  className="bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white border-none rounded-[10px] px-5 py-2.5 text-[13px] font-extrabold cursor-pointer shrink-0 shadow-lg shadow-orange-500/30 flex items-center gap-1.5 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-[inherit]"
                >
                  Subscribe
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </form>
            )}

            <p className="text-gray-500 text-[11px] mt-3 leading-relaxed">
              By subscribing, you agree to our{" "}
              <Link to="/policy/privacy" className="text-[#FF8C5A] no-underline font-semibold hover:underline">
                Privacy Policy
              </Link>. Unsubscribe anytime.
            </p>

            {(isCustomer || isGuest) && (
              <div className="mt-5 p-3.5 bg-[#D85A30]/[0.08] border border-[#D85A30]/20 rounded-xl flex items-center gap-3">
                <span className="text-xl">🎁</span>
                <div>
                  <p className="text-xs font-extrabold text-[#FF8C5A] m-0">First-time subscriber bonus</p>
                  <p className="text-[11px] text-gray-400 m-0 mt-0.5">Get ₹100 off coupon in your inbox</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        <div className="py-6 sm:py-7 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center sm:justify-start">
            <p className="text-gray-500 text-xs m-0">
              © {currentYear} <span className="text-white font-bold">E-Commerce</span>. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22C55E]" />
              <span className="text-[10px] font-bold text-green-300">All Systems Operational</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-5 items-center justify-center">
            {[
              { to: "/policy/privacy", label: "Privacy" },
              { to: "/policy/terms", label: "Terms" },
              { to: "/help", label: "Help" },
              { to: "/contact", label: "Contact" },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="text-gray-500 text-xs font-semibold no-underline hover:text-[#FF8C5A] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;