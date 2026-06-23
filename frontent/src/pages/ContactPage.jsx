import { useState } from "react";
import { Link } from "react-router-dom";

const ContactPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      errors.name = "Please enter your name";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email))
      errors.email = "Enter a valid email address";
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone.trim()))
      errors.phone = "Enter a valid 10-digit phone number";
    if (!form.category) errors.category = "Please select a category";
    if (!form.subject.trim() || form.subject.trim().length < 5)
      errors.subject = "Subject must be at least 5 characters";
    if (!form.message.trim() || form.message.trim().length < 20)
      errors.message = "Message must be at least 20 characters";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setForm({ name: "", email: "", phone: "", subject: "", category: "", message: "" });
    setFieldErrors({});
  };

  if (submitted) {
    return (
      <div style={{ background: "#F3F4F6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <style>{`
          @keyframes successPop {
            0% { opacity: 0; transform: scale(0.7); }
            50% { transform: scale(1.05); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes checkDraw {
            from { stroke-dashoffset: 100; }
            to { stroke-dashoffset: 0; }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <div style={{
          maxWidth: 500, width: "100%",
          background: "white",
          borderRadius: 24,
          padding: "48px 40px",
          textAlign: "center",
          border: "1px solid #E5E7EB",
          boxShadow: "0 24px 60px rgba(0,0,0,0.08)",
          animation: "fadeUp 0.4s ease both",
        }}>
          <div style={{
            width: 88, height: 88,
            background: "linear-gradient(135deg, #22C55E, #16A34A)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 16px 40px rgba(34,197,94,0.4)",
            animation: "successPop 0.5s ease both",
          }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path
                d="M5 13l4 4L19 7"
                style={{ strokeDasharray: 100, animation: "checkDraw 0.6s ease 0.3s both" }}
              />
            </svg>
          </div>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#F0FDF4", border: "1px solid #86EFAC",
            borderRadius: 99, padding: "4px 12px", marginBottom: 16,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }}></span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#16A34A", letterSpacing: "0.06em" }}>MESSAGE RECEIVED</span>
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 900, color: "#111", margin: "0 0 12px", lineHeight: 1.2 }}>
            Thank you for reaching out! 🎉
          </h2>

          <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 24px", lineHeight: 1.7 }}>
            We've received your message and our team will get back to you within{" "}
            <strong style={{ color: "#111" }}>2-24 hours</strong> via email.
          </p>

          <div style={{
            background: "#F9FAFB",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 24,
            textAlign: "left",
          }}>
            <p style={{ fontSize: 11, color: "#6B7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
              Ticket Reference
            </p>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: 0, fontFamily: "monospace" }}>
              #TKT-{Date.now().toString().slice(-8)}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleReset}
              style={{
                background: "white", color: "#374151",
                border: "1.5px solid #E5E7EB", borderRadius: 12,
                padding: "12px 24px", fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Send Another
            </button>
            <Link
              to="/"
              style={{
                background: "linear-gradient(135deg, #D85A30, #FF8C5A)",
                color: "white", textDecoration: "none",
                padding: "12px 28px", borderRadius: 12,
                fontSize: 14, fontWeight: 800,
                boxShadow: "0 8px 20px rgba(216,90,48,0.3)",
              }}
            >
              Back to Home →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const inquiryCategories = [
    { value: "order", label: "Order Issue", icon: "📦" },
    { value: "payment", label: "Payment Help", icon: "💳" },
    { value: "shipping", label: "Shipping Query", icon: "🚚" },
    { value: "return", label: "Return / Refund", icon: "🔄" },
    { value: "account", label: "Account Help", icon: "👤" },
    { value: "vendor", label: "Become a Seller", icon: "🏪" },
    { value: "feedback", label: "Feedback", icon: "💡" },
    { value: "other", label: "Other", icon: "💬" },
  ];

  return (
    <div style={{ background: "#F3F4F6", minHeight: "100vh" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ct-fade { animation: fadeUp 0.5s ease both; }
        .ct-input {
          width: 100%;
          border: 1.5px solid #E5E7EB;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          color: #111;
          background: #FAFAFA;
          outline: none;
          transition: all 0.15s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .ct-input:focus {
          border-color: #D85A30;
          background: white;
          box-shadow: 0 0 0 3px rgba(216,90,48,0.08);
        }
        .ct-input.error { border-color: #FCA5A5; }
        .ct-cat-btn {
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          border: 1.5px solid #E5E7EB;
          background: white;
          color: #374151;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 8px;
          text-align: left;
          font-family: inherit;
        }
        .ct-cat-btn:hover { border-color: #D85A30; }
        .ct-cat-btn.active {
          background: linear-gradient(135deg, #FFF5F0, #FFFBF9);
          border-color: #D85A30;
          color: #D85A30;
        }
        .ct-quick-card {
          background: white;
          border: 1.5px solid #E5E7EB;
          border-radius: 14px;
          padding: 16px;
          text-decoration: none;
          color: inherit;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ct-quick-card:hover {
          border-color: #D85A30;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(216,90,48,0.1);
        }
      `}</style>

      <section style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)",
        padding: "60px 20px 80px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -80, right: -50, width: 280, height: 280, background: "rgba(216,90,48,0.15)", borderRadius: "50%", filter: "blur(60px)" }}></div>
        <div style={{ position: "absolute", bottom: -80, left: -50, width: 260, height: 260, background: "rgba(124,58,237,0.12)", borderRadius: "50%", filter: "blur(50px)" }}></div>

        <div className="ct-fade" style={{ maxWidth: 700, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(216,90,48,0.15)", border: "1px solid rgba(216,90,48,0.3)",
            borderRadius: 99, padding: "5px 14px", marginBottom: 16,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#D85A30", display: "inline-block" }}></span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#FB923C", letterSpacing: "0.06em" }}>CONTACT US</span>
          </div>

          <h1 style={{ fontSize: 44, fontWeight: 900, color: "white", margin: "0 0 14px", lineHeight: 1.1, letterSpacing: "-1px" }}>
            We'd love to{" "}
            <span style={{
              background: "linear-gradient(135deg, #D85A30, #FF8C5A)",
              WebkitBackgroundClip: "text", backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              hear from you
            </span>
          </h1>

          <p style={{ fontSize: 16, color: "#94A3B8", margin: "0 0 32px", lineHeight: 1.6 }}>
            Have a question, feedback, or need help? Our team is ready to assist you.
          </p>

          <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { value: "<2hr", label: "Response Time", icon: "⚡" },
              { value: "24/7", label: "Email Support", icon: "📧" },
              { value: "99%", label: "Resolved", icon: "✅" },
            ].map((stat) => (
              <div key={stat.label} style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: "10px 18px",
              }}>
                <span style={{ fontSize: 22 }}>{stat.icon}</span>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: 16, fontWeight: 900, color: "white", margin: 0, lineHeight: 1 }}>{stat.value}</p>
                  <p style={{ fontSize: 11, color: "#64748B", margin: "2px 0 0" }}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "-40px auto 0", padding: "0 20px 40px", position: "relative", zIndex: 2 }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 28 }}>
          {[
            {
              icon: "📧", title: "Email Us",
              value: "info@quleep.in", desc: "We reply within 2 hours",
              color: "#D85A30", bg: "#FFF5F0", border: "#FDBA74",
              href: "mailto:info@quleep.in",
            },
            {
              icon: "📞", title: "Call Us",
              value: "+91 98830 19518", desc: "Mon-Sat, 9AM-6PM IST",
              color: "#16A34A", bg: "#F0FDF4", border: "#86EFAC",
              href: "tel:+919883019518",
            },
            {
              icon: "💚", title: "WhatsApp",
              value: "Chat with us", desc: "Instant messaging support",
              color: "#16A34A", bg: "#F0FDF4", border: "#86EFAC",
              href: "https://wa.me/919883019518",
            },
            {
              icon: "💬", title: "Live Chat",
              value: "Coming Soon", desc: "Real-time chat support",
              color: "#2563EB", bg: "#EFF6FF", border: "#93C5FD",
              href: "#",
            },
          ].map((item) => (
            <a
              key={item.title}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : "_self"}
              rel="noreferrer"
              style={{
                background: "white",
                borderRadius: 16,
                padding: "20px",
                textDecoration: "none",
                color: "inherit",
                border: "1.5px solid #E5E7EB",
                transition: "all 0.2s",
                display: "block",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = item.border;
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 12px 28px ${item.color}20`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#E5E7EB";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: 48, height: 48,
                background: item.bg,
                border: `1px solid ${item.border}`,
                borderRadius: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
                marginBottom: 12,
              }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 13, color: item.color, fontWeight: 700, margin: "0 0 2px" }}>
                {item.value}
              </p>
              <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>
                {item.desc}
              </p>
            </a>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, alignItems: "flex-start" }}>

          <div style={{
            background: "white",
            borderRadius: 20,
            border: "1px solid #E5E7EB",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          }}>
            <div style={{
              padding: "20px 28px",
              borderBottom: "1px solid #F3F4F6",
              background: "linear-gradient(135deg, #FFF5F0, white)",
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "#111", margin: 0 }}>
                Send us a message
              </h2>
              <p style={{ fontSize: 13, color: "#6B7280", margin: "3px 0 0" }}>
                Fill in the form below and we'll get back to you soon
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "28px" }}>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  What can we help you with? <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                  {inquiryCategories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, category: cat.value });
                        setFieldErrors((prev) => ({ ...prev, category: "" }));
                      }}
                      className={`ct-cat-btn ${form.category === cat.value ? "active" : ""}`}
                    >
                      <span style={{ fontSize: 16 }}>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
                {fieldErrors.category && (
                  <p style={{ fontSize: 11, color: "#EF4444", marginTop: 6, fontWeight: 600 }}>
                    ⚠️ {fieldErrors.category}
                  </p>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Full Name <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`ct-input ${fieldErrors.name ? "error" : ""}`}
                  />
                  {fieldErrors.name && (
                    <p style={{ fontSize: 11, color: "#EF4444", marginTop: 4, fontWeight: 600 }}>
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Email <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={`ct-input ${fieldErrors.email ? "error" : ""}`}
                  />
                  {fieldErrors.email && (
                    <p style={{ fontSize: 11, color: "#EF4444", marginTop: 4, fontWeight: 600 }}>
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Phone Number <span style={{ color: "#9CA3AF", fontWeight: 500 }}>(optional)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#6B7280" }}>+91</span>
                    <div style={{ width: 1, height: 16, background: "#E5E7EB" }}></div>
                  </div>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    maxLength={10}
                    className={`ct-input ${fieldErrors.phone ? "error" : ""}`}
                    style={{ paddingLeft: 54 }}
                  />
                </div>
                {fieldErrors.phone && (
                  <p style={{ fontSize: 11, color: "#EF4444", marginTop: 4, fontWeight: 600 }}>
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Subject <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Brief summary of your inquiry"
                  className={`ct-input ${fieldErrors.subject ? "error" : ""}`}
                />
                {fieldErrors.subject && (
                  <p style={{ fontSize: 11, color: "#EF4444", marginTop: 4, fontWeight: 600 }}>
                    {fieldErrors.subject}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Message <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Tell us more about your query in detail... (minimum 20 characters)"
                  className={`ct-input ${fieldErrors.message ? "error" : ""}`}
                  style={{ resize: "vertical", minHeight: 120 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  {fieldErrors.message ? (
                    <p style={{ fontSize: 11, color: "#EF4444", margin: 0, fontWeight: 600 }}>
                      {fieldErrors.message}
                    </p>
                  ) : (
                    <span></span>
                  )}
                  <span style={{ fontSize: 11, color: form.message.length >= 20 ? "#22C55E" : "#9CA3AF", fontWeight: 600 }}>
                    {form.message.length} / 1000
                  </span>
                </div>
              </div>

              <div style={{
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>🔒</span>
                <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>
                  Your information is secure. We'll never share it with third parties.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  background: submitting ? "#9CA3AF" : "linear-gradient(135deg, #D85A30, #FF8C5A)",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: submitting ? "not-allowed" : "pointer",
                  boxShadow: submitting ? "none" : "0 8px 20px rgba(216,90,48,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                {submitting ? (
                  <>
                    <span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }}></span>
                    Sending Message...
                  </>
                ) : (
                  <>
                    Send Message
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>

              <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 12 }}>
                By submitting, you agree to our{" "}
                <Link to="/policy/privacy" style={{ color: "#D85A30", fontWeight: 700, textDecoration: "none" }}>
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link to="/policy/terms" style={{ color: "#D85A30", fontWeight: 700, textDecoration: "none" }}>
                  Terms of Service
                </Link>
              </p>
            </form>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div style={{
              background: "white",
              borderRadius: 20,
              border: "1px solid #E5E7EB",
              padding: "20px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 36, height: 36,
                  background: "linear-gradient(135deg, #FFF5F0, #FFE8DF)",
                  border: "1px solid #FDBA74",
                  borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>
                  📍
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 900, color: "#111", margin: 0 }}>
                    Visit Our Office
                  </h3>
                  <p style={{ fontSize: 11, color: "#6B7280", margin: "2px 0 0" }}>
                    By appointment only
                  </p>
                </div>
              </div>

              <div style={{
                background: "#F9FAFB",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 14,
              }}>
                <p style={{ fontSize: 13, color: "#111", margin: 0, fontWeight: 700, lineHeight: 1.6 }}>
                  Bhutani Alphathum
                </p>
                <p style={{ fontSize: 12, color: "#374151", margin: "2px 0 0", lineHeight: 1.6 }}>
                  1432 B-Wing, Sector 90<br />
                  Noida, Uttar Pradesh – 201305<br />
                  India
                </p>
              </div>

              <div style={{
                borderRadius: 12,
                overflow: "hidden",
                height: 200,
                border: "1px solid #E5E7EB",
              }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.7127041640254!2d77.38799!3d28.602!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce5a43173357b%3A0x1ff7c3e1f81f3f25!2sBhutani%20Alphathum!5e0!3m2!1sen!2sin!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Office Location"
                ></iframe>
              </div>

              <a
                href="https://www.google.com/maps/dir//Bhutani+Alphathum,+Sector+90,+Noida"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  background: "#F9FAFB",
                  color: "#374151",
                  textDecoration: "none",
                  padding: "10px",
                  borderRadius: 10,
                  marginTop: 12,
                  border: "1px solid #E5E7EB",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                🧭 Get Directions →
              </a>
            </div>

            <div style={{
              background: "white",
              borderRadius: 20,
              border: "1px solid #E5E7EB",
              padding: "20px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 36, height: 36,
                  background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)",
                  border: "1px solid #86EFAC",
                  borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>
                  🕐
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 900, color: "#111", margin: 0 }}>
                    Business Hours
                  </h3>
                  <p style={{ fontSize: 11, color: "#6B7280", margin: "2px 0 0" }}>
                    Indian Standard Time (IST)
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { day: "Monday - Friday", time: "9:00 AM - 6:00 PM", status: "open" },
                  { day: "Saturday", time: "10:00 AM - 4:00 PM", status: "open" },
                  { day: "Sunday", time: "Closed", status: "closed" },
                ].map((schedule) => (
                  <div
                    key={schedule.day}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      background: schedule.status === "closed" ? "#FEF2F2" : "#F9FAFB",
                      borderRadius: 10,
                      border: `1px solid ${schedule.status === "closed" ? "#FECACA" : "#E5E7EB"}`,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>
                      {schedule.day}
                    </span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: schedule.status === "closed" ? "#DC2626" : "#16A34A",
                    }}>
                      {schedule.time}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 12,
                padding: "10px 14px",
                background: "#FFF7ED",
                border: "1px solid #FED7AA",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>📧</span>
                <p style={{ fontSize: 11, color: "#92400E", margin: 0, fontWeight: 600 }}>
                  Email support available 24/7
                </p>
              </div>
            </div>

            <div style={{
              background: "linear-gradient(135deg, #0f172a, #1e293b)",
              borderRadius: 20,
              padding: "20px",
              border: "1px solid rgba(255,255,255,0.05)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 36, height: 36,
                  background: "rgba(216,90,48,0.2)",
                  borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>
                  ⚡
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 900, color: "white", margin: 0 }}>
                  Quick Help
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Help Center", path: "/help", icon: "💬" },
                  { label: "Track Order", path: "/orders", icon: "📦" },
                  { label: "Return Policy", path: "/policy/returns", icon: "🔄" },
                  { label: "Shipping Info", path: "/policy/shipping-info", icon: "🚚" },
                ].map((link) => (
                  <Link
                    key={link.label}
                    to={link.path}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                      color: "white",
                      textDecoration: "none",
                      fontSize: 12,
                      fontWeight: 600,
                      transition: "all 0.15s",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  >
                    <span style={{ fontSize: 14 }}>{link.icon}</span>
                    {link.label}
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" style={{ marginLeft: "auto" }}>
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 28,
          background: "white",
          borderRadius: 20,
          padding: "28px",
          border: "1px solid #E5E7EB",
          textAlign: "center",
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: "#111", margin: "0 0 6px" }}>
            Connect with us on social media
          </h3>
          <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 18px" }}>
            Follow us for updates, deals, and announcements
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { name: "Facebook", icon: "f", color: "#1877F2", url: "https://facebook.com" },
              { name: "Instagram", icon: "📷", color: "#E4405F", url: "https://instagram.com" },
              { name: "Twitter", icon: "𝕏", color: "#000", url: "https://twitter.com" },
              { name: "LinkedIn", icon: "in", color: "#0A66C2", url: "https://linkedin.com" },
              { name: "YouTube", icon: "▶", color: "#FF0000", url: "https://youtube.com" },
            ].map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  width: 44, height: 44,
                  background: "white",
                  border: `2px solid ${social.color}`,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  color: social.color,
                  fontSize: 18,
                  fontWeight: 900,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = social.color;
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.transform = "translateY(-3px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color = social.color;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                title={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;