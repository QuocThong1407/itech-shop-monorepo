"use client";

import OrdersListSection from "./components/orders-list-section";
import OrderDetailModal from "./components/order-detail-modal";
import { useOrdersPage } from "./hooks/use-orders-page";

function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <article
      className={`rounded-[1.75rem] border p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] ${className}`}
    >
      <p className="text-xs uppercase tracking-[0.2em] opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </article>
  );
}

export default function OrdersPageClient() {
  const { state, actions } = useOrdersPage();

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#008ECC]">
              Admin orders
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                Orders Control Center
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Monitor every order across the marketplace, inspect payment state, and coordinate
                fulfillment decisions from one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {state.error ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total"
          value={state.stats.total}
          className="border-slate-200 bg-white text-slate-900"
        />
        <StatCard
          label="Pending"
          value={state.stats.pending}
          className="border-amber-100 bg-amber-50 text-amber-700"
        />
        <StatCard
          label="Shipped"
          value={state.stats.shipped}
          className="border-indigo-100 bg-indigo-50 text-indigo-700"
        />
        <StatCard
          label="Delivered"
          value={state.stats.delivered}
          className="border-emerald-100 bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Cancelled"
          value={state.stats.cancelled}
          className="border-rose-100 bg-rose-50 text-rose-700"
        />
      </section>

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
        onDelete={(order) => void actions.handleDelete(order)}
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
        onDelete={(order) => void actions.handleDelete(order)}
      />
    </div>
  );
}
