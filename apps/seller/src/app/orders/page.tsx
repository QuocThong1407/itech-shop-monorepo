"use client";

import { useEffect, useMemo, useState } from "react";
import { apiJson, formatDateTime, formatMoney } from "../../lib/seller-api";

type OrderItem = {
  id: string;
  quantity: number;
  ProductVariant?: {
    id: string;
    variantAttributes?: Record<string, string>;
    priceAdjustment?: number;
    Product?: {
      id: string;
      name?: string;
      price?: number;
      images?: string[];
    };
  };
};

type SellerOrder = {
  id: string;
  orderDate?: string;
  status?: string;
  Customer?: {
    id: string;
    User?: {
      id: string;
      username?: string;
      email?: string;
      image?: string;
    };
  };
  Address?: {
    id: string;
    phoneNumber?: string;
    address?: string;
    street?: string;
    ward?: string;
    district?: string;
    province?: string;
  };
  OrderItem?: OrderItem[];
  Payment?: Array<{
    id: string;
    amount?: number;
    method?: string;
    status?: string;
    paymentDate?: string;
  }>;
};

type OrdersResponse = {
  orders: SellerOrder[];
};

const statusTabs = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

function normalizeStatus(value?: string) {
  return (value || "UNKNOWN").toUpperCase();
}

function getStatusTone(status?: string) {
  switch (normalizeStatus(status)) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "CONFIRMED":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "SHIPPED":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "CANCELLED":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
}

function getStatusLabel(status?: string) {
  switch (normalizeStatus(status)) {
    case "PENDING":
      return "Pending";
    case "CONFIRMED":
      return "Confirmed";
    case "SHIPPED":
      return "Shipped";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Unknown";
  }
}

