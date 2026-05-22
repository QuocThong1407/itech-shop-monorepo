// backend/src/features/review/reviewRoutes.js
const express = require("express");
const router = express.Router();
const reviewController = require("./reviewController");
const { authenticate, checkRole, upload } = require("../../middleware/index");

// Public
router.get("/", reviewController.getAllReviews); // GET /api/reviews
router.get("/product/:productId", reviewController.getReviewsByProduct); // GET /api/reviews/product/:productId
router.get("/variant/:variantId", reviewController.getReviewsByVariant); // GET /api/reviews/variant/:variantId
router.get("/:id", reviewController.getReviewById); // GET /api/reviews/:id

// Customer
router.post(
  "/",
  authenticate,
  checkRole("CUSTOMER"),
  upload.array("images", 5), // Tối đa 5 ảnh
  reviewController.createReview,
); // POST /api/reviews

router.put(
  "/:id",
  authenticate,
  checkRole("CUSTOMER"),
  upload.array("images", 5),
  reviewController.updateReview,
); // PUT /api/reviews/:id

// Admin
router.delete(
  "/admin/:id",
  authenticate,
  checkRole("ADMIN"),
  reviewController.adminDeleteReview,
); // DELETE /api/reviews/admin/:id

module.exports = router;
