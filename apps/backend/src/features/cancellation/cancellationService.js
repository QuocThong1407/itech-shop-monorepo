// backend/src/features/cancellation/cancellationService.js
const { supabase } = require("../../configs/supabase");
const { v4: uuidv4 } = require("uuid");

// lấy customer từ userId
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

// lấy seller từ userId
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

// kiểm tra quyền seller với order
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
      message:
        "You can only manage cancellations for orders containing your products",
    };
  }

  return true;
};

// hoàn lại stock cho order
const restoreOrderStock = async (orderId, timestamp) => {
  const { data: orderItems } = await supabase
    .from("OrderItem")
    .select(
      `
      productVariantId,
      quantity,
      ProductVariant!OrderItem_productVariantId_fkey(
        productId,
        quantity
      )
    `,
    )
    .eq("orderId", orderId);

  if (!orderItems || orderItems.length === 0) return;

  const productIds = new Set();

  for (const item of orderItems) {
    const { data: currentVariant } = await supabase
      .from("ProductVariant")
      .select("quantity")
      .eq("id", item.productVariantId)
      .single();

    if (currentVariant) {
      await supabase
        .from("ProductVariant")
        .update({
          quantity: currentVariant.quantity + item.quantity,
          updatedAt: timestamp,
        })
        .eq("id", item.productVariantId);

      if (item.ProductVariant) {
        productIds.add(item.ProductVariant.productId);
      }
    }
  }

  // Cập nhật stock tổng của product
  for (const productId of productIds) {
    const { data: allVariants } = await supabase
      .from("ProductVariant")
      .select("quantity")
      .eq("productId", productId);

    const totalStock = (allVariants || []).reduce(
      (sum, v) => sum + (v.quantity || 0),
      0,
    );

    await supabase
      .from("Product")
      .update({ stockQuantity: totalStock, updatedAt: timestamp })
      .eq("id", productId);
  }
};

