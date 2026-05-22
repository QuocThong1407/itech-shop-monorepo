// backend/src/features/order/orderHelper.js
const { supabase } = require("../../configs/supabase");
const { v4: uuidv4 } = require("uuid");

//valadate

// kiểm tra phương thức thanh toán hợp lệ
const validatePaymentMethod = (paymentMethod) => {
  const validMethods = ["COD", "VNPAY", "STRIPE"];
  if (!validMethods.includes(paymentMethod)) {
    throw {
      status: 400,
      message: "Invalid payment method. Must be COD, VNPAY, or STRIPE",
    };
  }
};

// lấy customer theo userId
const getCustomerByUserId = async (userId) => {
  const { data: customer, error } = await supabase
    .from("Customer")
    .select("id")
    .eq("userId", userId)
    .single();

  if (error || !customer) {
    throw { status: 404, message: "Customer not found" };
  }

  return customer;
};

// lấy seller theo userId
const getSellerByUserId = async (userId) => {
  const { data: seller, error } = await supabase
    .from("Seller")
    .select("id")
    .eq("userId", userId)
    .single();

  if (error || !seller) {
    throw { status: 404, message: "Seller not found" };
  }

  return seller;
};

// kiểm tra địa chỉ có thuộc về customer không
const validateAddressOwnership = async (addressId, customerId) => {
  const { data: address, error } = await supabase
    .from("Address")
    .select("id, customerId")
    .eq("id", addressId)
    .single();

  if (error || !address) {
    throw { status: 404, message: "Address not found" };
  }

  if (address.customerId !== customerId) {
    throw { status: 403, message: "Address does not belong to you" };
  }

  return address;
};

// lấy cart và các cart item của customer
const getCartWithItems = async (customerId) => {
  const { data: cart, error: cartError } = await supabase
    .from("Cart")
    .select("id")
    .eq("customerId", customerId)
    .single();

  if (cartError || !cart) {
    throw { status: 404, message: "Cart not found" };
  }

  const { data: cartItems, error: itemsError } = await supabase
    .from("CartItem")
    .select(
      `
      id,
      quantity,
      productVariantId,
      ProductVariant!CartItem_productVariantId_fkey(
        id,
        quantity,
        priceAdjustment,
        variantAttributes,
        productId,
        Product!ProductVariant_productId_fkey(
          id,
          name,
          price,
          stockQuantity,
          is_deleted
        )
      )
    `,
    )
    .eq("cartId", cart.id);

  if (itemsError) {
    throw { status: 500, message: "Failed to get cart items" };
  }

  if (!cartItems || cartItems.length === 0) {
    throw { status: 400, message: "Cart is empty" };
  }

  return { cart, cartItems };
};

// kiểm tra tính hợp lệ của các item trong cart
const validateCartItems = (cartItems) => {
  for (const item of cartItems) {
    if (!item.ProductVariant) {
      throw { status: 400, message: "Invalid product variant in cart" };
    }

    if (item.ProductVariant.Product.is_deleted) {
      throw {
        status: 400,
        message: `Product "${item.ProductVariant.Product.name}" is no longer available`,
      };
    }

    if (item.quantity > item.ProductVariant.quantity) {
      throw {
        status: 400,
        message: `Insufficient stock for "${item.ProductVariant.Product.name}". Available: ${item.ProductVariant.quantity}, Requested: ${item.quantity}`,
      };
    }
  }
};

// tính tổng tiền và danh sách cập nhật tồn kho
const calculateOrderDetails = (cartItems) => {
  let totalAmount = 0;
  const variantUpdates = [];

  for (const item of cartItems) {
    const basePrice = item.ProductVariant.Product.price;
    const adjustment = item.ProductVariant.priceAdjustment || 0;
    const itemPrice = basePrice + adjustment;
    totalAmount += itemPrice * item.quantity;

    variantUpdates.push({
      variantId: item.productVariantId,
      productId: item.ProductVariant.productId,
      quantityToDeduct: item.quantity,
      currentQuantity: item.ProductVariant.quantity,
    });
  }

  return { totalAmount, variantUpdates };
};

