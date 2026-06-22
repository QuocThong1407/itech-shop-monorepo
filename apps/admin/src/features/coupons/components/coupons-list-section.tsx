"use client";

import { Badge, EmptyState } from "@itech/shared";
import { couponStatusTabs, PAGE_SIZE } from "../constants";
import {
  formatDateTime,
  formatPercent,
  getUsageProgress,
  normalizeStatus,
  promotionStatusLabels,
  statusMeta,
} from "../helpers";
import type { CouponRecord, PromotionStatus } from "../types";

type CouponsListSectionProps = {
  loading: boolean;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onClearSearch: () => void;
  statusFilter: "ALL" | PromotionStatus;
  onStatusFilterChange: (status: "ALL" | PromotionStatus) => void;
  onRefresh: () => void;
  onOpenAdd: () => void;
  pagedCoupons: CouponRecord[];
  filteredCouponsLength: number;
  page: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onOpenView: (coupon: CouponRecord) => void;
  onOpenEdit: (coupon: CouponRecord) => void;
  onRequestDelete: (coupon: CouponRecord) => void;
};

export default function CouponsListSection({
  loading,
  searchInput,
  onSearchInputChange,
  onClearSearch,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  onOpenAdd,
  pagedCoupons,
  filteredCouponsLength,
  page,
  totalPages,
  onPrevPage,
  onNextPage,
  onOpenView,
  onOpenEdit,
  onRequestDelete,
}: CouponsListSectionProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Coupon list</p>
            <p className="mt-1 text-sm text-slate-500">
              Search codes and filter by promotion status.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-11 min-w-[18rem] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600">
              <span className="text-slate-400">Search</span>
              <input
                value={searchInput}
                onChange={(event) => onSearchInputChange(event.target.value)}
                placeholder="Code or promotion"
                className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>
            <button
              type="button"
              onClick={onClearSearch}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {couponStatusTabs.map((status) => {
            const active = statusFilter === status;
            const label = status === "ALL" ? "All" : promotionStatusLabels[status];
            return (
              <button
                key={status}
                type="button"
                onClick={() => onStatusFilterChange(status)}
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
              onClick={onRefresh}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={onOpenAdd}
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
                <td colSpan={6} className="px-5 py-16 text-center text-sm text-slate-500">
                  Loading coupons...
                </td>
              </tr>
            ) : pagedCoupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10">
                  <EmptyState
                    title="No coupons found"
                    description="Try another search or create a new discount code."
                  />
                </td>
              </tr>
            ) : (
              pagedCoupons.map((coupon) => {
                const status = normalizeStatus(coupon.Promotion?.status);
                const progress = getUsageProgress(coupon);

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
                            ? `${formatDateTime(coupon.Promotion.startDate)} - ${formatDateTime(coupon.Promotion.endDate)}`
                            : "No linked promotion"}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-5 align-top">
                      <Badge tone="danger">{formatPercent(coupon.discountPercentage)} OFF</Badge>
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
                              progress >= 100 ? "bg-rose-500" : "bg-[#008ECC]"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5 align-top">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusMeta[status].tone}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${statusMeta[status].chip}`} />
                        {statusMeta[status].label}
                      </span>
                    </td>
                    <td className="px-5 py-5 align-top">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenView(coupon)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenEdit(coupon)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDelete(coupon)}
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
            Showing {filteredCouponsLength === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{" "}
            {Math.min(page * PAGE_SIZE, filteredCouponsLength)} of {filteredCouponsLength}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={onPrevPage}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={onNextPage}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
