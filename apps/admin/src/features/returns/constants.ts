import type { ReturnStats } from "./types";

export const tabs = ["ALL", "REQUESTED", "APPROVED", "COMPLETED", "REJECTED"] as const;

export const PAGE_SIZE = 8;

export const emptyStats: ReturnStats = {
  total: 0,
  requested: 0,
  approved: 0,
  completed: 0,
  rejected: 0,
};
