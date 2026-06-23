"use client";

import GeneralSettingsPanel from "./components/general-settings-panel";
import MembershipSettingsPanel from "./components/membership-settings-panel";
import SettingsHeader from "./components/settings-header";
import SettingsSection from "./components/settings-section";
import SettingsSummaryPanel from "./components/settings-summary-panel";
import SettingsTabs from "./components/settings-tabs";
import { useSettingsPage } from "./hooks/use-settings-page";

export default function SettingsPageClient() {
  const { state, actions } = useSettingsPage();

  return (
    <div className="space-y-6">
      <SettingsHeader
        activeTab={state.activeTab}
        error={state.error}
        success={state.success}
        onReload={() => void actions.load()}
        onSave={() =>
          void (state.activeTab === "general" ? actions.saveGeneral() : actions.saveMembership())
        }
      />

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <SettingsTabs
            activeTab={state.activeTab}
            onChange={(tab) => actions.setActiveTab(tab)}
          />

          {state.loading ? (
            <SettingsSection
              title="Loading settings"
              subtitle="Fetching live data from the backend..."
            >
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Loading system parameters...
              </div>
            </SettingsSection>
          ) : state.activeTab === "general" ? (
            <GeneralSettingsPanel
              vatRate={state.vatRate}
              shipping={state.shipping}
              setVatRate={actions.setVatRate}
              setShipping={actions.setShipping}
            />
          ) : (
            <MembershipSettingsPanel
              tierRows={state.tierRows}
              benefitRows={state.benefitRows}
              tierDrafts={state.tierDrafts}
              benefitDrafts={state.benefitDrafts}
              setTierDrafts={actions.setTierDrafts}
              setBenefitDrafts={actions.setBenefitDrafts}
            />
          )}
        </div>

        <div className="space-y-6">
          <SettingsSummaryPanel
            configs={state.configs}
            vatRate={state.vatRate}
            shipping={state.shipping}
          />
        </div>
      </section>
    </div>
  );
}
