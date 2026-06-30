const mongoose = require("mongoose");
require("dotenv").config();

const fix = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const products = db.collection("products");

    const total = await products.countDocuments({});
    console.log(`📦 Total products in DB: ${total}`);

    const withoutBasePrice = await products.countDocuments({ 
      basePrice: { $exists: false } 
    });
    console.log(`⚠️ Products without basePrice: ${withoutBasePrice}`);

    if (withoutBasePrice > 0) {
      const result = await products.updateMany(
        { basePrice: { $exists: false } },
        [
          {
            $set: {
              basePrice: "$price",
              baseCurrency: "INR",
            },
          },
        ]
      );
      console.log(`✅ Updated ${result.modifiedCount} products with basePrice`);
    }

    const withNullBasePrice = await products.countDocuments({
      basePrice: null,
    });
    if (withNullBasePrice > 0) {
      const result2 = await products.updateMany(
        { basePrice: null },
        [{ $set: { basePrice: "$price" } }]
      );
      console.log(`✅ Fixed ${result2.modifiedCount} products with null basePrice`);
    }

    const withZeroBasePrice = await products.countDocuments({
      basePrice: 0,
      price: { $gt: 0 },
    });
    if (withZeroBasePrice > 0) {
      const result3 = await products.updateMany(
        { basePrice: 0, price: { $gt: 0 } },
        [{ $set: { basePrice: "$price" } }]
      );
      console.log(`✅ Fixed ${result3.modifiedCount} products with zero basePrice`);
    }

    const sample = await products.find({}).limit(5).toArray();
    console.log("\n📋 Sample products:");
    sample.forEach((p) => {
      console.log(`  ${p.name}`);
      console.log(`    price: ${p.price}`);
      console.log(`    basePrice: ${p.basePrice}`);
      console.log(`    baseCurrency: ${p.baseCurrency || "N/A"}`);
      console.log(`    status: ${p.status}`);
      console.log("");
    });

    console.log("🎉 All products fixed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

fix();