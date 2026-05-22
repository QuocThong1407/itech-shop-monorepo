// backend/src/features/category/categoryService.js
const { supabase, supabaseAdmin } = require("../../configs/supabase");
const { v4: uuidv4 } = require("uuid");

const {
  uploadImageToSupabase,
  deleteImageFromSupabase,
} = require("../../utils/uploadHelper");

const getAllCategories = async ({ page = 1, limit = 10, search }) => {
  page = parseInt(page);
  limit = parseInt(limit);

  let query = supabase
    .from("Category")
    .select("id, name, description, image, createdAt, updatedAt", {
      count: "exact",
    });

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .range(from, to)
    .order("createdAt", { ascending: false });

  if (error) throw error;

  return {
    categories: data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

const getCategoryById = async (categoryId) => {
  const { data, error } = await supabase
    .from("Category")
    .select("id, name, description, image, createdAt, updatedAt")
    .eq("id", categoryId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw { status: 404, message: "Category not found" };

  return data;
};

const createCategory = async ({ name, description, file }) => {
  const { data: existing } = await supabase
    .from("Category")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (existing) {
    throw { status: 400, message: "Category with this name already exists" };
  }

  const now = new Date().toISOString();
  const categoryId = uuidv4();

  let imageUrl = null;
  if (file) {
    imageUrl = await uploadImageToSupabase(
      file,
      "categories",
      `${categoryId}/`
    );
  }

  const { data: category, error } = await supabase
    .from("Category")
    .insert({
      id: categoryId,
      name,
      description,
      image: imageUrl,
      createdAt: now,
      updatedAt: now,
    })
    .select("id, name, description, image, createdAt, updatedAt")
    .single();

  if (error) throw error;

  return category;
};

const updateCategory = async (categoryId, updates, file) => {
  const { data: existingCategory, error } = await supabase
    .from("Category")
    .select("id,image")
    .eq("id", categoryId)
    .maybeSingle();

  if (error) throw error;
  if (!existingCategory) throw { status: 404, message: "Category not found" };

  if (updates.name) {
    const { data: duplicate } = await supabase
      .from("Category")
      .select("id")
      .eq("name", updates.name)
      .neq("id", categoryId)
      .maybeSingle();

    if (duplicate) {
      throw {
        status: 400,
        message: "Another category with this name already exists",
      };
    }
  }
  //xử lý upload ảnh mới
  if (file) {
    if (existingCategory.image) {
      await deleteImageFromSupabase(existingCategory.image, "categories");
    }
    updates.image = await uploadImageToSupabase(
      file,
      "categories",
      `${categoryId}/`
    );
  }

  const { data: category, error: updateError } = await supabase
    .from("Category")
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", categoryId)
    .select("id, name, description, image, createdAt, updatedAt")
    .single();

  if (updateError) throw updateError;

  return category;
};

const deleteCategory = async (categoryId) => {
  const { data: category, error } = await supabase
    .from("Category")
    .select("id, image")
    .eq("id", categoryId)
    .maybeSingle();

  if (error) throw error;
  if (!category) throw { status: 404, message: "Category not found" };

  //còn product ko xóa
  const { data: products } = await supabase
    .from("Product")
    .select("id")
    .eq("categoryId", categoryId)
    .limit(1);

  if (products?.length) {
    throw {
      status: 400,
      message: "Cannot delete category that has products associated with it",
    };
  }
  // đang dùng trong promotion thì ko xóa
  const { data: promotions } = await supabase
    .from("_PromotionCategories")
    .select("A")
    .eq("A", categoryId)
    .limit(1);

  if (promotions?.length) {
    throw {
      status: 400,
      message: "Cannot delete category that is associated with promotions",
    };
  }
  //xóa ảnh
  if (category.image) {
    await deleteImageFromSupabase(category.image, "categories");
  }

  const { error: deleteError } = await supabase
    .from("Category")
    .delete()
    .eq("id", categoryId);

  if (deleteError) throw deleteError;

  return true;
};

const getCategoryStats = async () => {
  const { count, error: countError } = await supabase
    .from("Category")
    .select("id", { count: "exact", head: true });

  if (countError) throw countError;

  const { data: categories, error } = await supabase
    .from("Category")
    .select("id, name");

  if (error) throw error;

  const stats = await Promise.all(
    categories.map(async (c) => {
      const { count } = await supabase
        .from("Product")
        .select("id", { count: "exact", head: true })
        .eq("categoryId", c.id)
        .eq("is_deleted", false);

      return {
        id: c.id,
        name: c.name,
        productCount: count || 0,
      };
    })
  );

  stats.sort((a, b) => b.productCount - a.productCount);

  return {
    total: count || 0,
    topCategories: stats.slice(0, 5),
    allCategories: stats,
  };
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
};
