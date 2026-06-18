const express = require("express");
const protect = require("../middlewares/authMiddleware");
const authorized = require("../middlewares/roleMiddleware");
const {
  createAdmin,
  getPendingVendors,
  getAllVendors,
  approveVendor,
  rejectVendor,
} = require("../controllers/adminController");

const router = express.Router();

router.post("/createAdmin", protect, authorized("admin"), createAdmin);
router.get("/vendors/pending", protect, authorized("admin"), getPendingVendors);
router.get("/vendors/all", protect, authorized("admin"), getAllVendors);
router.put("/vendors/:vendorId/approve", protect, authorized("admin"), approveVendor);
router.put("/vendors/:vendorId/reject", protect, authorized("admin"), rejectVendor);

module.exports = router;