require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const { startRateUpdateCron } = require("./utils/rateUpdateCron");
const { startPaymentCleanupCron } = require("./utils/paymentCleanupCron");

const connectDB = require("./config/db");
const authRouter = require("./routes/auth");
const customerRouter = require("./routes/customer");
const setupRouter = require("./routes/setup");
const adminRouter = require("./routes/admin");
const vendorRouter = require("./routes/vendor");
const categoryRouter = require("./routes/category");
const productRouter = require("./routes/product");
const cartRouter = require("./routes/cart");
const orderRouter = require("./routes/order");
const uploadRouter = require("./routes/upload");
const searchRouter = require("./routes/search");
const reviewRouter = require("./routes/review");
const countryRoutes = require("./routes/countryRoutes");
const couponRoutes = require("./routes/couponRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const PORT = process.env.PORT || 5005;
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";

const app = express();

connectDB();
startRateUpdateCron();
startPaymentCleanupCron();

const s3Configured = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.S3_BUCKET_NAME
);

console.log("═══════════════════════════════════════════════");
console.log(`🚀 Backend Configuration:`);
console.log(`   Environment:  ${IS_PRODUCTION ? "🔴 PRODUCTION" : "🟢 DEVELOPMENT"}`);
console.log(`   Port:         ${PORT}`);
console.log(`   Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
console.log(`   CORS Origin:  ${process.env.CORS_ORIGIN || "http://localhost:5173"}`);
console.log(`   Storage:      ${s3Configured ? "☁️  AWS S3" : "💾 Local Disk"}`);
if (s3Configured) {
  console.log(`   S3 Bucket:    ${process.env.S3_BUCKET_NAME}`);
  console.log(`   S3 Region:    ${process.env.AWS_REGION || "ap-south-1"}`);
}
console.log("═══════════════════════════════════════════════");

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: IS_PRODUCTION ? undefined : false,
  })
);

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (!IS_PRODUCTION && origin.includes("localhost")) {
        return callback(null, true);
      }
      console.warn(`⚠️  CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(morgan(IS_PRODUCTION ? "combined" : "dev"));

app.use("/api/payment/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const uploadsPath = path.join(__dirname, "uploads");
if (!IS_PRODUCTION && fs.existsSync(uploadsPath)) {
  app.use("/uploads", express.static(uploadsPath));
  console.log(`📁 Serving legacy local uploads from: /uploads`);
}

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running ✅",
    environment: NODE_ENV,
    storage: s3Configured ? "s3" : "local",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    storage: s3Configured ? "s3" : "local",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRouter);
app.use("/api/customer", customerRouter);
app.use("/api", setupRouter);
app.use("/api/admin", adminRouter);
app.use("/api/vendor", vendorRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/search", searchRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/countries", countryRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payment", paymentRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API not found",
    path: req.path,
  });
});

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size is 5MB",
    });
  }

  if (err.message?.includes("CORS")) {
    return res.status(403).json({
      success: false,
      message: "CORS: Origin not allowed",
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Something went wrong",
    ...(IS_PRODUCTION ? {} : { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`✅ Ready to accept connections\n`);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});