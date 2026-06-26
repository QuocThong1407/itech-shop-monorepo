import { formatDateTime, formatMoney } from "../../lib/seller-api";
import { normalizeStatus as normalizeOrderStatus } from "../orders/helpers";
import { normalizeStatus as normalizeReturnStatus } from "../returns/helpers";
import { normalizeStatus as normalizeCancellationStatus } from "../cancellations/helpers";
import { normalizeStockStatus } from "../products/helpers";
import type {
  SellerActivityItem,
  SellerDashboardData,
  SellerDashboardMetric,
  SellerDashboardViewModel,
  SellerProductHighlight,
  SellerRecoveryItem,
  SellerRevenuePoint,
} from "./types";

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ?? "";
}

export function parseSellerUserId() {
  const raw = getCookieValue("authUser");
  if (!raw) return "";

  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return parsed?.id || "";
  } catch {
    return "";
  }
}

function getOrderAmount(order: SellerDashboardData["orders"][number]) {
  return (order.Payment || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
}

function isSuccessfulPayment(status?: string) {
  const normalized = (status || "").toUpperCase();
  return normalized === "SUCCESS" || normalized === "PAID";
}

function byNewest<T extends { createdAt?: string; updatedAt?: string; orderDate?: string }>(
  left: T,
  right: T,
) {
  const leftTime = new Date(left.updatedAt || left.createdAt || left.orderDate || 0).getTime();
  const rightTime = new Date(right.updatedAt || right.createdAt || right.orderDate || 0).getTime();
  return rightTime - leftTime;
}

function byOccurredAt<
  T extends {
    occurredAt?: string;
  },
>(left: T, right: T) {
  const leftTime = new Date(left.occurredAt || 0).getTime();
  const rightTime = new Date(right.occurredAt || 0).getTime();
  return rightTime - leftTime;
}

export function buildRevenueTrend(data: SellerDashboardData): SellerRevenuePoint[] {
  const formatter = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" });
  const bucket = new Map<string, SellerRevenuePoint>();

  for (const order of data.orders) {
    const createdAt = order.orderDate || order.createdAt;
    if (!createdAt) continue;

    const amount = getOrderAmount(order);
    if (amount <= 0) continue;

    const key = new Date(createdAt).toISOString().slice(0, 10);
    const point = bucket.get(key) ?? {
      key,
      label: formatter.format(new Date(createdAt)),
      revenue: 0,
      orders: 0,
    };

    point.revenue += amount;
    point.orders += 1;
    bucket.set(key, point);
  }

  return Array.from(bucket.values())
    .sort((left, right) => left.key.localeCompare(right.key))
    .slice(-7);
}

export function buildRecoveryQueue(data: SellerDashboardData): SellerRecoveryItem[] {
  const returns = data.returns.map((item) => ({
    id: item.id,
    type: "return" as const,
    orderId: item.Order?.id,
    status: normalizeReturnStatus(item.status),
    reason: item.reason || "No reason provided",
    customerLabel:
      item.Order?.Customer?.User?.username ||
      item.Order?.Customer?.User?.email ||
      "Customer",
    amount: Number(item.Order?.Payment?.[0]?.amount || 0),
    createdAt: item.createdAt || "",
  }));

  const cancellations = data.cancellations.map((item) => ({
    id: item.id,
    type: "cancellation" as const,
    orderId: item.Order?.id,
    status: normalizeCancellationStatus(item.status),
    reason: item.reason || "No reason provided",
    customerLabel:
      item.Order?.Customer?.User?.username ||
      item.Order?.Customer?.User?.email ||
      "Customer",
    amount: Number(item.Order?.Payment?.[0]?.amount || 0),
    createdAt: item.createdAt || "",
  }));

  return [...returns, ...cancellations].sort((left, right) => byNewest(left, right)).slice(0, 6);
}

export function buildActivityFeed(data: SellerDashboardData): SellerActivityItem[] {
  const orderEvents: SellerActivityItem[] = data.orders.map((order) => ({
    id: `order-${order.id}`,
    kind: "order",
    title: `Order ${order.id.slice(0, 8)} moved to ${normalizeOrderStatus(order.status)}`,
    description:
      order.Customer?.User?.username ||
      order.Customer?.User?.email ||
      "Customer placed or updated an order.",
    occurredAt: order.updatedAt || order.createdAt || order.orderDate || "",
    status: normalizeOrderStatus(order.status),
  }));

  const returnEvents: SellerActivityItem[] = data.returns.map((item) => ({
    id: `return-${item.id}`,
    kind: "return",
    title: `Return request ${item.id.slice(0, 8)}`,
    description: item.reason || "Customer submitted a return request.",
    occurredAt: item.updatedAt || item.createdAt || "",
    status: normalizeReturnStatus(item.status),
  }));

  const cancellationEvents: SellerActivityItem[] = data.cancellations.map((item) => ({
    id: `cancellation-${item.id}`,
    kind: "cancellation",
    title: `Cancellation request ${item.id.slice(0, 8)}`,
    description: item.reason || "Customer submitted a cancellation request.",
    occurredAt: item.updatedAt || item.createdAt || "",
    status: normalizeCancellationStatus(item.status),
  }));

  const productEvents: SellerActivityItem[] = data.products.map((product) => ({
    id: `product-${product.id}`,
    kind: "product",
    title: `Product ${product.name} updated`,
    description: `${product.Category?.name || "Uncategorized"} catalog item refreshed.`,
    occurredAt: product.updatedAt || product.createdAt || "",
    status: normalizeStockStatus(product.stockQuantity),
  }));

  return [...orderEvents, ...returnEvents, ...cancellationEvents, ...productEvents]
    .sort((left, right) => byOccurredAt(left, right))
    .slice(0, 8);
}

export function buildTopProducts(data: SellerDashboardData): SellerProductHighlight[] {
  return [...data.products]
    .map((product) => ({
      ...product,
      status: normalizeStockStatus(product.stockQuantity),
    }))
    .sort((left, right) => {
      const soldDelta = Number(right.soldCount || 0) - Number(left.soldCount || 0);
      if (soldDelta !== 0) return soldDelta;

      const ratingDelta = Number(right.averageRating || 0) - Number(left.averageRating || 0);
      if (ratingDelta !== 0) return ratingDelta;

      return byNewest(left, right);
    })
    .slice(0, 5);
}

export function buildDashboardViewModel(data: SellerDashboardData): SellerDashboardViewModel {
  const revenueTrend = buildRevenueTrend(data);
  const successfulOrders = data.orders.filter((order) =>
    (order.Payment || []).some((payment) => isSuccessfulPayment(payment.status)),
  );
  const deliveredOrders = data.orders.filter(
    (order) => normalizeOrderStatus(order.status) === "DELIVERED",
  );
  const pendingOrders = data.orders.filter(
    (order) => normalizeOrderStatus(order.status) === "PENDING",
  ).length;
  const shippedOrders = data.orders.filter(
    (order) => normalizeOrderStatus(order.status) === "SHIPPED",
  ).length;
  const lowStockProducts = data.products.filter(
    (product) => normalizeStockStatus(product.stockQuantity) === "LOW_STOCK",
  ).length;
  const outOfStockProducts = data.products.filter(
    (product) => normalizeStockStatus(product.stockQuantity) === "OUT_STOCK",
  ).length;

  const totalRevenue = successfulOrders.reduce((sum, order) => sum + getOrderAmount(order), 0);
  const deliveredRevenue = deliveredOrders.reduce((sum, order) => sum + getOrderAmount(order), 0);
  const pendingRevenue = Math.max(0, totalRevenue - deliveredRevenue);

  const snapshot = {
    totalRevenue,
    deliveredRevenue,
    pendingRevenue,
    successfulPayments: successfulOrders.length,
    pendingOrders,
    shippedOrders,
    deliveredOrders: deliveredOrders.length,
    activeProducts: data.products.length - outOfStockProducts,
    lowStockProducts,
    outOfStockProducts,
    returnRequests: data.returns.length,
    cancellationRequests: data.cancellations.length,
  };

  const metrics: SellerDashboardMetric[] = [
    {
      title: "Revenue secured",
      value: formatMoney(totalRevenue),
      note: `${snapshot.successfulPayments} successful payments captured`,
      accentClassName: "bg-emerald-500",
    },
    {
      title: "Open fulfillment",
      value: `${snapshot.pendingOrders + snapshot.shippedOrders}`,
      note: `${snapshot.pendingOrders} pending and ${snapshot.shippedOrders} shipped orders`,
      accentClassName: "bg-sky-500",
    },
    {
      title: "Catalog coverage",
      value: `${snapshot.activeProducts}/${data.products.length || 0}`,
      note: `${snapshot.lowStockProducts} low-stock and ${snapshot.outOfStockProducts} unavailable`,
      accentClassName: "bg-amber-500",
    },
    {
      title: "Service recovery",
      value: `${snapshot.returnRequests + snapshot.cancellationRequests}`,
      note: `${snapshot.returnRequests} returns and ${snapshot.cancellationRequests} cancellations need tracking`,
      accentClassName: "bg-rose-500",
    },
  ];

  return {
    metrics,
    revenueTrend,
    snapshot,
    recentOrders: [...data.orders].sort((left, right) => byNewest(left, right)).slice(0, 6),
    topProducts: buildTopProducts(data),
    recoveryQueue: buildRecoveryQueue(data),
    activityFeed: buildActivityFeed(data),
  };
}

export function getActivityTone(kind: SellerActivityItem["kind"]) {
  switch (kind) {
    case "order":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "return":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "cancellation":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "product":
    default:
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
}

export function getRecoveryTone(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "REJECTED":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "REQUESTED":
    default:
      return "bg-amber-50 text-amber-700 ring-amber-200";
  }
}

export function getStockTone(status: SellerProductHighlight["status"]) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "LOW_STOCK":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "OUT_STOCK":
    default:
      return "bg-rose-50 text-rose-700 ring-rose-200";
  }
}

export { formatDateTime, formatMoney };
