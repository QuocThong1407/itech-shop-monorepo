// backend/src/features/membership/membershipRoutes.js
const express = require("express");
const router = express.Router();
const membershipController = require("./membershipController");
const { authenticate, checkRole } = require("../../middleware/index");

// Customer xem membership của mình
router.get(
  "/me",
  authenticate,
  checkRole("CUSTOMER"),
  membershipController.getMyMembership,
); // GET /api/memberships/me

// Admin - xem top spent members
router.use(authenticate, checkRole("ADMIN"));

router.get("/top-spent", membershipController.getTopSpentMembers); // GET /api/memberships/top-spent
router.get("/", membershipController.getAllMemberships); // GET /api/memberships/
router.get("/:id", membershipController.getMembershipById); // GET /api/memberships/:id
router.post("/recalculate", membershipController.recalculateAllMemberships);

module.exports = router;
