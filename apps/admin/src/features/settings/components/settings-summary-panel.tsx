"use client";

import SettingsSection from "./settings-section";
import { toMoneyOrDash } from "../helpers";
import type { ShippingDraft, SystemConfigsResponse, VatDraft } from "../types";

type SettingsSummaryPanelProps = {
  configs: SystemConfigsResponse | null;
  vatRate: VatDraft;
  shipping: ShippingDraft;
};

export default function SettingsSummaryPanel({
  configs,
  vatRate,
  shipping,
}: SettingsSummaryPanelProps) {
  return (
    <SettingsSection
      title="Current values"
      subtitle="Live backend data reflected in the current configuration."
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-500">VAT</span>
          <span className="text-sm font-semibold text-slate-900">{vatRate.rate}%</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-500">Shipping base fee</span>
          <span className="text-sm font-semibold text-slate-900">
            {toMoneyOrDash(Number(shipping.baseFee || 0))}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-500">Shipping per km</span>
          <span className="text-sm font-semibold text-slate-900">
            {toMoneyOrDash(Number(shipping.feePerKm || 0))}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-500">Tiers loaded</span>
          <span className="text-sm font-semibold text-slate-900">
            {configs?.membership.tiers.length ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-500">Benefits loaded</span>
          <span className="text-sm font-semibold text-slate-900">
            {configs?.membership.benefits.length ?? 0}
          </span>
        </div>
      </div>
    </SettingsSection>
  );
}
