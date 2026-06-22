// backend/src/features/product/productController.js
const productService = require("./productService");
const ExcelJS = require("exceljs");
const { Readable } = require("stream");
const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHelpers");

const normalizeCellValue = (value) => {
  if (value == null) return "";
  if (typeof value === "object") {
    if (value.text) return String(value.text).trim();
    if (value.result != null) return String(value.result).trim();
  }
  return String(value).trim();
};

const worksheetToObjects = (worksheet) => {
  const rows = worksheet.getSheetValues().slice(1);
  const headerRow = rows.find(
    (row) =>
      Array.isArray(row) &&
      row.some((cell) => normalizeCellValue(cell).length > 0),
  );

  if (!headerRow || !Array.isArray(headerRow)) {
    return [];
  }

  const headers = headerRow
    .slice(1)
    .map((cell) => normalizeCellValue(cell).replace(/\s+/g, ""));

  const dataRows = rows.slice(rows.indexOf(headerRow) + 1);

  return dataRows
    .filter(
      (row) =>
        Array.isArray(row) &&
        row.some((cell) => normalizeCellValue(cell).length > 0),
    )
    .map((row) => {
      const values = row.slice(1);
      return headers.reduce((result, header, index) => {
        if (!header) return result;
        result[header] = normalizeCellValue(values[index]);
        return result;
      }, {});
    });
};

const parseImportFile = async (file) => {
  const workbook = new ExcelJS.Workbook();
  const fileName = (file.originalname || "").toLowerCase();

  if (fileName.endsWith(".csv")) {
    const stream = Readable.from(file.buffer.toString("utf8"));
    const worksheet = await workbook.csv.read(stream);
    return worksheetToObjects(worksheet);
  }

  await workbook.xlsx.load(file.buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];
  return worksheetToObjects(worksheet);
};

const castImportedProduct = (item) => {
  const product = {
    name: item.name,
    description: item.description,
    price: item.price === "" ? undefined : Number(item.price),
    stockQuantity:
      item.stockQuantity === "" ? undefined : Number(item.stockQuantity),
    categoryId: item.categoryId,
    sellerUserId: item.sellerUserId || undefined,
  };

  if (item.variants) {
    product.variants = item.variants;
  }

  return product;
};

const getAllProducts = async (req, res) => {
  try {
    const {
      page,
      limit,
      categoryId,
      search,
      minPrice,
      maxPrice,
      sellerUserId,
    } = req.query;
    const result = await productService.getAllProducts({
      page,
      limit,
      categoryId,
      search,
      minPrice,
      maxPrice,
      sellerUserId,
    });
    successResponse(res, 200, result);
  } catch (error) {
    console.error("Get all products error:", error);
    errorResponse(res, 500, error.message || "Failed to get products");
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    successResponse(res, 200, product);
  } catch (error) {
    console.error("Get product error:", error);
    errorResponse(res, 404, error.message || "Product not found");
  }
};

const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stockQuantity,
      categoryId,
      variants,
      sellerUserId,
    } = req.body;

    if (
      !name ||
      !description ||
      price === undefined ||
      !categoryId ||
      !sellerUserId
    ) {
      return errorResponse(
        res,
        400,
        "Name, description, price, category ID, and seller user ID are required",
      );
    }

    if (!sellerUserId) {
      return errorResponse(
        res,
        400,
        "Seller ID is required. Please assign a seller to this product.",
      );
    }

    if (price < 0) {
      return errorResponse(res, 400, "Price must be a positive number");
    }

    if (variants) {
      let parsedVariants;
      try {
        parsedVariants =
          typeof variants === "string" ? JSON.parse(variants) : variants;
      } catch (e) {
        return errorResponse(res, 400, "Invalid variants format");
      }

      if (!Array.isArray(parsedVariants)) {
        return errorResponse(res, 400, "Variants must be an array");
      }

      if (parsedVariants.length === 0) {
        return errorResponse(
          res,
          400,
          "Variants array cannot be empty. Either provide variants or remove the variants field.",
        );
      }

      for (const v of parsedVariants) {
        if (!v.variantAttributes || typeof v.variantAttributes !== "object") {
          return errorResponse(
            res,
            400,
            "Each variant must have variantAttributes object",
          );
        }

        if (Object.keys(v.variantAttributes).length === 0) {
          return errorResponse(res, 400, "Variant attributes cannot be empty");
        }

        if (v.quantity !== undefined && v.quantity < 0) {
          return errorResponse(res, 400, "Variant quantity must be positive");
        }
      }

      const seen = new Set();
      for (const v of parsedVariants) {
        const key = JSON.stringify(v.variantAttributes);
        if (seen.has(key)) {
          return errorResponse(res, 400, `Duplicate variant found: ${key}`);
        }
        seen.add(key);
      }
    } else {
      if (stockQuantity === undefined || stockQuantity < 0) {
        return errorResponse(
          res,
          400,
          "Stock quantity is required for products without variants",
        );
      }
    }

    const result = await productService.createProduct({
      ...req.body,
      createdBy: req.user.userId,
      files: req.files,
    });

    successResponse(res, 201, result, "Product created successfully");
  } catch (error) {
    console.error("Create product error:", error);
    errorResponse(res, 400, error.message || "Failed to create product");
  }
};

