const express = require("express");
const User = require("../models/users");
const protect = require("../middlewares/authMiddleware");
const { getProfile } = require("../controllers/customer");

const router = express.Router();

router.get("/me", protect, getProfile);

module.exports = router;
