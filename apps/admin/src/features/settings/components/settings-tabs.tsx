"use client";

import { settingsTabs } from "../constants";
import type { SettingsTab } from "../types";

type SettingsTabsProps = {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
};

export default function SettingsTabs({ activeTab, onChange }: SettingsTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
      {settingsTabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
