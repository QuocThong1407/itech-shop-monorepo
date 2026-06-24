"use client";

import { StatCard } from "@itech/shared";

type ReportMetricCardProps = {
  title: string;
  value: string;
  accent: string;
  note: string;
};

export default function ReportMetricCard({
  title,
  value,
  accent,
  note,
}: ReportMetricCardProps) {
  return (
    <StatCard
      title={title}
      value={value}
      note={note}
      accentClassName={accent}
      className="rounded-[1.5rem]"
      valueClassName="!text-2xl"
    />
  );
}
