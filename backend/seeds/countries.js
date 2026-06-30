const mongoose = require("mongoose");
const Country = require("../models/country");
require("dotenv").config();

const countries = [
  {
    code: "IN",
    name: "India",
    nativeName: "भारत",
    flag: "🇮🇳",
    currency: { code: "INR", symbol: "₹", name: "Indian Rupee" },
    exchangeRate: 1,
    domain: "amazon.in",
    language: "en",
    timezone: "Asia/Kolkata",
    tax: { type: "GST", rate: 18, label: "GST", includedInPrice: true },
    shipping: {
      freeShippingThreshold: 499,
      standardCost: 49,
      expressCost: 99,
      estimatedDays: { standard: 5, express: 2 },
    },
    paymentMethods: ["cod", "card", "upi", "netbanking", "wallet"],
    isDefault: true,
  },
  {
    code: "US",
    name: "United States",
    nativeName: "United States",
    flag: "🇺🇸",
    currency: { code: "USD", symbol: "$", name: "US Dollar" },
    exchangeRate: 0.012,
    domain: "amazon.com",
    language: "en",
    timezone: "America/New_York",
    tax: { type: "Sales Tax", rate: 7.5, label: "Tax", includedInPrice: false },
    shipping: {
      freeShippingThreshold: 25,
      standardCost: 5.99,
      expressCost: 12.99,
      estimatedDays: { standard: 7, express: 3 },
    },
    paymentMethods: ["card", "paypal", "applepay", "googlepay"],
  },
  {
    code: "GB",
    name: "United Kingdom",
    nativeName: "United Kingdom",
    flag: "🇬🇧",
    currency: { code: "GBP", symbol: "£", name: "British Pound" },
    exchangeRate: 0.0094,
    domain: "amazon.co.uk",
    language: "en",
    timezone: "Europe/London",
    tax: { type: "VAT", rate: 20, label: "VAT", includedInPrice: true },
    shipping: {
      freeShippingThreshold: 20,
      standardCost: 3.99,
      expressCost: 7.99,
      estimatedDays: { standard: 5, express: 2 },
    },
    paymentMethods: ["card", "paypal", "applepay"],
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    nativeName: "الإمارات",
    flag: "🇦🇪",
    currency: { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
    exchangeRate: 0.044,
    domain: "amazon.ae",
    language: "ar",
    timezone: "Asia/Dubai",
    tax: { type: "VAT", rate: 5, label: "VAT", includedInPrice: true },
    shipping: {
      freeShippingThreshold: 100,
      standardCost: 15,
      expressCost: 25,
      estimatedDays: { standard: 4, express: 1 },
    },
    paymentMethods: ["cod", "card", "applepay"],
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    nativeName: "السعودية",
    flag: "🇸🇦",
    currency: { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
    exchangeRate: 0.045,
    domain: "amazon.sa",
    language: "ar",
    timezone: "Asia/Riyadh",
    tax: { type: "VAT", rate: 15, label: "VAT", includedInPrice: true },
    shipping: {
      freeShippingThreshold: 200,
      standardCost: 20,
      expressCost: 35,
      estimatedDays: { standard: 5, express: 2 },
    },
    paymentMethods: ["cod", "card"],
  },
  {
    code: "CA",
    name: "Canada",
    nativeName: "Canada",
    flag: "🇨🇦",
    currency: { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    exchangeRate: 0.016,
    domain: "amazon.ca",
    language: "en",
    timezone: "America/Toronto",
    tax: { type: "GST", rate: 13, label: "HST/GST", includedInPrice: false },
    shipping: {
      freeShippingThreshold: 35,
      standardCost: 7.99,
      expressCost: 14.99,
      estimatedDays: { standard: 7, express: 3 },
    },
    paymentMethods: ["card", "paypal"],
  },
  {
    code: "AU",
    name: "Australia",
    nativeName: "Australia",
    flag: "🇦🇺",
    currency: { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    exchangeRate: 0.018,
    domain: "amazon.com.au",
    language: "en",
    timezone: "Australia/Sydney",
    tax: { type: "GST", rate: 10, label: "GST", includedInPrice: true },
    shipping: {
      freeShippingThreshold: 49,
      standardCost: 6.99,
      expressCost: 12.99,
      estimatedDays: { standard: 6, express: 2 },
    },
    paymentMethods: ["card", "paypal"],
  },
  {
    code: "SG",
    name: "Singapore",
    nativeName: "Singapore",
    flag: "🇸🇬",
    currency: { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
    exchangeRate: 0.016,
    domain: "amazon.sg",
    language: "en",
    timezone: "Asia/Singapore",
    tax: { type: "GST", rate: 9, label: "GST", includedInPrice: true },
    shipping: {
      freeShippingThreshold: 40,
      standardCost: 5,
      expressCost: 10,
      estimatedDays: { standard: 3, express: 1 },
    },
    paymentMethods: ["card", "paypal", "applepay"],
  },
  {
    code: "DE",
    name: "Germany",
    nativeName: "Deutschland",
    flag: "🇩🇪",
    currency: { code: "EUR", symbol: "€", name: "Euro" },
    exchangeRate: 0.011,
    domain: "amazon.de",
    language: "de",
    timezone: "Europe/Berlin",
    tax: { type: "VAT", rate: 19, label: "MwSt", includedInPrice: true },
    shipping: {
      freeShippingThreshold: 29,
      standardCost: 3.99,
      expressCost: 6.99,
      estimatedDays: { standard: 4, express: 2 },
    },
    paymentMethods: ["card", "paypal"],
  },
  {
    code: "JP",
    name: "Japan",
    nativeName: "日本",
    flag: "🇯🇵",
    currency: { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    exchangeRate: 1.8,
    domain: "amazon.co.jp",
    language: "ja",
    timezone: "Asia/Tokyo",
    tax: { type: "VAT", rate: 10, label: "消費税", includedInPrice: true },
    shipping: {
      freeShippingThreshold: 2000,
      standardCost: 350,
      expressCost: 700,
      estimatedDays: { standard: 3, express: 1 },
    },
    paymentMethods: ["card", "cod"],
  },
];

const seedCountries = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    await Country.deleteMany({});
    console.log("🗑️  Cleared existing countries");

    await Country.insertMany(countries);
    console.log(`✅ Seeded ${countries.length} countries`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
};

seedCountries();
