import {
  DetailSection,
  PageIntro,
  PanelHeader,
  SurfaceCard,
} from "@itech/shared";
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
      <PageIntro
        eyebrow="Revenue insights"
        title="Revenue Report"
        description="Review income, refunds, and net revenue with the same report flow as the old admin panel, but arranged more cleanly."
        titleClassName="sm:text-3xl"
      />

      <DetailSection
        title="Filters"
        description="Adjust the reporting window, choose grouping, or export the current dataset."
        className="shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
      >
        <RevenueFilterForm
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          groupBy={groupBy}
          exportHref={exportHref}
        />
      </DetailSection>

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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(22rem,0.72fr)]">
        <div className="min-w-0">
          <SurfaceCard>
            <PanelHeader
              title="Revenue trend"
              description={`${formatReportDate(rangeStart)} to ${formatReportDate(rangeEnd)}.`}
              actions={
                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {groupBy.toUpperCase()} grouped
                </span>
              }
            />

            <div className="mt-6">
              <RevenueComboChart rows={report.rows} groupBy={groupBy} />
            </div>
          </SurfaceCard>

          <div className="mt-6">
            <RevenueTable rows={report.rows} groupBy={groupBy} />
          </div>
        </div>

        <div className="min-w-0">
          <RevenueSidebar
            report={report}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            groupBy={groupBy}
          />
        </div>
      </section>
    </div>
  );
}
