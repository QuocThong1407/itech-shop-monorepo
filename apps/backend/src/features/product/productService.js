// backend/src/features/product/productService.js
const { supabase } = require("../../configs/supabase");
const { v4: uuidv4 } = require("uuid");
const {
  uploadImageToSupabase,
  deleteImageFromSupabase,
} = require("../../utils/uploadHelper");

const validateParsedVariants = (parsedVariants) => {
  if (!Array.isArray(parsedVariants)) {
    throw { status: 400, message: "Variants must be an array" };
  }

  if (parsedVariants.length === 0) {
    throw {
      status: 400,
      message:
        "Variants array cannot be empty. Either provide variants or remove the variants field.",
    };
  }

  for (const variant of parsedVariants) {
    if (
      !variant.variantAttributes &&
      (!variant.attributes || typeof variant.attributes !== "object")
    ) {
      throw {
        status: 400,
        message: "Each variant must have variantAttributes object",
      };
    }

    const attributes = variant.variantAttributes || variant.attributes || {};
    if (typeof attributes !== "object" || Object.keys(attributes).length === 0) {
      throw { status: 400, message: "Variant attributes cannot be empty" };
    }

    if (variant.quantity !== undefined && variant.quantity < 0) {
      throw { status: 400, message: "Variant quantity must be positive" };
    }
  }

  const seen = new Set();
  for (const variant of parsedVariants) {
    const key = JSON.stringify(variant.variantAttributes || variant.attributes || {});
    if (seen.has(key)) {
      throw { status: 400, message: `Duplicate variant found: ${key}` };
    }
    seen.add(key);
  }
};

const parseVariantsInput = (variants) => {
  if (!variants) return [];

  let parsedVariants = variants;
  if (typeof variants === "string") {
    try {
      parsedVariants = JSON.parse(variants);
    } catch {
      throw { status: 400, message: "Invalid variants format" };
    }
  }

  validateParsedVariants(parsedVariants);
  return parsedVariants;
};

const resolveCreatorContext = async ({ actorUserId, actorRole, sellerUserId }) => {
  if (actorRole === "ADMIN") {
    const { data: admin } = await supabase
      .from("Admin")
      .select("id")
      .eq("userId", actorUserId)
      .single();

    if (!admin) {
      throw { status: 403, message: "Only admins can create products" };
    }

    if (!sellerUserId) {
      throw {
        status: 400,
        message: "Seller user ID is required when admin imports products",
      };
    }

    const { data: seller, error: sellerError } = await supabase
      .from("Seller")
      .select("id, userId, User!Seller_userId_fkey(username, email)")
      .eq("userId", sellerUserId)
      .single();

    if (sellerError || !seller) {
      throw {
        status: 400,
        message: "Seller not found. Please provide a valid seller user ID.",
      };
    }

    return {
      sellerId: seller.id,
      sellerUserId: seller.userId,
    };
  }

  if (actorRole === "SELLER") {
    const { data: seller, error: sellerError } = await supabase
      .from("Seller")
      .select("id, userId")
      .eq("userId", actorUserId)
      .single();

    if (sellerError || !seller) {
      throw { status: 403, message: "Only sellers can import their own products" };
    }

    if (sellerUserId && sellerUserId !== actorUserId) {
      throw {
        status: 403,
        message: "Sellers can only import products assigned to themselves",
      };
    }

    return {
      sellerId: seller.id,
      sellerUserId: seller.userId,
    };
  }

  throw { status: 403, message: "You do not have permission to import products" };
};

