// backend/src/features/promotion/promotionService.js
const { supabase } = require("../../configs/supabase");
const { v4: uuidv4 } = require("uuid");
const {
  uploadImageToSupabase,
  deleteImageFromSupabase,
} = require("../../utils/uploadHelper");
//helper
const determineStatus = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) {
    return "UPCOMING";
  } else if (now >= start && now <= end) {
    return "ACTIVE";
  } else {
    return "EXPIRED";
  }
};

const getAllPromotions = async ({ page = 1, limit = 10, status, search }) => {
  let query = supabase.from("Promotion").select(
    `
      id,
      name,
      description,
      image,
      startDate,
      endDate,
      status,
      createdAt,
      updatedAt,
      createdBy,
      Admin!Promotion_createdBy_fkey(
        id,
        User!Admin_userId_fkey(
          id,
          username,
          email
        )
      )
    `,
    { count: "exact" },
  );

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to).order("createdAt", { ascending: false });

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    promotions: data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

const getPromotionById = async (promotionId) => {
  const { data: promotion, error } = await supabase
    .from("Promotion")
    .select(
      `
      id,
      name,
      image,
      description,
      startDate,
      endDate,
      status,
      createdAt,
      updatedAt,
      createdBy,
      Admin!Promotion_createdBy_fkey(
        id,
        User!Admin_userId_fkey(
          id,
          username,
          email
        )
      ),
      Coupon(
        id,
        code,
        discountPercentage,
        maxUsage,
        usageCount
      ),
      ClearanceEvent(
        id,
        clearanceLevel
      )
    `,
    )
    .eq("id", promotionId)
    .single();

  if (error) throw error;
  if (!promotion) throw { status: 404, message: "Promotion not found" };

  const { data: products } = await supabase
    .from("_PromotionProducts")
    .select(
      `
      Product!_PromotionProducts_A_fkey(
        id,
        name,
        price,
        images
      )
    `,
    )
    .eq("B", promotionId);

  const { data: categories } = await supabase
    .from("_PromotionCategories")
    .select(
      `
      Category!_PromotionCategories_A_fkey(
        id,
        name,
        description
      )
    `,
    )
    .eq("B", promotionId);

  return {
    ...promotion,
    appliedProducts: products?.map((p) => p.Product) || [],
    appliedCategories: categories?.map((c) => c.Category) || [],
  };
};

