// backend/src/features/membership/membershipController.js
const membershipService = require("./membershipService");
const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHelpers");

const getMyMembership = async (req, res) => {
  try {
    const userId = req.user.userId;
    const membership = await membershipService.getMyMembership(userId);
    successResponse(res, 200, membership);
  } catch (error) {
    console.error("Get my membership error:", error);
    errorResponse(
      res,
      error.status || 500,
      error.message || "Failed to get membership",
    );
  }
};

const getTopSpentMembers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
      return errorResponse(res, 400, "Limit must be between 1 and 100");
    }

    const result = await membershipService.getTopSpentMembers(parseInt(limit));
    successResponse(res, 200, result);
  } catch (error) {
    console.error("Get top spent members error:", error);
    errorResponse(res, 500, error.message || "Failed to get top spent members");
  }
};
const getAllMemberships = async (req, res) => {
  try {
    const { page, limit, tier, sort } = req.query;

    const result = await membershipService.getAllMemberships({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      tier,
      sort,
    });

    successResponse(res, 200, result);
  } catch (error) {
    console.error("Get all memberships error:", error);
    errorResponse(res, 500, error.message || "Failed to get memberships");
  }
};
const getMembershipById = async (req, res) => {
  try {
    const { id } = req.params;
    const membership = await membershipService.getMembershipById(id);
    successResponse(res, 200, membership);
  } catch (error) {
    console.error("Get membership by id error:", error);
    errorResponse(
      res,
      error.status || 500,
      error.message || "Failed to get membership",
    );
  }
};
const recalculateAllMemberships = async (req, res) => {
  try {
    const result = await membershipService.recalculateAllMemberships();
    successResponse(res, 200, result, "Memberships recalculated successfully");
  } catch (error) {
    console.error("Recalculate memberships error:", error);
    errorResponse(
      res,
      500,
      error.message || "Failed to recalculate memberships",
    );
  }
};

module.exports = {
  getMyMembership,
  getTopSpentMembers,
  getAllMemberships,
  getMembershipById,
  recalculateAllMemberships,
};
