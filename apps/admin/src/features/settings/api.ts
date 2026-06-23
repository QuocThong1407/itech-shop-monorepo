import { apiJson } from "../../lib/admin-api";
import type { SystemConfigsResponse, SystemShippingConfig } from "./types";

export function fetchSystemConfigs() {
  return apiJson<SystemConfigsResponse>("/system", undefined, "/settings");
}

export function fetchShippingFees() {
  return apiJson<SystemShippingConfig[]>("/system/shipping/fees", undefined, "/settings");
}

export function updateVatRate(rate: number, description: string) {
  return apiJson(
    "/system/tax/vat",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rate, description }),
    },
    "/settings",
  );
}

export function updateShippingFee(type: string, payload: Record<string, unknown>) {
  return apiJson(
    `/system/shipping/fees/${type}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "/settings",
  );
}

export function updateMembershipTier(tierName: string, payload: Record<string, unknown>) {
  return apiJson(
    `/system/membership/tiers/${tierName}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "/settings",
  );
}

export function updateMembershipBenefit(tierName: string, payload: Record<string, unknown>) {
  return apiJson(
    `/system/membership/benefits/${tierName}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "/settings",
  );
}
