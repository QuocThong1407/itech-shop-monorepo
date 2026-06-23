"use client";

import { ModalShell } from "@itech/shared";
import { formatDateTime, getCreatedByLabel, getLinkedCoupon, normalizeStatus, scopeMeta, statusMeta } from "../helpers";
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Status
                </p>
                <span
                  className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                    statusMeta[normalizeStatus(selectedPromotion.status)].tone
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      statusMeta[normalizeStatus(selectedPromotion.status)].chip
                    }`}
                  />
                  {statusMeta[normalizeStatus(selectedPromotion.status)].label}
                </span>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Scope
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-950">
                  {selectedScopeInfo?.label ?? scopeMeta.ALL.label}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Start date
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {formatDateTime(selectedPromotion.startDate)}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  End date
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {formatDateTime(selectedPromotion.endDate)}
                </p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Description</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {selectedPromotion.description || "No description provided."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Created by
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {getCreatedByLabel(selectedPromotion)}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Linked coupon
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {getLinkedCoupon(selectedPromotion)?.code || "No coupon linked"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 bg-slate-50 p-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Applied products</p>
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
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Applied categories</p>
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
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Quick timeline</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Created</span>
                  <span className="font-medium text-slate-900">
                    {formatDateTime(selectedPromotion.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Updated</span>
                  <span className="font-medium text-slate-900">
                    {formatDateTime(selectedPromotion.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

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
