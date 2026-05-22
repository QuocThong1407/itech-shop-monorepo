// backend/src/features/cart/cartRoutes.js
const express = require("express");
const router = express.Router();
const cartController = require("./cartController");
const { authenticate, checkRole } = require("../../middleware/index");

router.use(authenticate, checkRole("CUSTOMER"));

router.get("/me", cartController.getMyCart); // GET /api/cart/me
router.post("/items", cartController.addCartItem); // POST /api/cart/items
router.put("/items/:id", cartController.updateCartItem); // PUT /api/cart/items/:id
router.delete("/items/:id", cartController.deleteCartItem); // DELETE /api/cart/items/:id
router.delete("/clear", cartController.clearCart); // DELETE /api/cart/clear

module.exports = router;
