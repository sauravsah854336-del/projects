export const formatPrice = (priceInINR, country) => {
  if (!country) {
    return `₹${priceInINR.toLocaleString("en-IN")}`;
  }

  const { currency, exchangeRate = 1 } = country;
  const convertedPrice = priceInINR * exchangeRate;

  const formatters = {
    INR: () => `₹${convertedPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
    USD: () => `$${convertedPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    GBP: () => `£${convertedPrice.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    EUR: () => `€${convertedPrice.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    AED: () => `${currency.symbol} ${convertedPrice.toLocaleString("en-AE", { maximumFractionDigits: 2 })}`,
    SAR: () => `${currency.symbol} ${convertedPrice.toLocaleString("en-SA", { maximumFractionDigits: 2 })}`,
    JPY: () => `¥${convertedPrice.toLocaleString("ja-JP", { maximumFractionDigits: 0 })}`,
    CNY: () => `¥${convertedPrice.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`,
  };

  const formatter = formatters[currency.code];
  if (formatter) return formatter();

  return `${currency.symbol}${convertedPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export const getPriceWithTax = (priceInINR, country) => {
  if (!country) return priceInINR;
  
  const { tax = {}, exchangeRate = 1 } = country;
  const convertedPrice = priceInINR * exchangeRate;
  
  if (tax.includedInPrice) {
    return convertedPrice;
  }
  
  return convertedPrice + (convertedPrice * tax.rate) / 100;
};

export const getTaxAmount = (priceInINR, country) => {
  if (!country?.tax) return 0;
  
  const { tax, exchangeRate = 1 } = country;
  const convertedPrice = priceInINR * exchangeRate;
  
  if (tax.includedInPrice) {
    return (convertedPrice * tax.rate) / (100 + tax.rate);
  }
  
  return (convertedPrice * tax.rate) / 100;
};