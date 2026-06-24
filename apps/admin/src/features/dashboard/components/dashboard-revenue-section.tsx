import { EmptyState, PanelHeader, StatusBadge, SurfaceCard } from "@itech/shared";
import { emptyMoney, formatShortDate } from "../helpers";
import type { RevenueReport } from "../types";

type DashboardRevenueSectionProps = {
  revenueReport: RevenueReport;
};

export default function DashboardRevenueSection({
  revenueReport,
}: DashboardRevenueSectionProps) {
  const totalRevenue = revenueReport.summary.netRevenue;
  const maxRevenue = Math.max(...revenueReport.rows.map((row) => row.netRevenue), 1);
  const recentRevenueRows = revenueReport.rows.slice(-8);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,_rgba(0,142,204,0.08)_0%,_rgba(255,255,255,0.95)_100%)] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:p-6">
      <PanelHeader
        title="Last 30 days"
        eyebrow="Revenue trend"
        actions={
          <StatusBadge tone={revenueReport.summary.netRevenue >= 0 ? "success" : "danger"}>
            {revenueReport.summary.netRevenue >= 0 ? "Profit" : "Loss"}
          </StatusBadge>
        }
      />

      <SurfaceCard className="mt-6 border-slate-200 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
        <div className="flex h-64 items-end gap-2">
          {recentRevenueRows.length > 0 ? (
            recentRevenueRows.map((row) => {
              const height = Math.max((row.netRevenue / maxRevenue) * 100, 8);
              return (
                <div key={row.period} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-44 items-end">
                    <div
                      className="w-full rounded-t-2xl bg-[linear-gradient(180deg,_#7dd3fc_0%,_#008ECC_100%)] shadow-[0_12px_30px_rgba(0,142,204,0.18)]"
                      style={{ height: `${height}%` }}
                      title={`${row.period}: ${emptyMoney(row.netRevenue)}`}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">{formatShortDate(row.period)}</span>
                </div>
              );
            })
          ) : (
            <EmptyState
              title="No revenue data available"
              className="grid h-full w-full place-items-center border-0 bg-transparent py-0"
            />
          )}
        </div>
      </SurfaceCard>
    </section>
  );
}
