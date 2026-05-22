// backend/src/features/payment/paymentRoutes.js
const express = require("express");
const router = express.Router();
const paymentController = require("./paymentController");
const { authenticate, checkRole } = require("../../middleware/index");

// VNPay callbacks
router.get("/vnpay/ipn", paymentController.vnpayIPN); // VNPay IPN callback
router.get("/vnpay/return", paymentController.vnpayReturn); // VNPay return callback

// Customer routes
router.post(
  "/",
  authenticate,
  checkRole("CUSTOMER"),
  paymentController.createPayment,
); // POST /api/payments

// All authenticated users
router.get("/:orderId", authenticate, paymentController.getPaymentByOrderId); // GET /api/payments/:orderId

module.exports = router;
