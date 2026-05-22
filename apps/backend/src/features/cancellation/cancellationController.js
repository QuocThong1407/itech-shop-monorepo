// backend/src/features/cancellation/cancellationController.js
const cancellationService = require("./cancellationService");
const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHelpers");

const createCancellationRequest = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    if (!reason || reason.trim().length === 0) {
      return errorResponse(res, 400, "Cancellation reason is required");
    }

    if (reason.length > 500) {
      return errorResponse(res, 400, "Reason must not exceed 500 characters");
    }

    const result = await cancellationService.createCancellationRequest(
      orderId,
      reason,
      userId,
    );

    successResponse(
      res,
      201,
      result,
      "Cancellation request created successfully",
    );
  } catch (error) {
    console.error("Create cancellation request error:", error);
    errorResponse(
      res,
      error.status || 400,
      error.message || "Failed to create cancellation request",
    );
  }
};

const updateCancellationStatus = async (req, res) => {
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

    const result = await cancellationService.updateCancellationStatus(
      id,
      status,
      userId,
      userRole,
    );

    successResponse(
      res,
      200,
      result,
      "Cancellation status updated successfully",
    );
  } catch (error) {
    console.error("Update cancellation status error:", error);
    errorResponse(
      res,
      error.status || 400,
      error.message || "Failed to update cancellation status",
    );
  }
};

const getMyCancellations = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const userId = req.user.userId;

    const result = await cancellationService.getMyCancellations(userId, {
      page,
      limit,
      status,
    });

    successResponse(res, 200, result);
  } catch (error) {
    console.error("Get my cancellations error:", error);
    errorResponse(res, 500, error.message || "Failed to get cancellations");
  }
};

const getAllCancellations = async (req, res) => {
  try {
    const { page, limit, status, search } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const result = await cancellationService.getAllCancellations(
      { page, limit, status, search },
      userId,
      userRole,
    );

    successResponse(res, 200, result);
  } catch (error) {
    console.error("Get all cancellations error:", error);
    errorResponse(res, 500, error.message || "Failed to get cancellations");
  }
};

const getCancellationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const cancellation = await cancellationService.getCancellationById(
      id,
      userId,
      userRole,
    );

    successResponse(res, 200, cancellation);
  } catch (error) {
    console.error("Get cancellation error:", error);
    errorResponse(
      res,
      error.status || 404,
      error.message || "Cancellation request not found",
    );
  }
};

module.exports = {
  createCancellationRequest,
  updateCancellationStatus,
  getMyCancellations,
  getAllCancellations,
  getCancellationById,
};
