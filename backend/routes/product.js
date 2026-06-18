const express = require("express");
const protect = require("../middlewares/authMiddleware");
const authorized = require("../middlewares/roleMiddleware");
const {
  createProduct,
  getVendorProducts,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getSingleProduct,
  adminGetAllProducts,
  approveProduct,
  rejectProduct,
  featureProduct,
} = require("../controllers/productController");

const router = express.Router();

router.get("/", getAllProducts);
router.get("/single/:slug", getSingleProduct);

router.post("/", protect, authorized("vendor"), createProduct);
router.get("/vendor", protect, authorized("vendor"), getVendorProducts);
router.put("/:id", protect, authorized("vendor"), updateProduct);
router.delete("/:id", protect, authorized("vendor"), deleteProduct);

router.get("/admin/all", protect, authorized("admin"), adminGetAllProducts);
router.put("/admin/:id/approve", protect, authorized("admin"), approveProduct);
router.put("/admin/:id/reject", protect, authorized("admin"), rejectProduct);
router.put("/admin/:id/feature", protect, authorized("admin"), featureProduct);

module.exports = router;