"use client";

import { useEffect, useMemo, useState } from "react";
import { apiJson, formatDateTime, formatMoney } from "../../lib/admin-api";

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

type OrderRecord = {
  id: string;
  orderDate?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  Customer?: {
    id: string;
    User?: {
      id: string;
      username?: string;
      email?: string;
      image?: string;
    } | null;
  } | null;
  Address?: {
    id: string;
    phoneNumber?: string;
    address?: string;
    street?: string;
    ward?: string;
    district?: string;
    province?: string;
  } | null;
  OrderItem?: OrderItem[];
  Payment?: Array<{
    id: string;
    amount?: number;
    method?: string;
    status?: string;
    paymentDate?: string;
  }> | null;
};

type OrdersResponse = {
  orders: OrderRecord[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const statusTabs = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

const PAGE_SIZE = 8;

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

function formatVariantAttributes(value?: Record<string, string>) {
  const entries = Object.entries(value || {});
  if (entries.length === 0) return "Default option";
  return entries.map(([key, item]) => `${key}: ${item}`).join(" · ");
}

function getAddressText(order: OrderRecord) {
  const parts = [
    order.Address?.address,
    order.Address?.street,
    order.Address?.ward,
    order.Address?.district,
    order.Address?.province,
  ].filter(Boolean);

  return parts.join(", ");
}

function getOrderSearchText(order: OrderRecord) {
  const customer = order.Customer?.User;
  const payment = order.Payment?.[0];
  const items = order.OrderItem || [];

  return [
    order.id,
    customer?.username,
    customer?.email,
    getAddressText(order),
    order.Address?.phoneNumber,
    payment?.method,
    payment?.status,
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

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] =
    useState<(typeof statusTabs)[number]>("ALL");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiJson<OrdersResponse>("/orders?page=1&limit=2000");
      setOrders(result.orders || []);
      setPage(1);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load orders.");
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

  const filteredOrders = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesTab =
        activeTab === "ALL" || normalizeStatus(order.status) === activeTab;
      const matchesSearch =
        keyword.length === 0 || getOrderSearchText(order).includes(keyword);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, orders, searchText]);

  const pagedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, page]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchText]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  const handleStatusChange = async (order: OrderRecord, nextStatus: string) => {
    const ok = window.confirm(
      `Change order status to ${getStatusLabel(nextStatus)}?`,
    );
    if (!ok) return;

    setActionLoading(true);
    try {
      await apiJson(
        `/orders/${order.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        },
        "/orders",
      );
      await loadOrders();

      if (selectedOrder?.id === order.id) {
        const detail = await apiJson<OrderRecord>(`/orders/${order.id}`);
        setSelectedOrder(detail);
      }
    } catch (err) {
      console.error(err);
      window.alert(
        err instanceof Error ? err.message : "Failed to update order status.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (order: OrderRecord) => {
    const ok = window.confirm(
      "Delete this order? This should only be used for pending orders.",
    );
    if (!ok) return;

    setActionLoading(true);
    try {
      await apiJson(`/orders/${order.id}`, { method: "DELETE" }, "/orders");
      await loadOrders();
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null);
        setDetailOpen(false);
      }
    } catch (err) {
      console.error(err);
      window.alert(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleView = async (order: OrderRecord) => {
    setLoading(true);
    try {
      const detail = await apiJson<OrderRecord>(`/orders/${order.id}`);
      setSelectedOrder(detail || order);
      setDetailOpen(true);
    } catch (err) {
      console.error(err);
      setSelectedOrder(order);
      setDetailOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const customer = selectedOrder?.Customer?.User;
  const payment = selectedOrder?.Payment?.[0];
  const orderItems = selectedOrder?.OrderItem || [];
  const selectedAddress = selectedOrder ? getAddressText(selectedOrder) : "";

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#008ECC]">
                Admin orders
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Orders Control Center
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Monitor every order across the marketplace, inspect payment
                  state, and coordinate fulfillment decisions from one place.
                </p>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard
            label="Total"
            value={stats.total}
            className="border-slate-200 bg-white text-slate-900"
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
          <div className="border-b border-slate-200 px-5 pb-3 pt-5">
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
                onClick={() => void loadOrders()}
                className="ml-auto inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading || actionLoading}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 px-5 pt-4 lg:flex-row lg:items-center lg:justify-between">
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search order ID, customer, address, payment method..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 lg:max-w-md"
            />
            <div className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {filteredOrders.length}
              </span>{" "}
              orders
            </div>
          </div>

          <div className="px-5 pb-5 pt-5">
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
              <table className="w-full table-fixed divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                    <th className="w-[16%] px-4 py-3">Order</th>
                    <th className="w-[18%] px-4 py-3">Customer</th>
                    <th className="w-[18%] px-4 py-3">Address</th>
                    <th className="w-[12%] px-4 py-3">Payment</th>
                    <th className="w-[10%] px-4 py-3">Total</th>
                    <th className="w-[10%] px-4 py-3">Status</th>
                    <th className="w-[16%] px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {pagedOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-slate-500"
                      >
                        No orders found.
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
                              <p className="text-xs text-slate-500">
                                {paymentInfo?.status || "Unknown"}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                            {formatMoney(paymentInfo?.amount || 0)}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusTone(
                                status,
                              )}`}
                            >
                              {getStatusLabel(status)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => void handleView(order)}
                                className="inline-flex h-10 items-center justify-center rounded-2xl border border-sky-200 bg-white px-3 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"
                              >
                                View
                              </button>
                              <select
                                value={status}
                                disabled={actionLoading}
                                onChange={(event) =>
                                  void handleStatusChange(order, event.target.value)
                                }
                                className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
                              >
                                {statusTabs
                                  .filter((item) => item !== "ALL")
                                  .map((item) => (
                                    <option key={item} value={item}>
                                      {getStatusLabel(item)}
                                    </option>
                                  ))}
                              </select>
                              {status === "PENDING" ? (
                                <button
                                  type="button"
                                  onClick={() => void handleDelete(order)}
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
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page >= totalPages}
                  className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {detailOpen && selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.22)]">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
                    Admin orders
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                    Order #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Review customer, payment, delivery address, and line items.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailOpen(false)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1fr_0.98fr]">
              <div className="space-y-5 p-6 lg:border-r lg:border-slate-200">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Status
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusTone(
                        selectedOrder.status,
                      )}`}
                    >
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Total
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {formatMoney(payment?.amount || 0)}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Payment
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {payment?.method || "N/A"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {payment?.status || "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">
                    Customer information
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Name
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {customer?.username || "Guest"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Email
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {customer?.email || "No email"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Delivery address
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {selectedAddress || "No address"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {selectedOrder.Address?.phoneNumber || "No phone number"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Timeline</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                      <span>Created</span>
                      <span className="font-medium text-slate-900">
                        {formatDateTime(
                          selectedOrder.createdAt || selectedOrder.orderDate,
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                      <span>Updated</span>
                      <span className="font-medium text-slate-900">
                        {formatDateTime(selectedOrder.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                      <span>Paid at</span>
                      <span className="font-medium text-slate-900">
                        {formatDateTime(payment?.paymentDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5 bg-slate-50 p-6">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Line items
                    </p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {orderItems.length} items
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {orderItems.length > 0 ? (
                      orderItems.map((item) => {
                        const product = item.ProductVariant?.Product;
                        return (
                          <div
                            key={item.id}
                            className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex items-start gap-4">
                              <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                {product?.images?.[0] ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name || "Product"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="grid h-full w-full place-items-center text-[11px] text-slate-400">
                                    No image
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900">
                                  {product?.name || "Unnamed product"}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {formatVariantAttributes(
                                    item.ProductVariant?.variantAttributes,
                                  )}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                                  <span>Qty {item.quantity}</span>
                                  <span>
                                    Base {formatMoney(product?.price || 0)}
                                  </span>
                                  <span>
                                    Adj.{" "}
                                    {formatMoney(
                                      item.ProductVariant?.priceAdjustment || 0,
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                        No items found for this order.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">
                    Admin actions
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <select
                      value={normalizeStatus(selectedOrder.status)}
                      disabled={actionLoading}
                      onChange={(event) =>
                        void handleStatusChange(selectedOrder, event.target.value)
                      }
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none"
                    >
                      {statusTabs
                        .filter((item) => item !== "ALL")
                        .map((item) => (
                          <option key={item} value={item}>
                            {getStatusLabel(item)}
                          </option>
                        ))}
                    </select>

                    {normalizeStatus(selectedOrder.status) === "PENDING" ? (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => void handleDelete(selectedOrder)}
                        className="h-11 rounded-2xl border border-rose-200 bg-white px-5 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Delete order
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
