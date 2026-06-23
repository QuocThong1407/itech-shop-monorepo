import { Badge } from "@itech/shared";
import type { DashboardData, DashboardMetric, OrderList, QuickNote } from "./types";

export const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function startDate(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function formatStatus(status: string) {
  return status ? status.replaceAll("_", " ").toUpperCase() : "UNKNOWN";
}

export function emptyMoney(value: number | null | undefined) {
  return currency.format(Number(value ?? 0));
}

export function statusClass(status: string) {
  switch (status?.toUpperCase()) {
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "SHIPPED":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "CONFIRMED":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "CANCELLED":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

export function activityTone(entityType: string) {
  switch (entityType) {
    case "order":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "return":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "cancellation":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "product":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "config":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "report":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-cyan-50 text-cyan-700 ring-cyan-200";
  }
}

export function buildOrderStatusRing(orders: OrderList["orders"]) {
  const counts = orders.reduce<Record<string, number>>((acc, order) => {
    const key = order.status?.toUpperCase() || "UNKNOWN";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(counts);
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;
  const colors: Record<string, string> = {
    DELIVERED: "#10b981",
    SHIPPED: "#0ea5e9",
    CONFIRMED: "#f59e0b",
    PENDING: "#94a3b8",
    CANCELLED: "#f43f5e",
    UNKNOWN: "#cbd5e1",
  };

  const segments = entries.reduce<{ color: string; start: number; end: number }[]>(
    (acc, [status, count]) => {
      const start = acc.length ? acc[acc.length - 1].end : 0;
      const width = (count / total) * 100;
      acc.push({
        color: colors[status] || colors.UNKNOWN,
        start,
        end: start + width,
      });
      return acc;
    },
    [],
  );

  const gradient =
    segments.length > 0
      ? `conic-gradient(${segments
          .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
          .join(", ")})`
      : "conic-gradient(#e2e8f0 0 100%)";

  return { counts, total, gradient };
}

export function buildDashboardMetrics(data: DashboardData): DashboardMetric[] {
  const lowStockCount = data.productList.products.filter((product) => product.stockQuantity <= 10)
    .length;

  return [
    {
      label: "Revenue",
      value: emptyMoney(data.revenueReport.summary.netRevenue),
      note: `${data.revenueReport.summary.totalIncome.toLocaleString("vi-VN")} income / ${data.revenueReport.summary.totalRefund.toLocaleString("vi-VN")} refund`,
      tone: "emerald",
    },
    {
      label: "Orders",
      value: data.orderList.pagination.total.toLocaleString("vi-VN"),
      note: `${data.activityReport.summary.newOrders.toLocaleString("vi-VN")} new orders in 30 days`,
      tone: "sky",
    },
    {
      label: "Products",
      value: data.productList.pagination.total.toLocaleString("vi-VN"),
      note: `${lowStockCount.toLocaleString("vi-VN")} low-stock items across the live product dataset`,
      tone: "amber",
    },
    {
      label: "Users",
      value: data.usersStats.total.toLocaleString("vi-VN"),
      note: `${data.usersStats.customers.toLocaleString("vi-VN")} customers / ${data.usersStats.sellers.toLocaleString("vi-VN")} sellers`,
      tone: "violet",
    },
  ];
}

export function buildQuickNotes(data: DashboardData): QuickNote[] {
  return [
    {
      title: "Logged events",
      value: `${data.activityReport.eventSummary.totalEvents} events`,
      note: "Recent cross-service activity in the selected 30-day window",
    },
    {
      title: "Config changes",
      value: `${data.activityReport.eventSummary.configEvents} updates`,
      note: "System parameter changes are included in the activity log",
    },
    {
      title: "Reports generated",
      value: `${data.activityReport.eventSummary.reportEvents} exports`,
      note: "Audit feed now tracks report generation events",
    },
    {
      title: "Top spent",
      value: `${data.topMembers.length} members`,
      note: "Membership ranking feed from the backend",
    },
  ];
}
