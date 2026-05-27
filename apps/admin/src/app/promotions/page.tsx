"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  apiJson,
  formatDateTime,
  fromDateTimeLocal,
  toDateTimeLocal,
} from "../../lib/admin-api";

type PromotionStatus = "ACTIVE" | "UPCOMING" | "EXPIRED" | "INACTIVE";
type ScopeType = "ALL" | "CATEGORY" | "PRODUCT";
type ViewMode = "view" | "edit" | "add" | null;

type PromotionRecord = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  startDate: string;
  endDate: string;
  status: PromotionStatus | string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
};

type PromotionDetail = PromotionRecord & {
  appliedProducts?: Array<{
    id: string;
    name: string;
    images?: string[] | null;
  }>;
  appliedCategories?: Array<{
    id: string;
    name: string;
    image?: string | null;
  }>;
  Coupon?:
    | {
        id: string;
        code: string;
        discountPercentage: number;
        maxUsage: number;
        usageCount: number;
      }
    | Array<{
        id: string;
        code: string;
        discountPercentage: number;
        maxUsage: number;
        usageCount: number;
      }>
    | null;
  Admin?: {
    id: string;
    User?: {
      id: string;
      username?: string | null;
      email?: string | null;
    } | null;
  } | null;
};

type PromotionListResponse = {
  promotions: PromotionRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type PromotionStats = {
  total: number;
  active: number;
  upcoming: number;
  expired: number;
  inactive: number;
};

type CatalogItem = {
  id: string;
  name: string;
  image?: string | null;
  images?: string[] | null;
  description?: string | null;
};

type DraftState = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  scopeType: ScopeType;
  categoryIds: string[];
  productIds: string[];
  image: File | null;
  preview: string;
};

const PAGE_SIZE = 8;

const emptyStats: PromotionStats = {
  total: 0,
  active: 0,
  upcoming: 0,
  expired: 0,
  inactive: 0,
};

const statusMeta: Record<
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

