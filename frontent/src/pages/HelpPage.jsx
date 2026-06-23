import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

const helpCategories = [
  {
    id: "orders",
    title: "Orders & Tracking",
    icon: "📦",
    color: "#D85A30",
    bg: "#FFF5F0",
    border: "#FDBA74",
    description: "Track orders, manage shipments, view history",
    questions: [
      {
        q: "How do I place an order?",
        a: "Browse our wide range of products, click 'Add to Cart' on items you like, proceed to checkout, fill in your shipping address, select your preferred payment method (COD or Online), and confirm your order. You'll receive an order confirmation email immediately.",
      },
      {
        q: "How can I track my order?",
        a: "After logging in, go to 'My Orders' from your dashboard. You can see the real-time status of each order: Pending → Processing → Shipped → Out for Delivery → Delivered. You'll also receive email and SMS notifications at each stage.",
      },
      {
        q: "Can I cancel my order?",
        a: "Yes! You can cancel your order if it's still in 'Pending' or 'Processing' status. Go to 'My Orders', find your order, and click 'Cancel Order'. The refund will be processed within 5-7 business days for prepaid orders.",
      },
      {
        q: "Can I modify my order after placing it?",
        a: "Orders cannot be modified once placed. However, you can cancel the order (if not yet shipped) and place a new order with the correct details. For shipping address changes, please contact our support team immediately.",
      },
      {
        q: "What if my order is delayed?",
        a: "We strive to deliver on time. If your order is delayed beyond the estimated delivery date, please contact our support team. We'll investigate immediately and keep you updated on the status.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments & Pricing",
    icon: "💳",
    color: "#16A34A",
    bg: "#F0FDF4",
    border: "#86EFAC",
    description: "Payment methods, refunds, billing",
    questions: [
      {
        q: "What payment methods are accepted?",
        a: "We accept multiple payment methods: Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay, Amex), Net Banking, and Digital Wallets. All online payments are secured by 256-bit SSL encryption.",
      },
      {
        q: "Is my payment information secure?",
        a: "Absolutely! All payments are processed through PCI-DSS compliant payment gateways. We never store your card details on our servers. Your financial information is encrypted and protected at all times.",
      },
      {
        q: "When will I be charged?",
        a: "For prepaid orders, payment is processed immediately upon order confirmation. For COD orders, you pay only when the order is delivered to you.",
      },
      {
        q: "How do refunds work?",
        a: "Refunds are processed within 5-7 business days after we receive the returned item. The amount will be credited back to your original payment method. For COD orders, refunds go to your registered bank account or UPI.",
      },
      {
        q: "Are there any hidden charges?",
        a: "No hidden charges! The price you see at checkout includes everything — product cost, GST, and shipping (if applicable). Free shipping is available on orders above ₹499.",
      },
    ],
  },
  {
    id: "shipping",
    title: "Shipping & Delivery",
    icon: "🚚",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#93C5FD",
    description: "Delivery times, charges, locations",
    questions: [
      {
        q: "How long does delivery take?",
        a: "Standard delivery takes 3-7 business days depending on your location. Metro cities (Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad) typically receive orders within 3-4 days. Tier-2 and Tier-3 cities may take 5-7 days.",
      },
      {
        q: "Is there free shipping?",
        a: "Yes! We offer FREE shipping on all orders above ₹499. For orders below ₹499, a small delivery fee of ₹49 applies.",
      },
      {
        q: "Do you deliver to my area?",
        a: "We deliver to over 25,000+ PIN codes across India. Enter your PIN code on the product page or at checkout to confirm delivery availability and estimated date.",
      },
      {
        q: "Can I get same-day delivery?",
        a: "Same-day delivery is currently available in select metro cities for eligible products. Look for the 'Same Day Delivery' badge on product pages.",
      },
      {
        q: "What if I'm not available to receive the order?",
        a: "Our delivery partner will make up to 3 delivery attempts. You can also reschedule the delivery or change the delivery address through the tracking link.",
      },
    ],
  },
  {
    id: "returns",
    title: "Returns & Refunds",
    icon: "🔄",
    color: "#9333EA",
    bg: "#F5F3FF",
    border: "#C4B5FD",
    description: "Return policy, refunds, exchanges",
    questions: [
      {
        q: "What is your return policy?",
        a: "We offer a 10-day return policy on most products. Items must be unused, in original condition with all tags and packaging intact. Some categories like innerwear, personal care, and customized products are non-returnable.",
      },
      {
        q: "How do I return a product?",
        a: "Login to your account, go to 'My Orders', find the order, and click 'Request Return'. Choose the reason for return and a pickup will be scheduled within 2-3 business days. Pack the item securely in the original packaging.",
      },
      {
        q: "When will I get my refund?",
        a: "Refunds are initiated within 24 hours of receiving the returned item. Credit card refunds take 5-7 business days, UPI/Net Banking refunds take 3-5 business days, and COD refunds (to bank) take 5-7 business days.",
      },
      {
        q: "Can I exchange a product?",
        a: "Currently, we don't offer direct exchanges. Please return the product for a refund and place a new order for the desired item or size.",
      },
      {
        q: "What if I receive a damaged product?",
        a: "If you receive a damaged or defective product, please contact us within 48 hours of delivery with photos. We'll arrange a free pickup and provide a full refund or replacement at no extra cost.",
      },
    ],
  },
  {
    id: "account",
    title: "Account & Security",
    icon: "👤",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FCA5A5",
    description: "Login, password, profile, security",
    questions: [
      {
        q: "How do I create an account?",
        a: "Click 'Sign Up' at the top right corner. Fill in your details (name, email, phone, password) in the 2-step form. Verify your phone number and you're ready to shop! It takes less than a minute.",
      },
      {
        q: "I forgot my password. What should I do?",
        a: "Click 'Forgot Password' on the login page. Enter your registered email address and we'll send you a password reset link instantly. The link is valid for 24 hours.",
      },
      {
        q: "How do I update my profile?",
        a: "Login and go to 'My Profile' from the dashboard. You can update your name, phone, date of birth, profile photo, and manage your saved addresses. Email cannot be changed for security reasons.",
      },
      {
        q: "How do I delete my account?",
        a: "We're sorry to see you go! Please contact our support team to request account deletion. We'll process your request within 7 business days, ensuring all your personal data is securely removed.",
      },
      {
        q: "Is my data safe?",
        a: "Absolutely! We use industry-standard encryption (SSL/TLS) to protect your data. We never sell your information to third parties. Your password is hashed and never stored in plain text.",
      },
    ],
  },
  {
    id: "sellers",
    title: "Become a Seller",
    icon: "🏪",
    color: "#EA580C",
    bg: "#FFF7ED",
    border: "#FDBA74",
    description: "Selling, vendor account, commission",
    questions: [
      {
        q: "How do I become a seller?",
        a: "Click 'Become a Seller' on the homepage. Complete the 3-step registration: Business Info → Tax & Banking → Security. Upload required documents (PAN, GST, Cancelled Cheque). Approval takes 24-48 hours.",
      },
      {
        q: "What documents do I need?",
        a: "Required: PAN Card, Cancelled Cheque/Bank Passbook, Valid Bank Account. Optional: GST Certificate, Business Registration Document. All documents should be clear and legible.",
      },
      {
        q: "What is the commission structure?",
        a: "Commission varies by category: Electronics (8%), Fashion (12%), Furniture (10%), Books (6%), Beauty (15%). View our complete Commission Policy for detailed information.",
      },
      {
        q: "When do I get paid?",
        a: "Payments are settled every 7 days to your registered bank account. Minimum settlement amount is ₹100. You can view detailed earnings and reports in your Vendor Dashboard.",
      },
    ],
  },
];

const HelpPage = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState("orders");
  const [searchQuery, setSearchQuery] = useState("");

  const currentCategory = helpCategories.find((c) => c.id === activeCategory);

  const allQuestions = useMemo(() => {
    return helpCategories.flatMap((cat) =>
      cat.questions.map((q) => ({ ...q, categoryId: cat.id, categoryTitle: cat.title, icon: cat.icon }))
    );
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return allQuestions.filter(
      (item) =>
        item.q.toLowerCase().includes(query) ||
        item.a.toLowerCase().includes(query)
    );
  }, [searchQuery, allQuestions]);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    setOpenIndex(null);
    setSearchQuery("");
  };

  return (
    <div style={{ background: "#F3F4F6", minHeight: "100vh" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }
        .help-fade { animation: fadeUp 0.5s ease both; }
        .help-faq-content { animation: slideDown 0.25s ease both; }
        .help-cat-card {
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }
        .help-cat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.08);
        }
        .help-cat-card.active {
          transform: translateY(-2px);
        }
        .help-faq-item {
          background: white;
          border: 1.5px solid #E5E7EB;
          border-radius: 14px;
          overflow: hidden;
          transition: all 0.2s;
        }
        .help-faq-item:hover {
          border-color: #D85A30;
        }
        .help-faq-item.open {
          border-color: #D85A30;
          box-shadow: 0 8px 24px rgba(216,90,48,0.08);
        }
        .help-contact-card {
          background: white;
          border: 1.5px solid #E5E7EB;
          border-radius: 16px;
          padding: 24px 20px;
          text-align: center;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
          cursor: pointer;
        }
        .help-contact-card:hover {
          border-color: #D85A30;
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(216,90,48,0.15);
        }
      `}</style>

      <section style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)",
        padding: "60px 20px 80px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -100, right: -50, width: 300, height: 300, background: "rgba(216,90,48,0.15)", borderRadius: "50%", filter: "blur(60px)" }}></div>
        <div style={{ position: "absolute", bottom: -80, left: -50, width: 280, height: 280, background: "rgba(124,58,237,0.12)", borderRadius: "50%", filter: "blur(50px)" }}></div>

        <div className="help-fade" style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(216,90,48,0.15)", border: "1px solid rgba(216,90,48,0.3)",
            borderRadius: 99, padding: "5px 14px", marginBottom: 16,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#D85A30", display: "inline-block" }}></span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#FB923C", letterSpacing: "0.06em" }}>HELP CENTER</span>
          </div>

          <h1 style={{ fontSize: 44, fontWeight: 900, color: "white", margin: "0 0 16px", lineHeight: 1.1, letterSpacing: "-1px" }}>
            How can we{" "}
            <span style={{
              background: "linear-gradient(135deg, #D85A30, #FF8C5A)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              help you?
            </span>
          </h1>

          <p style={{ fontSize: 16, color: "#94A3B8", margin: "0 0 36px", lineHeight: 1.6 }}>
            Search our knowledge base or browse categories below
          </p>

          <form
            onSubmit={(e) => e.preventDefault()}
            style={{
              background: "white",
              borderRadius: 16,
              padding: "6px",
              display: "flex",
              gap: 4,
              maxWidth: 600,
              margin: "0 auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", padding: "0 16px" }}>
              <svg width="20" height="20" fill="none" stroke="#9CA3AF" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: 15, color: "#111", padding: "14px 0",
                background: "transparent", fontFamily: "inherit",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "#9CA3AF", padding: "0 12px", fontSize: 18, fontFamily: "inherit",
                }}
              >
                ×
              </button>
            )}
          </form>

          <div style={{ display: "flex", gap: 28, justifyContent: "center", marginTop: 36, flexWrap: "wrap" }}>
            {[
              { value: "30+", label: "Help Articles" },
              { value: "24/7", label: "Email Support" },
              { value: "9AM-6PM", label: "Phone Support" },
              { value: "<2hr", label: "Avg Response" },
            ].map((stat) => (
              <div key={stat.label}>
                <p style={{ fontSize: 22, fontWeight: 900, color: "white", margin: 0 }}>{stat.value}</p>
                <p style={{ fontSize: 11, color: "#64748B", margin: "2px 0 0" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>

        {!searchQuery && (
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 6px" }}>
              Browse by Category
            </h2>
            <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 20px" }}>
              Choose a topic to find what you're looking for
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
              {helpCategories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`help-cat-card ${isActive ? "active" : ""}`}
                    style={{
                      background: isActive ? cat.bg : "white",
                      borderColor: isActive ? cat.border : "transparent",
                      borderRadius: 16,
                      padding: "20px 16px",
                      boxShadow: isActive ? `0 12px 28px ${cat.color}25` : "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{
                      width: 48, height: 48,
                      background: isActive ? "white" : cat.bg,
                      border: `1px solid ${cat.border}`,
                      borderRadius: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      marginBottom: 12,
                    }}>
                      {cat.icon}
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: isActive ? cat.color : "#111", margin: "0 0 4px" }}>
                      {cat.title}
                    </h3>
                    <p style={{ fontSize: 11, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
                      {cat.description}
                    </p>
                    <p style={{ fontSize: 10, color: cat.color, fontWeight: 700, margin: "8px 0 0" }}>
                      {cat.questions.length} articles
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {searchQuery ? (
          <div className="help-fade">
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#111", margin: 0 }}>
                Search Results
              </h2>
              <p style={{ fontSize: 13, color: "#6B7280", margin: "3px 0 0" }}>
                {searchResults?.length || 0} {searchResults?.length === 1 ? "result" : "results"} for "<strong style={{ color: "#111" }}>{searchQuery}</strong>"
              </p>
            </div>

            {searchResults?.length === 0 ? (
              <div style={{
                background: "white",
                borderRadius: 16,
                padding: "60px 20px",
                textAlign: "center",
                border: "1px solid #E5E7EB",
              }}>
                <p style={{ fontSize: 48, margin: "0 0 12px" }}>🔍</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: 0 }}>No results found</p>
                <p style={{ fontSize: 13, color: "#6B7280", margin: "6px 0 20px" }}>
                  Try different keywords or contact our support team
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    background: "#111", color: "white", border: "none",
                    borderRadius: 10, padding: "10px 22px", fontSize: 13,
                    fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Browse Categories
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {searchResults?.map((item, index) => (
                  <div key={index} className={`help-faq-item ${openIndex === index ? "open" : ""}`}>
                    <button
                      onClick={() => toggle(index)}
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        padding: "18px 22px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                        textAlign: "left",
                        fontFamily: "inherit",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 4px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {item.icon} {item.categoryTitle}
                        </p>
                        <p style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>
                          {item.q}
                        </p>
                      </div>
                      <svg
                        width="18" height="18" fill="none" stroke="#6B7280" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round"
                        style={{ transform: openIndex === index ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }}
                      >
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openIndex === index && (
                      <div className="help-faq-content" style={{ padding: "0 22px 20px", borderTop: "1px solid #F3F4F6" }}>
                        <p style={{ fontSize: 14, color: "#4B5563", margin: "16px 0 0", lineHeight: 1.7 }}>
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="help-fade" key={activeCategory}>
            <div style={{
              background: currentCategory.bg,
              border: `1px solid ${currentCategory.border}`,
              borderRadius: 16,
              padding: "20px 24px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}>
              <div style={{
                width: 52, height: 52,
                background: "white",
                borderRadius: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, flexShrink: 0,
              }}>
                {currentCategory.icon}
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: currentCategory.color, margin: 0 }}>
                  {currentCategory.title}
                </h2>
                <p style={{ fontSize: 13, color: "#374151", margin: "3px 0 0" }}>
                  {currentCategory.description} • {currentCategory.questions.length} articles
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {currentCategory.questions.map((item, index) => (
                <div key={index} className={`help-faq-item ${openIndex === index ? "open" : ""}`}>
                  <button
                    onClick={() => toggle(index)}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      padding: "18px 22px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
                      <div style={{
                        width: 32, height: 32,
                        background: openIndex === index ? currentCategory.color : currentCategory.bg,
                        color: openIndex === index ? "white" : currentCategory.color,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 900,
                        flexShrink: 0,
                        transition: "all 0.2s",
                      }}>
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>
                        {item.q}
                      </p>
                    </div>
                    <svg
                      width="18" height="18" fill="none" stroke={openIndex === index ? currentCategory.color : "#6B7280"} strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round"
                      style={{ transform: openIndex === index ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }}
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openIndex === index && (
                    <div className="help-faq-content" style={{ padding: "0 22px 22px 70px", borderTop: "1px solid #F3F4F6" }}>
                      <p style={{ fontSize: 14, color: "#4B5563", margin: "16px 0 12px", lineHeight: 1.7 }}>
                        {item.a}
                      </p>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 14px", background: "#F9FAFB",
                        borderRadius: 8, fontSize: 12, color: "#6B7280",
                      }}>
                        <span>Was this helpful?</span>
                        <button
                          style={{
                            background: "white", border: "1px solid #E5E7EB",
                            borderRadius: 6, padding: "4px 12px", fontSize: 11,
                            fontWeight: 700, cursor: "pointer", color: "#22C55E",
                            display: "flex", alignItems: "center", gap: 4,
                            fontFamily: "inherit",
                          }}
                        >
                          👍 Yes
                        </button>
                        <button
                          style={{
                            background: "white", border: "1px solid #E5E7EB",
                            borderRadius: 6, padding: "4px 12px", fontSize: 11,
                            fontWeight: 700, cursor: "pointer", color: "#EF4444",
                            display: "flex", alignItems: "center", gap: 4,
                            fontFamily: "inherit",
                          }}
                        >
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

      <section style={{ background: "white", padding: "60px 20px", borderTop: "1px solid #E5E7EB" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#111", margin: "0 0 8px" }}>
              Still need help? 🤝
            </h2>
            <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
              Our support team is here for you 7 days a week
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <a href="mailto:info@quleep.in" className="help-contact-card">
              <div style={{
                width: 60, height: 60, background: "linear-gradient(135deg, #FFF5F0, #FFE8DF)",
                border: "1px solid #FDBA74", borderRadius: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, margin: "0 auto 14px",
              }}>
                📧
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>
                Email Us
              </h3>
              <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 10px" }}>
                Get a reply within 2 hours
              </p>
              <p style={{ fontSize: 13, color: "#D85A30", fontWeight: 700, margin: 0 }}>
                info@quleep.in
              </p>
            </a>

            <a href="tel:+919883019518" className="help-contact-card">
              <div style={{
                width: 60, height: 60, background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)",
                border: "1px solid #86EFAC", borderRadius: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, margin: "0 auto 14px",
              }}>
                📞
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>
                Call Us
              </h3>
              <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 10px" }}>
                Mon-Sat, 9AM-6PM IST
              </p>
              <p style={{ fontSize: 13, color: "#16A34A", fontWeight: 700, margin: 0 }}>
                +91 98830 19518
              </p>
            </a>

            <div
              onClick={() => navigate("/contact")}
              className="help-contact-card"
            >
              <div style={{
                width: 60, height: 60, background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
                border: "1px solid #93C5FD", borderRadius: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, margin: "0 auto 14px",
              }}>
                💬
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>
                Contact Form
              </h3>
              <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 10px" }}>
                Send us a detailed message
              </p>
              <p style={{ fontSize: 13, color: "#2563EB", fontWeight: 700, margin: 0 }}>
                Open Form →
              </p>
            </div>

            <a
              href="https://wa.me/919883019518"
              target="_blank"
              rel="noreferrer"
              className="help-contact-card"
            >
              <div style={{
                width: 60, height: 60, background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)",
                border: "1px solid #86EFAC", borderRadius: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, margin: "0 auto 14px",
              }}>
                💚
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>
                WhatsApp
              </h3>
              <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 10px" }}>
                Quick chat support
              </p>
              <p style={{ fontSize: 13, color: "#16A34A", fontWeight: 700, margin: 0 }}>
                Chat Now →
              </p>
            </a>
          </div>

          <div style={{ marginTop: 40, padding: "28px 32px", background: "linear-gradient(135deg, #0f172a, #1e293b)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: "0 0 4px" }}>
                Need to track an order? 📦
              </h3>
              <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>
                Visit your orders page for real-time tracking
              </p>
            </div>
            <Link
              to="/orders"
              style={{
                background: "linear-gradient(180deg, #FFD814, #F7CA00)",
                color: "#111",
                textDecoration: "none",
                padding: "12px 24px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              Track Order →
            </Link>
          </div>
        </div>
      </section>

      <section style={{ padding: "32px 20px", background: "#F3F4F6" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#374151", margin: "0 0 14px", textAlign: "center" }}>
            📚 Related Resources
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {[
              { label: "Shipping Policy", path: "/policy/shipping-info" },
              { label: "Returns Policy", path: "/policy/returns" },
              { label: "Privacy Policy", path: "/policy/privacy" },
              { label: "Terms of Service", path: "/policy/terms" },
              { label: "Seller Guidelines", path: "/policy/seller-guidelines" },
              { label: "Commission Policy", path: "/policy/commission-policy" },
              { label: "About Us", path: "/about" },
              { label: "Contact Us", path: "/contact" },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.path}
                style={{
                  background: "white",
                  color: "#374151",
                  textDecoration: "none",
                  padding: "7px 14px",
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 600,
                  border: "1px solid #E5E7EB",
                  transition: "all 0.15s",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpPage;