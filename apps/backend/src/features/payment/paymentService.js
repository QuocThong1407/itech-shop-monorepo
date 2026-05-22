// backend/src/features/payment/paymentService.js
const { supabase } = require("../../configs/supabase");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const querystring = require("qs");

//Kiểm tra customer có quyền với order không
const validateOrderOwnership = async (orderId, userId, userRole) => {
  const { data: order, error } = await supabase
    .from("Order")
    .select(
      `
      id,
      status,
      customerId,
      Customer!Order_customerId_fkey(
        id,
        userId
      )
    `,
    )
    .eq("id", orderId)
    .single();

  if (error || !order) {
    throw { status: 404, message: "Order not found" };
  }

  // Chỉ customer sở hữu order hoặc admin/seller mới được truy cập
  if (userRole === "CUSTOMER" && order.Customer.userId !== userId) {
    throw { status: 403, message: "You can only access your own orders" };
  }

  // Seller kiểm tra xem có sản phẩm của họ trong order không
  if (userRole === "SELLER") {
    const { data: seller } = await supabase
      .from("Seller")
      .select("id")
      .eq("userId", userId)
      .single();

    if (!seller) {
      throw { status: 403, message: "Seller not found" };
    }

    const { data: orderItems } = await supabase
      .from("OrderItem")
      .select(
        `
        id,
        ProductVariant!OrderItem_productVariantId_fkey(
          Product!ProductVariant_productId_fkey(
            id,
            createdBy
          )
        )
      `,
      )
      .eq("orderId", orderId);

    const hasOwnership = orderItems?.some(
      (item) => item.ProductVariant?.Product?.createdBy === seller.id,
    );

    if (!hasOwnership) {
      throw {
        status: 403,
        message: "You can only access orders containing your products",
      };
    }
  }

  return order;
};

//Tạo payment mới
const createPayment = async ({
  orderId,
  method,
  userId,
  returnUrl,
  ipAddr,
}) => {
  const timestamp = new Date().toISOString();

  // Lấy thông tin customer
  const { data: customer } = await supabase
    .from("Customer")
    .select("id")
    .eq("userId", userId)
    .single();

  if (!customer) {
    throw { status: 404, message: "Customer not found" };
  }

  // Validate order ownership
  const order = await validateOrderOwnership(orderId, userId, "CUSTOMER");

  // Kiểm tra order phải ở trạng thái PENDING hoặc CONFIRMED
  if (!["PENDING", "CONFIRMED"].includes(order.status)) {
    throw {
      status: 400,
      message: "Can only create payment for PENDING or CONFIRMED orders",
    };
  }

  // Kiểm tra xem đã có payment chưa
  const { data: existingPayment } = await supabase
    .from("Payment")
    .select("id, status, method")
    .eq("orderId", orderId)
    .single();

  if (existingPayment) {
    // If payment already SUCCESS, don't allow new payment
    if (existingPayment.status === "SUCCESS") {
      throw {
        status: 400,
        message: `Payment already completed successfully`,
      };
    }
    // If payment is PENDING with same method (e.g., for VNPay URL regeneration), allow it
    // If payment is PENDING with different method, allow update to new method
    // Only block if payment is already SUCCESS
  }

  // Tính tổng tiền từ order items
  const { data: orderItems } = await supabase
    .from("OrderItem")
    .select(
      `
      quantity,
      ProductVariant!OrderItem_productVariantId_fkey(
        priceAdjustment,
        Product!ProductVariant_productId_fkey(
          price
        )
      )
    `,
    )
    .eq("orderId", orderId);

  if (!orderItems || orderItems.length === 0) {
    throw { status: 400, message: "Order has no items" };
  }

  const totalAmount = orderItems.reduce((sum, item) => {
    const basePrice = item.ProductVariant.Product.price;
    const adjustment = item.ProductVariant.priceAdjustment || 0;
    return sum + (basePrice + adjustment) * item.quantity;
  }, 0);

  // Xử lý theo phương thức thanh toán
  if (method === "COD") {
    // COD: Tạo payment với status PENDING
    const paymentId = uuidv4();

    const { data: payment, error } = await supabase
      .from("Payment")
      .upsert(
        {
          id: existingPayment?.id || paymentId,
          orderId,
          amount: totalAmount,
          method: "COD",
          status: "PENDING",
          paymentDate: timestamp,
          createdAt: existingPayment?.createdAt || timestamp,
          updatedAt: timestamp,
        },
        { onConflict: "id" },
      )
      .select()
      .single();

    if (error) throw error;

    return {
      payment,
      message: "COD payment created. Pay when you receive the order.",
    };
  } else if (method === "VNPAY") {
    // VNPay: Tạo payment URL
    const paymentId = existingPayment?.id || uuidv4();

    // Lưu payment với status PENDING
    const { data: payment, error } = await supabase
      .from("Payment")
      .upsert(
        {
          id: paymentId,
          orderId,
          amount: totalAmount,
          method: "VNPAY",
          status: "PENDING",
          paymentDate: timestamp,
          createdAt: existingPayment?.createdAt || timestamp,
          updatedAt: timestamp,
        },
        { onConflict: "id" },
      )
      .select()
      .single();

    if (error) throw error;

    // Tạo VNPay payment URL
    const vnpayUrl = createVNPayUrl({
      orderId,
      amount: totalAmount,
      orderInfo: `Order${orderId}`,
      returnUrl,
      ipAddr,
    });

    return {
      payment,
      paymentUrl: vnpayUrl,
      message: "Redirect to VNPay to complete payment",
    };
  }

  throw { status: 400, message: "Invalid payment method" };
};

