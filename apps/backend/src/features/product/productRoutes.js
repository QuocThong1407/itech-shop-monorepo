// backend/src/features/product/productRoutes.js
const express = require("express");
const router = express.Router();
const productController = require("./productController");
const { authenticate, checkRole, upload } = require("../../middleware/index");

// public
router.get("/", productController.getAllProducts); // GET /api/products
router.get("/:id", productController.getProductById); // GET /api/products/:id
// seller only update stock
router.patch(
  "/:id/stock",
  authenticate,
  checkRole("SELLER"),
  productController.updateProductStock,
); // PATCH /api/products/:id/stock

router.put(
  "/:id",
  upload.any(),
  authenticate,
  checkRole("ADMIN", "SELLER"),
  productController.updateProduct,
); // PUT /api/products/:id

// admin only
router.use(authenticate, checkRole("ADMIN"));

router.post("/", upload.any(), productController.createProduct); // POST /api/products
router.delete("/:id", productController.deleteProduct); // DELETE /api/products/:id

module.exports = router;
