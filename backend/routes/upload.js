const express = require("express");
const protect = require("../middlewares/authMiddleware");
const authorized = require("../middlewares/roleMiddleware");
const { upload, uploadAvatar, uploadDocument, uploadReview } = require("../middlewares/upload");
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

router.post(
  "/avatar",
  protect,
  uploadAvatar.single("image"),
  uploadSingleImage
);

router.post(
  "/document",
  uploadDocument.single("image"),
  uploadSingleImage
);

router.post(
  "/review",
  protect,
  authorized("customer"),
  uploadReview.array("images", 5),
  uploadMultipleImages
);

router.delete(
  "/delete",
  protect,
  authorized("vendor", "admin"),
  deleteImage
);

module.exports = router;