const createProductRecord = async ({
  name,
  description,
  price,
  stockQuantity,
  categoryId,
  variants,
  sellerId,
  files = [],
}) => {
  const now = new Date().toISOString();

  const { data: category } = await supabase
    .from("Category")
    .select("id")
    .eq("id", categoryId)
    .single();

  if (!category) {
    throw { status: 400, message: "Category not found" };
  }

  const productId = uuidv4();
  let productImages = [];

  const mainFiles = files ? files.filter((file) => file.fieldname === "images") : [];
  if (mainFiles.length > 0) {
    for (const file of mainFiles) {
      const url = await uploadImageToSupabase(file, "products", `${productId}/`);
      productImages.push(url);
    }
  }

  const safeParsedVariants = Array.isArray(variants) ? variants : [];
  const { variantTypes, variantOptions } = extractVariantMetadata(safeParsedVariants);
  const finalStockQuantity =
    safeParsedVariants.length > 0
      ? safeParsedVariants.reduce((sum, variant) => sum + (variant.quantity || 0), 0)
      : stockQuantity || 0;

  const { data: product, error } = await supabase
    .from("Product")
    .insert({
      id: productId,
      name,
      description,
      price,
      stockQuantity: finalStockQuantity,
      categoryId,
      images: productImages,
      variantTypes,
      variantOptions,
      createdBy: sellerId,
      is_deleted: false,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) {
    for (const image of productImages) {
      await deleteImageFromSupabase(image, "products").catch(() => {});
    }
    throw error;
  }

  if (safeParsedVariants.length > 0) {
    const variantRecords = safeParsedVariants.map((variant) => ({
      id: uuidv4(),
      productId,
      quantity: variant.quantity || 0,
      variantAttributes: variant.variantAttributes || variant.attributes || {},
      images: [],
      priceAdjustment: variant.priceAdjustment || 0,
      createdAt: now,
      updatedAt: now,
    }));

    const { error: variantError } = await supabase
      .from("ProductVariant")
      .insert(variantRecords);

    if (variantError) {
      await supabase.from("Product").delete().eq("id", productId);
      throw variantError;
    }
  }

  return product;
};

//trích xuất metadata từ danh sách variants
const extractVariantMetadata = (variants) => {
  if (!variants || variants.length === 0) {
    return { variantTypes: [], variantOptions: {} };
  }

  const variantTypes = new Set();
  const variantOptions = {};

  variants.forEach((variant) => {
    Object.entries(variant.variantAttributes || {}).forEach(([key, value]) => {
      variantTypes.add(key);

      if (!variantOptions[key]) {
        variantOptions[key] = new Set();
      }
      variantOptions[key].add(value);
    });
  });

  return {
    variantTypes: Array.from(variantTypes),
    variantOptions: Object.fromEntries(
      Object.entries(variantOptions).map(([key, values]) => [
        key,
        Array.from(values),
      ]),
    ),
  };
};

//Đồng bộ metadata variant cho product (variantTypes, variantOptions, stockQuantity)
const syncVariantMetadata = async (productId) => {
  const { data: variants } = await supabase
    .from("ProductVariant")
    .select("variantAttributes, quantity")
    .eq("productId", productId);

  const { variantTypes, variantOptions } = extractVariantMetadata(
    variants || [],
  );

  // tổng stock = tổng quantity của tất cả variants
  const totalStock = (variants || []).reduce(
    (sum, v) => sum + (v.quantity || 0),
    0,
  );

  await supabase
    .from("Product")
    .update({
      variantTypes,
      variantOptions,
      stockQuantity: totalStock,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", productId);
};

// Admin tạo product
const createProduct = async ({
  name,
  description,
  price,
  stockQuantity,
  categoryId,
  sellerUserId,
  files,
  variants,
  createdBy,
}) => {
  const { sellerId } = await resolveCreatorContext({
    actorUserId: createdBy,
    actorRole: "ADMIN",
    sellerUserId,
  });
  const parsedVariants = parseVariantsInput(variants);

  return createProductRecord({
    name,
    description,
    price,
    stockQuantity,
    categoryId,
    variants: parsedVariants,
    sellerId,
    files,
  });
};

const importProducts = async (products, actor, options = {}) => {
  const continueOnError = options.continueOnError !== false;
  const results = [];

  for (let index = 0; index < products.length; index += 1) {
    const item = products[index];

    try {
      if (!item || typeof item !== "object") {
        throw { status: 400, message: "Each product must be an object" };
      }

      const {
        name,
        description,
        price,
        stockQuantity,
        categoryId,
        sellerUserId,
        variants,
      } = item;

      if (!name || !description || price === undefined || !categoryId) {
        throw {
          status: 400,
          message: "Name, description, price, and categoryId are required",
        };
      }

      if (Number(price) < 0) {
        throw { status: 400, message: "Price must be a positive number" };
      }

      const parsedVariants = parseVariantsInput(variants);
      if (parsedVariants.length === 0) {
        if (stockQuantity === undefined || Number(stockQuantity) < 0) {
          throw {
            status: 400,
            message:
              "stockQuantity is required and must be positive for products without variants",
          };
        }
      }

      const creator = await resolveCreatorContext({
        actorUserId: actor.userId,
        actorRole: actor.role,
        sellerUserId,
      });

      const created = await createProductRecord({
        name,
        description,
        price: Number(price),
        stockQuantity:
          stockQuantity === undefined ? undefined : Number(stockQuantity),
        categoryId,
        variants: parsedVariants,
        sellerId: creator.sellerId,
        files: [],
      });

      results.push({
        index,
        success: true,
        productId: created.id,
        name: created.name,
      });
    } catch (error) {
      results.push({
        index,
        success: false,
        name: item?.name || null,
        error: error.message || "Failed to import product",
      });

      if (!continueOnError) {
        break;
      }
    }
  }

  const successCount = results.filter((item) => item.success).length;
  const failureCount = results.length - successCount;

  return {
    total: products.length,
    processed: results.length,
    successCount,
    failureCount,
    results,
  };
};

// Admin cập nhật product
const updateProduct = async (productId, updates, userId, files) => {
  const { data: admin } = await supabase
    .from("Admin")
    .select("id")
    .eq("userId", userId)
    .single();
  const { data: seller } = await supabase
    .from("Seller")
    .select("id")
    .eq("userId", userId)
    .single();
  if (!admin && !seller) {
    throw {
      status: 403,
      message: "Only admins or sellers can update products",
    };
  }

  const { data: existing } = await supabase
    .from("Product")
    .select("id, createdBy, images, variantTypes")
    .eq("id", productId)
    .eq("is_deleted", false)
    .single();

  if (!existing) {
    throw { status: 404, message: "Product not found" };
  }
  // Cập nhật ảnh
  if (files && files.length > 0) {
    if (existing.images && existing.images.length > 0) {
      for (const img of existing.images) {
        await deleteImageFromSupabase(img, "products").catch(() => {});
      }
    }

    const newImages = [];
    for (const file of files) {
      const url = await uploadImageToSupabase(
        file,
        "products",
        `${productId}/`,
      );
      newImages.push(url);
    }
    updates.images = newImages;
  }

  // kt category nếu có cập nhật
  if (updates.categoryId) {
    const { data: category } = await supabase
      .from("Category")
      .select("id")
      .eq("id", updates.categoryId)
      .single();

    if (!category) {
      throw { status: 400, message: "Category not found" };
    }
  }

  const updateData = { updatedAt: new Date().toISOString() };
  //  k sửa stock nếu product có variant
  if (
    updates.stockQuantity !== undefined &&
    existing.variantTypes &&
    existing.variantTypes.length > 0
  ) {
    throw {
      status: 400,
      message:
        "Cannot manually update stockQuantity for products with variants. Stock is auto-calculated from variant quantities.",
    };
  }
  // các field admin được phép update
  const allowedFields = [
    "name",
    "description",
    "price",
    "stockQuantity",
    "categoryId",
    "images",
  ];

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      updateData[field] = updates[field];
    }
  });

  const { data, error } = await supabase
    .from("Product")
    .update(updateData)
    .eq("id", productId)
    .select()
    .single();

  if (error) throw error;

  return data;
};

