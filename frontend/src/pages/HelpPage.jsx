import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import PlatformLogo from "../assets/PlatformLogo.jpeg";

const helpCategories = [
  {
    id: "orders",
    title: "Orders & Tracking",
    icon: "📦",
    description: "Track orders, manage shipments, view history",
    questions: [
      { q: "How do I place an order?", a: "Browse the shop.design catalog, click 'Add to Cart' on items you like, proceed to checkout, fill in your shipping address, select your preferred payment method (COD or Online), and confirm your order. You'll receive an order confirmation email immediately." },
      { q: "How can I track my order?", a: "After logging in, go to 'My Orders' from your dashboard. You can see the real-time status of each order: Pending → Processing → Shipped → Out for Delivery → Delivered. You'll also receive email and SMS notifications at each stage." },
      { q: "Can I cancel my order?", a: "Yes! You can cancel your order if it's still in 'Pending' or 'Processing' status. Go to 'My Orders', find your order, and click 'Cancel Order'. The refund will be processed within 5-7 business days for prepaid orders." },
      { q: "Can I modify my order after placing it?", a: "Orders cannot be modified once placed. However, you can cancel the order (if not yet shipped) and place a new order with the correct details. For shipping address changes, please contact our support team immediately." },
      { q: "What if my order is delayed?", a: "We strive to deliver on time. If your order is delayed beyond the estimated delivery date, please contact the shop.design support team. We'll investigate immediately and keep you updated on the status." },
    ],
  },
  {
    id: "payments",
    title: "Payments & Pricing",
    icon: "💳",
    description: "Payment methods, refunds, billing",
    questions: [
      { q: "What payment methods are accepted?", a: "shop.design accepts multiple payment methods: UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, Mastercard, RuPay, Amex), Net Banking, and Digital Wallets. All online payments are secured by 256-bit SSL encryption via Cashfree." },
      { q: "Is my payment information secure?", a: "Absolutely! All payments are processed through PCI-DSS compliant payment gateways. We never store your card details on our servers. Your financial information is encrypted and protected at all times." },
      { q: "When will I be charged?", a: "For prepaid orders, payment is processed immediately upon order confirmation. For COD orders, you pay only when the order is delivered to you." },
      { q: "How do refunds work?", a: "shop.design operates a no-returns policy — all sales are final. However, if you receive a damaged or incorrect product, please contact us within 24 hours of delivery with photos. Such cases are reviewed individually and refunds (if approved) are processed within 5-7 business days." },
      { q: "Are there any hidden charges?", a: "No hidden charges! The price you see at checkout includes everything — product cost, GST, and shipping (if applicable). Free shipping is available on orders above ₹499." },
    ],
  },
  {
    id: "shipping",
    title: "Shipping & Delivery",
    icon: "🚚",
    description: "Delivery times, charges, locations",
    questions: [
      { q: "How long does delivery take?", a: "Standard delivery takes 3-7 business days depending on your location. Metro cities (Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad) typically receive orders within 3-4 days. Tier-2 and Tier-3 cities may take 5-7 days." },
      { q: "Is there free shipping?", a: "Yes! shop.design offers FREE shipping on all orders above ₹499. For orders below ₹499, a small delivery fee of ₹49 applies." },
      { q: "Do you deliver to my area?", a: "We deliver to over 25,000+ PIN codes across India. Enter your PIN code on the product page or at checkout to confirm delivery availability and estimated date." },
      { q: "Can I get same-day delivery?", a: "Same-day delivery is currently available in select metro cities for eligible products. Look for the 'Same Day Delivery' badge on product pages." },
      { q: "What if I'm not available to receive the order?", a: "Our delivery partner will make up to 3 delivery attempts. You can also reschedule the delivery or change the delivery address through the tracking link." },
    ],
  },
  {
    id: "returns",
    title: "Returns Policy",
    icon: "🚫",
    description: "No-returns policy explained",
    questions: [
      { q: "What is your return policy?", a: "shop.design operates a NO-RETURNS policy. All sales are final. We do not accept returns, refunds, or exchanges on purchased products. Please carefully review product details, images, and vendor information before placing an order." },
      { q: "Why does shop.design have a no-returns policy?", a: "As a curated multi-vendor design marketplace, we work directly with independent sellers who manage their own inventory. This policy helps us keep prices competitive, support small design businesses, and maintain fast order fulfillment across all categories." },
      { q: "What if I receive a damaged or wrong product?", a: "If you receive a damaged or completely different product, contact us within 24 hours of delivery at info@quleep.in with clear photos and your order number. These cases are reviewed individually and addressed at the platform's discretion." },
      { q: "Can I cancel my order?", a: "Yes! Orders can be cancelled BEFORE they are shipped. Once dispatched, cancellation is not possible. Go to My Orders → Select Order → Click Cancel Order. Prepaid amounts (if not yet processed) will not be charged." },
      { q: "What about product warranty?", a: "Some products come with a manufacturer's warranty. Warranty claims must be directed to the manufacturer using the details in the product package. shop.design is not responsible for handling warranty claims." },
    ],
  },
  {
    id: "account",
    title: "Account & Security",
    icon: "👤",
    description: "Login, password, profile, security",
    questions: [
      { q: "How do I create an account?", a: "Click 'Sign Up' at the top right corner. Fill in your details (name, email, phone, password) in the 2-step form. Verify your phone number and you're ready to shop on shop.design! It takes less than a minute." },
      { q: "I forgot my password. What should I do?", a: "Click 'Forgot Password' on the login page. Enter your registered email address and we'll send you a password reset OTP instantly. The OTP is valid for 10 minutes." },
      { q: "How do I update my profile?", a: "Login and go to 'My Profile' from the dashboard. You can update your name, phone, date of birth, profile photo, and manage your saved addresses. Email cannot be changed for security reasons." },
      { q: "How do I delete my account?", a: "We're sorry to see you go! Please contact our support team at info@quleep.in to request account deletion. We'll process your request within 7 business days, ensuring all your personal data is securely removed." },
      { q: "Is my data safe?", a: "Absolutely! shop.design uses industry-standard encryption (SSL/TLS) to protect your data. We never sell your information to third parties. Your password is hashed and never stored in plain text. Documents are stored securely on AWS S3." },
    ],
  },
  {
    id: "sellers",
    title: "Become a Seller",
    icon: "🏪",
    description: "Selling, vendor account, commission",
    questions: [
      { q: "How do I become a seller on shop.design?", a: "Click 'Become a Seller' on the homepage. Complete the 3-step registration: Business Info → Tax & Banking → Security. Upload required documents (PAN, GST, Cancelled Cheque). Approval takes 24-48 hours." },
      { q: "What documents do I need?", a: "Required: PAN Card, GST Certificate, Cancelled Cheque/Bank Passbook, Valid Bank Account. Optional: Business Registration Document. All documents should be clear and legible." },
      { q: "What is the commission structure?", a: "Commission varies by category: Electronics (8%), Fashion (12%), Furniture (10%), Books (6%), Beauty (15%), Home Decor (12%). View our complete Commission Policy for detailed information." },
      { q: "When do I get paid?", a: "Payments are settled every 7 days to your registered bank account. Minimum settlement amount is ₹100. You can view detailed earnings and reports in your Vendor Dashboard." },
    ],
  },
];

