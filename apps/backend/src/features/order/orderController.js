// backend/src/features/order/orderController.js
const orderService = require("./orderService");
const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHelpers");

const createOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod, buyNowVariantId } = req.body; // 👈 thêm
    const customerId = req.user.userId;

    if (!addressId) {
      return errorResponse(res, 400, "Address ID is required");
    }

    const result = await orderService.createOrder(
      customerId,
      addressId,
      paymentMethod,
      buyNowVariantId ?? null,
    );
    successResponse(res, 201, result, "Order created successfully");
  } catch (error) {
    console.error("Create order error:", error);
    errorResponse(
      res,
      error.status || 400,
      error.message || "Failed to create order",
    );
  }
};

const getMyOrders = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const customerId = req.user.userId;

    const result = await orderService.getMyOrders(customerId, {
      page,
      limit,
      status,
    });
    successResponse(res, 200, result);
  } catch (error) {
    console.error("Get my orders error:", error);
    errorResponse(res, 500, error.message || "Failed to get orders");
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { page, limit, status, search } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const result = await orderService.getAllOrders(
      { page, limit, status, search },
      userId,
      userRole,
    );
    successResponse(res, 200, result);
  } catch (error) {
    console.error("Get all orders error:", error);
    errorResponse(res, 500, error.message || "Failed to get orders");
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const order = await orderService.getOrderById(id, userId, userRole);
    successResponse(res, 200, order);
  } catch (error) {
    console.error("Get order error:", error);
    errorResponse(res, error.status || 404, error.message || "Order not found");
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!status) {
      return errorResponse(res, 400, "Status is required");
    }

    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(status)) {
      return errorResponse(
        res,
        400,
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      );
    }

    const result = await orderService.updateOrderStatus(
      id,
      status,
      userId,
      userRole,
    );
    successResponse(res, 200, result, "Order status updated successfully");
  } catch (error) {
    console.error("Update order status error:", error);
    errorResponse(
      res,
      error.status || 400,
      error.message || "Failed to update order status",
    );
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    await orderService.deleteOrder(id, userId, userRole);
    successResponse(res, 200, null, "Order deleted successfully");
  } catch (error) {
    console.error("Delete order error:", error);
    errorResponse(
      res,
      error.status || 400,
      error.message || "Failed to delete order",
    );
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};
