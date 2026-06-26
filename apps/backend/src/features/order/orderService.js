// backend/src/features/order/orderService.js
const { supabase } = require("../../configs/supabase");
const orderHelper = require("./orderHelper");
const membershipService = require("../membership/membershipService");
const membershipRefundHandler = require("../membership/membershipRefundHandler");
// tạo order mới từ cart của customer
const createOrder = async (userId, addressId, paymentMethod = "COD", buyNowVariantId = null) => {
  const timestamp = new Date().toISOString();

  orderHelper.validatePaymentMethod(paymentMethod);
  const customer = await orderHelper.getCustomerByUserId(userId);
  await orderHelper.validateAddressOwnership(addressId, customer.id);

  const { cart, cartItems } = await orderHelper.getCartWithItems(customer.id);
  
  const itemsToOrder = buyNowVariantId
    ? cartItems.filter(item => item.ProductVariant.id === buyNowVariantId)
    : cartItems;

  orderHelper.validateCartItems(itemsToOrder);

  const { subtotal, discountPercentage, discountAmount, finalAmount, membershipTier, variantUpdates } =
    await orderHelper.calculateOrderDetailsWithDiscount(itemsToOrder, customer.id);

  let order = null;
  let createdItemIds = [];
  const updatedProductIds = new Set();

  try {
    order = await orderHelper.createOrderRecord(customer.id, addressId, timestamp);

    for (const update of variantUpdates) {
      await orderHelper.deductStockAtomic(update.variantId, update.quantityToDeduct, timestamp);
      updatedProductIds.add(update.productId);
    }

    for (const productId of updatedProductIds) {
      await orderHelper.updateProductStock(productId, timestamp);
    }

    const createdItems = await orderHelper.createOrderItems(order.id, itemsToOrder, timestamp);
    createdItemIds = createdItems.map(item => item.id);

    await orderHelper.createPayment(order.id, finalAmount, paymentMethod, timestamp);

    if (buyNowVariantId) {
      await orderHelper.removeCartItem(cart.id, buyNowVariantId);
    } else {
      await orderHelper.clearCart(cart.id);
    }

    return await getOrderById(order.id, userId, "CUSTOMER");
  } catch (error) {
    if (order) {
      await orderHelper.rollbackOrder(order.id, createdItemIds, variantUpdates, timestamp);
    }
    throw { status: 500, message: error.message || "Failed to create order. All changes rolled back." };
  }
};

// lấy danh sách orders của customer
const getMyOrders = async (userId, { page = 1, limit = 10, status }) => {
  const customer = await orderHelper.getCustomerByUserId(userId);

  // query orders theo customer
  let query = supabase
  .from("Order")
  .select(
    `
    id,
    orderDate,
    status,
    createdAt,
    updatedAt,
    Address!Order_addressId_fkey(
      id,
      phoneNumber,
      address,
      street,
      ward,
      district,
      province
    ),
    OrderItem(
      id,
      quantity,
      ProductVariant!OrderItem_productVariantId_fkey(
        id,
        variantAttributes,
        priceAdjustment,
        Product!ProductVariant_productId_fkey(
          id,
          name,
          price,
          images
        )
      )
    ),
    Payment(
      id,
      amount,
      method,
      status
    ),
    Cancellation!Cancellation_orderId_fkey(
      id,
      status
    ),
    Return!Return_orderId_fkey(
      id,
      status
    )
  `,
    { count: "exact" },
  )
    .eq("customerId", customer.id);

  // filter theo trạng thái
  if (status) {
    query = query.eq("status", status);
  }

  // phân trang
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to).order("orderDate", { ascending: false });

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    orders: data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

