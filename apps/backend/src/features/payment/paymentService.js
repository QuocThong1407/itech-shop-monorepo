const { supabase } = require("../../configs/supabase");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const moment = require("moment-timezone");

const validateOrderOwnership = async (orderId, userId, userRole) => {
  const { data: order, error } = await supabase
    .from("Order")
    .select(`
      id, status, customerId,
      Customer!Order_customerId_fkey(id, userId)
    `)
    .eq("id", orderId)
    .single();

  if (error || !order) throw { status: 404, message: "Order not found" };

  if (userRole === "CUSTOMER" && order.Customer.userId !== userId) {
    throw { status: 403, message: "You can only access your own orders" };
  }

  if (userRole === "SELLER") {
    const { data: seller } = await supabase
      .from("Seller").select("id").eq("userId", userId).single();
    if (!seller) throw { status: 403, message: "Seller not found" };

    const { data: orderItems } = await supabase
      .from("OrderItem")
      .select(`
        id,
        ProductVariant!OrderItem_productVariantId_fkey(
          Product!ProductVariant_productId_fkey(id, createdBy)
        )
      `)
      .eq("orderId", orderId);

    const hasOwnership = orderItems?.some(
      (item) => item.ProductVariant?.Product?.createdBy === seller.id
    );
    if (!hasOwnership) {
      throw { status: 403, message: "You can only access orders containing your products" };
    }
  }

  return order;
};

const calcOrderTotal = async (orderId) => {
  const { data: orderItems } = await supabase
    .from("OrderItem")
    .select(`
      quantity,
      ProductVariant!OrderItem_productVariantId_fkey(
        priceAdjustment,
        Product!ProductVariant_productId_fkey(price)
      )
    `)
    .eq("orderId", orderId);

  if (!orderItems || orderItems.length === 0) {
    throw { status: 400, message: "Order has no items" };
  }

  return orderItems.reduce((sum, item) => {
    const base = item.ProductVariant.Product.price;
    const adj = item.ProductVariant.priceAdjustment || 0;
    return sum + (base + adj) * item.quantity;
  }, 0);
};

const createPayment = async ({ orderId, method, userId, returnUrl, ipAddr }) => {
  const timestamp = new Date().toISOString();

  const { data: customer } = await supabase
    .from("Customer").select("id").eq("userId", userId).single();
  if (!customer) throw { status: 404, message: "Customer not found" };

  const order = await validateOrderOwnership(orderId, userId, "CUSTOMER");

  if (!["PENDING", "CONFIRMED"].includes(order.status)) {
    throw { status: 400, message: "Can only create payment for PENDING or CONFIRMED orders" };
  }

  const { data: existingPayment } = await supabase
    .from("Payment").select("id, status, method, createdAt")
    .eq("orderId", orderId).single();

  if (existingPayment?.status === "SUCCESS") {
    throw { status: 400, message: "Payment already completed successfully" };
  }

  const totalAmount = await calcOrderTotal(orderId);

  if (method === "COD") {
    const { data: payment, error } = await supabase
      .from("Payment")
      .upsert({
        id: existingPayment?.id || uuidv4(),
        orderId, amount: totalAmount, method: "COD", status: "PENDING",
        paymentDate: timestamp,
        createdAt: existingPayment?.createdAt || timestamp,
        updatedAt: timestamp,
      }, { onConflict: "id" })
      .select().single();

    if (error) throw error;
    return { payment, message: "COD payment created. Pay when you receive the order." };
  }

  if (method === "VNPAY") {
    const paymentId = existingPayment?.id || uuidv4();
    const txnRef = `${orderId.replace(/-/g, "").slice(0, 20)}${moment().tz("Asia/Ho_Chi_Minh").format("HHmmss")}`;

    const { data: payment, error } = await supabase
      .from("Payment")
      .upsert({
        id: paymentId, orderId, amount: totalAmount,
        method: "VNPAY", status: "PENDING",
        txnRef,
        paymentDate: timestamp,
        createdAt: existingPayment?.createdAt || timestamp,
        updatedAt: timestamp,
      }, { onConflict: "id" })
      .select().single();

    if (error) throw error;

    const vnpayUrl = createVNPayUrl({
      txnRef, amount: totalAmount,
      orderInfo: `Order${orderId}`, returnUrl, ipAddr,
    });

    return { payment, paymentUrl: vnpayUrl, message: "Redirect to VNPay to complete payment" };
  }

  throw { status: 400, message: "Invalid payment method" };
};

const repayOrder = async ({ orderId, userId, returnUrl, ipAddr }) => {
  const order = await validateOrderOwnership(orderId, userId, "CUSTOMER");

  if (!["PENDING", "CONFIRMED"].includes(order.status)) {
    throw { status: 400, message: "Cannot repay this order" };
  }

  const { data: payment } = await supabase
    .from("Payment").select("id, status, method, createdAt")
    .eq("orderId", orderId).single();

  if (!payment) throw { status: 404, message: "Payment not found" };
  if (payment.status === "SUCCESS") throw { status: 400, message: "Order already paid" };
  if (payment.method !== "VNPAY") {
    throw { status: 400, message: "Only VNPAY orders can be repaid online" };
  }

  const diffHours = (Date.now() - new Date(payment.createdAt)) / (1000 * 60 * 60);
  if (diffHours > 24) {
    throw { status: 400, message: "Payment window expired (24 hours)" };
  }

  const totalAmount = await calcOrderTotal(orderId);
  const txnRef = `${orderId.replace(/-/g, "").slice(0, 20)}${moment().tz("Asia/Ho_Chi_Minh").format("HHmmss")}`;

  await supabase.from("Payment")
    .update({ status: "PENDING", txnRef, updatedAt: new Date().toISOString() })
    .eq("id", payment.id);

  const vnpayUrl = createVNPayUrl({
    txnRef, amount: totalAmount,
    orderInfo: `Order${orderId}`, returnUrl, ipAddr,
  });

  return { paymentUrl: vnpayUrl };
};

