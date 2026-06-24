import { buildDashboardMetrics, buildQuickNotes } from "./helpers";
import type { DashboardData } from "./types";
import ActivitySummaryPanel from "./components/activity-summary-panel";
import CategoryStatsPanel from "./components/category-stats-panel";
import DashboardHero from "./components/dashboard-hero";
import DashboardMetrics from "./components/dashboard-metrics";
import DashboardRevenueSection from "./components/dashboard-revenue-section";
import EnterpriseLogPanel from "./components/enterprise-log-panel";
import OrderStatusPanel from "./components/order-status-panel";
import RecentOrdersPanel from "./components/recent-orders-panel";
import TopCustomersPanel from "./components/top-customers-panel";

type DashboardPageContentProps = {
  data: DashboardData;
};

export default function DashboardPageContent({ data }: DashboardPageContentProps) {
  const metrics = buildDashboardMetrics(data);
  const quickNotes = buildQuickNotes(data);

  return (
    <div className="space-y-6">
      <DashboardHero />
      <DashboardMetrics metrics={metrics} />
      <DashboardRevenueSection revenueReport={data.revenueReport} />

      <section id="analytics" className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="min-w-0 h-full">
          <OrderStatusPanel orderList={data.orderList} revenueReport={data.revenueReport} />
        </div>
        <div className="min-w-0 h-full">
          <ActivitySummaryPanel activityReport={data.activityReport} usersStats={data.usersStats} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="min-w-0 h-full">
          <RecentOrdersPanel orderList={data.orderList} />
        </div>
        <div className="min-w-0 h-full">
          <TopCustomersPanel topMembers={data.topMembers} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="min-w-0 h-full">
          <CategoryStatsPanel categoryStats={data.categoryStats} />
        </div>
        <div className="min-w-0 h-full">
          <EnterpriseLogPanel activityReport={data.activityReport} quickNotes={quickNotes} />
        </div>
      </section>
    </div>
  );
}
