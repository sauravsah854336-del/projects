import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const Footer = () => {
  const { user } = useSelector((state) => state.auth);
  const currentYear = new Date().getFullYear();

  return (
    <>
      <style>{`
        .footer-root {
          background: #0D0E12;
          color: white;
        }
        .footer-glow {
          background: radial-gradient(ellipse 80% 40% at 50% -10%, rgba(216,90,48,0.12) 0%, transparent 70%);
        }
        .footer-link {
          color: #9CA3AF;
          text-decoration: none;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: color 0.15s ease, gap 0.15s ease;
        }
        .footer-link:hover { color: #D85A30; gap: 12px; }
        .footer-link .arrow { opacity: 0; transform: translateX(-4px); transition: all 0.15s ease; }
        .footer-link:hover .arrow { opacity: 1; transform: translateX(0); }
        .social-btn {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .social-btn:hover {
          background: #D85A30;
          border-color: #D85A30;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(216,90,48,0.35);
        }
        .footer-section-title {
          color: white;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .footer-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }
        .newsletter-input {
          flex: 1;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 11px 16px;
          font-size: 13px;
          color: white;
          outline: none;
          transition: border-color 0.2s;
        }
        .newsletter-input::placeholder { color: #6B7280; }
        .newsletter-input:focus { border-color: rgba(216,90,48,0.5); }
        .newsletter-btn {
          background: linear-gradient(135deg, #D85A30, #FF8C5A);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 11px 20px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(216,90,48,0.35);
          transition: all 0.2s ease;
          letter-spacing: 0.02em;
        }
        .newsletter-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(216,90,48,0.5); }
        .payment-chip {
          border-radius: 8px;
          padding: 6px 14px;
          border: 1px solid rgba(255,255,255,0.07);
          font-size: 12px;
          font-weight: 500;
          color: #D1D5DB;
          letter-spacing: 0.01em;
        }
        .contact-icon-wrap {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: rgba(216,90,48,0.1);
          border: 1px solid rgba(216,90,48,0.15);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .divider { height: 1px; background: rgba(255,255,255,0.05); }
        .logo-footer {
          background: linear-gradient(135deg, #D85A30 0%, #FF8C5A 100%);
          box-shadow: 0 4px 14px rgba(216,90,48,0.3);
        }
      `}</style>

      <footer className="footer-root mt-auto relative">
        <div className="footer-glow absolute inset-0 pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">

          {/* Main grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 py-16">

            {/* Brand column */}
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-2.5 no-underline mb-5 group w-fit">
                <span className="logo-footer w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-[13px] tracking-widest">E</span>
                <span className="font-black text-[18px] tracking-tight text-white">
                  E<span style={{color:'#D85A30'}}>·</span>Commerce
                </span>
              </Link>

              <p className="text-gray-400 text-[13px] leading-relaxed max-w-xs mb-6" style={{lineHeight:'1.7'}}>
                Your trusted multi-vendor marketplace. Shop from verified sellers,
                compare prices, and enjoy a seamless shopping experience with
                secure payments and fast delivery.
              </p>

              <div className="flex gap-2.5">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-btn">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-btn">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-btn">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-btn">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-btn">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="footer-section-title">Quick Links</h4>
              <ul className="space-y-2.5">
                {[
                  { to: "/", label: "Home" },
                  { to: "/products", label: "All Products" },
                  { to: "/about", label: "About Us" },
                  { to: "/contact", label: "Contact Us" },
                  ...(!user || user.role === "customer" ? [
                    { to: "/cart", label: "My Cart" },
                    { to: "/orders", label: "My Orders" },
                  ] : []),
                  ...(!user ? [
                    { to: "/login", label: "Login" },
                    { to: "/signup", label: "Sign Up" },
                  ] : []),
                ].map((item) => (
                  <li key={item.to + item.label}>
                    <Link to={item.to} className="footer-link">
                      <svg className="arrow w-3 h-3 text-[#D85A30] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Sellers */}
            <div>
              <h4 className="footer-section-title">For Sellers</h4>
              <ul className="space-y-2.5">
                {[
                  { to: "/vendor/signup", label: "Become a Vendor" },
                  { to: "/vendor/login", label: "Vendor Login" },
                  { to: "/policy/seller-guidelines", label: "Seller Guidelines" },
                  { to: "/policy/commission-policy", label: "Commission Policy" },
                ].map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="footer-link">
                      <svg className="arrow w-3 h-3 text-[#D85A30] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="footer-section-title">Support</h4>
              <ul className="space-y-2.5">
                {[
                  { to: "/help", label: "Help Center" },
                  { to: "/policy/shipping-info", label: "Shipping Info" },
                  { to: "/policy/returns", label: "Returns & Refunds" },
                  { to: "/policy/privacy", label: "Privacy Policy" },
                  { to: "/policy/terms", label: "Terms of Service" },
                ].map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="footer-link">
                      <svg className="arrow w-3 h-3 text-[#D85A30] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="divider"></div>

          {/* Contact + Newsletter */}
          <div className="py-10 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h4 className="footer-section-title">Contact Us</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="contact-icon-wrap">
                    <svg className="w-3.5 h-3.5 text-[#D85A30]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[11px] mb-0.5 uppercase tracking-wider">Email</p>
                    <a href="mailto:info@quleep.in" className="text-gray-300 text-[13px] no-underline hover:text-[#D85A30] transition-colors">info@quleep.in</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="contact-icon-wrap">
                    <svg className="w-3.5 h-3.5 text-[#D85A30]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[11px] mb-0.5 uppercase tracking-wider">Phone</p>
                    <a href="tel:+919883019518" className="text-gray-300 text-[13px] no-underline hover:text-[#D85A30] transition-colors">+91 98830 19518</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="contact-icon-wrap">
                    <svg className="w-3.5 h-3.5 text-[#D85A30]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[11px] mb-0.5 uppercase tracking-wider">Office</p>
                    <p className="text-gray-300 text-[13px]" style={{lineHeight:'1.6'}}>
                      Bhutani Alphathum, 1432 B-Wing,<br />
                      Sector 90, Noida – 201305
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="footer-section-title">Newsletter</h4>
              <p className="text-gray-400 text-[13px] mb-4" style={{lineHeight:'1.65'}}>
                Subscribe to get updates on new products, deals and exclusive offers.
              </p>
              <div className="flex gap-2">
                <input type="email" placeholder="your@email.com" className="newsletter-input" />
                <button className="newsletter-btn">Subscribe</button>
              </div>
              <p className="text-gray-500 text-[11px] mt-3" style={{lineHeight:'1.6'}}>
                By subscribing, you agree to our{" "}
                <Link to="/policy/privacy" className="text-[#D85A30] no-underline hover:underline">Privacy Policy</Link>
                {" "}and{" "}
                <Link to="/policy/terms" className="text-[#D85A30] no-underline hover:underline">Terms of Service</Link>.
              </p>
            </div>
          </div>

          <div className="divider"></div>

          {/* Payment methods */}
          <div className="py-7">
            <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold mb-4">We Accept</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Visa", bg: "rgba(37,99,235,0.12)" },
                { name: "Mastercard", bg: "rgba(220,38,38,0.12)" },
                { name: "UPI", bg: "rgba(22,163,74,0.12)" },
                { name: "Net Banking", bg: "rgba(147,51,234,0.12)" },
                { name: "Cash on Delivery", bg: "rgba(234,179,8,0.12)" },
                { name: "Wallet", bg: "rgba(6,182,212,0.12)" },
              ].map((payment) => (
                <div key={payment.name} className="payment-chip" style={{background: payment.bg}}>
                  {payment.name}
                </div>
              ))}
            </div>
          </div>

          <div className="divider"></div>

          {/* Bottom bar */}
          <div className="py-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-[12px]">
              © {currentYear} E-Commerce. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-5">
              {[
                { to: "/policy/privacy", label: "Privacy" },
                { to: "/policy/terms", label: "Terms" },
                { to: "/contact", label: "Contact" },
                { to: "/help", label: "Help" },
              ].map((item) => (
                <Link key={item.to} to={item.to} className="text-gray-500 text-[12px] hover:text-gray-300 no-underline transition-colors duration-150">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </footer>
    </>
  );
};

export default Footer;