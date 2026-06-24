"use client";

import {
  DetailSection,
  KeyValueGrid,
  ModalShell,
  StatusBadge,
} from "@itech/shared";
import {
  formatDateTime,
  getCreatedByLabel,
  getLinkedCoupon,
  normalizeStatus,
  scopeMeta,
  statusMeta,
} from "../helpers";
import type { PromotionDetail, PromotionScopeInfo } from "../types";

type PromotionViewModalProps = {
  open: boolean;
  selectedPromotion: PromotionDetail | null;
  selectedScopeInfo: PromotionScopeInfo | null;
  onClose: () => void;
};

export default function PromotionViewModal({
  open,
  selectedPromotion,
  selectedScopeInfo,
  onClose,
}: PromotionViewModalProps) {
  return (
    <ModalShell
      open={open}
      eyebrow="Promotions"
      title={selectedPromotion?.name ?? "Promotion detail"}
      subtitle="Inspect the real campaign data and applied scope."
      onClose={onClose}
      widthClass="max-w-6xl"
    >
      {selectedPromotion ? (
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5 p-6 lg:border-r lg:border-slate-200">
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100">
              <div className="aspect-[16/9]">
                {selectedPromotion.image ? (
                  <img
                    src={selectedPromotion.image}
                    alt={selectedPromotion.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-slate-400">
                    No banner available
                  </div>
                )}
              </div>
            </div>

            <KeyValueGrid
              items={[
                {
                  label: "Status",
                  value: (
                    <StatusBadge
                      className={statusMeta[normalizeStatus(selectedPromotion.status)].tone}
                      dotClassName={statusMeta[normalizeStatus(selectedPromotion.status)].chip}
                      withDot
                    >
                      {statusMeta[normalizeStatus(selectedPromotion.status)].label}
                    </StatusBadge>
                  ),
                },
                {
                  label: "Scope",
                  value: selectedScopeInfo?.label ?? scopeMeta.ALL.label,
                },
                {
                  label: "Start date",
                  value: formatDateTime(selectedPromotion.startDate),
                },
                {
                  label: "End date",
                  value: formatDateTime(selectedPromotion.endDate),
                },
              ]}
              columnsClassName="grid gap-4 sm:grid-cols-2"
            />

            <DetailSection title="Description" className="bg-slate-50 shadow-none">
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {selectedPromotion.description || "No description provided."}
              </p>
            </DetailSection>

            <KeyValueGrid
              items={[
                {
                  label: "Created by",
                  value: getCreatedByLabel(selectedPromotion),
                },
                {
                  label: "Linked coupon",
                  value: getLinkedCoupon(selectedPromotion)?.code || "No coupon linked",
                },
              ]}
              columnsClassName="grid gap-4 sm:grid-cols-2"
            />
          </div>

          <div className="space-y-5 bg-slate-50 p-6">
            <DetailSection title="Applied products" className="shadow-sm">
              <div className="mt-4 flex flex-wrap gap-2">
                {(selectedPromotion.appliedProducts ?? []).length > 0 ? (
                  selectedPromotion.appliedProducts?.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {item.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">No product-specific links.</span>
                )}
              </div>
            </DetailSection>

            <DetailSection title="Applied categories" className="shadow-sm">
              <div className="mt-4 flex flex-wrap gap-2">
                {(selectedPromotion.appliedCategories ?? []).length > 0 ? (
                  selectedPromotion.appliedCategories?.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {item.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">No category links.</span>
                )}
              </div>
            </DetailSection>

            <DetailSection title="Quick timeline" className="shadow-sm">
              <KeyValueGrid
                items={[
                  {
                    label: "Created",
                    value: formatDateTime(selectedPromotion.createdAt),
                  },
                  {
                    label: "Updated",
                    value: formatDateTime(selectedPromotion.updatedAt),
                  },
                ]}
                columnsClassName="grid gap-3"
              />
            </DetailSection>

            {getLinkedCoupon(selectedPromotion) ? (
              <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-sm">
                <p className="text-sm font-semibold text-white/70">Linked coupon</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {getLinkedCoupon(selectedPromotion)?.code}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {getLinkedCoupon(selectedPromotion)?.discountPercentage}% off, usage{" "}
                  {getLinkedCoupon(selectedPromotion)?.usageCount}/
                  {getLinkedCoupon(selectedPromotion)?.maxUsage}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}
