"use client";

import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function SettingsSection({
  title,
  subtitle,
  children,
}: SettingsSectionProps) {
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
