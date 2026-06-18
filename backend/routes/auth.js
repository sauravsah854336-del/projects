const express = require("express");
const { signup, login, refresh, logout, verifyToken } = require("../controllers/authControllers");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);
router.get("/verify", protect, verifyToken);

module.exports = router;