const categoryColors = [
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600", activeBg: "bg-blue-100", iconBg: "bg-blue-100", shadow: "shadow-blue-500/10" },
  { bg: "bg-green-50", border: "border-green-200", text: "text-green-600", activeBg: "bg-green-100", iconBg: "bg-green-100", shadow: "shadow-green-500/10" },
  { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-600", activeBg: "bg-indigo-100", iconBg: "bg-indigo-100", shadow: "shadow-indigo-500/10" },
  { bg: "bg-red-50", border: "border-red-200", text: "text-red-600", activeBg: "bg-red-100", iconBg: "bg-red-100", shadow: "shadow-red-500/10" },
  { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600", activeBg: "bg-purple-100", iconBg: "bg-purple-100", shadow: "shadow-purple-500/10" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600", activeBg: "bg-amber-100", iconBg: "bg-amber-100", shadow: "shadow-amber-500/10" },
];

const HelpPage = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState("orders");
  const [searchQuery, setSearchQuery] = useState("");

  const currentCategory = helpCategories.find((c) => c.id === activeCategory);
  const currentColorIndex = helpCategories.findIndex((c) => c.id === activeCategory);
  const currentColor = categoryColors[currentColorIndex % categoryColors.length];

  const allQuestions = useMemo(() => {
    return helpCategories.flatMap((cat) =>
      cat.questions.map((q) => ({ ...q, categoryId: cat.id, categoryTitle: cat.title, icon: cat.icon }))
    );
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return allQuestions.filter(
      (item) => item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query)
    );
  }, [searchQuery, allQuestions]);

  const toggle = (index) => setOpenIndex(openIndex === index ? null : index);

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    setOpenIndex(null);
    setSearchQuery("");
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 500px; } }
        .help-fade { animation: fadeUp 0.5s ease both; }
        .help-faq-content { animation: slideDown 0.25s ease both; }
      `}</style>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
            <Link to="/" className="hover:text-gray-900 no-underline transition-colors">Home</Link>
            <span>›</span>
            <span className="text-gray-900 font-semibold">Help Center</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-blue-500/20 shadow-md shrink-0 hidden sm:block">
                <img src={PlatformLogo} alt="shop.design" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 m-0">Help Center</h1>
                <p className="text-sm text-gray-500 m-0 mt-1">
                  Search the <span className="font-bold text-blue-600">shop.design</span> knowledge base or browse categories
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
              <span>📚 30+ Articles</span>
              <span>⚡ &lt;2hr Response</span>
            </div>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-1 flex gap-1 max-w-xl"
          >
            <div className="flex items-center pl-3">
              <svg width="18" height="18" fill="none" stroke="#9CA3AF" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search shop.design help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-none outline-none text-sm text-gray-900 py-2.5 bg-transparent font-[inherit] placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-3 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-lg"
              >
                ×
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {!searchQuery && (
          <div className="mb-8">
            <h2 className="text-xl font-extrabold text-gray-900 m-0 mb-1">Browse by Category</h2>
            <p className="text-sm text-gray-500 m-0 mb-5">Choose a topic to find what you're looking for</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {helpCategories.map((cat, i) => {
                const isActive = activeCategory === cat.id;
                const color = categoryColors[i % categoryColors.length];
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-center font-[inherit] hover:-translate-y-1 hover:shadow-lg ${
                      isActive
                        ? `${color.activeBg} ${color.border} shadow-lg ${color.shadow}`
                        : "bg-white border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isActive ? "bg-white shadow-sm" : color.iconBg} border ${color.border} transition-all`}>
                      {cat.icon}
                    </div>
                    <p className={`text-xs font-bold m-0 transition-colors ${isActive ? color.text : "text-gray-800"}`}>
                      {cat.title}
                    </p>
                    <span className={`text-[9px] font-bold ${color.text}`}>
                      {cat.questions.length} articles
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {searchQuery ? (
          <div className="help-fade">
            <div className="mb-5">
              <h2 className="text-lg font-extrabold text-gray-900 m-0">Search Results</h2>
              <p className="text-sm text-gray-500 m-0 mt-1">
                {searchResults?.length || 0} {searchResults?.length === 1 ? "result" : "results"} for "<strong className="text-gray-900">{searchQuery}</strong>"
              </p>
            </div>

            {searchResults?.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-gray-100 p-14 text-center shadow-sm">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner border border-blue-200">
                  🔍
                </div>
                <p className="text-lg font-extrabold text-gray-900 m-0 mb-2">No results found</p>
                <p className="text-sm text-gray-500 m-0 mb-5">Try different keywords or contact our support team</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] text-white border-none rounded-xl px-6 py-2.5 text-sm font-bold cursor-pointer hover:brightness-110 transition font-[inherit]"
                >
                  Browse Categories
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {searchResults?.map((item, index) => (
                  <div
                    key={index}
                    className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                      openIndex === index ? "border-blue-300 shadow-lg shadow-blue-500/10" : "border-gray-100 hover:border-blue-200"
                    }`}
                  >
                    <button
                      onClick={() => toggle(index)}
                      className="w-full bg-transparent border-none p-5 cursor-pointer flex items-center justify-between gap-4 text-left font-[inherit]"
                    >
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider m-0 mb-1">
                          {item.icon} {item.categoryTitle}
                        </p>
                        <p className="text-sm font-bold text-gray-900 m-0">{item.q}</p>
                      </div>
                      <svg
                        width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round"
                        className={`text-gray-400 shrink-0 transition-transform ${openIndex === index ? "rotate-180 text-blue-600" : ""}`}
                      >
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openIndex === index && (
                      <div className="help-faq-content px-5 pb-5 border-t border-gray-100">
                        <p className="text-sm text-gray-600 leading-relaxed m-0 mt-4">{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="help-fade" key={activeCategory}>
            <div className={`${currentColor.bg} border-2 ${currentColor.border} rounded-2xl p-5 mb-5 flex items-center gap-3.5`}>
              <div className="w-13 h-13 bg-white rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm border border-gray-100" style={{ width: 52, height: 52 }}>
                {currentCategory.icon}
              </div>
              <div>
                <h2 className={`text-lg font-extrabold ${currentColor.text} m-0`}>{currentCategory.title}</h2>
                <p className="text-xs text-gray-600 m-0 mt-0.5">
                  {currentCategory.description} · {currentCategory.questions.length} articles
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {currentCategory.questions.map((item, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                    openIndex === index ? `${currentColor.border} shadow-lg ${currentColor.shadow}` : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <button
                    onClick={() => toggle(index)}
                    className="w-full bg-transparent border-none p-5 cursor-pointer flex items-center justify-between gap-4 text-left font-[inherit]"
                  >
                    <div className="flex items-center gap-3.5 flex-1">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                          openIndex === index
                            ? `${currentColor.activeBg} ${currentColor.text}`
                            : `${currentColor.bg} ${currentColor.text}`
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <p className="text-sm font-bold text-gray-900 m-0">{item.q}</p>
                    </div>
                    <svg
                      width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round"
                      className={`shrink-0 transition-transform ${openIndex === index ? `rotate-180 ${currentColor.text}` : "text-gray-400"}`}
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openIndex === index && (
                    <div className="help-faq-content px-5 pb-5 sm:pl-16 border-t border-gray-100">
                      <p className="text-sm text-gray-600 leading-relaxed m-0 mt-4 mb-3">{item.a}</p>
                      <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-500">Was this helpful?</span>
                        <button className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-[11px] font-bold text-green-600 cursor-pointer hover:bg-green-50 transition font-[inherit] flex items-center gap-1">
                          👍 Yes
                        </button>
                        <button className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-[11px] font-bold text-red-500 cursor-pointer hover:bg-red-50 transition font-[inherit] flex items-center gap-1">
                          👎 No
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-blue-500/20 shadow-md mx-auto mb-3">
              <img src={PlatformLogo} alt="shop.design" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 m-0 mb-2">Still need help? 🤝</h2>
            <p className="text-sm text-gray-500 m-0">
              The <span className="font-bold text-blue-600">shop.design</span> support team is here for you 7 days a week
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: "📧", title: "Email Us", sub: "Reply within 2 hours", value: "info@quleep.in", href: "mailto:info@quleep.in", color: "text-blue-600" },
              { icon: "📞", title: "Call Us", sub: "Mon-Sat, 9AM-6PM IST", value: "+91 9804999555", href: "tel:+919883019518", color: "text-green-600" },
              { icon: "💬", title: "Contact Form", sub: "Send a detailed message", value: "Open Form →", href: "/contact", color: "text-blue-600", isLink: true },
              { icon: "💚", title: "WhatsApp", sub: "Quick chat support", value: "Chat Now →", href: "https://wa.me/919883019518", color: "text-green-600" },
            ].map((item) => {
              const Tag = item.isLink ? Link : "a";
              const props = item.isLink
                ? { to: item.href }
                : { href: item.href, target: item.href?.startsWith("http") ? "_blank" : undefined, rel: item.href?.startsWith("http") ? "noreferrer" : undefined };
              return (
                <Tag
                  key={item.title}
                  {...props}
                  className="bg-white border-2 border-gray-100 rounded-2xl p-5 text-center no-underline text-inherit hover:border-blue-300 hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer block"
                  onClick={item.isLink ? () => navigate(item.href) : undefined}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-sm">
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-900 m-0 mb-1">{item.title}</h3>
                  <p className="text-[11px] text-gray-500 m-0 mb-2">{item.sub}</p>
                  <p className={`text-xs font-bold ${item.color} m-0`}>{item.value}</p>
                </Tag>
              );
            })}
          </div>

          <div className="mt-8 bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#0F172A] rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-blue-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-blue-400/40 shadow-md shrink-0">
                <img src={PlatformLogo} alt="shop.design" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white m-0 mb-1">Need to track an order? 📦</h3>
                <p className="text-sm text-blue-200/60 m-0">Visit your orders page for real-time tracking</p>
              </div>
            </div>
            <Link
              to="/orders"
              className="relative bg-gradient-to-r from-blue-500 to-blue-600 text-white no-underline px-6 py-3 rounded-xl text-sm font-extrabold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:brightness-110 transition-all whitespace-nowrap"
            >
              Track Order →
            </Link>
          </div>
        </div>
      </div>

      <div className="py-8 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider text-center mb-4">📚 Related Resources</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: "Shipping Policy", path: "/policy/shipping-info" },
              { label: "No Returns Policy", path: "/policy/no-returns" },
              { label: "Privacy Policy", path: "/policy/privacy" },
              { label: "Terms of Service", path: "/policy/terms" },
              { label: "Cookie Policy", path: "/policy/cookies" },
              { label: "Payment & Pricing", path: "/policy/payment-pricing" },
              { label: "Seller Guidelines", path: "/policy/seller-guidelines" },
              { label: "About Us", path: "/about" },
              { label: "Contact Us", path: "/contact" },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className="bg-white text-gray-700 no-underline px-4 py-2 rounded-full text-xs font-bold border-2 border-gray-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all shadow-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <p className="text-[10px] text-gray-400 text-center mt-6 uppercase tracking-wider font-bold">
            shop.design · A product of Quleep Pvt Ltd
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;