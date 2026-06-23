"use client";

import { ModalShell } from "@itech/shared";
import { findPromotionById, formatDateTime, normalizeStatus, promotionStatusLabels, statusMeta } from "../helpers";
import type { CouponDraft, CouponRecord, PromotionOption, ViewMode } from "../types";

type CouponFormModalProps = {
  viewMode: ViewMode;
  draft: CouponDraft;
  promotions: PromotionOption[];
  editingId: string | null;
  selectedCoupon: CouponRecord | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onDraftChange: React.Dispatch<React.SetStateAction<CouponDraft>>;
};

export default function CouponFormModal({
  viewMode,
  draft,
  promotions,
  editingId,
  selectedCoupon,
  saving,
  onClose,
  onSubmit,
  onDraftChange,
}: CouponFormModalProps) {
  const open = viewMode === "add" || viewMode === "edit";
  const selectedPromotion = findPromotionById(promotions, draft.promotionId);

  return (
    <ModalShell
      open={open}
      eyebrow="Coupons"
      title={viewMode === "add" ? "Create coupon" : "Edit coupon"}
      subtitle="Link a coupon to a promotion and configure its usage limit."
      onClose={onClose}
      widthClass="max-w-4xl"
    >
      <div className="grid gap-0 lg:grid-cols-[1fr_0.82fr]">
        <div className="space-y-5 p-6 lg:border-r lg:border-slate-200">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Coupon code</span>
            <input
              value={draft.code}
              onChange={(event) =>
                onDraftChange((current) => ({
                  ...current,
                  code: event.target.value,
                }))
              }
              placeholder="SUMMER25"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase tracking-[0.2em] outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Linked promotion</span>
            <select
              value={draft.promotionId}
              onChange={(event) =>
                onDraftChange((current) => ({
                  ...current,
                  promotionId: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            >
              <option value="">Select a promotion</option>
              {promotions.map((promotion) => (
                <option key={promotion.id} value={promotion.id}>
                  {promotion.name} - {promotionStatusLabels[normalizeStatus(promotion.status)]}
                </option>
              ))}
            </select>
            <p className="text-xs leading-5 text-slate-500">
              Coupon timing and availability follow the selected promotion.
            </p>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Discount percentage</span>
              <input
                type="number"
                min={1}
                max={100}
                value={draft.discountPercentage}
                onChange={(event) =>
                  onDraftChange((current) => ({
                    ...current,
                    discountPercentage: event.target.value,
                  }))
                }
                placeholder="25"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Max usage</span>
              <input
                type="number"
                min={1}
                value={draft.maxUsage}
                onChange={(event) =>
                  onDraftChange((current) => ({
                    ...current,
                    maxUsage: event.target.value,
                  }))
                }
                placeholder="100"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </label>
          </div>

          {editingId && selectedCoupon ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Current usage</p>
              <p className="mt-2 text-sm text-slate-600">
                {selectedCoupon.usageCount} / {selectedCoupon.maxUsage} uses consumed.
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-5 bg-slate-50 p-6">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Live preview</p>
            <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.24em] text-white/50">Coupon code</p>
              <p className="mt-2 text-2xl font-semibold tracking-[0.18em]">
                {draft.code || "CODE"}
              </p>
              <div className="mt-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">Discount</p>
                  <p className="mt-1 text-lg font-semibold">{draft.discountPercentage || "0"}% off</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium">
                  {draft.maxUsage || "0"} max usage
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Selected promotion</p>
            <div className="mt-4 rounded-[1.5rem] bg-slate-50 p-4">
              {draft.promotionId ? (
                selectedPromotion ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedPromotion.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(selectedPromotion.startDate)} -{" "}
                          {formatDateTime(selectedPromotion.endDate)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
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
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Promotion not found.</p>
                )
              ) : (
                <p className="text-sm text-slate-500">Choose a promotion to preview it here.</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={saving}
              className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : viewMode === "add" ? "Create coupon" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