//seller chỉ cập nhật stock (ko có variant)
const updateProductStock = async (productId, stockQuantity, userId) => {
  const { data: seller } = await supabase
    .from("Seller")
    .select("id")
    .eq("userId", userId)
    .single();

  if (!seller) {
    throw { status: 403, message: "Only sellers can update stock" };
  }

  const { data: existing } = await supabase
    .from("Product")
    .select("id, createdBy, variantTypes")
    .eq("id", productId)
    .eq("is_deleted", false)
    .single();

  if (!existing) {
    throw { status: 404, message: "Product not found" };
  }

  // có variant → không update ở đây
  if (existing.variantTypes && existing.variantTypes.length > 0) {
    throw {
      status: 400,
      message:
        "This product has variants. Please update variant quantities instead.",
    };
  }

  // chỉ sửa product của mình
  if (existing.createdBy !== seller.id) {
    throw {
      status: 403,
      message: "You can only update stock for products assigned to you",
    };
  }

  const { data, error } = await supabase
    .from("Product")
    .update({
      stockQuantity,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", productId)
    .select()
    .single();

  if (error) throw error;

  return data;
};

// Helper function to calculate review stats for a product
const getProductReviewStats = async (productId) => {
  // Get all order items for this product's variants
  const { data: orderItems } = await supabase
    .from("OrderItem")
    .select(
      `
      id,
      quantity,
      ProductVariant!OrderItem_productVariantId_fkey(
        productId
      )
    `,
    )
    .eq("ProductVariant.productId", productId);

  if (!orderItems || orderItems.length === 0) {
    return { averageRating: 0, reviewCount: 0, soldCount: 0 };
  }

  const orderItemIds = orderItems.map((oi) => oi.id);

  // Calculate sold count from order items
  const soldCount = orderItems.reduce((sum, oi) => sum + (oi.quantity || 0), 0);

  // Get all reviews for these order items
  const { data: reviews } = await supabase
    .from("Review")
    .select("rating")
    .in("orderItemId", orderItemIds);

  if (!reviews || reviews.length === 0) {
    return { averageRating: 0, reviewCount: 0, soldCount };
  }

  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return {
    averageRating: Math.round(avgRating * 10) / 10,
    reviewCount: reviews.length,
    soldCount,
  };
};

// Lấy danh sách product với phân trang và lọc
const getAllProducts = async ({
  page = 1,
  limit = 10,
  categoryId,
  search,
  minPrice,
  maxPrice,
  sellerUserId, // frontend gửi userId
}) => {
  let sellerId;

  if (sellerUserId) {
    const { data: seller } = await supabase
      .from("Seller")
      .select("id")
      .eq("userId", sellerUserId)
      .single();

    if (!seller) {
      throw { status: 404, message: "Seller not found" };
    }

    sellerId = seller.id;
  }

  let query = supabase
    .from("Product")
    .select(
      `id, name, description, price, stockQuantity, images, variantTypes, variantOptions, createdAt, updatedAt,
      createdBy, categoryId, Category(id, name), Seller(id, User(id, username, email))`,
      { count: "exact" },
    )
    .eq("is_deleted", false);

  if (sellerId) {
    query = query.eq("createdBy", sellerId);
  }

  if (categoryId) {
    query = query.eq("categoryId", categoryId);
  }

  if (search && search.trim() !== "") {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (minPrice !== undefined) {
    query = query.gte("price", Number(minPrice));
  }

  if (maxPrice !== undefined) {
    query = query.lte("price", Number(maxPrice));
  }

  if (minPrice !== undefined) query = query.gte("price", Number(minPrice));
  if (maxPrice !== undefined) query = query.lte("price", Number(maxPrice));

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .range(from, to)
    .order("createdAt", { ascending: false });

  if (error) throw error;

  // Add review stats to each product
  const productsWithStats = await Promise.all(
    (data || []).map(async (product) => {
      const reviewStats = await getProductReviewStats(product.id);
      return {
        ...product,
        averageRating: reviewStats.averageRating,
        reviewCount: reviewStats.reviewCount,
        soldCount: reviewStats.soldCount,
      };
    }),
  );

  return {
    products: productsWithStats,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

// Lấy chi tiết product theo ID
const getProductById = async (productId) => {
  const { data: product, error } = await supabase
    .from("Product")
    .select(
      `id, name, description, price, stockQuantity, images, variantTypes, variantOptions, is_deleted, createdAt, updatedAt, createdBy, categoryId,
      Category!Product_categoryId_fkey(
        id,
        name,
        description
      ),
      Seller!Product_createdBy_fkey(
        id,
        email,
        image,
        User!Seller_userId_fkey(
          id,
          username,
          email
        )
      ),
      ProductVariant(
        id,
        quantity,
        variantAttributes,
        images,
        priceAdjustment,
        createdAt,
        updatedAt
      )
    `,
    )
    .eq("id", productId)
    .eq("is_deleted", false)
    .single();

  if (error) throw error;
  if (!product) throw { status: 404, message: "Product not found" };

  // Add review stats to the product
  const reviewStats = await getProductReviewStats(productId);

  return {
    ...product,
    averageRating: reviewStats.averageRating,
    reviewCount: reviewStats.reviewCount,
    soldCount: reviewStats.soldCount,
  };
};

// admin xóa product (soft delete)
const deleteProduct = async (productId, userId) => {
  const { data: admin } = await supabase
    .from("Admin")
    .select("id")
    .eq("userId", userId)
    .single();

  if (!admin) {
    throw { status: 403, message: "Only admins can delete products" };
  }

  const { data: product } = await supabase
    .from("Product")
    .select("id, createdBy")
    .eq("id", productId)
    .eq("is_deleted", false)
    .single();

  if (!product) {
    throw { status: 404, message: "Product not found" };
  }

  // Soft delete
  const { error } = await supabase
    .from("Product")
    .update({
      is_deleted: true,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) throw error;

  return true;
};

const bulkDeleteProducts = async (productIds, userId) => {
  const { data: admin } = await supabase
    .from("Admin")
    .select("id")
    .eq("userId", userId)
    .single();

  if (!admin) {
    throw { status: 403, message: "Only admins can delete products" };
  }

  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw { status: 400, message: "productIds must be a non-empty array" };
  }

  const normalizedIds = [...new Set(productIds.filter((id) => typeof id === "string" && id.trim()))];

  if (normalizedIds.length === 0) {
    throw { status: 400, message: "No valid product IDs were provided" };
  }

  const { data: existingProducts, error: fetchError } = await supabase
    .from("Product")
    .select("id")
    .in("id", normalizedIds)
    .eq("is_deleted", false);

  if (fetchError) throw fetchError;

  const existingIds = new Set((existingProducts || []).map((product) => product.id));
  const deletableIds = normalizedIds.filter((id) => existingIds.has(id));
  const now = new Date().toISOString();

  if (deletableIds.length > 0) {
    const { error: updateError } = await supabase
      .from("Product")
      .update({
        is_deleted: true,
        updatedAt: now,
      })
      .in("id", deletableIds);

    if (updateError) throw updateError;
  }

  const results = normalizedIds.map((id) => {
    if (existingIds.has(id)) {
      return {
        id,
        success: true,
      };
    }

    return {
      id,
      success: false,
      error: "Product not found or already deleted",
    };
  });

  const deletedCount = results.filter((item) => item.success).length;
  const failureCount = results.length - deletedCount;

  return {
    total: normalizedIds.length,
    deletedCount,
    failureCount,
    results,
  };
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  importProducts,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  updateProductStock,
  syncVariantMetadata,
};