const createVNPayUrl = ({ orderId, amount, orderInfo, returnUrl, ipAddr }) => {
  const vnp_TmnCode = process.env.VNPAY_TMN_CODE;
  const vnp_HashSecret = process.env.VNPAY_HASH_SECRET;
  const vnp_Url =
    process.env.VNPAY_URL ||
    "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

  const moment = require("moment-timezone");
  const date = moment().tz("Asia/Ho_Chi_Minh");
  const vnp_CreateDate = date.format("YYYYMMDDHHmmss");
  const vnp_ExpireDate = date.add(15, "minutes").format("YYYYMMDDHHmmss");

  const vnpAmount = Math.round(amount);
  let vnp_IpAddr =
    ipAddr === "::1" || ipAddr === "::ffff:127.0.0.1" ? "127.0.0.1" : ipAddr;

  // Clean orderInfo - only alphanumeric
  const cleanOrderInfo = `Order${orderId.replace(/-/g, "")}`;

  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = vnp_TmnCode;
  vnp_Params["vnp_Locale"] = "vn";
  vnp_Params["vnp_CurrCode"] = "VND";
  vnp_Params["vnp_TxnRef"] = orderId;
  vnp_Params["vnp_OrderInfo"] = cleanOrderInfo;
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = vnpAmount * 100;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = vnp_IpAddr;
  vnp_Params["vnp_CreateDate"] = vnp_CreateDate;
  vnp_Params["vnp_ExpireDate"] = vnp_ExpireDate;

  // Sort parameters
  vnp_Params = sortObject(vnp_Params);

  // Create sign data using URLSearchParams for proper encoding
  const searchParams = new URLSearchParams();
  for (const key in vnp_Params) {
    searchParams.append(key, vnp_Params[key].toString());
  }
  const signData = searchParams.toString();

  // Create hash
  const hmac = crypto.createHmac("sha512", vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  // Add hash to URL
  searchParams.append("vnp_SecureHash", signed);

  const finalUrl = `${vnp_Url}?${searchParams.toString()}`;

  // LOG
  console.log("--- DEBUG VNPAY ---");
  console.log("1. vnp_TmnCode:", vnp_TmnCode);
  console.log("2. SignData (Chuỗi trước khi hash):", signData);
  console.log("3. SecureHash (Kết quả hash):", signed);
  console.log("4. HashSecret (Độ dài):", vnp_HashSecret?.length);
  console.log("5. Final URL:", finalUrl);
  console.log("-------------------");

  return finalUrl;
};

// xử lý VNPay IPN
const handleVNPayIPN = async (vnpParams) => {
  const vnp_HashSecret = process.env.VNPAY_HASH_SECRET;

  if (!vnp_HashSecret) {
    return { RspCode: "99", Message: "Configuration error" };
  }

  const secureHash = vnpParams.vnp_SecureHash;
  delete vnpParams.vnp_SecureHash;
  delete vnpParams.vnp_SecureHashType;

  const sortedParams = sortObject(vnpParams);
  
  // Use URLSearchParams for consistent encoding
  const searchParams = new URLSearchParams();
  for (const key in sortedParams) {
    searchParams.append(key, sortedParams[key].toString());
  }
  const signData = searchParams.toString();
  
  const hmac = crypto.createHmac("sha512", vnp_HashSecret);
  const checkSum = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  console.log("--- DEBUG VNPAY IPN ---");
  console.log("Received SecureHash:", secureHash);
  console.log("Calculated CheckSum:", checkSum);
  console.log("SignData:", signData);
  console.log("------------------------");

  // kt checksum
  if (secureHash !== checkSum) {
    return { RspCode: "97", Message: "Invalid signature" };
  }

  const orderId = vnpParams.vnp_TxnRef;
  const rspCode = vnpParams.vnp_ResponseCode;

  // Lấy payment
  const { data: payment } = await supabase
    .from("Payment")
    .select("id, status, orderId")
    .eq("orderId", orderId)
    .single();

  if (!payment) {
    return { RspCode: "01", Message: "Order not found" };
  }

  // Kiểm tra trạng thái payment
  if (payment.status === "SUCCESS") {
    return { RspCode: "02", Message: "Order already confirmed" };
  }

  const timestamp = new Date().toISOString();

  // Cập nhật payment status
  if (rspCode === "00") {
    // Thanh toán thành công
    await supabase
      .from("Payment")
      .update({
        status: "SUCCESS",
        updatedAt: timestamp,
      })
      .eq("id", payment.id);

    // Cập nhật order status
    await supabase
      .from("Order")
      .update({
        status: "CONFIRMED",
        updatedAt: timestamp,
      })
      .eq("id", orderId);

    return { RspCode: "00", Message: "Success" };
  } else {
    // Thanh toán thất bại
    await supabase
      .from("Payment")
      .update({
        status: "FAILED",
        updatedAt: timestamp,
      })
      .eq("id", payment.id);

    return { RspCode: "00", Message: "Success" };
  }
};

//Xử lý VNPay return (người dùng quay lại từ VNPay)
const handleVNPayReturn = async (vnpParams) => {
  const vnp_HashSecret = process.env.VNPAY_HASH_SECRET;

  if (!vnp_HashSecret) {
    throw { status: 500, message: "VNPay configuration error" };
  }

  const secureHash = vnpParams.vnp_SecureHash;
  delete vnpParams.vnp_SecureHash;
  delete vnpParams.vnp_SecureHashType;

  const sortedParams = sortObject(vnpParams);
  
  // Use URLSearchParams for consistent encoding
  const searchParams = new URLSearchParams();
  for (const key in sortedParams) {
    searchParams.append(key, sortedParams[key].toString());
  }
  const signData = searchParams.toString();
  
  const hmac = crypto.createHmac("sha512", vnp_HashSecret);
  const checkSum = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  console.log("--- DEBUG VNPAY RETURN ---");
  console.log("Received SecureHash:", secureHash);
  console.log("Calculated CheckSum:", checkSum);
  console.log("SignData:", signData);
  console.log("--------------------------");

  if (secureHash !== checkSum) {
    return { success: false, message: "Invalid signature" };
  }

  const orderId = vnpParams.vnp_TxnRef;
  const rspCode = vnpParams.vnp_ResponseCode;

  if (rspCode === "00") {
    // Thanh toán thành công
    const timestamp = new Date().toISOString();

    await supabase
      .from("Payment")
      .update({
        status: "SUCCESS",
        updatedAt: timestamp,
      })
      .eq("orderId", orderId);

    return { success: true, orderId, message: "Payment successful" };
  } else {
    return { success: false, orderId, message: "Payment failed" };
  }
};

//Lấy payment theo orderId
const getPaymentByOrderId = async (orderId, userId, userRole) => {
  await validateOrderOwnership(orderId, userId, userRole);

  const { data: payment, error } = await supabase
    .from("Payment")
    .select(
      `
      id,
      amount,
      method,
      status,
      paymentDate,
      createdAt,
      updatedAt,
      orderId
    `,
    )
    .eq("orderId", orderId)
    .single();

  if (error || !payment) {
    throw { status: 404, message: "Payment not found" };
  }

  return payment;
};

//Sắp xếp object theo key (alphabet)
const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (let key of keys) {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== "") {
      sorted[key] = obj[key];
    }
  }
  return sorted;
};

module.exports = {
  createPayment,
  getPaymentByOrderId,
  handleVNPayIPN,
  handleVNPayReturn,
};
