"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import TinyMCEEditor from "../../components/tinymce-editor";
import { apiJson, formatDateTime, formatMoney } from "../../lib/admin-api";

type UserOption = {
  id: string;
  username: string;
  email: string;
};

type CategoryOption = {
  id: string;
  name: string;
};

type VariantAttributeDraft = {
  id: string;
  key: string;
  value: string;
};

type VariantDraftRow = {
  id: string;
  backendId: string | null;
  attributes: VariantAttributeDraft[];
  quantity: string;
  priceAdjustment: string;
  imageFile: File | null;
  imagePreview: string | null;
};

type ProductVariantRecord = {
  id: string;
  quantity: number;
  variantAttributes: Record<string, string>;
  images?: string[] | null;
  priceAdjustment?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

type ProductSeller = {
  id: string;
  email?: string;
  image?: string | null;
  User?: {
    id: string;
    username: string;
    email: string;
  };
};

type ProductRecord = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  images?: string[] | null;
  variantTypes?: string[] | null;
  variantOptions?: Record<string, string[]> | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  categoryId: string;
  Category?: CategoryOption | null;
  Seller?: ProductSeller | null;
  averageRating?: number;
  reviewCount?: number;
  soldCount?: number;
  ProductVariant?: ProductVariantRecord[];
};

