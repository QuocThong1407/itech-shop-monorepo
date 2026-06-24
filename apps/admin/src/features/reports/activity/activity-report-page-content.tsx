import { DetailSection, InfoField, PageIntro, PanelHeader, SurfaceCard } from "@itech/shared";
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
      <PageIntro
        eyebrow="Activity insights"
        title="Activity Report"
        description="Review active users, new users, orders, reviews, and role distribution for the selected period."
        titleClassName="sm:text-3xl"
      />

      <DetailSection
        title="Filters"
        description="Adjust the reporting window or export the current activity dataset."
        className="shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
      >
        <ActivityFilterForm
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          exportHref={exportHref}
        />
      </DetailSection>

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
          <SurfaceCard className="xl:h-full">
            <PanelHeader
              title="Activity timeline"
              description={`Users updated from ${formatReportDate(rangeStart)} to ${formatReportDate(rangeEnd)}.`}
            />

            <div className="mt-5">
              <ActivitySummaryBars report={report} />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <InfoField
                label="Customers"
                value={report.statistics.totalCustomers.toLocaleString("vi-VN")}
                className="p-4"
              />
              <InfoField
                label="Sellers"
                value={report.statistics.totalSellers.toLocaleString("vi-VN")}
                className="p-4"
              />
              <InfoField
                label="Admins"
                value={report.statistics.totalAdmins.toLocaleString("vi-VN")}
                className="p-4"
              />
            </div>

            <div className="mt-6">
              <ActivityTabs
                customers={report.activities.customers}
                sellers={report.activities.sellers}
                admins={report.activities.admins}
              />
            </div>
          </SurfaceCard>
        </div>

        <ActivitySidebar report={report} rangeStart={rangeStart} rangeEnd={rangeEnd} />
      </section>

      <ActivityEventLog report={report} />
    </div>
  );
}
