"use client";

import SettingsSection from "./settings-section";
import { LabeledNumber } from "./settings-fields";
import type { Dispatch, SetStateAction } from "react";
import type { ShippingDraft, VatDraft } from "../types";

type GeneralSettingsPanelProps = {
  vatRate: VatDraft;
  shipping: ShippingDraft;
  setVatRate: Dispatch<SetStateAction<VatDraft>>;
  setShipping: Dispatch<SetStateAction<ShippingDraft>>;
};

export default function GeneralSettingsPanel({
  vatRate,
  shipping,
  setVatRate,
  setShipping,
}: GeneralSettingsPanelProps) {
  return (
    <>
      <SettingsSection
        title="VAT configuration"
        subtitle="This value is stored in the system parameter table and used across reports and checkout."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <LabeledNumber
            label="VAT rate (%)"
            value={vatRate.rate}
            onChange={(value) => setVatRate((current) => ({ ...current, rate: value }))}
            placeholder="10"
          />
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Description
            </span>
            <textarea
              value={vatRate.description}
              onChange={(event) =>
                setVatRate((current) => ({ ...current, description: event.target.value }))
              }
              rows={1}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              placeholder="Optional notes for the VAT policy"
            />
          </label>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Shipping configuration"
        subtitle="Edit the standard shipping policy used by the storefront."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <LabeledNumber
            label="Base fee"
            value={shipping.baseFee}
            onChange={(value) => setShipping((current) => ({ ...current, baseFee: value }))}
            placeholder="30000"
          />
          <LabeledNumber
            label="Fee per km"
            value={shipping.feePerKm}
            onChange={(value) => setShipping((current) => ({ ...current, feePerKm: value }))}
            placeholder="5000"
          />
          <LabeledNumber
            label="Free shipping threshold"
            value={shipping.freeShippingThreshold}
            onChange={(value) =>
              setShipping((current) => ({ ...current, freeShippingThreshold: value }))
            }
            placeholder="500000"
          />
          <LabeledNumber
            label="Max distance"
            value={shipping.maxDistance}
            onChange={(value) => setShipping((current) => ({ ...current, maxDistance: value }))}
            placeholder="20"
          />
          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Description
            </span>
            <textarea
              value={shipping.description}
              onChange={(event) =>
                setShipping((current) => ({ ...current, description: event.target.value }))
              }
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              placeholder="Optional notes for the shipping policy"
            />
          </label>
        </div>
      </SettingsSection>
    </>
  );
}
