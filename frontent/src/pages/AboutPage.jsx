const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <span className="text-[#D85A30] font-semibold text-sm uppercase tracking-wider">
          About Us
        </span>
        <h1 className="text-4xl font-bold text-gray-900 mt-2">
          Who We Are
        </h1>
      </div>

      <div className="space-y-8 text-gray-600 leading-relaxed">
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
          <p>
            E-Commerce is a modern multi-vendor marketplace that connects
            buyers with verified sellers across India. We believe everyone
            deserves access to quality products at fair prices, delivered
            right to their doorstep.
          </p>
          <p className="mt-4">
            Founded with a mission to empower small businesses and
            independent sellers, our platform provides the tools and
            technology needed to reach customers nationwide.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p>
            To create a trusted, transparent, and accessible marketplace
            where sellers can grow their businesses and customers can shop
            with confidence.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "🏪",
              value: "1200+",
              label: "Verified Sellers",
              desc: "Trusted vendors across India",
            },
            {
              icon: "📦",
              value: "80K+",
              label: "Products Listed",
              desc: "Across multiple categories",
            },
            {
              icon: "😊",
              value: "50K+",
              label: "Happy Customers",
              desc: "And growing every day",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white rounded-2xl border border-gray-100 p-6 text-center"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <p className="text-3xl font-bold text-[#D85A30]">{item.value}</p>
              <p className="font-semibold text-gray-900 mt-1">{item.label}</p>
              <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What We Offer</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Wide range of products across categories",
              "Verified and trusted sellers only",
              "Secure payment options including COD",
              "Fast and reliable delivery",
              "Easy returns and refund policy",
              "24/7 customer support",
              "Best price guarantee",
              "Seller tools and analytics dashboard",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;