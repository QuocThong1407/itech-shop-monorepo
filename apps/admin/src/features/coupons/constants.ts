import type { CouponDraft, CouponStats, PromotionStatus } from "./types";

export const PAGE_SIZE = 8;

export const emptyStats: CouponStats = {
  total: 0,
  active: 0,
  upcoming: 0,
  expired: 0,
  inactive: 0,
};

export const statusMeta: Record<
  PromotionStatus,
  { label: string; tone: string; chip: string }
> = {
  ACTIVE: {
    label: "Active",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    chip: "bg-emerald-500",
  },
  UPCOMING: {
    label: "Upcoming",
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
    chip: "bg-amber-500",
  },
  EXPIRED: {
    label: "Expired",
    tone: "bg-rose-50 text-rose-700 ring-rose-200",
    chip: "bg-rose-500",
  },
  INACTIVE: {
    label: "Inactive",
    tone: "bg-slate-100 text-slate-700 ring-slate-200",
    chip: "bg-slate-500",
  },
};

export const promotionStatusLabels: Record<PromotionStatus, string> = {
  ACTIVE: "Active",
  UPCOMING: "Upcoming",
  EXPIRED: "Expired",
  INACTIVE: "Inactive",
};

export const couponStatusTabs = [
  "ALL",
  "ACTIVE",
  "UPCOMING",
  "EXPIRED",
  "INACTIVE",
] as const;

export function initialDraft(): CouponDraft {
  return {
    code: "",
    promotionId: "",
    discountPercentage: "",
    maxUsage: "",
  };
}
