// backend/src/features/system/systemController.js
const systemService = require("./systemService");
const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHelpers");

// === GENERAL CONFIG ===

// Lấy tất cả cấu hình hệ thống
const getAllConfigs = async (req, res) => {
  try {
    const configs = await systemService.getAllSystemConfigs();
    successResponse(res, 200, configs, "System configurations retrieved");
  } catch (error) {
    console.error("Get all configs error:", error);
    errorResponse(
      res,
      error.status || 500,
      error.message || "Failed to get system configurations",
    );
  }
};

// Lấy config theo key
const getConfigByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const config = await systemService.getConfigByKey(key);
    successResponse(res, 200, config, "Configuration retrieved");
  } catch (error) {
    console.error("Get config by key error:", error);
    errorResponse(
      res,
      error.status || 500,
      error.message || "Failed to get configuration",
    );
  }
};

// Tạo config mới
const createConfig = async (req, res) => {
  try {
    const { configKey, configValue, description } = req.body;

    if (!configKey || !configValue) {
      return errorResponse(res, 400, "Config key and value are required");
    }

    const config = await systemService.createConfig({
      configKey,
      configValue,
      description,
    });

    successResponse(res, 201, config, "Configuration created successfully");
  } catch (error) {
    console.error("Create config error:", error);
    errorResponse(
      res,
      error.status || 500,
      error.message || "Failed to create configuration",
    );
  }
};

// Cập nhật config
const updateConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { configValue, description } = req.body;

    const config = await systemService.updateConfig(id, {
      configValue,
      description,
    });

    successResponse(res, 200, config, "Configuration updated successfully");
  } catch (error) {
    console.error("Update config error:", error);
    errorResponse(
      res,
      error.status || 500,
      error.message || "Failed to update configuration",
    );
  }
};

// Xóa config
const deleteConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await systemService.deleteConfig(id);
    successResponse(res, 200, result, "Configuration deleted successfully");
  } catch (error) {
    console.error("Delete config error:", error);
    errorResponse(
      res,
      error.status || 500,
      error.message || "Failed to delete configuration",
    );
  }
};

// === MEMBERSHIP TIERS ===

// Lấy tất cả membership tiers
const getMembershipTiers = async (req, res) => {
  try {
    const tiers = await systemService.getMembershipTiers();
    successResponse(res, 200, tiers, "Membership tiers retrieved");
  } catch (error) {
    console.error("Get membership tiers error:", error);
    errorResponse(
      res,
      error.status || 500,
      error.message || "Failed to get membership tiers",
    );
  }
};

// Tạo/Cập nhật membership tier
const upsertMembershipTier = async (req, res) => {
  try {
    const { tierName } = req.params;
    const { min, max, description } = req.body;

    if (min === undefined) {
      return errorResponse(res, 400, "Minimum spent is required");
    }

    const tier = await systemService.upsertMembershipTier(tierName, {
      min,
      max,
      description,
    });

    successResponse(
      res,
      200,
      tier,
      `Membership tier ${tierName} saved successfully`,
    );
  } catch (error) {
    console.error("Upsert membership tier error:", error);
    errorResponse(
      res,
      error.status || 500,
      error.message || "Failed to save membership tier",
    );
  }
};

// === MEMBERSHIP BENEFITS ===

// Lấy tất cả membership benefits
const getMembershipBenefits = async (req, res) => {
  try {
    const benefits = await systemService.getMembershipBenefits();
    successResponse(res, 200, benefits, "Membership benefits retrieved");
  } catch (error) {
    console.error("Get membership benefits error:", error);
    errorResponse(
      res,
      error.status || 500,
      error.message || "Failed to get membership benefits",
    );
  }
};

// Tạo/Cập nhật membership benefit
const upsertMembershipBenefit = async (req, res) => {
  try {
    const { tierName } = req.params;
    const {
      discountPercentage,
      freeShipping,
      prioritySupport,
      earlyAccess,
      description,
    } = req.body;

    const benefit = await systemService.upsertMembershipBenefit(tierName, {
      discountPercentage,
      freeShipping,
      prioritySupport,
      earlyAccess,
      description,
    });

    successResponse(
      res,
      200,
      benefit,
      `Membership benefit for ${tierName} saved successfully`,
    );
  } catch (error) {
    console.error("Upsert membership benefit error:", error);
    errorResponse(
      res,
      error.status || 500,
      error.message || "Failed to save membership benefit",
    );
  }
};

// === TAX (VAT) ===

// Lấy VAT rate
const getVATRate = async (req, res) => {
  try {
    const vat = await systemService.getVATRate();
    successResponse(res, 200, vat, "VAT rate retrieved");
  } catch (error) {
    console.error("Get VAT rate error:", error);
    errorResponse(
      res,
      error.status || 500,
      error.message || "Failed to get VAT rate",
    );
  }
};

// Cập nhật VAT rate
const updateVATRate = async (req, res) => {
  try {
    const { rate } = req.body;

    if (rate === undefined || rate === null) {
      return errorResponse(res, 400, "VAT rate is required");
    }

    if (typeof rate !== "number" || rate < 0 || rate > 100) {
      return errorResponse(
        res,
        400,
        "VAT rate must be a number between 0 and 100",
      );
    }

    const vat = await systemService.updateVATRate(rate);
    successResponse(res, 200, vat, "VAT rate updated successfully");
  } catch (error) {
    console.error("Update VAT rate error:", error);
    errorResponse(
      res,
      error.status || 500,
      error.message || "Failed to update VAT rate",
    );
  }
};

// === SHIPPING FEES ===

// Lấy tất cả shipping fees
const getShippingFees = async (req, res) => {
  try {
    const fees = await systemService.getShippingFees();
    successResponse(res, 200, fees, "Shipping fees retrieved");
  } catch (error) {
    console.error("Get shipping fees error:", error);
    errorResponse(
      res,
      error.status || 500,
      error.message || "Failed to get shipping fees",
    );
  }
};

// Tạo/Cập nhật shipping fee
const upsertShippingFee = async (req, res) => {
  try {
    const { type } = req.params;
    const {
      baseFee,
      feePerKm,
      freeShippingThreshold,
      maxDistance,
      description,
    } = req.body;

    const fee = await systemService.upsertShippingFee(type, {
      baseFee,
      feePerKm,
      freeShippingThreshold,
      maxDistance,
      description,
    });

    successResponse(
      res,
      200,
      fee,
      `Shipping fee for ${type} saved successfully`,
    );
  } catch (error) {
    console.error("Upsert shipping fee error:", error);
    errorResponse(
      res,
      error.status || 500,
      error.message || "Failed to save shipping fee",
    );
  }
};

module.exports = {
  // General
  getAllConfigs,
  getConfigByKey,
  createConfig,
  updateConfig,
  deleteConfig,

  // Membership
  getMembershipTiers,
  upsertMembershipTier,
  getMembershipBenefits,
  upsertMembershipBenefit,

  // Tax
  getVATRate,
  updateVATRate,

  // Shipping
  getShippingFees,
  upsertShippingFee,
};
