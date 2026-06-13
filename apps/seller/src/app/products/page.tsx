"use client";

import { useEffect, useMemo, useState } from "react";
import TinyMCEEditor from "../../components/tinymce-editor";
import { apiJson, formatDateTime, formatMoney } from "../../lib/seller-api";

type CategoryOption = {
  id: string;
  name: string;
};

type ProductSeller = {
  id: string;
  User?: {
    id: string;
    username?: string;
    email?: string;
  };
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
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type CategoriesResponse = {
  categories: CategoryOption[];
};

type ProductDetail = ProductRecord & {
  ProductVariant?: ProductVariantRecord[];
};

type FilterStatus = "ALL" | "ACTIVE" | "LOW_STOCK" | "OUT_STOCK";

type DraftState = {
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
  categoryId: string;
  images: File[];
  previews: string[];
};

type VariantDraftRow = {
  id: string;
  backendId: string;
  quantity: string;
  priceAdjustment: string;
  variantAttributes: Record<string, string>;
};

const PAGE_SIZE = 8;

const emptyDraft: DraftState = {
  name: "",
  description: "",
  price: "",
  stockQuantity: "",
  categoryId: "",
  images: [],
  previews: [],
};

function normalizeStockStatus(
  stockQuantity: number | undefined | null,
): FilterStatus | "OUT_STOCK" {
  const stock = Number(stockQuantity || 0);
  if (stock <= 0) return "OUT_STOCK";
  if (stock <= 10) return "LOW_STOCK";
  return "ACTIVE";
}

function getStatusMeta(status: FilterStatus | "OUT_STOCK") {
  switch (status) {
    case "ACTIVE":
      return {
        label: "In stock",
        chip: "bg-emerald-500",
        tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      };
    case "LOW_STOCK":
      return {
        label: "Low stock",
        chip: "bg-amber-500",
        tone: "bg-amber-50 text-amber-700 ring-amber-200",
      };
    case "OUT_STOCK":
    default:
      return {
        label: "Out of stock",
        chip: "bg-rose-500",
        tone: "bg-rose-50 text-rose-700 ring-rose-200",
      };
  }
}

function htmlToPlainText(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAuthUserId() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)authUser=([^;]+)/);
  if (!match) return "";
  try {
    const decoded = decodeURIComponent(match[1]);
    const parsed = JSON.parse(decoded);
    return parsed?.id || "";
  } catch {
    return "";
  }
}

function getImagePreviews(files: File[]) {
  return files.map((file) => URL.createObjectURL(file));
}

function mapProductVariantsToDraft(
  variants: ProductVariantRecord[] | undefined,
): VariantDraftRow[] {
  return (variants || []).map((variant) => ({
    id: variant.id,
    backendId: variant.id,
    quantity: String(variant.quantity ?? 0),
    priceAdjustment: String(variant.priceAdjustment ?? 0),
    variantAttributes: variant.variantAttributes || {},
  }));
}

function formatVariantAttributes(
  variantAttributes: Record<string, string> | undefined,
) {
  const entries = Object.entries(variantAttributes || {});
  if (entries.length === 0) return "Default variant";
  return entries.map(([key, value]) => `${key}: ${value}`).join(" · ");
}

