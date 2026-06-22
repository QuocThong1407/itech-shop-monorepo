"use client";

import { EmptyState } from "@itech/shared";
import { PAGE_SIZE, paymentTabs, statusTabs } from "../constants";
import {
  getAvailableStatusOptions,
  formatDateTime,
  formatMoney,
  getAddressText,
  getPaymentLabel,
  getPaymentTone,
  getStatusLabel,
  getStatusSelectClass,
  normalizeStatus,
} from "../helpers";
import type { OrderRecord } from "../types";

type OrdersListSectionProps = {
  loading: boolean;
  actionLoading: boolean;
  activeTab: (typeof statusTabs)[number];
  paymentTab: (typeof paymentTabs)[number];
  searchText: string;
  filteredOrdersLength: number;
  pagedOrders: OrderRecord[];
  page: number;
  totalPages: number;
  onStatusTabChange: (tab: (typeof statusTabs)[number]) => void;
  onPaymentTabChange: (tab: (typeof paymentTabs)[number]) => void;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onView: (order: OrderRecord) => void;
  onDelete: (order: OrderRecord) => void;
  onStatusChange: (order: OrderRecord, nextStatus: string) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export default function OrdersListSection({
  loading,
  actionLoading,
  activeTab,
  paymentTab,
  searchText,
  filteredOrdersLength,
  pagedOrders,
  page,
  totalPages,
  onStatusTabChange,
  onPaymentTabChange,
  onSearchChange,
  onRefresh,
  onView,
  onDelete,
  onStatusChange,
  onPrevPage,
  onNextPage,
}: OrdersListSectionProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200 px-5 pb-3 pt-5">
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onStatusTabChange(tab)}
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

        <div className="mt-3 flex flex-wrap gap-2">
          {paymentTabs.map((tab) => {
            const active = paymentTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onPaymentTabChange(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab === "ALL" ? "All payments" : getPaymentLabel(tab)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 pt-4 lg:flex-row lg:items-center lg:justify-between">
        <input
          value={searchText}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search order ID, customer, address, payment method..."
          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 lg:max-w-md"
        />
        <div className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-900">{filteredOrdersLength}</span>{" "}
          orders
        </div>
      </div>

      <div className="px-5 pb-5 pt-5">
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
          <table className="w-full table-fixed divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                <th className="w-[14%] px-4 py-3">Order</th>
                <th className="w-[18%] px-4 py-3">Customer</th>
                <th className="w-[18%] px-4 py-3">Address</th>
                <th className="w-[10%] px-4 py-3">Payment</th>
                <th className="w-[12%] px-4 py-3">Total</th>
                <th className="w-[12%] px-4 py-3">Status</th>
                <th className="w-[16%] px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {pagedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8">
                    <EmptyState title="No orders found" description="Try another filter or search keyword." />
                  </td>
                </tr>
              ) : (
                pagedOrders.map((order) => {
                  const customerUser = order.Customer?.User;
                  const paymentInfo = order.Payment?.[0];
                  const status = normalizeStatus(order.status);

                  return (
                    <tr key={order.id} className="align-top">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDateTime(order.createdAt || order.orderDate)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {customerUser?.username || "Guest"}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {customerUser?.email || "No email"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                          {getAddressText(order) || "No address"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1 text-sm">
                          <p className="font-semibold text-slate-900">
                            {paymentInfo?.method || "N/A"}
                          </p>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${getPaymentTone(
                              paymentInfo?.status,
                            )}`}
                          >
                            {getPaymentLabel(paymentInfo?.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                        {formatMoney(paymentInfo?.amount || 0)}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={status}
                          disabled={actionLoading}
                          onChange={(event) => onStatusChange(order, event.target.value)}
                          className={`h-10 w-full rounded-2xl border px-3 text-sm font-semibold outline-none transition ${getStatusSelectClass(
                            status,
                          )}`}
                        >
                          {getAvailableStatusOptions(status)
                            .map((item) => (
                              <option key={item} value={item}>
                                {getStatusLabel(item)}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onView(order)}
                            className="inline-flex h-10 items-center justify-center rounded-2xl border border-sky-200 bg-white px-3 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"
                          >
                            View
                          </button>
                          {status === "PENDING" ? (
                            <button
                              type="button"
                              onClick={() => onDelete(order)}
                              disabled={actionLoading}
                              className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Delete
                            </button>
                          ) : null}
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
            Showing {filteredOrdersLength === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{" "}
            {Math.min(page * PAGE_SIZE, filteredOrdersLength)} of {filteredOrdersLength}
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