// stock mângement

// trừ tồn kho variant theo cách an toàn
const deductStockAtomic = async (variantId, quantityToDeduct, timestamp) => {
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "decrement_variant_quantity",
    {
      variant_id: variantId,
      qty_to_deduct: quantityToDeduct,
    },
  );

  if (!rpcError && rpcResult) {
    return rpcResult;
  }

  const { data: currentVariant, error: fetchError } = await supabase
    .from("ProductVariant")
    .select("quantity")
    .eq("id", variantId)
    .single();

  if (fetchError || !currentVariant) {
    throw new Error(`Failed to fetch variant ${variantId}`);
  }

  if (currentVariant.quantity < quantityToDeduct) {
    throw new Error(
      `Insufficient stock for variant ${variantId}. Available: ${currentVariant.quantity}, Requested: ${quantityToDeduct}`,
    );
  }

  const newQuantity = currentVariant.quantity - quantityToDeduct;

  const { data: updated, error: updateError } = await supabase
    .from("ProductVariant")
    .update({
      quantity: newQuantity,
      updatedAt: timestamp,
    })
    .eq("id", variantId)
    .eq("quantity", currentVariant.quantity)
    .select()
    .single();

  if (updateError || !updated) {
    throw new Error(
      `Concurrent update detected for variant ${variantId}. Please try again.`,
    );
  }

  return updated;
};

// cập nhật lại stock tổng của product
const updateProductStock = async (productId, timestamp) => {
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "sync_product_stock",
    { product_id: productId },
  );

  if (!rpcError && rpcResult) {
    return rpcResult;
  }

  const { data: allVariants, error: variantsError } = await supabase
    .from("ProductVariant")
    .select("quantity")
    .eq("productId", productId);

  if (variantsError) throw variantsError;

  const totalStock = (allVariants || []).reduce(
    (sum, v) => sum + (v.quantity || 0),
    0,
  );

  const { error: productError } = await supabase
    .from("Product")
    .update({ stockQuantity: totalStock, updatedAt: timestamp })
    .eq("id", productId);

  if (productError) throw productError;
};

// hoàn lại tồn kho cho variant
const restoreStock = async (variantId, quantityToRestore, timestamp) => {
  const { data: currentVariant } = await supabase
    .from("ProductVariant")
    .select("quantity")
    .eq("id", variantId)
    .single();

  if (currentVariant) {
    await supabase
      .from("ProductVariant")
      .update({
        quantity: currentVariant.quantity + quantityToRestore,
        updatedAt: timestamp,
      })
      .eq("id", variantId);
  }
};

// hoàn lại tồn kho cho toàn bộ order
const restoreOrderStock = async (orderId, timestamp) => {
  const { data: orderItems } = await supabase
    .from("OrderItem")
    .select(
      `
      productVariantId,
      quantity,
      ProductVariant!OrderItem_productVariantId_fkey(
        productId
      )
    `,
    )
    .eq("orderId", orderId);

  if (!orderItems || orderItems.length === 0) return;

  const productIds = new Set();

  for (const item of orderItems) {
    await restoreStock(item.productVariantId, item.quantity, timestamp);

    if (item.ProductVariant) {
      productIds.add(item.ProductVariant.productId);
    }
  }

  for (const productId of productIds) {
    await updateProductStock(productId, timestamp);
  }
};

