"use client";

import Image from "next/image";
import {
  Button,
  DetailSection,
  EmptyState,
  KeyValueGrid,
  ModalShell,
  StatusBadge,
  StatusSelect,
} from "@itech/shared";
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
                <StatusSelect
                  value={normalizeStatus(selectedOrder.status)}
                  disabled={actionLoading}
                  onChange={(event) => onStatusChange(selectedOrder, event.target.value)}
                  options={getAvailableStatusOptions(selectedOrder.status).map((item) => ({
                    value: item,
                    label: getStatusLabel(item),
                  }))}
                  className={`!mt-2 !h-10 !w-full !rounded-2xl !px-3 !py-2 !text-sm !font-semibold ${getStatusSelectClass(
                    selectedOrder.status,
                  )}`}
                />
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Total
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
                <StatusBadge
                  className={`mt-2 ${getPaymentTone(payment?.status)}`}
                >
                  {getPaymentLabel(payment?.status)}
                </StatusBadge>
              </div>
            </div>

            <DetailSection title="Customer information" className="shadow-sm">
              <KeyValueGrid
                items={[
                  { label: "Name", value: customer?.username || "Guest" },
                  { label: "Email", value: customer?.email || "No email" },
                  {
                    label: "Delivery address",
                    value: selectedAddress || "No address",
                  },
                  { label: "Phone Number", value: selectedOrder.Address?.phoneNumber || "No phone number" },
                ]}
                itemClassName="sm:col-span-1"
                columnsClassName="grid gap-4 sm:grid-cols-2"
              />
            </DetailSection>

            <DetailSection title="Timeline" className="shadow-sm">
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
            </DetailSection>
          </div>

          <div className="space-y-5 bg-slate-50 p-6">
            <DetailSection
              title="Line items"
              className="shadow-sm"
              actions={
                <StatusBadge tone="neutral" className="bg-slate-100 text-slate-600 ring-slate-200">
                  {orderItems.length} items
                </StatusBadge>
              }
            >
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
                  <EmptyState title="No items found for this order." />
                )}
              </div>
            </DetailSection>

            <DetailSection title="Admin actions" className="shadow-sm">
              <div className="mt-4 flex flex-wrap gap-3">
                {normalizeStatus(selectedOrder.status) === "PENDING" ? (
                  <Button
                    disabled={actionLoading}
                    onClick={() => onDelete(selectedOrder)}
                    variant="secondary"
                    className="!border-rose-200 !bg-rose-50 !text-rose-700 !shadow-none hover:!border-rose-300 hover:!bg-rose-100"
                  >
                    Delete order
                  </Button>
                ) : null}
              </div>
            </DetailSection>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}
