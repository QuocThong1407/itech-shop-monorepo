// backend/src/features/promotion/promotionController.js
const promotionService = require("./promotionService");
const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHelpers");

const getAllPromotions = async (req, res) => {
  try {
    const { page, limit, status, search } = req.query;
    const result = await promotionService.getAllPromotions({
      page,
      limit,
      status,
      search,
    });
    successResponse(res, 200, result);
  } catch (error) {
    console.error("Get all promotions error:", error);
    errorResponse(res, 500, error.message || "Failed to get promotions");
  }
};

const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await promotionService.getPromotionById(id);
    successResponse(res, 200, promotion);
  } catch (error) {
    console.error("Get promotion error:", error);
    errorResponse(res, 404, error.message || "Promotion not found");
  }
};

const createPromotion = async (req, res) => {
  try {
    const { name, description, startDate, endDate } = req.body;
    if (!name || !startDate || !endDate) {
      return errorResponse(
        res,
        400,
        "Name, start date and end date are required"
      );
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return errorResponse(res, 400, "End date must be after start date");
    }

    const result = await promotionService.createPromotion({
      ...req.body,
      createdBy: req.user.userId,
      file: req.file || null,
    });

    successResponse(res, 201, result, "Promotion created successfully");
  } catch (error) {
    errorResponse(res, 400, error.message || "Failed to create promotion");
  }
};

const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.startDate && updates.endDate) {
      if (new Date(updates.startDate) >= new Date(updates.endDate)) {
        return errorResponse(res, 400, "End date must be after start date");
      }
    }
    const result = await promotionService.updatePromotion(
      id,
      updates,
      req.file || null
    );
    successResponse(res, 200, result, "Promotion updated successfully");
  } catch (error) {
    errorResponse(res, 400, error.message || "Failed to update promotion");
  }
};

const updatePromotionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return errorResponse(res, 400, "Status is required");
    }

    const validStatuses = ["ACTIVE", "INACTIVE", "UPCOMING", "EXPIRED"];
    if (!validStatuses.includes(status)) {
      return errorResponse(
        res,
        400,
        "Invalid status. Must be ACTIVE, INACTIVE, UPCOMING, or EXPIRED"
      );
    }

    const result = await promotionService.updatePromotionStatus(id, status);
    successResponse(res, 200, result, "Promotion status updated successfully");
  } catch (error) {
    console.error("Update promotion status error:", error);
    errorResponse(
      res,
      400,
      error.message || "Failed to update promotion status"
    );
  }
};

const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    await promotionService.deletePromotion(id);
    successResponse(res, 200, null, "Promotion deleted successfully");
  } catch (error) {
    console.error("Delete promotion error:", error);
    errorResponse(res, 400, error.message || "Failed to delete promotion");
  }
};

const applyPromotionToProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return errorResponse(
        res,
        400,
        "Product IDs array is required and must not be empty"
      );
    }

    const result = await promotionService.applyPromotionToProducts(
      id,
      productIds
    );
    successResponse(
      res,
      200,
      result,
      "Promotion applied to products successfully"
    );
  } catch (error) {
    console.error("Apply promotion to products error:", error);
    errorResponse(
      res,
      400,
      error.message || "Failed to apply promotion to products"
    );
  }
};

const applyPromotionToCategories = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryIds } = req.body;

    if (
      !categoryIds ||
      !Array.isArray(categoryIds) ||
      categoryIds.length === 0
    ) {
      return errorResponse(
        res,
        400,
        "Category IDs array is required and must not be empty"
      );
    }

    const result = await promotionService.applyPromotionToCategories(
      id,
      categoryIds
    );
    successResponse(
      res,
      200,
      result,
      "Promotion applied to categories successfully"
    );
  } catch (error) {
    console.error("Apply promotion to categories error:", error);
    errorResponse(
      res,
      400,
      error.message || "Failed to apply promotion to categories"
    );
  }
};

const getPromotionStats = async (req, res) => {
  try {
    const stats = await promotionService.getPromotionStats();
    successResponse(res, 200, stats);
  } catch (error) {
    console.error("Get promotion stats error:", error);
    errorResponse(res, 500, "Failed to get promotion statistics");
  }
};

module.exports = {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  updatePromotionStatus,
  deletePromotion,
  applyPromotionToProducts,
  applyPromotionToCategories,
  getPromotionStats,
};
