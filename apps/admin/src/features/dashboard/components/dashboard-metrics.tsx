import { MetricsGrid, StatusBadge, SurfaceCard } from "@itech/shared";
import type { DashboardMetric } from "../types";

type DashboardMetricsProps = {
  metrics: DashboardMetric[];
};

export default function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  return (
    <MetricsGrid className="xl:grid-cols-4">
      {metrics.map((metric) => (
        <SurfaceCard
          key={metric.label}
          className="shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">{metric.label}</p>
          <StatusBadge
            tone={
              metric.tone === "emerald"
                ? "success"
                : metric.tone === "sky"
                  ? "neutral"
                  : metric.tone === "amber"
                    ? "warning"
                    : "neutral"
            }
            className={
              metric.tone === "sky"
                ? "bg-sky-50 text-sky-700 ring-sky-200"
                : metric.tone === "violet"
                  ? "bg-violet-50 text-violet-700 ring-violet-200"
                  : ""
            }
          >
            Live
          </StatusBadge>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{metric.value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{metric.note}</p>
        </SurfaceCard>
      ))}
    </MetricsGrid>
  );
}
