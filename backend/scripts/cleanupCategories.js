require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/category");

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  process.env.DATABASE_URL ||
  process.env.DB_URI ||
  process.env.DB_URL;

const cleanup = async () => {
  try {
    if (!MONGO_URI) {
      console.error("❌ MongoDB URI not found in .env file!");
      console.error("Please make sure your .env has one of these:");
      console.error("  - MONGO_URI");
      console.error("  - MONGODB_URI");
      console.error("  - MONGO_URL");
      console.error("  - DATABASE_URL");
      process.exit(1);
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const inactive = await Category.find({ isActive: false });
    console.log(`📊 Found ${inactive.length} inactive categories:`);

    if (inactive.length === 0) {
      console.log("\n✅ No cleanup needed! Database is clean.");
      process.exit();
    }

    inactive.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.name} (slug: ${c.slug})`);
    });

    console.log("\n🗑️  Deleting inactive categories...");
    const result = await Category.deleteMany({ isActive: false });
    console.log(`✅ Permanently deleted ${result.deletedCount} categories`);
    console.log("✅ You can now add categories with those names again!\n");

    process.exit();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

cleanup();