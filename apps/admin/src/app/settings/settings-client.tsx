"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { apiJson, formatMoney } from "../../lib/admin-api";

type SystemConfigsResponse = {
  membership: {
    tiers: Array<{
      id: string;
      key: string;
      name?: string;
      value?: { min: number; max: number | null; name: string };
      config?: { min: number; max: number | null; name: string };
      description?: string | null;
    }>;
    benefits: Array<{
      id: string;
      key: string;
      tier?: string;
      benefits?: {
        discountPercentage: number;
        freeShipping: boolean;
        prioritySupport: boolean;
        earlyAccess: boolean;
      };
      value?: {
        discountPercentage: number;
        freeShipping: boolean;
        prioritySupport: boolean;
        earlyAccess: boolean;
      };
      description?: string | null;
    }>;
  };
  tax: {
    vat: {
      id: string;
      key: string;
      value: { rate: number };
      description?: string | null;
    } | null;
  };
  shipping: {
    fees: Array<{
      id: string;
      key: string;
      type?: string;
      value?: {
        baseFee: number;
        feePerKm: number;
        freeShippingThreshold: number | null;
        maxDistance: number | null;
      };
      config?: {
        baseFee: number;
        feePerKm: number;
        freeShippingThreshold: number | null;
        maxDistance: number | null;
      };
      description?: string | null;
    }>;
  };
};

type TierDraft = {
  min: string;
  max: string;
};

type BenefitDraft = {
  discountPercentage: string;
  freeShipping: boolean;
  prioritySupport: boolean;
  earlyAccess: boolean;
};

type ShippingDraft = {
  baseFee: string;
  feePerKm: string;
  freeShippingThreshold: string;
  maxDistance: string;
  description: string;
};

type VatDraft = {
  rate: string;
  description: string;
};

const tierOrder = ["BRONZE", "SILVER", "GOLD"] as const;

function getKeySuffix(key: string | undefined | null) {
  if (!key) return "";
  const parts = key.split("_");
  return parts[parts.length - 1] || "";
}

function getTierValue(
  tier:
    | {
        value?: { min: number; max: number | null; name: string };
        config?: { min: number; max: number | null; name: string };
      }
    | undefined,
) {
  return tier?.value ?? tier?.config ?? { min: 0, max: null, name: "" };
}

function getBenefitValue(
  benefit:
    | {
        benefits?: {
          discountPercentage: number;
          freeShipping: boolean;
          prioritySupport: boolean;
          earlyAccess: boolean;
        };
        value?: {
          discountPercentage: number;
          freeShipping: boolean;
          prioritySupport: boolean;
          earlyAccess: boolean;
        };
      }
    | undefined,
) {
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

function getShippingValue(
  fee:
    | {
        value?:
          | {
              baseFee: number;
              feePerKm: number;
              freeShippingThreshold: number | null;
              maxDistance: number | null;
            }
          | number;
        config?: {
          baseFee: number;
          feePerKm: number;
          freeShippingThreshold: number | null;
          maxDistance: number | null;
        };
      }
    | null
    | undefined,
) {
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

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="mb-6">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
      />
    </label>
  );
}

