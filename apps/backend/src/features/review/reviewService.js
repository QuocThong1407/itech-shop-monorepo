// backend/src/features/review/reviewService.js
const { supabase } = require("../../configs/supabase");
const { v4: uuidv4 } = require("uuid");
const {
  uploadImageToSupabase,
  deleteImageFromSupabase,
} = require("../../utils/uploadHelper");

const getAllReviews = async ({ page = 1, limit = 10, rating, productId }) => {
  let orderItemIds = null;

  if (productId) {
    const { data: orderItems, error: oiError } = await supabase
      .from("OrderItem")
      .select(
        `
        id,
        productVariant:ProductVariant!inner(
          productId
        )
        `,
      )
      .eq("productVariant.productId", productId);

    if (oiError) throw oiError;

    orderItemIds = orderItems.map((oi) => oi.id);

    if (orderItemIds.length === 0) {
      return {
        reviews: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  let query = supabase.from("Review").select(
    `
      id,
      rating,
      comment,
      images,
      reviewDate,
      createdAt,
      updatedAt,
      orderItemId,
      customerId,
      orderItem:OrderItem!Review_orderItemId_fkey(
        id,
        productVariant:ProductVariant!OrderItem_productVariantId_fkey(
          id,
          product:Product!ProductVariant_productId_fkey(
            id,
            name
          )
        )
      ),
      customer:Customer!Review_customerId_fkey(
        id,
        user:User!Customer_userId_fkey(
          username
        )
      )
      `,
    { count: "exact" },
  );

  if (orderItemIds) {
    query = query.in("orderItemId", orderItemIds);
  }
  if (rating) {
    query = query.eq("rating", parseInt(rating));
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to).order("reviewDate", { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    reviews: data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

const getReviewById = async (reviewId) => {
  const { data: review, error } = await supabase
    .from("Review")
    .select(
      `
      id,
      rating,
      comment,
      images,
      reviewDate,
      createdAt,
      updatedAt,
      orderItemId,
      customerId,
      orderItem:OrderItem!Review_orderItemId_fkey(
        id,
        quantity,
        productVariant:ProductVariant!OrderItem_productVariantId_fkey(
          id,
          product:Product!ProductVariant_productId_fkey(
            id,
            name,
            description,
            images
          )
        )
      ),
      customer:Customer!Review_customerId_fkey(
        id,
        user:User!Customer_userId_fkey(
          username,
          email
        )
      )
    `,
    )
    .eq("id", reviewId)
    .single();

  if (error) throw error;
  if (!review) throw { status: 404, message: "Review not found" };

  return review;
};

const getReviewsByProduct = async (
  productId,
  { page = 1, limit = 10, rating },
) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: orderItems, error: oiError } = await supabase
    .from("OrderItem")
    .select(
      `
      id,
      productVariant:ProductVariant!inner(
        productId
      )
    `,
    )
    .eq("productVariant.productId", productId);

  if (oiError) throw oiError;

  const orderItemIds = orderItems.map((oi) => oi.id);

  if (orderItemIds.length === 0) {
    return {
      reviews: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        totalPages: 0,
      },
      averageRating: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  let query = supabase.from("Review").select(
    `
      id,
      rating,
      comment,
      images,
      reviewDate,
      createdAt,
      orderItemId,
      customer:Customer!Review_customerId_fkey(
        id,
        user:User!Customer_userId_fkey(
          username
        )
      )
    `,
    { count: "exact" },
  );

  query = query.in("orderItemId", orderItemIds);

  if (rating) {
    query = query.eq("rating", parseInt(rating));
  }

  query = query.range(from, to).order("reviewDate", { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;

  // Tính average rating và distribution
  const { data: allReviews } = await supabase
    .from("Review")
    .select("rating")
    .in("orderItemId", orderItemIds);

  const avgRating =
    allReviews && allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (allReviews) {
    allReviews.forEach((r) => {
      distribution[r.rating]++;
    });
  }

  return {
    reviews: data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit),
    },
    averageRating: Math.round(avgRating * 10) / 10,
    ratingDistribution: distribution,
  };
};

const getReviewsByVariant = async (
  variantId,
  { page = 1, limit = 10, rating },
) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: variant, error: variantError } = await supabase
    .from("ProductVariant")
    .select("id, productId")
    .eq("id", variantId)
    .single();

  if (variantError || !variant) {
    throw { status: 404, message: "Product variant not found" };
  }

  const { data: orderItems, error: oiError } = await supabase
    .from("OrderItem")
    .select("id")
    .eq("productVariantId", variantId);

  if (oiError) throw oiError;

  const orderItemIds = orderItems.map((oi) => oi.id);

  if (orderItemIds.length === 0) {
    return {
      reviews: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        totalPages: 0,
      },
      averageRating: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      variantInfo: {
        id: variant.id,
        productId: variant.productId,
      },
    };
  }

  let query = supabase.from("Review").select(
    `
      id,
      rating,
      comment,
      images,
      reviewDate,
      createdAt,
      orderItemId,
      customer:Customer!Review_customerId_fkey(
        id,
        user:User!Customer_userId_fkey(
          username
        )
      )
    `,
    { count: "exact" },
  );

  query = query.in("orderItemId", orderItemIds);

  if (rating) {
    query = query.eq("rating", parseInt(rating));
  }

  query = query.range(from, to).order("reviewDate", { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;

  // Tính average rating và distribution cho variant này
  const { data: allReviews } = await supabase
    .from("Review")
    .select("rating")
    .in("orderItemId", orderItemIds);

  const avgRating =
    allReviews && allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (allReviews) {
    allReviews.forEach((r) => {
      distribution[r.rating]++;
    });
  }

  return {
    reviews: data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit),
    },
    averageRating: Math.round(avgRating * 10) / 10,
    ratingDistribution: distribution,
    variantInfo: {
      id: variant.id,
      productId: variant.productId,
    },
  };
};

const createReview = async ({
  orderItemId,
  rating,
  comment,
  files,
  customerId,
}) => {
  const { data: orderItem, error: orderItemError } = await supabase
    .from("OrderItem")
    .select(
      `
      id,
      order:Order!OrderItem_orderId_fkey(
        customerId,
        status
      )
    `,
    )
    .eq("id", orderItemId)
    .single();

  if (orderItemError || !orderItem) {
    throw { status: 404, message: "Order item not found" };
  }

  // Kiểm tra order có thuộc về customer này không
  if (orderItem.order.customerId !== customerId) {
    throw {
      status: 403,
      message: "You can only review your own orders",
    };
  }

  // Kiểm tra order đã hoàn thành chưa
  if (orderItem.order.status !== "DELIVERED") {
    throw {
      status: 400,
      message: "You can only review delivered orders",
    };
  }

  // Kiểm tra đã review chưa
  const { data: existingReview } = await supabase
    .from("Review")
    .select("id")
    .eq("orderItemId", orderItemId)
    .eq("customerId", customerId)
    .single();

  if (existingReview) {
    throw { status: 400, message: "You have already reviewed this item" };
  }

  // Upload images nếu có
  let imageUrls = [];
  if (files && files.length > 0) {
    const reviewId = uuidv4();
    for (const file of files) {
      const url = await uploadImageToSupabase(file, "reviews", `${reviewId}/`);
      imageUrls.push(url);
    }
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("Review")
    .insert({
      id: uuidv4(),
      orderItemId,
      customerId,
      rating: parseInt(rating),
      comment: comment || null,
      images: imageUrls,
      reviewDate: now,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) {
    // Xóa images đã upload nếu insert failed
    for (const img of imageUrls) {
      await deleteImageFromSupabase(img, "reviews").catch(() => {});
    }
    throw error;
  }

  return data;
};

const updateReview = async (
  reviewId,
  customerId,
  { rating, comment, files, existingImages },
) => {
  const { data: existingReview, error: getError } = await supabase
    .from("Review")
    .select("id, customerId, images")
    .eq("id", reviewId)
    .single();

  if (getError || !existingReview) {
    throw { status: 404, message: "Review not found" };
  }

  if (existingReview.customerId !== customerId) {
    throw {
      status: 403,
      message: "You can only update your own reviews",
    };
  }

  const updateData = { updatedAt: new Date().toISOString() };
  if (rating !== undefined) updateData.rating = parseInt(rating);
  if (comment !== undefined) updateData.comment = comment;

  // Handle image updates
  const hasNewFiles = files && files.length > 0;
  const hasExistingImages = existingImages && existingImages.length > 0;
  
  // Only process images if there are changes (new files or explicit existing images list)
  if (hasNewFiles || hasExistingImages) {
    // Determine which old images to delete (images not in existingImages list)
    const oldImages = existingReview.images || [];
    const imagesToKeep = existingImages || [];
    const imagesToDelete = oldImages.filter(img => !imagesToKeep.includes(img));
    
    // Delete removed images from storage
    for (const img of imagesToDelete) {
      await deleteImageFromSupabase(img, "reviews").catch(() => {});
    }

    // Upload new images
    let newImageUrls = [];
    if (hasNewFiles) {
      for (const file of files) {
        const url = await uploadImageToSupabase(file, "reviews", `${reviewId}/`);
        newImageUrls.push(url);
      }
    }

    // Combine existing images to keep with newly uploaded images
    updateData.images = [...imagesToKeep, ...newImageUrls];
  }

  const { data, error } = await supabase
    .from("Review")
    .update(updateData)
    .eq("id", reviewId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const adminDeleteReview = async (reviewId) => {
  const { data: review, error: getError } = await supabase
    .from("Review")
    .select("id, images")
    .eq("id", reviewId)
    .single();

  if (getError || !review) {
    throw { status: 404, message: "Review not found" };
  }

  // Xóa images trước khi xóa review
  if (review.images && review.images.length > 0) {
    for (const img of review.images) {
      await deleteImageFromSupabase(img, "reviews").catch(() => {});
    }
  }

  const { error } = await supabase.from("Review").delete().eq("id", reviewId);
  if (error) throw error;

  return true;
};

module.exports = {
  getAllReviews,
  getReviewById,
  getReviewsByProduct,
  getReviewsByVariant,
  createReview,
  updateReview,
  adminDeleteReview,
};