export default function SellerProductsPage() {
  const [sellerUserId, setSellerUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [variantDrafts, setVariantDrafts] = useState<VariantDraftRow[]>([]);

  useEffect(() => {
    setSellerUserId(parseAuthUserId());
  }, []);

  const fetchCategories = async () => {
    try {
      const result = await apiJson<CategoriesResponse>(
        "/categories?page=1&limit=1000",
        undefined,
        "/seller",
      );
      setCategories(result.categories || []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to load categories.",
      );
    }
  };

  const fetchProducts = async () => {
    if (!sellerUserId) return;
    setLoading(true);
    setError(null);

    try {
      const result = await apiJson<ProductsResponse>(
        `/products?page=1&limit=1000&sellerUserId=${encodeURIComponent(sellerUserId)}`,
        undefined,
        "/seller",
      );
      setProducts(result.products || []);
      setPage(1);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCategories();
  }, []);

  useEffect(() => {
    if (!sellerUserId) return;
    void fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerUserId]);

  const filteredProducts = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return products.filter((product) => {
      const status = normalizeStockStatus(product.stockQuantity);
      if (statusFilter !== "ALL" && status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && product.categoryId !== categoryFilter)
        return false;

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
  }, [categoryFilter, products, searchText, statusFilter]);

  const pagedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, page]);

  const stats = useMemo(() => {
    const summary = { total: 0, active: 0, lowStock: 0, outStock: 0 };
    for (const product of products) {
      summary.total += 1;
      const status = normalizeStockStatus(product.stockQuantity);
      if (status === "ACTIVE") summary.active += 1;
      else if (status === "LOW_STOCK") summary.lowStock += 1;
      else summary.outStock += 1;
    }
    return summary;
  }, [products]);

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, statusFilter, searchText]);

  const openView = async (product: ProductRecord) => {
    setError(null);
    try {
      const detail = await apiJson<ProductDetail>(
        `/products/${product.id}`,
        undefined,
        "/seller",
      );
      setSelectedProduct(detail);
      setDetailOpen(true);
    } catch (err) {
      console.error(err);
      setSelectedProduct(product);
      setDetailOpen(true);
    }
  };

  const openEdit = async (product: ProductRecord) => {
    setError(null);
    try {
      const detail = await apiJson<ProductDetail>(
        `/products/${product.id}`,
        undefined,
        "/seller",
      );
      setSelectedProduct(detail);
      setDraft({
        name: detail.name || "",
        description: detail.description || "",
        price: String(detail.price ?? ""),
        stockQuantity: String(detail.stockQuantity ?? ""),
        categoryId: detail.categoryId || "",
        images: [],
        previews: detail.images ?? [],
      });
      setVariantDrafts(mapProductVariantsToDraft(detail.ProductVariant));
      setEditOpen(true);
    } catch (err) {
      console.error(err);
      setSelectedProduct(product);
      setDraft({
        name: product.name || "",
        description: product.description || "",
        price: String(product.price ?? ""),
        stockQuantity: String(product.stockQuantity ?? ""),
        categoryId: product.categoryId || "",
        images: [],
        previews: product.images ?? [],
      });
      setVariantDrafts(mapProductVariantsToDraft(product.ProductVariant));
      setEditOpen(true);
    }
  };

  const handlePreviewImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const selected = Array.from(files);
    setDraft((prev) => ({
      ...prev,
      images: selected,
      previews: getImagePreviews(selected),
    }));
  };

  const saveProduct = async () => {
    if (!selectedProduct) return;
    const name = draft.name.trim();
    const description = draft.description.trim();
    const price = Number(draft.price);
    const hasVariants = Boolean(selectedProduct.ProductVariant?.length);
    const stockQuantity = Number(draft.stockQuantity);

    if (!name) {
      setError("Product name is required.");
      return;
    }
    if (!description || htmlToPlainText(description).length === 0) {
      setError("Product description is required.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("Price must be a valid positive number.");
      return;
    }
    if (!draft.categoryId) {
      setError("Please select a category.");
      return;
    }
    if (
      !hasVariants &&
      (!Number.isFinite(stockQuantity) || stockQuantity < 0)
    ) {
      setError("Stock quantity must be a valid positive number.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", String(price));
      formData.append("categoryId", draft.categoryId);

      if (!hasVariants) {
        formData.append("stockQuantity", String(stockQuantity));
      }

      draft.images.forEach((file) => {
        formData.append("images", file);
      });

      await apiJson(
        `/products/${selectedProduct.id}`,
        {
          method: "PUT",
          body: formData,
        },
        "/seller",
      );

      if (hasVariants && variantDrafts.length > 0) {
        await Promise.all(
          variantDrafts.map((variant) =>
            apiJson(
              `/variants/${variant.backendId}`,
              {
                method: "PUT",
                body: JSON.stringify({
                  quantity: Number(variant.quantity || 0),
                }),
              },
              "/seller",
            ),
          ),
        );
      }

      await fetchProducts();
      setEditOpen(false);
      setDetailOpen(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE),
  );
  const activeStatus = selectedProduct
    ? normalizeStockStatus(selectedProduct.stockQuantity)
    : "OUT_STOCK";
  const selectedSeller = selectedProduct?.Seller?.User;

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-amber-100 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                Seller products
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  My Products
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Manage your own catalog, review product detail, and update
                  product information without touching the admin workflow.
                </p>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Total
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {stats.total}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
              Active
            </p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">
              {stats.active}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
              Low stock
            </p>
            <p className="mt-2 text-3xl font-semibold text-amber-700">
              {stats.lowStock}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-rose-100 bg-rose-50 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <p className="text-xs uppercase tracking-[0.2em] text-rose-400">
              Out stock
            </p>
            <p className="mt-2 text-3xl font-semibold text-rose-700">
              {stats.outStock}
            </p>
          </article>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-200 px-5 pt-4">
            <div className="mt-4 flex flex-wrap gap-2 pb-5">
              {(
                ["ALL", "ACTIVE", "LOW_STOCK", "OUT_STOCK"] as FilterStatus[]
              ).map((status) => {
                const active = statusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-amber-600 text-white shadow-[0_10px_24px_rgba(245,158,11,0.18)]"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {status === "ALL" ? "All" : getStatusMeta(status).label}
                  </button>
                );
              })}

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none"
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
                onClick={() => void fetchProducts()}
                className="inline-flex ml-auto h-11 items-center justify-center rounded-2xl bg-amber-600 px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(245,158,11,0.18)] transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-5 pt-4">
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search product name, category, seller..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-100 lg:max-w-md"
            />
            <div className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {filteredProducts.length}
              </span>{" "}
              products
            </div>
          </div>

          <div className="px-5 pb-5 pt-5">
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
              <table className="w-full table-fixed divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                    <th className="w-[28%] px-4 py-3">Product</th>
                    <th className="w-[12%] px-4 py-3">Price</th>
                    <th className="w-[12%] px-4 py-3">Stock</th>
                    <th className="w-[10%] px-4 py-3">Variants</th>
                    <th className="w-[12%] px-4 py-3">Sold</th>
                    <th className="w-[12%] px-4 py-3">Status</th>
                    <th className="w-[14%] px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {pagedProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-slate-500"
                      >
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    pagedProducts.map((product) => {
                      const status = normalizeStockStatus(
                        product.stockQuantity,
                      );
                      const meta = getStatusMeta(status);
                      const categoryName =
                        categories.find(
                          (category) => category.id === product.categoryId,
                        )?.name ||
                        product.Category?.name ||
                        "-";

                      return (
                        <tr key={product.id} className="align-top">
                          <td className="px-4 py-4">
                            <div className="flex items-start gap-3">
                              <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                {product.images?.[0] ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="grid h-full w-full place-items-center text-[11px] text-slate-400">
                                    No image
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-900">
                                  {product.name}
                                </div>
                                <div className="truncate text-xs text-slate-500">
                                  {categoryName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-slate-900 align-middle">
                            {formatMoney(product.price)}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700 align-middle">
                            {Number(product.stockQuantity || 0).toLocaleString(
                              "vi-VN",
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700 align-middle">
                            {(
                              product.ProductVariant?.length || 0
                            ).toLocaleString("vi-VN")}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700 align-middle">
                            {(product.soldCount || 0).toLocaleString("vi-VN")}
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <div
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${meta.tone}`}
                            >
                              {meta.label}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => void openView(product)}
                                className="inline-flex h-10 items-center justify-center rounded-2xl border border-amber-200 bg-white px-3 text-sm font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-50"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => void openEdit(product)}
                                className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page >= totalPages}
                  className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {detailOpen && selectedProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.22)]">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
                    Seller products
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                    {selectedProduct.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Inspect images, pricing, seller assignment, and variants.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailOpen(false)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>

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
                      {Number(
                        selectedProduct.stockQuantity || 0,
                      ).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Status
                    </p>
                    <span
                      className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusMeta(activeStatus).tone}`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${getStatusMeta(activeStatus).chip}`}
                      />
                      {getStatusMeta(activeStatus).label}
                    </span>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    Description
                  </p>
                  <div className="mt-3 text-sm leading-7 text-slate-600">
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
                      {selectedSeller?.username || "N/A"}
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
                      {(selectedProduct.reviewCount ?? 0).toLocaleString(
                        "vi-VN",
                      )}
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
                  <p className="text-sm font-semibold text-slate-900">
                    Timeline
                  </p>
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
                  <p className="text-sm font-semibold text-slate-900">
                    Gallery
                  </p>
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
                  <p className="text-sm font-semibold text-slate-900">
                    Variants
                  </p>
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
                    onClick={() => {
                      setDraft({
                        name: selectedProduct.name || "",
                        description: selectedProduct.description || "",
                        price: String(selectedProduct.price ?? ""),
                        stockQuantity: String(
                          selectedProduct.stockQuantity ?? "",
                        ),
                        categoryId: selectedProduct.categoryId || "",
                        images: [],
                        previews: selectedProduct.images ?? [],
                      });
                      setVariantDrafts(
                        mapProductVariantsToDraft(
                          selectedProduct.ProductVariant,
                        ),
                      );
                      setDetailOpen(false);
                      setEditOpen(true);
                    }}
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Edit product
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editOpen && selectedProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.22)]">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
                    Edit product
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                    {selectedProduct.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Update core fields for your own product only.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-5 p-6 lg:border-r lg:border-slate-200">
                <div className="grid gap-4">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Name
                    </span>
                    <input
                      value={draft.name}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Price
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={draft.price}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          price: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Category
                    </span>
                    <select
                      value={draft.categoryId}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          categoryId: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {!selectedProduct.ProductVariant?.length ? (
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-slate-900">
                        Stock quantity
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={draft.stockQuantity}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            stockQuantity: event.target.value,
                          }))
                        }
                        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
                      />
                    </label>
                  ) : (
                    <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      This product has variants, so stock quantity is managed by
                      variant inventory.
                    </div>
                  )}

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Description
                    </span>
                    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
                      <TinyMCEEditor
                        value={draft.description}
                        onChange={(value) =>
                          setDraft((prev) => ({
                            ...prev,
                            description: value,
                          }))
                        }
                        placeholder="Write the product description in rich HTML..."
                      />
                    </div>
                  </label>

                  {selectedProduct.ProductVariant?.length ? (
                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Variant inventory
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Update quantity for each existing variant.
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
                          {variantDrafts.length} variants
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {variantDrafts.map((variant, index) => (
                          <div
                            key={variant.backendId}
                            className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div className="min-w-0 space-y-1">
                                <p className="text-sm font-semibold text-slate-900">
                                  Variant {index + 1}
                                </p>
                                <p className="text-sm text-slate-600">
                                  {formatVariantAttributes(
                                    variant.variantAttributes,
                                  )}
                                </p>
                              </div>

                              <label className="space-y-1 lg:w-40">
                                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  Quantity
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  value={variant.quantity}
                                  onChange={(event) =>
                                    setVariantDrafts((current) =>
                                      current.map((item) =>
                                        item.backendId === variant.backendId
                                          ? {
                                              ...item,
                                              quantity: event.target.value,
                                            }
                                          : item,
                                      ),
                                    )
                                  }
                                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
                                />
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-5 bg-slate-50 p-6">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Images</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Upload new images to replace the existing gallery.
                  </p>
                  <label className="mt-4 block cursor-pointer rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:bg-slate-100">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        handlePreviewImages(event.target.files);
                        event.currentTarget.value = "";
                      }}
                    />
                    <div className="text-sm font-semibold text-slate-700">
                      Choose images
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Click to upload product gallery images.
                    </p>
                  </label>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {draft.previews.length > 0 ? (
                      draft.previews.map((preview, index) => (
                        <div
                          key={`${preview}-${index}`}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                        >
                          <div className="aspect-square">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                        No new images selected.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">
                    Current preview
                  </p>
                  <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                    <div className="aspect-[16/10] bg-slate-100">
                      {selectedProduct.images?.[0] ? (
                        <img
                          src={selectedProduct.images[0]}
                          alt="Current preview"
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
                          {selectedProduct.ProductVariant?.length
                            ? "Variants on"
                            : "Simple stock"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {draft.price || "0"} VND
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-wrap justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveProduct()}
                    disabled={saving}
                    className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
