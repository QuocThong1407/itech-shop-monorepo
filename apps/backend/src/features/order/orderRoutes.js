// backend/src/features/order/orderRoutes.js
const express = require("express");
const router = express.Router();
const orderController = require("./orderController");
const { authenticate, checkRole } = require("../../middleware/index");

// Customer
router.post(
  "/",
  authenticate,
  checkRole("CUSTOMER"),
  orderController.createOrder,
); // POST /api/orders
router.get(
  "/me",
  authenticate,
  checkRole("CUSTOMER"),
  orderController.getMyOrders,
); // GET /api/orders/me

router.get("/:id", authenticate, orderController.getOrderById); // GET /api/orders/:id

// selle,admin
router.get(
  "/",
  authenticate,
  checkRole("ADMIN", "SELLER"),
  orderController.getAllOrders,
); // GET /api/orders
router.patch(
  "/:id/status",
  authenticate,
  checkRole("ADMIN", "SELLER"),
  orderController.updateOrderStatus,
); // PATCH /api/orders/:id/status
router.delete("/:id", authenticate, orderController.deleteOrder); // DELETE /api/orders/:id

module.exports = router;
