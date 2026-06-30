const express = require("express");
const protect = require("../middlewares/authMiddleware");
const authorized = require("../middlewares/roleMiddleware");
const {
  getAllCountries,
  getCountryByCode,
  detectUserCountry,
  calculateLocalizedPrice,
  calculateShipping,
  updateExchangeRates,
  adminUpdateCountry,
  toggleCountryStatus,
} = require("../controllers/countryController");

const router = express.Router();

router.get("/", getAllCountries);
router.get("/detect", detectUserCountry);
router.get("/price", calculateLocalizedPrice);
router.get("/shipping", calculateShipping);
router.get("/:code", getCountryByCode);

router.post("/update-rates", protect, authorized("admin"), updateExchangeRates);
router.put("/:code", protect, authorized("admin"), adminUpdateCountry);
router.put("/:code/toggle", protect, authorized("admin"), toggleCountryStatus);

module.exports = router;