const importProducts = async (req, res) => {
  try {
    let products;

    if (req.file) {
      const parsedRows = await parseImportFile(req.file);
      products = parsedRows.map(castImportedProduct);
    } else {
      products = req.body?.products ?? req.body;

      if (typeof products === "string") {
        try {
          products = JSON.parse(products);
        } catch {
          return errorResponse(res, 400, "Invalid products payload");
        }
      }
    }

    if (!Array.isArray(products) || products.length === 0) {
      return errorResponse(res, 400, "No product rows found to import");
    }

    const continueOnError =
      String(req.body?.continueOnError ?? "true").toLowerCase() !== "false";

    const result = await productService.importProducts(products, req.user, {
      continueOnError,
    });

    successResponse(res, 201, result, "Products imported");
  } catch (error) {
    console.error("Import products error:", error);
    errorResponse(res, 400, error.message || "Failed to import products");
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.userId;

    if (updates.variantTypes || updates.variantOptions) {
      return errorResponse(
        res,
        400,
        "variantTypes and variantOptions are auto-managed. Use variant endpoints to modify variants.",
      );
    }

    if (updates.price !== undefined && updates.price < 0) {
      return errorResponse(res, 400, "Price must be a positive number");
    }

    if (updates.stockQuantity !== undefined && updates.stockQuantity < 0) {
      return errorResponse(
        res,
        400,
        "Stock quantity must be a positive number",
      );
    }

    if (updates.sellerId !== undefined) {
      return errorResponse(
        res,
        400,
        "Cannot change seller assignment. Seller is set during product creation.",
      );
    }

    const result = await productService.updateProduct(
      id,
      updates,
      userId,
      req.files,
    );
    successResponse(res, 200, result, "Product updated successfully");
  } catch (error) {
    console.error("Update product error:", error);
    errorResponse(res, 400, error.message || "Failed to update product");
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await productService.deleteProduct(id, userId);
    successResponse(res, 200, null, "Product deleted successfully");
  } catch (error) {
    console.error("Delete product error:", error);
    errorResponse(res, 400, error.message || "Failed to delete product");
  }
};

const bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return errorResponse(res, 400, "productIds must be a non-empty array");
    }

    const result = await productService.bulkDeleteProducts(productIds, userId);
    successResponse(res, 200, result, "Products deleted successfully");
  } catch (error) {
    console.error("Bulk delete products error:", error);
    errorResponse(res, 400, error.message || "Failed to delete products");
  }
};

const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stockQuantity } = req.body;
    const userId = req.user.userId;

    if (stockQuantity === undefined) {
      return errorResponse(res, 400, "Stock quantity is required");
    }

    if (stockQuantity < 0) {
      return errorResponse(
        res,
        400,
        "Stock quantity must be a positive number",
      );
    }

    const result = await productService.updateProductStock(
      id,
      stockQuantity,
      userId,
    );
    successResponse(res, 200, result, "Stock updated successfully");
  } catch (error) {
    console.error("Update stock error:", error);
    errorResponse(res, 400, error.message || "Failed to update stock");
  }
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
};
