import { AUTH_COOKIE_NAMES } from "@itech/shared/auth";
import { formatDateTime, formatMoney } from "../../lib/seller-api";
import { emptyStats, stockMeta } from "./constants";
import type {
  DraftState,
  FilterStatus,
  ProductRecord,
  ProductStats,
  ProductVariantRecord,
  VariantAttributeDraft,
  VariantDraftRow,
} from "./types";

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createVariantAttribute(
  seed?: Partial<VariantAttributeDraft>,
): VariantAttributeDraft {
  return {
    id: seed?.id ?? makeId("attr"),
    key: seed?.key ?? "",
    value: seed?.value ?? "",
  };
}

export function normalizeStockStatus(
  stockQuantity: number | undefined | null,
): Exclude<FilterStatus, "ALL"> {
  const stock = Number(stockQuantity || 0);
  if (stock <= 0) return "OUT_STOCK";
  if (stock <= 10) return "LOW_STOCK";
  return "ACTIVE";
}

export function getStatusMeta(status: Exclude<FilterStatus, "ALL">) {
  return stockMeta[status];
}

export function htmlToPlainText(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isBlankHtml(value: string) {
  return htmlToPlainText(value).length === 0;
}

export function parseAuthUserId() {
  if (typeof document === "undefined") return "";
  const cookieName = AUTH_COOKIE_NAMES.authUser;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`),
  );
  if (!match) return "";

  try {
    const decoded = decodeURIComponent(match[1]);
    const parsed = JSON.parse(decoded);
    return parsed?.id || "";
  } catch {
    return "";
  }
}

export function getImagePreviews(files: File[]) {
  return files.map((file) => URL.createObjectURL(file));
}

export function mapProductVariantsToDraft(
  variants: ProductVariantRecord[] | undefined,
): VariantDraftRow[] {
  return (variants || []).map((variant) => ({
    id: variant.id,
    backendId: variant.id,
    quantity: String(variant.quantity ?? 0),
    priceAdjustment: String(variant.priceAdjustment ?? 0),
    attributes: Object.entries(variant.variantAttributes || {}).map(([key, value]) =>
      createVariantAttribute({ key, value }),
    ),
    imageFile: null,
    imagePreview: variant.images?.[0] ?? null,
  }));
}

export function formatVariantAttributes(
  variantAttributes:
    | Record<string, string>
    | VariantAttributeDraft[]
    | undefined,
) {
  const entries = Array.isArray(variantAttributes)
    ? variantAttributes
        .map((item) => [item.key, item.value] as const)
        .filter(([key, value]) => key && value)
    : Object.entries(variantAttributes || {});
  if (entries.length === 0) return "Default variant";
  return entries.map(([key, value]) => `${key}: ${value}`).join(" - ");
}

export function getVariantTypeCount(product: ProductRecord) {
  return product.variantTypes?.length ?? Object.keys(product.variantOptions || {}).length;
}

export function getVariantSummary(product: ProductRecord) {
  const typeCount = getVariantTypeCount(product);
  if (typeCount <= 0) return "Simple";
  return `${typeCount} type${typeCount > 1 ? "s" : ""}`;
}

export function buildVariantAttributesObject(attributes: VariantAttributeDraft[]) {
  const result: Record<string, string> = {};
  const seen = new Set<string>();

  for (const attribute of attributes) {
    const key = attribute.key.trim();
    const value = attribute.value.trim();

    if (!key || !value) {
      continue;
    }

    const normalizedKey = key.toLowerCase();
    if (seen.has(normalizedKey)) {
      throw new Error(`Duplicate variant attribute key "${key}".`);
    }
    seen.add(normalizedKey);
    result[key] = value;
  }

  if (Object.keys(result).length === 0) {
    throw new Error("Each variant must contain at least one attribute pair.");
  }

  return result;
}

export function buildProductStats(products: ProductRecord[]): ProductStats {
  const summary = { ...emptyStats };

  for (const product of products) {
    summary.total += 1;
    const status = normalizeStockStatus(product.stockQuantity);
    if (status === "ACTIVE") summary.active += 1;
    else if (status === "LOW_STOCK") summary.lowStock += 1;
    else summary.outStock += 1;
  }

  return summary;
}

export function filterProducts(
  products: ProductRecord[],
  categoryFilter: string,
  statusFilter: FilterStatus,
  searchText: string,
) {
  const query = searchText.trim().toLowerCase();

  return products.filter((product) => {
    const status = normalizeStockStatus(product.stockQuantity);
    if (statusFilter !== "ALL" && status !== statusFilter) return false;
    if (categoryFilter !== "ALL" && product.categoryId !== categoryFilter) return false;

    if (!query) return true;

    const haystack = [
      product.name,
      product.Category?.name,
      product.Seller?.User?.username,
      product.Seller?.User?.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function paginateProducts(products: ProductRecord[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return products.slice(start, start + pageSize);
}

export function createDraftFromProduct(product: ProductRecord | ProductVariantRecord | any): DraftState {
  return {
    name: product.name || "",
    description: product.description || "",
    price: String(product.price ?? ""),
    stockQuantity: String(product.stockQuantity ?? ""),
    categoryId: product.categoryId || "",
    images: [],
    previews: product.images ?? [],
  };
}

export { formatDateTime, formatMoney };
