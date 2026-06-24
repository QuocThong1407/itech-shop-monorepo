"use client";

import {
  DetailSection,
  EmptyState,
  KeyValueGrid,
  ModalShell,
  StatusBadge,
  StatusSelect,
} from "@itech/shared";
import {
  formatDateTime,
  formatMoney,
  formatVariantAttributes,
  getStatusSelectClass,
  normalizeStatus,
  getPaymentLabel,
  getPaymentTone,
} from "../helpers";
import { tabs } from "../constants";
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
                <StatusSelect
                  value={normalizeStatus(selectedRecord.status)}
                  disabled={actionLoading}
                  onChange={(event) => onStatusChange(selectedRecord, event.target.value)}
                  options={tabs
                    .filter((item) => item !== "ALL")
                    .map((item) => ({
                      value: item,
                      label: item.charAt(0) + item.slice(1).toLowerCase(),
                    }))}
                  toneClassName={getStatusSelectClass(selectedRecord.status)}
                  className="!mt-2 !h-10 !w-full !rounded-2xl !px-3 !py-2 !font-semibold"
                />
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Order total
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
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
                <StatusBadge className={`mt-2 ${getPaymentTone(payment?.status)}`}>
                  {getPaymentLabel(payment?.status)}
                </StatusBadge>
              </div>
            </div>

            <DetailSection title="Reason" className="shadow-sm">
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {selectedRecord.reason || "No reason provided."}
              </p>
            </DetailSection>

            <DetailSection title="Customer information" className="shadow-sm">
              <KeyValueGrid
                items={[
                  { label: "Name", value: customer?.username || "Guest" },
                  { label: "Email", value: customer?.email || "No email" },
                ]}
                columnsClassName="grid gap-4 sm:grid-cols-2"
              />
            </DetailSection>

            <DetailSection title="Timeline" className="shadow-sm">
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
            </DetailSection>
          </div>

          <div className="space-y-5 bg-slate-50 p-6">
            <DetailSection
              title="Cancelled items"
              className="shadow-sm"
              actions={
                <StatusBadge
                  tone="neutral"
                  className="bg-slate-100 text-slate-600 ring-slate-200"
                >
                  {items.length} items
                </StatusBadge>
              }
            >
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
                  <EmptyState title="No items found for this request." />
                )}
              </div>
            </DetailSection>

            <DetailSection title="Admin actions" className="shadow-sm">
              <div className="mt-4 text-sm text-slate-500">
                Update the request status directly from the status selector to keep the workflow
                consistent.
              </div>
            </DetailSection>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}
