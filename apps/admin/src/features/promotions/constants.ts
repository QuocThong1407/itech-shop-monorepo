import type { DraftState, PromotionStats, PromotionStatus, ScopeType } from "./types";

export const PAGE_SIZE = 8;

export const emptyStats: PromotionStats = {
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

export const scopeMeta: Record<ScopeType, { label: string; hint: string }> = {
  ALL: {
    label: "Entire store",
    hint: "Applies to every category and all products under those categories.",
  },
  CATEGORY: {
    label: "Category scope",
    hint: "Attach this promotion to selected categories only.",
  },
  PRODUCT: {
    label: "Product scope",
    hint: "Attach this promotion to selected products only.",
  },
};

export const promotionStatusTabs = [
  "ALL",
  "ACTIVE",
  "UPCOMING",
  "EXPIRED",
  "INACTIVE",
] as const;

export const promotionScopeTabs: ScopeType[] = ["ALL", "CATEGORY", "PRODUCT"];

export function initialDraft(): DraftState {
  return {
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    scopeType: "ALL",
    categoryIds: [],
    productIds: [],
    image: null,
    preview: "",
  };
}
