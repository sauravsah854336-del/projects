const cron = require("node-cron");
const axios = require("axios");
const { getAllCountries, saveCountry } = require("../models/dynamodb/countryModel");

const updateRatesJob = async () => {
  try {
    console.log("⏰ [CRON] Updating exchange rates...");

    const response = await axios.get("https://api.exchangerate.host/latest?base=INR", { timeout: 10000 });
    const rates = response.data?.rates;
    if (!rates) { console.log("❌ [CRON] No rates received"); return; }

    const countries = await getAllCountries(false);
    let updated = 0;

    for (const country of countries) {
      if (country.currency.code === "INR") {
        await saveCountry({ ...country, exchangeRate: 1, lastRateUpdate: new Date().toISOString() });
        updated++;
      } else if (rates[country.currency.code]) {
        await saveCountry({ ...country, exchangeRate: rates[country.currency.code], lastRateUpdate: new Date().toISOString() });
        updated++;
      }
    }

    console.log(`✅ [CRON] Updated ${updated} country rates`);
  } catch (err) {
    console.error("❌ [CRON] Update failed:", err.message);
  }
};

const startRateUpdateCron = () => {
  cron.schedule("0 0 * * *", updateRatesJob, { timezone: "Asia/Kolkata" });
  console.log("⏰ Cron scheduled: Daily rate updates at midnight IST");
};

module.exports = { startRateUpdateCron, updateRatesJob };