const createPromotion = async ({
  name,
  description,
  startDate,
  endDate,
  createdBy,
  file,
}) => {
  const now = new Date().toISOString();
  const promotionId = uuidv4();

  let imageUrl = null;
  if (file) {
    imageUrl = await uploadImageToSupabase(
      file,
      "promotions",
      `${promotionId}/`,
    );
  }

  const { data: admin } = await supabase
    .from("Admin")
    .select("id")
    .eq("userId", createdBy)
    .single();

  if (!admin) {
    throw { status: 403, message: "Only admins can create promotions" };
  }

  //status sẽ được set tự động dựa trên ngày bắt đầu và kết thúc
  const initialStatus = determineStatus(startDate, endDate);

  const { data, error } = await supabase
    .from("Promotion")
    .insert({
      id: promotionId,
      name,
      description: description || null,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      createdBy: admin.id,
      status: initialStatus,
      image: imageUrl || null,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

const updatePromotion = async (promotionId, updates, file) => {
  const { data: existing } = await supabase
    .from("Promotion")
    .select("id, image, startDate, endDate")
    .eq("id", promotionId)
    .single();

  if (!existing) {
    throw { status: 404, message: "Promotion not found" };
  }
  if (file) {
    if (existing.image) {
      await deleteImageFromSupabase(existing.image, "promotions");
    }
    updates.image = await uploadImageToSupabase(
      file,
      "promotions",
      `${promotionId}/`,
    );
  }
  if (updates.startDate || updates.endDate) {
    const start = updates.startDate ?? existing.startDate;
    const end = updates.endDate ?? existing.endDate;
    updates.status = determineStatus(start, end);
  }

  //chuẩn hóa ngày
  if (updates.startDate) {
    updates.startDate = new Date(updates.startDate).toISOString();
  }
  if (updates.endDate) {
    updates.endDate = new Date(updates.endDate).toISOString();
  }

  const { data, error } = await supabase
    .from("Promotion")
    .update({ ...updates, updatedAt: new Date().toISOString() })
    .eq("id", promotionId)
    .select()
    .single();

  if (error) throw error;

  return data;
};

const updatePromotionStatus = async (promotionId, status) => {
  const { data: existing } = await supabase
    .from("Promotion")
    .select("id, startDate, endDate, status")
    .eq("id", promotionId)
    .single();

  if (!existing) {
    throw { status: 404, message: "Promotion not found" };
  }
  //admin không thể thay đổi trạng thái thành UPCOMING hoặc EXPIRED
  if (status === "UPCOMING" || status === "EXPIRED") {
    const autoStatus = determineStatus(existing.startDate, existing.endDate);
    if (status !== autoStatus) {
      throw {
        status: 400,
        message: `Cannot manually set status to ${status}. This status is auto-determined by dates.`,
      };
    }
  }
  //kiểm tra khi kích hoạt
  if (status === "ACTIVE") {
    const autoStatus = determineStatus(existing.startDate, existing.endDate);
    if (autoStatus === "UPCOMING") {
      throw {
        status: 400,
        message: "Cannot activate promotion before start date",
      };
    }
    if (autoStatus === "EXPIRED") {
      throw {
        status: 400,
        message: "Cannot activate expired promotion",
      };
    }
  }

  const { data, error } = await supabase
    .from("Promotion")
    .update({
      status,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", promotionId)
    .select()
    .single();

  if (error) throw error;

  return data;
};

const deletePromotion = async (promotionId) => {
  const { data: promotion } = await supabase
    .from("Promotion")
    .select("id, image")
    .eq("id", promotionId)
    .single();

  if (!promotion) {
    throw { status: 404, message: "Promotion not found" };
  }
  if (promotion.image) {
    await deleteImageFromSupabase(promotion.image, "promotions");
  }
  await supabase.from("Coupon").delete().eq("promotionId", promotionId);
  await supabase.from("ClearanceEvent").delete().eq("promotionId", promotionId);
  await supabase.from("_PromotionProducts").delete().eq("B", promotionId);
  await supabase.from("_PromotionCategories").delete().eq("B", promotionId);

  const { error } = await supabase
    .from("Promotion")
    .delete()
    .eq("id", promotionId);

  if (error) throw error;

  return true;
};

const applyPromotionToProducts = async (promotionId, productIds) => {
  const { data: promotion } = await supabase
    .from("Promotion")
    .select("id")
    .eq("id", promotionId)
    .single();

  if (!promotion) {
    throw { status: 404, message: "Promotion not found" };
  }

  const { data: products } = await supabase
    .from("Product")
    .select("id")
    .in("id", productIds);

  if (!products || products.length !== productIds.length) {
    throw { status: 400, message: "One or more products not found" };
  }

  await supabase.from("_PromotionProducts").delete().eq("B", promotionId);

  const associations = productIds.map((productId) => ({
    A: productId,
    B: promotionId,
  }));

  const { error } = await supabase
    .from("_PromotionProducts")
    .insert(associations);

  if (error) throw error;

  return {
    promotionId,
    appliedProductsCount: productIds.length,
  };
};

const applyPromotionToCategories = async (promotionId, categoryIds) => {
  const { data: promotion } = await supabase
    .from("Promotion")
    .select("id")
    .eq("id", promotionId)
    .single();

  if (!promotion) {
    throw { status: 404, message: "Promotion not found" };
  }

  const { data: categories } = await supabase
    .from("Category")
    .select("id")
    .in("id", categoryIds);

  if (!categories || categories.length !== categoryIds.length) {
    throw { status: 400, message: "One or more categories not found" };
  }

  await supabase.from("_PromotionCategories").delete().eq("B", promotionId);

  const associations = categoryIds.map((categoryId) => ({
    A: categoryId,
    B: promotionId,
  }));

  const { error } = await supabase
    .from("_PromotionCategories")
    .insert(associations);

  if (error) throw error;

  return {
    promotionId,
    appliedCategoriesCount: categoryIds.length,
  };
};

const getPromotionStats = async () => {
  const { data: promotions } = await supabase
    .from("Promotion")
    .select("status, startDate, endDate");

  if (!promotions) {
    return {
      total: 0,
      upcoming: 0,
      active: 0,
      inactive: 0,
      expired: 0,
    };
  }

  const now = new Date();
  const stats = {
    total: promotions.length,
    upcoming: 0,
    active: 0,
    inactive: 0,
    expired: 0,
  };

  promotions.forEach((promo) => {
    if (promo.status === "INACTIVE") {
      stats.inactive++;
      return;
    }

    const autoStatus = determineStatus(promo.startDate, promo.endDate);

    if (autoStatus === "UPCOMING") {
      stats.upcoming++;
    } else if (autoStatus === "ACTIVE") {
      stats.active++;
    } else if (autoStatus === "EXPIRED") {
      stats.expired++;
    }
  });

  return stats;
};

module.exports = {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  updatePromotionStatus,
  deletePromotion,
  applyPromotionToProducts,
  applyPromotionToCategories,
  getPromotionStats,
};
