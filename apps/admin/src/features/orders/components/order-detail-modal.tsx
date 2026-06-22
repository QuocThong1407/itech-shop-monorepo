"use client";

import Image from "next/image";
import { ModalShell } from "@itech/shared";
import {
  getAvailableStatusOptions,
  formatDateTime,
  formatMoney,
  formatVariantAttributes,
  getPaymentLabel,
  getPaymentTone,
  getStatusLabel,
  getStatusSelectClass,
  normalizePaymentStatus,
  normalizeStatus,
} from "../helpers";
import { statusTabs } from "../constants";
import type { OrderCustomerUser, OrderPayment, OrderRecord } from "../types";

type OrderDetailModalProps = {
  open: boolean;
  actionLoading: boolean;
  selectedOrder: OrderRecord | null;
  customer: OrderCustomerUser | null | undefined;
  payment: OrderPayment | undefined;
  orderItems: NonNullable<OrderRecord["OrderItem"]>;
  selectedAddress: string;
  onClose: () => void;
  onStatusChange: (order: OrderRecord, nextStatus: string) => void;
  onDelete: (order: OrderRecord) => void;
};

export default function OrderDetailModal({
  open,
  actionLoading,
  selectedOrder,
  customer,
  payment,
  orderItems,
  selectedAddress,
  onClose,
  onStatusChange,
  onDelete,
}: OrderDetailModalProps) {
  return (
    <ModalShell
      open={open}
      eyebrow="Admin orders"
      title={
        selectedOrder ? `Order #${selectedOrder.id.slice(0, 8).toUpperCase()}` : "Order detail"
      }
      subtitle="Review customer, payment, delivery address, and line items."
      onClose={onClose}
      widthClass="max-w-6xl"
    >
      {selectedOrder ? (
        <div className="grid gap-0 lg:grid-cols-[1fr_0.98fr]">
          <div className="space-y-5 p-6 lg:border-r lg:border-slate-200">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Status
                </p>
                <select
                  value={normalizeStatus(selectedOrder.status)}
                  disabled={actionLoading}
                  onChange={(event) => onStatusChange(selectedOrder, event.target.value)}
                  className={`mt-2 h-10 w-full rounded-2xl border px-3 text-sm font-semibold outline-none transition ${getStatusSelectClass(
                    selectedOrder.status,
                  )}`}
                >
                  {getAvailableStatusOptions(selectedOrder.status)
                    .map((item) => (
                      <option key={item} value={item}>
                        {getStatusLabel(item)}
                      </option>
                    ))}
                </select>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Total
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
                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getPaymentTone(
                    payment?.status,
                  )}`}
                >
                  {getPaymentLabel(payment?.status)}
                </span>
              </div>
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
                <div className="rounded-2xl bg-slate-50 px-4 py-3 sm:col-span-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Delivery address
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedAddress || "No address"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedOrder.Address?.phoneNumber || "No phone number"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Timeline</p>
              <div className="mt-4 space-y-4">
                {[
                  {
                    label: "Order created",
                    date: selectedOrder.createdAt || selectedOrder.orderDate,
                    active: true,
                    tone: "bg-sky-500",
                  },
                  {
                    label: "Payment processed",
                    date: payment?.paymentDate,
                    active: Boolean(payment?.paymentDate),
                    tone:
                      normalizePaymentStatus(payment?.status) === "SUCCESS"
                        ? "bg-emerald-500"
                        : normalizePaymentStatus(payment?.status) === "FAILED"
                          ? "bg-rose-500"
                          : "bg-amber-500",
                  },
                  {
                    label: "Last status update",
                    date: selectedOrder.updatedAt,
                    active: Boolean(selectedOrder.updatedAt),
                    tone: "bg-indigo-500",
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
                <p className="text-sm font-semibold text-slate-900">Line items</p>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {orderItems.length} items
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {orderItems.length > 0 ? (
                  orderItems.map((item) => {
                    const product = item.ProductVariant?.Product;
                    return (
                      <div
                        key={item.id}
                        className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            {product?.images?.[0] ? (
                              <div className="relative h-full w-full">
                                <Image
                                  src={product.images[0]}
                                  alt={product.name || "Product"}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />
                              </div>
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
                              <span>
                                Adj. {formatMoney(item.ProductVariant?.priceAdjustment || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    No items found for this order.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Admin actions</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {normalizeStatus(selectedOrder.status) === "PENDING" ? (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => onDelete(selectedOrder)}
                    className="h-11 rounded-2xl border border-rose-200 bg-white px-5 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Delete order
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}
