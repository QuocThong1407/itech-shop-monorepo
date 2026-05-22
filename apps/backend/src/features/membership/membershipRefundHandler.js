// backend/src/features/membership/membershipRefundHandler.js
const { supabase } = require("../../configs/supabase");
const { calculateMembershipTier } = require("./membershipService");

//trừ spent khi order bị cancel/return, gọi từ orderService
const handleOrderRefund = async (orderId) => {
  const now = new Date().toISOString();

  try {
    // 1. Lấy order + OrderItem
    const { data: order, error: orderError } = await supabase
      .from("Order")
      .select(
        `
        id, customerId,
        OrderItem!OrderItem_orderId_fkey(
          quantity,
          ProductVariant!OrderItem_productVariantId_fkey(
            priceAdjustment,
            Product!ProductVariant_productId_fkey(price)
          )
        )
      `,
      )
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderId);
      return { success: false, reason: "Order not found" };
    }

    // 2. Tính subtotal từ OrderItem (thay vì dùng payment.amount)
    let subtotal = 0;
    for (const item of order.OrderItem) {
      const basePrice = item.ProductVariant.Product.price;
      const adjustment = item.ProductVariant.priceAdjustment || 0;
      subtotal += (basePrice + adjustment) * item.quantity;
    }

    if (subtotal <= 0) {
      return { success: false, reason: "Invalid order amount" };
    }

    // 3. Lấy membership
    const { data: membership, error: membershipError } = await supabase
      .from("Membership")
      .select("id, membership, spent")
      .eq("customerId", order.customerId)
      .single();

    if (membershipError || !membership) {
      console.error("Membership not found for customer:", order.customerId);
      return { success: false, reason: "Membership not found" };
    }

    // 4. Trừ spent (dùng subtotal thay vì payment.amount)
    const newSpent = Math.max(0, membership.spent - subtotal);
    const newTier = await calculateMembershipTier(newSpent);

    // 5. Update
    const { data: updated, error: updateError } = await supabase
      .from("Membership")
      .update({
        spent: newSpent,
        membership: newTier,
        updatedAt: now,
      })
      .eq("id", membership.id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update membership:", updateError);
      return { success: false, reason: updateError.message };
    }

    const wasDowngraded =
      ["BRONZE", "SILVER", "GOLD", "PLATINUM"].indexOf(newTier) <
      ["BRONZE", "SILVER", "GOLD", "PLATINUM"].indexOf(membership.membership);

    console.log(
      `Membership refunded for customer ${order.customerId}: -${subtotal} (${membership.membership} → ${newTier})`,
    );

    return {
      success: true,
      customerId: order.customerId,
      refundedAmount: subtotal, // ← Trả về subtotal thay vì payment.amount
      previousSpent: membership.spent,
      newSpent: newSpent,
      previousTier: membership.membership,
      newTier: newTier,
      downgraded: wasDowngraded,
    };
  } catch (error) {
    console.error("Handle order refund error:", error);
    return { success: false, reason: error.message };
  }
};

//xử lý khi order được restore (từ CANCELLED trở lại)
//trường hợp: admin restore order đã cancel
const handleOrderRestore = async (orderId) => {
  const now = new Date().toISOString();

  try {
    // 1. Lấy order + OrderItem
    const { data: order } = await supabase
      .from("Order")
      .select(
        `
        id, customerId,
        OrderItem!OrderItem_orderId_fkey(
          quantity,
          ProductVariant!OrderItem_productVariantId_fkey(
            priceAdjustment,
            Product!ProductVariant_productId_fkey(price)
          )
        )
      `,
      )
      .eq("id", orderId)
      .single();

    if (!order) return { success: false, reason: "Order not found" };

    // 2. Tính subtotal từ OrderItem
    let subtotal = 0;
    for (const item of order.OrderItem) {
      const basePrice = item.ProductVariant.Product.price;
      const adjustment = item.ProductVariant.priceAdjustment || 0;
      subtotal += (basePrice + adjustment) * item.quantity;
    }

    if (subtotal <= 0) return { success: false, reason: "Invalid subtotal" };

    // 3. Lấy membership ← THIẾU ĐOẠN NÀY!
    const { data: membership } = await supabase
      .from("Membership")
      .select("id, membership, spent")
      .eq("customerId", order.customerId)
      .single();

    if (!membership) return { success: false, reason: "Membership not found" };

    // 4. Tính tier mới
    const newSpent = membership.spent + subtotal;
    const newTier = await calculateMembershipTier(newSpent);

    // 5. Update
    await supabase
      .from("Membership")
      .update({
        spent: newSpent,
        membership: newTier,
        updatedAt: now,
      })
      .eq("id", membership.id);

    console.log(
      `Membership restored for customer ${order.customerId}: +${subtotal} (${membership.membership} → ${newTier})`,
    );

    return { success: true, newSpent, newTier };
  } catch (error) {
    console.error("Handle order restore error:", error);
    return { success: false, reason: error.message };
  }
};

module.exports = {
  handleOrderRefund,
  handleOrderRestore,
};
