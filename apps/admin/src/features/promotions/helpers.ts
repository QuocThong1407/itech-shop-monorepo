import { formatDateTime, fromDateTimeLocal, toDateTimeLocal } from "../../lib/admin-api";
import { emptyStats, scopeMeta, statusMeta } from "./constants";
import type {
  CatalogItem,
  DraftState,
  PromotionDetail,
  PromotionRecord,
  PromotionScopeInfo,
  PromotionStats,
  PromotionStatus,
  ScopeType,
} from "./types";

export function normalizeStatus(value: string | undefined | null): PromotionStatus {
  const status = (value || "INACTIVE").toUpperCase();
  if (status === "ACTIVE") return "ACTIVE";
  if (status === "UPCOMING") return "UPCOMING";
  if (status === "EXPIRED") return "EXPIRED";
  return "INACTIVE";
}

export function getPromotionScope(
  detail: PromotionDetail,
  catalogCategoryCount: number,
): PromotionScopeInfo {
  const productCount = detail.appliedProducts?.length ?? 0;
  const categoryCount = detail.appliedCategories?.length ?? 0;

  if (productCount > 0) {
    return {
      type: "PRODUCT",
      label: `${scopeMeta.PRODUCT.label} (${productCount})`,
      products: detail.appliedProducts ?? [],
      categories: [],
    };
  }

  if (categoryCount > 0) {
    const isEntireStore = catalogCategoryCount > 0 && categoryCount >= catalogCategoryCount;
    return {
      type: "CATEGORY",
      label: isEntireStore ? scopeMeta.ALL.label : `${scopeMeta.CATEGORY.label} (${categoryCount})`,
      products: [],
      categories: detail.appliedCategories ?? [],
    };
  }

  return {
    type: "ALL",
    label: scopeMeta.ALL.label,
    products: [],
    categories: [],
  };
}

export function getLinkedCoupon(detail: PromotionDetail) {
  const coupon = detail.Coupon;
  if (!coupon) return null;
  return Array.isArray(coupon) ? (coupon[0] ?? null) : coupon;
}

export function getCreatedByLabel(detail: PromotionDetail) {
  const admin = detail.Admin;
  if (!admin) return detail.createdBy || "Administrator";

  const resolvedAdmin = Array.isArray(admin) ? (admin[0] ?? null) : admin;
  const username = resolvedAdmin?.User?.username?.trim();
  if (username) return username;

  const email = resolvedAdmin?.User?.email?.trim();
  if (email) return email;

  return detail.createdBy || resolvedAdmin?.id || "Administrator";
}

export function filterPromotions(
  promotions: PromotionRecord[],
  searchInput: string,
  statusFilter: "ALL" | PromotionStatus,
) {
  const query = searchInput.trim().toLowerCase();

  return promotions.filter((promotion) => {
    const status = normalizeStatus(promotion.status);
    if (statusFilter !== "ALL" && status !== statusFilter) return false;
    if (!query) return true;

    const haystack = [promotion.name, promotion.description, promotion.status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function paginatePromotions(promotions: PromotionRecord[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return promotions.slice(start, start + pageSize);
}

export function filterResourceItems(
  draft: DraftState,
  resourceSearch: string,
  categories: CatalogItem[],
  products: CatalogItem[],
) {
  const query = resourceSearch.trim().toLowerCase();

  if (draft.scopeType === "PRODUCT") {
    return products.filter((item) => {
      if (!query) return true;
      return `${item.name} ${item.description ?? ""}`.toLowerCase().includes(query);
    });
  }

  if (draft.scopeType === "CATEGORY") {
    return categories.filter((item) => {
      if (!query) return true;
      return `${item.name} ${item.description ?? ""}`.toLowerCase().includes(query);
    });
  }

  return [];
}

export function buildPromotionStats(stats: PromotionStats | null | undefined) {
  return stats ?? emptyStats;
}

export {
  formatDateTime,
  fromDateTimeLocal,
  scopeMeta,
  statusMeta,
  toDateTimeLocal,
};
