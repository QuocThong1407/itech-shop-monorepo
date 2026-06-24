import { formatDateTime, formatMoney } from "../../lib/admin-api";
import { emptyStats } from "./constants";
import type { OrderRecord, OrderStats } from "./types";

export function normalizeStatus(value?: string) {
  return (value || "UNKNOWN").toUpperCase();
}

export function getStatusLabel(status?: string) {
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

const allowedStatusTransitions: Record<string, string[]> = {
  PENDING: ["SHIPPED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
  UNKNOWN: [],
};

export function getAvailableStatusOptions(status?: string) {
  const current = normalizeStatus(status);
  const nextOptions = allowedStatusTransitions[current] ?? [];

  if (current === "CONFIRMED") {
    return ["SHIPPED", "CANCELLED"];
  }

  return [current, ...nextOptions].filter((value, index, array) => {
    if (value === "CONFIRMED") return false;
    return array.indexOf(value) === index;
  });
}

export function getStatusSelectClass(status?: string) {
  switch (normalizeStatus(status)) {
    case "PENDING":
      return "!border-amber-200 !bg-amber-50 !text-amber-700";
    case "CONFIRMED":
      return "!border-sky-200 !bg-sky-50 !text-sky-700";
    case "SHIPPED":
      return "!border-indigo-200 !bg-indigo-50 !text-indigo-700";
    case "DELIVERED":
      return "!border-emerald-200 !bg-emerald-50 !text-emerald-700";
    case "CANCELLED":
      return "!border-rose-200 !bg-rose-50 !text-rose-700";
    default:
      return "!border-slate-200 !bg-slate-50 !text-slate-700";
  }
}

export function normalizePaymentStatus(value?: string) {
  return (value || "UNKNOWN").toUpperCase();
}

export function getPaymentTone(status?: string) {
  switch (normalizePaymentStatus(status)) {
    case "SUCCESS":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "FAILED":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
}

export function getPaymentLabel(status?: string) {
  switch (normalizePaymentStatus(status)) {
    case "SUCCESS":
      return "Successful";
    case "PENDING":
      return "Pending";
    case "FAILED":
      return "Failed";
    default:
      return "Unknown";
  }
}

export function formatVariantAttributes(value?: Record<string, string>) {
  const entries = Object.entries(value || {});
  if (entries.length === 0) return "Default option";
  return entries.map(([key, item]) => `${key}: ${item}`).join(" - ");
}

export function getAddressText(order: OrderRecord) {
  const parts = [
    order.Address?.address,
    order.Address?.street,
    order.Address?.ward,
    order.Address?.district,
    order.Address?.province,
  ].filter(Boolean);

  return parts.join(", ");
}

export function getOrderSearchText(order: OrderRecord) {
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

export function buildOrderStats(orders: OrderRecord[]): OrderStats {
  const summary = { ...emptyStats };

  for (const order of orders) {
    const status = normalizeStatus(order.status);
    summary.total += 1;
    if (status === "PENDING") summary.pending += 1;
    else if (status === "SHIPPED") summary.shipped += 1;
    else if (status === "DELIVERED") summary.delivered += 1;
    else if (status === "CANCELLED") summary.cancelled += 1;
  }

  return summary;
}

export function filterOrders(
  orders: OrderRecord[],
  activeTab: string,
  paymentTab: string,
  searchText: string,
) {
  const keyword = searchText.trim().toLowerCase();

  return orders.filter((order) => {
    const paymentStatus = normalizePaymentStatus(order.Payment?.[0]?.status);
    const matchesTab = activeTab === "ALL" || normalizeStatus(order.status) === activeTab;
    const matchesPayment = paymentTab === "ALL" || paymentStatus === paymentTab;
    const matchesSearch = keyword.length === 0 || getOrderSearchText(order).includes(keyword);

    return matchesTab && matchesPayment && matchesSearch;
  });
}

export function paginateOrders(orders: OrderRecord[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return orders.slice(start, start + pageSize);
}

export { formatDateTime, formatMoney };
