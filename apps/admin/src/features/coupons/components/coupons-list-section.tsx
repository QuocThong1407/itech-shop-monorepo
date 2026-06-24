"use client";

import {
  Badge,
  Button,
  EmptyState,
  FilterToolbar,
  SearchInput,
  TableCard,
  TablePagination,
  TableShell,
  TabPills,
} from "@itech/shared";
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
    <TableCard className="rounded-[2rem] shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
      <FilterToolbar className="border-b border-slate-200 px-5 pb-4 pt-5">
        <TabPills
          items={couponStatusTabs.map((status) => ({
            key: status,
            label: status === "ALL" ? "All" : promotionStatusLabels[status],
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
            Create coupon
          </Button>
        </div>
      </FilterToolbar>

      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <SearchInput
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder="Code or promotion"
            className="!w-full w-xl !max-w-[22rem] !bg-white !focus:border-sky-300 !focus:ring-sky-100"
          />
          <Button
            onClick={onClearSearch}
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
          <tbody className="divide-y divide-slate-100 bg-white">
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
                      <Badge tone="danger">
                        {formatPercent(coupon.discountPercentage)} OFF
                      </Badge>
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
                        <span
                          className={`h-2 w-2 rounded-full ${statusMeta[status].chip}`}
                        />
                        {statusMeta[status].label}
                      </span>
                    </td>
                    <td className="px-5 py-5 align-top">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          onClick={() => onOpenView(coupon)}
                          size="sm"
                          variant="secondary"
                          className="rounded-full border-slate-200 px-3 py-2 text-xs shadow-none"
                        >
                          View
                        </Button>
                        <Button
                          onClick={() => onOpenEdit(coupon)}
                          size="sm"
                          variant="secondary"
                          className="rounded-full border-slate-200 px-3 py-2 text-xs shadow-none"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => onRequestDelete(coupon)}
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
          Showing {filteredCouponsLength === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
          - {Math.min(page * PAGE_SIZE, filteredCouponsLength)} of{" "}
          {filteredCouponsLength}
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
