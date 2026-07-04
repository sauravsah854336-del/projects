const axios = require("axios");
const crypto = require("crypto");

const CF_APP_ID = process.env.CASHFREE_APP_ID;
const CF_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CF_API_URL = process.env.CASHFREE_API_URL || "https://sandbox.cashfree.com/pg";
const CF_API_VERSION = process.env.CASHFREE_API_VERSION || "2023-08-01";

const IS_PRODUCTION = CF_API_URL.includes("api.cashfree.com");
const MODE_LABEL = IS_PRODUCTION ? "🔴 PRODUCTION (REAL MONEY)" : "🟢 SANDBOX (TEST)";

const logCashfreeMode = () => {
  console.log("╔═══════════════════════════════════════════════╗");
  console.log(`║  Cashfree Mode: ${MODE_LABEL.padEnd(30)}║`);
  console.log(`║  API URL: ${CF_API_URL.padEnd(36)}║`);
  console.log(`║  App ID: ${(CF_APP_ID?.substring(0, 15) + "...").padEnd(37)}║`);
  console.log("╚═══════════════════════════════════════════════╝");
};

if (CF_APP_ID && CF_SECRET_KEY) {
  logCashfreeMode();
  if (IS_PRODUCTION) {
    console.warn("⚠️  WARNING: Cashfree is in PRODUCTION mode — real money will be charged!");
  }
}

const cfHeaders = () => ({
  "Content-Type": "application/json",
  "x-api-version": CF_API_VERSION,
  "x-client-id": CF_APP_ID,
  "x-client-secret": CF_SECRET_KEY,
});

const createCashfreeOrder = async ({ orderId, amount, customer, returnUrl }) => {
  try {
    if (!CF_APP_ID || !CF_SECRET_KEY) {
      console.error("❌ CASHFREE CREDENTIALS MISSING IN .ENV");
      console.error("CF_APP_ID:", CF_APP_ID ? "SET" : "MISSING");
      console.error("CF_SECRET_KEY:", CF_SECRET_KEY ? "SET" : "MISSING");
      return {
        success: false,
        message: "Cashfree credentials not configured on server",
      };
    }

    const payload = {
      order_id: orderId,
      order_amount: Number(amount.toFixed(2)),
      order_currency: "INR",
      customer_details: {
        customer_id: customer.id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
      },
      order_meta: {
        return_url: `${returnUrl}?order_id={order_id}`,
      },
      order_note: "E-Commerce order payment",
    };

    console.log("═══════════════════════════════════════════════");
    console.log(`🔵 Creating Cashfree Order`);
    console.log(`   Mode:     ${MODE_LABEL}`);
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Amount:   ₹${amount.toFixed(2)}`);
    console.log(`   Customer: ${customer.name} (${customer.phone})`);
    if (IS_PRODUCTION) {
      console.log(`   ⚠️  REAL MONEY WILL BE CHARGED`);
    }
    console.log("═══════════════════════════════════════════════");

    const { data } = await axios.post(`${CF_API_URL}/orders`, payload, {
      headers: cfHeaders(),
    });

    console.log(`✅ Cashfree order created: ${data.cf_order_id}`);
    console.log(`   Session ID: ${data.payment_session_id?.substring(0, 30)}...`);

    return {
      success: true,
      cashfreeOrderId: data.cf_order_id,
      paymentSessionId: data.payment_session_id,
      orderStatus: data.order_status,
      mode: IS_PRODUCTION ? "production" : "sandbox",
    };
  } catch (err) {
    console.error("❌ ═══════ CASHFREE ERROR ═══════");
    console.error("Mode:   ", MODE_LABEL);
    console.error("Status: ", err.response?.status);
    console.error("Data:   ", JSON.stringify(err.response?.data, null, 2));
    console.error("Message:", err.message);
    console.error("═══════════════════════════════════");

    let userMessage = err.response?.data?.message || err.message || "Failed to create Cashfree order";

    if (err.response?.status === 401) {
      userMessage = "Cashfree authentication failed. Please check your API credentials.";
    } else if (err.response?.status === 400 && err.response?.data?.message?.includes("phone")) {
      userMessage = "Invalid phone number. Please use a valid 10-digit Indian mobile number.";
    } else if (err.response?.status === 400 && err.response?.data?.message?.includes("email")) {
      userMessage = "Invalid email address. Please check your email.";
    } else if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
      userMessage = "Cannot reach Cashfree servers. Please check your internet connection.";
    }

    return {
      success: false,
      message: userMessage,
      errorCode: err.response?.data?.code || err.code || "UNKNOWN",
    };
  }
};

const fetchCashfreeOrder = async (orderId) => {
  try {
    const { data } = await axios.get(`${CF_API_URL}/orders/${orderId}`, {
      headers: cfHeaders(),
    });
    return { success: true, data };
  } catch (err) {
    console.error("❌ Cashfree fetchOrder error:", err.response?.data || err.message);
    return {
      success: false,
      message: err.response?.data?.message || "Failed to fetch order",
    };
  }
};

const fetchCashfreePayments = async (orderId) => {
  try {
    const { data } = await axios.get(`${CF_API_URL}/orders/${orderId}/payments`, {
      headers: cfHeaders(),
    });

    console.log(`🔍 Fetched ${data.length} payment(s) for order: ${orderId}`);

    return { success: true, data };
  } catch (err) {
    console.error("❌ Cashfree fetchPayments error:", err.response?.data || err.message);
    return {
      success: false,
      message: err.response?.data?.message || "Failed to fetch payments",
    };
  }
};

const verifyWebhookSignature = (rawBody, signature, timestamp) => {
  try {
    const body = timestamp + rawBody;
    const expected = crypto
      .createHmac("sha256", CF_SECRET_KEY)
      .update(body)
      .digest("base64");
    return expected === signature;
  } catch (err) {
    console.error("Webhook signature verify error:", err);
    return false;
  }
};

const getCashfreeMode = () => ({
  isProduction: IS_PRODUCTION,
  mode: IS_PRODUCTION ? "production" : "sandbox",
  apiUrl: CF_API_URL,
});

module.exports = {
  createCashfreeOrder,
  fetchCashfreeOrder,
  fetchCashfreePayments,
  verifyWebhookSignature,
  getCashfreeMode,
};