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
        <OrderStatusPanel orderList={data.orderList} revenueReport={data.revenueReport} />
        <ActivitySummaryPanel activityReport={data.activityReport} usersStats={data.usersStats} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <RecentOrdersPanel orderList={data.orderList} />
        <TopCustomersPanel topMembers={data.topMembers} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <CategoryStatsPanel categoryStats={data.categoryStats} />
        <EnterpriseLogPanel activityReport={data.activityReport} quickNotes={quickNotes} />
      </section>
    </div>
  );
}
