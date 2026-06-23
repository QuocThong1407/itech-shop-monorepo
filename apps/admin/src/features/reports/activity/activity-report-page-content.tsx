import { formatReportDate } from "../../../lib/report-api";
import ReportMetricCard from "../revenue/components/report-metric-card";
import ActivityFilterForm from "./components/activity-filter-form";
import ActivityEventLog from "./components/activity-event-log";
import ActivitySidebar from "./components/activity-sidebar";
import ActivitySummaryBars from "./components/activity-summary-bars";
import ActivityTabs from "./components/activity-tabs";
import type { ActivityReportPageContentProps } from "./types";

export default function ActivityReportPageContent({
  report,
  rangeStart,
  rangeEnd,
  exportHref,
}: ActivityReportPageContentProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
              Activity insights
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Activity Report
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review active users, new users, orders, reviews, and role distribution for the
              selected period.
            </p>
          </div>

          <ActivityFilterForm
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            exportHref={exportHref}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportMetricCard
          title="Active users"
          value={report.summary.totalActiveUsers.toLocaleString("vi-VN")}
          note="Accounts updated in range"
          accent="bg-[#008ECC]"
        />
        <ReportMetricCard
          title="New users"
          value={report.summary.newUsers.toLocaleString("vi-VN")}
          note="Joined within the period"
          accent="bg-emerald-500"
        />
        <ReportMetricCard
          title="New orders"
          value={report.summary.newOrders.toLocaleString("vi-VN")}
          note="Fresh order records"
          accent="bg-amber-500"
        />
        <ReportMetricCard
          title="New reviews"
          value={report.summary.newReviews.toLocaleString("vi-VN")}
          note="Recent customer feedback"
          accent="bg-violet-500"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6 xl:flex xl:flex-col xl:space-y-0">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] xl:h-full">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Activity timeline</p>
                <p className="mt-1 text-sm text-slate-500">
                  Users updated from {formatReportDate(rangeStart)} to {formatReportDate(rangeEnd)}
                  .
                </p>
              </div>
            </div>

            <div className="mt-5">
              <ActivitySummaryBars report={report} />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Customers
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {report.statistics.totalCustomers.toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Sellers
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {report.statistics.totalSellers.toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Admins
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {report.statistics.totalAdmins.toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <ActivityTabs
                customers={report.activities.customers}
                sellers={report.activities.sellers}
                admins={report.activities.admins}
              />
            </div>
          </article>
        </div>

        <ActivitySidebar report={report} rangeStart={rangeStart} rangeEnd={rangeEnd} />
      </section>

      <ActivityEventLog report={report} />
    </div>
  );
}
