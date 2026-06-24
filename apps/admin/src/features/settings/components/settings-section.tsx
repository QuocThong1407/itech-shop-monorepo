"use client";

import { DetailSection } from "@itech/shared";
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
    <DetailSection
      title={title}
      description={subtitle}
      className="rounded-[2rem] shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
      bodyClassName=""
    >
      {children}
    </DetailSection>
  );
}
