// backend/src/features/payment/paymentController.js
const paymentService = require("./paymentService");
const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHelpers");

const createPayment = async (req, res) => {
  try {
    const { orderId, method, returnUrl } = req.body;
    const userId = req.user.userId;

    if (!orderId) {
      return errorResponse(res, 400, "Order ID is required");
    }

    if (!method) {
      return errorResponse(res, 400, "Payment method is required");
    }

    const validMethods = ["COD", "VNPAY"];
    if (!validMethods.includes(method)) {
      return errorResponse(
        res,
        400,
        "Invalid payment method. Must be COD or VNPAY",
      );
    }

    // VNPay yêu cầu returnUrl
    if (method === "VNPAY" && !returnUrl) {
      return errorResponse(
        res,
        400,
        "Return URL is required for VNPay payment",
      );
    }

    const result = await paymentService.createPayment({
      orderId,
      method,
      userId,
      returnUrl,
      ipAddr: req.ip || req.connection.remoteAddress,
    });

    successResponse(res, 201, result, "Payment created successfully");
  } catch (error) {
    console.error("Create payment error:", error);
    errorResponse(
      res,
      error.status || 400,
      error.message || "Failed to create payment",
    );
  }
};

const getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const payment = await paymentService.getPaymentByOrderId(
      orderId,
      userId,
      userRole,
    );

    successResponse(res, 200, payment);
  } catch (error) {
    console.error("Get payment error:", error);
    errorResponse(
      res,
      error.status || 404,
      error.message || "Payment not found",
    );
  }
};

//VNPay IPN callback

const vnpayIPN = async (req, res) => {
  try {
    const result = await paymentService.handleVNPayIPN(req.query);

    res.status(200).json({
      RspCode: result.RspCode,
      Message: result.Message,
    });
  } catch (error) {
    console.error("VNPay IPN error:", error);
    res.status(200).json({
      RspCode: "99",
      Message: "Unknown error",
    });
  }
};

//VNPay return URL callback (người dùng quay lại từ VNPay)
const vnpayReturn = async (req, res) => {
  try {
    const result = await paymentService.handleVNPayReturn(req.query);

    // Redirect về frontend với kết quả
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const redirectUrl = `${frontendUrl}/payment/result?success=${result.success}&orderId=${result.orderId}&message=${encodeURIComponent(result.message)}`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error("VNPay return error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const redirectUrl = `${frontendUrl}/payment/result?success=false&message=${encodeURIComponent(error.message || "Payment failed")}`;

    res.redirect(redirectUrl);
  }
};

module.exports = {
  createPayment,
  getPaymentByOrderId,
  vnpayIPN,
  vnpayReturn,
};
