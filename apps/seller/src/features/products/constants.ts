import type { DraftState, FilterStatus, ProductStats } from "./types";

export const PAGE_SIZE = 8;

export const emptyDraft: DraftState = {
  name: "",
  description: "",
  price: "",
  stockQuantity: "",
  categoryId: "",
  images: [],
  previews: [],
};

export const emptyStats: ProductStats = {
  total: 0,
  active: 0,
  lowStock: 0,
  outStock: 0,
};

export const filterTabs: FilterStatus[] = ["ALL", "ACTIVE", "LOW_STOCK", "OUT_STOCK"];

export const stockMeta: Record<
  Exclude<FilterStatus, "ALL">,
  { label: string; chip: string; tone: string }
> = {
  ACTIVE: {
    label: "In stock",
    chip: "bg-emerald-500",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  LOW_STOCK: {
    label: "Low stock",
    chip: "bg-amber-500",
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  OUT_STOCK: {
    label: "Out of stock",
    chip: "bg-rose-500",
    tone: "bg-rose-50 text-rose-700 ring-rose-200",
  },
};
