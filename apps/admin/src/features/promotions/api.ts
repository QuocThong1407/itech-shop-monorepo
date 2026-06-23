import { apiJson } from "../../lib/admin-api";
import type {
  CatalogItem,
  PromotionDetail,
  PromotionListResponse,
  PromotionStats,
} from "./types";

export function fetchCategories() {
  return apiJson<{ categories: CatalogItem[] }>("/categories?page=1&limit=1000", undefined, "/promotions");
}

export function fetchProducts() {
  return apiJson<{ products: CatalogItem[] }>("/products?page=1&limit=1000", undefined, "/promotions");
}

export function fetchPromotions(searchQuery: string) {
  return apiJson<PromotionListResponse>(
    `/promotions?page=1&limit=1000&search=${encodeURIComponent(searchQuery)}`,
    undefined,
    "/promotions",
  );
}

export function fetchPromotionStats() {
  return apiJson<PromotionStats>("/promotions/stats", undefined, "/promotions");
}

export function fetchPromotionDetail(promotionId: string) {
  return apiJson<PromotionDetail>(`/promotions/${promotionId}`, undefined, "/promotions");
}

export function createPromotion(payload: FormData) {
  return apiJson<PromotionDetail>(
    "/promotions",
    {
      method: "POST",
      body: payload,
    },
    "/promotions",
  );
}

export function updatePromotion(promotionId: string, payload: FormData) {
  return apiJson<PromotionDetail>(
    `/promotions/${promotionId}`,
    {
      method: "PUT",
      body: payload,
    },
    "/promotions",
  );
}

export function applyPromotionToProducts(promotionId: string, productIds: string[]) {
  return apiJson(
    `/promotions/${promotionId}/apply`,
    {
      method: "POST",
      body: JSON.stringify({ productIds }),
    },
    "/promotions",
  );
}

export function applyPromotionToCategories(promotionId: string, categoryIds: string[]) {
  return apiJson(
    `/promotions/${promotionId}/apply-categories`,
    {
      method: "POST",
      body: JSON.stringify({ categoryIds }),
    },
    "/promotions",
  );
}

export function togglePromotionStatus(promotionId: string, status: string) {
  return apiJson(
    `/promotions/${promotionId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    "/promotions",
  );
}

export function deletePromotion(promotionId: string) {
  return apiJson(
    `/promotions/${promotionId}`,
    {
      method: "DELETE",
    },
    "/promotions",
  );
}
