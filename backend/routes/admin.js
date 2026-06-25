const express = require("express");
const protect = require("../middlewares/authMiddleware");
const authorized = require("../middlewares/roleMiddleware");
const {
  createAdmin,
  getAllAdmins,
  getPendingVendors,
  getAllVendors,
  approveVendor,
  rejectVendor,
  suspendVendor,
  unsuspendVendor,
  updateVendorCommission,
  getAllCustomers,
  getSingleCustomer,
  blockCustomer,
  unblockCustomer,
  deleteCustomer,
  getAdminStats,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/stats", protect, authorized("admin"), getAdminStats);

router.post("/createAdmin", protect, authorized("admin"), createAdmin);
router.get("/admins", protect, authorized("admin"), getAllAdmins);

router.get("/vendors/pending", protect, authorized("admin"), getPendingVendors);
router.get("/vendors/all", protect, authorized("admin"), getAllVendors);
router.put("/vendors/:vendorId/approve", protect, authorized("admin"), approveVendor);
router.put("/vendors/:vendorId/reject", protect, authorized("admin"), rejectVendor);
router.put("/vendors/:vendorId/suspend", protect, authorized("admin"), suspendVendor);
router.put("/vendors/:vendorId/unsuspend", protect, authorized("admin"), unsuspendVendor);
router.put("/vendors/:vendorId/commission", protect, authorized("admin"), updateVendorCommission);

router.get("/customers", protect, authorized("admin"), getAllCustomers);
router.get("/customers/:userId", protect, authorized("admin"), getSingleCustomer);
router.put("/customers/:userId/block", protect, authorized("admin"), blockCustomer);
router.put("/customers/:userId/unblock", protect, authorized("admin"), unblockCustomer);
router.delete("/customers/:userId", protect, authorized("admin"), deleteCustomer);

module.exports = router;