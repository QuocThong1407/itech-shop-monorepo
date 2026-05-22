// backend/src/features/promotion/promotionRoutes.js
const express = require("express");
const router = express.Router();
const promotionController = require("./promotionController");
const { authenticate, checkRole, upload } = require("../../middleware/index");
// Public routes
router.get("/", promotionController.getAllPromotions); // GET /api/promotions
router.get("/stats", promotionController.getPromotionStats); // GET /api/promotions/stats
router.get("/:id", promotionController.getPromotionById); // GET /api/promotions/:id

// Admin only
router.use(authenticate, checkRole("ADMIN"));

router.post("/", upload.single("image"), promotionController.createPromotion); // POST /api/promotions
router.put("/:id", upload.single("image"), promotionController.updatePromotion); // PUT /api/promotions/:id
router.patch("/:id/status", promotionController.updatePromotionStatus); // PATCH /api/promotions/:id/status
router.delete("/:id", promotionController.deletePromotion); // DELETE /api/promotions/:id
router.post("/:id/apply", promotionController.applyPromotionToProducts); // POST /api/promotions/:id/apply
router.post(
  "/:id/apply-categories",
  promotionController.applyPromotionToCategories
); // POST /api/promotions/:id/apply-categories

module.exports = router;
