import { apiJson } from "../../lib/admin-api";
import type {
  CategoryListResponse,
  CategoryStatsResponse,
  ProductsResponse,
} from "./types";

export function fetchCategories(params: { page: number; limit: number; query: string }) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));

  if (params.query.trim()) {
    searchParams.set("search", params.query.trim());
  }

  return apiJson<CategoryListResponse>(`/categories?${searchParams.toString()}`);
}

export function fetchCategoryStats() {
  return apiJson<CategoryStatsResponse>("/categories/stats");
}

export function fetchCategoryProducts(categoryId: string) {
  return apiJson<ProductsResponse>(
    `/products?categoryId=${encodeURIComponent(categoryId)}&page=1&limit=20`,
  );
}

export function createCategory(payload: FormData) {
  return apiJson("/categories", {
    method: "POST",
    body: payload,
  });
}

export function updateCategory(categoryId: string, payload: FormData) {
  return apiJson(`/categories/${categoryId}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteCategory(categoryId: string) {
  return apiJson(`/categories/${categoryId}`, {
    method: "DELETE",
  });
}
