// backend/src/features/order/orderReturnCancelRoutes.js
const express = require("express");
const router = express.Router();
const returnController = require("../return/returnController");
const cancellationController = require("../cancellation/cancellationController");
const { authenticate, checkRole } = require("../../middleware/index");

// Return request
// POST /api/orders/:id/return/request
router.post(
  "/:id/return/request",
  authenticate,
  checkRole("CUSTOMER"),
  returnController.createReturnRequest,
);

// Cancellation request
// POST /api/orders/:id/cancel/request
router.post(
  "/:id/cancel/request",
  authenticate,
  checkRole("CUSTOMER"),
  cancellationController.createCancellationRequest,
);

module.exports = router;
