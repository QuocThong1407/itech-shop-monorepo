// backend/src/features/variant/variantRoutes.js
const express = require("express");
const router = express.Router();
const variantController = require("./variantController");
const { authenticate, checkRole, upload } = require("../../middleware/index");

// public
router.get("/product/:productId", variantController.getVariantsByProductId); // GET /api/variants/product/:productId

// seller only
router.use(authenticate, checkRole("SELLER", "ADMIN"));

router.post("/", upload.array("images"), variantController.createVariant); // POST /api/variants
router.put("/:id", upload.array("images"), variantController.updateVariant); // PUT /api/variants/:id
router.delete("/:id", variantController.deleteVariant); // DELETE /api/variants/:id

module.exports = router;
