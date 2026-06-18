import { useState } from "react";

const faqs = [
  {
    category: "Orders",
    questions: [
      {
        q: "How do I place an order?",
        a: "Browse products, add items to cart, proceed to checkout, fill shipping address, select payment method and confirm your order.",
      },
      {
        q: "How can I track my order?",
        a: "Go to My Orders page from your dashboard. You can see the current status of each order including Pending, Processing, Shipped, Out for Delivery, and Delivered.",
      },
      {
        q: "Can I cancel my order?",
        a: "Yes, you can cancel your order if it's still in Pending or Processing status. Go to My Orders, find your order and click Cancel Order.",
      },
    ],
  },
  {
    category: "Payments",
    questions: [
      {
        q: "What payment methods are accepted?",
        a: "We accept Cash on Delivery (COD), UPI, Credit/Debit Cards, Net Banking and Wallet payments.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes, all payments are processed through secure, encrypted payment gateways. We never store your card details.",
      },
    ],
  },
  {
    category: "Shipping",
    questions: [
      {
        q: "How long does delivery take?",
        a: "Standard delivery takes 3-7 business days depending on your location. Metro cities may receive orders faster.",
      },
      {
        q: "Is there free shipping?",
        a: "Yes, we offer free shipping on orders above ₹499. Orders below this amount may have a small delivery charge.",
      },
    ],
  },
  {
    category: "Returns",
    questions: [
      {
        q: "What is your return policy?",
        a: "We offer a 30-day return policy on most products. Items must be unused and in original packaging.",
      },
      {
        q: "How do I return a product?",
        a: "Go to My Orders, select the order, and request a return. Our team will process it within 2-3 business days.",
      },
    ],
  },
  {
    category: "Account",
    questions: [
      {
        q: "How do I create an account?",
        a: "Click on Sign Up, fill in your details including name, email, phone and password. You can start shopping immediately.",
      },
      {
        q: "I forgot my password. What should I do?",
        a: "Click on Forgot Password on the login page. We'll send you a reset link to your registered email address.",
      },
    ],
  },
];

const HelpPage = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState("Orders");

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFaqs = faqs.find((f) => f.category === activeCategory);

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <span className="text-[#D85A30] font-semibold text-sm uppercase tracking-wider">
          Support
        </span>
        <h1 className="text-4xl font-bold text-gray-900 mt-2">Help Center</h1>
        <p className="text-gray-500 mt-3">
          Find answers to commonly asked questions
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {faqs.map((faq) => (
          <button
            key={faq.category}
            onClick={() => {
              setActiveCategory(faq.category);
              setOpenIndex(null);
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeCategory === faq.category
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {faq.category}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredFaqs?.questions.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          >
            <button
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between p-6 text-left bg-transparent border-none cursor-pointer"
            >
              <span className="font-semibold text-gray-900 pr-4">
                {item.q}
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openIndex === index && (
              <div className="px-6 pb-6">
                <p className="text-gray-600 leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 bg-[#D85A30]/5 border border-[#D85A30]/10 rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Still need help?
        </h3>
        <p className="text-gray-500 mb-4">
          Our support team is available Mon-Sat, 9AM-6PM IST
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="mailto:support@ecommerce.com"
            className="bg-[#D85A30] text-white px-6 py-3 rounded-xl font-medium no-underline"
          >
            Email Us
          </a>
          <a
            href="tel:+911234567890"
            className="bg-black text-white px-6 py-3 rounded-xl font-medium no-underline"
          >
            Call Us
          </a>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;