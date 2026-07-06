import { Link } from "react-router-dom";

const AboutPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
            <Link
              to="/"
              className="hover:text-gray-900 no-underline transition-colors"
            >
              Home
            </Link>
            <span>›</span>
            <span className="text-gray-900 font-semibold">About Us</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 m-0">
            About E-Commerce
          </h1>
          <p className="text-sm text-gray-500 m-0 mt-1">
            India's growing multi-vendor marketplace
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { icon: "🏪", value: "25+", label: "Verified Sellers" },
            { icon: "📦", value: "260+", label: "Products Listed" },
            { icon: "😊", value: "120+", label: "Happy Customers" },
            { icon: "🌍", value: "60+", label: "PIN Codes Served" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-4 text-center"
            >
              <span className="text-2xl">{stat.icon}</span>
              <p className="text-xl sm:text-2xl font-black text-gray-900 m-0 mt-2">
                {stat.value}
              </p>
              <p className="text-[11px] text-gray-500 font-semibold mt-0.5 m-0">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-extrabold text-gray-900 m-0 mb-3 flex items-center gap-2">
              <span className="text-xl">📖</span> Our Story
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed m-0 mb-3">
              E-Commerce is a modern multi-vendor marketplace that connects
              buyers with verified sellers across India. We believe everyone
              deserves access to quality products at fair prices, delivered
              right to their doorstep.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed m-0">
              Founded with a mission to empower small businesses and independent
              sellers, our platform provides the tools and technology needed to
              reach customers nationwide.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-extrabold text-gray-900 m-0 mb-3 flex items-center gap-2">
              <span className="text-xl">🎯</span> Our Mission
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed m-0 mb-3">
              To create a trusted, transparent, and accessible marketplace where
              sellers can grow their businesses and customers can shop with
              confidence.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed m-0 mb-3">
              We envision a world where every small business has equal access to
              technology and customers, breaking geographical barriers.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["Trust", "Transparency", "Quality", "Innovation"].map((v) => (
                <span
                  key={v}
                  className="text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-full"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-extrabold text-gray-900 m-0 mb-4 flex items-center gap-2">
            <span className="text-xl">✅</span> What We Offer
          </h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              "Wide range of products across 50+ categories",
              "Verified and trusted sellers only",
              "Secure payment options including COD, UPI, Cards",
              "Fast and reliable delivery across India",
              "Easy 10-day return and refund policy",
              "24/7 customer support via email and phone",
              "Best price guarantee with regular deals",
              "Seller tools, analytics & vendor dashboard",
              "Multi-country support with currency conversion",
              "Exclusive coupons and promotional offers",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5 p-2">
                <svg
                  className="w-4 h-4 text-green-500 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-sm text-gray-700 m-0">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-extrabold text-gray-900 m-0 mb-4">
            Our Core Values
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                icon: "🤝",
                title: "Trust & Safety",
                desc: "Every seller is verified. Every transaction is secure. Every customer is protected.",
              },
              {
                icon: "🌟",
                title: "Quality First",
                desc: "High standards through manual seller approval and continuous quality monitoring.",
              },
              {
                icon: "💡",
                title: "Innovation",
                desc: "AI-powered search, multi-currency support, and technology that makes shopping effortless.",
              },
              {
                icon: "🌱",
                title: "Empowerment",
                desc: "Tools, analytics, and a platform to help small businesses reach millions of customers.",
              },
              {
                icon: "🔒",
                title: "Privacy",
                desc: "Industry-standard encryption. We never sell personal information to third parties.",
              },
              {
                icon: "♿",
                title: "Accessibility",
                desc: "Building an inclusive platform everyone can use, regardless of ability.",
              },
            ].map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors"
              >
                <span className="text-2xl">{value.icon}</span>
                <h3 className="text-sm font-extrabold text-gray-900 m-0 mt-2 mb-1.5">
                  {value.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed m-0">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-extrabold text-gray-900 m-0 mb-4 flex items-center gap-2">
            <span className="text-xl">🏢</span> Company Information
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                label: "Registered Office",
                value:
                  "Bhutani Alphathum, 1432 B-Wing, Sector 90, Noida – 201305",
              },
              { label: "Email", value: "info@quleep.in" },
              { label: "Phone", value: "+91 98830 19518" },
              {
                icon: "🌐",
                label: "Website",
                value: "www.quleep.in",
                href: "https://www.quleep.in",
              },
              {
                label: "Working Hours",
                value: "Mon-Sat, 10:00 AM - 7:00 PM IST",
              },
              { label: "Company", value: "Quleep Technologies" },
            ].map((item) => (
              <div key={item.label} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider m-0">
                  {item.label}
                </p>
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-blue-600 no-underline hover:underline m-0 mt-0.5 leading-snug"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="text-sm font-semibold text-gray-800 m-0 mt-0.5 leading-snug">
                    {item.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 sm:p-8 text-center">
          <h2 className="text-xl font-extrabold text-white m-0 mb-2">
            Ready to get started?
          </h2>
          <p className="text-sm text-gray-400 m-0 mb-5">
            Join thousands of happy customers and verified sellers.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              to="/signup"
              className="bg-white text-gray-900 no-underline px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-100 transition"
            >
              Create Account
            </Link>
            <Link
              to="/contact"
              className="bg-white/10 text-white no-underline px-5 py-2.5 rounded-lg text-sm font-semibold border border-white/20 hover:bg-white/20 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
