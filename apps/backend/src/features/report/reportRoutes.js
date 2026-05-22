const express = require("express");
const router = express.Router();
const reportController = require("./reportController");
const { authenticate, checkRole } = require("../../middleware/index");

router.use(authenticate, checkRole("ADMIN"));

router.get("/revenue", reportController.getRevenueReport);
router.get("/activity", reportController.getActivityReport);

module.exports = router;
