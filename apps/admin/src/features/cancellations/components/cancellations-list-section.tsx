"use client";

import { EmptyState } from "@itech/shared";
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
    <section className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200 px-5 pb-3 pt-5">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-sky-600 text-white shadow-[0_10px_24px_rgba(2,132,199,0.18)]"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab === "ALL" ? "All" : getStatusLabel(tab)}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onRefresh}
            className="ml-auto inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading || actionLoading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <input
          value={searchText}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search request id, order, customer, reason, product..."
          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 lg:max-w-md"
        />
        <div className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-900">{filteredRecordsLength}</span>{" "}
          requests
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
          <table className="w-full table-fixed divide-y divide-slate-200">
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
                        <select
                          value={normalizeStatus(record.status)}
                          disabled={actionLoading || finalStatus}
                          onChange={(event) => onStatusChange(record, event.target.value)}
                          className={`h-10 w-full rounded-2xl border px-3 text-sm font-semibold outline-none transition ${getStatusSelectClass(
                            record.status,
                          )}`}
                        >
                          <option value="REQUESTED">Requested</option>
                          <option value="APPROVED">Approved</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onView(record)}
                            className="inline-flex h-10 items-center justify-center rounded-2xl border border-sky-200 bg-white px-3 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"
                          >
                            View
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
            Showing {filteredRecordsLength === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{" "}
            {Math.min(page * PAGE_SIZE, filteredRecordsLength)} of {filteredRecordsLength}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPrevPage}
              disabled={page === 1}
              className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={onNextPage}
              disabled={page >= totalPages}
              className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
