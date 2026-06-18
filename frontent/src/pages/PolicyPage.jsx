import { useParams } from "react-router-dom";

const policies = {
  "shipping-info": {
    title: "Shipping Information",
    sections: [
      {
        heading: "Delivery Time",
        content:
          "Standard delivery takes 3-7 business days. Metro cities (Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad) typically receive orders within 3-4 business days. Other cities and towns may take 5-7 business days.",
      },
      {
        heading: "Shipping Charges",
        content:
          "Free shipping on all orders above ₹499. Orders below ₹499 will have a flat shipping charge of ₹49. Some remote areas may have additional delivery charges.",
      },
      {
        heading: "Delivery Partners",
        content:
          "We work with trusted delivery partners to ensure your orders reach you safely and on time. You will receive tracking information once your order is shipped.",
      },
      {
        heading: "Order Tracking",
        content:
          "Once your order is shipped, you can track it from your Orders page. You will also receive email and SMS notifications for order status updates.",
      },
      {
        heading: "International Shipping",
        content:
          "Currently we only deliver within India. International shipping will be available soon.",
      },
    ],
  },
  returns: {
    title: "Returns & Refunds",
    sections: [
      {
        heading: "Return Policy",
        content:
          "We offer a 10-day return policy on most products. Items must be returned in their original condition, unused, and in original packaging. Some categories like innerwear, personal care, and customized products are non-returnable.",
      },
      {
        heading: "How to Return",
        content:
          "Go to My Orders → Select the order → Click Request Return → Provide reason → Our team will arrange pickup within 2-3 business days.",
      },
      {
        heading: "Refund Process",
        content:
          "Once we receive and verify the returned product, refund will be initiated within 5-7 business days. Refunds are processed to the original payment method. Cash on Delivery orders will be refunded to your bank account.",
      },
      {
        heading: "Exchange",
        content:
          "Currently we don't offer direct exchanges. You can return the product and place a new order for the desired item.",
      },
      {
        heading: "Damaged or Defective Products",
        content:
          "If you receive a damaged or defective product, please contact us within 48 hours with photos. We will arrange a free return and full refund or replacement.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "Information We Collect",
        content:
          "We collect personal information including your name, email, phone number, shipping address, and payment information when you register and place orders. We also collect browsing data, device information, and cookies for improving your experience.",
      },
      {
        heading: "How We Use Your Information",
        content:
          "Your information is used to process orders, provide customer support, send order updates, personalize your shopping experience, and improve our services. We may also send promotional emails which you can opt out of anytime.",
      },
      {
        heading: "Data Sharing",
        content:
          "We share your information with delivery partners for shipping, payment processors for transactions, and vendors for order fulfillment. We never sell your personal data to third parties for marketing purposes.",
      },
      {
        heading: "Data Security",
        content:
          "We use industry-standard encryption (SSL/TLS) to protect your data during transmission. Your password is hashed and never stored in plain text. We regularly audit our security practices.",
      },
      {
        heading: "Your Rights",
        content:
          "You can access, update, or delete your personal information from your profile settings. You can also request a complete copy of your data or account deletion by contacting our support team.",
      },
      {
        heading: "Cookies",
        content:
          "We use cookies to maintain your session, remember your preferences, and analyze site traffic. You can disable cookies in your browser settings, but some features may not work properly.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    sections: [
      {
        heading: "Acceptance of Terms",
        content:
          "By accessing and using E-Commerce, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.",
      },
      {
        heading: "User Accounts",
        content:
          "You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials. You must be at least 13 years old to use our platform.",
      },
      {
        heading: "Buying",
        content:
          "When you place an order, you are making an offer to purchase. We reserve the right to cancel orders due to pricing errors, stock issues, or suspected fraud. Prices are in Indian Rupees and include applicable taxes.",
      },
      {
        heading: "Selling",
        content:
          "Vendors must provide accurate product information. Listing counterfeit, illegal, or prohibited items will result in immediate account termination. Vendors are responsible for product quality and timely fulfillment.",
      },
      {
        heading: "Intellectual Property",
        content:
          "All content on E-Commerce including logos, designs, text, and software is our intellectual property. Product images and descriptions belong to respective vendors. You may not copy or reproduce any content without permission.",
      },
      {
        heading: "Limitation of Liability",
        content:
          "E-Commerce acts as a marketplace platform. We are not liable for product quality, delivery delays caused by logistics partners, or disputes between buyers and sellers. We will however mediate disputes in good faith.",
      },
      {
        heading: "Modifications",
        content:
          "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Continued use of the platform after changes constitutes acceptance of new terms.",
      },
    ],
  },
  "seller-guidelines": {
    title: "Seller Guidelines",
    sections: [
      {
        heading: "Getting Started",
        content:
          "Register as a vendor with your business details including store name, GST number, and PAN. Your application will be reviewed by our team. Once approved, you can start listing products.",
      },
      {
        heading: "Product Listings",
        content:
          "All product listings must have accurate titles, descriptions, images, pricing, and stock information. Use high-quality images showing the actual product. Misleading listings will be rejected or removed.",
      },
      {
        heading: "Pricing",
        content:
          "Set competitive prices for your products. You can set a compare price (MRP) and selling price. Prices must include all applicable taxes. Frequent unreasonable price changes may affect your visibility.",
      },
      {
        heading: "Order Fulfillment",
        content:
          "Process orders within 24 hours. Pack products securely to prevent damage during shipping. Provide tracking information once shipped. Delayed fulfillment may affect your seller rating.",
      },
      {
        heading: "Product Quality",
        content:
          "Maintain high product quality standards. Products must match their listing descriptions. High return rates due to quality issues may result in product delisting or account suspension.",
      },
      {
        heading: "Prohibited Items",
        content:
          "You cannot sell counterfeit products, illegal items, weapons, drugs, adult content, or any items that violate Indian law. Listing prohibited items will result in immediate account termination.",
      },
      {
        heading: "Communication",
        content:
          "Respond to customer queries promptly. Maintain professional communication at all times. Do not share personal contact information or attempt to redirect customers off-platform.",
      },
    ],
  },
  "commission-policy": {
    title: "Commission Policy",
    sections: [
      {
        heading: "Commission Structure",
        content:
          "E-Commerce charges a commission on each successful sale. The default commission rate is 10% of the product selling price. Commission rates may vary by category.",
      },
      {
        heading: "Category-wise Commission",
        content:
          "Electronics: 8% | Fashion: 12% | Furniture: 10% | Books: 6% | Beauty: 15% | Sports: 10% | Kitchen: 10% | Home Decor: 12%. These rates are subject to change with prior notice.",
      },
      {
        heading: "Payment Settlement",
        content:
          "Vendor earnings (product price minus commission) are settled every 7 days to the registered bank account. Settlements for orders marked as delivered are processed in the next settlement cycle.",
      },
      {
        heading: "Deductions",
        content:
          "Commission is calculated on the selling price. Shipping charges, if any, are not included in commission calculation. Returns and refunds will result in commission reversal.",
      },
      {
        heading: "Promotional Support",
        content:
          "Featured product placement and promotional campaigns may be available at additional charges. Contact our vendor support team for promotional opportunities and pricing.",
      },
    ],
  },
};

const PolicyPage = () => {
  const { slug } = useParams();
  const policy = policies[slug];

  if (!policy) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">📄</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-500">
          The page you are looking for does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <span className="text-[#D85A30] font-semibold text-sm uppercase tracking-wider">
          Policy
        </span>
        <h1 className="text-4xl font-bold text-gray-900 mt-2">
          {policy.title}
        </h1>
        <p className="text-gray-500 mt-3 text-sm">
          Last updated: {new Date().toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="space-y-6">
        {policy.sections.map((section, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8"
          >
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-[#D85A30]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-[#D85A30] font-bold text-sm">
                  {index + 1}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">
                  {section.heading}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {section.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-gray-50 rounded-2xl p-8 text-center">
        <p className="text-gray-500 text-sm">
          If you have any questions about this policy, please contact us at{" "}
          <a
            href="mailto:support@ecommerce.com"
            className="text-[#D85A30] font-medium"
          >
            info@quleep.in
          </a>
        </p>
      </div>
    </div>
  );
};

export default PolicyPage;