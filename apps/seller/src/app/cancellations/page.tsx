"use client";

import { useEffect, useMemo, useState } from "react";
import { apiJson, formatDateTime, formatMoney } from "../../lib/seller-api";

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

type CancellationRecord = {
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
    }>;
  };
};

type CancellationsResponse = {
  cancellations: CancellationRecord[];
};

const tabs = ["ALL", "REQUESTED", "APPROVED", "COMPLETED", "REJECTED"] as const;

function normalizeStatus(value?: string) {
  return (value || "UNKNOWN").toUpperCase();
}

function getStatusTone(status?: string) {
  switch (normalizeStatus(status)) {
    case "REQUESTED":
    case "PENDING":
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

function getSearchText(record: CancellationRecord) {
  const customer = record.Order?.Customer?.User;
  const payment = record.Order?.Payment?.[0];
  const items = record.Order?.OrderItem || [];

  return [
    record.id,
    record.reason,
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
      className={`rounded-[1.5rem] border p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] ${className}`}
    >
      <p className="text-xs uppercase tracking-[0.2em] opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </article>
  );
}

export default function SellerCancellationsPage() {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("ALL");
  const [records, setRecords] = useState<CancellationRecord[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<CancellationRecord | null>(null);

  const loadCancellations = async () => {
    setLoading(true);
    try {
      const result = await apiJson<CancellationsResponse>(
        "/cancellations?page=1&limit=1000",
      );
      setRecords(result.cancellations || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCancellations();
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
      if (status === "REQUESTED" || status === "PENDING")
        summary.requested += 1;
      else if (status === "APPROVED") summary.approved += 1;
      else if (status === "COMPLETED") summary.completed += 1;
      else if (status === "REJECTED") summary.rejected += 1;
    }

    return summary;
  }, [records]);

  const visibleRecords = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return records.filter((record) => {
      const matchesTab =
        activeTab === "ALL" || normalizeStatus(record.status) === activeTab;
      const matchesSearch =
        keyword.length === 0 || getSearchText(record).includes(keyword);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, records, searchText]);

  const updateStatus = async (
    record: CancellationRecord,
    nextStatus: string,
  ) => {
    const confirm = window.confirm(
      `Update cancellation request to ${getStatusLabel(nextStatus)}?`,
    );
    if (!confirm) return;

    try {
      await apiJson(`/cancellations/${record.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadCancellations();
    } catch (error) {
      console.error(error);
      window.alert("Failed to update cancellation status");
    }
  };

  const handleView = async (record: CancellationRecord) => {
    setLoading(true);
    try {
      const detail = await apiJson<CancellationRecord>(
        `/cancellations/${record.id}`,
      );
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
  const status = normalizeStatus(selectedRecord?.status);

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-amber-100 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                Seller cancellations
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Cancellation Requests
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Review cancellation requests, approve or reject them, and
                  complete the workflow when order stock needs to be restored.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total"
            value={stats.total}
            className="border-slate-200 bg-white"
          />
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
          <div className="border-b border-slate-200 px-5 pt-5 pb-3">
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
                        ? "bg-amber-600 text-white shadow-[0_10px_24px_rgba(245,158,11,0.18)]"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab === "ALL" ? "All" : getStatusLabel(tab)}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => void loadCancellations()}
                className="inline-flex ml-auto h-11 items-center justify-center rounded-2xl bg-amber-600 px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(245,158,11,0.18)] transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search request id, customer, reason, product..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-100 lg:max-w-md"
            />
            <div className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {visibleRecords.length}
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
                    <th className="w-[24%] px-4 py-3">Customer</th>
                    <th className="w-[18%] px-4 py-3">Created</th>
                    <th className="w-[14%] px-4 py-3">Status</th>
                    <th className="w-[26%] px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {visibleRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-sm text-slate-500"
                      >
                        No cancellation requests found.
                      </td>
                    </tr>
                  ) : (
                    visibleRecords.map((record) => {
                      const user = record.Order?.Customer?.User;
                      const recordStatus = normalizeStatus(record.status);
                      const finalStatus =
                        recordStatus === "REJECTED" ||
                        recordStatus === "COMPLETED";

                      return (
                        <tr key={record.id} className="align-top">
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="font-mono text-sm font-semibold text-slate-900">
                                Cancel #{record.id.slice(0, 10).toUpperCase()}
                              </div>
                              <div className="text-xs text-slate-500">
                                {formatDateTime(record.createdAt)}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">
                                {user?.username || "Unknown customer"}
                              </div>
                              <div className="truncate text-xs text-slate-500">
                                {user?.email || "-"}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 align-middle">
                            {formatDateTime(record.createdAt)}
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <div
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusTone(recordStatus)}`}
                            >
                              {getStatusLabel(recordStatus)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => void handleView(record)}
                                className="inline-flex h-10 items-center justify-center rounded-2xl border border-amber-200 bg-white px-4 text-sm font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-50"
                              >
                                View
                              </button>

                              {!finalStatus && recordStatus === "REQUESTED" ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void updateStatus(record, "APPROVED")
                                    }
                                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void updateStatus(record, "REJECTED")
                                    }
                                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-500"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : null}

                              {!finalStatus && recordStatus === "APPROVED" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void updateStatus(record, "COMPLETED")
                                  }
                                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-500"
                                >
                                  Complete
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
          </div>
        </section>
      </div>

      {detailOpen && selectedRecord ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.25)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 text-center">
              <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
                Cancellation request
              </h3>
              <p className="text-sm text-slate-500">#{selectedRecord.id}</p>
              <div className="flex justify-center">
                <div
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusTone(selectedRecord.status)}`}
                >
                  {getStatusLabel(selectedRecord.status)}
                </div>
              </div>
            </div>

            <section className="mt-5 rounded-[1.5rem] border border-slate-200 p-4">
              <div className="mb-3 text-sm font-semibold text-slate-900">
                Customer
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div>
                  <span className="font-semibold text-slate-900">
                    Username:
                  </span>{" "}
                  {customer?.username || "N/A"}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Email:</span>{" "}
                  {customer?.email || "N/A"}
                </div>
              </div>
            </section>

            <section className="mt-4 rounded-[1.5rem] border border-slate-200 p-4">
              <div className="mb-3 text-sm font-semibold text-slate-900">
                Cancellation reason
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {selectedRecord.reason || "-"}
              </div>
            </section>

            <section className="mt-4 rounded-[1.5rem] border border-slate-200 p-4">
              <div className="mb-3 text-sm font-semibold text-slate-900">
                Order information
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Order date
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {formatDateTime(selectedRecord.Order?.orderDate)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Order status
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedRecord.Order?.status || "UNKNOWN"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Payment method
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {payment?.method || "N/A"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Amount
                  </p>
                  <p className="mt-2 text-sm font-semibold text-amber-600">
                    {formatMoney(payment?.amount || 0)}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-4 rounded-[1.5rem] border border-slate-200 p-4">
              <div className="mb-3 text-sm font-semibold text-slate-900">
                Ordered items ({items.length})
              </div>
              <div className="space-y-3">
                {items.map((item) => {
                  const product = item.ProductVariant?.Product;
                  const image = product?.images?.[0];
                  const price =
                    (product?.price || 0) +
                    (item.ProductVariant?.priceAdjustment || 0);

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                          {image ? (
                            <img
                              src={image}
                              alt={product?.name || "Product"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-xs text-slate-400">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">
                            {product?.name || "Product"}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {Object.entries(
                              item.ProductVariant?.variantAttributes || {},
                            ).map(([key, value]) => (
                              <span
                                key={key}
                                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                              >
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                          <div className="mt-2 text-sm text-slate-500">
                            Qty {item.quantity} x {formatMoney(price)}
                          </div>
                        </div>
                      </div>

                      <div className="text-sm font-semibold text-slate-900">
                        {formatMoney(price * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
