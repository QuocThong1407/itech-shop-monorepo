// backend/src/features/coupon/couponRoutes.js
const express = require("express");
const router = express.Router();
const couponController = require("./couponController");
const { authenticate, checkRole } = require("../../middleware/index");

router.get("/:id", couponController.getCouponById); // GET /api/coupons/:id
router.post("/validate", authenticate, couponController.validateCoupon); // POST /api/coupons/validate
router.get("/", couponController.getAllCoupons); // GET /api/coupons

// Admin routes
router.use(authenticate, checkRole("ADMIN"));
router.post("/", couponController.createCoupon); // POST /api/coupons
router.get("/promotion/:id", couponController.getCouponsByPromotion); // GET /api/coupons/promotion/:id
router.put("/:id", couponController.updateCoupon); // PUT /api/coupons/:id
router.delete("/:id", couponController.deleteCoupon); // DELETE /api/coupons/:id

module.exports = router;
