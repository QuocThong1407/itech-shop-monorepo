import type { OrdersResponse } from "../orders/types";
import type { ReturnsResponse } from "../returns/types";
import type { CancellationsResponse } from "../cancellations/types";
import type { ProductRecord, ProductsResponse } from "../products/types";

export type SellerDashboardData = {
  orders: OrdersResponse["orders"];
  returns: ReturnsResponse["returns"];
  cancellations: CancellationsResponse["cancellations"];
  products: ProductsResponse["products"];
};

export type SellerDashboardMetric = {
  title: string;
  value: string;
  note: string;
  accentClassName: string;
};

export type SellerRevenuePoint = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
};

export type SellerOperationalSnapshot = {
  totalRevenue: number;
  deliveredRevenue: number;
  pendingRevenue: number;
  successfulPayments: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  returnRequests: number;
  cancellationRequests: number;
};

export type SellerActivityItem = {
  id: string;
  kind: "order" | "return" | "cancellation" | "product";
  title: string;
  description: string;
  occurredAt: string;
  status: string;
};

export type SellerRecoveryItem = {
  id: string;
  type: "return" | "cancellation";
  orderId?: string;
  status: string;
  reason: string;
  customerLabel: string;
  amount: number;
  createdAt: string;
};

export type SellerProductHighlight = ProductRecord & {
  status: "ACTIVE" | "LOW_STOCK" | "OUT_STOCK";
};

export type SellerDashboardViewModel = {
  metrics: SellerDashboardMetric[];
  revenueTrend: SellerRevenuePoint[];
  snapshot: SellerOperationalSnapshot;
  recentOrders: SellerDashboardData["orders"];
  topProducts: SellerProductHighlight[];
  recoveryQueue: SellerRecoveryItem[];
  activityFeed: SellerActivityItem[];
};
