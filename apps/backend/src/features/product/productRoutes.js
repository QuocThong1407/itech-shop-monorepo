// backend/src/features/product/productRoutes.js
const express = require("express");
const multer = require("multer");
const router = express.Router();
const productController = require("./productController");
const { authenticate, checkRole, upload } = require("../../middleware/index");

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const mime = (file.mimetype || "").toLowerCase();
    const originalName = (file.originalname || "").toLowerCase();
    const allowedMimeTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const allowedExtensions = [".csv", ".xlsx"];

    const hasAllowedMime = allowedMimeTypes.includes(mime);
    const hasAllowedExtension = allowedExtensions.some((ext) =>
      originalName.endsWith(ext),
    );

    if (hasAllowedMime || hasAllowedExtension) {
      cb(null, true);
      return;
    }

    cb(new Error("Only CSV and XLSX files are allowed"), false);
  },
});

// public
router.get("/", productController.getAllProducts); // GET /api/products
router.post(
  "/import",
  authenticate,
  checkRole("ADMIN", "SELLER"),
  importUpload.single("file"),
  productController.importProducts,
); // POST /api/products/import
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
