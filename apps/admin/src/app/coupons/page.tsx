"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { apiJson, formatDateTime, formatPercent } from "../../lib/admin-api";

type PromotionStatus = "ACTIVE" | "UPCOMING" | "EXPIRED" | "INACTIVE";

type PromotionOption = {
  id: string;
  name: string;
  status: PromotionStatus | string;
  startDate: string;
  endDate: string;
  description?: string | null;
};

type CouponRecord = {
  id: string;
  code: string;
  discountPercentage: number;
  maxUsage: number;
  usageCount: number;
  promotionId: string;
  Promotion?: PromotionOption | null;
};

type CouponListResponse = {
  coupons: CouponRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type CouponDraft = {
  code: string;
  promotionId: string;
  discountPercentage: string;
  maxUsage: string;
};

type ViewMode = "view" | "edit" | "add" | null;

type CouponStats = {
  total: number;
  active: number;
  upcoming: number;
  expired: number;
  inactive: number;
};

const PAGE_SIZE = 8;

const emptyStats: CouponStats = {
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

const promotionStatusLabels: Record<PromotionStatus, string> = {
  ACTIVE: "Active",
  UPCOMING: "Upcoming",
  EXPIRED: "Expired",
  INACTIVE: "Inactive",
};

function normalizeStatus(value: string | undefined | null): PromotionStatus {
  const status = (value || "INACTIVE").toUpperCase();
  if (status === "ACTIVE") return "ACTIVE";
  if (status === "UPCOMING") return "UPCOMING";
  if (status === "EXPIRED") return "EXPIRED";
  return "INACTIVE";
}

function initialDraft(): CouponDraft {
  return {
    code: "",
    promotionId: "",
    discountPercentage: "",
    maxUsage: "",
  };
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

function ModalShell({
  open,
  title,
  subtitle,
  onClose,
  children,
  widthClass = "max-w-4xl",
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
                Coupons
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

export default function CouponsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [promotions, setPromotions] = useState<PromotionOption[]>([]);
  const [stats, setStats] = useState<CouponStats>(emptyStats);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PromotionStatus>(
    "ALL",
  );
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponRecord | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CouponDraft>(initialDraft());
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CouponRecord | null>(null);

  const fetchPromotions = async () => {
    try {
      const response = await apiJson<{ promotions: PromotionOption[] }>(
        "/promotions?page=1&limit=1000",
        undefined,
        "/coupons",
      );
      setPromotions(response.promotions ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load promotions";
      setError(message);
    }
  };

  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiJson<CouponListResponse>(
        "/coupons?page=1&limit=1000",
        undefined,
        "/coupons",
      );
      const list = response.coupons ?? [];
      setCoupons(list);

      const summary: CouponStats = { ...emptyStats, total: list.length };
      list.forEach((coupon) => {
        const status = normalizeStatus(coupon.Promotion?.status);
        if (status === "ACTIVE") summary.active += 1;
        else if (status === "UPCOMING") summary.upcoming += 1;
        else if (status === "EXPIRED") summary.expired += 1;
        else summary.inactive += 1;
      });
      setStats(summary);
      setPage(1);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return;
      const message =
        err instanceof Error ? err.message : "Failed to load coupons";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
    fetchCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCoupons = useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    return coupons.filter((coupon) => {
      const status = normalizeStatus(coupon.Promotion?.status);
      if (statusFilter !== "ALL" && status !== statusFilter) return false;
      if (!query) return true;

      const haystack = [
        coupon.code,
        coupon.Promotion?.name,
        coupon.Promotion?.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [coupons, searchInput, statusFilter]);

  const pagedCoupons = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCoupons.slice(start, start + PAGE_SIZE);
  }, [filteredCoupons, page]);

  const totalPages = Math.max(1, Math.ceil(filteredCoupons.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setSelectedCoupon(null);
    setDraft(initialDraft());
    setViewMode("add");
  };

  const openEditModal = (coupon: CouponRecord) => {
    setEditingId(coupon.id);
    setSelectedCoupon(coupon);
    setDraft({
      code: coupon.code || "",
      promotionId: coupon.promotionId || "",
      discountPercentage: String(coupon.discountPercentage ?? ""),
      maxUsage: String(coupon.maxUsage ?? ""),
    });
    setViewMode("edit");
  };

  const openViewModal = (coupon: CouponRecord) => {
    setSelectedCoupon(coupon);
    setEditingId(null);
    setViewMode("view");
  };

  const closeModal = () => {
    setViewMode(null);
    setSelectedCoupon(null);
    setEditingId(null);
    setDraft(initialDraft());
  };

  const submitCoupon = async () => {
    const code = draft.code.trim().toUpperCase();
    const promotionId = draft.promotionId;
    const discountPercentage = Number(draft.discountPercentage);
    const maxUsage = Number(draft.maxUsage);

    if (!code) {
      setError("Coupon code is required.");
      return;
    }

    if (!promotionId) {
      setError("Please select a promotion.");
      return;
    }

    if (
      !Number.isFinite(discountPercentage) ||
      discountPercentage <= 0 ||
      discountPercentage > 100
    ) {
      setError("Discount percentage must be between 1 and 100.");
      return;
    }

    if (!Number.isFinite(maxUsage) || maxUsage < 1) {
      setError("Max usage must be at least 1.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        code,
        promotionId,
        discountPercentage,
        maxUsage,
      };

      if (editingId) {
        await apiJson(
          `/coupons/${editingId}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
          "/coupons",
        );
      } else {
        await apiJson(
          "/coupons",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
          "/coupons",
        );
      }

      await fetchCoupons();
      closeModal();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save coupon";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteCoupon = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    setError(null);

    try {
      await apiJson(
        `/coupons/${confirmDelete.id}`,
        {
          method: "DELETE",
        },
        "/coupons",
      );
      setConfirmDelete(null);
      await fetchCoupons();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete coupon";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
              Discount vault
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Coupons
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Manage code-based discounts linked to promotions, with usage
              limits and real-time availability.
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
          title: "Total coupons",
          value: stats.total,
          note: "All coupon codes in the catalog",
          accent: "bg-[#008ECC]",
        })}
        {statCard({
          title: "Active",
          value: stats.active,
          note: "Coupons linked to active promotions",
          accent: "bg-emerald-500",
        })}
        {statCard({
          title: "Upcoming",
          value: stats.upcoming,
          note: "Will unlock soon",
          accent: "bg-amber-500",
        })}
        {statCard({
          title: "Expired",
          value: stats.expired,
          note: "Promotion already ended",
          accent: "bg-rose-500",
        })}
        {statCard({
          title: "Inactive",
          value: stats.inactive,
          note: "Paused or hidden campaigns",
          accent: "bg-slate-500",
        })}
      </section>

      <section className="space-y-6">
        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Coupon list
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Search codes and filter by promotion status.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex h-11 min-w-[18rem] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600">
                  <span className="text-slate-400">Search</span>
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Code or promotion"
                    className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
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
                  status === "ALL" ? "All" : promotionStatusLabels[status];
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
                  onClick={fetchCoupons}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
                >
                  Create coupon
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <table className="w-full table-fixed divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-[14%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Code
                  </th>
                  <th className="w-[24%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Promotion
                  </th>
                  <th className="w-[12%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Discount
                  </th>
                  <th className="w-[20%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Usage
                  </th>
                  <th className="w-[10%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Status
                  </th>
                  <th className="w-[20%] px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center text-sm text-slate-500"
                    >
                      Loading coupons...
                    </td>
                  </tr>
                ) : pagedCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <p className="text-sm font-medium text-slate-900">
                        No coupons found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try another search or create a new discount code.
                      </p>
                    </td>
                  </tr>
                ) : (
                  pagedCoupons.map((coupon) => {
                    const status = normalizeStatus(coupon.Promotion?.status);
                    const progress =
                      coupon.maxUsage > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (coupon.usageCount / coupon.maxUsage) * 100,
                            ),
                          )
                        : 0;

                    return (
                      <tr key={coupon.id} className="align-top">
                        <td className="px-5 py-5 align-top">
                          <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white">
                            {coupon.code}
                          </span>
                        </td>
                        <td className="px-5 py-5 align-top text-sm text-slate-600">
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-950">
                              {coupon.Promotion?.name || "No promotion"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {coupon.Promotion
                                ? `${formatDateTime(coupon.Promotion.startDate)} - ${formatDateTime(
                                    coupon.Promotion.endDate,
                                  )}`
                                : "No linked promotion"}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-5 align-top">
                          <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
                            {formatPercent(coupon.discountPercentage)} OFF
                          </span>
                        </td>
                        <td className="px-5 py-5 align-top">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>{coupon.usageCount} used</span>
                              <span>{coupon.maxUsage} max</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${
                                  progress >= 100
                                    ? "bg-rose-500"
                                    : "bg-[#008ECC]"
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
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
                              onClick={() => openViewModal(coupon)}
                              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(coupon)}
                              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(coupon)}
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
                {Math.min(page * PAGE_SIZE, filteredCoupons.length)} of{" "}
                {filteredCoupons.length}
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
        title={viewMode === "add" ? "Create coupon" : "Edit coupon"}
        subtitle="Link a coupon to a promotion and configure its usage limit."
        onClose={closeModal}
      >
        <div className="grid gap-0 lg:grid-cols-[1fr_0.82fr]">
          <div className="space-y-5 p-6 lg:border-r lg:border-slate-200">
            <label className="space-y-2 block">
              <span className="text-sm font-medium text-slate-700">
                Coupon code
              </span>
              <input
                value={draft.code}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    code: event.target.value,
                  }))
                }
                placeholder="SUMMER25"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase tracking-[0.2em] outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-sm font-medium text-slate-700">
                Linked promotion
              </span>
              <select
                value={draft.promotionId}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    promotionId: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              >
                <option value="">Select a promotion</option>
                {promotions.map((promotion) => (
                  <option key={promotion.id} value={promotion.id}>
                    {promotion.name} -{" "}
                    {promotionStatusLabels[normalizeStatus(promotion.status)]}
                  </option>
                ))}
              </select>
              <p className="text-xs leading-5 text-slate-500">
                Coupon timing and availability follow the selected promotion.
              </p>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 block">
                <span className="text-sm font-medium text-slate-700">
                  Discount percentage
                </span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={draft.discountPercentage}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      discountPercentage: event.target.value,
                    }))
                  }
                  placeholder="25"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </label>

              <label className="space-y-2 block">
                <span className="text-sm font-medium text-slate-700">
                  Max usage
                </span>
                <input
                  type="number"
                  min={1}
                  value={draft.maxUsage}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      maxUsage: event.target.value,
                    }))
                  }
                  placeholder="100"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </label>
            </div>

            {editingId && selectedCoupon ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Current usage
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedCoupon.usageCount} / {selectedCoupon.maxUsage} uses
                  consumed.
                </p>
              </div>
            ) : null}
          </div>

          <div className="space-y-5 bg-slate-50 p-6">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Live preview
              </p>
              <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white">
                <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                  Coupon code
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[0.18em]">
                  {draft.code || "CODE"}
                </p>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                      Discount
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {draft.discountPercentage || "0"}% off
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium">
                    {draft.maxUsage || "0"} max usage
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Selected promotion
              </p>
              <div className="mt-4 rounded-[1.5rem] bg-slate-50 p-4">
                {draft.promotionId ? (
                  (() => {
                    const selectedPromotion = promotions.find(
                      (promotion) => promotion.id === draft.promotionId,
                    );
                    if (!selectedPromotion) {
                      return (
                        <p className="text-sm text-slate-500">
                          Promotion not found.
                        </p>
                      );
                    }

                    const status = normalizeStatus(selectedPromotion.status);

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {selectedPromotion.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatDateTime(selectedPromotion.startDate)} -{" "}
                              {formatDateTime(selectedPromotion.endDate)}
                            </p>
                          </div>
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
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-sm text-slate-500">
                    Choose a promotion to preview it here.
                  </p>
                )}
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
                onClick={submitCoupon}
                disabled={saving}
                className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : viewMode === "add"
                    ? "Create coupon"
                    : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={viewMode === "view" && Boolean(selectedCoupon)}
        title={selectedCoupon?.code ?? "Coupon detail"}
        subtitle="Inspect coupon usage and linked promotion details."
        onClose={closeModal}
        widthClass="max-w-5xl"
      >
        {selectedCoupon ? (
          <div className="grid gap-0 lg:grid-cols-[0.96fr_1.04fr]">
            <div className="space-y-5 p-6 lg:border-r lg:border-slate-200">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                  Coupon code
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[0.18em]">
                  {selectedCoupon.code}
                </p>
                <p className="mt-4 text-sm text-white/70">
                  {selectedCoupon.discountPercentage}% discount with a max usage
                  of {selectedCoupon.maxUsage}.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Promotion
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {selectedCoupon.Promotion?.name || "No promotion"}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Discount
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {selectedCoupon.discountPercentage}% off
                  </p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Valid period
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {selectedCoupon.Promotion
                    ? `${formatDateTime(selectedCoupon.Promotion.startDate)} - ${formatDateTime(
                        selectedCoupon.Promotion.endDate,
                      )}`
                    : "No linked promotion"}
                </p>
              </div>
            </div>

            <div className="space-y-5 bg-slate-50 p-6">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">
                  Usage progress
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{selectedCoupon.usageCount} used</span>
                    <span>{selectedCoupon.maxUsage} max</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#008ECC]"
                      style={{
                        width: `${
                          selectedCoupon.maxUsage > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  (selectedCoupon.usageCount /
                                    selectedCoupon.maxUsage) *
                                    100,
                                ),
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">
                  Linked promotion status
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedCoupon.Promotion ? (
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                        statusMeta[
                          normalizeStatus(selectedCoupon.Promotion.status)
                        ].tone
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          statusMeta[
                            normalizeStatus(selectedCoupon.Promotion.status)
                          ].chip
                        }`}
                      />
                      {
                        statusMeta[
                          normalizeStatus(selectedCoupon.Promotion.status)
                        ].label
                      }
                    </span>
                  ) : (
                    <span className="text-sm text-slate-500">
                      No promotion attached.
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">
                  Quick details
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span>Created from coupon id</span>
                    <span className="font-medium text-slate-900">
                      {selectedCoupon.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span>Promotion id</span>
                    <span className="font-medium text-slate-900">
                      {selectedCoupon.promotionId}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedCoupon)}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Edit coupon
                </button>
              </div>
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
              Delete coupon?
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will permanently remove the coupon code from the admin
              catalog.
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
                onClick={deleteCoupon}
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
