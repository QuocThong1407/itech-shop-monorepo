import type { DashboardMetric } from "../types";

type DashboardMetricsProps = {
  metrics: DashboardMetric[];
};

export default function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">{metric.label}</p>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                metric.tone === "emerald"
                  ? "bg-emerald-50 text-emerald-700"
                  : metric.tone === "sky"
                    ? "bg-sky-50 text-sky-700"
                    : metric.tone === "amber"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-violet-50 text-violet-700"
              }`}
            >
              Live
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{metric.value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{metric.note}</p>
        </article>
      ))}
    </section>
  );
}
