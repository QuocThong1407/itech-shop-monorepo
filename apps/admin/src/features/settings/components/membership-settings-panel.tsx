"use client";

import type { Dispatch, SetStateAction } from "react";
import SettingsSection from "./settings-section";
import { LabeledNumber, ToggleField } from "./settings-fields";
import { createBenefitDraft } from "../helpers";
import type { BenefitDraft, TierDraft } from "../types";

type MembershipSettingsPanelProps = {
  tierRows: Array<{
    tierName: string;
    item: {
      key?: string;
      description?: string | null;
    } | null;
    draft: TierDraft;
  }>;
  benefitRows: Array<{
    tierName: string;
    item: {
      key?: string;
      description?: string | null;
    } | null;
    draft: BenefitDraft;
  }>;
  tierDrafts: Record<string, TierDraft>;
  benefitDrafts: Record<string, BenefitDraft>;
  setTierDrafts: Dispatch<SetStateAction<Record<string, TierDraft>>>;
  setBenefitDrafts: Dispatch<SetStateAction<Record<string, BenefitDraft>>>;
};

export default function MembershipSettingsPanel({
  tierRows,
  benefitRows,
  tierDrafts,
  benefitDrafts,
  setTierDrafts,
  setBenefitDrafts,
}: MembershipSettingsPanelProps) {
  return (
    <>
      <SettingsSection
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
      </SettingsSection>

      <SettingsSection
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
                        ...(current[tierName] ?? createBenefitDraft(undefined)),
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
                          ...(current[tierName] ?? createBenefitDraft(undefined)),
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
                          ...(current[tierName] ?? createBenefitDraft(undefined)),
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
                          ...(current[tierName] ?? createBenefitDraft(undefined)),
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
      </SettingsSection>
    </>
  );
}
