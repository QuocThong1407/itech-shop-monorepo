// backend/src/features/user/userController.js
const userService = require("./userService");

const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHelpers");

const getAllUsers = async (req, res) => {
  try {
    const { page, limit, role, search } = req.query;
    const result = await userService.getAllUsers({ page, limit, role, search });
    successResponse(res, 200, result);
  } catch (error) {
    console.error("Get all users error:", error);
    errorResponse(res, 500, error.message || "Failed to get users");
  }
};

const getUserStats = async (req, res) => {
  try {
    const stats = await userService.getUserStats();
    successResponse(res, 200, stats);
  } catch (error) {
    console.error("Get user stats error:", error);
    errorResponse(res, 500, "Failed to get user statistics");
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    successResponse(res, 200, user);
  } catch (error) {
    console.error("Get user error:", error);
    errorResponse(res, 404, error.message || "User not found");
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
      return errorResponse(
        res,
        400,
        "Username, email, password and role are required"
      );
    }
    if (password.length < 8) {
      return errorResponse(res, 400, "Password must be at least 8 characters");
    }
    const validRoles = ["CUSTOMER", "SELLER", "ADMIN"];
    if (!validRoles.includes(role)) {
      return errorResponse(
        res,
        400,
        "Invalid role. Must be CUSTOMER, SELLER, or ADMIN"
      );
    }
    const result = await userService.createUser({
      username,
      email,
      password,
      role,
    });
    successResponse(res, 201, result, "User created successfully");
  } catch (error) {
    console.error("Create user error:", error);
    errorResponse(res, 400, error.message || "Failed to create user");
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const result = await userService.updateUser(id, updates);
    successResponse(res, 200, result, "User updated successfully");
  } catch (error) {
    console.error("Update user error:", error);
    errorResponse(res, 400, error.message || "Failed to update user");
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.userId) {
      return errorResponse(res, 400, "Cannot delete your own account");
    }
    await userService.deleteUser(id);
    successResponse(res, 200, null, "User deleted successfully");
  } catch (error) {
    console.error("Delete user error:", error);
    errorResponse(res, 400, error.message || "Failed to delete user");
  }
};

const getMe = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await userService.getUserById(userId);
    successResponse(res, 200, user);
  } catch (error) {
    console.error("Get me error:", error);
    errorResponse(res, 500, "Failed to get current user");
  }
};

const updateMe = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username } = req.body;

    const user = await userService.updateMe(userId, { username });
    successResponse(res, 200, user, "Profile updated");
  } catch (error) {
    console.error("Update me error:", error);
    errorResponse(res, 400, error.message || "Failed to update profile");
  }
};

const getCustomerProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await userService.getCustomerProfile(userId);
    successResponse(res, 200, result);
  } catch (error) {
    errorResponse(res, 500, error.message || "Failed to get customer profile");
  }
};

const updateCustomerProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { phone, gender, birthday } = req.body;
    const result = await userService.updateCustomerProfile(userId, { phone, gender, birthday });
    successResponse(res, 200, result, "Profile updated");
  } catch (error) {
    errorResponse(res, 400, error.message || "Failed to update profile");
  }
};

module.exports = {
  getAllUsers,
  getUserStats,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  getCustomerProfile,
  updateCustomerProfile
};
