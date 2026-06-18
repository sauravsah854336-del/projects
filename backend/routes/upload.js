const express = require("express");
const protect = require("../middlewares/authMiddleware");
const authorized = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/upload");
const {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
} = require("../controllers/uploadController");

const router = express.Router();

router.post(
  "/single",
  protect,
  authorized("vendor", "admin"),
  upload.single("image"),
  uploadSingleImage
);

router.post(
  "/multiple",
  protect,
  authorized("vendor", "admin"),
  upload.array("images", 10),
  uploadMultipleImages
);

router.delete(
  "/delete",
  protect,
  authorized("vendor", "admin"),
  deleteImage
);

module.exports = router;