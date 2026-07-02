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
  featureProduct,
  delistProduct,
  relistProduct,
  getVendorStats,
  getProductFilters,
  getRelatedProducts,
} = require("../controllers/productController");

const router = express.Router();

router.get("/", getAllProducts);
router.get("/filters", getProductFilters);
router.get("/single/:slug", getSingleProduct);
router.get("/related/:id", getRelatedProducts);
router.get("/vendor/stats", protect, authorized("vendor"), getVendorStats);
router.get("/vendor", protect, authorized("vendor"), getVendorProducts);
router.post("/", protect, authorized("vendor"), createProduct);
router.put("/:id", protect, authorized("vendor"), updateProduct);
router.delete("/:id", protect, authorized("vendor"), deleteProduct);
router.get("/admin/all", protect, authorized("admin"), adminGetAllProducts);
router.put("/admin/:id/feature", protect, authorized("admin"), featureProduct);
router.put("/admin/:id/delist", protect, authorized("admin"), delistProduct);
router.put("/admin/:id/relist", protect, authorized("admin"), relistProduct);

module.exports = router;