type ProductsResponse = {
  products: ProductRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type CategoriesResponse = {
  categories: CategoryOption[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type SellersResponse = {
  users: UserOption[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ProductStats = {
  total: number;
  active: number;
  lowStock: number;
  outStock: number;
};

type ProductDetail = ProductRecord & {
  ProductVariant?: ProductVariantRecord[];
};

type ProductImportResultRow = {
  index: number;
  success: boolean;
  productId?: string;
  name?: string | null;
  error?: string;
};

type ProductImportResult = {
  total: number;
  processed: number;
  successCount: number;
  failureCount: number;
  results: ProductImportResultRow[];
};

type ProductBulkDeleteResult = {
  total: number;
  deletedCount: number;
  failureCount: number;
  results: Array<{
    id: string;
    success: boolean;
    error?: string;
  }>;
};

type ModalMode = "view" | "edit" | "add" | null;

type DraftState = {
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
  categoryId: string;
  sellerUserId: string;
  useVariants: boolean;
  variants: VariantDraftRow[];
  existingImages: string[];
  newImages: File[];
  previews: string[];
};

const PAGE_SIZE = 8;
const ADMIN_BASE_PATH = "/admin";
const IMPORT_TEMPLATE_BASE = `${ADMIN_BASE_PATH}/templates`;

const emptyStats: ProductStats = {
  total: 0,
  active: 0,
  lowStock: 0,
  outStock: 0,
};

const stockMeta = {
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

function initialDraft(): DraftState {
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

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createVariantAttribute(
  seed?: Partial<VariantAttributeDraft>,
): VariantAttributeDraft {
  return {
    id: seed?.id ?? makeId("attr"),
    key: seed?.key ?? "",
    value: seed?.value ?? "",
  };
}

function createVariantRow(seed?: Partial<VariantDraftRow>): VariantDraftRow {
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

function mapVariantRecordToDraft(
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

function isBlankHtml(value: string) {
  const plain = htmlToPlainText(value);

  return plain.length === 0;
}

function htmlToPlainText(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function variantAttributesLabel(attributes: VariantAttributeDraft[]) {
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

function buildVariantPayloads(rows: VariantDraftRow[]) {
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

function normalizeStockStatus(stockQuantity: number | undefined | null) {
  const stock = Number(stockQuantity || 0);
  if (stock <= 0) return "OUT_STOCK";
  if (stock <= 10) return "LOW_STOCK";
  return "ACTIVE";
}

function statCard({
  title,
  value,
  note,
  accent,
}: {
  title: string;
  value: string | number;
  note: string;
  accent: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {title}
      </p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-sm text-slate-500">{note}</p>
        </div>
        <div className={`h-3 w-3 rounded-full ${accent}`} />
      </div>
    </article>
  );
}

function ModalShell({
  open,
  title,
  subtitle,
  onClose,
  children,
  widthClass = "max-w-6xl",
}: {
  open: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div
        className={`w-full ${widthClass} max-h-[92vh] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.22)]`}
      >
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
                Products
              </p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                {title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
        <div className="max-h-[calc(92vh-110px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function getPreviewUrl(file: File) {
  return URL.createObjectURL(file);
}

export default function ProductsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [sellers, setSellers] = useState<UserOption[]>([]);
  const [stats, setStats] = useState<ProductStats>(emptyStats);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "LOW_STOCK" | "OUT_STOCK"
  >("ALL");
  const [page, setPage] = useState(1);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(initialDraft());
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProductRecord | null>(
    null,
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importContinueOnError, setImportContinueOnError] = useState(true);
  const [importResult, setImportResult] = useState<ProductImportResult | null>(
    null,
  );

  const fetchResources = async () => {
    try {
      const [categoriesRes, sellersRes] = await Promise.all([
        apiJson<CategoriesResponse>(
          "/categories?page=1&limit=1000",
          undefined,
          "/products",
        ),
        apiJson<SellersResponse>(
          "/users?role=SELLER&page=1&limit=1000",
          undefined,
          "/products",
        ),
      ]);

      setCategories(categoriesRes.categories ?? []);
      setSellers(sellersRes.users ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load resources.",
      );
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiJson<ProductsResponse>(
        `/products?page=1&limit=1000&search=${encodeURIComponent(searchQuery)}`,
        undefined,
        "/products",
      );

      const list = response.products ?? [];
      setProducts(list);
      setSelectedProductIds((current) =>
        current.filter((id) => list.some((product) => product.id === id)),
      );

      const summary = { ...emptyStats, total: list.length };
      list.forEach((product) => {
        const status = normalizeStockStatus(product.stockQuantity);
        if (status === "ACTIVE") summary.active += 1;
        else if (status === "LOW_STOCK") summary.lowStock += 1;
        else summary.outStock += 1;
      });
      setStats(summary);
      setPage(1);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return;
      setError(err instanceof Error ? err.message : "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const status = normalizeStockStatus(product.stockQuantity);
      if (statusFilter !== "ALL" && status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && product.categoryId !== categoryFilter)
        return false;

      const query = searchInput.trim().toLowerCase();
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
  }, [categoryFilter, products, searchInput, statusFilter]);

  const pagedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, page]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE),
  );

  const allPagedSelected =
    pagedProducts.length > 0 &&
    pagedProducts.every((product) => selectedProductIds.includes(product.id));

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, statusFilter]);

  useEffect(() => {
    setSelectedProductIds((current) =>
      current.filter((id) =>
        filteredProducts.some((product) => product.id === id),
      ),
    );
  }, [filteredProducts]);

  useEffect(() => {
    const missing = pagedProducts.filter(
      (product) => !product.Category || !product.Seller,
    );
    if (missing.length === 0) return;
    // list already contains nested relations when backend returns them; keep no-op fallback
  }, [pagedProducts]);

  const openAddModal = () => {
    setEditingId(null);
    setSelectedProduct(null);
    setDraft(initialDraft());
    setModalMode("add");
  };

  const openEditModal = async (product: ProductRecord) => {
    setError(null);
    setEditingId(product.id);
    setModalMode("edit");

    try {
      const detail = await apiJson<ProductDetail>(
        `/products/${product.id}`,
        undefined,
        "/products",
      );
      setSelectedProduct(detail);
      setDraft({
        name: detail.name || "",
        description: detail.description || "",
        price: String(detail.price ?? ""),
        stockQuantity: String(detail.stockQuantity ?? ""),
        categoryId: detail.categoryId || "",
        sellerUserId: detail.Seller?.User?.id || "",
        useVariants: Boolean(detail.ProductVariant?.length),
        variants: detail.ProductVariant?.length
          ? detail.ProductVariant.map((variant) =>
              mapVariantRecordToDraft(variant),
            )
          : [],
        existingImages: detail.images ?? [],
        newImages: [],
        previews: detail.images ?? [],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load product detail.",
      );
    }
  };

  const openViewModal = async (product: ProductRecord) => {
    setError(null);
    try {
      const detail = await apiJson<ProductDetail>(
        `/products/${product.id}`,
        undefined,
        "/products",
      );
      setSelectedProduct(detail);
      setEditingId(null);
      setModalMode("view");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load product detail.",
      );
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedProduct(null);
    setEditingId(null);
    setDraft(initialDraft());
  };

  const closeImportModal = () => {
    setImportOpen(false);
    setImportFile(null);
    setImportContinueOnError(true);
    setImportResult(null);
  };

  const submitImport = async () => {
    if (!importFile) {
      setError("Please choose a CSV or XLSX file to import.");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);
    formData.append("continueOnError", String(importContinueOnError));

    setImporting(true);
    setError(null);

    try {
      const result = await apiJson<ProductImportResult>(
        "/products/import",
        {
          method: "POST",
          body: formData,
        },
        "/products",
      );

      setImportResult(result);
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import file.");
    } finally {
      setImporting(false);
    }
  };

  const submitProduct = async () => {
    const name = draft.name.trim();
    const description = draft.description.trim();
    const categoryId = draft.categoryId;
    const sellerUserId = draft.sellerUserId;
    const price = Number(draft.price);
    const stockQuantity = Number(draft.stockQuantity);

    if (!name) {
      setError("Product name is required.");
      return;
    }
    if (!description || isBlankHtml(description)) {
      setError("Product description is required.");
      return;
    }
    if (!categoryId) {
      setError("Please select a category.");
      return;
    }
    if (!editingId && !sellerUserId) {
      setError("Please select a seller.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("Price must be a valid positive number.");
      return;
    }
    if (
      !draft.useVariants &&
      (!Number.isFinite(stockQuantity) || stockQuantity < 0)
    ) {
      setError("Stock quantity must be a valid positive number.");
      return;
    }

    const useVariants = draft.useVariants;

    let parsedVariants: Array<{
      variantAttributes: Record<string, string>;
      quantity: number;
      priceAdjustment: number;
      imageFile: File | null;
      backendId: string | null;
    }> = [];
    if (useVariants) {
      try {
        parsedVariants = buildVariantPayloads(draft.variants);
      } catch (parseError) {
        setError(
          parseError instanceof Error
            ? parseError.message
            : "Invalid variants payload.",
        );
        return;
      }
      if (parsedVariants.length === 0) {
        setError("Add at least one variant or turn variants off.");
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", String(price));
      formData.append("categoryId", categoryId);

      if (!editingId) {
        formData.append("sellerUserId", sellerUserId);
      }

      if (!useVariants) {
        formData.append("stockQuantity", String(stockQuantity));
      }

      if (useVariants && !editingId) {
        formData.append(
          "variants",
          JSON.stringify(
            parsedVariants.map((variant) => ({
              variantAttributes: variant.variantAttributes,
              quantity: variant.quantity,
              priceAdjustment: variant.priceAdjustment,
            })),
          ),
        );
        parsedVariants.forEach((variant, index) => {
          if (variant.imageFile) {
            formData.append(`variant_image_${index}`, variant.imageFile);
          }
        });
      }

      draft.newImages.forEach((file) => {
        formData.append("images", file);
      });

      if (editingId) {
        await apiJson(
          `/products/${editingId}`,
          {
            method: "PUT",
            body: formData,
          },
          "/products",
        );
      } else {
        await apiJson(
          "/products",
          {
            method: "POST",
            body: formData,
          },
          "/products",
        );
      }

      if (editingId && useVariants) {
        await syncVariantRows(editingId, draft.variants);
      } else if (
        editingId &&
        !useVariants &&
        selectedProduct?.ProductVariant?.length
      ) {
        await Promise.all(
          (selectedProduct.ProductVariant ?? []).map((variant) =>
            apiJson(
              `/variants/${variant.id}`,
              {
                method: "DELETE",
              },
              "/admin",
            ),
          ),
        );
      }

      await fetchProducts();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    setError(null);

    try {
      await apiJson(
        `/products/${confirmDelete.id}`,
        {
          method: "DELETE",
        },
        "/products",
      );
      setConfirmDelete(null);
      await fetchProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete product.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  };

  const toggleSelectAllPaged = () => {
    if (allPagedSelected) {
      setSelectedProductIds((current) =>
        current.filter(
          (id) => !pagedProducts.some((product) => product.id === id),
        ),
      );
      return;
    }

    setSelectedProductIds((current) => {
      const next = new Set(current);
      pagedProducts.forEach((product) => next.add(product.id));
      return Array.from(next);
    });
  };

  const submitBulkDelete = async () => {
    if (selectedProductIds.length === 0) {
      setError("Please select at least one product to delete.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await apiJson<ProductBulkDeleteResult>(
        "/products/bulk-delete",
        {
          method: "POST",
          body: JSON.stringify({
            productIds: selectedProductIds,
          }),
        },
        "/products",
      );

      setSelectedProductIds([]);
      setBulkDeleteOpen(false);
      await fetchProducts();

      if (result.failureCount > 0) {
        setError(
          `${result.deletedCount} products deleted, ${result.failureCount} failed.`,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete products.",
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedStatus = useMemo(() => {
    if (!selectedProduct) return "OUT_STOCK" as const;
    return normalizeStockStatus(selectedProduct.stockQuantity);
  }, [selectedProduct]);

  const openImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);
    setDraft((current) => ({
      ...current,
      newImages: [...current.newImages, ...incoming],
      previews: [
        ...current.previews,
        ...incoming.map((file) => getPreviewUrl(file)),
      ],
    }));
  };

  const removePreview = (index: number) => {
    setDraft((current) => {
      const nextNewImages = [...current.newImages];
      const nextPreviews = [...current.previews];
      nextNewImages.splice(index, 1);
      nextPreviews.splice(index, 1);
      return {
        ...current,
        newImages: nextNewImages,
        previews: nextPreviews,
      };
    });
  };

  const addVariantRow = () => {
    setDraft((current) => ({
      ...current,
      useVariants: true,
      variants: [...current.variants, createVariantRow()],
    }));
  };

  const updateVariantRow = (
    rowId: string,
    updater: (row: VariantDraftRow) => VariantDraftRow,
  ) => {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((row) =>
        row.id === rowId ? updater(row) : row,
      ),
    }));
  };

  const removeVariantRow = (rowId: string) => {
    setDraft((current) => ({
      ...current,
      variants: current.variants.filter((row) => row.id !== rowId),
    }));
  };

  const addVariantAttribute = (rowId: string) => {
    updateVariantRow(rowId, (row) => ({
      ...row,
      attributes: [...row.attributes, createVariantAttribute()],
    }));
  };

  const updateVariantAttribute = (
    rowId: string,
    attributeId: string,
    field: "key" | "value",
    value: string,
  ) => {
    updateVariantRow(rowId, (row) => ({
      ...row,
      attributes: row.attributes.map((attribute) =>
        attribute.id === attributeId
          ? { ...attribute, [field]: value }
          : attribute,
      ),
    }));
  };

  const removeVariantAttribute = (rowId: string, attributeId: string) => {
    updateVariantRow(rowId, (row) => {
      const next = row.attributes.filter(
        (attribute) => attribute.id !== attributeId,
      );
      return {
        ...row,
        attributes: next.length > 0 ? next : [createVariantAttribute()],
      };
    });
  };

  const setVariantImage = (rowId: string, file: File | null) => {
    updateVariantRow(rowId, (row) => ({
      ...row,
      imageFile: file,
      imagePreview: file ? getPreviewUrl(file) : null,
    }));
  };

  const syncVariantRows = async (
    productId: string,
    rows: VariantDraftRow[],
  ) => {
    if (!selectedProduct) return;

    const existingRows = selectedProduct.ProductVariant ?? [];
    const touchedIds = new Set<string>();
    const normalizedRows = buildVariantPayloads(rows);

    for (const payload of normalizedRows) {
      const formData = new FormData();
      formData.append("quantity", String(payload.quantity));
      formData.append("priceAdjustment", String(payload.priceAdjustment));
      formData.append(
        "variantAttributes",
        JSON.stringify(payload.variantAttributes),
      );

      if (payload.imageFile) {
        formData.append("images", payload.imageFile);
      }

      if (payload.backendId) {
        touchedIds.add(payload.backendId);
        await apiJson(
          `/variants/${payload.backendId}`,
          {
            method: "PUT",
            body: formData,
          },
          "/admin",
        );
      } else {
        formData.append("productId", productId);
        await apiJson(
          "/variants",
          {
            method: "POST",
            body: formData,
          },
          "/admin",
        );
      }
    }

    for (const row of existingRows) {
      if (!touchedIds.has(row.id)) {
        await apiJson(
          `/variants/${row.id}`,
          {
            method: "DELETE",
          },
          "/admin",
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
              Catalog engine
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Products
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Manage inventory, pricing, category assignment, seller assignment,
              and product media with real backend data.
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCard({
          title: "Total products",
          value: stats.total.toLocaleString("vi-VN"),
          note: "All items in the catalog",
          accent: "bg-[#008ECC]",
        })}
        {statCard({
          title: "In stock",
          value: stats.active.toLocaleString("vi-VN"),
          note: "Healthy inventory levels",
          accent: "bg-emerald-500",
        })}
        {statCard({
          title: "Low stock",
          value: stats.lowStock.toLocaleString("vi-VN"),
          note: "Need replenishment soon",
          accent: "bg-amber-500",
        })}
        {statCard({
          title: "Out of stock",
          value: stats.outStock.toLocaleString("vi-VN"),
          note: "Currently unavailable items",
          accent: "bg-rose-500",
        })}
      </section>

      <section className="space-y-6">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Product list
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Search, filter, and manage inventory records.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex h-11 min-w-[18rem] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600">
                <span className="text-slate-400">Search</span>
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      setSearchQuery(searchInput.trim());
                      setPage(1);
                    }
                  }}
                  placeholder="Name, category, seller"
                  className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery(searchInput.trim());
                  setPage(1);
                }}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                  setCategoryFilter("ALL");
                  setStatusFilter("ALL");
                  setPage(1);
                }}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={fetchProducts}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setBulkDeleteOpen(true)}
                disabled={selectedProductIds.length === 0}
                className="h-11 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete selected
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["ALL", "ACTIVE", "LOW_STOCK", "OUT_STOCK"] as const).map(
                (status) => {
                  const active = statusFilter === status;
                  const label =
                    status === "ALL"
                      ? "All"
                      : status === "ACTIVE"
                        ? "In stock"
                        : status === "LOW_STOCK"
                          ? "Low stock"
                          : "Out stock";
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-slate-950 text-white shadow-[0_10px_22px_rgba(15,23,42,0.16)]"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                },
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option value="ALL">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setImportResult(null);
                  setImportFile(null);
                  setImportContinueOnError(true);
                  setImportOpen(true);
                }}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Import file
              </button>

              <button
                type="button"
                onClick={openAddModal}
                className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
              >
                Add product
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p>
              {selectedProductIds.length > 0
                ? `${selectedProductIds.length} products selected for bulk actions.`
                : "Select one or more products to use bulk delete."}
            </p>
            {selectedProductIds.length > 0 ? (
              <button
                type="button"
                onClick={() => setSelectedProductIds([])}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Clear selection
              </button>
            ) : null}
          </div>
        </article>

        <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
          <table className="w-full table-fixed divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-[5%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <input
                    type="checkbox"
                    checked={allPagedSelected}
                    onChange={toggleSelectAllPaged}
                    aria-label="Select all products on this page"
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                  />
                </th>
                <th className="w-[24%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Product
                </th>
                <th className="w-[14%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Category
                </th>
                <th className="w-[14%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Seller
                </th>
                <th className="w-[10%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Price
                </th>
                <th className="w-[8%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Stock
                </th>
                <th className="w-[12%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Status
                </th>
                <th className="w-[18%] px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-16 text-center text-sm text-slate-500"
                  >
                    Loading products...
                  </td>
                </tr>
              ) : pagedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <p className="text-sm font-medium text-slate-900">
                      No products found
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try another filter or create a new product.
                    </p>
                  </td>
                </tr>
              ) : (
                pagedProducts.map((product) => {
                  const status = normalizeStockStatus(product.stockQuantity);
                  const variantCount =
                    product.ProductVariant?.length ??
                    product.variantTypes?.length ??
                    0;

                  return (
                    <tr key={product.id} className="align-top">
                      <td className="px-5 py-5">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          aria-label={`Select product ${product.name}`}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                        />
                      </td>
                      <td className="px-5 py-5">
                        <div className="flex items-start gap-4">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-xs font-semibold text-slate-400">
                                No img
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950">
                              {product.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5 text-sm text-slate-600">
                        <p className="truncate font-medium text-slate-900">
                          {product.Category?.name || "N/A"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {product.categoryId.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-5 py-5 text-sm text-slate-600">
                        <p className="truncate font-medium text-slate-900">
                          {product.Seller?.User?.username || "N/A"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400 truncate">
                          {product.Seller?.User?.email || "No email"}
                        </p>
                      </td>
                      <td className="px-5 py-5 text-sm text-slate-600">
                        {formatMoney(product.price)}
                      </td>
                      <td className="px-5 py-5 text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">
                          {Number(product.stockQuantity || 0).toLocaleString(
                            "vi-VN",
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                            stockMeta[status].tone
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${stockMeta[status].chip}`}
                          />
                          {stockMeta[status].label}
                        </span>
                      </td>
                      <td className="px-5 py-5">
                        <div className="flex flex-nowrap justify-end gap-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openViewModal(product)}
                            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(product)}
                            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {(page - 1) * PAGE_SIZE + 1}-{" "}
              {Math.min(page * PAGE_SIZE, filteredProducts.length)} of{" "}
              {filteredProducts.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50"
              >
                Prev
              </button>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        </article>
      </section>

      <ModalShell
        open={modalMode === "add" || modalMode === "edit"}
        title={modalMode === "add" ? "Create product" : "Edit product"}
        subtitle="Manage core information, media, category assignment, and inventory."
        onClose={closeModal}
        widthClass="max-w-6xl"
      >
        <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5 p-6 lg:border-r lg:border-slate-200">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Product name
                </span>
                <input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Classic Sneakers"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Description
                </span>
                <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
                  <TinyMCEEditor
                    value={draft.description}
                    placeholder="Write a rich product description with HTML formatting."
                    onChange={(content) =>
                      setDraft((current) => ({
                        ...current,
                        description: content,
                      }))
                    }
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Price
                </span>
                <input
                  type="number"
                  min={0}
                  value={draft.price}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  placeholder="120000"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Stock quantity
                </span>
                <input
                  type="number"
                  min={0}
                  value={draft.stockQuantity}
                  disabled={draft.useVariants}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      stockQuantity: event.target.value,
                    }))
                  }
                  placeholder="50"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Category
                </span>
                <select
                  value={draft.categoryId}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      categoryId: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  {editingId ? "Seller" : "Seller"}
                </span>
                <select
                  value={draft.sellerUserId}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      sellerUserId: event.target.value,
                    }))
                  }
                  disabled={Boolean(editingId)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">Select seller</option>
                  {sellers.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.username} - {seller.email}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Variants
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Build each variant as its own row with attributes, quantity,
                    price adjustment, and an optional image.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((current) => {
                      const nextUseVariants = !current.useVariants;
                      return {
                        ...current,
                        useVariants: nextUseVariants,
                        variants:
                          nextUseVariants && current.variants.length === 0
                            ? [createVariantRow()]
                            : current.variants,
                      };
                    })
                  }
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    draft.useVariants
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {draft.useVariants ? "Enabled" : "Disabled"}
                </button>
              </div>

              {draft.useVariants ? (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Variant rows
                    </p>
                    <button
                      type="button"
                      onClick={addVariantRow}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Add row
                    </button>
                  </div>

                  {draft.variants.length > 0 ? (
                    draft.variants.map((row, rowIndex) => (
                      <div
                        key={row.id}
                        className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Variant {rowIndex + 1}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {variantAttributesLabel(row.attributes) ||
                                "Add attributes like Size, Color, Material."}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVariantRow(row.id)}
                            className="rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-4 space-y-3">
                          {row.attributes.map((attribute) => (
                            <div
                              key={attribute.id}
                              className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
                            >
                              <input
                                value={attribute.key}
                                onChange={(event) =>
                                  updateVariantAttribute(
                                    row.id,
                                    attribute.id,
                                    "key",
                                    event.target.value,
                                  )
                                }
                                placeholder="Attribute name"
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                              />
                              <input
                                value={attribute.value}
                                onChange={(event) =>
                                  updateVariantAttribute(
                                    row.id,
                                    attribute.id,
                                    "value",
                                    event.target.value,
                                  )
                                }
                                placeholder="Attribute value"
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  removeVariantAttribute(row.id, attribute.id)
                                }
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addVariantAttribute(row.id)}
                            className="rounded-full border border-dashed border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            Add attribute
                          </button>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <label className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Quantity
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={row.quantity}
                              onChange={(event) =>
                                updateVariantRow(row.id, (current) => ({
                                  ...current,
                                  quantity: event.target.value,
                                }))
                              }
                              placeholder="10"
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                            />
                          </label>

                          <label className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Price adjustment
                            </span>
                            <input
                              type="number"
                              value={row.priceAdjustment}
                              onChange={(event) =>
                                updateVariantRow(row.id, (current) => ({
                                  ...current,
                                  priceAdjustment: event.target.value,
                                }))
                              }
                              placeholder="0"
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                            />
                          </label>
                        </div>
                        <div className="mt-4">
                          <div className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Variant image
                            </span>
                            <label className="flex min-h-[118px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-center transition hover:bg-slate-50">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0] ?? null;
                                  setVariantImage(row.id, file);
                                  event.currentTarget.value = "";
                                }}
                              />
                              {row.imagePreview ? (
                                <img
                                  src={row.imagePreview}
                                  alt={`Variant ${rowIndex + 1}`}
                                  className="h-20 w-20 rounded-2xl object-cover"
                                />
                              ) : (
                                <>
                                  <span className="text-sm font-semibold text-slate-700">
                                    Choose image
                                  </span>
                                  <span className="text-xs leading-5 text-slate-500">
                                    Optional product variant photo
                                  </span>
                                </>
                              )}
                            </label>
                            {row.imagePreview ? (
                              <button
                                type="button"
                                onClick={() => setVariantImage(row.id, null)}
                                className="text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                              >
                                Clear image
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No variant rows yet. Add one to build size, color, or
                      material options.
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  Simple stock mode is active. Turn on variants if this product
                  has multiple combinations.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5 bg-slate-50 p-6">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Images</p>
              <p className="mt-1 text-sm text-slate-500">
                Upload one or more product images. New uploads replace the
                current gallery on edit.
              </p>
              <label className="mt-4 block cursor-pointer rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:bg-slate-100">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const files = event.target.files;
                    if (!files || files.length === 0) return;
                    openImages(files);
                    event.currentTarget.value = "";
                  }}
                />
                <div className="text-sm font-semibold text-slate-700">
                  Choose images
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Drag and drop is not required. Click to upload gallery images.
                </p>
              </label>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {draft.previews.length > 0 ? (
                  draft.previews.map((preview, index) => (
                    <div
                      key={`${preview}-${index}`}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      <div className="aspect-square">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePreview(index)}
                        className="absolute right-2 top-2 rounded-full bg-slate-950/85 px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    No new images selected yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Draft preview
              </p>
              <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                <div className="aspect-[16/9] bg-slate-100">
                  {draft.previews[0] ? (
                    <img
                      src={draft.previews[0]}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-sm text-slate-400">
                      Product preview
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-sm font-semibold text-slate-950">
                    {draft.name || "Product title"}
                  </p>
                  <p className="line-clamp-3 text-sm leading-6 text-slate-500">
                    {htmlToPlainText(draft.description) ||
                      "Write a short product description."}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                      {draft.useVariants ? "Variants on" : "Simple stock"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {draft.price || "0"} VND
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitProduct}
                disabled={saving}
                className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : modalMode === "add"
                    ? "Create product"
                    : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={modalMode === "view" && Boolean(selectedProduct)}
        title={selectedProduct?.name ?? "Product detail"}
        subtitle="Inspect product media, pricing, seller and variant records."
        onClose={closeModal}
        widthClass="max-w-6xl"
      >
        {selectedProduct ? (
          <div className="grid gap-0 lg:grid-cols-[1fr_0.98fr]">
            <div className="space-y-5 p-6 lg:border-r lg:border-slate-200">
              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100">
                <div className="aspect-[16/10]">
                  {selectedProduct.images?.[0] ? (
                    <img
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-sm text-slate-400">
                      No main image
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Price
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {formatMoney(selectedProduct.price)}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Stock
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {Number(selectedProduct.stockQuantity || 0).toLocaleString(
                      "vi-VN",
                    )}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Status
                  </p>
                  <span
                    className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                      stockMeta[selectedStatus].tone
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${stockMeta[selectedStatus].chip}`}
                    />
                    {stockMeta[selectedStatus].label}
                  </span>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">
                  Description
                </p>
                <div className="prose prose-slate mt-3 max-w-none text-sm leading-7 text-slate-600">
                  {selectedProduct.description ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: selectedProduct.description,
                      }}
                    />
                  ) : (
                    <p>No description provided.</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Category
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {selectedProduct.Category?.name || "N/A"}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Seller
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {selectedProduct.Seller?.User?.username || "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Ratings
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {selectedProduct.averageRating ?? 0}/5
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Reviews
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {(selectedProduct.reviewCount ?? 0).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Sold
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {(selectedProduct.soldCount ?? 0).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Timeline</p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <span>Created</span>
                    <span className="font-medium text-slate-900">
                      {formatDateTime(selectedProduct.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <span>Updated</span>
                    <span className="font-medium text-slate-900">
                      {formatDateTime(selectedProduct.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5 bg-slate-50 p-6">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Gallery</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {(selectedProduct.images ?? []).length > 0 ? (
                    selectedProduct.images?.map((image, index) => (
                      <div
                        key={`${image}-${index}`}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                      >
                        <div className="aspect-square">
                          <img
                            src={image}
                            alt={`${selectedProduct.name} ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      No gallery images.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Variants</p>
                <div className="mt-4 space-y-3">
                  {(selectedProduct.ProductVariant ?? []).length > 0 ? (
                    selectedProduct.ProductVariant?.map((variant) => (
                      <div
                        key={variant.id}
                        className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {Object.entries(variant.variantAttributes || {})
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(" · ")}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Quantity {variant.quantity} · Price adj.{" "}
                              {variant.priceAdjustment ?? 0}
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                            {variant.images?.length || 0} images
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No variants for this product.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedProduct)}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Edit product
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </ModalShell>

      <ModalShell
        open={importOpen}
        title="Import products"
        subtitle="Upload a CSV or Excel file to create products in bulk for admin or seller catalogs."
        onClose={closeImportModal}
        widthClass="max-w-4xl"
      >
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-5 p-6 lg:border-r lg:border-slate-200">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">
                Template files
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use the provided headers exactly. For products with variants,
                keep the <code>variants</code> column as a JSON array string.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={`${IMPORT_TEMPLATE_BASE}/product-import-template.csv`}
                  download
                  className="inline-flex h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Download CSV
                </a>
                <a
                  href={`${IMPORT_TEMPLATE_BASE}/product-import-template.xlsx`}
                  download
                  className="inline-flex h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Download XLSX
                </a>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Import file
                </span>
                <label className="mt-3 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:bg-slate-100">
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setImportFile(file);
                      setImportResult(null);
                    }}
                  />
                  <span className="text-base font-semibold text-slate-900">
                    {importFile ? importFile.name : "Choose CSV or XLSX file"}
                  </span>
                  <span className="mt-2 text-sm leading-6 text-slate-500">
                    Maximum 10MB. The backend will parse the first worksheet for
                    Excel files.
                  </span>
                </label>
              </label>

              <label className="mt-4 flex items-start gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={importContinueOnError}
                  onChange={(event) =>
                    setImportContinueOnError(event.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                />
                <span className="text-sm leading-6 text-slate-600">
                  Continue importing valid rows even if some rows fail.
                </span>
              </label>

              <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Required columns: <code>name</code>, <code>price</code>,{" "}
                <code>categoryId</code>. Use either <code>stockQuantity</code>{" "}
                for simple products or <code>variants</code> for variable
                products. <code>sellerUserId</code> is required when admin
                imports for a seller.
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeImportModal}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitImport}
                disabled={importing}
                className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {importing ? "Importing..." : "Start import"}
              </button>
            </div>
          </div>

          <div className="space-y-5 bg-slate-50 p-6">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Sample row format
              </p>
              <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Field</th>
                        <th className="px-4 py-3">Example</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white text-slate-600">
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          name
                        </td>
                        <td className="px-4 py-3">Classic Sneakers</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          description
                        </td>
                        <td className="px-4 py-3">
                          {`<p>Lightweight sneakers for daily wear</p>`}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          variants
                        </td>
                        <td className="px-4 py-3 text-xs leading-6">
                          {`[{"variantAttributes":{"size":"M","color":"Black"},"quantity":10,"priceAdjustment":0}]`}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Import result
              </p>
              {importResult ? (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Total rows
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        {importResult.total}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        Success
                      </p>
                      <p className="mt-2 text-xl font-semibold text-emerald-900">
                        {importResult.successCount}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                        Failed
                      </p>
                      <p className="mt-2 text-xl font-semibold text-rose-900">
                        {importResult.failureCount}
                      </p>
                    </div>
                  </div>

                  <div className="max-h-[320px] overflow-y-auto rounded-[1.5rem] border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Row</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Message</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {importResult.results.map((row) => (
                          <tr key={`${row.index}-${row.name ?? "row"}`}>
                            <td className="px-4 py-3 text-slate-600">
                              {row.index}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  row.success
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-rose-100 text-rose-700"
                                }`}
                              >
                                {row.success ? "Imported" : "Failed"}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {row.name || "-"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {row.success
                                ? row.productId || "Created successfully"
                                : row.error || "Unknown error"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Import summary will appear here after you upload a file.
                </div>
              )}
            </div>
          </div>
        </div>
      </ModalShell>

      {confirmDelete ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.22)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
              Confirm deletion
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Delete product?
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will soft delete the product from the catalog. Existing
              references remain in the database.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteProduct}
                disabled={saving}
                className="h-11 rounded-2xl bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bulkDeleteOpen ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.22)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
              Bulk deletion
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Delete selected products?
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will soft delete{" "}
              <span className="font-semibold text-slate-900">
                {selectedProductIds.length}
              </span>{" "}
              selected products from the catalog. Existing references in orders
              and reports remain available.
            </p>
            <div className="mt-4 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
              Review the selected list before confirming. This action hides the
              products from active management screens.
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setBulkDeleteOpen(false)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitBulkDelete}
                disabled={saving}
                className="h-11 rounded-2xl bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Deleting..." : "Delete selected"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
