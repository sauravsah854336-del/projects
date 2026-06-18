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
} = require("../controllers/categoryController");

const router = express.Router();

router.get("/", getAllCategories);
router.get("/tree", getCategoryTree);
router.get("/:slug", getSingleCategory);
router.post("/", protect, authorized("admin"), createCategory);
router.put("/:id", protect, authorized("admin"), updateCategory);
router.delete("/:id", protect, authorized("admin"), deleteCategory);

module.exports = router;