"use client";

import { useEffect, useMemo, useState } from "react";

type CategoryRecord = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
};

type CategoryListResponse = {
  categories: CategoryRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type CategoryStatsResponse = {
  total: number;
  topCategories: Array<{
    id: string;
    name: string;
    productCount: number;
  }>;
  allCategories: Array<{
    id: string;
    name: string;
    productCount: number;
  }>;
};

type ProductRecord = {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  images?: string[] | null;
  createdAt: string;
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

type ModalMode = "view" | "edit" | "add" | null;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

const defaultPagination = {
  page: 1,
  limit: 8,
  total: 0,
  totalPages: 0,
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (response.status === 401) {
    window.location.assign(`/login?next=${encodeURIComponent("/categories")}`);
    throw new Error("Unauthorized");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || `Request failed with ${response.status}`);
  }

  return payload.data as T;
}

function statCard({
  title,
  value,
  note,
  tone,
}: {
  title: string;
  value: string | number;
  note: string;
  tone: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
          Live
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{note}</p>
    </article>
  );
}

function initialFormState() {
  return {
    name: "",
    description: "",
    image: null as File | null,
    preview: "",
  };
}

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [stats, setStats] = useState<CategoryStatsResponse>({
    total: 0,
    topCategories: [],
    allCategories: [],
  });
  const [pagination, setPagination] = useState(defaultPagination);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryRecord | null>(null);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState(initialFormState());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const topCategoryMap = useMemo(() => {
    return new Map(stats.topCategories.map((item, index) => [item.id, { ...item, rank: index + 1 }]));
  }, [stats.topCategories]);

  const fetchCategories = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(defaultPagination.limit));
      if (query.trim()) {
        params.set("search", query.trim());
      }

      const [categoryData, statsData] = await Promise.all([
        apiJson<CategoryListResponse>(`/categories?${params.toString()}`),
        apiJson<CategoryStatsResponse>("/categories/stats"),
      ]);

      setCategories(categoryData.categories ?? []);
      setPagination(categoryData.pagination ?? defaultPagination);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCategories(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const openAdd = () => {
    setSelectedCategory(null);
    setFormState(initialFormState());
    setModalMode("add");
  };

  const openEdit = (category: CategoryRecord) => {
    setSelectedCategory(category);
    setFormState({
      name: category.name ?? "",
      description: category.description ?? "",
      image: null,
      preview: category.image ?? "",
    });
    setModalMode("edit");
  };

  const openView = async (category: CategoryRecord) => {
    setSelectedCategory(category);
    setModalMode("view");
    setProducts([]);
    setProductsLoading(true);

    try {
      const response = await apiJson<ProductsResponse>(
        `/products?categoryId=${encodeURIComponent(category.id)}&page=1&limit=20`,
      );
      setProducts(response.products ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load category products.");
    } finally {
      setProductsLoading(false);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedCategory(null);
    setProducts([]);
    setProductsLoading(false);
    setSaving(false);
  };

  const submitCategory = async () => {
    setSaving(true);
    setError(null);

    try {
      if (!formState.name.trim()) {
        throw new Error("Category name is required.");
      }

      const formData = new FormData();
      formData.append("name", formState.name.trim());
      formData.append("description", formState.description.trim());
      if (formState.image) {
        formData.append("image", formState.image);
      }

      if (modalMode === "add") {
        await apiJson("/categories", {
          method: "POST",
          body: formData,
        });
      }

      if (modalMode === "edit" && selectedCategory) {
        await apiJson(`/categories/${selectedCategory.id}`, {
          method: "PUT",
          body: formData,
        });
      }

      closeModal();
      await fetchCategories(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    const confirmed = window.confirm(
      "Delete this category? Categories that still contain products cannot be removed.",
    );
    if (!confirmed) return;

    setSaving(true);
    setError(null);

    try {
      await apiJson(`/categories/${id}`, { method: "DELETE" });
      await fetchCategories(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category.");
    } finally {
      setSaving(false);
      setConfirmDeleteId(null);
    }
  };

  const topHighlight = stats.topCategories[0];
  const topCategoryCount = topHighlight?.productCount ?? 0;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
        <div className="px-6 py-6 xl:px-8 xl:py-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-[#008ECC] ring-1 ring-sky-200">
              Category management
            </span>
            <span className="text-sm text-slate-500">
              Manage catalog structure and product grouping
            </span>
          </div>

          <div className="mt-4 max-w-3xl space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Organize product categories with a cleaner, more visual admin workflow.
            </h2>
            <p className="text-base leading-7 text-slate-600">
              This screen keeps the old category management idea, but redesigns it with better
              spacing, clearer emphasis on product counts, and a dedicated detail view for the
              products inside each category.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCard({
          title: "Total categories",
          value: stats.total.toLocaleString("vi-VN"),
          note: "All catalog groups in the system",
          tone: "bg-slate-100 text-slate-600 ring-slate-200",
        })}
        {statCard({
          title: "Top category",
          value: topHighlight ? topHighlight.name : "N/A",
          note: `${topCategoryCount.toLocaleString("vi-VN")} products in the leading category`,
          tone: "bg-sky-50 text-sky-700 ring-sky-200",
        })}
        {statCard({
          title: "Tracked categories",
          value: stats.topCategories.length.toLocaleString("vi-VN"),
          note: "Categories currently ranked by product volume",
          tone: "bg-amber-50 text-amber-700 ring-amber-200",
        })}
        {statCard({
          title: "Filtered view",
          value: pagination.total.toLocaleString("vi-VN"),
          note: "Matches the current search query",
          tone: "bg-rose-50 text-rose-700 ring-rose-200",
        })}
      </section>

      <section className="space-y-6">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
              onSubmit={(event) => {
                event.preventDefault();
                setQuery(search);
              }}
            >
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by category name"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 sm:w-80"
              />
              <button
                type="submit"
                className="h-11 rounded-2xl bg-[#008ECC] px-4 text-sm font-semibold text-white transition hover:bg-[#0075aa]"
              >
                Search
              </button>
            </form>

            <button
              type="button"
              onClick={openAdd}
              className="h-11 rounded-2xl border border-slate-900 bg-slate-900 px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
            >
              Add category
            </button>
          </div>

          {error ? (
            <div className="mt-5 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5">
            <table className="w-full table-fixed border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="w-[25%] px-4 py-2 font-medium">Category</th>
                  <th className="w-[25%] px-4 py-2 font-medium">Description</th>
                  <th className="w-[16%] px-4 py-2 font-medium">Created</th>
                  <th className="w-[16%] px-4 py-2 font-medium">Rank</th>
                  <th className="w-[18%] px-4 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">
                      Loading categories...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">
                      No categories found for the current search.
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => {
                    const rankInfo = topCategoryMap.get(category.id);

                    return (
                      <tr key={category.id} className="rounded-[1.25rem] bg-slate-50/80">
                        <td className="rounded-l-[1.25rem] px-4 py-4 align-top">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                              {category.image ? (
                                <img
                                  src={category.image}
                                  alt={category.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-semibold text-slate-400">No img</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-950">{category.name}</p>
                              <p className="mt-1 text-xs text-slate-500">ID: {category.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-slate-600">
                          <p className="break-words">{category.description || "No description"}</p>
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-slate-500">
                          <span className="block break-words">{formatDate(category.createdAt)}</span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          {rankInfo ? (
                            <span className="inline-flex max-w-full rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
                              Top #{rankInfo.rank} - {rankInfo.productCount} products
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                              Not ranked
                            </span>
                          )}
                        </td>
                        <td className="rounded-r-[1.25rem] px-4 py-4 align-top">
                          <div className="flex justify-end gap-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => void openView(category)}
                              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(category)}
                              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(category.id)}
                              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
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
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{categories.length}</span> of{" "}
              <span className="font-medium text-slate-900">{pagination.total}</span> categories
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => void fetchCategories(Math.max(1, pagination.page - 1))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => void fetchCategories(pagination.page + 1)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </article>

      </section>

      {modalMode ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <div className="w-full max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#008ECC]">
                  {modalMode === "add" ? "Add category" : modalMode === "edit" ? "Edit category" : "Category detail"}
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-950">
                  {modalMode === "add"
                    ? "Create a new category"
                    : modalMode === "edit"
                      ? "Update category information"
                      : selectedCategory?.name ?? "Category"}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-6">
              {modalMode === "view" && selectedCategory ? (
                <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                      {selectedCategory.image ? (
                        <img
                          src={selectedCategory.image}
                          alt={selectedCategory.name}
                          className="h-64 w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-64 place-items-center text-sm text-slate-400">
                          No image available
                        </div>
                      )}
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Description</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {selectedCategory.description || "No description provided."}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1.25rem] border border-slate-200 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Created</p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {formatDate(selectedCategory.createdAt)}
                        </p>
                      </div>
                      <div className="rounded-[1.25rem] border border-slate-200 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Updated</p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {formatDate(selectedCategory.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#008ECC]">Products in category</p>
                        <h4 className="mt-1 text-lg font-semibold text-slate-950">
                          {products.length} items loaded
                        </h4>
                      </div>
                    </div>

                    <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                      {productsLoading ? (
                        <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                          Loading products...
                        </div>
                      ) : products.length > 0 ? (
                        products.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-white p-3"
                          >
                            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-100">
                              {product.images?.[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-xs text-slate-400">No img</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-950">
                                {product.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatMoney(product.price)} • Stock {product.stockQuantity}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                          No products found in this category.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Category name</span>
                    <input
                      value={formState.name}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, name: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
                      placeholder="e.g. Electronics"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setFormState((current) => ({
                          ...current,
                          image: file,
                          preview: file ? URL.createObjectURL(file) : current.preview,
                        }));
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
                    />
                  </label>

                  <div className="sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Preview</span>
                    <div className="flex items-center gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-4">
                      <div className="h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        {formState.preview ? (
                          <img
                            src={formState.preview}
                            alt="preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-xs text-slate-400">
                            No image
                          </div>
                        )}
                      </div>
                      <p className="text-sm leading-6 text-slate-600">
                        Upload a category image to make the catalog more visual and easier to scan.
                      </p>
                    </div>
                  </div>

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
                    <textarea
                      value={formState.description}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, description: event.target.value }))
                      }
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
                      placeholder="Short description..."
                    />
                  </label>
                </div>
              )}
            </div>

            {modalMode !== "view" ? (
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void submitCategory()}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : modalMode === "add" ? "Create category" : "Save changes"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {confirmDeleteId ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.18)]">
            <p className="text-sm font-semibold text-[#008ECC]">Confirm deletion</p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-950">Delete this category?</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              If products are still attached to this category, the backend will reject the delete
              request.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void deleteCategory(confirmDeleteId)}
                className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(244,63,94,0.22)] transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Deleting..." : "Delete category"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
