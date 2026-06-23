import { formatDateTime, formatMoney } from "../../lib/admin-api";
import { emptyStats } from "./constants";
import type { CancellationRecord, CancellationStats } from "./types";

export function normalizeStatus(value?: string) {
  return (value || "UNKNOWN").toUpperCase();
}

export function getStatusLabel(status?: string) {
  switch (normalizeStatus(status)) {
    case "REQUESTED":
    case "PENDING":
      return "Requested";
    case "APPROVED":
      return "Approved";
    case "COMPLETED":
      return "Completed";
    case "REJECTED":
      return "Rejected";
    default:
      return "Unknown";
  }
}

export function getStatusSelectClass(status?: string) {
  switch (normalizeStatus(status)) {
    case "REQUESTED":
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "APPROVED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export function formatVariantAttributes(value?: Record<string, string>) {
  const entries = Object.entries(value || {});
  if (entries.length === 0) return "Default option";
  return entries.map(([key, item]) => `${key}: ${item}`).join(" - ");
}

export function getSearchText(record: CancellationRecord) {
  const customer = record.Order?.Customer?.User;
  const payment = record.Order?.Payment?.[0];
  const items = record.Order?.OrderItem || [];

  return [
    record.id,
    record.reason,
    record.Order?.id,
    customer?.username,
    customer?.email,
    payment?.method,
    ...items.map((item) => item.ProductVariant?.Product?.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function buildCancellationStats(records: CancellationRecord[]): CancellationStats {
  const summary = { ...emptyStats };

  for (const record of records) {
    const status = normalizeStatus(record.status);
    summary.total += 1;
    if (status === "REQUESTED" || status === "PENDING") summary.requested += 1;
    else if (status === "APPROVED") summary.approved += 1;
    else if (status === "COMPLETED") summary.completed += 1;
    else if (status === "REJECTED") summary.rejected += 1;
  }

  return summary;
}

export function filterCancellations(
  records: CancellationRecord[],
  activeTab: string,
  searchText: string,
) {
  const keyword = searchText.trim().toLowerCase();

  return records.filter((record) => {
    const status = normalizeStatus(record.status);
    const matchesTab =
      activeTab === "ALL" ||
      status === activeTab ||
      (activeTab === "REQUESTED" && status === "PENDING");
    const matchesSearch = keyword.length === 0 || getSearchText(record).includes(keyword);
    return matchesTab && matchesSearch;
  });
}

export function paginateCancellations(
  records: CancellationRecord[],
  page: number,
  pageSize: number,
) {
  const start = (page - 1) * pageSize;
  return records.slice(start, start + pageSize);
}

export { formatDateTime, formatMoney };
