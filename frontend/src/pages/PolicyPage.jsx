import { useParams, Link } from "react-router-dom";
import PlatformLogo from "../assets/PlatformLogo.jpeg";

const policies = {
  "shipping-info": {
    title: "Shipping Information",
    icon: "🚚",
    sections: [
      { heading: "Delivery Time", content: "Standard delivery takes 3-7 business days. Metro cities (Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad) typically receive orders within 3-4 business days. Other cities and towns may take 5-7 business days." },
      { heading: "Shipping Charges", content: "Free shipping on all orders above ₹499. Orders below ₹499 will have a flat shipping charge of ₹49. Some remote areas may have additional delivery charges." },
      { heading: "Delivery Partners", content: "shop.design works with trusted delivery partners to ensure your orders reach you safely and on time. You will receive tracking information once your order is shipped." },
      { heading: "Order Tracking", content: "Once your order is shipped, you can track it from your Orders page. Order status updates are available in real-time on your dashboard." },
      { heading: "International Shipping", content: "Currently we only deliver within India. International shipping will be available soon." },
    ],
  },
  "no-returns": {
    title: "No Returns Policy",
    icon: "🚫",
    sections: [
      { heading: "All Sales Are Final", content: "Please note that all sales on shop.design are final. We do not offer returns, refunds, or exchanges on any products purchased through our marketplace. We encourage all customers to carefully review product details, specifications, images, and vendor information before placing an order." },
      { heading: "Why No Returns?", content: "As a curated multi-vendor design marketplace, shop.design works directly with independent sellers who handle their inventory individually. To keep prices competitive and support our vendors, we have adopted a no-returns policy. This helps us maintain fair pricing and quick order fulfillment across all product categories." },
      { heading: "Before You Order", content: "To ensure you're completely satisfied with your purchase, please: (1) Read the full product description carefully, (2) Check all product images and videos, (3) Review product specifications, dimensions, and materials, (4) Read customer reviews and ratings, (5) Contact the vendor for any clarifications before purchasing." },
      { heading: "Damaged or Wrong Products", content: "If you receive a product that is significantly damaged during shipping or completely different from what was ordered, please contact our support team at info@quleep.in within 24 hours of delivery with clear photos and your order number. Such cases will be reviewed individually and addressed on a case-by-case basis at the platform's discretion." },
      { heading: "Order Cancellation", content: "You can cancel your order before it is shipped. Once an order has been dispatched, cancellation is not possible. To cancel, go to My Orders → Select Order → Click Cancel Order. Cancelled orders (before payment processing) will not be charged." },
      { heading: "Product Warranty", content: "Some products may come with a manufacturer's warranty. Warranty claims should be directed to the manufacturer directly using the details provided in the product package. shop.design is not responsible for handling warranty claims." },
      { heading: "Contact Support", content: "For any queries related to your order or product, please contact our support team at info@quleep.in or +91 98830 19518. We're here to help you make informed purchase decisions." },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    icon: "🔒",
    sections: [
      { heading: "Information We Collect", content: "shop.design collects personal information including your name, email, phone number, shipping address, and payment information when you register and place orders. We also collect browsing data, device information, and cookies for improving your experience." },
      { heading: "How We Use Your Information", content: "Your information is used to process orders, provide customer support, send order updates, personalize your shopping experience, and improve our services. We may also send promotional emails which you can opt out of anytime." },
      { heading: "Data Sharing", content: "We share your information with delivery partners for shipping, payment processors for transactions, and vendors for order fulfillment. We never sell your personal data to third parties for marketing purposes." },
      { heading: "Data Security", content: "We use industry-standard encryption (SSL/TLS) to protect your data during transmission. Your password is hashed and never stored in plain text. We regularly audit our security practices." },
      { heading: "Your Rights", content: "You can access, update, or delete your personal information from your profile settings. You can also request a complete copy of your data or account deletion by contacting our support team." },
      { heading: "Cookies", content: "We use cookies to maintain your session, remember your preferences, and analyze site traffic. You can disable cookies in your browser settings, but some features may not work properly." },
      { heading: "Data Controller", content: "Your personal data is collected and processed by Quleep Private Limited, the parent company of shop.design, having its registered office at Bhutani Alphathum, 1432 B-Wing, Sector 90, Noida – 201305, India." },
    ],
  },
  terms: {
    title: "Terms of Service",
    icon: "📋",
    sections: [
      { heading: "Acceptance of Terms", content: "By accessing and using shop.design (owned and operated by Quleep Pvt Ltd), you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform." },
      { heading: "User Accounts", content: "You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials. You must be at least 13 years old to use our platform." },
      { heading: "Buying", content: "When you place an order, you are making an offer to purchase. We reserve the right to cancel orders due to pricing errors, stock issues, or suspected fraud. Prices are in Indian Rupees and include applicable taxes. All sales are final — please review our No Returns Policy before purchasing." },
      { heading: "Selling", content: "Vendors must provide accurate product information. Listing counterfeit, illegal, or prohibited items will result in immediate account termination. Vendors are responsible for product quality, accurate descriptions, and timely fulfillment." },
      { heading: "No Returns Policy", content: "All sales on shop.design are final. We do not offer returns or refunds on purchased products. Please review product details carefully before placing your order. Cancellations are only allowed before order dispatch." },
      { heading: "Intellectual Property", content: "All content on shop.design including logos, designs, text, and software is the intellectual property of Quleep Pvt Ltd. Product images and descriptions belong to respective vendors. You may not copy or reproduce any content without permission." },
      { heading: "Limitation of Liability", content: "shop.design acts as a marketplace platform. We are not liable for product quality, delivery delays caused by logistics partners, or disputes between buyers and sellers. We will however mediate disputes in good faith on a case-by-case basis." },
      { heading: "Modifications", content: "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Continued use of the platform after changes constitutes acceptance of new terms." },
    ],
  },
  "seller-guidelines": {
    title: "Seller Guidelines",
    icon: "🏪",
    sections: [
      { heading: "Getting Started", content: "Register as a vendor on shop.design with your business details including store name, GST number, and PAN. Your application will be reviewed by our team within 24-48 hours. Once approved, you can start listing products immediately." },
      { heading: "Product Listings", content: "All product listings must have accurate titles, descriptions, images, pricing, and stock information. Use high-quality images showing the actual product. Since we have a no-returns policy, listings must be extremely accurate to prevent customer disputes." },
      { heading: "Pricing", content: "Set competitive prices for your products. You can set a compare price (MRP) and selling price. Prices must include all applicable taxes. Frequent unreasonable price changes may affect your visibility on the platform." },
      { heading: "Order Fulfillment", content: "Process orders within 24 hours of receiving them. Pack products securely to prevent damage during shipping. Provide tracking information once shipped. Delayed fulfillment consistently may affect your seller rating and visibility." },
      { heading: "Product Quality", content: "Maintain high product quality standards. Products must match their listing descriptions exactly. Since we operate a no-returns policy, quality mismatches will result in customer complaints and may lead to product delisting or account suspension." },
      { heading: "Prohibited Items", content: "You cannot sell counterfeit products, illegal items, weapons, drugs, adult content, or any items that violate Indian law. Listing prohibited items will result in immediate permanent account termination." },
      { heading: "Communication", content: "Respond to customer queries promptly, especially pre-purchase questions. Since customers cannot return products, they may ask detailed questions before buying. Maintain professional communication at all times." },
      { heading: "Performance Standards", content: "Maintain an order fulfillment rate above 95%, a complaint rate below 5%, and a customer rating above 3.5 stars. Consistently poor performance will result in account review and possible suspension." },
    ],
  },
  "commission-policy": {
    title: "Commission Policy",
    icon: "💰",
    sections: [
      { heading: "Commission Structure", content: "shop.design charges a commission on each successful sale. The default commission rate is 10% of the product selling price. Commission rates may vary by product category and seller tier." },
      { heading: "Category-wise Commission", content: "Electronics: 8% | Fashion & Apparel: 12% | Furniture & Home: 10% | Books & Stationery: 6% | Beauty & Personal Care: 15% | Sports & Fitness: 10% | Kitchen & Dining: 10% | Home Decor: 12% | Toys & Games: 10%. Rates subject to change with 30 days prior notice." },
      { heading: "Payment Settlement", content: "Vendor earnings (product price minus commission) are settled every 7 days to the registered bank account. Settlements for orders marked as delivered are processed in the next settlement cycle. Minimum settlement amount is ₹100." },
      { heading: "Deductions", content: "Commission is calculated on the selling price excluding shipping charges. Any payment gateway charges for online payments are borne by the platform. Since we have a no-returns policy, there are no commission reversals due to returns." },
      { heading: "TDS Deduction", content: "TDS (Tax Deducted at Source) at 1% will be deducted from vendor settlements as per Income Tax Act Section 194-O. TDS certificates will be provided quarterly. Vendors with valid PAN can claim TDS credit in their ITR." },
      { heading: "Promotional Support", content: "Featured product placement and promotional campaigns are available at additional charges. Sponsored listings start from ₹99 per day. Contact our vendor support team for custom promotional packages." },
    ],
  },
  "vendor-agreement": {
    title: "Vendor Agreement",
    icon: "📝",
    sections: [
      { heading: "Agreement Overview", content: "This Vendor Agreement governs the relationship between shop.design (operated by Quleep Pvt Ltd) and you as a registered vendor. By completing vendor registration, you agree to all terms and conditions outlined in this agreement." },
      { heading: "Vendor Eligibility", content: "To become a vendor you must be at least 18 years old, be a legal resident or registered business in India, possess a valid PAN card, have an active bank account in your name or business name, and provide accurate KYC documents during registration." },
      { heading: "Account Verification", content: "All vendor accounts require document verification before approval. You must provide PAN card, cancelled cheque or bank passbook, and any applicable business registration documents. False documents will result in permanent ban and possible legal action." },
      { heading: "Platform Rights", content: "shop.design reserves the right to approve or reject any vendor application without explanation. We may suspend or terminate vendor accounts that violate our policies, receive excessive complaints, maintain poor performance metrics, or are found to engage in fraudulent activity." },
      { heading: "Vendor Obligations", content: "As a vendor you must maintain accurate product listings, fulfill orders within specified timeframes, maintain stock accuracy, respond to customer queries within 24 hours, ensure product quality matches descriptions exactly (since we have a no-returns policy), and comply with all applicable Indian laws and regulations." },
      { heading: "Intellectual Property", content: "You warrant that all product images, descriptions, and content you upload are either owned by you or you have the right to use them. You grant shop.design a non-exclusive license to display your product content for the purpose of selling on our platform." },
      { heading: "Indemnification", content: "You agree to indemnify shop.design and Quleep Pvt Ltd against any claims, damages, or expenses arising from your products, product defects, IP violations, or breach of this agreement. This includes legal fees and third-party claims." },
      { heading: "Dispute Resolution", content: "Since we operate a no-returns policy, product-related disputes will be reviewed by shop.design support on a case-by-case basis. Our decision is final and binding. Vendor-platform disputes will be resolved under Indian law in the jurisdiction of Uttar Pradesh." },
      { heading: "Termination", content: "Either party may terminate this agreement with 30 days written notice. Immediate termination may occur in cases of fraud, policy violations, or legal violations. Upon termination, pending settlements will be processed within 30 days after deducting any dues." },
    ],
  },
  "vendor-privacy": {
    title: "Vendor Privacy Policy",
    icon: "🛡️",
    sections: [
      { heading: "Vendor Data We Collect", content: "shop.design collects personal and business information during vendor registration including your full name, email address, phone number, PAN number, GST number, bank account details, business address, and identity documents. We also collect transaction data, product listings, and communication logs." },
      { heading: "How We Use Vendor Data", content: "Your information is used for account verification and KYC compliance, processing and settling vendor payments, fraud detection and prevention, tax compliance and TDS processing, providing vendor support, and improving our platform services." },
      { heading: "Document Security", content: "All uploaded documents (PAN card, GST certificate, cancelled cheque) are stored in encrypted form on AWS S3. Access is restricted to authorized personnel only for verification purposes. Documents are never shared with third parties except as required by law." },
      { heading: "Financial Data", content: "Your bank account details are encrypted and stored securely. Account numbers are masked in all displays. Financial data is only used for settlement processing and is shared with our payment processing partners under strict confidentiality agreements." },
      { heading: "Data Sharing", content: "We share vendor data with payment processors for settlements, logistics partners for shipping, government authorities when required by law, and our internal teams for support and fraud prevention. We do not sell vendor data to any third parties." },
      { heading: "Data Retention", content: "We retain vendor account data for 7 years after account closure as required by Indian financial regulations. Transaction records and tax documents are kept for 8 years. You may request deletion of non-regulatory data after account closure." },
      { heading: "Vendor Rights", content: "You have the right to access your personal data, correct inaccurate information, request data export, and request deletion of non-mandatory data. Contact vendor support to exercise these rights. Regulatory and financial data cannot be deleted due to legal obligations." },
      { heading: "Compliance", content: "Our data practices comply with the Information Technology Act 2000, IT (Amendment) Act 2008, and applicable RBI guidelines on data security. We are committed to complying with upcoming Personal Data Protection legislation in India." },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    icon: "🍪",
    sections: [
      { heading: "What Are Cookies", content: "Cookies are small text files stored on your device when you visit shop.design. They help us remember your preferences, maintain your session, and provide a personalized shopping experience. Cookies do not contain personal information like your name or payment details." },
      { heading: "Types of Cookies We Use", content: "Essential Cookies: Required for the website to function properly, including login sessions, shopping cart, and security features. These cannot be disabled. Performance Cookies: Help us understand how visitors use our website, which pages are most popular, and identify technical issues. Functional Cookies: Remember your preferences like language, currency, country, and display settings. Marketing Cookies: Used to show relevant advertisements and measure the effectiveness of our marketing campaigns." },
      { heading: "Third-Party Cookies", content: "We use third-party services that may place cookies on your device. These include Google Analytics for website traffic analysis, payment processors (Cashfree) for secure transactions, social media plugins (Facebook, Instagram, Twitter) for sharing features, and advertising networks for personalized ads. Each third party has their own cookie and privacy policies." },
      { heading: "Cookie Duration", content: "Session Cookies: Temporary cookies that are deleted when you close your browser. Used for maintaining your login session and shopping cart. Persistent Cookies: Remain on your device for a set period (typically 1-12 months). Used for remembering your preferences and providing personalized recommendations." },
      { heading: "Managing Cookies", content: "You can manage cookies through your browser settings. Most browsers allow you to block or delete cookies. However, disabling essential cookies may prevent you from using certain features like the shopping cart and checkout. You can also use browser extensions to manage cookie preferences more granularly." },
      { heading: "Cookie Consent", content: "By continuing to use shop.design, you consent to our use of cookies as described in this policy. You can withdraw your consent at any time by clearing your browser cookies and adjusting your browser settings. We will display a cookie consent banner on your first visit to inform you about our cookie usage." },
      { heading: "Updates to This Policy", content: "We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We encourage you to review this page periodically. The 'Last Updated' date at the top indicates when the policy was last revised." },
    ],
  },
  grievance: {
    title: "Grievance Redressal",
    icon: "⚖️",
    sections: [
      { heading: "Grievance Redressal Mechanism", content: "In accordance with the Information Technology Act, 2000 and the Consumer Protection Act, 2019, shop.design has established a grievance redressal mechanism for resolving user complaints related to products, services, orders, payments, and privacy concerns." },
      { heading: "Grievance Officer", content: "Name: Quleep Support Team. Email: grievance@quleep.in. Phone: +91 98830 19518. Address: Bhutani Alphathum, 1432 B-Wing, Sector 90, Noida – 201305, Uttar Pradesh, India. Working Hours: Monday to Saturday, 9:00 AM to 6:00 PM IST." },
      { heading: "How to File a Grievance", content: "Step 1: Contact our customer support via email at grievance@quleep.in with your order number, account details, and a clear description of your complaint. Step 2: You will receive an acknowledgment within 24 hours with a unique grievance ID. Step 3: Our team will investigate and provide a resolution within 15 business days." },
      { heading: "Types of Grievances", content: "We handle grievances related to: Order-related issues, Payment disputes, Account issues, Damaged or wrong product deliveries, Vendor-related complaints, Privacy and data protection concerns, and Platform-related technical issues." },
      { heading: "Resolution Timeframes", content: "Acknowledgment: Within 24 hours. Initial Response: Within 48 hours. Final Resolution: Within 15 business days for standard grievances, 30 business days for complex cases." },
      { heading: "Escalation Process", content: "Level 1: Customer Support Team. Level 2: Senior Support Manager. Level 3: Grievance Officer. Level 4: Consumer Forum or National Consumer Helpline at 1800-11-4000." },
    ],
  },
  "payment-pricing": {
    title: "Payment & Pricing Policy",
    icon: "💳",
    sections: [
      { heading: "Accepted Payment Methods", content: "shop.design accepts: Credit and Debit Cards (Visa, Mastercard, RuPay, American Express), UPI payments (Google Pay, PhonePe, Paytm, BHIM), Net Banking from all major Indian banks, Digital Wallets, and EMI options on select cards for orders above ₹3,000. All payments are processed securely through Cashfree." },
      { heading: "Pricing", content: "All prices are in Indian Rupees (₹) and include applicable GST unless otherwise stated. Prices are set by individual vendors and may vary. We display both selling price and MRP where applicable." },
      { heading: "Payment Security", content: "All transactions are processed through PCI-DSS compliant gateways. We use 256-bit SSL encryption. We never store complete card details. Two-factor authentication is enabled for all online payments." },
      { heading: "Taxes", content: "GST is applicable on all products as per Indian tax laws. The GST rate varies by product category (5%, 12%, 18%, or 28%). GST amount is included in the displayed price for B2C transactions." },
      { heading: "Failed Payments", content: "If your payment fails, the amount (if debited) will be refunded within 5-7 business days directly by your bank. If the amount is debited but the order is not confirmed, please wait 24 hours for automatic reversal or contact your bank." },
      { heading: "All Sales Final", content: "Please note: Once payment is successful and order is confirmed, all sales are final. shop.design does not offer refunds on purchased products. Please review our No Returns Policy before completing your purchase." },
    ],
  },
  "intellectual-property": {
    title: "Intellectual Property Policy",
    icon: "©️",
    sections: [
      { heading: "Platform IP", content: "The shop.design platform, including its name, logo, website design, source code, and documentation are the exclusive intellectual property of Quleep Private Limited. Unauthorized reproduction or use is strictly prohibited." },
      { heading: "Trademarks", content: "shop.design and related marks are trademarks of Quleep Pvt Ltd. You may not use our trademarks without prior written permission." },
      { heading: "User Content", content: "When you submit content (reviews, photos, ratings), you grant shop.design a non-exclusive, worldwide, royalty-free license to use and display that content on our platform." },
      { heading: "Vendor Content", content: "Vendors are solely responsible for ensuring all uploaded content does not infringe on third-party intellectual property rights." },
      { heading: "Copyright Infringement", content: "If you believe content on shop.design infringes your copyright, send a written notice to ip@quleep.in with identification of the copyrighted work, the infringing URL, and your contact information." },
      { heading: "Counterfeit Products", content: "shop.design has zero tolerance for counterfeit products. Vendors selling counterfeits will be immediately terminated and reported to law enforcement." },
    ],
  },
  "anti-fraud": {
    title: "Anti-Fraud Policy",
    icon: "🛡️",
    sections: [
      { heading: "Our Commitment", content: "shop.design employs advanced fraud detection systems, machine learning algorithms, and a dedicated security team to identify and prevent fraudulent activities." },
      { heading: "Types of Fraud We Monitor", content: "Payment fraud, Account takeover, Seller fraud, Buyer fraud, Identity theft, Phishing attempts, and Manipulation of promotions and coupons." },
      { heading: "Prevention Measures", content: "Real-time transaction monitoring, Two-factor authentication, Device fingerprinting, Behavioral analytics, Address verification, and Manual review of suspicious transactions." },
      { heading: "Reporting Fraud", content: "Report suspicious activity to fraud@quleep.in or call +91 98830 19518. Include order number, description of suspicious activity, and screenshots if available." },
      { heading: "Buyer Protection", content: "Protection against unauthorized transactions, Secure payment processing, and Verified vendor listings. Please note: This does not include a general returns policy — all sales on shop.design are final." },
      { heading: "Consequences", content: "Immediate account suspension, Forfeiture of pending payments, Permanent ban, Reporting to law enforcement, and Civil legal action." },
    ],
  },
  accessibility: {
    title: "Accessibility Statement",
    icon: "♿",
    sections: [
      { heading: "Our Commitment", content: "shop.design is committed to ensuring digital accessibility for people with disabilities. We aim to comply with WCAG 2.1 Level AA guidelines." },
      { heading: "Accessibility Features", content: "Keyboard navigation support, Screen reader compatibility, High contrast mode, Resizable text, Alternative text for images, Clear navigation structure, and Focus indicators." },
      { heading: "Known Limitations", content: "Some third-party content may not be fully accessible. Certain interactive features (3D viewer, AR) may have limited accessibility. PDF invoices are being updated for screen reader compatibility." },
      { heading: "Feedback", content: "Contact us at accessibility@quleep.in or +91 98830 19518. We aim to respond within 2 business days and provide resolution within 10 business days." },
    ],
  },
};

const PolicyPage = () => {
  const { slug } = useParams();
  const policy = policies[slug];

  if (!policy) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center bg-white p-12 rounded-2xl border border-gray-200 max-w-md w-full">
          <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-blue-500/20 shadow-md mx-auto mb-4">
            <img src={PlatformLogo} alt="shop.design" className="w-full h-full object-cover" />
          </div>
          <p className="text-5xl m-0 mb-4">📄</p>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Page Not Found</h2>
          <p className="text-sm text-gray-500 mb-6">The policy page you are looking for does not exist on shop.design.</p>
          <Link to="/" className="inline-block bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] text-white no-underline px-6 py-2.5 rounded-lg font-bold text-sm hover:brightness-110 transition">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isVendorPolicy = ["vendor-agreement", "vendor-privacy", "seller-guidelines", "commission-policy"].includes(slug);

  const allPolicies = [
    { label: "Terms", slug: "terms" },
    { label: "Privacy", slug: "privacy" },
    { label: "Cookies", slug: "cookies" },
    { label: "Shipping", slug: "shipping-info" },
    { label: "No Returns", slug: "no-returns" },
    { label: "Payment", slug: "payment-pricing" },
    { label: "Seller Guide", slug: "seller-guidelines" },
    { label: "Commission", slug: "commission-policy" },
    { label: "Vendor Agreement", slug: "vendor-agreement" },
    { label: "Vendor Privacy", slug: "vendor-privacy" },
    { label: "IP Policy", slug: "intellectual-property" },
    { label: "Anti-Fraud", slug: "anti-fraud" },
    { label: "Grievance", slug: "grievance" },
    { label: "Accessibility", slug: "accessibility" },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
            <Link to="/" className="hover:text-gray-900 no-underline transition-colors">Home</Link>
            <span>›</span>
            <span className="text-gray-900 font-semibold">{policy.title}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg overflow-hidden ring-1 ring-blue-500/20 shadow-md shrink-0 hidden sm:block">
              <img src={PlatformLogo} alt="shop.design" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl sm:hidden">{policy.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xl hidden sm:inline">{policy.icon}</span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 m-0 leading-tight">
                  {policy.title}
                </h1>
              </div>
              <p className="text-xs text-gray-500 m-0 mt-1 flex items-center flex-wrap gap-1">
                <span>
                  <span className="font-bold text-gray-700">shop.design</span> · Last updated:{" "}
                  {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </span>
                {isVendorPolicy && (
                  <span className="inline-flex items-center bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Vendor Policy
                  </span>
                )}
                {slug === "no-returns" && (
                  <span className="inline-flex items-center bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Important
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {slug === "no-returns" && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-2xl shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-extrabold text-red-900 m-0 mb-1">All Sales Are Final</p>
              <p className="text-xs text-red-800 m-0 leading-relaxed">
                shop.design does not accept returns or refunds. Please read this policy carefully before making a purchase.
              </p>
            </div>
          </div>
        )}

        {isVendorPolicy && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-lg shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-bold text-amber-900 m-0 mb-0.5">Important for Vendors</p>
              <p className="text-xs text-amber-800 m-0 leading-relaxed">
                By submitting your vendor application on shop.design, you confirm you have read and agreed to all terms below.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {policy.sections.map((section, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 flex gap-4 items-start hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center shrink-0 border border-blue-100">
                <span className="text-xs font-black text-blue-700">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-gray-900 m-0 mb-2">{section.heading}</h2>
                <p className="text-sm text-gray-600 leading-relaxed m-0">{section.content}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-5 sm:p-6 text-center">
          <div className="w-12 h-12 rounded-lg overflow-hidden ring-2 ring-blue-500/20 shadow-md mx-auto mb-3">
            <img src={PlatformLogo} alt="shop.design" className="w-full h-full object-cover" />
          </div>
          <p className="text-sm text-gray-500 m-0 mb-1">Questions about this policy?</p>
          <a href="mailto:info@quleep.in" className="text-blue-600 font-bold text-sm no-underline hover:underline">
            info@quleep.in
          </a>
          <p className="text-[10px] text-gray-400 m-0 mt-2 uppercase tracking-wider font-bold">
            shop.design · Quleep Pvt Ltd
          </p>

          {isVendorPolicy && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2 justify-center flex-wrap">
              <Link to="/vendor/signup" className="bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] text-white no-underline px-5 py-2 rounded-lg text-sm font-bold hover:brightness-110 transition">
                Register as Vendor
              </Link>
              <Link to="/vendor/login" className="bg-white text-gray-700 no-underline px-5 py-2 rounded-lg text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition">
                Vendor Login
              </Link>
            </div>
          )}
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center mb-3">Other Policies</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {allPolicies
              .filter((p) => p.slug !== slug)
              .map((p) => (
                <Link
                  key={p.slug}
                  to={`/policy/${p.slug}`}
                  className="bg-white text-gray-600 no-underline px-3 py-1.5 rounded-full text-[11px] font-semibold border border-gray-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all"
                >
                  {p.label}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyPage;