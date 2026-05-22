// backend/src/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const authRoutes = require("./features/auth/authRoutes");
const userRoutes = require("./features/user/userRoutes");
const categoryRoutes = require("./features/category/categoryRoutes");
const addressRoutes = require("./features/address/addressRoutes");
const reviewRoutes = require("./features/review/reviewRoutes");
const promotionRoutes = require("./features/promotion/promotionRoutes");
const couponRoutes = require("./features/coupon/couponRoutes");
const productRoutes = require("./features/product/productRoutes");
const cartRoutes = require("./features/cart/cartRoutes");
const variantRoutes = require("./features/variant/variantRoutes");
const orderRoutes = require("./features/order/orderRoutes");
const returnRoutes = require("./features/return/returnRoutes");
const cancellationRoutes = require("./features/cancellation/cancellationRoutes");
const orderReturnCancelRoutes = require("./features/order/orderReturnCancelRoutes");
const membershipRoutes = require("./features/membership/membershipRoutes");
const reportRoutes = require("./features/report/reportRoutes");
const paymentRoutes = require("./features/payment/paymentRoutes");
const systemRoutes = require("./features/system/systemRoutes");
const { errorHandler, notFoundHandler } = require("./middleware/index");
const app = express();
app.use(helmet());
app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://i-tech-shop-online.vercel.app"
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/variants", variantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/cancellations", cancellationRoutes);
app.use("/api/orders", orderReturnCancelRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/system", systemRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

//xác nhận start
console.log("Server is starting...");
console.log("PORT:", process.env.PORT || 5000);
console.log("Environment:", process.env.NODE_ENV || "development");
module.exports = app;
