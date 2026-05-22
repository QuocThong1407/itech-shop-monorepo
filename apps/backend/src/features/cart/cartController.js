// backend/src/features/cart/cartController.js
const cartService = require("./cartService");
const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHelpers");

const getMyCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cart = await cartService.getMyCart(userId);
    successResponse(res, 200, cart);
  } catch (error) {
    console.error("Get my cart error:", error);
    errorResponse(
      res,
      error.status || 500,
      error.message || "Failed to get cart"
    );
  }
};

const addCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productVariantId, quantity } = req.body;

    if (!productVariantId || !quantity) {
      return errorResponse(
        res,
        400,
        "Product variant ID and quantity are required"
      );
    }

    if (quantity <= 0) {
      return errorResponse(res, 400, "Quantity must be greater than 0");
    }

    if (!Number.isInteger(quantity)) {
      return errorResponse(res, 400, "Quantity must be an integer");
    }

    const cartItem = await cartService.addCartItem(userId, {
      productVariantId,
      quantity,
    });

    successResponse(res, 201, cartItem, "Item added to cart successfully");
  } catch (error) {
    console.error("Add cart item error:", error);
    errorResponse(
      res,
      error.status || 400,
      error.message || "Failed to add item to cart"
    );
  }
};

const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity) {
      return errorResponse(res, 400, "Quantity is required");
    }

    if (quantity <= 0) {
      return errorResponse(res, 400, "Quantity must be greater than 0");
    }

    if (!Number.isInteger(quantity)) {
      return errorResponse(res, 400, "Quantity must be an integer");
    }

    const cartItem = await cartService.updateCartItem(userId, id, {
      quantity,
    });

    successResponse(res, 200, cartItem, "Cart item updated successfully");
  } catch (error) {
    console.error("Update cart item error:", error);
    errorResponse(
      res,
      error.status || 400,
      error.message || "Failed to update cart item"
    );
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    await cartService.deleteCartItem(userId, id);
    successResponse(res, 200, null, "Cart item deleted successfully");
  } catch (error) {
    console.error("Delete cart item error:", error);
    errorResponse(
      res,
      error.status || 400,
      error.message || "Failed to delete cart item"
    );
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    await cartService.clearCart(userId);
    successResponse(res, 200, null, "Cart cleared successfully");
  } catch (error) {
    console.error("Clear cart error:", error);
    errorResponse(
      res,
      error.status || 400,
      error.message || "Failed to clear cart"
    );
  }
};

module.exports = {
  getMyCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
  clearCart,
};
