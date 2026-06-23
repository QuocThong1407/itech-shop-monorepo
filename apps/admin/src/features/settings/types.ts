export type MembershipTierValue = {
  min: number;
  max: number | null;
  name: string;
};

export type MembershipBenefitValue = {
  discountPercentage: number;
  freeShipping: boolean;
  prioritySupport: boolean;
  earlyAccess: boolean;
};

export type ShippingFeeValue = {
  baseFee: number;
  feePerKm: number;
  freeShippingThreshold: number | null;
  maxDistance: number | null;
};

export type SystemTierConfig = {
  id: string;
  key: string;
  name?: string;
  value?: MembershipTierValue;
  config?: MembershipTierValue;
  description?: string | null;
};

export type SystemBenefitConfig = {
  id: string;
  key: string;
  tier?: string;
  benefits?: MembershipBenefitValue;
  value?: MembershipBenefitValue;
  description?: string | null;
};

export type SystemVatConfig = {
  id: string;
  key: string;
  value: { rate: number };
  description?: string | null;
} | null;

export type SystemShippingConfig = {
  id: string;
  key: string;
  type?: string;
  value?: ShippingFeeValue | number;
  config?: ShippingFeeValue;
  description?: string | null;
};

export type SystemConfigsResponse = {
  membership: {
    tiers: SystemTierConfig[];
    benefits: SystemBenefitConfig[];
  };
  tax: {
    vat: SystemVatConfig;
  };
  shipping: {
    fees: SystemShippingConfig[];
  };
};

export type TierDraft = {
  min: string;
  max: string;
};

export type BenefitDraft = {
  discountPercentage: string;
  freeShipping: boolean;
  prioritySupport: boolean;
  earlyAccess: boolean;
};

export type ShippingDraft = {
  baseFee: string;
  feePerKm: string;
  freeShippingThreshold: string;
  maxDistance: string;
  description: string;
};

export type VatDraft = {
  rate: string;
  description: string;
};

export type SettingsTab = "general" | "membership";
