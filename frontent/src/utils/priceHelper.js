export const convertPrice = (amountInINR, country) => {
  if (!country || !country.exchangeRate) return amountInINR;
  return amountInINR * country.exchangeRate;
};

export const calculateTax = (amount, country) => {
  if (!country?.tax) return 0;
  return (amount * country.tax.rate) / 100;
};

export const calculateFinalPrice = (amountInINR, country) => {
  const converted = convertPrice(amountInINR, country);
  const tax = country.tax.includedInPrice ? 0 : calculateTax(converted, country);
  return converted + tax;
};

export const formatPrice = (amountInINR, country) => {
  if (!country) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amountInINR || 0);
  }

  const converted = convertPrice(amountInINR, country);
  const code = country.currency.code;

  try {
    return new Intl.NumberFormat(getLocale(code), {
      style: "currency",
      currency: code,
      maximumFractionDigits: code === "JPY" ? 0 : 2,
    }).format(converted);
  } catch {
    return `${country.currency.symbol}${converted.toFixed(2)}`;
  }
};

export const getShippingInfo = (orderAmount, country) => {
  if (!country?.shipping) return null;

  const converted = convertPrice(orderAmount, country);
  const isFree = converted >= country.shipping.freeShippingThreshold;

  return {
    isFree,
    standardCost: country.shipping.standardCost,
    expressCost: country.shipping.expressCost,
    estimatedDays: country.shipping.estimatedDays,
    remainingForFree: Math.max(0, country.shipping.freeShippingThreshold - converted),
    threshold: country.shipping.freeShippingThreshold,
  };
};

const getLocale = (code) => {
  const locales = {
    INR: "en-IN", USD: "en-US", EUR: "en-DE", GBP: "en-GB",
    AED: "ar-AE", SAR: "ar-SA", AUD: "en-AU", CAD: "en-CA",
    SGD: "en-SG", JPY: "ja-JP",
  };
  return locales[code] || "en-US";
};

export const PAYMENT_METHODS_INFO = {
  cod: { name: "Cash on Delivery", icon: "💵" },
  card: { name: "Credit/Debit Card", icon: "💳" },
  upi: { name: "UPI", icon: "📱" },
  netbanking: { name: "Net Banking", icon: "🏦" },
  wallet: { name: "Wallet", icon: "👛" },
  paypal: { name: "PayPal", icon: "🅿️" },
  applepay: { name: "Apple Pay", icon: "🍎" },
  googlepay: { name: "Google Pay", icon: "🔵" },
};