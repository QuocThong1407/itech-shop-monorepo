// backend/src/features/category/categoryRoutes.js
const express = require("express");
const router = express.Router();
const categoryController = require("./categoryController");
const { authenticate, checkRole, upload } = require("../../middleware/index");
const multer = require("multer");
// public
router.get("/", categoryController.getAllCategories); // GET /api/categories
router.get("/stats", categoryController.getCategoryStats); // GET /api/categories/stats
router.get("/:id", categoryController.getCategoryById); // GET /api/categories/:id

// admin only
router.use(authenticate, checkRole("ADMIN"));

router.post("/", upload.single("image"), categoryController.createCategory); // POST /api/categories
router.put("/:id", upload.single("image"), categoryController.updateCategory); // PUT /api/categories/:id
router.delete("/:id", categoryController.deleteCategory); // DELETE /api/categories/:id

module.exports = router;
