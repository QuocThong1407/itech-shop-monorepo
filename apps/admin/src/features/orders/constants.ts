import type { OrderStats } from "./types";

export const statusTabs = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export const paymentTabs = ["ALL", "SUCCESS", "PENDING", "FAILED"] as const;

export const PAGE_SIZE = 8;

export const emptyStats: OrderStats = {
  total: 0,
  pending: 0,
  confirmed: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0,
};
