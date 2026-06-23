"use client";

import { ModalShell } from "@itech/shared";
import {
  formatDateTime,
  formatMoney,
  formatVariantAttributes,
  getStatusLabel,
  getStatusSelectClass,
  normalizeStatus,
} from "../helpers";
import type {
  CancellationCustomerUser,
  CancellationPayment,
  CancellationRecord,
} from "../types";

type CancellationDetailModalProps = {
  open: boolean;
  actionLoading: boolean;
  selectedRecord: CancellationRecord | null;
  customer: CancellationCustomerUser | undefined;
  payment: CancellationPayment | undefined;
  items: NonNullable<NonNullable<CancellationRecord["Order"]>["OrderItem"]>;
  onClose: () => void;
  onStatusChange: (record: CancellationRecord, nextStatus: string) => void;
};

export default function CancellationDetailModal({
  open,
  actionLoading,
  selectedRecord,
  customer,
  payment,
  items,
  onClose,
  onStatusChange,
}: CancellationDetailModalProps) {
  return (
    <ModalShell
      open={open}
      eyebrow="Admin cancellations"
      title={
        selectedRecord
          ? `Cancellation #${selectedRecord.id.slice(0, 10).toUpperCase()}`
          : "Cancellation detail"
      }
      subtitle="Review request details, linked order information, and line items."
      onClose={onClose}
      widthClass="max-w-6xl"
    >
      {selectedRecord ? (
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
                  onChange={(event) => onStatusChange(selectedRecord, event.target.value)}
                  className={`mt-2 h-10 w-full rounded-2xl border px-3 text-sm font-semibold outline-none transition ${getStatusSelectClass(
                    selectedRecord.status,
                  )}`}
                >
                  {["REQUESTED", "APPROVED", "COMPLETED", "REJECTED"].map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
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
              <p className="text-sm font-semibold text-slate-900">Customer information</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Name</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {customer?.username || "Guest"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Email</p>
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
                    label: "Cancellation requested",
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
                        <span className="text-sm font-semibold text-slate-900">{event.label}</span>
                        <span className="text-sm text-slate-500">{formatDateTime(event.date)}</span>
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
                <p className="text-sm font-semibold text-slate-900">Cancelled items</p>
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
                              {formatVariantAttributes(item.ProductVariant?.variantAttributes)}
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
                Update the request status directly from the status selector to keep the workflow
                consistent.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}
