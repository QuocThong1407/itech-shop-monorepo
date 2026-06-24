"use client";

import { AlertBanner, Button, PageIntro } from "@itech/shared";
import type { SettingsTab } from "../types";

type SettingsHeaderProps = {
  activeTab: SettingsTab;
  error: string | null;
  success: string | null;
  onReload: () => void;
  onSave: () => void;
};

export default function SettingsHeader({
  activeTab,
  error,
  success,
  onReload,
  onSave,
}: SettingsHeaderProps) {
  return (
    <PageIntro
      eyebrow="System configuration"
      title="Settings"
      description="Manage VAT, shipping fees, and membership policy based on live data from the backend system parameter table."
      className="bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
      titleClassName="sm:text-4xl"
      actions={
        <>
          <Button
            type="button"
            onClick={onReload}
            variant="secondary"
            className="!shadow-none"
          >
            Reload data
          </Button>
          <Button
            type="button"
            onClick={onSave}
            variant="primary"
            className="!border !border-slate-900 !shadow-none"
          >
            {activeTab === "general" ? "Save general settings" : "Save membership settings"}
          </Button>
        </>
      }
    >

      {error ? (
        <AlertBanner tone="danger" message={error} className="mt-5 rounded-2xl" />
      ) : null}
      {success ? (
        <AlertBanner tone="success" message={success} className="mt-5 rounded-2xl" />
      ) : null}
    </PageIntro>
  );
}
