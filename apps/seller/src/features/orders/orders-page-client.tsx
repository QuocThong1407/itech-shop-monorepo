"use client";

import { AlertBanner, MetricsGrid, PageIntro, StatCard } from "@itech/shared";
import OrderDetailModal from "./components/order-detail-modal";
import OrdersListSection from "./components/orders-list-section";
import { useOrdersPage } from "./hooks/use-orders-page";

export default function OrdersPageClient() {
  const { state, actions } = useOrdersPage();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Seller orders"
        title="Orders Control Center"
        description="Track incoming orders, monitor payment state, and move fulfillment forward from a focused seller workspace."
        className="bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.06)]"
        titleClassName="sm:text-4xl"
      />

      {state.error ? (
        <AlertBanner tone="danger" message={state.error} className="rounded-[1.5rem]" />
      ) : null}

      <MetricsGrid className="xl:grid-cols-6">
        <StatCard
          title="Total"
          value={state.stats.total}
          className="border-slate-200 bg-white text-slate-900"
          titleClassName="!text-xs !uppercase !tracking-[0.2em] !text-slate-500"
          accentClassName="bg-slate-400"
        />
        <StatCard
          title="Pending"
          value={state.stats.pending}
          className="border-amber-100 bg-amber-50 text-amber-700"
          titleClassName="!text-xs !uppercase !tracking-[0.2em] !text-amber-700/80"
          valueClassName="!text-amber-700"
          accentClassName="bg-amber-500"
        />
        <StatCard
          title="Confirmed"
          value={state.stats.confirmed}
          className="border-sky-100 bg-sky-50 text-sky-700"
          titleClassName="!text-xs !uppercase !tracking-[0.2em] !text-sky-700/80"
          valueClassName="!text-sky-700"
          accentClassName="bg-sky-500"
        />
        <StatCard
          title="Shipped"
          value={state.stats.shipped}
          className="border-indigo-100 bg-indigo-50 text-indigo-700"
          titleClassName="!text-xs !uppercase !tracking-[0.2em] !text-indigo-700/80"
          valueClassName="!text-indigo-700"
          accentClassName="bg-indigo-500"
        />
        <StatCard
          title="Delivered"
          value={state.stats.delivered}
          className="border-emerald-100 bg-emerald-50 text-emerald-700"
          titleClassName="!text-xs !uppercase !tracking-[0.2em] !text-emerald-700/80"
          valueClassName="!text-emerald-700"
          accentClassName="bg-emerald-500"
        />
        <StatCard
          title="Cancelled"
          value={state.stats.cancelled}
          className="border-rose-100 bg-rose-50 text-rose-700"
          titleClassName="!text-xs !uppercase !tracking-[0.2em] !text-rose-700/80"
          valueClassName="!text-rose-700"
          accentClassName="bg-rose-500"
        />
      </MetricsGrid>

      <OrdersListSection
        loading={state.loading}
        actionLoading={state.actionLoading}
        activeTab={state.activeTab}
        paymentTab={state.paymentTab}
        searchText={state.searchText}
        filteredOrdersLength={state.filteredOrders.length}
        pagedOrders={state.pagedOrders}
        page={state.page}
        totalPages={state.totalPages}
        onStatusTabChange={actions.setActiveTab}
        onPaymentTabChange={actions.setPaymentTab}
        onSearchChange={actions.setSearchText}
        onRefresh={() => void actions.loadOrders()}
        onView={(order) => void actions.handleView(order)}
        onStatusChange={(order, nextStatus) => void actions.handleStatusChange(order, nextStatus)}
        onPrevPage={() => actions.setPage((current) => Math.max(1, current - 1))}
        onNextPage={() => actions.setPage((current) => Math.min(state.totalPages, current + 1))}
      />

      <OrderDetailModal
        open={state.detailOpen && Boolean(state.selectedOrder)}
        actionLoading={state.actionLoading}
        selectedOrder={state.selectedOrder}
        customer={state.customer}
        payment={state.payment}
        orderItems={state.orderItems}
        selectedAddress={state.selectedAddress}
        onClose={() => actions.setDetailOpen(false)}
        onStatusChange={(order, nextStatus) => void actions.handleStatusChange(order, nextStatus)}
      />
    </div>
  );
}
