"use client";

import { Button, DetailSection, KeyValueGrid, ModalShell, StatusBadge } from "@itech/shared";
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

            <KeyValueGrid
              items={[
                {
                  label: "Promotion",
                  value: selectedCoupon.Promotion?.name || "No promotion",
                },
                {
                  label: "Discount",
                  value: `${selectedCoupon.discountPercentage}% off`,
                },
              ]}
              columnsClassName="grid gap-4 sm:grid-cols-2"
            />

            <DetailSection title="Valid period" className="shadow-sm">
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {selectedCoupon.Promotion
                  ? `${formatDateTime(selectedCoupon.Promotion.startDate)} - ${formatDateTime(selectedCoupon.Promotion.endDate)}`
                  : "No linked promotion"}
              </p>
            </DetailSection>
          </div>

          <div className="space-y-5 bg-slate-50 p-6">
            <DetailSection title="Usage progress" className="shadow-sm">
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
            </DetailSection>

            <DetailSection title="Linked promotion status" className="shadow-sm">
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedCoupon.Promotion ? (
                  <StatusBadge
                    className={statusMeta[normalizeStatus(selectedCoupon.Promotion.status)].tone}
                    dotClassName={statusMeta[normalizeStatus(selectedCoupon.Promotion.status)].chip}
                    withDot
                  >
                    {statusMeta[normalizeStatus(selectedCoupon.Promotion.status)].label}
                  </StatusBadge>
                ) : (
                  <span className="text-sm text-slate-500">No promotion attached.</span>
                )}
              </div>
            </DetailSection>

            <DetailSection title="Quick details" className="shadow-sm">
              <KeyValueGrid
                items={[
                  { label: "Coupon id", value: selectedCoupon.id },
                  { label: "Promotion id", value: selectedCoupon.promotionId },
                ]}
                columnsClassName="grid gap-3"
              />
            </DetailSection>

            <div className="flex justify-end gap-3">
              <Button
                onClick={() => onEdit(selectedCoupon)}
                variant="secondary"
                className="!shadow-none"
              >
                Edit coupon
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}