function getOrderSearchText(order: SellerOrder) {
  const customer = order.Customer?.User;
  const payment = order.Payment?.[0];
  const items = order.OrderItem || [];

  return [
    order.id,
    customer?.username,
    customer?.email,
    order.Address?.address,
    order.Address?.province,
    payment?.method,
    ...items.map((item) => item.ProductVariant?.Product?.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <article
      className={`rounded-[1.5rem] border p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] ${className}`}
    >
      <p className="text-xs uppercase tracking-[0.2em] opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </article>
  );
}

export default function SellerOrdersPage() {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] =
    useState<(typeof statusTabs)[number]>("ALL");
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await apiJson<OrdersResponse>("/orders?page=1&limit=2000");
      setOrders(result.orders || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const stats = useMemo(() => {
    const summary = {
      total: 0,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const order of orders) {
      const status = normalizeStatus(order.status);
      summary.total += 1;
      if (status === "PENDING") summary.pending += 1;
      else if (status === "CONFIRMED") summary.confirmed += 1;
      else if (status === "SHIPPED") summary.shipped += 1;
      else if (status === "DELIVERED") summary.delivered += 1;
      else if (status === "CANCELLED") summary.cancelled += 1;
    }

    return summary;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesTab =
        activeTab === "ALL" || normalizeStatus(order.status) === activeTab;
      const matchesSearch =
        keyword.length === 0 || getOrderSearchText(order).includes(keyword);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, orders, searchText]);

  const handleStatusChange = async (order: SellerOrder, nextStatus: string) => {
    const previousStatus = normalizeStatus(order.status);
    const ok = window.confirm(
      `Change order status to ${getStatusLabel(nextStatus)}?`,
    );
    if (!ok) return;

    try {
      await apiJson(`/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadOrders();
    } catch (error) {
      console.error(error);
      window.alert("Failed to update order status");
      order.status = previousStatus;
    }
  };

  const handleView = async (order: SellerOrder) => {
    setLoading(true);
    try {
      const detail = await apiJson<SellerOrder>(`/orders/${order.id}`);
      setSelectedOrder(detail || order);
      setDetailOpen(true);
    } catch (error) {
      console.error(error);
      setSelectedOrder(order);
      setDetailOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const customer = selectedOrder?.Customer?.User;
  const payment = selectedOrder?.Payment?.[0];
  const orderItems = selectedOrder?.OrderItem || [];

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-amber-100 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                Seller orders
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Order Management
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Track incoming orders, update fulfillment status, and review
                  customer details without leaving the seller workspace.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard
            label="Total"
            value={stats.total}
            className="border-slate-200 bg-white"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            className="border-amber-100 bg-amber-50 text-amber-700"
          />
          <StatCard
            label="Confirmed"
            value={stats.confirmed}
            className="border-sky-100 bg-sky-50 text-sky-700"
          />
          <StatCard
            label="Shipped"
            value={stats.shipped}
            className="border-indigo-100 bg-indigo-50 text-indigo-700"
          />
          <StatCard
            label="Delivered"
            value={stats.delivered}
            className="border-emerald-100 bg-emerald-50 text-emerald-700"
          />
          <StatCard
            label="Cancelled"
            value={stats.cancelled}
            className="border-rose-100 bg-rose-50 text-rose-700"
          />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-200 px-5 pt-5 pb-3">
            <div className="flex flex-wrap gap-2">
              {statusTabs.map((tab) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-amber-600 text-white shadow-[0_10px_24px_rgba(245,158,11,0.18)]"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab === "ALL" ? "All" : getStatusLabel(tab)}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => void loadOrders()}
                className="inline-flex ml-auto h-11 items-center justify-center rounded-2xl bg-amber-600 px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(245,158,11,0.18)] transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search order id, customer, email, product..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-100 lg:max-w-md"
            />
            <div className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {visibleOrders.length}
              </span>{" "}
              orders
            </div>
          </div>

          <div className="px-5 pb-5">
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
              <table className="w-full table-fixed divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                    <th className="w-[20%] px-4 py-3">Order</th>
                    <th className="w-[24%] px-4 py-3">Customer</th>
                    <th className="w-[18%] px-4 py-3">Payment</th>
                    <th className="w-[18%] px-4 py-3">Status</th>
                    <th className="w-[10%] px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {visibleOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-sm text-slate-500"
                      >
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    visibleOrders.map((order) => {
                      const user = order.Customer?.User;
                      const paymentItem = order.Payment?.[0];
                      const status = normalizeStatus(order.status);
                      const finalStatus =
                        status === "DELIVERED" || status === "CANCELLED";

                      return (
                        <tr key={order.id} className="align-top">
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="font-mono text-sm font-semibold text-slate-900">
                                #{order.id.slice(0, 10).toUpperCase()}
                              </div>
                              <div className="text-xs text-slate-500">
                                {formatDateTime(order.orderDate)}
                              </div>
                              <div className="text-xs text-slate-400">
                                {order.OrderItem?.length || 0} item(s)
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 align-middle">
                            <div className="flex items-start gap-3">
                              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                                {(user?.username || "U")
                                  .slice(0, 1)
                                  .toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-900">
                                  {user?.username || "Unknown customer"}
                                </div>
                                <div className="truncate text-xs text-slate-500">
                                  {user?.email || "-"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 align-middle">
                            <div className="space-y-1">
                              <div className="text-sm font-semibold text-slate-900">
                                {formatMoney(paymentItem?.amount || 0)}
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                  {paymentItem?.method || "N/A"}
                                </div>

                                <div className="text-xs font-medium text-slate-500">
                                  {paymentItem?.status || "PENDING"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 align-middle text-center">
                            <div className="">
                              <select
                                className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-100"
                                value={status}
                                disabled={finalStatus}
                                onChange={(event) =>
                                  void handleStatusChange(
                                    order,
                                    event.target.value,
                                  )
                                }
                              >
                                <option value="PENDING">Pending</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="SHIPPED">Shipped</option>
                                <option value="DELIVERED">Delivered</option>
                                <option value="CANCELLED">Cancelled</option>
                              </select>
                            </div>
                          </td>

                          <td className="px-4 py-4 align-middle text-center">
                            <button
                              type="button"
                              onClick={() => void handleView(order)}
                              className="inline-flex h-10 items-center justify-center rounded-2xl border border-amber-200 bg-white px-4 text-sm font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-50"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {detailOpen && selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.25)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 text-center">
              <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
                Order details
              </h3>
              <p className="text-sm text-slate-500">#{selectedOrder.id}</p>
              <div className="flex justify-center">
                <div
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusTone(selectedOrder.status)}`}
                >
                  {getStatusLabel(selectedOrder.status)}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <section className="rounded-[1.5rem] border border-slate-200 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-900">
                  Customer
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-900">
                      Username:
                    </span>{" "}
                    {customer?.username || "Guest"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Email:</span>{" "}
                    {customer?.email || "-"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Phone:</span>{" "}
                    {selectedOrder.Address?.phoneNumber || "-"}
                  </div>
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-slate-200 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-900">
                  Delivery address
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-900">
                      Address:
                    </span>{" "}
                    {selectedOrder.Address?.address || "-"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">
                      Street:
                    </span>{" "}
                    {selectedOrder.Address?.street || "-"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">
                      Ward / District:
                    </span>{" "}
                    {selectedOrder.Address?.ward || "-"} /{" "}
                    {selectedOrder.Address?.district || "-"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">
                      Province:
                    </span>{" "}
                    {selectedOrder.Address?.province || "-"}
                  </div>
                </div>
              </section>
            </div>

            <section className="mt-4 rounded-[1.5rem] border border-slate-200 p-4">
              <div className="mb-3 text-sm font-semibold text-slate-900">
                Order information
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Order date
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {formatDateTime(selectedOrder.orderDate)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Payment method
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {payment?.method || "COD"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Payment status
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {payment?.status || "PENDING"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Amount
                  </p>
                  <p className="mt-2 text-sm font-semibold text-amber-600">
                    {formatMoney(payment?.amount || 0)}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-4 rounded-[1.5rem] border border-slate-200 p-4">
              <div className="mb-3 text-sm font-semibold text-slate-900">
                Ordered items ({orderItems.length})
              </div>
              <div className="space-y-3">
                {orderItems.map((item) => {
                  const product = item.ProductVariant?.Product;
                  const image = product?.images?.[0];
                  const price =
                    (product?.price || 0) +
                    (item.ProductVariant?.priceAdjustment || 0);

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                          {image ? (
                            <img
                              src={image}
                              alt={product?.name || "Product"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-xs text-slate-400">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">
                            {product?.name || "Product"}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {Object.entries(
                              item.ProductVariant?.variantAttributes || {},
                            ).map(([key, value]) => (
                              <span
                                key={key}
                                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                              >
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                          <div className="mt-2 text-sm text-slate-500">
                            Qty {item.quantity} x {formatMoney(price)}
                          </div>
                        </div>
                      </div>

                      <div className="text-sm font-semibold text-slate-900">
                        {formatMoney(price * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
