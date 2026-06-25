"use client";

import {
  AlertBanner,
  EmptyState,
  KeyValueGrid,
  MetricsGrid,
  PanelHeader,
  StatCard,
  StatusBadge,
  SurfaceCard,
} from "@itech/shared";
import SellerDashboardHero from "./components/seller-dashboard-hero";
import SellerRecentOrdersPanel from "./components/seller-recent-orders-panel";
import SellerRecoveryPanel from "./components/seller-recovery-panel";
import SellerRevenuePanel from "./components/seller-revenue-panel";
import SellerTopProductsPanel from "./components/seller-top-products-panel";
import { formatDateTime, getActivityTone } from "./helpers";
import { useSellerDashboard } from "./hooks/use-seller-dashboard";

export default function SellerDashboardPageClient() {
  const { state, actions } = useSellerDashboard();

  if (state.loading) {
    return (
      <div className="space-y-6">
        <SellerDashboardHero snapshot={state.view.snapshot} />
        <MetricsGrid className="xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[132px] animate-pulse rounded-[1.75rem] border border-slate-200 bg-white"
            />
          ))}
        </MetricsGrid>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SellerDashboardHero snapshot={state.view.snapshot} />

      {state.error ? (
        <AlertBanner
          tone="danger"
          message={state.error}
          className="rounded-[1.5rem]"
        />
      ) : null}

      <MetricsGrid className="xl:grid-cols-4">
        {state.view.metrics.map((metric) => (
          <StatCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            note={metric.note}
            accentClassName={metric.accentClassName}
            className="!h-full !p-6"
          />
        ))}
      </MetricsGrid>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.85fr)]">
        <div className="min-w-0">
          <SellerRevenuePanel
            trend={state.view.revenueTrend}
            snapshot={state.view.snapshot}
          />
        </div>
        <div className="min-w-0">
          <SurfaceCard className="flex h-full flex-col rounded-[2rem] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
            <PanelHeader
              title="Fulfillment pulse"
              description="Keep today's execution balanced across orders, catalog health, and recovery requests."
            />
            <KeyValueGrid
              className="mt-5"
              columnsClassName="grid gap-3"
              items={[
                {
                  label: "Pending orders",
                  value: state.view.snapshot.pendingOrders.toLocaleString("vi-VN"),
                  helper: "Orders still waiting for confirmation or next action",
                },
                {
                  label: "Shipped orders",
                  value: state.view.snapshot.shippedOrders.toLocaleString("vi-VN"),
                  helper: "Parcels already in transit to customers",
                },
                {
                  label: "Delivered orders",
                  value: state.view.snapshot.deliveredOrders.toLocaleString("vi-VN"),
                  helper: "Completed deliveries contributing to realized revenue",
                },
                {
                  label: "Low-stock products",
                  value: state.view.snapshot.lowStockProducts.toLocaleString("vi-VN"),
                  helper: "Items that should be restocked soon",
                },
                {
                  label: "Out-of-stock products",
                  value: state.view.snapshot.outOfStockProducts.toLocaleString("vi-VN"),
                  helper: "Unavailable items that may block conversion",
                },
              ]}
            />
          </SurfaceCard>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.85fr)]">
        <div className="min-w-0">
          <SellerRecentOrdersPanel orders={state.view.recentOrders} />
        </div>
        <div className="min-w-0">
          <SellerTopProductsPanel products={state.view.topProducts} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="min-w-0">
          <SellerRecoveryPanel items={state.view.recoveryQueue} />
        </div>
        <div className="min-w-0">
          <SurfaceCard className="flex h-full min-h-[40rem] max-h-[40rem] flex-col rounded-[2rem] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
            <PanelHeader
              title="Recent operational log"
              description="A compact stream of the latest seller-side changes across orders, products, returns, and cancellations."
              actions={
                <button
                  type="button"
                  onClick={() => void actions.reload()}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Refresh
                </button>
              }
            />

            <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
              {state.view.activityFeed.length > 0 ? (
                state.view.activityFeed.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-950">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(item.occurredAt)}
                        </p>
                      </div>
                      <StatusBadge className={getActivityTone(item.kind)}>
                        {item.kind}
                      </StatusBadge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No operational activity yet"
                  description="Seller-side activity will appear here once orders and catalog changes start coming in."
                />
              )}
            </div>
          </SurfaceCard>
        </div>
      </section>
    </div>
  );
}
