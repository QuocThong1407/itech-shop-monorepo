import { formatDateTime, formatMoney } from "../../lib/admin-api";
import type { CategoryRecord, CategoryStatsResponse, RankedCategory } from "./types";

export function formatCategoryDate(value: string) {
  return formatDateTime(value);
}

export function formatCategoryMoney(value: number) {
  return formatMoney(value || 0);
}

export function createTopCategoryMap(stats: CategoryStatsResponse) {
  return new Map<string, RankedCategory>(
    stats.topCategories.map((item, index) => [
      item.id,
      {
        ...item,
        rank: index + 1,
      },
    ]),
  );
}

export function getTopCategorySummary(stats: CategoryStatsResponse) {
  const topCategory = stats.topCategories[0] ?? null;

  return {
    topCategory,
    topCategoryCount: topCategory?.productCount ?? 0,
  };
}

export function getCategoryDeleteDescription(category?: CategoryRecord | null) {
  if (!category) {
    return "If products are still attached to this category, the backend will reject the delete request.";
  }

  return `Delete "${category.name}"? If products are still attached to this category, the backend will reject the delete request.`;
}
