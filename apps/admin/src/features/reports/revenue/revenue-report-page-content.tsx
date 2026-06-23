import { formatReportDate, formatReportMoney } from "../../../lib/report-api";
import RevenueComboChart from "./components/revenue-combo-chart";
import RevenueFilterForm from "./components/revenue-filter-form";
import ReportMetricCard from "./components/report-metric-card";
import RevenueSidebar from "./components/revenue-sidebar";
import RevenueTable from "./components/revenue-table";
import type { RevenueReportPageContentProps } from "./types";

export default function RevenueReportPageContent({
  report,
  rangeStart,
  rangeEnd,
  groupBy,
  exportHref,
}: RevenueReportPageContentProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
              Revenue insights
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Revenue Report
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review income, refunds, and net revenue with the same report flow as the old admin
              panel, but arranged more cleanly.
            </p>
          </div>

          <RevenueFilterForm
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            groupBy={groupBy}
            exportHref={exportHref}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ReportMetricCard
          title="Net revenue"
          value={formatReportMoney(report.summary.netRevenue)}
          note="Income minus refunds"
          accent="bg-[#008ECC]"
        />
        <ReportMetricCard
          title="Gross income"
          value={formatReportMoney(report.summary.totalIncome)}
          note="Successful payment volume"
          accent="bg-emerald-500"
        />
        <ReportMetricCard
          title="Refunds"
          value={formatReportMoney(report.summary.totalRefund)}
          note="Approved returns and cancellations"
          accent="bg-rose-500"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Revenue trend</p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatReportDate(rangeStart)} to {formatReportDate(rangeEnd)}.
                </p>
              </div>
              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {groupBy.toUpperCase()} grouped
              </span>
            </div>

            <div className="mt-6">
              <RevenueComboChart rows={report.rows} groupBy={groupBy} />
            </div>
          </article>

          <RevenueTable rows={report.rows} groupBy={groupBy} />
        </div>

        <RevenueSidebar
          report={report}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          groupBy={groupBy}
        />
      </section>
    </div>
  );
}
