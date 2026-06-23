import { formatDateTime, formatPercent } from "../../lib/admin-api";
import { emptyStats, promotionStatusLabels, statusMeta } from "./constants";
import type {
  CouponRecord,
  CouponStats,
  PromotionOption,
  PromotionStatus,
} from "./types";

export function normalizeStatus(value: string | undefined | null): PromotionStatus {
  const status = (value || "INACTIVE").toUpperCase();
  if (status === "ACTIVE") return "ACTIVE";
  if (status === "UPCOMING") return "UPCOMING";
  if (status === "EXPIRED") return "EXPIRED";
  return "INACTIVE";
}

export function buildCouponStats(coupons: CouponRecord[]): CouponStats {
  const summary: CouponStats = { ...emptyStats, total: coupons.length };

  coupons.forEach((coupon) => {
    const status = normalizeStatus(coupon.Promotion?.status);
    if (status === "ACTIVE") summary.active += 1;
    else if (status === "UPCOMING") summary.upcoming += 1;
    else if (status === "EXPIRED") summary.expired += 1;
    else summary.inactive += 1;
  });

  return summary;
}

export function filterCoupons(
  coupons: CouponRecord[],
  searchInput: string,
  statusFilter: "ALL" | PromotionStatus,
) {
  const query = searchInput.trim().toLowerCase();

  return coupons.filter((coupon) => {
    const status = normalizeStatus(coupon.Promotion?.status);
    if (statusFilter !== "ALL" && status !== statusFilter) return false;
    if (!query) return true;

    const haystack = [coupon.code, coupon.Promotion?.name, coupon.Promotion?.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function paginateCoupons(coupons: CouponRecord[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return coupons.slice(start, start + pageSize);
}

export function getUsageProgress(coupon: CouponRecord) {
  if (coupon.maxUsage <= 0) return 0;
  return Math.min(100, Math.round((coupon.usageCount / coupon.maxUsage) * 100));
}

export function findPromotionById(promotions: PromotionOption[], promotionId: string) {
  return promotions.find((promotion) => promotion.id === promotionId) ?? null;
}

export {
  formatDateTime,
  formatPercent,
  promotionStatusLabels,
  statusMeta,
};
