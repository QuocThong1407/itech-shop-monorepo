// backend/src/features/return/returnController.js
const returnService = require("./returnService");
const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHelpers");

const createReturnRequest = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    if (!reason || reason.trim().length === 0) {
      return errorResponse(res, 400, "Return reason is required");
    }

    if (reason.length > 500) {
      return errorResponse(res, 400, "Reason must not exceed 500 characters");
    }

    const result = await returnService.createReturnRequest(
      orderId,
      reason,
      userId,
    );

    successResponse(res, 201, result, "Return request created successfully");
  } catch (error) {
    console.error("Create return request error:", error);
    errorResponse(
      res,
      error.status || 400,
      error.message || "Failed to create return request",
    );
  }
};

const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!status) {
      return errorResponse(res, 400, "Status is required");
    }

    const validStatuses = ["APPROVED", "REJECTED", "COMPLETED"];

    if (!validStatuses.includes(status)) {
      return errorResponse(
        res,
        400,
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      );
    }

    const result = await returnService.updateReturnStatus(
      id,
      status,
      userId,
      userRole,
    );

    successResponse(res, 200, result, "Return status updated successfully");
  } catch (error) {
    console.error("Update return status error:", error);
    errorResponse(
      res,
      error.status || 400,
      error.message || "Failed to update return status",
    );
  }
};

const getMyReturns = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const userId = req.user.userId;

    const result = await returnService.getMyReturns(userId, {
      page,
      limit,
      status,
    });

    successResponse(res, 200, result);
  } catch (error) {
    console.error("Get my returns error:", error);
    errorResponse(res, 500, error.message || "Failed to get returns");
  }
};

const getAllReturns = async (req, res) => {
  try {
    const { page, limit, status, search } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const result = await returnService.getAllReturns(
      { page, limit, status, search },
      userId,
      userRole,
    );

    successResponse(res, 200, result);
  } catch (error) {
    console.error("Get all returns error:", error);
    errorResponse(res, 500, error.message || "Failed to get returns");
  }
};

const getReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const returnRequest = await returnService.getReturnById(
      id,
      userId,
      userRole,
    );

    successResponse(res, 200, returnRequest);
  } catch (error) {
    console.error("Get return error:", error);
    errorResponse(
      res,
      error.status || 404,
      error.message || "Return request not found",
    );
  }
};

module.exports = {
  createReturnRequest,
  updateReturnStatus,
  getMyReturns,
  getAllReturns,
  getReturnById,
};