const scopeMeta: Record<ScopeType, { label: string; hint: string }> = {
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

function initialDraft(): DraftState {
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

function normalizeStatus(value: string | undefined | null): PromotionStatus {
  const status = (value || "INACTIVE").toUpperCase();
  if (status === "ACTIVE") return "ACTIVE";
  if (status === "UPCOMING") return "UPCOMING";
  if (status === "EXPIRED") return "EXPIRED";
  return "INACTIVE";
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
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          {title}
        </p>

        <div className={`h-3 w-3 rounded-full ${accent}`} />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-sm text-slate-500">{note}</p>
        </div>
      </div>
    </article>
  );
}

function getPromotionScope(
  detail: PromotionDetail,
  catalogCategoryCount: number,
) {
  const productCount = detail.appliedProducts?.length ?? 0;
  const categoryCount = detail.appliedCategories?.length ?? 0;

  if (productCount > 0) {
    return {
      type: "PRODUCT" as ScopeType,
      label: `${scopeMeta.PRODUCT.label} (${productCount})`,
      products: detail.appliedProducts ?? [],
      categories: [],
    };
  }

  if (categoryCount > 0) {
    const isEntireStore =
      catalogCategoryCount > 0 && categoryCount >= catalogCategoryCount;
    return {
      type: "CATEGORY" as ScopeType,
      label: isEntireStore
        ? scopeMeta.ALL.label
        : `${scopeMeta.CATEGORY.label} (${categoryCount})`,
      products: [],
      categories: detail.appliedCategories ?? [],
    };
  }

  return {
    type: "ALL" as ScopeType,
    label: scopeMeta.ALL.label,
    products: [],
    categories: [],
  };
}

function getLinkedCoupon(detail: PromotionDetail) {
  const coupon = detail.Coupon;
  if (!coupon) return null;
  return Array.isArray(coupon) ? (coupon[0] ?? null) : coupon;
}

function getCreatedByLabel(detail: PromotionDetail) {
  const admin = detail.Admin;
  if (!admin) return detail.createdBy || "Administrator";

  const resolvedAdmin = Array.isArray(admin) ? (admin[0] ?? null) : admin;
  const username = resolvedAdmin?.User?.username?.trim();
  if (username) return username;

  const email = resolvedAdmin?.User?.email?.trim();
  if (email) return email;

  return detail.createdBy || resolvedAdmin?.id || "Administrator";
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
                Promotions
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

export default function PromotionsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [stats, setStats] = useState<PromotionStats>(emptyStats);
  const [categories, setCategories] = useState<CatalogItem[]>([]);
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PromotionStatus>(
    "ALL",
  );
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>(null);
  const [selectedPromotion, setSelectedPromotion] =
    useState<PromotionDetail | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(initialDraft());
  const [resourceSearch, setResourceSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PromotionRecord | null>(
    null,
  );
  const [promotionDetails, setPromotionDetails] = useState<
    Record<string, PromotionDetail>
  >({});

  const activeCount = stats.active;
  const upcomingCount = stats.upcoming;
  const expiredCount = stats.expired;
  const inactiveCount = stats.inactive;

  const fetchResources = async () => {
    try {
      const [categoriesData, productsData] = await Promise.all([
        apiJson<{ categories: CatalogItem[] }>(
          "/categories?page=1&limit=1000",
          undefined,
          "/promotions",
        ),
        apiJson<{ products: CatalogItem[] }>(
          "/products?page=1&limit=1000",
          undefined,
          "/promotions",
        ),
      ]);

      setCategories(categoriesData.categories ?? []);
      setProducts(productsData.products ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load catalog resources";
      setError(message);
    }
  };

  const fetchPromotions = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, statSummary] = await Promise.all([
        apiJson<PromotionListResponse>(
          `/promotions?page=1&limit=1000&search=${encodeURIComponent(searchQuery)}`,
          undefined,
          "/promotions",
        ),
        apiJson<PromotionStats>("/promotions/stats", undefined, "/promotions"),
      ]);

      setPromotions(list.promotions ?? []);
      setStats(statSummary ?? emptyStats);
      setPage(1);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return;
      const message =
        err instanceof Error ? err.message : "Failed to load promotions";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const filteredPromotions = useMemo(() => {
    const query = searchInput.trim().toLowerCase();

    return promotions.filter((promotion) => {
      const status = normalizeStatus(promotion.status);
      if (statusFilter !== "ALL" && status !== statusFilter) return false;

      if (!query) return true;

      const haystack = [promotion.name, promotion.description, promotion.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [promotions, searchInput, statusFilter]);

  const pagedPromotions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPromotions.slice(start, start + PAGE_SIZE);
  }, [filteredPromotions, page]);

  useEffect(() => {
    const loadVisibleDetails = async () => {
      const missing = pagedPromotions.filter(
        (item) => !promotionDetails[item.id],
      );
      if (missing.length === 0) return;

      try {
        const details = await Promise.all(
          missing.map((item) =>
            apiJson<PromotionDetail>(
              `/promotions/${item.id}`,
              undefined,
              "/promotions",
            ),
          ),
        );

        setPromotionDetails((current) => {
          const next = { ...current };
          details.forEach((detail) => {
            next[detail.id] = detail;
          });
          return next;
        });
      } catch {
        // Keep table usable even if one detail request fails.
      }
    };

    loadVisibleDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagedPromotions]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setSelectedPromotion(null);
    setResourceSearch("");
    setDraft(initialDraft());
    setViewMode("add");
  };

  const openEditModal = async (promotion: PromotionRecord) => {
    setSaving(false);
    setError(null);
    setEditingId(promotion.id);
    setViewMode("edit");
    setResourceSearch("");

    try {
      const detail = await apiJson<PromotionDetail>(
        `/promotions/${promotion.id}`,
        undefined,
        "/promotions",
      );

      const scope = getPromotionScope(detail, categories.length);

      setSelectedPromotion(detail);
      setDraft({
        name: detail.name || "",
        description: detail.description || "",
        startDate: toDateTimeLocal(detail.startDate),
        endDate: toDateTimeLocal(detail.endDate),
        scopeType: scope.type,
        categoryIds: scope.categories.map((item) => item.id),
        productIds: scope.products.map((item) => item.id),
        image: null,
        preview: detail.image || "",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load promotion";
      setError(message);
    }
  };

  const openViewModal = async (promotion: PromotionRecord) => {
    setError(null);
    try {
      const detail = await apiJson<PromotionDetail>(
        `/promotions/${promotion.id}`,
        undefined,
        "/promotions",
      );
      setSelectedPromotion(detail);
      setEditingId(null);
      setDraft(initialDraft());
      setViewMode("view");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load promotion";
      setError(message);
    }
  };

  const closeModal = () => {
    setViewMode(null);
    setSelectedPromotion(null);
    setEditingId(null);
    setDraft(initialDraft());
    setResourceSearch("");
  };

  const submitPromotion = async () => {
    const name = draft.name.trim();
    const description = draft.description.trim();

    if (!name) {
      setError("Promotion name is required.");
      return;
    }

    if (!draft.startDate || !draft.endDate) {
      setError("Start date and end date are required.");
      return;
    }

    if (new Date(draft.startDate) >= new Date(draft.endDate)) {
      setError("End date must be after start date.");
      return;
    }

    const applyIds =
      draft.scopeType === "PRODUCT"
        ? draft.productIds
        : draft.scopeType === "CATEGORY"
          ? draft.categoryIds
          : categories.map((item) => item.id);

    if (draft.scopeType === "ALL" && categories.length === 0) {
      setError("No categories available to attach a store-wide promotion.");
      return;
    }

    if (draft.scopeType !== "ALL" && applyIds.length === 0) {
      setError(
        draft.scopeType === "PRODUCT"
          ? "Select at least one product for this promotion."
          : "Select at least one category for this promotion.",
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("startDate", fromDateTimeLocal(draft.startDate));
      formData.append("endDate", fromDateTimeLocal(draft.endDate));
      if (draft.image) {
        formData.append("image", draft.image);
      }

      const saved = editingId
        ? await apiJson<PromotionDetail>(
            `/promotions/${editingId}`,
            {
              method: "PUT",
              body: formData,
            },
            "/promotions",
          )
        : await apiJson<PromotionDetail>(
            "/promotions",
            {
              method: "POST",
              body: formData,
            },
            "/promotions",
          );

      const promotionId = saved.id || editingId;
      if (!promotionId) {
        throw new Error("Promotion was saved but no id was returned.");
      }

      if (draft.scopeType === "PRODUCT") {
        await apiJson(
          `/promotions/${promotionId}/apply`,
          {
            method: "POST",
            body: JSON.stringify({ productIds: applyIds }),
          },
          "/promotions",
        );
      } else {
        await apiJson(
          `/promotions/${promotionId}/apply-categories`,
          {
            method: "POST",
            body: JSON.stringify({ categoryIds: applyIds }),
          },
          "/promotions",
        );
      }

      await fetchPromotions();
      closeModal();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save promotion";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (
    promotion: PromotionRecord,
    nextStatus: PromotionStatus,
  ) => {
    setSaving(true);
    setError(null);
    try {
      await apiJson(
        `/promotions/${promotion.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        },
        "/promotions",
      );
      await fetchPromotions();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update status";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const deletePromotion = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    setError(null);

    try {
      await apiJson(
        `/promotions/${confirmDelete.id}`,
        {
          method: "DELETE",
        },
        "/promotions",
      );
      setConfirmDelete(null);
      await fetchPromotions();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete promotion";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const selectedScopeInfo = useMemo(() => {
    if (!selectedPromotion) return null;
    return getPromotionScope(selectedPromotion, categories.length);
  }, [categories.length, selectedPromotion]);

  const filteredResourceItems = useMemo(() => {
    const query = resourceSearch.trim().toLowerCase();
    if (draft.scopeType === "PRODUCT") {
      return products.filter((item) => {
        if (!query) return true;
        return `${item.name} ${item.description ?? ""}`
          .toLowerCase()
          .includes(query);
      });
    }

    if (draft.scopeType === "CATEGORY") {
      return categories.filter((item) => {
        if (!query) return true;
        return `${item.name} ${item.description ?? ""}`
          .toLowerCase()
          .includes(query);
      });
    }

    return [];
  }, [categories, draft.scopeType, products, resourceSearch]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPromotions.length / PAGE_SIZE),
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
              Campaign center
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Promotions
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Manage store-wide campaigns, category offers, and product-specific
              promotions with clear date ranges, scope control, and real backend
              data.
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statCard({
          title: "Total promotions",
          value: stats.total,
          note: "All campaigns tracked in the system",
          accent: "bg-[#008ECC]",
        })}
        {statCard({
          title: "Active",
          value: activeCount,
          note: "Currently visible to customers",
          accent: "bg-emerald-500",
        })}
        {statCard({
          title: "Upcoming",
          value: upcomingCount,
          note: "Scheduled for the future",
          accent: "bg-amber-500",
        })}
        {statCard({
          title: "Expired",
          value: expiredCount,
          note: "Past their end date",
          accent: "bg-rose-500",
        })}
        {statCard({
          title: "Inactive",
          value: inactiveCount,
          note: "Paused by admin",
          accent: "bg-slate-500",
        })}
      </section>

      <section className="space-y-6">
        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Promotion list
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Search, filter, and manage campaign records.
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
                    placeholder="Name or description"
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
                    setStatusFilter("ALL");
                    setPage(1);
                  }}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(
                ["ALL", "ACTIVE", "UPCOMING", "EXPIRED", "INACTIVE"] as const
              ).map((status) => {
                const active = statusFilter === status;
                const label =
                  status === "ALL" ? "All" : statusMeta[status].label;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setStatusFilter(status);
                      setPage(1);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-slate-950 text-white shadow-[0_10px_22px_rgba(15,23,42,0.16)]"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}

              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchPromotions}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={openAddModal}
                  className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
                >
                  Create promotion
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <table className="w-full table-fixed divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-[34%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Promotion
                  </th>
                  <th className="w-[20%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Period
                  </th>
                  <th className="w-[10%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Scope
                  </th>
                  <th className="w-[10%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Status
                  </th>
                  <th className="w-[26%] px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-16 text-center text-sm text-slate-500"
                    >
                      Loading promotions...
                    </td>
                  </tr>
                ) : pagedPromotions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <p className="text-sm font-medium text-slate-900">
                        No promotions found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try another filter or create a new campaign.
                      </p>
                    </td>
                  </tr>
                ) : (
                  pagedPromotions.map((promotion) => {
                    const status = normalizeStatus(promotion.status);
                    const detail = promotionDetails[promotion.id];
                    const scope = detail
                      ? getPromotionScope(detail, categories.length).label
                      : "Loading scope...";

                    return (
                      <tr key={promotion.id} className="align-top">
                        <td className="px-5 py-5 align-top">
                          <div className="flex items-start gap-4">
                            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                              {promotion.image ? (
                                <img
                                  src={promotion.image}
                                  alt={promotion.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="grid h-full w-full place-items-center text-xs font-semibold text-slate-400">
                                  No banner
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-950">
                                {promotion.name}
                              </p>
                              <p className="mt-1 line-clamp-2 max-w-[26rem] text-sm leading-6 text-slate-500">
                                {promotion.description ||
                                  "No description provided."}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-5 align-top text-sm text-slate-600">
                          <div className="space-y-1">
                            <p>{formatDateTime(promotion.startDate)}</p>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                              to
                            </p>
                            <p>{formatDateTime(promotion.endDate)}</p>
                          </div>
                        </td>
                        <td className="px-5 py-5 align-top text-sm text-slate-600">
                          {scope}
                        </td>
                        <td className="px-5 py-5 align-top">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                              statusMeta[status].tone
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${statusMeta[status].chip}`}
                            />
                            {statusMeta[status].label}
                          </span>
                        </td>
                        <td className="px-5 py-5 align-top">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openViewModal(promotion)}
                              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(promotion)}
                              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            {status === "ACTIVE" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  toggleStatus(promotion, "INACTIVE")
                                }
                                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                              >
                                Pause
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  toggleStatus(promotion, "ACTIVE")
                                }
                                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                              >
                                Activate
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(promotion)}
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
                {Math.min(page * PAGE_SIZE, filteredPromotions.length)} of{" "}
                {filteredPromotions.length}
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
          </div>
        </div>
      </section>

      <ModalShell
        open={viewMode === "add" || viewMode === "edit"}
        title={viewMode === "add" ? "Create promotion" : "Edit promotion"}
        subtitle="Configure timing, scope, and campaign banner."
        onClose={closeModal}
        widthClass="max-w-6xl"
      >
        <div className="grid gap-0 lg:grid-cols-[1fr_0.92fr]">
          <div className="space-y-5 p-6 lg:border-r lg:border-slate-200">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Promotion name
                </span>
                <input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Summer Flash Sale"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Description
                </span>
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Describe the campaign and what it highlights."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Start date
                </span>
                <input
                  type="datetime-local"
                  value={draft.startDate}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  End date
                </span>
                <input
                  type="datetime-local"
                  value={draft.endDate}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </label>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Scope</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {scopeMeta[draft.scopeType].hint}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {(["ALL", "CATEGORY", "PRODUCT"] as ScopeType[]).map(
                  (scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          scopeType: scope,
                        }))
                      }
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        draft.scopeType === scope
                          ? "border-[#008ECC] bg-white shadow-[0_10px_24px_rgba(0,142,204,0.10)]"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {scopeMeta[scope].label}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {scopeMeta[scope].hint}
                      </p>
                    </button>
                  ),
                )}
              </div>
            </div>

            {draft.scopeType !== "ALL" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {draft.scopeType === "PRODUCT"
                        ? "Select products"
                        : "Select categories"}
                    </p>
                    <p className="text-sm text-slate-500">
                      Use search to find targets faster.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {(draft.scopeType === "PRODUCT"
                      ? draft.productIds.length
                      : draft.categoryIds.length) || 0}{" "}
                    selected
                  </span>
                </div>

                <label className="flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-600">
                  <span className="text-slate-400">Search</span>
                  <input
                    value={resourceSearch}
                    onChange={(event) => setResourceSearch(event.target.value)}
                    placeholder="Type to filter"
                    className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </label>

                <div className="max-h-64 space-y-2 overflow-y-auto rounded-[1.5rem] border border-slate-200 bg-white p-3">
                  {filteredResourceItems.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No items match your search.
                    </div>
                  ) : (
                    filteredResourceItems.map((item) => {
                      const isProduct = draft.scopeType === "PRODUCT";
                      const selected = isProduct
                        ? draft.productIds.includes(item.id)
                        : draft.categoryIds.includes(item.id);

                      return (
                        <label
                          key={item.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                            selected
                              ? "border-[#008ECC] bg-sky-50/70"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              if (isProduct) {
                                setDraft((current) => ({
                                  ...current,
                                  productIds: checked
                                    ? [...current.productIds, item.id]
                                    : current.productIds.filter(
                                        (value) => value !== item.id,
                                      ),
                                }));
                                return;
                              }

                              setDraft((current) => ({
                                ...current,
                                categoryIds: checked
                                  ? [...current.categoryIds, item.id]
                                  : current.categoryIds.filter(
                                      (value) => value !== item.id,
                                    ),
                              }));
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-[#008ECC] focus:ring-[#008ECC]"
                          />

                          {isProduct ? (
                            <div className="h-11 w-11 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                              {item.images?.[0] ? (
                                <img
                                  src={item.images[0]}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="grid h-full w-full place-items-center text-xs text-slate-400">
                                  P
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-500">
                              C
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {item.name}
                            </p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                {scopeMeta.ALL.hint}
              </div>
            )}
          </div>

          <div className="space-y-5 bg-slate-50 p-6">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Banner image
              </p>
              <p className="mt-1 text-sm text-slate-500">
                A hero image helps the promotion feel more premium.
              </p>

              <label className="mt-4 block cursor-pointer rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:bg-slate-100">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (!file) {
                      setDraft((current) => ({
                        ...current,
                        image: null,
                        preview: current.preview,
                      }));
                      return;
                    }

                    setDraft((current) => ({
                      ...current,
                      image: file,
                      preview: URL.createObjectURL(file),
                    }));
                  }}
                />
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white text-xs font-semibold text-slate-500 shadow-sm">
                    {draft.preview ? (
                      <img
                        src={draft.preview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "Upload"
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {draft.preview ? "Change banner" : "Choose image"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      PNG, JPG, or WebP. Use something high contrast for a
                      better campaign card.
                    </p>
                  </div>
                </div>
              </label>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Live preview
              </p>
              <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                <div className="aspect-[16/9] bg-slate-100">
                  {draft.preview ? (
                    <img
                      src={draft.preview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-sm text-slate-400">
                      Banner preview
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-sm font-semibold text-slate-950">
                    {draft.name || "Promotion title"}
                  </p>
                  <p className="line-clamp-3 text-sm leading-6 text-slate-500">
                    {draft.description ||
                      "Write a short description to introduce the campaign."}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                      {scopeMeta[draft.scopeType].label}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {draft.startDate || "Start time"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {draft.endDate || "End time"}
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
                onClick={submitPromotion}
                disabled={saving}
                className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : viewMode === "add"
                    ? "Create promotion"
                    : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={viewMode === "view" && Boolean(selectedPromotion)}
        title={selectedPromotion?.name ?? "Promotion detail"}
        subtitle="Inspect the real campaign data and applied scope."
        onClose={closeModal}
        widthClass="max-w-6xl"
      >
        {selectedPromotion ? (
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5 p-6 lg:border-r lg:border-slate-200">
              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100">
                <div className="aspect-[16/9]">
                  {selectedPromotion.image ? (
                    <img
                      src={selectedPromotion.image}
                      alt={selectedPromotion.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-sm text-slate-400">
                      No banner available
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Status
                  </p>
                  <span
                    className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                      statusMeta[normalizeStatus(selectedPromotion.status)].tone
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        statusMeta[normalizeStatus(selectedPromotion.status)]
                          .chip
                      }`}
                    />
                    {
                      statusMeta[normalizeStatus(selectedPromotion.status)]
                        .label
                    }
                  </span>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Scope
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    {selectedScopeInfo?.label ?? scopeMeta.ALL.label}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Start date
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {formatDateTime(selectedPromotion.startDate)}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    End date
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {formatDateTime(selectedPromotion.endDate)}
                  </p>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">
                  Description
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {selectedPromotion.description || "No description provided."}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Created by
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {getCreatedByLabel(selectedPromotion)}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Linked coupon
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {getLinkedCoupon(selectedPromotion)?.code ||
                      "No coupon linked"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 bg-slate-50 p-6">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">
                  Applied products
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(selectedPromotion.appliedProducts ?? []).length > 0 ? (
                    selectedPromotion.appliedProducts?.map((item) => (
                      <span
                        key={item.id}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {item.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">
                      No product-specific links.
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">
                  Applied categories
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(selectedPromotion.appliedCategories ?? []).length > 0 ? (
                    selectedPromotion.appliedCategories?.map((item) => (
                      <span
                        key={item.id}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {item.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">
                      No category links.
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">
                  Quick timeline
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <span>Created</span>
                    <span className="font-medium text-slate-900">
                      {formatDateTime(selectedPromotion.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <span>Updated</span>
                    <span className="font-medium text-slate-900">
                      {formatDateTime(selectedPromotion.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {getLinkedCoupon(selectedPromotion) ? (
                <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-sm">
                  <p className="text-sm font-semibold text-white/70">
                    Linked coupon
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {getLinkedCoupon(selectedPromotion)?.code}
                  </p>
                  <p className="mt-2 text-sm text-white/70">
                    {getLinkedCoupon(selectedPromotion)?.discountPercentage}%
                    off, usage {getLinkedCoupon(selectedPromotion)?.usageCount}/
                    {getLinkedCoupon(selectedPromotion)?.maxUsage}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </ModalShell>

      {confirmDelete ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.22)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
              Confirm deletion
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Delete promotion?
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will remove the promotion from the admin catalog. The
              campaign cannot be restored from here.
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
                onClick={deletePromotion}
                disabled={saving}
                className="h-11 rounded-2xl bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
