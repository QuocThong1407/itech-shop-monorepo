// backend/src/features/system/systemRoutes.js
const express = require("express");
const router = express.Router();
const systemController = require("./systemController");
const { authenticate, checkRole } = require("../../middleware/index");

router.use(authenticate, checkRole("ADMIN"));

// === GENERAL ROUTES ===
router.get("/", systemController.getAllConfigs); // GET /api/system
router.get("/config/:key", systemController.getConfigByKey); // GET /api/system/config/:key
router.post("/config", systemController.createConfig); // POST /api/system/config
router.put("/config/:id", systemController.updateConfig); // PUT /api/system/config/:id
router.delete("/config/:id", systemController.deleteConfig); // DELETE /api/system/config/:id

// === MEMBERSHIP TIERS ===
router.get("/membership/tiers", systemController.getMembershipTiers); // GET /api/system/membership/tiers
router.put(
  "/membership/tiers/:tierName",
  systemController.upsertMembershipTier,
); // PUT /api/system/membership/tiers/:tierName

// === MEMBERSHIP BENEFITS ===
router.get("/membership/benefits", systemController.getMembershipBenefits); // GET /api/system/membership/benefits
router.put(
  "/membership/benefits/:tierName",
  systemController.upsertMembershipBenefit,
); // PUT /api/system/membership/benefits/:tierName

// === TAX (VAT) ===
router.get("/tax/vat", systemController.getVATRate); // GET /api/system/tax/vat
router.put("/tax/vat", systemController.updateVATRate); // PUT /api/system/tax/vat

// === SHIPPING FEES ===
router.get("/shipping/fees", systemController.getShippingFees); // GET /api/system/shipping/fees
router.put("/shipping/fees/:type", systemController.upsertShippingFee); // PUT /api/system/shipping/fees/:type

module.exports = router;
