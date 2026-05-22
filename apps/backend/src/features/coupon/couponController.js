// backend/src/features/coupon/couponController.js
const couponService = require("./couponService");
const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHelpers");

const createCoupon = async (req, res) => {
  try {
    const { promotionId, code, discountPercentage, maxUsage } = req.body;

    if (!promotionId || !code || !discountPercentage || !maxUsage) {
      return errorResponse(
        res,
        400,
        "Promotion ID, code, discount percentage and max usage are required",
      );
    }

    if (discountPercentage <= 0 || discountPercentage > 100) {
      return errorResponse(
        res,
        400,
        "Discount percentage must be between 0 and 100",
      );
    }

    if (maxUsage < 1) {
      return errorResponse(res, 400, "Max usage must be at least 1");
    }

    const result = await couponService.createCoupon({
      promotionId,
      code,
      discountPercentage,
      maxUsage,
    });

    successResponse(res, 201, result, "Coupon created successfully");
  } catch (error) {
    console.error("Create coupon error:", error);
    errorResponse(res, 400, error.message || "Failed to create coupon");
  }
};

const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code || !orderAmount) {
      return errorResponse(res, 400, "Code and order amount are required");
    }

    if (orderAmount <= 0) {
      return errorResponse(res, 400, "Order amount must be greater than 0");
    }

    const result = await couponService.validateCoupon(code, orderAmount);
    successResponse(res, 200, result, "Coupon validated successfully");
  } catch (error) {
    console.error("Validate coupon error:", error);
    errorResponse(res, 400, error.message || "Failed to validate coupon");
  }
};

const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.discountPercentage) {
      if (updates.discountPercentage <= 0 || updates.discountPercentage > 100) {
        return errorResponse(
          res,
          400,
          "Discount percentage must be between 0 and 100",
        );
      }
    }

    if (updates.maxUsage && updates.maxUsage < 1) {
      return errorResponse(res, 400, "Max usage must be at least 1");
    }

    const result = await couponService.updateCoupon(id, updates);
    successResponse(res, 200, result, "Coupon updated successfully");
  } catch (error) {
    console.error("Update coupon error:", error);
    errorResponse(res, 400, error.message || "Failed to update coupon");
  }
};

const getCouponsByPromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const coupons = await couponService.getCouponsByPromotion(id);
    successResponse(res, 200, coupons);
  } catch (error) {
    console.error("Get coupons by promotion error:", error);
    errorResponse(
      res,
      404,
      error.message || "Failed to get coupons for promotion",
    );
  }
};
const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await couponService.getCouponById(id);
    successResponse(res, 200, coupon);
  } catch (error) {
    console.error("Get coupon error:", error);
    errorResponse(res, 404, error.message || "Coupon not found");
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await couponService.deleteCoupon(id);
    successResponse(res, 200, null, "Coupon deleted successfully");
  } catch (error) {
    console.error("Delete coupon error:", error);
    errorResponse(res, 400, error.message || "Failed to delete coupon");
  }
};
const getAllCoupons = async (req, res) => {
  try {
    const { page, limit, promotionId, search } = req.query;
    const result = await couponService.getAllCoupons({
      page,
      limit,
      promotionId,
      search,
    });
    successResponse(res, 200, result);
  } catch (error) {
    console.error("Get all coupons error:", error);
    errorResponse(res, 500, error.message || "Failed to get coupons");
  }
};
module.exports = {
  createCoupon,
  validateCoupon,
  updateCoupon,
  getCouponsByPromotion,
  getCouponById,
  deleteCoupon,
  getAllCoupons,
};
