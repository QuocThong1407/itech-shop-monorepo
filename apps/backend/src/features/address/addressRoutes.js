// backend/src/features/address/addressRoutes.js
const express = require("express");
const router = express.Router();
const addressController = require("./addressController");
const { authenticate } = require("../../middleware/index");

router.use(authenticate);

router.get("/", addressController.getMyAddresses); // GET /api/addresses
router.get("/:id", addressController.getAddressById); // GET /api/addresses/:id
router.post("/", addressController.createAddress); // POST /api/addresses
router.put("/:id", addressController.updateAddress); // PUT /api/addresses/:id
router.delete("/:id", addressController.deleteAddress); // DELETE /api/addresses/:id

module.exports = router;