function LabeledNumber({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
      />
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? "bg-[#008ECC]" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}

function toMoneyOrDash(value: number | null | undefined) {
  if (value == null) return "-";
  return formatMoney(value);
}

export default function SettingsClient() {
  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingMembership, setSavingMembership] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "membership">("general");
  const [configs, setConfigs] = useState<SystemConfigsResponse | null>(null);
  const [vatRate, setVatRate] = useState<VatDraft>({
    rate: "",
    description: "",
  });;
  const [shipping, setShipping] = useState<ShippingDraft>({
    baseFee: "",
    feePerKm: "",
    freeShippingThreshold: "",
    maxDistance: "",
    description: "",
  });
  const [tierDrafts, setTierDrafts] = useState<Record<string, TierDraft>>({});
  const [benefitDrafts, setBenefitDrafts] = useState<Record<string, BenefitDraft>>({});

  const shippingStandard = useMemo(() => {
    const fees = configs?.shipping.fees ?? [];
    return (
      fees.find((item) => item.key === "SHIPPING_STANDARD") ??
      fees.find((item) => item.key === "SHIPPING_FEE_STANDARD") ??
      fees.find((item) => (item.type ?? getKeySuffix(item.key)) === "STANDARD") ??
      null
    );
  }, [configs]);

  const tierRows = useMemo(() => {
    const source = configs?.membership.tiers ?? [];
    return tierOrder.map((tierName) => {
      const item =
        source.find((tier) => (tier.name ?? getKeySuffix(tier.key)) === tierName) ?? null;
      return {
        tierName,
        item,
        draft: tierDrafts[tierName] ?? { min: "", max: "" },
      };
    });
  }, [configs, tierDrafts]);

  const benefitRows = useMemo(() => {
    const source = configs?.membership.benefits ?? [];
    return tierOrder.map((tierName) => {
      const item =
        source.find((benefit) => (benefit.tier ?? getKeySuffix(benefit.key)) === tierName) ??
        null;
      return {
        tierName,
        item,
        draft:
          benefitDrafts[tierName] ??
          ({
            discountPercentage: "0",
            freeShipping: false,
            prioritySupport: false,
            earlyAccess: false,
          } satisfies BenefitDraft),
      };
    });
  }, [configs, benefitDrafts]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiJson<SystemConfigsResponse>("/system", undefined, "/settings");
      setConfigs(response);

      const vat = response.tax.vat?.value.rate ?? 10;
      setVatRate({ rate: String(vat), description: response.tax.vat?.description ?? "" });

      const shippingResponse = await apiJson<SystemConfigsResponse["shipping"]["fees"]>(
        "/system/shipping/fees",
        undefined,
        "/settings",
      );
      const standardConfig =
        shippingResponse.find(
          (item) => item.key === "SHIPPING_STANDARD",
        ) ??
        shippingResponse.find((item) => item.key === "SHIPPING_FEE_STANDARD") ??
        shippingResponse.find(
          (item) => (item.type ?? getKeySuffix(item.key)) === "STANDARD",
        ) ??
        shippingResponse.find((item) => getKeySuffix(item.key) === "STANDARD") ??
        null;
      const standardValue = getShippingValue(standardConfig);
      setShipping({
        baseFee: standardConfig ? String(standardValue.baseFee) : "",
        feePerKm: standardConfig ? String(standardValue.feePerKm) : "",
        freeShippingThreshold:
          standardValue.freeShippingThreshold != null
            ? String(standardValue.freeShippingThreshold)
            : "",
        maxDistance:
          standardValue.maxDistance != null ? String(standardValue.maxDistance) : "",
        description: standardConfig?.description ?? "",
      });

      const tierMap: Record<string, TierDraft> = {};
      response.membership.tiers.forEach((tier) => {
        const tierValue = getTierValue(tier);
        const tierName = (tier.name ?? getKeySuffix(tier.key)).toUpperCase();
        if (!tierName) return;
        tierMap[tierName] = {
          min: String(tierValue.min ?? 0),
          max: tierValue.max == null ? "" : String(tierValue.max),
        };
      });
      setTierDrafts(tierMap);

      const benefitMap: Record<string, BenefitDraft> = {};
      response.membership.benefits.forEach((benefit) => {
        const benefitValue = getBenefitValue(benefit);
        const tierName = (benefit.tier ?? getKeySuffix(benefit.key)).toUpperCase();
        if (!tierName) return;
        benefitMap[tierName] = {
          discountPercentage: String(benefitValue.discountPercentage ?? 0),
          freeShipping: Boolean(benefitValue.freeShipping),
          prioritySupport: Boolean(benefitValue.prioritySupport),
          earlyAccess: Boolean(benefitValue.earlyAccess),
        };
      });
      setBenefitDrafts(benefitMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveGeneral = async () => {
    setSavingGeneral(true);
    setError(null);
    setSuccess(null);
    try {
      await apiJson("/system/tax/vat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: Number(vatRate.rate), description: vatRate.description}),
      }, "/settings");

      await apiJson(
        `/system/shipping/fees/${getKeySuffix(shippingStandard?.key) || shippingStandard?.type || "STANDARD"}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseFee: Number(shipping.baseFee || 0),
            feePerKm: Number(shipping.feePerKm || 0),
            freeShippingThreshold:
              shipping.freeShippingThreshold === ""
                ? null
                : Number(shipping.freeShippingThreshold),
            maxDistance: shipping.maxDistance === "" ? null : Number(shipping.maxDistance),
            description: shipping.description,
          }),
        },
        "/settings",
      );

      setSuccess("General settings updated successfully.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update general settings");
    } finally {
      setSavingGeneral(false);
    }
  };

  const saveMembership = async () => {
    setSavingMembership(true);
    setError(null);
    setSuccess(null);
    try {
      await Promise.all(
        tierOrder.map((tierName) => {
          const draft = tierDrafts[tierName] ?? { min: "0", max: "" };
          return apiJson(
            `/system/membership/tiers/${tierName}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                min: Number(draft.min || 0),
                max: draft.max === "" ? null : Number(draft.max),
              }),
            },
            "/settings",
          );
        }),
      );

      await Promise.all(
        tierOrder.map((tierName) => {
          const draft = benefitDrafts[tierName] ?? {
            discountPercentage: "0",
            freeShipping: false,
            prioritySupport: false,
            earlyAccess: false,
          };
          return apiJson(
            `/system/membership/benefits/${tierName}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                discountPercentage: Number(draft.discountPercentage || 0),
                freeShipping: Boolean(draft.freeShipping),
                prioritySupport: Boolean(draft.prioritySupport),
                earlyAccess: Boolean(draft.earlyAccess),
              }),
            },
            "/settings",
          );
        }),
      );

      setSuccess("Membership settings updated successfully.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update membership settings");
    } finally {
      setSavingMembership(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
              System configuration
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Settings
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Manage VAT, shipping fees, and membership policy based on live data
              from the backend system parameter table.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={load}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Reload data
            </button>
            <button
              type="button"
              onClick={activeTab === "general" ? saveGeneral : saveMembership}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
            >
              {activeTab === "general" ? "Save general settings" : "Save membership settings"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
            {(["general", "membership"] as const).map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {tab === "general" ? "General (VAT & Shipping)" : "Membership"}
                </button>
              );
            })}
          </div>

          {loading ? (
            <Section title="Loading settings" subtitle="Fetching live data from the backend...">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Loading system parameters...
              </div>
            </Section>
          ) : activeTab === "general" ? (
            <>
              <Section
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
                      placeholder="Optional notes for the shipping policy"
                    />
                  </label>
                </div>
              </Section>

              <Section
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
              </Section>
            </>
          ) : (
            <>
              <Section
                title="Membership tiers"
                subtitle="Adjust tier threshold values. These feed membership classification logic in the backend."
              >
                <div className="grid gap-4">
                  {tierRows.map(({ tierName, item }) => (
                    <div
                      key={tierName}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{tierName}</p>
                          <p className="text-sm text-slate-500">
                            {item?.description || "Membership threshold configuration"}
                          </p>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {item?.key || `MEMBERSHIP_TIER_${tierName}`}
                        </p>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <LabeledNumber
                          label="Min spending"
                          value={tierDrafts[tierName]?.min ?? ""}
                          onChange={(value) =>
                            setTierDrafts((current) => ({
                              ...current,
                              [tierName]: {
                                ...(current[tierName] ?? { max: "" }),
                                min: value,
                              },
                            }))
                          }
                          placeholder="0"
                        />
                        <LabeledNumber
                          label="Max spending"
                          value={tierDrafts[tierName]?.max ?? ""}
                          onChange={(value) =>
                            setTierDrafts((current) => ({
                              ...current,
                              [tierName]: {
                                ...(current[tierName] ?? { min: "" }),
                                max: value,
                              },
                            }))
                          }
                          placeholder="Leave blank if unlimited"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section
                title="Tier benefits"
                subtitle="Update what each member tier receives in the storefront experience."
              >
                <div className="grid gap-4">
                  {benefitRows.map(({ tierName, item }) => (
                    <div
                      key={tierName}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{tierName}</p>
                          <p className="text-sm text-slate-500">
                            {item?.description || "Membership benefit configuration"}
                          </p>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {item?.key || `MEMBERSHIP_BENEFIT_${tierName}`}
                        </p>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <LabeledNumber
                          label="Discount percentage"
                          value={benefitDrafts[tierName]?.discountPercentage ?? "0"}
                          onChange={(value) =>
                            setBenefitDrafts((current) => ({
                              ...current,
                              [tierName]: {
                                ...(current[tierName] ?? {
                                  freeShipping: false,
                                  prioritySupport: false,
                                  earlyAccess: false,
                                }),
                                discountPercentage: value,
                              },
                            }))
                          }
                          placeholder="0"
                        />
                        <div className="grid gap-3">
                          <ToggleField
                            label="Free shipping"
                            checked={Boolean(benefitDrafts[tierName]?.freeShipping)}
                            onChange={(value) =>
                              setBenefitDrafts((current) => ({
                                ...current,
                                [tierName]: {
                                  ...(current[tierName] ?? {
                                    discountPercentage: "0",
                                    prioritySupport: false,
                                    earlyAccess: false,
                                  }),
                                  freeShipping: value,
                                },
                              }))
                            }
                          />
                          <ToggleField
                            label="Priority support"
                            checked={Boolean(benefitDrafts[tierName]?.prioritySupport)}
                            onChange={(value) =>
                              setBenefitDrafts((current) => ({
                                ...current,
                                [tierName]: {
                                  ...(current[tierName] ?? {
                                    discountPercentage: "0",
                                    freeShipping: false,
                                    earlyAccess: false,
                                  }),
                                  prioritySupport: value,
                                },
                              }))
                            }
                          />
                          <ToggleField
                            label="Early access"
                            checked={Boolean(benefitDrafts[tierName]?.earlyAccess)}
                            onChange={(value) =>
                              setBenefitDrafts((current) => ({
                                ...current,
                                [tierName]: {
                                  ...(current[tierName] ?? {
                                    discountPercentage: "0",
                                    freeShipping: false,
                                    prioritySupport: false,
                                  }),
                                  earlyAccess: value,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}
        </div>

        <div className="space-y-6">
          <Section
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
          </Section>
        </div>
      </section>
    </div>
  );
}
