"use client";

import {
  Button,
  EmptyState,
  FilterToolbar,
  SearchInput,
  StatusSelect,
  TableCard,
  TablePagination,
  TableShell,
  TabPills,
} from "@itech/shared";
import { PAGE_SIZE, tabs } from "../constants";
import {
  formatDateTime,
  formatMoney,
  getStatusLabel,
  getStatusSelectClass,
  normalizeStatus,
} from "../helpers";
import type { CancellationRecord } from "../types";

type CancellationsListSectionProps = {
  loading: boolean;
  actionLoading: boolean;
  activeTab: (typeof tabs)[number];
  searchText: string;
  filteredRecordsLength: number;
  pagedRecords: CancellationRecord[];
  page: number;
  totalPages: number;
  onTabChange: (tab: (typeof tabs)[number]) => void;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onView: (record: CancellationRecord) => void;
  onStatusChange: (record: CancellationRecord, nextStatus: string) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export default function CancellationsListSection({
  loading,
  actionLoading,
  activeTab,
  searchText,
  filteredRecordsLength,
  pagedRecords,
  page,
  totalPages,
  onTabChange,
  onSearchChange,
  onRefresh,
  onView,
  onStatusChange,
  onPrevPage,
  onNextPage,
}: CancellationsListSectionProps) {
  return (
    <TableCard className="rounded-[2rem] shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200 px-5 pb-3 pt-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabPills
            items={tabs.map((tab) => ({
              key: tab,
              label: tab === "ALL" ? "All" : getStatusLabel(tab),
            }))}
            activeKey={activeTab}
            onChange={(key) => onTabChange(key as (typeof tabs)[number])}
            className="justify-start"
            activeClassName="!bg-amber-600 !text-white !shadow-none"
            inactiveClassName="!border !border-slate-200 !bg-white !text-slate-600 hover:!bg-slate-50"
          />

          <Button
            onClick={onRefresh}
            disabled={loading || actionLoading}
            variant="primary"
            className="!border !border-amber-700 !bg-amber-600 !text-white !shadow-none hover:!bg-amber-500"
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      <FilterToolbar>
        <SearchInput
          value={searchText}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search request id, order, customer, reason, product..."
          className="!w-full !max-w-md !bg-white !focus:border-amber-300 !focus:ring-amber-100"
        />
        <div className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-900">{filteredRecordsLength}</span>{" "}
          requests
        </div>
      </FilterToolbar>

      <TableShell innerClassName="overflow-x-auto overflow-y-hidden">
        <table className="min-w-[960px] w-full table-fixed divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
              <th className="w-[18%] px-4 py-3">Request</th>
              <th className="w-[20%] px-4 py-3">Customer</th>
              <th className="w-[20%] px-4 py-3">Reason</th>
              <th className="w-[14%] px-4 py-3">Order total</th>
              <th className="w-[16%] px-4 py-3">Status</th>
              <th className="w-[12%] px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {pagedRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8">
                  <EmptyState
                    title="No cancellation requests found"
                    description="Try another filter or search keyword."
                  />
                </td>
              </tr>
            ) : (
              pagedRecords.map((record) => {
                const user = record.Order?.Customer?.User;
                const finalStatus =
                  normalizeStatus(record.status) === "REJECTED" ||
                  normalizeStatus(record.status) === "COMPLETED";

                return (
                  <tr key={record.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="font-mono text-sm font-semibold text-slate-900">
                          Cancel #{record.id.slice(0, 10).toUpperCase()}
                        </div>
                        <div className="text-xs text-slate-500">
                          Order #{record.Order?.id?.slice(0, 8).toUpperCase() || "N/A"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDateTime(record.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-slate-900">
                          {user?.username || "Guest"}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {user?.email || "No email"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                        {record.reason || "No reason provided."}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                      {formatMoney(record.Order?.Payment?.[0]?.amount || 0)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusSelect
                        value={normalizeStatus(record.status)}
                        disabled={actionLoading || finalStatus}
                        onChange={(event) => onStatusChange(record, event.target.value)}
                        options={[
                          { value: "REQUESTED", label: "Requested" },
                          { value: "APPROVED", label: "Approved" },
                          { value: "COMPLETED", label: "Completed" },
                          { value: "REJECTED", label: "Rejected" },
                        ]}
                        toneClassName={getStatusSelectClass(record.status)}
                        className="!h-10 !w-full !rounded-2xl !px-3 !py-2 !font-semibold"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                        <Button
                          onClick={() => onView(record)}
                          size="sm"
                          variant="secondary"
                          className="rounded-full border-amber-200 px-3 py-2 text-xs text-amber-700 shadow-none hover:border-amber-300 hover:bg-amber-50"
                        >
                          View
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

      <div className="mt-4 flex items-center justify-between gap-3 px-5 pb-5">
        <p className="text-sm text-slate-500">
          Showing {filteredRecordsLength === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{" "}
          {Math.min(page * PAGE_SIZE, filteredRecordsLength)} of {filteredRecordsLength}
        </p>
        <TablePagination
          page={page}
          totalPages={totalPages || 1}
          onPrevious={onPrevPage}
          onNext={onNextPage}
          className="justify-end"
        />
      </div>
    </TableCard>
  );
}
