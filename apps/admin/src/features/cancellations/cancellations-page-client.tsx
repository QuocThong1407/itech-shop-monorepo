"use client";

import CancellationDetailModal from "./components/cancellation-detail-modal";
import CancellationsListSection from "./components/cancellations-list-section";
import { useCancellationsPage } from "./hooks/use-cancellations-page";

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

export default function CancellationsPageClient() {
  const { state, actions } = useCancellationsPage();

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="space-y-3">
          <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#008ECC]">
            Admin cancellations
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Cancellation Request Queue
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review cancellation requests, coordinate stock restoration, and close the workflow
              with a clear audit trail.
            </p>
          </div>
        </div>
      </section>

      {state.error ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total" value={state.stats.total} className="border-slate-200 bg-white" />
        <StatCard
          label="Requested"
          value={state.stats.requested}
          className="border-amber-100 bg-amber-50 text-amber-700"
        />
        <StatCard
          label="Approved"
          value={state.stats.approved}
          className="border-sky-100 bg-sky-50 text-sky-700"
        />
        <StatCard
          label="Completed"
          value={state.stats.completed}
          className="border-emerald-100 bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Rejected"
          value={state.stats.rejected}
          className="border-rose-100 bg-rose-50 text-rose-700"
        />
      </section>

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
