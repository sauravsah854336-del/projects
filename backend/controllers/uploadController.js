const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client, S3_BUCKET } = require("../config/s3");

const uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: req.file.location,
        filename: req.file.key,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (err) {
    console.error("uploadSingleImage error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No image files provided",
      });
    }

    const uploadedImages = req.files.map((file) => ({
      url: file.location,
      filename: file.key,
      size: file.size,
      mimetype: file.mimetype,
    }));

    return res.status(200).json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      data: uploadedImages,
    });
  } catch (err) {
    console.error("uploadMultipleImages error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: "Filename is required",
      });
    }

    const key = filename.includes("amazonaws.com/") 
      ? filename.split("amazonaws.com/")[1]
      : filename;

    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    await s3Client.send(command);

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (err) {
    console.error("deleteImage error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
};