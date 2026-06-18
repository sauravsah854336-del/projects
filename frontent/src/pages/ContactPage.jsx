import { useState } from "react";

const ContactPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-2xl border border-gray-100 p-10">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h2>
          <p className="text-gray-500">Thank you for reaching out. We'll get back to you within 24 hours.</p>
          <button onClick={() => setSubmitted(false)} className="mt-6 bg-black text-white px-6 py-3 rounded-xl font-medium">
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <span className="text-[#D85A30] font-semibold text-sm uppercase tracking-wider">Contact</span>
        <h1 className="text-4xl font-bold text-gray-900 mt-2">Get in Touch</h1>
        <p className="text-gray-500 mt-3 max-w-lg mx-auto">Have a question or need help? We'd love to hear from you.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {[
            {
              icon: "📧",
              title: "Email",
              value: "info@quleep.in",
              desc: "We reply within 24 hours",
            },
            {
              icon: "📞",
              title: "Phone",
              value: "+91 98830 19518",
              desc: "Mon-Sat, 9AM-6PM IST",
            },
            {
              icon: "📍",
              title: "Office",
              value: "Bhutani Alphathum, 1432 B-Wing",
              desc: "Sector 90, Noida – 201305",
            },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-2xl border border-gray-100 p-6 flex gap-4">
              <div className="w-12 h-12 bg-[#D85A30]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl">{item.icon}</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{item.title}</h3>
                <p className="text-[#D85A30] font-medium text-sm mt-1">{item.value}</p>
                <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
              </div>
            </div>
          ))}

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-3">Find Us</h3>
            <div className="rounded-xl overflow-hidden h-48 bg-gray-100">
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
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} required placeholder="Your name" className="w-full border border-gray-300 px-4 py-3 rounded-xl outline-none focus:border-[#D85A30]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Email *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="your@email.com" className="w-full border border-gray-300 px-4 py-3 rounded-xl outline-none focus:border-[#D85A30]" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Subject *</label>
                <input name="subject" value={form.subject} onChange={handleChange} required placeholder="How can we help?" className="w-full border border-gray-300 px-4 py-3 rounded-xl outline-none focus:border-[#D85A30]" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Message *</label>
                <textarea name="message" value={form.message} onChange={handleChange} required rows={5} placeholder="Tell us more about your query..." className="w-full border border-gray-300 px-4 py-3 rounded-xl outline-none focus:border-[#D85A30] resize-none" />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-[#D85A30] to-[#e8734d] text-white py-4 rounded-xl font-semibold shadow-lg shadow-[#D85A30]/20 hover:shadow-[#D85A30]/40 transition-all">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;