// lấy tất cả orders (admin / seller)
const getAllOrders = async (
  { page = 1, limit = 10, status, search },
  userId,
  userRole,
) => {
  // nếu là seller chỉ lấy orders có sản phẩm của mình
  let orderIdsFilter = null;
  if (userRole === "SELLER") {
    const seller = await orderHelper.getSellerByUserId(userId);
    orderIdsFilter = await orderHelper.getOrderIdsForSeller(seller.id);

    if (orderIdsFilter.length === 0) {
      return {
        orders: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  // query danh sách order
  let query = supabase.from("Order").select(
    `
      id,
      orderDate,
      status,
      createdAt,
      updatedAt,
      customerId,
      Customer!Order_customerId_fkey(
        id,
        User!Customer_userId_fkey(
          id,
          username,
          email
        )
      ),
      Address!Order_addressId_fkey(
        id,
        phoneNumber,
        address,
        street,
        ward,
        district,
        province
      ),
      OrderItem(
        id,
        quantity,
        ProductVariant!OrderItem_productVariantId_fkey(
          id,
          variantAttributes,
          priceAdjustment,
          Product!ProductVariant_productId_fkey(
            id,
            name,
            price,
            images,
            createdBy
          )
        )
      ),
      Payment(
        id,
        amount,
        method,
        status
      )
    `,
    { count: "exact" },
  );

  // filter theo seller
  if (orderIdsFilter) {
    query = query.in("id", orderIdsFilter);
  }

  // filter theo trạng thái
  if (status) {
    query = query.eq("status", status);
  }

  // tìm kiếm theo username hoặc email
  if (search) {
    const { data: customers } = await supabase
      .from("Customer")
      .select(
        `
        id,
        User!Customer_userId_fkey(
          username,
          email
        )
      `,
      )
      .or(`User.username.ilike.%${search}%,User.email.ilike.%${search}%`);

    if (customers && customers.length > 0) {
      const customerIds = customers.map((c) => c.id);
      query = query.in("customerId", customerIds);
    } else {
      return {
        orders: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  // phân trang
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to).order("orderDate", { ascending: false });

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    orders: data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

// lấy chi tiết một order
const getOrderById = async (orderId, userId, userRole) => {
  const { data: order, error } = await supabase
  .from("Order")
  .select(
    `
    id,
    orderDate,
    status,
    createdAt,
    updatedAt,
    customerId,
    Customer!Order_customerId_fkey(
      id,
      userId,
      User!Customer_userId_fkey(
        id,
        username,
        email
      )
    ),
    Address!Order_addressId_fkey(
      id,
      phoneNumber,
      address,
      street,
      ward,
      district,
      province
    ),
    OrderItem(
      id,
      quantity,
      ProductVariant!OrderItem_productVariantId_fkey(
        id,
        variantAttributes,
        priceAdjustment,
        images,
        Product!ProductVariant_productId_fkey(
          id,
          name,
          description,
          price,
          images,
          createdBy
        )
      )
    ),
    Payment(
      id,
      amount,
      method,
      status,
      paymentDate
    ),
    Cancellation!Cancellation_orderId_fkey(
      id,
      status
    ),
    Return!Return_orderId_fkey(
      id,
      status
    )
  `,
  )
  .eq("id", orderId)
  .single();

  if (error) throw error;
  if (!order) throw { status: 404, message: "Order not found" };

  // kiểm tra quyền customer
  orderHelper.checkOrderOwnership(order, userId, userRole);

  // kiểm tra quyền seller
  if (userRole === "SELLER") {
    const seller = await orderHelper.getSellerByUserId(userId);
    await orderHelper.checkSellerOrderOwnership(orderId, seller.id);
  }

  return order;
};

// cập nhật trạng thái order
const updateOrderStatus = async (orderId, newStatus, userId, userRole) => {
  // kiểm tra seller có quyền với order
  if (userRole === "SELLER") {
    const seller = await orderHelper.getSellerByUserId(userId);
    await orderHelper.checkSellerOrderOwnership(orderId, seller.id);
  }

  const { data: order, error: getError } = await supabase
    .from("Order")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (getError || !order) {
    throw { status: 404, message: "Order not found" };
  }

  // validate chuyển trạng thái
  orderHelper.validateStatusTransition(order.status, newStatus);

  const timestamp = new Date().toISOString();
  const oldStatus = order.status;

  // cập nhật trạng thái order
  const updatedOrder = await orderHelper.updateOrderStatusRecord(
    orderId,
    order.status,
    newStatus,
    timestamp,
  );

  // cập nhật trạng thái payment
  await orderHelper.updatePaymentStatus(orderId, newStatus, timestamp);
  // case: order → DELIVERED → cộng spent + upgrade membership
  if (oldStatus !== "DELIVERED" && newStatus === "DELIVERED") {
    //tránh cộng lại
    try {
      const result = await membershipRefundHandler.handleOrderRestore(orderId);

      if (result.success) {
        console.log(
          `Membership earned: +${result.newSpent} (${result.newTier})`,
        );
      }
    } catch (err) {
      console.error("Failed to update membership on delivery:", err);
    }
  }

  // case 2: order PENDING/SHIPPED → CANCELLED  → hoàn tồn kho
  if (newStatus === "CANCELLED") {
    // hoàn tồn kho
    await orderHelper.restoreOrderStock(orderId, timestamp);

    // nếu trước đó là DELIVERED → trừ spent
    if (oldStatus === "DELIVERED") {
      try {
        const refundResult =
          await membershipRefundHandler.handleOrderRefund(orderId);

        if (refundResult.success) {
          if (refundResult.downgraded) {
            console.log(
              `Customer downgraded: ${refundResult.previousTier} → ${refundResult.newTier}`,
            );
          }
          console.log(
            `Refunded ${refundResult.refundedAmount} from membership`,
          );
        }
      } catch (err) {
        console.error("Failed to refund membership:", err);
      }
    }
  }

  return updatedOrder;
};

// xóa order khi đang ở trạng thái pending
const deleteOrder = async (orderId, userId, userRole) => {
  const { data: order, error: getError } = await supabase
    .from("Order")
    .select(
      `
      id,
      status,
      customerId,
      Customer!Order_customerId_fkey(
        userId
      )
    `,
    )
    .eq("id", orderId)
    .single();

  if (getError || !order) {
    throw { status: 404, message: "Order not found" };
  }

  // chỉ cho phép xóa order pending
  if (order.status !== "PENDING") {
    throw {
      status: 400,
      message: "Only PENDING orders can be deleted",
    };
  }

  // kiểm tra quyền customer
  orderHelper.checkOrderOwnership(order, userId, userRole);

  // seller không được xóa order
  if (userRole === "SELLER") {
    throw {
      status: 403,
      message: "Sellers cannot delete orders. Please update status instead.",
    };
  }

  const timestamp = new Date().toISOString();

  // hoàn lại tồn kho
  await orderHelper.restoreOrderStock(orderId, timestamp);

  // xóa payment và order item
  await supabase.from("Payment").delete().eq("orderId", orderId);
  await supabase.from("OrderItem").delete().eq("orderId", orderId);

  // xóa order
  const { error } = await supabase.from("Order").delete().eq("id", orderId);

  if (error) throw error;

  return true;
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};
