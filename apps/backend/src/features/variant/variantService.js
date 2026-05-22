// backend/src/features/variant/variantService.js
const { supabase } = require("../../configs/supabase");
const { v4: uuidv4 } = require("uuid");
const { syncVariantMetadata } = require("../product/productService");
const {
  uploadImageToSupabase,
  deleteImageFromSupabase,
} = require("../../utils/uploadHelper");

async function resolveActor(userId) {
  const [{ data: seller }, { data: admin }] = await Promise.all([
    supabase.from("Seller").select("id").eq("userId", userId).single(),
    supabase.from("Admin").select("id").eq("userId", userId).single(),
  ]);

  if (admin) return { role: "ADMIN" };
  if (seller) return { role: "SELLER", sellerId: seller.id };

  throw {
    status: 403,
    message: "You do not have permission to do this action",
  };
}

//seller tạo mới variant cho sản phẩm của họ
const createVariant = async ({
  productId,
  quantity,
  variantAttributes,
  files,
  priceAdjustment,
  userId,
}) => {
  const now = new Date().toISOString();
  const actor = await resolveActor(userId);

  // Lấy thông tin sản phẩm
  const { data: product } = await supabase
    .from("Product")
    .select("id, createdBy, is_deleted, name")
    .eq("id", productId)
    .eq("is_deleted", false)
    .single();

  if (!product) {
    throw { status: 404, message: "Product not found" };
  }
  // seller phải là owner
  if (actor.role === "SELLER" && product.createdBy !== actor.sellerId) {
    throw {
      status: 403,
      message: "You do not have permission to perform this action",
    };
  }
  // Kiểm tra trùng lặp variant attributes
  const { data: existingVariants } = await supabase
    .from("ProductVariant")
    .select("variantAttributes")
    .eq("productId", productId);

  if (existingVariants && existingVariants.length > 0) {
    const isDuplicate = existingVariants.some(
      (v) =>
        JSON.stringify(v.variantAttributes) ===
        JSON.stringify(variantAttributes),
    );
    if (isDuplicate) {
      throw {
        status: 400,
        message:
          "A variant with these attributes already exists for this product",
      };
    }
  }
  // Upload images
  let imageUrls = [];
  if (files && files.length > 0) {
    for (const file of files) {
      const url = await uploadImageToSupabase(
        file,
        "products",
        `variant-images/${productId}/${uuidv4()}/`,
      );
      imageUrls.push(url);
    }
  }
  // Tạo variant mới
  const { data, error } = await supabase
    .from("ProductVariant")
    .insert({
      id: uuidv4(),
      productId,
      quantity: quantity || 0,
      variantAttributes: variantAttributes || {},
      images: imageUrls || [],
      priceAdjustment: priceAdjustment || 0,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) throw error;
  // Đồng bộ metadata variant lên sản phẩm
  await syncVariantMetadata(productId);

  return data;
};

const updateVariant = async (variantId, updates, userId) => {
  // Lấy variant với thông tin sản phẩm
  const { data: variant } = await supabase
    .from("ProductVariant")
    .select(
      `
      id,
      productId,
      images,
      variantAttributes,
      Product!ProductVariant_productId_fkey(
        id,
        createdBy,
        is_deleted
      )
    `,
    )
    .eq("id", variantId)
    .single();
  const actor = await resolveActor(userId);

  if (!variant) {
    throw { status: 404, message: "Product variant not found" };
  }

  if (variant.Product.is_deleted) {
    throw { status: 400, message: "Cannot update variant of deleted product" };
  }
  // seller phải là owner
  if (actor.role === "SELLER" && variant.Product.createdBy !== actor.sellerId) {
    throw {
      status: 403,
      message: "You do not have permission to do this action",
    };
  }
  // Kiểm tra trùng lặp variant attributes nếu có cập nhật
  if (updates.variantAttributes) {
    const { data: existingVariants } = await supabase
      .from("ProductVariant")
      .select("id, variantAttributes")
      .eq("productId", variant.productId)
      .neq("id", variantId); // Exclude current variant

    if (existingVariants && existingVariants.length > 0) {
      const isDuplicate = existingVariants.some(
        (v) =>
          JSON.stringify(v.variantAttributes) ===
          JSON.stringify(updates.variantAttributes),
      );
      if (isDuplicate) {
        throw {
          status: 400,
          message:
            "A variant with these attributes already exists for this product",
        };
      }
    }
  }

  const updateData = { updatedAt: new Date().toISOString() };

  if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
  if (updates.priceAdjustment !== undefined) {
    updateData.priceAdjustment = updates.priceAdjustment;
  }
  if (updates.variantAttributes !== undefined) {
    updateData.variantAttributes = updates.variantAttributes;
  }
  // Xử lý hình ảnh
  if (updates.files && updates.files.length > 0) {
    // xóa ảnh cũ
    if (variant.images && variant.images.length > 0) {
      for (const img of variant.images) {
        await deleteImageFromSupabase(img, "products").catch(() => {});
      }
    }
    // upload ảnh mới
    let newImageUrls = [];
    for (const file of updates.files) {
      const url = await uploadImageToSupabase(
        file,
        "products",
        `variant-images/${variant.productId}/${uuidv4()}/`,
      );
      newImageUrls.push(url);
    }
    updateData.images = newImageUrls;
  } else if (updates.images !== undefined) {
    updateData.images = updates.images;
  }

  const { data, error } = await supabase
    .from("ProductVariant")
    .update(updateData)
    .eq("id", variantId)
    .select()
    .single();

  if (error) throw error;
  // Đồng bộ metadata variant lên sản phẩm
  await syncVariantMetadata(variant.productId);

  return data;
};

const deleteVariant = async (variantId, userId) => {
  const { data: variant } = await supabase
    .from("ProductVariant")
    .select(
      `
      id,
      productId,
      images,
      Product!ProductVariant_productId_fkey(
        id,
        createdBy,
        is_deleted
      )
    `,
    )
    .eq("id", variantId)
    .single();

  if (!variant) {
    throw { status: 404, message: "Product variant not found" };
  }
  const actor = await resolveActor(userId);

  if (variant.Product.is_deleted) {
    throw { status: 400, message: "Cannot delete variant of deleted product" };
  }
  // Kiểm tra sản phẩm đã xóa chưa
  if (actor.role === "SELLER" && variant.Product.createdBy !== actor.sellerId) {
    throw {
      status: 403,
      message: "You do not have permission to do this action",
    };
  }

  //xóa ảnh
  if (variant.images && variant.images.length > 0) {
    for (const img of variant.images) {
      await deleteImageFromSupabase(img, "products").catch(() => {});
    }
  }

  // xóa variant
  const { error } = await supabase
    .from("ProductVariant")
    .delete()
    .eq("id", variantId);

  if (error) throw error;

  await syncVariantMetadata(variant.productId);

  return true;
};

const getVariantsByProductId = async (productId) => {
  const { data, error } = await supabase
    .from("ProductVariant")
    .select("*")
    .eq("productId", productId)
    .order("createdAt", { ascending: true });

  if (error) throw error;
  return data || [];
};

module.exports = {
  createVariant,
  updateVariant,
  deleteVariant,
  getVariantsByProductId,
};
