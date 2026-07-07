import { Link } from "react-router-dom";
import PlatformLogo from "../assets/PlatformLogo.jpeg";

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
            About shop.design
          </h1>
          <p className="text-sm text-gray-500 m-0 mt-1">
            India's premium multi-vendor marketplace — Design your space, delivered
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#0F172A] rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-2 ring-blue-400/40 shadow-2xl shadow-blue-500/30 shrink-0">
              <img
                src={PlatformLogo}
                alt="shop.design"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-black text-white m-0 leading-tight">
                shop<span className="text-blue-400">.</span>design
              </h2>
              <p className="text-xs sm:text-sm text-blue-200/80 m-0 mt-1 font-semibold uppercase tracking-wider">
                Design your space, delivered
              </p>
              <p className="text-xs text-blue-300/60 m-0 mt-2">
                A product of{" "}
                <span className="text-white font-bold">Quleep Pvt Ltd</span>
              </p>
            </div>
          </div>
        </div>

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
              <strong className="text-gray-900">shop.design</strong> is a modern
              multi-vendor marketplace built for design-conscious shoppers. We
              connect buyers with verified sellers across India, curating
              furniture, home décor, and lifestyle products that transform
              spaces into homes.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed m-0">
              Crafted by{" "}
              <a
                href="https://www.quleep.in"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 no-underline hover:underline font-semibold"
              >
                Quleep Pvt Ltd
              </a>
              , our platform empowers independent sellers with the tools and
              technology to reach design-loving customers nationwide.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-extrabold text-gray-900 m-0 mb-3 flex items-center gap-2">
              <span className="text-xl">🎯</span> Our Mission
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed m-0 mb-3">
              To make premium design accessible to every home in India. We
              believe great design shouldn't be a luxury — it should be part of
              everyday life.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed m-0 mb-3">
              We envision a world where every home tells a story, and every
              small design business has an equal opportunity to be part of that
              journey.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["Design", "Trust", "Craftsmanship", "Innovation"].map((v) => (
                <span
                  key={v}
                  className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full"
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
              "Curated furniture, décor & lifestyle products",
              "Verified and trusted design sellers only",
              "Secure payments — UPI, Cards, NetBanking",
              "Fast & reliable delivery across India",
              "Easy 10-day return and refund policy",
              "24/7 customer support via email and phone",
              "Best price guarantee with regular deals",
              "Seller dashboard with analytics & insights",
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
                icon: "🎨",
                title: "Design First",
                desc: "High standards through manual seller approval and continuous quality curation.",
              },
              {
                icon: "💡",
                title: "Innovation",
                desc: "AI-powered search, multi-currency support, and technology that makes shopping effortless.",
              },
              {
                icon: "🌱",
                title: "Empowerment",
                desc: "Tools, analytics, and a platform to help small design businesses reach millions.",
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
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
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
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 mb-4">
            <p className="text-xs text-blue-700 font-bold uppercase tracking-wider m-0 mb-1">
              About the Company
            </p>
            <p className="text-sm text-gray-700 m-0 leading-relaxed">
              <strong className="text-gray-900">shop.design</strong> is
              owned and operated by{" "}
              <strong className="text-blue-700">Quleep Private Limited</strong>,
              a technology company building modern digital products for
              India and beyond.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                label: "Registered Office",
                value:
                  "Bhutani Alphathum, 1432 B-Wing, Sector 90, Noida – 201305",
              },
              { label: "Email", value: "info@quleep.in" },
              { label: "Phone", value: "+91 9804999555" },
              {
                label: "Website",
                value: "www.quleep.in",
                href: "https://www.quleep.in",
              },
              {
                label: "Working Hours",
                value: "Mon-Sat, 10:00 AM - 7:00 PM IST",
              },
              { label: "Parent Company", value: "Quleep Pvt Ltd" },
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

        <div className="bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#0F172A] rounded-xl p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-blue-400/40 shadow-lg mx-auto mb-4">
              <img
                src={PlatformLogo}
                alt="shop.design"
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-xl font-extrabold text-white m-0 mb-2">
              Ready to design your space?
            </h2>
            <p className="text-sm text-blue-200/80 m-0 mb-5">
              Join thousands of happy customers and verified sellers on{" "}
              <span className="text-blue-400 font-bold">shop.design</span>
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                to="/signup"
                className="bg-white text-gray-900 no-underline px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-100 transition shadow-lg"
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
    </div>
  );
};

export default AboutPage;