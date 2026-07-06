const { S3Client } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET = process.env.S3_BUCKET_NAME;
const S3_BASE_URL = process.env.S3_BASE_URL;

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn("⚠️  AWS credentials missing in .env");
}

if (!S3_BUCKET) {
  console.warn("⚠️  S3_BUCKET_NAME missing in .env");
} else {
  console.log(`✅ S3 configured: ${S3_BUCKET} (${process.env.AWS_REGION})`);
}

module.exports = { s3Client, S3_BUCKET, S3_BASE_URL };