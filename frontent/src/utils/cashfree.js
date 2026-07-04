let cashfreePromise = null;

export const loadCashfreeSDK = () => {
  if (cashfreePromise) return cashfreePromise;

  cashfreePromise = new Promise((resolve, reject) => {
    if (window.Cashfree) {
      console.log("✅ Cashfree SDK already loaded");
      resolve(window.Cashfree);
      return;
    }

    const existingScript = document.querySelector('script[src*="cashfree.js"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.Cashfree) resolve(window.Cashfree);
        else reject(new Error("Cashfree SDK loaded but window.Cashfree not found"));
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;

    script.onload = () => {
      console.log("✅ Cashfree SDK script loaded");
      if (window.Cashfree) {
        resolve(window.Cashfree);
      } else {
        reject(new Error("Cashfree SDK failed to initialize"));
      }
    };

    script.onerror = (err) => {
      console.error("❌ Cashfree SDK script error:", err);
      cashfreePromise = null;
      reject(new Error("Cashfree SDK script could not be loaded. Check your internet connection."));
    };

    document.body.appendChild(script);
  });

  return cashfreePromise;
};

export const openCashfreeCheckout = async ({ paymentSessionId, returnUrl }) => {
  try {
    console.log("🔵 Loading Cashfree SDK...");
    const Cashfree = await loadCashfreeSDK();

    const mode = import.meta.env.VITE_CASHFREE_MODE === "production" ? "production" : "sandbox";
    console.log(`🔵 Cashfree mode: ${mode}`);
    console.log(`🔵 Payment Session ID: ${paymentSessionId}`);
    console.log(`🔵 Return URL: ${returnUrl}`);

    const cashfree = Cashfree({ mode });

    const checkoutOptions = {
      paymentSessionId: paymentSessionId,
      redirectTarget: "_self",
      returnUrl: returnUrl,
    };

    console.log("🔵 Opening Cashfree checkout with options:", checkoutOptions);

    const result = await cashfree.checkout(checkoutOptions);

    console.log("🔵 Cashfree checkout result:", result);

    if (result.error) {
      console.error("❌ Cashfree checkout error:", result.error);
      throw new Error(result.error.message || "Payment failed");
    }

    if (result.redirect) {
      console.log("✅ Cashfree redirecting to payment page");
    }

    return result;
  } catch (err) {
    console.error("❌ openCashfreeCheckout error:", err);
    throw err;
  }
};