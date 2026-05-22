// backend/src/features/review/reviewController.js
const reviewService = require("./reviewService");
const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHelpers");

const getAllReviews = async (req, res) => {
  try {
    const { page, limit, rating, productId } = req.query;
    const result = await reviewService.getAllReviews({
      page,
      limit,
      rating,
      productId,
    });
    successResponse(res, 200, result);
  } catch (error) {
    console.error("Get all reviews error:", error);
    errorResponse(res, 500, error.message || "Failed to get reviews");
  }
};

const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await reviewService.getReviewById(id);
    successResponse(res, 200, review);
  } catch (error) {
    console.error("Get review error:", error);
    errorResponse(res, 404, error.message || "Review not found");
  }
};

const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page, limit, rating } = req.query;
    const result = await reviewService.getReviewsByProduct(productId, {
      page,
      limit,
      rating,
    });
    successResponse(res, 200, result);
  } catch (error) {
    console.error("Get reviews by product error:", error);
    errorResponse(res, 500, error.message || "Failed to get product reviews");
  }
};

const getReviewsByVariant = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { page, limit, rating } = req.query;
    const result = await reviewService.getReviewsByVariant(variantId, {
      page,
      limit,
      rating,
    });
    successResponse(res, 200, result);
  } catch (error) {
    console.error("Get reviews by variant error:", error);
    errorResponse(res, 500, error.message || "Failed to get variant reviews");
  }
};

const createReview = async (req, res) => {
  try {
    const { orderItemId, rating, comment } = req.body;
    const customerId = req.user.customerId;

    if (!orderItemId || !rating) {
      return errorResponse(res, 400, "Order item ID and rating are required");
    }

    if (rating < 1 || rating > 5) {
      return errorResponse(res, 400, "Rating must be between 1 and 5");
    }

    const result = await reviewService.createReview({
      orderItemId,
      rating,
      comment,
      files: req.files, // Upload files
      customerId,
    });
    successResponse(res, 201, result, "Review created successfully");
  } catch (error) {
    console.error("Create review error:", error);
    errorResponse(res, 400, error.message || "Failed to create review");
  }
};

const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, existingImages } = req.body;
    const customerId = req.user.customerId;

    if (rating && (rating < 1 || rating > 5)) {
      return errorResponse(res, 400, "Rating must be between 1 and 5");
    }

    // Parse existingImages - it can be a string or array from FormData
    let parsedExistingImages = [];
    if (existingImages) {
      if (Array.isArray(existingImages)) {
        parsedExistingImages = existingImages;
      } else if (typeof existingImages === 'string') {
        parsedExistingImages = [existingImages];
      }
    }

    const result = await reviewService.updateReview(id, customerId, {
      rating,
      comment,
      files: req.files, // Upload files
      existingImages: parsedExistingImages, // Existing image URLs to keep
    });
    successResponse(res, 200, result, "Review updated successfully");
  } catch (error) {
    console.error("Update review error:", error);
    errorResponse(res, 400, error.message || "Failed to update review");
  }
};

const adminDeleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    await reviewService.adminDeleteReview(id);
    successResponse(res, 200, null, "Review deleted successfully");
  } catch (error) {
    console.error("Admin delete review error:", error);
    errorResponse(res, 400, error.message || "Failed to delete review");
  }
};

module.exports = {
  getAllReviews,
  getReviewById,
  getReviewsByProduct,
  getReviewsByVariant,
  createReview,
  updateReview,
  adminDeleteReview,
};
