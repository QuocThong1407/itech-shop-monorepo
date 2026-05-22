// backend/src/features/cancellation/cancellationRoutes.js
const express = require("express");
const router = express.Router();
const cancellationController = require("./cancellationController");
const { authenticate, checkRole } = require("../../middleware/index");

// Customer
router.get(
  "/me",
  authenticate,
  checkRole("CUSTOMER"),
  cancellationController.getMyCancellations,
); // GET /api/cancellations/me

// Admin/Seller
router.get(
  "/",
  authenticate,
  checkRole("ADMIN", "SELLER"),
  cancellationController.getAllCancellations,
); // GET /api/cancellations

router.get("/:id", authenticate, cancellationController.getCancellationById); // GET /api/cancellations/:id

router.patch(
  "/:id/status",
  authenticate,
  checkRole("ADMIN", "SELLER"),
  cancellationController.updateCancellationStatus,
); // PATCH /api/cancellations/:id/status

module.exports = router;
