require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client, S3_BUCKET, S3_BASE_URL } = require("../config/s3");
const mime = require("mime-types");
const Product = require("../models/product");

const uploadsDir = path.join(__dirname, "../uploads");

const migrateLocalToS3 = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    if (!fs.existsSync(uploadsDir)) {
      console.log("No uploads folder found");
      process.exit(0);
    }

    const products = await Product.find({
      "images.url": { $regex: "localhost:5005|shop.design247pro" },
    });

    console.log(`Found ${products.length} products with old URLs`);

    let migrated = 0;
    let failed = 0;

    for (const product of products) {
      let hasUpdates = false;

      for (let i = 0; i < product.images.length; i++) {
        const img = product.images[i];

        if (img.url.includes("amazonaws.com")) continue;

        const filename = img.url.split("/uploads/")[1];
        if (!filename) continue;

        const localPath = path.join(uploadsDir, filename);

        if (!fs.existsSync(localPath)) {
          console.log(`  ⚠️  File not found: ${filename}`);
          failed++;
          continue;
        }

        try {
          const fileContent = fs.readFileSync(localPath);
          const contentType = mime.lookup(filename) || "image/jpeg";
          const s3Key = `products/${filename}`;

          await s3Client.send(
            new PutObjectCommand({
              Bucket: S3_BUCKET,
              Key: s3Key,
              Body: fileContent,
              ContentType: contentType,
            })
          );

          const newUrl = `${S3_BASE_URL}/${s3Key}`;
          product.images[i].url = newUrl;
          hasUpdates = true;

          console.log(`  ✅ Migrated: ${filename}`);
          migrated++;
        } catch (err) {
          console.error(`  ❌ Failed: ${filename}`, err.message);
          failed++;
        }
      }

      if (hasUpdates) {
        await product.save();
      }
    }

    console.log("\n═══════════════════════════════");
    console.log(`Migration complete!`);
    console.log(`✅ Migrated: ${migrated}`);
    console.log(`❌ Failed: ${failed}`);
    console.log("═══════════════════════════════");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

migrateLocalToS3();