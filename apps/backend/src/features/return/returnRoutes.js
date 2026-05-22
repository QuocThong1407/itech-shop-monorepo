// backend/src/features/return/returnRoutes.js
const express = require("express");
const router = express.Router();
const returnController = require("./returnController");
const { authenticate, checkRole } = require("../../middleware/index");

// Customer routes
router.get(
  "/me",
  authenticate,
  checkRole("CUSTOMER"),
  returnController.getMyReturns,
); // GET /api/returns/me

// Admin/Seller routes
router.get(
  "/",
  authenticate,
  checkRole("ADMIN", "SELLER"),
  returnController.getAllReturns,
); // GET /api/returns

router.get("/:id", authenticate, returnController.getReturnById); // GET /api/returns/:id

router.patch(
  "/:id/status",
  authenticate,
  checkRole("ADMIN", "SELLER"),
  returnController.updateReturnStatus,
); // PATCH /api/returns/:id/status

module.exports = router;
