"use client";

import { TabPills } from "@itech/shared";
import { settingsTabs } from "../constants";
import type { SettingsTab } from "../types";

type SettingsTabsProps = {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
};

export default function SettingsTabs({ activeTab, onChange }: SettingsTabsProps) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
      <TabPills
        items={settingsTabs}
        activeKey={activeTab}
        onChange={(key) => onChange(key as SettingsTab)}
        className="justify-start"
        activeClassName="!bg-slate-950 !text-white !shadow-none"
        inactiveClassName="!bg-transparent !text-slate-600 hover:!bg-slate-50 hover:!text-slate-900"
      />
    </div>
  );
}
