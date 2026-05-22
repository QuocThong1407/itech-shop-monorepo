// backend/src/features/category/categoryController.js
const categoryService = require("./categoryService");
const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHelpers");

const getAllCategories = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await categoryService.getAllCategories({
      page,
      limit,
      search,
    });
    successResponse(res, 200, result);
  } catch (error) {
    console.error("Get all categories error:", error);
    errorResponse(res, 500, error.message || "Failed to get categories");
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);
    successResponse(res, 200, category);
  } catch (error) {
    console.error("Get category error:", error);
    errorResponse(res, 404, error.message || "Category not found");
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return errorResponse(res, 400, "Category name is required");
    }

    const result = await categoryService.createCategory({
      name: name.trim(),
      description: description?.trim() || null,
      file: req.file || null,
    });

    successResponse(res, 201, result, "Category created successfully");
  } catch (error) {
    console.error("Create category error:", error);
    errorResponse(res, 400, error.message || "Failed to create category");
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (description !== undefined)
      updates.description = description?.trim() || null;

    const result = await categoryService.updateCategory(
      id,
      updates,
      req.file || null
    );
    successResponse(res, 200, result, "Category updated successfully");
  } catch (error) {
    console.error("Update category error:", error);
    errorResponse(res, 400, error.message || "Failed to update category");
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(id);
    successResponse(res, 200, null, "Category deleted successfully");
  } catch (error) {
    console.error("Delete category error:", error);
    errorResponse(res, 400, error.message || "Failed to delete category");
  }
};

const getCategoryStats = async (req, res) => {
  try {
    const stats = await categoryService.getCategoryStats();
    successResponse(res, 200, stats);
  } catch (error) {
    console.error("Get category stats error:", error);
    errorResponse(res, 500, "Failed to get category statistics");
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
};
