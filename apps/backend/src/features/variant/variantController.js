// backend/src/features/variant/variantController.js - FIXED VERSION
const variantService = require("./variantService");
const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHelpers");

const createVariant = async (req, res) => {
  try {
    let { productId, quantity, variantAttributes, priceAdjustment } =
        req.body;

    if (!productId) {
      return errorResponse(res, 400, "Product ID is required");
    }

    if (typeof variantAttributes === "string") {
      try {
        variantAttributes = JSON.parse(variantAttributes);
      } catch (e) {
        return errorResponse(res, 400, "Invalid variantAttributes format");
      }
    }

    if (!variantAttributes || typeof variantAttributes !== "object") {
      return errorResponse(
        res,
        400,
        "Variant attributes are required and must be an object",
      );
    }

    if (Object.keys(variantAttributes).length === 0) {
      return errorResponse(res, 400, "Variant attributes cannot be empty");
    }

    quantity = Number(quantity);
    priceAdjustment = Number(priceAdjustment);

    if (quantity !== undefined && quantity < 0) {
      return errorResponse(res, 400, "Quantity must be a positive number");
    }

    if (priceAdjustment !== undefined && typeof priceAdjustment !== "number") {
      return errorResponse(res, 400, "Price adjustment must be a number");
    }

    const userId = req.user.userId;
    const result = await variantService.createVariant({
      productId,
      quantity,
      variantAttributes,
      files: req.files,
      priceAdjustment,
      userId,
    });

    successResponse(res, 201, result, "Product variant created successfully");
  } catch (error) {
    console.error("Create variant error:", error);
    errorResponse(res, 400, error.message || "Failed to create variant");
  }
};

const updateVariant = async (req, res) => {
  try {
    const { id } = req.params;
    let updates = { ...req.body };
    const userId = req.user.userId;

    if (updates.variantAttributes) {
      if (typeof updates.variantAttributes === "string") {
        try {
          updates.variantAttributes = JSON.parse(updates.variantAttributes);
        } catch (e) {
          return errorResponse(res, 400, "Invalid variantAttributes JSON format");
        }
      }
    }

    if (updates.quantity !== undefined) {
      updates.quantity = Number(updates.quantity);
      if (isNaN(updates.quantity) || updates.quantity < 0) {
        return errorResponse(res, 400, "Quantity must be a positive number");
      }
    }

    if (updates.priceAdjustment !== undefined) {
      updates.priceAdjustment = Number(updates.priceAdjustment);
      if (isNaN(updates.priceAdjustment)) {
        return errorResponse(res, 400, "Price adjustment must be a number");
      }
    }

    if (updates.variantAttributes !== undefined) {
      if (typeof updates.variantAttributes !== "object") {
        return errorResponse(res, 400, "Variant attributes must be an object");
      }
      if (Object.keys(updates.variantAttributes).length === 0) {
        return errorResponse(res, 400, "Variant attributes cannot be empty");
      }
    }

    if (req.files && req.files.length > 0) {
      updates.files = req.files;
    }

    const result = await variantService.updateVariant(id, updates, userId);
    successResponse(res, 200, result, "Product variant updated successfully");
  } catch (error) {
    console.error("Update variant error:", error);
    errorResponse(res, 400, error.message || "Failed to update variant");
  }
};

const deleteVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await variantService.deleteVariant(id, userId);
    successResponse(res, 200, null, "Product variant deleted successfully");
  } catch (error) {
    console.error("Delete variant error:", error);
    errorResponse(res, 400, error.message || "Failed to delete variant");
  }
};

const getVariantsByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    const variants = await variantService.getVariantsByProductId(productId);
    successResponse(res, 200, variants);
  } catch (error) {
    console.error("Get variants error:", error);
    errorResponse(res, 400, error.message || "Failed to get variants");
  }
};

module.exports = {
  createVariant,
  updateVariant,
  deleteVariant,
  getVariantsByProductId,
};
