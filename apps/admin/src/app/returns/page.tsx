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

type ReturnRecord = {
  id: string;
  reason?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  Order?: {
    id: string;
    orderDate?: string;
    status?: string;
    Customer?: {
      User?: {
        username?: string;
        email?: string;
        image?: string;
      };
    };
    OrderItem?: OrderItem[];
    Payment?: Array<{
      amount?: number;
      method?: string;
      status?: string;
      paymentDate?: string;
    }>;
  };
};

type ReturnsResponse = {
  returns: ReturnRecord[];
};

const tabs = ["ALL", "REQUESTED", "APPROVED", "COMPLETED", "REJECTED"] as const;
const PAGE_SIZE = 8;

function normalizeStatus(value?: string) {
  return (value || "UNKNOWN").toUpperCase();
}

function getStatusTone(status?: string) {
  switch (normalizeStatus(status)) {
    case "REQUESTED":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "APPROVED":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "REJECTED":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
}

function getStatusLabel(status?: string) {
  switch (normalizeStatus(status)) {
    case "REQUESTED":
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

function getStatusSelectClass(status?: string) {
  switch (normalizeStatus(status)) {
    case "REQUESTED":
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

function formatVariantAttributes(value?: Record<string, string>) {
  const entries = Object.entries(value || {});
  if (entries.length === 0) return "Default option";
  return entries.map(([key, item]) => `${key}: ${item}`).join(" · ");
}

function getSearchText(record: ReturnRecord) {
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
      className={`rounded-[1.75rem] border p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] ${className}`}
    >
      <p className="text-xs uppercase tracking-[0.2em] opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </article>
  );
}

export default function AdminReturnsPage() {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("ALL");
  const [records, setRecords] = useState<ReturnRecord[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ReturnRecord | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiJson<ReturnsResponse>("/returns?page=1&limit=1000");
      setRecords(result.returns || []);
      setPage(1);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to load return requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReturns();
  }, []);

  const stats = useMemo(() => {
    const summary = {
      total: 0,
      requested: 0,
      approved: 0,
      completed: 0,
      rejected: 0,
    };

    for (const record of records) {
      const status = normalizeStatus(record.status);
      summary.total += 1;
      if (status === "REQUESTED") summary.requested += 1;
      else if (status === "APPROVED") summary.approved += 1;
      else if (status === "COMPLETED") summary.completed += 1;
      else if (status === "REJECTED") summary.rejected += 1;
    }

    return summary;
  }, [records]);

  const filteredRecords = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return records.filter((record) => {
      const matchesTab =
        activeTab === "ALL" || normalizeStatus(record.status) === activeTab;
      const matchesSearch =
        keyword.length === 0 || getSearchText(record).includes(keyword);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, records, searchText]);

  const pagedRecords = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [activeTab, searchText]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));

  const updateStatus = async (record: ReturnRecord, nextStatus: string) => {
    const confirm = window.confirm(
      `Update return request to ${getStatusLabel(nextStatus)}?`,
    );
    if (!confirm) return;

    setActionLoading(true);
    try {
      await apiJson(
        `/returns/${record.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        },
        "/returns",
      );
      await loadReturns();
      if (selectedRecord?.id === record.id) {
        const detail = await apiJson<ReturnRecord>(`/returns/${record.id}`);
        setSelectedRecord(detail);
      }
    } catch (error) {
      console.error(error);
      window.alert("Failed to update return status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleView = async (record: ReturnRecord) => {
    setLoading(true);
    try {
      const detail = await apiJson<ReturnRecord>(`/returns/${record.id}`);
      setSelectedRecord(detail || record);
      setDetailOpen(true);
    } catch (error) {
      console.error(error);
      setSelectedRecord(record);
      setDetailOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const customer = selectedRecord?.Order?.Customer?.User;
  const payment = selectedRecord?.Order?.Payment?.[0];
  const items = selectedRecord?.Order?.OrderItem || [];

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="space-y-3">
            <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#008ECC]">
              Admin returns
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                Return Request Queue
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Inspect, approve, complete, or reject customer returns across
                the entire marketplace.
              </p>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total" value={stats.total} className="border-slate-200 bg-white" />
          <StatCard
            label="Requested"
            value={stats.requested}
            className="border-amber-100 bg-amber-50 text-amber-700"
          />
          <StatCard
            label="Approved"
            value={stats.approved}
            className="border-sky-100 bg-sky-50 text-sky-700"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            className="border-emerald-100 bg-emerald-50 text-emerald-700"
          />
          <StatCard
            label="Rejected"
            value={stats.rejected}
            className="border-rose-100 bg-rose-50 text-rose-700"
          />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-200 px-5 pb-3 pt-5">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
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
                onClick={() => void loadReturns()}
                className="ml-auto inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading || actionLoading}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search request id, order, customer, reason, product..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 lg:max-w-md"
            />
            <div className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {filteredRecords.length}
              </span>{" "}
              requests
            </div>
          </div>

          <div className="px-5 pb-5">
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
              <table className="w-full table-fixed divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                    <th className="w-[18%] px-4 py-3">Request</th>
                    <th className="w-[20%] px-4 py-3">Customer</th>
                    <th className="w-[20%] px-4 py-3">Reason</th>
                    <th className="w-[14%] px-4 py-3">Order total</th>
                    <th className="w-[16%] px-4 py-3">Status</th>
                    <th className="w-[12%] px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {pagedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                        No return requests found.
                      </td>
                    </tr>
                  ) : (
                    pagedRecords.map((record) => {
                      const user = record.Order?.Customer?.User;
                      const finalStatus =
                        normalizeStatus(record.status) === "REJECTED" ||
                        normalizeStatus(record.status) === "COMPLETED";
                      return (
                        <tr key={record.id} className="align-top">
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="font-mono text-sm font-semibold text-slate-900">
                                Return #{record.id.slice(0, 10).toUpperCase()}
                              </div>
                              <div className="text-xs text-slate-500">
                                Order #{record.Order?.id?.slice(0, 8).toUpperCase() || "N/A"}
                              </div>
                              <div className="text-xs text-slate-500">
                                {formatDateTime(record.createdAt)}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="text-sm font-semibold text-slate-900">
                                {user?.username || "Guest"}
                              </div>
                              <div className="truncate text-xs text-slate-500">
                                {user?.email || "No email"}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                              {record.reason || "No reason provided."}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                            {formatMoney(record.Order?.Payment?.[0]?.amount || 0)}
                          </td>
                          <td className="px-4 py-4">
                            <select
                              value={normalizeStatus(record.status)}
                              disabled={actionLoading || finalStatus}
                              onChange={(event) =>
                                void updateStatus(record, event.target.value)
                              }
                              className={`h-10 w-full rounded-2xl border px-3 text-sm font-semibold outline-none transition ${getStatusSelectClass(
                                record.status,
                              )}`}
                            >
                              <option value="REQUESTED">Requested</option>
                              <option value="APPROVED">Approved</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => void handleView(record)}
                                className="inline-flex h-10 items-center justify-center rounded-2xl border border-sky-200 bg-white px-3 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"
                              >
                                View
                              </button>
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

      {detailOpen && selectedRecord ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.22)]">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
                    Admin returns
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                    Return #{selectedRecord.id.slice(0, 10).toUpperCase()}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Review request details, linked order information, and line items.
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
                      Request status
                    </p>
                    <select
                      value={normalizeStatus(selectedRecord.status)}
                      disabled={actionLoading}
                      onChange={(event) =>
                        void updateStatus(selectedRecord, event.target.value)
                      }
                      className={`mt-2 h-10 w-full rounded-2xl border px-3 text-sm font-semibold outline-none transition ${getStatusSelectClass(
                        selectedRecord.status,
                      )}`}
                    >
                      <option value="REQUESTED">Requested</option>
                      <option value="APPROVED">Approved</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Order total
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
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Reason</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {selectedRecord.reason || "No reason provided."}
                  </p>
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
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Timeline</p>
                  <div className="mt-4 space-y-4">
                    {[
                      {
                        label: "Return requested",
                        date: selectedRecord.createdAt,
                        active: true,
                        tone: "bg-amber-500",
                      },
                      {
                        label: "Request last updated",
                        date: selectedRecord.updatedAt,
                        active: Boolean(selectedRecord.updatedAt),
                        tone: "bg-sky-500",
                      },
                      {
                        label: "Payment reference",
                        date: payment?.paymentDate,
                        active: Boolean(payment?.paymentDate),
                        tone: "bg-emerald-500",
                      },
                    ].map((event, index, array) => (
                      <div key={event.label} className="relative pl-8">
                        {index < array.length - 1 ? (
                          <span className="absolute left-[10px] top-7 h-[calc(100%+0.75rem)] w-px bg-slate-200" />
                        ) : null}
                        <span
                          className={`absolute left-0 top-1 grid h-5 w-5 place-items-center rounded-full ${
                            event.active ? event.tone : "bg-slate-300"
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-white" />
                        </span>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm font-semibold text-slate-900">
                              {event.label}
                            </span>
                            <span className="text-sm text-slate-500">
                              {formatDateTime(event.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5 bg-slate-50 p-6">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Returned items
                    </p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {items.length} items
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {items.length > 0 ? (
                      items.map((item) => {
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
                                  <span>Base {formatMoney(product?.price || 0)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                        No items found for this request.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Admin actions</p>
                  <div className="mt-4 text-sm text-slate-500">
                    Update the request status directly from the status selector to keep the workflow consistent.
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
