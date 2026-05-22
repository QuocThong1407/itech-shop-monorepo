// backend/src/features/user/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("./userController");
const { authenticate, checkRole } = require("../../middleware/index");
const upload = require("../../middleware/upload");

//current user
router.get("/me", authenticate, userController.getMe);
router.patch("/me", authenticate, userController.updateMe);
router.get("/me/pfp", authenticate, userController.getPfp);
router.post("/me/pfp", authenticate, upload.single("file"), userController.uploadPfp);

//admin only
router.use(authenticate, checkRole("ADMIN"));

router.get("/", userController.getAllUsers); //GET /api/users
router.get("/stats", userController.getUserStats); //GET /api/users/stats
router.get("/:id", userController.getUserById); //GET /api/users/:id
router.post("/", userController.createUser); //POST /api/users
router.put("/:id", userController.updateUser); //PUT /api/users/:id
router.delete("/:id", userController.deleteUser); //DELETE /api/users/:id

module.exports = router;
