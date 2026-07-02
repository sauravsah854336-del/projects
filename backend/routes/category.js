const express = require("express");
const protect = require("../middlewares/authMiddleware");
const authorized = require("../middlewares/roleMiddleware");
const {
  createCategory,
  getAllCategories,
  getCategoryTree,
  getSingleCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  getCategoryStats,
} = require("../controllers/categoryController");

const router = express.Router();

router.get("/", getAllCategories);
router.get("/tree", getCategoryTree);
router.get("/stats", protect, authorized("admin"), getCategoryStats);
router.get("/:slug", getSingleCategory);
router.post("/", protect, authorized("admin"), createCategory);
router.put("/:id", protect, authorized("admin"), updateCategory);
router.put("/:id/restore", protect, authorized("admin"), restoreCategory);
router.delete("/:id", protect, authorized("admin"), deleteCategory);

module.exports = router;