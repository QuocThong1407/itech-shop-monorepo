import type { BenefitDraft, SettingsTab, ShippingDraft, VatDraft } from "./types";

export const tierOrder = ["BRONZE", "SILVER", "GOLD"] as const;

export const settingsTabs: Array<{ key: SettingsTab; label: string }> = [
  { key: "general", label: "General (VAT & Shipping)" },
  { key: "membership", label: "Membership" },
];

export const emptyVatDraft: VatDraft = {
  rate: "",
  description: "",
};

export const emptyShippingDraft: ShippingDraft = {
  baseFee: "",
  feePerKm: "",
  freeShippingThreshold: "",
  maxDistance: "",
  description: "",
};

export const emptyBenefitDraft: BenefitDraft = {
  discountPercentage: "0",
  freeShipping: false,
  prioritySupport: false,
  earlyAccess: false,
};
