const Country = require("../models/country");
const axios = require("axios");

const getAllCountries = async (req, res) => {
  try {
    const countries = await Country.find({ isActive: true })
      .sort({ isDefault: -1, name: 1 });

    return res.status(200).json({ success: true, data: countries });
  } catch (err) {
    console.error("getAllCountries error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getCountryByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const country = await Country.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!country) {
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
               req.connection.remoteAddress ||
               req.socket.remoteAddress;

    let countryCode = "IN";

    if (ip && !ip.includes("127.0.0.1") && !ip.includes("::1")) {
      try {
        const geoRes = await axios.get(`https://ipapi.co/${ip}/json/`, {
          timeout: 3000,
        });
        countryCode = geoRes.data?.country_code || "IN";
        console.log(`🌍 Detected country: ${countryCode} from IP: ${ip}`);
      } catch (geoErr) {
        console.log("Geo detection failed, using default IN");
      }
    } else {
      console.log("Local IP detected, using default IN");
    }

    let country = await Country.findOne({
      code: countryCode,
      isActive: true,
    });

    if (!country) {
      country = await Country.findOne({ isDefault: true });
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
      return res.status(400).json({
        success: false,
        message: "Amount and country code required",
      });
    }

    const country = await Country.findOne({
      code: countryCode.toUpperCase(),
    });

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

    const country = await Country.findOne({
      code: countryCode.toUpperCase(),
    });

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
        estimatedDays: country.shipping.estimatedDays[method],
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

    const response = await axios.get(
      "https://api.exchangerate.host/latest?base=INR",
      { timeout: 10000 }
    );

    const rates = response.data?.rates;

    if (!rates || Object.keys(rates).length === 0) {
      console.log("⚠️ Primary API failed, trying fallback...");

      const fallbackResponse = await axios.get(
        "https://api.frankfurter.app/latest?from=INR",
        { timeout: 10000 }
      );

      if (!fallbackResponse.data?.rates) {
        throw new Error("Failed to fetch rates from all sources");
      }

      const fallbackRates = fallbackResponse.data.rates;
      const countries = await Country.find({});
      let updated = 0;
      const failed = [];

      for (const country of countries) {
        if (country.currency.code === "INR") {
          country.exchangeRate = 1;
          country.lastRateUpdate = new Date();
          await country.save();
          updated++;
          continue;
        }

        if (fallbackRates[country.currency.code]) {
          country.exchangeRate = fallbackRates[country.currency.code];
          country.lastRateUpdate = new Date();
          await country.save();
          updated++;
          console.log(`✅ ${country.currency.code}: ${country.exchangeRate}`);
        } else {
          failed.push(country.currency.code);
        }
      }

      return res.status(200).json({
        success: true,
        message: `Updated ${updated} of ${countries.length} country rates (fallback API)`,
        data: {
          updated,
          total: countries.length,
          source: "frankfurter.app",
          failed,
          updatedAt: new Date(),
        },
      });
    }

    const countries = await Country.find({});
    let updated = 0;
    const failed = [];

    for (const country of countries) {
      if (country.currency.code === "INR") {
        country.exchangeRate = 1;
        country.lastRateUpdate = new Date();
        await country.save();
        updated++;
        continue;
      }

      if (rates[country.currency.code]) {
        country.exchangeRate = rates[country.currency.code];
        country.lastRateUpdate = new Date();
        await country.save();
        updated++;
        console.log(`✅ ${country.currency.code}: ${country.exchangeRate}`);
      } else {
        failed.push(country.currency.code);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Updated ${updated} of ${countries.length} country rates`,
      data: {
        updated,
        total: countries.length,
        source: "exchangerate.host",
        failed,
        updatedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("❌ updateExchangeRates error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update exchange rates. Please try again later.",
      error: err.message,
    });
  }
};

const adminUpdateCountry = async (req, res) => {
  try {
    const { code } = req.params;
    const updates = req.body;

    if (updates.exchangeRate !== undefined && updates.exchangeRate < 0) {
      return res.status(400).json({
        success: false,
        message: "Exchange rate cannot be negative",
      });
    }

    const country = await Country.findOneAndUpdate(
      { code: code.toUpperCase() },
      { ...updates, lastRateUpdate: new Date() },
      { new: true, runValidators: true }
    );

    if (!country) {
      return res.status(404).json({ success: false, message: "Country not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Country updated successfully",
      data: country,
    });
  } catch (err) {
    console.error("adminUpdateCountry error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const toggleCountryStatus = async (req, res) => {
  try {
    const { code } = req.params;
    const country = await Country.findOne({ code: code.toUpperCase() });

    if (!country) {
      return res.status(404).json({ success: false, message: "Country not found" });
    }

    if (country.isDefault && country.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot disable default country",
      });
    }

    country.isActive = !country.isActive;
    await country.save();

    return res.status(200).json({
      success: true,
      message: `Country ${country.isActive ? "enabled" : "disabled"} successfully`,
      data: country,
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