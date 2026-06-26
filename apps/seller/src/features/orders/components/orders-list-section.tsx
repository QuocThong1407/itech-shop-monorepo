"use client";

import {
  Button,
  EmptyState,
  FilterToolbar,
  SearchInput,
  StatusBadge,
  StatusSelect,
  TableCard,
  TablePagination,
  TableShell,
  TabPills,
} from "@itech/shared";
import { PAGE_SIZE, paymentTabs, statusTabs } from "../constants";
import {
  formatDateTime,
  formatMoney,
  getAddressText,
  getAvailableStatusOptions,
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
  onStatusChange,
  onPrevPage,
  onNextPage,
}: OrdersListSectionProps) {
  return (
    <TableCard className="rounded-[2rem] shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200 px-5 pb-3 pt-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <TabPills
              items={statusTabs.map((tab) => ({
                key: tab,
                label: tab === "ALL" ? "All" : getStatusLabel(tab),
              }))}
              activeKey={activeTab}
              onChange={(key) => onStatusTabChange(key as (typeof statusTabs)[number])}
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

          <TabPills
            items={paymentTabs.map((tab) => ({
              key: tab,
              label: tab === "ALL" ? "All payments" : getPaymentLabel(tab),
            }))}
            activeKey={paymentTab}
            onChange={(key) => onPaymentTabChange(key as (typeof paymentTabs)[number])}
            className="justify-start"
            activeClassName="!bg-slate-900 !text-white !shadow-none"
            inactiveClassName="!border !border-slate-200 !bg-white !text-slate-600 hover:!bg-slate-50"
          />
        </div>
      </div>

      <FilterToolbar className="pt-4">
        <SearchInput
          value={searchText}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search order ID, customer, address, payment method..."
          className="!w-full !max-w-md !bg-white !focus:border-amber-300 !focus:ring-amber-100"
        />
        <div className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-900">{filteredOrdersLength}</span>{" "}
          orders
        </div>
      </FilterToolbar>

      <TableShell className="pt-5" innerClassName="overflow-x-auto overflow-y-hidden">
        <table className="min-w-[1120px] w-full table-fixed divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
              <th className="w-[14%] px-4 py-3">Order</th>
              <th className="w-[18%] px-4 py-3">Customer</th>
              <th className="w-[20%] px-4 py-3">Address</th>
              <th className="w-[10%] px-4 py-3">Payment</th>
              <th className="w-[12%] px-4 py-3">Total</th>
              <th className="w-[14%] px-4 py-3">Status</th>
              <th className="w-[12%] px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {pagedOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8">
                  <EmptyState
                    title="No orders found"
                    description="Try another filter or search keyword."
                  />
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
                        <StatusBadge
                          className={`!px-2.5 !py-1 !text-[11px] ${getPaymentTone(paymentInfo?.status)}`}
                        >
                          {getPaymentLabel(paymentInfo?.status)}
                        </StatusBadge>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                      {formatMoney(paymentInfo?.amount || 0)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusSelect
                        value={status}
                        disabled={actionLoading}
                        onChange={(event) => onStatusChange(order, event.target.value)}
                        options={getAvailableStatusOptions(status).map((item) => ({
                          value: item,
                          label: getStatusLabel(item),
                        }))}
                        toneClassName={`!border !bg-opacity-100 !text-sm ${getStatusSelectClass(status)}`}
                        className="!h-10 !w-full !rounded-2xl !px-3 !py-2 !font-semibold"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onView(order)}
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
          Showing {filteredOrdersLength === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{" "}
          {Math.min(page * PAGE_SIZE, filteredOrdersLength)} of {filteredOrdersLength}
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
