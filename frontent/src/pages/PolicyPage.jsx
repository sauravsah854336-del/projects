import { useParams, Link } from "react-router-dom";

const policies = {
  "shipping-info": {
    title: "Shipping Information",
    icon: "🚚",
    color: "#0066C0",
    bg: "#EFF6FF",
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
    icon: "🔄",
    color: "#059669",
    bg: "#F0FDF4",
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
    icon: "🔒",
    color: "#7C3AED",
    bg: "#F5F3FF",
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
    icon: "📋",
    color: "#D85A30",
    bg: "#FFF5F0",
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
    icon: "🏪",
    color: "#0066C0",
    bg: "#EFF6FF",
    sections: [
      {
        heading: "Getting Started",
        content:
          "Register as a vendor with your business details including store name, GST number, and PAN. Your application will be reviewed by our team within 24-48 hours. Once approved, you can start listing products immediately.",
      },
      {
        heading: "Product Listings",
        content:
          "All product listings must have accurate titles, descriptions, images, pricing, and stock information. Use high-quality images showing the actual product. Misleading listings will be rejected or removed without notice.",
      },
      {
        heading: "Pricing",
        content:
          "Set competitive prices for your products. You can set a compare price (MRP) and selling price. Prices must include all applicable taxes. Frequent unreasonable price changes may affect your visibility on the platform.",
      },
      {
        heading: "Order Fulfillment",
        content:
          "Process orders within 24 hours of receiving them. Pack products securely to prevent damage during shipping. Provide tracking information once shipped. Delayed fulfillment consistently may affect your seller rating and visibility.",
      },
      {
        heading: "Product Quality",
        content:
          "Maintain high product quality standards. Products must match their listing descriptions exactly. High return rates due to quality issues may result in product delisting or account suspension.",
      },
      {
        heading: "Prohibited Items",
        content:
          "You cannot sell counterfeit products, illegal items, weapons, drugs, adult content, or any items that violate Indian law. Listing prohibited items will result in immediate permanent account termination.",
      },
      {
        heading: "Communication",
        content:
          "Respond to customer queries and complaints promptly. Maintain professional communication at all times. Do not share personal contact information or attempt to redirect customers off-platform.",
      },
      {
        heading: "Performance Standards",
        content:
          "Maintain an order fulfillment rate above 95%, a return rate below 10%, and a customer rating above 3.5 stars. Consistently poor performance will result in account review and possible suspension.",
      },
    ],
  },

  "commission-policy": {
    title: "Commission Policy",
    icon: "💰",
    color: "#059669",
    bg: "#F0FDF4",
    sections: [
      {
        heading: "Commission Structure",
        content:
          "E-Commerce charges a commission on each successful sale. The default commission rate is 10% of the product selling price. Commission rates may vary by product category and seller tier.",
      },
      {
        heading: "Category-wise Commission",
        content:
          "Electronics: 8% | Fashion & Apparel: 12% | Furniture & Home: 10% | Books & Stationery: 6% | Beauty & Personal Care: 15% | Sports & Fitness: 10% | Kitchen & Dining: 10% | Home Decor: 12% | Toys & Games: 10%. Rates subject to change with 30 days prior notice.",
      },
      {
        heading: "Payment Settlement",
        content:
          "Vendor earnings (product price minus commission) are settled every 7 days to the registered bank account. Settlements for orders marked as delivered are processed in the next settlement cycle. Minimum settlement amount is ₹100.",
      },
      {
        heading: "Deductions",
        content:
          "Commission is calculated on the selling price excluding shipping charges. Returns and refunds will result in full commission reversal. Any payment gateway charges for online payments are borne by the platform.",
      },
      {
        heading: "TDS Deduction",
        content:
          "TDS (Tax Deducted at Source) at 1% will be deducted from vendor settlements as per Income Tax Act Section 194-O. TDS certificates will be provided quarterly. Vendors with valid PAN can claim TDS credit in their ITR.",
      },
      {
        heading: "Promotional Support",
        content:
          "Featured product placement and promotional campaigns are available at additional charges. Sponsored listings start from ₹99 per day. Contact our vendor support team for custom promotional packages.",
      },
    ],
  },

  "vendor-agreement": {
    title: "Vendor Agreement",
    icon: "📝",
    color: "#7C3AED",
    bg: "#F5F3FF",
    sections: [
      {
        heading: "Agreement Overview",
        content:
          "This Vendor Agreement governs the relationship between E-Commerce Platform and you as a registered vendor. By completing vendor registration, you agree to all terms and conditions outlined in this agreement.",
      },
      {
        heading: "Vendor Eligibility",
        content:
          "To become a vendor you must be at least 18 years old, be a legal resident or registered business in India, possess a valid PAN card, have an active bank account in your name or business name, and provide accurate KYC documents during registration.",
      },
      {
        heading: "Account Verification",
        content:
          "All vendor accounts require document verification before approval. You must provide PAN card, cancelled cheque or bank passbook, and any applicable business registration documents. False documents will result in permanent ban and possible legal action.",
      },
      {
        heading: "Platform Rights",
        content:
          "E-Commerce reserves the right to approve or reject any vendor application without explanation. We may suspend or terminate vendor accounts that violate our policies, receive excessive complaints, maintain poor performance metrics, or are found to engage in fraudulent activity.",
      },
      {
        heading: "Vendor Obligations",
        content:
          "As a vendor you must maintain accurate product listings, fulfill orders within specified timeframes, maintain stock accuracy, respond to customer queries within 24 hours, handle returns according to our return policy, and comply with all applicable Indian laws and regulations.",
      },
      {
        heading: "Intellectual Property",
        content:
          "You warrant that all product images, descriptions, and content you upload are either owned by you or you have the right to use them. You grant E-Commerce a non-exclusive license to display your product content for the purpose of selling on our platform.",
      },
      {
        heading: "Indemnification",
        content:
          "You agree to indemnify E-Commerce against any claims, damages, or expenses arising from your products, product defects, IP violations, or breach of this agreement. This includes legal fees and third-party claims.",
      },
      {
        heading: "Dispute Resolution",
        content:
          "Disputes between vendors and customers will be mediated by E-Commerce support. Our decision in customer disputes is final. Vendor-platform disputes will be resolved under Indian law in the jurisdiction of Maharashtra.",
      },
      {
        heading: "Termination",
        content:
          "Either party may terminate this agreement with 30 days written notice. Immediate termination may occur in cases of fraud, policy violations, or legal violations. Upon termination, pending settlements will be processed within 30 days after deducting any dues.",
      },
    ],
  },

  "vendor-privacy": {
    title: "Vendor Privacy Policy",
    icon: "🛡️",
    color: "#7C3AED",
    bg: "#F5F3FF",
    sections: [
      {
        heading: "Vendor Data We Collect",
        content:
          "We collect personal and business information during vendor registration including your full name, email address, phone number, PAN number, GST number, bank account details, business address, and identity documents. We also collect transaction data, product listings, and communication logs.",
      },
      {
        heading: "How We Use Vendor Data",
        content:
          "Your information is used for account verification and KYC compliance, processing and settling vendor payments, fraud detection and prevention, tax compliance and TDS processing, providing vendor support, and improving our platform services.",
      },
      {
        heading: "Document Security",
        content:
          "All uploaded documents (PAN card, GST certificate, cancelled cheque) are stored in encrypted form. Access is restricted to authorized personnel only for verification purposes. Documents are never shared with third parties except as required by law.",
      },
      {
        heading: "Financial Data",
        content:
          "Your bank account details are encrypted and stored securely. Account numbers are masked in all displays. Financial data is only used for settlement processing and is shared with our payment processing partners under strict confidentiality agreements.",
      },
      {
        heading: "Data Sharing",
        content:
          "We share vendor data with payment processors for settlements, logistics partners for shipping, government authorities when required by law, and our internal teams for support and fraud prevention. We do not sell vendor data to any third parties.",
      },
      {
        heading: "Data Retention",
        content:
          "We retain vendor account data for 7 years after account closure as required by Indian financial regulations. Transaction records and tax documents are kept for 8 years. You may request deletion of non-regulatory data after account closure.",
      },
      {
        heading: "Vendor Rights",
        content:
          "You have the right to access your personal data, correct inaccurate information, request data export, and request deletion of non-mandatory data. Contact vendor support to exercise these rights. Regulatory and financial data cannot be deleted due to legal obligations.",
      },
      {
        heading: "Compliance",
        content:
          "Our data practices comply with the Information Technology Act 2000, IT (Amendment) Act 2008, and applicable RBI guidelines on data security. We are committed to complying with upcoming Personal Data Protection legislation in India.",
      },
    ],
  },
};

