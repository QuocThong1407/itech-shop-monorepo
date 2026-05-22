// backend/src/features/auth/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("./authController");
const { authenticate } = require("../../middleware/index");

router.route("/register").post(authController.register); //POST /api/auth/register
router.route("/login").post(authController.login); //POST /api/auth/login
router.route("/forgot-password").post(authController.forgotPassword); //POST /api/auth/forgot-password
router.route("/logout").post(authenticate, authController.logout); //POST /api/auth/logout
router.route("/reset-password").post(authController.resetPassword); //POST /api/auth/reset-password
router.post("/complete-profile", authenticate, authController.completeProfile); // POST /api/auth/complete-profile
module.exports = router;
