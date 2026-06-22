import { apiJson } from "../../lib/admin-api";
import type {
  CategoriesResponse,
  ProductBulkDeleteResult,
  ProductDetail,
  ProductImportResult,
  ProductsResponse,
  SellersResponse,
} from "./types";

export async function fetchProductResources() {
  const [categories, sellers] = await Promise.all([
    apiJson<CategoriesResponse>(
      "/categories?page=1&limit=1000",
      undefined,
      "/products",
    ),
    apiJson<SellersResponse>(
      "/users?role=SELLER&page=1&limit=1000",
      undefined,
      "/products",
    ),
  ]);

  return {
    categories: categories.categories ?? [],
    sellers: sellers.users ?? [],
  };
}

export function fetchProducts(searchQuery: string) {
  return apiJson<ProductsResponse>(
    `/products?page=1&limit=1000&search=${encodeURIComponent(searchQuery)}`,
    undefined,
    "/products",
  );
}

export function fetchProductDetail(productId: string) {
  return apiJson<ProductDetail>(`/products/${productId}`, undefined, "/products");
}

export function createProduct(formData: FormData) {
  return apiJson("/products", { method: "POST", body: formData }, "/products");
}

export function updateProduct(productId: string, formData: FormData) {
  return apiJson(
    `/products/${productId}`,
    {
      method: "PUT",
      body: formData,
    },
    "/products",
  );
}

export function deleteProduct(productId: string) {
  return apiJson(
    `/products/${productId}`,
    {
      method: "DELETE",
    },
    "/products",
  );
}

export function bulkDeleteProducts(productIds: string[]) {
  return apiJson<ProductBulkDeleteResult>(
    "/products/bulk-delete",
    {
      method: "POST",
      body: JSON.stringify({ productIds }),
    },
    "/products",
  );
}

export function importProducts(formData: FormData) {
  return apiJson<ProductImportResult>(
    "/products/import",
    {
      method: "POST",
      body: formData,
    },
    "/products",
  );
}

export function createVariant(formData: FormData) {
  return apiJson("/variants", { method: "POST", body: formData }, "/admin");
}

export function updateVariant(variantId: string, formData: FormData) {
  return apiJson(
    `/variants/${variantId}`,
    { method: "PUT", body: formData },
    "/admin",
  );
}

export function deleteVariant(variantId: string) {
  return apiJson(`/variants/${variantId}`, { method: "DELETE" }, "/admin");
}
