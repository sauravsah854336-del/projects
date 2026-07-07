import { useState } from "react";
import { Link } from "react-router-dom";
import PlatformLogo from "../assets/PlatformLogo.jpeg";

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", category: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim() || form.name.trim().length < 2) errors.name = "Please enter your name";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email";
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone.trim())) errors.phone = "Enter a valid 10-digit phone";
    if (!form.category) errors.category = "Please select a category";
    if (!form.subject.trim() || form.subject.trim().length < 5) errors.subject = "Subject must be at least 5 characters";
    if (!form.message.trim() || form.message.trim().length < 20) errors.message = "Message must be at least 20 characters";
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

  const inputCls = "w-full border-2 border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 bg-gray-50 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-[inherit]";
  const errorInputCls = "border-red-300 focus:border-red-500 focus:ring-red-500/10";
  const labelCls = "block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider";

  if (submitted) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-blue-500/20 shadow-md mx-auto mb-4">
            <img src={PlatformLogo} alt="shop.design" className="w-full h-full object-cover" />
          </div>
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-500/30">
            <svg width="32" height="32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-[10px] font-extrabold text-green-600 uppercase tracking-wider bg-green-50 border border-green-200 rounded-full px-3 py-1 inline-flex items-center gap-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Message Received
          </p>
          <h2 className="text-xl font-extrabold text-gray-900 m-0 mb-2">Thank you! 🎉</h2>
          <p className="text-sm text-gray-500 m-0 mb-5">
            The <span className="font-bold text-gray-900">shop.design</span> team will get back to you within{" "}
            <strong className="text-gray-900">2-24 hours</strong> via email.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-5 text-left">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider m-0 mb-1">Reference</p>
            <p className="text-sm font-bold text-gray-900 m-0 font-mono">
              #SD-{Date.now().toString().slice(-8)}
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleReset}
              className="bg-white text-gray-700 border-2 border-gray-200 rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer hover:bg-gray-50 transition font-[inherit]"
            >
              Send Another
            </button>
            <Link
              to="/"
              className="bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] text-white no-underline px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categories = [
    { value: "order", label: "Order Issue", icon: "📦" },
    { value: "payment", label: "Payment", icon: "💳" },
    { value: "shipping", label: "Shipping", icon: "🚚" },
    { value: "return", label: "Return / Refund", icon: "🔄" },
    { value: "account", label: "Account", icon: "👤" },
    { value: "vendor", label: "Become a Seller", icon: "🏪" },
    { value: "feedback", label: "Feedback", icon: "💡" },
    { value: "other", label: "Other", icon: "💬" },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
            <Link to="/" className="hover:text-gray-900 no-underline transition-colors">Home</Link>
            <span>›</span>
            <span className="text-gray-900 font-semibold">Contact Us</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-blue-500/20 shadow-md shrink-0 hidden sm:block">
                <img src={PlatformLogo} alt="shop.design" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 m-0">Contact Us</h1>
                <p className="text-sm text-gray-500 m-0 mt-1">
                  Get in touch with the <span className="font-bold text-blue-600">shop.design</span> team
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
              <span>⚡ &lt;2hr Response</span>
              <span>📧 24/7 Email</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: "📧", title: "Email", value: "info@quleep.in", href: "mailto:info@quleep.in" },
            { icon: "📞", title: "Call", value: "+91 98830 19518", href: "tel:+919883019518" },
            { icon: "💚", title: "WhatsApp", value: "Chat Now", href: "https://wa.me/919883019518" },
            { icon: "📍", title: "Office", value: "Noida, India", href: "#office" },
          ].map((item) => (
            <a
              key={item.title}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noreferrer" : undefined}
              className="bg-white rounded-xl border border-gray-200 p-4 no-underline text-inherit hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-md transition-all block"
            >
              <span className="text-xl">{item.icon}</span>
              <p className="text-xs font-extrabold text-gray-900 m-0 mt-2">{item.title}</p>
              <p className="text-[11px] text-gray-500 font-semibold m-0 mt-0.5">{item.value}</p>
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 items-start">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-base font-extrabold text-gray-900 m-0">Send us a message</h2>
              <p className="text-xs text-gray-500 m-0 mt-0.5">Fill in the form and we'll respond within 2 hours</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-5">
                <p className={labelCls}>What can we help with? <span className="text-red-500">*</span></p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => { setForm({ ...form, category: cat.value }); setFieldErrors((p) => ({ ...p, category: "" })); }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold border-2 cursor-pointer transition-all font-[inherit] ${
                        form.category === cat.value
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-sm">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
                {fieldErrors.category && <p className="text-[11px] text-red-500 font-semibold mt-1.5 m-0">{fieldErrors.category}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className={labelCls}>Name <span className="text-red-500">*</span></p>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className={`${inputCls} ${fieldErrors.name ? errorInputCls : ""}`} />
                  {fieldErrors.name && <p className="text-[11px] text-red-500 font-semibold mt-1 m-0">{fieldErrors.name}</p>}
                </div>
                <div>
                  <p className={labelCls}>Email <span className="text-red-500">*</span></p>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className={`${inputCls} ${fieldErrors.email ? errorInputCls : ""}`} />
                  {fieldErrors.email && <p className="text-[11px] text-red-500 font-semibold mt-1 m-0">{fieldErrors.email}</p>}
                </div>
              </div>

              <div className="mb-3">
                <p className={labelCls}>Phone <span className="text-gray-400 font-normal">(optional)</span></p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 flex items-center gap-1.5">
                    +91 <span className="w-px h-4 bg-gray-300" />
                  </span>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" maxLength={10} className={`${inputCls} pl-14 ${fieldErrors.phone ? errorInputCls : ""}`} />
                </div>
                {fieldErrors.phone && <p className="text-[11px] text-red-500 font-semibold mt-1 m-0">{fieldErrors.phone}</p>}
              </div>

              <div className="mb-3">
                <p className={labelCls}>Subject <span className="text-red-500">*</span></p>
                <input name="subject" value={form.subject} onChange={handleChange} placeholder="Brief summary" className={`${inputCls} ${fieldErrors.subject ? errorInputCls : ""}`} />
                {fieldErrors.subject && <p className="text-[11px] text-red-500 font-semibold mt-1 m-0">{fieldErrors.subject}</p>}
              </div>

              <div className="mb-4">
                <p className={labelCls}>Message <span className="text-red-500">*</span></p>
                <textarea name="message" value={form.message} onChange={handleChange} rows={5} placeholder="Describe your query in detail... (min 20 characters)" className={`${inputCls} resize-y ${fieldErrors.message ? errorInputCls : ""}`} />
                <div className="flex justify-between mt-1">
                  {fieldErrors.message ? (
                    <p className="text-[11px] text-red-500 font-semibold m-0">{fieldErrors.message}</p>
                  ) : <span />}
                  <span className={`text-[11px] font-semibold ${form.message.length >= 20 ? "text-green-600" : "text-gray-400"}`}>
                    {form.message.length}/1000
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 mb-4 flex items-center gap-2">
                <span className="text-sm">🔒</span>
                <p className="text-[11px] text-gray-500 m-0">Your information is secure and never shared.</p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] hover:brightness-110 text-white border-none rounded-xl py-3.5 text-sm font-extrabold cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-[inherit] flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-[10px] text-gray-400 text-center mt-3 m-0">
                By submitting, you agree to our{" "}
                <Link to="/policy/privacy" className="text-blue-600 font-semibold no-underline hover:underline">Privacy Policy</Link>
              </p>
            </form>
          </div>

          <div className="flex flex-col gap-4">
            <div id="office" className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-extrabold text-gray-900 m-0 mb-3 flex items-center gap-2">
                <span>📍</span> Our Office
              </h3>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3 mb-3">
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider m-0 mb-1">
                  Quleep Pvt Ltd
                </p>
                <p className="text-sm font-bold text-gray-900 m-0">Bhutani Alphathum</p>
                <p className="text-xs text-gray-600 m-0 mt-1 leading-relaxed">
                  1432 B-Wing, Sector 90<br />Noida, UP – 201305, India
                </p>
              </div>
              <div className="rounded-lg overflow-hidden border border-gray-200 h-40 mb-3">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.7127041640254!2d77.38799!3d28.602!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce5a43173357b%3A0x1ff7c3e1f81f3f25!2sBhutani%20Alphathum!5e0!3m2!1sen!2sin"
                  width="100%" height="100%" className="border-0" loading="lazy" title="Office"
                />
              </div>
              <a
                href="https://www.google.com/maps/dir//Bhutani+Alphathum,+Sector+90,+Noida"
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-1.5 bg-gray-50 text-gray-700 no-underline py-2.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-100 transition"
              >
                🧭 Get Directions
              </a>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-extrabold text-gray-900 m-0 mb-3 flex items-center gap-2">
                <span>🕐</span> Business Hours
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  { day: "Mon - Sat", time: "10:00 AM - 7:00 PM", open: true },
                  { day: "Sunday", time: "Closed", open: false },
                ].map((s) => (
                  <div key={s.day} className={`flex justify-between items-center px-3 py-2.5 rounded-lg border ${s.open ? "bg-gray-50 border-gray-200" : "bg-red-50 border-red-200"}`}>
                    <span className="text-xs font-bold text-gray-900">{s.day}</span>
                    <span className={`text-xs font-bold ${s.open ? "text-green-600" : "text-red-600"}`}>{s.time}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center gap-2">
                <span className="text-sm">📧</span>
                <p className="text-[11px] text-amber-800 font-semibold m-0">Email support available 24/7</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#0F172A] rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-10 h-10 rounded-lg overflow-hidden ring-1 ring-blue-400/40 shadow-md shrink-0">
                    <img src={PlatformLogo} alt="shop.design" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white m-0 flex items-center gap-2">
                      <span>⚡</span> Quick Help
                    </h3>
                    <p className="text-[10px] text-blue-300/60 m-0 font-semibold">shop.design support</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Help Center", path: "/help", icon: "💬" },
                    { label: "Track Order", path: "/orders", icon: "📦" },
                    { label: "Return Policy", path: "/policy/returns", icon: "🔄" },
                    { label: "Shipping Info", path: "/policy/shipping-info", icon: "🚚" },
                  ].map((link) => (
                    <Link
                      key={link.label}
                      to={link.path}
                      className="flex items-center gap-2.5 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white no-underline text-xs font-semibold hover:bg-white/10 transition"
                    >
                      <span className="text-sm">{link.icon}</span>
                      <span className="flex-1">{link.label}</span>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;