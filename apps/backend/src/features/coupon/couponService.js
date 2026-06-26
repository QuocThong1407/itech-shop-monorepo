// backend/src/features/coupon/couponService.js
const { supabase } = require("../../configs/supabase");
const { v4: uuidv4 } = require("uuid");

const createCoupon = async ({
  promotionId,
  code,
  discountPercentage,
  maxUsage,
}) => {
  const { data: promotion, error: promotionError } = await supabase
    .from("Promotion")
    .select("id, status, startDate, endDate")
    .eq("id", promotionId)
    .single();

  if (promotionError || !promotion) {
    throw { status: 404, message: "Promotion not found" };
  }

  const { data: existingCoupon } = await supabase
    .from("Coupon")
    .select("id")
    .eq("code", code.toUpperCase())
    .single();

  if (existingCoupon) {
    throw { status: 400, message: "Coupon code already exists" };
  }

  const { data, error } = await supabase
    .from("Coupon")
    .insert({
      id: uuidv4(),
      promotionId,
      code: code.toUpperCase(),
      discountPercentage: parseFloat(discountPercentage),
      maxUsage: parseInt(maxUsage),
      usageCount: 0,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

const validateCoupon = async (code, orderAmount) => {
  const { data: coupon, error } = await supabase
    .from("Coupon")
    .select(
      `
      id,
      code,
      discountPercentage,
      maxUsage,
      usageCount,
      promotionId,
      Promotion!Coupon_promotionId_fkey(
        id,
        name,
        status,
        startDate,
        endDate
      )
    `,
    )
    .eq("code", code.toUpperCase())
    .single();

  if (error || !coupon) {
    throw { status: 404, message: "Coupon not found" };
  }

  // Kiểm tra promotion có active không
  if (coupon.Promotion.status !== "ACTIVE") {
    throw { status: 400, message: "This coupon's promotion is not active" };
  }

  // Kiểm tra thời gian promotion
  const now = new Date();
  const startDate = new Date(coupon.Promotion.startDate);
  const endDate = new Date(coupon.Promotion.endDate);

  if (now < startDate) {
    throw { status: 400, message: "This promotion has not started yet" };
  }

  if (now > endDate) {
    throw { status: 400, message: "This promotion has expired" };
  }

  // Kiểm tra số lần sử dụng
  if (coupon.usageCount >= coupon.maxUsage) {
    throw {
      status: 400,
      message: "This coupon has reached its maximum usage limit",
    };
  }

  // Tính discount
  const discountAmount = (orderAmount * coupon.discountPercentage) / 100;
  const finalAmount = orderAmount - discountAmount;

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
      promotionName: coupon.Promotion.name,
    },
    calculation: {
      originalAmount: orderAmount,
      discountPercentage: coupon.discountPercentage,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2)),
    },
    remainingUsage: coupon.maxUsage - coupon.usageCount,
  };
};

const updateCoupon = async (
  couponId,
  { code, discountPercentage, maxUsage, usageCount },
) => {
  const { data: existing } = await supabase
    .from("Coupon")
    .select("id")
    .eq("id", couponId)
    .single();

  if (!existing) {
    throw { status: 404, message: "Coupon not found" };
  }

  const updateData = {};

  if (code) {
    // Kiểm tra code
    const { data: duplicate } = await supabase
      .from("Coupon")
      .select("id")
      .eq("code", code.toUpperCase())
      .neq("id", couponId)
      .single();

    if (duplicate) {
      throw { status: 400, message: "Coupon code already exists" };
    }
    updateData.code = code.toUpperCase();
  }

  if (discountPercentage !== undefined) {
    updateData.discountPercentage = parseFloat(discountPercentage);
  }

  if (maxUsage !== undefined) {
    updateData.maxUsage = parseInt(maxUsage);
  }

  if (usageCount !== undefined) {
    updateData.usageCount = parseInt(usageCount);
  }

  const { data, error } = await supabase
    .from("Coupon")
    .update(updateData)
    .eq("id", couponId)
    .select()
    .single();

  if (error) throw error;

  return data;
};

const getCouponsByPromotion = async (promotionId) => {
  const { data: promotion } = await supabase
    .from("Promotion")
    .select("id, name")
    .eq("id", promotionId)
    .single();

  if (!promotion) {
    throw { status: 404, message: "Promotion not found" };
  }

  const { data: coupons, error } = await supabase
    .from("Coupon")
    .select(
      `
      id,
      code,
      discountPercentage,
      maxUsage,
      usageCount,
      promotionId
    `,
    )
    .eq("promotionId", promotionId)
    .order("code", { ascending: true });

  if (error) throw error;

  return {
    promotion: {
      id: promotion.id,
      name: promotion.name,
    },
    coupons: coupons || [],
    totalCoupons: coupons ? coupons.length : 0,
  };
};
const getCouponById = async (couponId) => {
  const { data: coupon, error } = await supabase
    .from("Coupon")
    .select(
      `
      id,
      code,
      discountPercentage,
      maxUsage,
      usageCount,
      promotionId,
      Promotion!Coupon_promotionId_fkey(
        id,
        name,
        description,
        status,
        startDate,
        endDate
      )
    `,
    )
    .eq("id", couponId)
    .single();

  if (error || !coupon) {
    throw { status: 404, message: "Coupon not found" };
  }

  return coupon;
};

const deleteCoupon = async (couponId) => {
  const { data: existing } = await supabase
    .from("Coupon")
    .select("id")
    .eq("id", couponId)
    .single();

  if (!existing) {
    throw { status: 404, message: "Coupon not found" };
  }

  const { error } = await supabase.from("Coupon").delete().eq("id", couponId);

  if (error) throw error;

  return true;
};

const getAllCoupons = async ({ page = 1, limit = 10, promotionId, search }) => {
  let query = supabase.from("Coupon").select(
    `
      id,
      code,
      discountPercentage,
      maxUsage,
      usageCount,
      promotionId,
      Promotion!Coupon_promotionId_fkey(
        id,
        name,
        status,
        startDate,
        endDate
      )
    `,
    { count: "exact" },
  );

  if (promotionId) {
    query = query.eq("promotionId", promotionId);
  }

  if (search) {
    query = query.ilike("code", `%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to).order("code", { ascending: true });

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    coupons: data || [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

// couponService.js - thêm function mới
const getAvailableCoupons = async (orderAmount) => {
  const { data: coupons, error } = await supabase
    .from("Coupon")
    .select(`
      id,
      code,
      discountPercentage,
      maxUsage,
      usageCount,
      Promotion!Coupon_promotionId_fkey(
        id,
        name,
        status,
        startDate,
        endDate
      )
    `);

  if (error) throw error;

  const available = (coupons || []).filter((c) => {
    const p = c.Promotion;
    if (!p || p.status !== "ACTIVE") return false;
    if (new Date(p.startDate) > new Date()) return false;
    if (new Date(p.endDate) < new Date()) return false;
    if (c.usageCount >= c.maxUsage) return false;  // hết lượt dùng
    return true;
  });

  return available.map((c) => ({
    id: c.id,
    code: c.code,
    discountPercentage: c.discountPercentage,
    discountAmount: parseFloat(((orderAmount * c.discountPercentage) / 100).toFixed(0)),
    promotionName: c.Promotion.name,
    remainingUsage: c.maxUsage - c.usageCount,
  }));
};

module.exports = {
  createCoupon,
  validateCoupon,
  updateCoupon,
  getCouponsByPromotion,
  getCouponById,
  deleteCoupon,
  getAllCoupons,
  getAvailableCoupons,
};
