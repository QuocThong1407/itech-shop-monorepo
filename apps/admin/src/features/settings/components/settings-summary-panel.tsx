"use client";

import { KeyValueGrid } from "@itech/shared";
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
      <KeyValueGrid
        items={[
          { label: "VAT", value: `${vatRate.rate}%` },
          {
            label: "Shipping base fee",
            value: toMoneyOrDash(Number(shipping.baseFee || 0)),
          },
          {
            label: "Shipping per km",
            value: toMoneyOrDash(Number(shipping.feePerKm || 0)),
          },
          {
            label: "Tiers loaded",
            value: configs?.membership.tiers.length ?? 0,
          },
          {
            label: "Benefits loaded",
            value: configs?.membership.benefits.length ?? 0,
          },
        ]}
        columnsClassName="grid gap-3"
      />
    </SettingsSection>
  );
}
