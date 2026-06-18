const express = require("express");
const { vendorSignup, vendorLogin } = require("../controllers/vendorAuthController");

const router = express.Router();

router.post("/signup", vendorSignup);
router.post("/login", vendorLogin);

module.exports = router;