import type { RevenueGroupBy } from "./types";

export function parseRevenueDate(value: string | string[] | undefined, fallback: string) {
  if (typeof value === "string" && value) return value;
  return fallback;
}

export function parseRevenueGroupBy(value: string | string[] | undefined): RevenueGroupBy {
  if (value === "month" || value === "year") return value;
  return "day";
}