// order crud
// tạo bản ghi order
const createOrderRecord = async (customerId, addressId, timestamp) => {
  const orderId = uuidv4();

  const { data: order, error } = await supabase
    .from("Order")
    .insert({
      id: orderId,
      customerId,
      addressId,
      orderDate: timestamp,
      status: "PENDING",
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .select()
    .single();

  if (error) throw error;

  return order;
};

// tạo các order item
const createOrderItems = async (orderId, cartItems, timestamp) => {
  const orderItemsData = cartItems.map((item) => ({
    id: uuidv4(),
    orderId,
    productVariantId: item.productVariantId,
    quantity: item.quantity,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  const { data: createdItems, error } = await supabase
    .from("OrderItem")
    .insert(orderItemsData)
    .select();

  if (error) throw error;

  return createdItems;
};

// tạo bản ghi thanh toán
const createPayment = async (orderId, amount, method, timestamp) => {
  const { error } = await supabase.from("Payment").insert({
    id: uuidv4(),
    orderId,
    amount,
    method,
    status: "PENDING",
    paymentDate: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  if (error) throw error;
};

// xóa toàn bộ item trong cart
const clearCart = async (cartId) => {
  await supabase.from("CartItem").delete().eq("cartId", cartId);
};

// rollback

// rollback toàn bộ dữ liệu khi tạo order lỗi
const rollbackOrder = async (
  orderId,
  createdItemIds,
  variantUpdates,
  timestamp,
) => {
  console.error("Order creation failed, rolling back...");

  if (createdItemIds.length > 0) {
    await supabase.from("OrderItem").delete().in("id", createdItemIds);
  }

  const restoredProductIds = new Set();
  for (const update of variantUpdates) {
    await restoreStock(update.variantId, update.quantityToDeduct, timestamp);
    restoredProductIds.add(update.productId);
  }

  for (const productId of restoredProductIds) {
    await updateProductStock(productId, timestamp);
  }

  await supabase.from("Order").delete().eq("id", orderId);
};

// status

// kiểm tra luồng chuyển trạng thái hợp lệ
const validateStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    PENDING: ["CONFIRMED", "SHIPPED", "CANCELLED"],
    CONFIRMED: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED", "CANCELLED"],
    DELIVERED: [],
    CANCELLED: [],
  };

  const allowedNext = validTransitions[currentStatus] || [];

  if (!allowedNext.includes(newStatus)) {
    throw {
      status: 400,
      message: `Invalid status transition: ${currentStatus} → ${newStatus}. Allowed: ${allowedNext.join(", ") || "none"}`,
    };
  }
};

// cập nhật trạng thái order có kiểm tra đồng thời
const updateOrderStatusRecord = async (
  orderId,
  currentStatus,
  newStatus,
  timestamp,
) => {
  const { error } = await supabase
    .from("Order")
    .update({
      status: newStatus,
      updatedAt: timestamp,
    })
    .eq("id", orderId)
    .eq("status", currentStatus);

  if (error) {
    throw {
      status: 409,
      message:
        "Order status was modified by another request. Please refresh and try again.",
    };
  }

  return true;
};

// cập nhật trạng thái thanh toán theo order
const updatePaymentStatus = async (orderId, orderStatus, timestamp) => {
  const { data: payment } = await supabase
    .from("Payment")
    .select("id, method, status")
    .eq("orderId", orderId)
    .single();

  if (!payment) return;

  // COD: giao hàng xong mới coi là thanh toán thành công
  if (
    orderStatus === "DELIVERED" &&
    payment.method === "COD" &&
    payment.status === "PENDING"
  ) {
    await supabase
      .from("Payment")
      .update({
        status: "SUCCESS",
        updatedAt: timestamp,
      })
      .eq("id", payment.id);
  }
  // VNPay chỉ update trong paymentService.handleVNPayIPN
};

// authorization

// kiểm tra customer chỉ truy cập order của mình
const checkOrderOwnership = (order, userId, userRole) => {
  if (userRole === "CUSTOMER" && order.Customer.userId !== userId) {
    throw { status: 403, message: "You can only access your own orders" };
  }
};

// kiểm tra seller có quyền với order hay không
const checkSellerOrderOwnership = async (orderId, sellerId) => {
  const { data: orderItems, error } = await supabase
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

  if (error) {
    throw { status: 500, message: "Failed to verify order ownership" };
  }

  if (!orderItems || orderItems.length === 0) {
    throw { status: 404, message: "Order has no items" };
  }

  const hasOwnership = orderItems.some(
    (item) => item.ProductVariant?.Product?.createdBy === sellerId,
  );

  if (!hasOwnership) {
    throw {
      status: 403,
      message: "You can only manage orders containing your products",
    };
  }

  return true;
};

// lấy danh sách orderId liên quan tới seller
const getOrderIdsForSeller = async (sellerId) => {
  const { data: sellerProducts, error: productsError } = await supabase
    .from("Product")
    .select("id")
    .eq("createdBy", sellerId);

  if (productsError) {
    throw { status: 500, message: "Failed to get seller products" };
  }

  if (!sellerProducts || sellerProducts.length === 0) {
    return [];
  }

  const productIds = sellerProducts.map((p) => p.id);

  const { data: variants, error: variantsError } = await supabase
    .from("ProductVariant")
    .select("id")
    .in("productId", productIds);

  if (variantsError) {
    throw { status: 500, message: "Failed to get product variants" };
  }

  if (!variants || variants.length === 0) {
    return [];
  }

  const variantIds = variants.map((v) => v.id);

  const { data: orderItems, error: itemsError } = await supabase
    .from("OrderItem")
    .select("orderId")
    .in("productVariantId", variantIds);

  if (itemsError) {
    throw { status: 500, message: "Failed to get order items" };
  }

  return [...new Set((orderItems || []).map((item) => item.orderId))];
};

const membershipService = require("../membership/membershipService");
// Tính tổng tiền SAU KHI áp dụng membership discount
const calculateOrderDetailsWithDiscount = async (cartItems, customerId) => {
  // Tính tổng tiền gốc
  let totalAmount = 0;
  const variantUpdates = [];

  for (const item of cartItems) {
    const basePrice = item.ProductVariant.Product.price;
    const adjustment = item.ProductVariant.priceAdjustment || 0;
    const itemPrice = basePrice + adjustment;
    totalAmount += itemPrice * item.quantity;

    variantUpdates.push({
      variantId: item.productVariantId,
      productId: item.ProductVariant.productId,
      quantityToDeduct: item.quantity,
      currentQuantity: item.ProductVariant.quantity,
    });
  }

  // Lấy membership và discount
  let discountPercentage = 0;
  let membershipTier = "BRONZE";

  try {
    const membership =
      await membershipService.getMembershipByCustomerId(customerId);
    membershipTier = membership.membership;

    const benefits =
      await membershipService.getMembershipBenefits(membershipTier);
    discountPercentage = benefits.discountPercentage || 0;
  } catch (error) {
    console.error("Failed to get membership discount:", error);
    // Tiếp tục không discount nếu lỗi
  }

  // Tính số tiền giảm
  const discountAmount = (totalAmount * discountPercentage) / 100;
  const finalAmount = totalAmount - discountAmount;

  return {
    subtotal: totalAmount, // Tổng tiền gốc
    discountPercentage, // % giảm giá
    discountAmount, // Số tiền giảm
    finalAmount, // Tổng tiền sau giảm
    membershipTier, // Hạng membership
    variantUpdates,
  };
};

module.exports = {
  validatePaymentMethod,
  getCustomerByUserId,
  getSellerByUserId,
  validateAddressOwnership,
  getCartWithItems,
  validateCartItems,
  calculateOrderDetails,
  deductStockAtomic,
  updateProductStock,
  restoreStock,
  restoreOrderStock,
  createOrderRecord,
  createOrderItems,
  createPayment,
  clearCart,
  rollbackOrder,
  validateStatusTransition,
  updateOrderStatusRecord,
  updatePaymentStatus,
  checkOrderOwnership,
  checkSellerOrderOwnership,
  getOrderIdsForSeller,
  calculateOrderDetailsWithDiscount,
};
