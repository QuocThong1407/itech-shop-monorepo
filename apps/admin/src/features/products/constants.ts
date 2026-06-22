import type { DraftState, ProductStats } from "./types";

export const PAGE_SIZE = 8;
export const ADMIN_BASE_PATH = "/admin";
export const IMPORT_TEMPLATE_BASE = `${ADMIN_BASE_PATH}/templates`;

export const emptyStats: ProductStats = {
  total: 0,
  active: 0,
  lowStock: 0,
  outStock: 0,
};

export const stockMeta = {
  ACTIVE: {
    label: "In stock",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    chip: "bg-emerald-500",
  },
  LOW_STOCK: {
    label: "Low stock",
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
    chip: "bg-amber-500",
  },
  OUT_STOCK: {
    label: "Out of stock",
    tone: "bg-rose-50 text-rose-700 ring-rose-200",
    chip: "bg-rose-500",
  },
} as const;

export function initialDraft(): DraftState {
  return {
    name: "",
    description: "",
    price: "",
    stockQuantity: "",
    categoryId: "",
    sellerUserId: "",
    useVariants: false,
    variants: [],
    existingImages: [],
    newImages: [],
    previews: [],
  };
}
