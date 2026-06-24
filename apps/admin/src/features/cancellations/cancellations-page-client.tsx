"use client";

import { AlertBanner, MetricsGrid, PageIntro, StatCard } from "@itech/shared";
import CancellationDetailModal from "./components/cancellation-detail-modal";
import CancellationsListSection from "./components/cancellations-list-section";
import { useCancellationsPage } from "./hooks/use-cancellations-page";

export default function CancellationsPageClient() {
  const { state, actions } = useCancellationsPage();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Admin cancellations"
        title="Cancellation Request Queue"
        description="Review cancellation requests, coordinate stock restoration, and close each request with a clear audit trail."
        className="bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.06)]"
        titleClassName="sm:text-4xl"
      />

      {state.error ? (
        <AlertBanner tone="danger" message={state.error} className="rounded-[1.5rem]" />
      ) : null}

      <MetricsGrid className="xl:grid-cols-5">
        <StatCard
          title="Total"
          value={state.stats.total}
          className="border-slate-200 bg-white"
          titleClassName="!text-xs !uppercase !tracking-[0.2em] !text-slate-500"
          accentClassName="bg-slate-400"
        />
        <StatCard
          title="Requested"
          value={state.stats.requested}
          className="border-amber-100 bg-amber-50 text-amber-700"
          titleClassName="!text-xs !uppercase !tracking-[0.2em] !text-amber-700/80"
          valueClassName="!text-amber-700"
          accentClassName="bg-amber-500"
        />
        <StatCard
          title="Approved"
          value={state.stats.approved}
          className="border-sky-100 bg-sky-50 text-sky-700"
          titleClassName="!text-xs !uppercase !tracking-[0.2em] !text-sky-700/80"
          valueClassName="!text-sky-700"
          accentClassName="bg-sky-500"
        />
        <StatCard
          title="Completed"
          value={state.stats.completed}
          className="border-emerald-100 bg-emerald-50 text-emerald-700"
          titleClassName="!text-xs !uppercase !tracking-[0.2em] !text-emerald-700/80"
          valueClassName="!text-emerald-700"
          accentClassName="bg-emerald-500"
        />
        <StatCard
          title="Rejected"
          value={state.stats.rejected}
          className="border-rose-100 bg-rose-50 text-rose-700"
          titleClassName="!text-xs !uppercase !tracking-[0.2em] !text-rose-700/80"
          valueClassName="!text-rose-700"
          accentClassName="bg-rose-500"
        />
      </MetricsGrid>

      <CancellationsListSection
        loading={state.loading}
        actionLoading={state.actionLoading}
        activeTab={state.activeTab}
        searchText={state.searchText}
        filteredRecordsLength={state.filteredRecords.length}
        pagedRecords={state.pagedRecords}
        page={state.page}
        totalPages={state.totalPages}
        onTabChange={(tab) => actions.setActiveTab(tab)}
        onSearchChange={(value) => actions.setSearchText(value)}
        onRefresh={() => void actions.loadCancellations()}
        onView={(record) => void actions.handleView(record)}
        onStatusChange={(record, nextStatus) => void actions.updateStatus(record, nextStatus)}
        onPrevPage={() => actions.setPage((current) => Math.max(1, current - 1))}
        onNextPage={() => actions.setPage((current) => Math.min(state.totalPages, current + 1))}
      />

      <CancellationDetailModal
        open={state.detailOpen && Boolean(state.selectedRecord)}
        actionLoading={state.actionLoading}
        selectedRecord={state.selectedRecord}
        customer={state.customer}
        payment={state.payment}
        items={state.items}
        onClose={() => actions.setDetailOpen(false)}
        onStatusChange={(record, nextStatus) => void actions.updateStatus(record, nextStatus)}
      />
    </div>
  );
}
