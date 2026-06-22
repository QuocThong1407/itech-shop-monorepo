"use client";

import { ModalShell } from "@itech/shared";
import { formatDateTime, getUsageProgress, normalizeStatus, statusMeta } from "../helpers";
import type { CouponRecord } from "../types";

type CouponViewModalProps = {
  open: boolean;
  selectedCoupon: CouponRecord | null;
  onClose: () => void;
  onEdit: (coupon: CouponRecord) => void;
};

export default function CouponViewModal({
  open,
  selectedCoupon,
  onClose,
  onEdit,
}: CouponViewModalProps) {
  const progress = selectedCoupon ? getUsageProgress(selectedCoupon) : 0;

  return (
    <ModalShell
      open={open}
      eyebrow="Coupons"
      title={selectedCoupon?.code ?? "Coupon detail"}
      subtitle="Inspect coupon usage and linked promotion details."
      onClose={onClose}
      widthClass="max-w-5xl"
    >
      {selectedCoupon ? (
        <div className="grid gap-0 lg:grid-cols-[0.96fr_1.04fr]">
          <div className="space-y-5 p-6 lg:border-r lg:border-slate-200">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-white/50">Coupon code</p>
              <p className="mt-3 text-3xl font-semibold tracking-[0.18em]">
                {selectedCoupon.code}
              </p>
              <p className="mt-4 text-sm text-white/70">
                {selectedCoupon.discountPercentage}% discount with a max usage of{" "}
                {selectedCoupon.maxUsage}.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Promotion
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {selectedCoupon.Promotion?.name || "No promotion"}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Discount
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {selectedCoupon.discountPercentage}% off
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Valid period
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {selectedCoupon.Promotion
                  ? `${formatDateTime(selectedCoupon.Promotion.startDate)} - ${formatDateTime(selectedCoupon.Promotion.endDate)}`
                  : "No linked promotion"}
              </p>
            </div>
          </div>

          <div className="space-y-5 bg-slate-50 p-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Usage progress</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{selectedCoupon.usageCount} used</span>
                  <span>{selectedCoupon.maxUsage} max</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#008ECC]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Linked promotion status</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedCoupon.Promotion ? (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                      statusMeta[normalizeStatus(selectedCoupon.Promotion.status)].tone
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        statusMeta[normalizeStatus(selectedCoupon.Promotion.status)].chip
                      }`}
                    />
                    {statusMeta[normalizeStatus(selectedCoupon.Promotion.status)].label}
                  </span>
                ) : (
                  <span className="text-sm text-slate-500">No promotion attached.</span>
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Quick details</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Created from coupon id</span>
                  <span className="font-medium text-slate-900">{selectedCoupon.id}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Promotion id</span>
                  <span className="font-medium text-slate-900">{selectedCoupon.promotionId}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => onEdit(selectedCoupon)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Edit coupon
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}
