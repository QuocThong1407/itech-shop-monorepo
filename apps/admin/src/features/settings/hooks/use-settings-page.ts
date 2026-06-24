"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchShippingFees,
  fetchSystemConfigs,
  updateMembershipBenefit,
  updateMembershipTier,
  updateShippingFee,
  updateVatRate,
} from "../api";
import { emptyShippingDraft, emptyVatDraft, tierOrder } from "../constants";
import {
  createBenefitDraft,
  createTierDraft,
  getBenefitValue,
  getKeySuffix,
  getShippingValue,
  getStandardShippingConfig,
  getTierValue,
} from "../helpers";
import type {
  BenefitDraft,
  SettingsTab,
  ShippingDraft,
  SystemConfigsResponse,
  TierDraft,
  VatDraft,
} from "../types";

export function useSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingMembership, setSavingMembership] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [configs, setConfigs] = useState<SystemConfigsResponse | null>(null);
  const [vatRate, setVatRate] = useState<VatDraft>(emptyVatDraft);
  const [shipping, setShipping] = useState<ShippingDraft>(emptyShippingDraft);
  const [tierDrafts, setTierDrafts] = useState<Record<string, TierDraft>>({});
  const [benefitDrafts, setBenefitDrafts] = useState<Record<string, BenefitDraft>>({});

  const shippingStandard = useMemo(
    () => getStandardShippingConfig(configs?.shipping.fees ?? []),
    [configs],
  );

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
        draft: benefitDrafts[tierName] ?? createBenefitDraft(undefined),
      };
    });
  }, [configs, benefitDrafts]);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchSystemConfigs();
      const shippingResponse = await fetchShippingFees();

      setConfigs({
        ...response,
        shipping: {
          fees: shippingResponse.length > 0 ? shippingResponse : response.shipping.fees,
        },
      });

      const vat = response.tax.vat?.value.rate ?? 10;
      setVatRate({
        rate: String(vat),
        description: response.tax.vat?.description ?? "",
      });

      const standardConfig = getStandardShippingConfig(shippingResponse);
      const standardValue = getShippingValue(standardConfig);
      setShipping({
        baseFee: standardConfig ? String(standardValue.baseFee) : "",
        feePerKm: standardConfig ? String(standardValue.feePerKm) : "",
        freeShippingThreshold:
          standardValue.freeShippingThreshold != null
            ? String(standardValue.freeShippingThreshold)
            : "",
        maxDistance: standardValue.maxDistance != null ? String(standardValue.maxDistance) : "",
        description: standardConfig?.description ?? "",
      });

      const nextTierDrafts: Record<string, TierDraft> = {};
      response.membership.tiers.forEach((tier) => {
        const tierName = (tier.name ?? getKeySuffix(tier.key)).toUpperCase();
        if (!tierName) return;
        nextTierDrafts[tierName] = createTierDraft(getTierValue(tier));
      });
      setTierDrafts(nextTierDrafts);

      const nextBenefitDrafts: Record<string, BenefitDraft> = {};
      response.membership.benefits.forEach((benefit) => {
        const tierName = (benefit.tier ?? getKeySuffix(benefit.key)).toUpperCase();
        if (!tierName) return;
        nextBenefitDrafts[tierName] = createBenefitDraft(getBenefitValue(benefit));
      });
      setBenefitDrafts(nextBenefitDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!mounted) return;
      await load();
    };

    void run();

    return () => {
      mounted = false;
    };
  }, []);

  const saveGeneral = async () => {
    setSavingGeneral(true);
    setError(null);
    setSuccess(null);

    try {
      await updateVatRate(Number(vatRate.rate), vatRate.description);
      await updateShippingFee(
        getKeySuffix(shippingStandard?.key) || shippingStandard?.type || "STANDARD",
        {
          baseFee: Number(shipping.baseFee || 0),
          feePerKm: Number(shipping.feePerKm || 0),
          freeShippingThreshold:
            shipping.freeShippingThreshold === "" ? null : Number(shipping.freeShippingThreshold),
          maxDistance: shipping.maxDistance === "" ? null : Number(shipping.maxDistance),
          description: shipping.description,
        },
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
          return updateMembershipTier(tierName, {
            min: Number(draft.min || 0),
            max: draft.max === "" ? null : Number(draft.max),
          });
        }),
      );

      await Promise.all(
        tierOrder.map((tierName) => {
          const draft = benefitDrafts[tierName] ?? createBenefitDraft(undefined);
          return updateMembershipBenefit(tierName, {
            discountPercentage: Number(draft.discountPercentage || 0),
            freeShipping: Boolean(draft.freeShipping),
            prioritySupport: Boolean(draft.prioritySupport),
            earlyAccess: Boolean(draft.earlyAccess),
          });
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

  return {
    state: {
      loading,
      savingGeneral,
      savingMembership,
      error,
      success,
      activeTab,
      configs,
      vatRate,
      shipping,
      tierDrafts,
      benefitDrafts,
      shippingStandard,
      tierRows,
      benefitRows,
    },
    actions: {
      setActiveTab,
      setVatRate,
      setShipping,
      setTierDrafts,
      setBenefitDrafts,
      setError,
      setSuccess,
      load,
      saveGeneral,
      saveMembership,
    },
  };
}
