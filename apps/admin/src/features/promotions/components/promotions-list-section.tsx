"use client";

import { EmptyState } from "@itech/shared";
import { PAGE_SIZE, promotionStatusTabs, statusMeta } from "../constants";
import { formatDateTime, getPromotionScope, normalizeStatus } from "../helpers";
import type { PromotionDetail, PromotionRecord, PromotionStatus } from "../types";

type PromotionsListSectionProps = {
  loading: boolean;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  statusFilter: "ALL" | PromotionStatus;
  onStatusFilterChange: (status: "ALL" | PromotionStatus) => void;
  onRefresh: () => void;
  onOpenAdd: () => void;
  pagedPromotions: PromotionRecord[];
  filteredPromotionsLength: number;
  page: number;
  totalPages: number;
  promotionDetails: Record<string, PromotionDetail>;
  categoriesCount: number;
  onOpenView: (promotion: PromotionRecord) => void;
  onOpenEdit: (promotion: PromotionRecord) => void;
  onToggleStatus: (promotion: PromotionRecord, nextStatus: PromotionStatus) => void;
  onRequestDelete: (promotion: PromotionRecord) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export default function PromotionsListSection({
  loading,
  searchInput,
  onSearchInputChange,
  onSearch,
  onClear,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  onOpenAdd,
  pagedPromotions,
  filteredPromotionsLength,
  page,
  totalPages,
  promotionDetails,
  categoriesCount,
  onOpenView,
  onOpenEdit,
  onToggleStatus,
  onRequestDelete,
  onPrevPage,
  onNextPage,
}: PromotionsListSectionProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Promotion list</p>
            <p className="mt-1 text-sm text-slate-500">
              Search, filter, and manage campaign records.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-11 min-w-[18rem] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600">
              <span className="text-slate-400">Search</span>
              <input
                value={searchInput}
                onChange={(event) => onSearchInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onSearch();
                }}
                placeholder="Name or description"
                className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>
            <button
              type="button"
              onClick={onSearch}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Search
            </button>
            <button
              type="button"
              onClick={onClear}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {promotionStatusTabs.map((status) => {
            const active = statusFilter === status;
            const label = status === "ALL" ? "All" : statusMeta[status].label;
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
                <td colSpan={5} className="px-5 py-16 text-center text-sm text-slate-500">
                  Loading promotions...
                </td>
              </tr>
            ) : pagedPromotions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10">
                  <EmptyState
                    title="No promotions found"
                    description="Try another filter or create a new campaign."
                  />
                </td>
              </tr>
            ) : (
              pagedPromotions.map((promotion) => {
                const status = normalizeStatus(promotion.status);
                const detail = promotionDetails[promotion.id];
                const scope = detail
                  ? getPromotionScope(detail, categoriesCount).label
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
                          <p className="text-sm font-semibold text-slate-950">{promotion.name}</p>
                          <p className="mt-1 line-clamp-2 max-w-[26rem] text-sm leading-6 text-slate-500">
                            {promotion.description || "No description provided."}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5 align-top text-sm text-slate-600">
                      <div className="space-y-1">
                        <p>{formatDateTime(promotion.startDate)}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">to</p>
                        <p>{formatDateTime(promotion.endDate)}</p>
                      </div>
                    </td>
                    <td className="px-5 py-5 align-top text-sm text-slate-600">{scope}</td>
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
                          onClick={() => onOpenView(promotion)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenEdit(promotion)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        {status === "ACTIVE" ? (
                          <button
                            type="button"
                            onClick={() => onToggleStatus(promotion, "INACTIVE")}
                            className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                          >
                            Pause
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onToggleStatus(promotion, "ACTIVE")}
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRequestDelete(promotion)}
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
            Showing {filteredPromotionsLength === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{" "}
            {Math.min(page * PAGE_SIZE, filteredPromotionsLength)} of {filteredPromotionsLength}
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