const PolicyPage = () => {
  const { slug } = useParams();
  const policy = policies[slug];

  if (!policy) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px", background: "#F3F4F6" }}>
        <div style={{ textAlign: "center", background: "white", padding: "48px 40px", borderRadius: 24, border: "1px solid #E5E7EB", maxWidth: 440 }}>
          <p style={{ fontSize: 52, margin: "0 0 16px" }}>📄</p>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 8px" }}>Page Not Found</h2>
          <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 24px" }}>The policy page you are looking for does not exist.</p>
          <Link to="/" style={{ background: "#111", color: "white", textDecoration: "none", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14 }}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isVendorPolicy = ["vendor-agreement", "vendor-privacy", "seller-guidelines", "commission-policy"].includes(slug);

  return (
    <div style={{ background: "#F3F4F6", minHeight: "100vh" }}>
      <div style={{
        background: `linear-gradient(135deg, ${policy.color}15, ${policy.color}08)`,
        borderBottom: `1px solid ${policy.color}20`,
        padding: "48px 20px",
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            width: 64, height: 64,
            background: policy.bg,
            borderRadius: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: 28,
            border: `1px solid ${policy.color}20`,
          }}>
            {policy.icon}
          </div>

          {isVendorPolicy && (
            <span style={{
              display: "inline-block",
              background: "#7C3AED",
              color: "white",
              fontSize: 11,
              fontWeight: 800,
              padding: "4px 12px",
              borderRadius: 99,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}>
              Vendor Policy
            </span>
          )}

          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#111", margin: "0 0 10px" }}>
            {policy.title}
          </h1>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
            Last updated:{" "}
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 20px" }}>

        {isVendorPolicy && (
          <div style={{
            background: "#FFF7ED",
            border: "1px solid #FED7AA",
            borderRadius: 14,
            padding: "16px 20px",
            marginBottom: 28,
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#92400E", margin: "0 0 4px" }}>
                Important Notice for Vendors
              </p>
              <p style={{ fontSize: 13, color: "#78350F", margin: 0, lineHeight: 1.6 }}>
                Please read this policy carefully before completing your vendor registration. By submitting your application, you confirm that you have read, understood, and agreed to all terms outlined below.
              </p>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {policy.sections.map((section, index) => (
            <div
              key={index}
              style={{
                background: "white",
                borderRadius: 16,
                border: "1px solid #E5E7EB",
                padding: "24px 28px",
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                background: policy.bg,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: `1px solid ${policy.color}20`,
              }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: policy.color }}>
                  {index + 1}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>
                  {section.heading}
                </h2>
                <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.75, margin: 0 }}>
                  {section.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 32,
          background: "white",
          borderRadius: 16,
          border: "1px solid #E5E7EB",
          padding: "28px",
          textAlign: "center",
        }}>
          <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 6px" }}>
            Have questions about this policy?
          </p>
          <a
            href="mailto:info@quleep.in"
            style={{ color: policy.color, fontWeight: 700, fontSize: 15, textDecoration: "none" }}
          >
            info@quleep.in
          </a>

          {isVendorPolicy && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #F3F4F6" }}>
              <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 14px" }}>
                Ready to start selling?
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <Link
                  to="/vendor/signup"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                    color: "white",
                    textDecoration: "none",
                    padding: "10px 24px",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  Register as Vendor
                </Link>
                <Link
                  to="/vendor/login"
                  style={{
                    background: "white",
                    color: "#374151",
                    textDecoration: "none",
                    padding: "10px 24px",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 13,
                    border: "1px solid #E5E7EB",
                  }}
                >
                  Vendor Login
                </Link>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {[
            { label: "Terms of Service", slug: "terms" },
            { label: "Privacy Policy", slug: "privacy" },
            { label: "Seller Guidelines", slug: "seller-guidelines" },
            { label: "Commission Policy", slug: "commission-policy" },
            { label: "Vendor Agreement", slug: "vendor-agreement" },
            { label: "Vendor Privacy", slug: "vendor-privacy" },
            { label: "Returns Policy", slug: "returns" },
            { label: "Shipping Info", slug: "shipping-info" },
          ].filter((p) => p.slug !== slug).map((p) => (
            <Link
              key={p.slug}
              to={`/policy/${p.slug}`}
              style={{
                background: "white",
                color: "#374151",
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid #E5E7EB",
              }}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PolicyPage;