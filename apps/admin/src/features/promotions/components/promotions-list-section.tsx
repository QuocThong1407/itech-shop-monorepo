"use client";

import {
  Button,
  EmptyState,
  FilterToolbar,
  SearchInput,
  StatusBadge,
  TableCard,
  TablePagination,
  TableShell,
  TabPills,
} from "@itech/shared";
import { PAGE_SIZE, promotionStatusTabs, statusMeta } from "../constants";
import { formatDateTime, getPromotionScope, normalizeStatus } from "../helpers";
import type {
  PromotionDetail,
  PromotionRecord,
  PromotionStatus,
} from "../types";

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
  onToggleStatus: (
    promotion: PromotionRecord,
    nextStatus: PromotionStatus,
  ) => void;
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
    <TableCard className="rounded-[2rem] shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
      <FilterToolbar className="border-b border-slate-200 px-5 pb-4 pt-5">
        <TabPills
          items={promotionStatusTabs.map((status) => ({
            key: status,
            label: status === "ALL" ? "All" : statusMeta[status].label,
          }))}
          activeKey={statusFilter}
          onChange={(key) =>
            onStatusFilterChange(key as "ALL" | PromotionStatus)
          }
          className="justify-start"
          activeClassName="!bg-slate-950 !text-white !shadow-none"
          inactiveClassName="!border !border-slate-200 !bg-white !text-slate-600 hover:!bg-slate-50"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={onRefresh}
            variant="secondary"
            className="!shadow-none"
          >
            Refresh
          </Button>
          <Button
            onClick={onOpenAdd}
            variant="primary"
            className="!border !border-slate-900 !shadow-none"
          >
            Create promotion
          </Button>
        </div>
      </FilterToolbar>

      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <SearchInput
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSearch();
            }}
            placeholder="Name or description"
            className="!w-full w-xl !max-w-[22rem] !bg-white !focus:border-sky-300 !focus:ring-sky-100"
          />
          <Button
            onClick={onSearch}
            variant="secondary"
            className="!shadow-none"
          >
            Search
          </Button>
          <Button
            onClick={onClear}
            variant="secondary"
            className="!shadow-none"
          >
            Clear
          </Button>
        </div>
      </div>

      <TableShell className="pt-0">
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
          <tbody className="divide-y divide-slate-100 bg-white">
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
                      <StatusBadge
                        className={statusMeta[status].tone}
                        dotClassName={statusMeta[status].chip}
                        withDot
                      >
                        {statusMeta[status].label}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-5 align-top">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          onClick={() => onOpenView(promotion)}
                          size="sm"
                          variant="secondary"
                          className="rounded-full border-slate-200 px-3 py-2 text-xs shadow-none"
                        >
                          View
                        </Button>
                        <Button
                          onClick={() => onOpenEdit(promotion)}
                          size="sm"
                          variant="secondary"
                          className="rounded-full border-slate-200 px-3 py-2 text-xs shadow-none"
                        >
                          Edit
                        </Button>
                        {status === "ACTIVE" ? (
                          <Button
                            onClick={() =>
                              onToggleStatus(promotion, "INACTIVE")
                            }
                            size="sm"
                            variant="secondary"
                            className="rounded-full !border-amber-200 !bg-amber-50 !px-3 !py-2 !text-xs !text-amber-700 !shadow-none hover:!bg-amber-100"
                          >
                            Pause
                          </Button>
                        ) : (
                          <Button
                            onClick={() => onToggleStatus(promotion, "ACTIVE")}
                            size="sm"
                            variant="secondary"
                            className="rounded-full !border-emerald-200 !bg-emerald-50 !px-3 !py-2 !text-xs !text-emerald-700 !shadow-none hover:!bg-emerald-100"
                          >
                            Activate
                          </Button>
                        )}
                        <Button
                          onClick={() => onRequestDelete(promotion)}
                          size="sm"
                          variant="secondary"
                          className="rounded-full !border-rose-200 !bg-rose-50 !px-3 !py-2 !text-xs !text-rose-700 !shadow-none hover:!bg-rose-100"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableShell>

      <div className="flex flex-col gap-3 px-5 pb-5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing{" "}
          {filteredPromotionsLength === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{" "}
          {Math.min(page * PAGE_SIZE, filteredPromotionsLength)} of{" "}
          {filteredPromotionsLength}
        </p>
        <TablePagination
          page={page}
          totalPages={totalPages || 1}
          onPrevious={onPrevPage}
          onNext={onNextPage}
          previousLabel="Prev"
          nextLabel="Next"
          className="gap-2"
        />
      </div>
    </TableCard>
  );
}
