const multer = require("multer");
const multerS3 = require("multer-s3");
const crypto = require("crypto");
const path = require("path");
const { s3Client, S3_BUCKET } = require("../config/s3");

const generateFileName = (folder) => (req, file, cb) => {
  const uniqueId = crypto.randomUUID();
  const ext = path.extname(file.originalname);
  const fileName = `${folder}/${uniqueId}${ext}`;
  cb(null, fileName);
};

const s3Storage = (folder = "uploads") => 
  multerS3({
    s3: s3Client,
    bucket: S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: generateFileName(folder),
  });

const imageFileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, WebP and GIF images are allowed"), false);
  }
};

const documentFileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, WebP or PDF files are allowed"), false);
  }
};

const upload = multer({
  storage: s3Storage("products"),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const uploadAvatar = multer({
  storage: s3Storage("avatars"),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const uploadDocument = multer({
  storage: s3Storage("documents"),
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const uploadReview = multer({
  storage: s3Storage("reviews"),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = { 
  upload, 
  uploadAvatar,
  uploadDocument, 
  uploadReview 
};