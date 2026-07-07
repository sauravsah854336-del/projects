const axios = require("axios");
const {
  getCountryByCode: getCountryByCodeFromDB,
  getAllCountries: getAllCountriesFromDB,
  getDefaultCountry,
  updateCountry: updateCountryInDB,
  saveCountry,
} = require("../models/dynamodb/countryModel");

const getAllCountries = async (req, res) => {
  try {
    const countries = await getAllCountriesFromDB(true);
    return res.status(200).json({ success: true, data: countries });
  } catch (err) {
    console.error("getAllCountries error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getCountryByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const country = await getCountryByCodeFromDB(code);

    if (!country || !country.isActive) {
      return res.status(404).json({ success: false, message: "Country not found" });
    }

    return res.status(200).json({ success: true, data: country });
  } catch (err) {
    console.error("getCountryByCode error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const detectUserCountry = async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress;

    let countryCode = "IN";

    if (ip && !ip.includes("127.0.0.1") && !ip.includes("::1")) {
      try {
        const geoRes = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 3000 });
        countryCode = geoRes.data?.country_code || "IN";
        console.log(`🌍 Detected country: ${countryCode} from IP: ${ip}`);
      } catch (geoErr) {
        console.log("Geo detection failed, using default IN");
      }
    } else {
      console.log("Local IP detected, using default IN");
    }

    let country = await getCountryByCodeFromDB(countryCode);

    if (!country || !country.isActive) {
      country = await getDefaultCountry();
    }

    return res.status(200).json({
      success: true,
      data: country,
      detectedFrom: ip,
    });
  } catch (err) {
    console.error("detectUserCountry error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const calculateLocalizedPrice = async (req, res) => {
  try {
    const { amount, countryCode } = req.query;

    if (!amount || !countryCode) {
      return res.status(400).json({ success: false, message: "Amount and country code required" });
    }

    const country = await getCountryByCodeFromDB(countryCode);

    if (!country) {
      return res.status(404).json({ success: false, message: "Country not found" });
    }

    const baseAmount = Number(amount);
    const convertedAmount = baseAmount * country.exchangeRate;

    const taxAmount = country.tax.includedInPrice
      ? 0
      : (convertedAmount * country.tax.rate) / 100;

    const finalPrice = convertedAmount + taxAmount;

    return res.status(200).json({
      success: true,
      data: {
        original: baseAmount,
        converted: Math.round(convertedAmount * 100) / 100,
        tax: Math.round(taxAmount * 100) / 100,
        taxRate: country.tax.rate,
        taxLabel: country.tax.label,
        taxIncluded: country.tax.includedInPrice,
        final: Math.round(finalPrice * 100) / 100,
        currency: country.currency,
      },
    });
  } catch (err) {
    console.error("calculateLocalizedPrice error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const calculateShipping = async (req, res) => {
  try {
    const { countryCode, orderAmount, method = "standard" } = req.query;

    const country = await getCountryByCodeFromDB(countryCode);

    if (!country) {
      return res.status(404).json({ success: false, message: "Country not found" });
    }

    const amount = Number(orderAmount);
    let shippingCost = 0;
    let isFree = false;

    if (amount >= country.shipping.freeShippingThreshold) {
      isFree = true;
    } else {
      shippingCost = method === "express"
        ? country.shipping.expressCost
        : country.shipping.standardCost;
    }

    return res.status(200).json({
      success: true,
      data: {
        cost: shippingCost,
        isFree,
        method,
        estimatedDays: country.shipping.estimatedDays?.[method] || 7,
        freeShippingThreshold: country.shipping.freeShippingThreshold,
        remainingForFree: Math.max(0, country.shipping.freeShippingThreshold - amount),
        currency: country.currency,
      },
    });
  } catch (err) {
    console.error("calculateShipping error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateExchangeRates = async (req, res) => {
  try {
    console.log("🔄 Fetching latest exchange rates...");

    let rates = null;
    let source = "";

    try {
      const response = await axios.get("https://api.exchangerate.host/latest?base=INR", { timeout: 10000 });
      rates = response.data?.rates;
      source = "exchangerate.host";
    } catch (e) {}

    if (!rates || Object.keys(rates).length === 0) {
      try {
        const fallbackResponse = await axios.get("https://api.frankfurter.app/latest?from=INR", { timeout: 10000 });
        rates = fallbackResponse.data?.rates;
        source = "frankfurter.app";
      } catch (e) {}
    }

    if (!rates) {
      throw new Error("Failed to fetch rates from all sources");
    }

    const countries = await getAllCountriesFromDB(false);
    let updated = 0;
    const failed = [];

    for (const country of countries) {
      if (country.currency.code === "INR") {
        await saveCountry({ ...country, exchangeRate: 1, lastRateUpdate: new Date().toISOString() });
        updated++;
        continue;
      }

      if (rates[country.currency.code]) {
        await saveCountry({
          ...country,
          exchangeRate: rates[country.currency.code],
          lastRateUpdate: new Date().toISOString(),
        });
        updated++;
        console.log(`✅ ${country.currency.code}: ${rates[country.currency.code]}`);
      } else {
        failed.push(country.currency.code);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Updated ${updated} of ${countries.length} country rates`,
      data: { updated, total: countries.length, source, failed, updatedAt: new Date() },
    });
  } catch (err) {
    console.error("❌ updateExchangeRates error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update exchange rates.",
      error: err.message,
    });
  }
};

const adminUpdateCountry = async (req, res) => {
  try {
    const { code } = req.params;
    const updates = req.body;

    if (updates.exchangeRate !== undefined && updates.exchangeRate < 0) {
      return res.status(400).json({ success: false, message: "Exchange rate cannot be negative" });
    }

    const country = await getCountryByCodeFromDB(code);
    if (!country) {
      return res.status(404).json({ success: false, message: "Country not found" });
    }

    updates.lastRateUpdate = new Date().toISOString();

    const updatedCountry = await saveCountry({ ...country, ...updates });

    return res.status(200).json({
      success: true,
      message: "Country updated successfully",
      data: updatedCountry,
    });
  } catch (err) {
    console.error("adminUpdateCountry error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const toggleCountryStatus = async (req, res) => {
  try {
    const { code } = req.params;
    const country = await getCountryByCodeFromDB(code);

    if (!country) {
      return res.status(404).json({ success: false, message: "Country not found" });
    }

    if (country.isDefault && country.isActive) {
      return res.status(400).json({ success: false, message: "Cannot disable default country" });
    }

    const updated = await saveCountry({ ...country, isActive: !country.isActive });

    return res.status(200).json({
      success: true,
      message: `Country ${updated.isActive ? "enabled" : "disabled"} successfully`,
      data: updated,
    });
  } catch (err) {
    console.error("toggleCountryStatus error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllCountries,
  getCountryByCode,
  detectUserCountry,
  calculateLocalizedPrice,
  calculateShipping,
  updateExchangeRates,
  adminUpdateCountry,
  toggleCountryStatus,
};