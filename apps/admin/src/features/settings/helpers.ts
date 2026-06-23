import { formatMoney } from "../../lib/admin-api";
import type {
  BenefitDraft,
  MembershipBenefitValue,
  MembershipTierValue,
  ShippingFeeValue,
  SystemBenefitConfig,
  SystemShippingConfig,
  SystemTierConfig,
} from "./types";

export function getKeySuffix(key: string | undefined | null) {
  if (!key) return "";
  const parts = key.split("_");
  return parts[parts.length - 1] || "";
}

export function getTierValue(tier: Pick<SystemTierConfig, "value" | "config"> | undefined) {
  return tier?.value ?? tier?.config ?? { min: 0, max: null, name: "" };
}

export function getBenefitValue(
  benefit: Pick<SystemBenefitConfig, "benefits" | "value"> | undefined,
): MembershipBenefitValue {
  return (
    benefit?.benefits ??
    benefit?.value ?? {
      discountPercentage: 0,
      freeShipping: false,
      prioritySupport: false,
      earlyAccess: false,
    }
  );
}

export function getShippingValue(
  fee: Pick<SystemShippingConfig, "value" | "config"> | null | undefined,
): ShippingFeeValue {
  if (typeof fee?.value === "number") {
    return {
      baseFee: fee.value,
      feePerKm: 0,
      freeShippingThreshold: null,
      maxDistance: null,
    };
  }

  return (
    fee?.value ??
    fee?.config ?? {
      baseFee: 0,
      feePerKm: 0,
      freeShippingThreshold: null,
      maxDistance: null,
    }
  );
}

export function getStandardShippingConfig(fees: SystemShippingConfig[] = []) {
  return (
    fees.find((item) => item.key === "SHIPPING_STANDARD") ??
    fees.find((item) => item.key === "SHIPPING_FEE_STANDARD") ??
    fees.find((item) => (item.type ?? getKeySuffix(item.key)) === "STANDARD") ??
    fees.find((item) => getKeySuffix(item.key) === "STANDARD") ??
    null
  );
}

export function createTierDraft(value: MembershipTierValue | undefined) {
  return {
    min: String(value?.min ?? 0),
    max: value?.max == null ? "" : String(value.max),
  };
}

export function createBenefitDraft(value: MembershipBenefitValue | undefined): BenefitDraft {
  return {
    discountPercentage: String(value?.discountPercentage ?? 0),
    freeShipping: Boolean(value?.freeShipping),
    prioritySupport: Boolean(value?.prioritySupport),
    earlyAccess: Boolean(value?.earlyAccess),
  };
}

export function toMoneyOrDash(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "-";
  return formatMoney(value);
}