const createVNPayUrl = ({ txnRef, amount, orderInfo, returnUrl, ipAddr }) => {
  const vnp_TmnCode = process.env.VNPAY_TMN_CODE;
  const vnp_HashSecret = process.env.VNPAY_HASH_SECRET;
  const vnp_Url = process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

  const date = moment().tz("Asia/Ho_Chi_Minh");
  const vnp_CreateDate = date.format("YYYYMMDDHHmmss");
  const vnp_ExpireDate = date.clone().add(15, "minutes").format("YYYYMMDDHHmmss");

  let vnp_IpAddr = ["::1", "::ffff:127.0.0.1"].includes(ipAddr) ? "127.0.0.1" : ipAddr;

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: Math.round(amount) * 100,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: vnp_IpAddr,
    vnp_CreateDate,
    vnp_ExpireDate,
  };

  vnp_Params = sortObject(vnp_Params);

  const searchParams = new URLSearchParams();
  for (const key in vnp_Params) searchParams.append(key, vnp_Params[key].toString());

  const signed = crypto
    .createHmac("sha512", vnp_HashSecret)
    .update(Buffer.from(searchParams.toString(), "utf-8"))
    .digest("hex");

  searchParams.append("vnp_SecureHash", signed);
  return `${vnp_Url}?${searchParams.toString()}`;
};

const verifyVNPayHash = (vnpParams) => {
  const vnp_HashSecret = process.env.VNPAY_HASH_SECRET;
  const secureHash = vnpParams.vnp_SecureHash;

  const params = { ...vnpParams };
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sorted = sortObject(params);
  const searchParams = new URLSearchParams();
  for (const key in sorted) searchParams.append(key, sorted[key].toString());

  const checkSum = crypto
    .createHmac("sha512", vnp_HashSecret)
    .update(Buffer.from(searchParams.toString(), "utf-8"))
    .digest("hex");

  return { valid: secureHash === checkSum };
};

const handleVNPayIPN = async (vnpParams) => {
  if (!process.env.VNPAY_HASH_SECRET) return { RspCode: "99", Message: "Configuration error" };

  const { valid } = verifyVNPayHash(vnpParams);
  if (!valid) return { RspCode: "97", Message: "Invalid signature" };

  const txnRef = vnpParams.vnp_TxnRef;
  const rspCode = vnpParams.vnp_ResponseCode;

  const { data: payment } = await supabase
    .from("Payment").select("id, status, orderId")
    .eq("txnRef", txnRef).single();

  if (!payment) return { RspCode: "01", Message: "Order not found" };
  if (payment.status === "SUCCESS") return { RspCode: "02", Message: "Order already confirmed" };

  const timestamp = new Date().toISOString();

  if (rspCode === "00") {
    await supabase.from("Payment").update({
      status: "SUCCESS",
      transactionNo: vnpParams.vnp_TransactionNo,
      bankCode: vnpParams.vnp_BankCode,
      updatedAt: timestamp,
    }).eq("id", payment.id);

    await supabase.from("Order").update({
      status: "CONFIRMED", updatedAt: timestamp,
    }).eq("id", payment.orderId);
  } else {
    await supabase.from("Payment").update({
      status: "FAILED", updatedAt: timestamp,
    }).eq("id", payment.id);
  }

  return { RspCode: "00", Message: "Success" };
};

const handleVNPayReturn = async (vnpParams) => {
  if (!process.env.VNPAY_HASH_SECRET) throw { status: 500, message: "VNPay configuration error" };

  const { valid } = verifyVNPayHash(vnpParams);
  if (!valid) return { success: false, message: "Invalid signature" };

  const txnRef = vnpParams.vnp_TxnRef;
  const rspCode = vnpParams.vnp_ResponseCode;

  const { data: payment } = await supabase
    .from("Payment").select("id, status, orderId")
    .eq("txnRef", txnRef).single();

  if (rspCode === "00") {
    await supabase.from("Payment").update({
      status: "SUCCESS",
      transactionNo: vnpParams.vnp_TransactionNo,
      bankCode: vnpParams.vnp_BankCode,
      updatedAt: new Date().toISOString(),
    }).eq("id", payment.id);

    return { success: true, orderId: payment.orderId, message: "Payment successful" };
  }

  return { success: false, orderId: payment.orderId, message: "Payment failed" };
};

const getPaymentByOrderId = async (orderId, userId, userRole) => {
  await validateOrderOwnership(orderId, userId, userRole);

  const { data: payment, error } = await supabase
    .from("Payment")
    .select("id, amount, method, status, transactionNo, bankCode, paymentDate, createdAt, updatedAt, orderId")
    .eq("orderId", orderId).single();

  if (error || !payment) throw { status: 404, message: "Payment not found" };
  return payment;
};

const sortObject = (obj) => {
  const sorted = {};
  for (const key of Object.keys(obj).sort()) {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== "") {
      sorted[key] = obj[key];
    }
  }
  return sorted;
};

module.exports = {
  createPayment,
  repayOrder,
  getPaymentByOrderId,
  handleVNPayIPN,
  handleVNPayReturn,
};