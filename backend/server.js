require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");
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

const app = express();

connectDB();
startRateUpdateCron();
startPaymentCleanupCron();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://recliner-defiance-varied.ngrok-free.dev",
    ],
    credentials: true,
  })
);

app.use(morgan("dev"));

app.use("/api/payment/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running ✅",
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
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Something went wrong",
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});