// tạo yêu cầu hủy đơn
const createCancellationRequest = async (orderId, reason, userId) => {
  const timestamp = new Date().toISOString();

  const customer = await getCustomerByUserId(userId);

  // Kiểm tra order tồn tại và thuộc về customer
  const { data: order, error: orderError } = await supabase
    .from("Order")
    .select(
      `
      id,
      status,
      customerId,
      orderDate,
      Customer!Order_customerId_fkey(
        userId
      )
    `,
    )
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw { status: 404, message: "Order not found" };
  }

  if (order.Customer.userId !== userId) {
    throw {
      status: 403,
      message: "You can only request cancellations for your own orders",
    };
  }

  // Chỉ cho phép hủy khi đơn chưa DELIVERED hoặc CANCELLED
  const allowedStatuses = ["PENDING", "CONFIRMED", "SHIPPED"];
  if (!allowedStatuses.includes(order.status)) {
    throw {
      status: 400,
      message: `Cannot cancel order with status ${order.status}. Only PENDING, CONFIRMED, or SHIPPED orders can be cancelled.`,
    };
  }

  // Kiểm tra xem đã có cancellation request chưa
  const { data: existingCancellation } = await supabase
    .from("Cancellation")
    .select("id, status")
    .eq("orderId", orderId)
    .single();

  if (existingCancellation) {
    throw {
      status: 400,
      message: `A cancellation request already exists for this order with status: ${existingCancellation.status}`,
    };
  }

  // Tạo cancellation request
  const { data: cancellation, error } = await supabase
    .from("Cancellation")
    .insert({
      id: uuidv4(),
      orderId,
      reason,
      status: "REQUESTED",
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .select(
      `
      id,
      orderId,
      reason,
      status,
      createdAt,
      updatedAt,
      Order!Cancellation_orderId_fkey(
        id,
        orderDate,
        status,
        Customer!Order_customerId_fkey(
          id,
          User!Customer_userId_fkey(
            id,
            username,
            email
          )
        )
      )
    `,
    )
    .single();

  if (error) throw error;

  return cancellation;
};

// Cập nhật trạng thái cancellation
const updateCancellationStatus = async (
  cancellationId,
  newStatus,
  userId,
  userRole,
) => {
  const timestamp = new Date().toISOString();

  // Lấy thông tin cancellation request
  const { data: cancellation, error: getError } = await supabase
    .from("Cancellation")
    .select(
      `
      id,
      orderId,
      status,
      Order!Cancellation_orderId_fkey(
        id,
        status
      )
    `,
    )
    .eq("id", cancellationId)
    .single();

  if (getError || !cancellation) {
    throw { status: 404, message: "Cancellation request not found" };
  }

  // Kiểm tra quyền seller
  if (userRole === "SELLER") {
    const seller = await getSellerByUserId(userId);
    await checkSellerOrderOwnership(cancellation.orderId, seller.id);
  }

  // Validate status transition
  const validTransitions = {
    REQUESTED: ["APPROVED", "REJECTED"],
    APPROVED: ["COMPLETED"],
    REJECTED: [],
    COMPLETED: [],
  };

  const allowedNext = validTransitions[cancellation.status] || [];

  if (!allowedNext.includes(newStatus)) {
    throw {
      status: 400,
      message: `Invalid status transition: ${cancellation.status} → ${newStatus}. Allowed: ${allowedNext.join(", ") || "none"}`,
    };
  }

  // Cập nhật status của cancellation
  const { data: updated, error: updateError } = await supabase
    .from("Cancellation")
    .update({
      status: newStatus,
      updatedAt: timestamp,
    })
    .eq("id", cancellationId)
    .eq("status", cancellation.status)
    .select(
      `
      id,
      orderId,
      reason,
      status,
      createdAt,
      updatedAt,
      Order!Cancellation_orderId_fkey(
        id,
        orderDate,
        status,
        Customer!Order_customerId_fkey(
          id,
          User!Customer_userId_fkey(
            id,
            username,
            email
          )
        )
      )
    `,
    )
    .single();

  if (updateError) {
    throw {
      status: 409,
      message:
        "Cancellation status was modified by another request. Please refresh and try again.",
    };
  }

  // Nếu COMPLETED, hoàn lại stock, cập nhật order và payment
  if (newStatus === "COMPLETED") {
    await restoreOrderStock(cancellation.orderId, timestamp);

    // Cập nhật order status về CANCELLED
    await supabase
      .from("Order")
      .update({ status: "CANCELLED", updatedAt: timestamp })
      .eq("id", cancellation.orderId);

    // Cập nhật payment status về FAILED
    await supabase
      .from("Payment")
      .update({ status: "FAILED", updatedAt: timestamp })
      .eq("orderId", cancellation.orderId);
  }

  return updated;
};

// lấy danh sách cancellation của customer
const getMyCancellations = async (userId, { page = 1, limit = 10, status }) => {
  const customer = await getCustomerByUserId(userId);

  let query = supabase
    .from("Cancellation")
    .select(
      `
      id,
      reason,
      status,
      createdAt,
      updatedAt,
      Order!Cancellation_orderId_fkey(
        id,
        orderDate,
        status,
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
        )
      )
    `,
      { count: "exact" },
    )
    .eq("Order.customerId", customer.id);

  if (status) {
    query = query.eq("status", status);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to).order("createdAt", { ascending: false });

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    cancellations: data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

// lấy tất cả cancellation (admin/seller)
const getAllCancellations = async (
  { page = 1, limit = 10, status, search },
  userId,
  userRole,
) => {
  let cancellationIdsFilter = null;

  // Nếu là seller, chỉ lấy cancellations của orders có sản phẩm của mình
  if (userRole === "SELLER") {
    const seller = await getSellerByUserId(userId);

    const { data: sellerProducts } = await supabase
      .from("Product")
      .select("id")
      .eq("createdBy", seller.id);

    if (!sellerProducts || sellerProducts.length === 0) {
      return {
        cancellations: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
        },
      };
    }

    const productIds = sellerProducts.map((p) => p.id);

    const { data: variants } = await supabase
      .from("ProductVariant")
      .select("id")
      .in("productId", productIds);

    if (!variants || variants.length === 0) {
      return {
        cancellations: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
        },
      };
    }

    const variantIds = variants.map((v) => v.id);

    const { data: orderItems } = await supabase
      .from("OrderItem")
      .select("orderId")
      .in("productVariantId", variantIds);

    const orderIds = [
      ...new Set((orderItems || []).map((item) => item.orderId)),
    ];

    const { data: cancellations } = await supabase
      .from("Cancellation")
      .select("id")
      .in("orderId", orderIds);

    cancellationIdsFilter = (cancellations || []).map((c) => c.id);

    if (cancellationIdsFilter.length === 0) {
      return {
        cancellations: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  let query = supabase.from("Cancellation").select(
    `
      id,
      reason,
      status,
      createdAt,
      updatedAt,
      Order!Cancellation_orderId_fkey(
        id,
        orderDate,
        status,
        customerId,
        Customer!Order_customerId_fkey(
          id,
          User!Customer_userId_fkey(
            id,
            username,
            email
          )
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
      )
    `,
    { count: "exact" },
  );

  if (cancellationIdsFilter) {
    query = query.in("id", cancellationIdsFilter);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    // Tìm users theo username hoặc email
    const { data: users } = await supabase
      .from("User")
      .select("id")
      .or(`username.ilike.%${search}%,email.ilike.%${search}%`);

    if (!users || users.length === 0) {
      return {
        cancellations: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
        },
      };
    }

    const userIds = users.map((u) => u.id);

    // Tìm customers từ userIds
    const { data: customers } = await supabase
      .from("Customer")
      .select("id")
      .in("userId", userIds);

    if (!customers || customers.length === 0) {
      return {
        cancellations: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
        },
      };
    }

    const customerIds = customers.map((c) => c.id);

    // Tìm orders từ customerIds
    const { data: orders } = await supabase
      .from("Order")
      .select("id")
      .in("customerId", customerIds);

    if (!orders || orders.length === 0) {
      return {
        cancellations: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
        },
      };
    }

    const orderIds = orders.map((o) => o.id);
    query = query.in("orderId", orderIds);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to).order("createdAt", { ascending: false });

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    cancellations: data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

// lấy chi tiết cancellation
const getCancellationById = async (cancellationId, userId, userRole) => {
  const { data: cancellation, error } = await supabase
    .from("Cancellation")
    .select(
      `
      id,
      orderId,
      reason,
      status,
      createdAt,
      updatedAt,
      Order!Cancellation_orderId_fkey(
        id,
        orderDate,
        status,
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
        )
      )
    `,
    )
    .eq("id", cancellationId)
    .single();

  if (error) throw error;
  if (!cancellation) {
    throw { status: 404, message: "Cancellation request not found" };
  }
  // Kiểm tra quyền truy cập
  if (
    userRole === "CUSTOMER" &&
    cancellation.Order.Customer.userId !== userId
  ) {
    throw {
      status: 403,
      message: "You can only access your own cancellation requests",
    };
  }

  if (userRole === "SELLER") {
    const seller = await getSellerByUserId(userId);
    await checkSellerOrderOwnership(cancellation.orderId, seller.id);
  }

  return cancellation;
};

module.exports = {
  createCancellationRequest,
  updateCancellationStatus,
  getMyCancellations,
  getAllCancellations,
  getCancellationById,
};
