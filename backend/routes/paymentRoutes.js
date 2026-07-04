const express = require("express");
const protect = require("../middlewares/authMiddleware");
const authorized = require("../middlewares/roleMiddleware");
const {
  initiatePayment,
  retryPayment,
  verifyPayment,
  handleWebhook,
  getPaymentStatus,
  getMyPayments,
  adminGetAllPayments,
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/initiate", protect, authorized("customer"), initiatePayment);
router.post("/retry", protect, authorized("customer"), retryPayment);
router.post("/verify", protect, authorized("customer"), verifyPayment);
router.get("/status/:orderId", protect, authorized("customer"), getPaymentStatus);
router.get("/my", protect, authorized("customer"), getMyPayments);

router.get("/admin/all", protect, authorized("admin"), adminGetAllPayments);

router.post(
  "/webhook",
  (req, res, next) => {
    req.rawBody = req.body.toString();
    req.body = JSON.parse(req.rawBody);
    next();
  },
  handleWebhook
);

module.exports = router;