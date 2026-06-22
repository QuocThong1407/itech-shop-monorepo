import type {
  BuiltVariantPayload,
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

export function createVariantRow(seed?: Partial<VariantDraftRow>): VariantDraftRow {
  return {
    id: seed?.id ?? makeId("variant"),
    backendId: seed?.backendId ?? null,
    attributes: seed?.attributes?.length
      ? seed.attributes
      : [createVariantAttribute()],
    quantity: seed?.quantity ?? "",
    priceAdjustment: seed?.priceAdjustment ?? "",
    imageFile: seed?.imageFile ?? null,
    imagePreview: seed?.imagePreview ?? null,
  };
}

export function mapVariantRecordToDraft(
  variant: ProductVariantRecord,
): VariantDraftRow {
  return createVariantRow({
    backendId: variant.id,
    attributes: Object.entries(variant.variantAttributes || {}).map(
      ([key, value]) => createVariantAttribute({ key, value }),
    ),
    quantity: String(variant.quantity ?? ""),
    priceAdjustment: String(variant.priceAdjustment ?? 0),
    imagePreview: variant.images?.[0] ?? null,
  });
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

export function variantAttributesLabel(attributes: VariantAttributeDraft[]) {
  return attributes
    .map((item) => `${item.key.trim()}: ${item.value.trim()}`.trim())
    .filter(Boolean)
    .join(" · ");
}

function buildVariantAttributesObject(
  attributes: VariantAttributeDraft[],
  index: number,
) {
  const result: Record<string, string> = {};
  const seen = new Set<string>();

  for (const attribute of attributes) {
    const key = attribute.key.trim();
    const value = attribute.value.trim();

    if (!key || !value) {
      continue;
    }

    const duplicateKey = key.toLowerCase();
    if (seen.has(duplicateKey)) {
      throw new Error(
        `Variant #${index + 1} has duplicate attribute key "${key}".`,
      );
    }
    seen.add(duplicateKey);
    result[key] = value;
  }

  if (Object.keys(result).length === 0) {
    throw new Error(`Variant #${index + 1} needs at least one attribute pair.`);
  }

  return result;
}

export function buildVariantPayloads(
  rows: VariantDraftRow[],
): BuiltVariantPayload[] {
  return rows.map((row, index) => {
    const variantAttributes = buildVariantAttributesObject(
      row.attributes,
      index,
    );
    const quantity = Number(row.quantity);
    const priceAdjustment = Number(row.priceAdjustment || 0);

    if (!Number.isFinite(quantity) || quantity < 0) {
      throw new Error(`Variant #${index + 1} has an invalid quantity.`);
    }

    if (!Number.isFinite(priceAdjustment)) {
      throw new Error(`Variant #${index + 1} has an invalid price adjustment.`);
    }

    return {
      variantAttributes,
      quantity,
      priceAdjustment,
      imageFile: row.imageFile,
      backendId: row.backendId,
    };
  });
}

export function normalizeStockStatus(stockQuantity: number | undefined | null) {
  const stock = Number(stockQuantity || 0);
  if (stock <= 0) return "OUT_STOCK";
  if (stock <= 10) return "LOW_STOCK";
  return "ACTIVE";
}

export function getPreviewUrl(file: File) {
  return URL.createObjectURL(file);
}
