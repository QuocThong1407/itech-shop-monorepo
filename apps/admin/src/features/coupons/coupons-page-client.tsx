"use client";

import { ConfirmDialog, StatCard } from "@itech/shared";
import CouponFormModal from "./components/coupon-form-modal";
import CouponsListSection from "./components/coupons-list-section";
import CouponViewModal from "./components/coupon-view-modal";
import { useCouponsPage } from "./hooks/use-coupons-page";

export default function CouponsPageClient() {
  const { state, actions } = useCouponsPage();

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
              Discount vault
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Coupons
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Manage code-based discounts linked to promotions, with usage limits and real-time
              availability.
            </p>
          </div>
        </div>
      </section>

      {state.error ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total coupons"
          value={state.stats.total}
          note="All coupon codes in the catalog"
          accentClassName="bg-[#008ECC]"
        />
        <StatCard
          title="Active"
          value={state.stats.active}
          note="Coupons linked to active promotions"
          accentClassName="bg-emerald-500"
        />
        <StatCard
          title="Upcoming"
          value={state.stats.upcoming}
          note="Will unlock soon"
          accentClassName="bg-amber-500"
        />
        <StatCard
          title="Expired"
          value={state.stats.expired}
          note="Promotion already ended"
          accentClassName="bg-rose-500"
        />
        <StatCard
          title="Inactive"
          value={state.stats.inactive}
          note="Paused or hidden campaigns"
          accentClassName="bg-slate-500"
        />
      </section>

      <CouponsListSection
        loading={state.loading}
        searchInput={state.searchInput}
        onSearchInputChange={actions.setSearchInput}
        onClearSearch={() => actions.setSearchInput("")}
        statusFilter={state.statusFilter}
        onStatusFilterChange={(status) => {
          actions.setStatusFilter(status);
          actions.setPage(1);
        }}
        onRefresh={() => void actions.loadCoupons()}
        onOpenAdd={actions.openAddModal}
        pagedCoupons={state.pagedCoupons}
        filteredCouponsLength={state.filteredCoupons.length}
        page={state.page}
        totalPages={state.totalPages}
        onPrevPage={() => actions.setPage((value) => Math.max(1, value - 1))}
        onNextPage={() => actions.setPage((value) => Math.min(state.totalPages, value + 1))}
        onOpenView={actions.openViewModal}
        onOpenEdit={actions.openEditModal}
        onRequestDelete={actions.setConfirmDelete}
      />

      <CouponFormModal
        viewMode={state.viewMode}
        draft={state.draft}
        promotions={state.promotions}
        editingId={state.editingId}
        selectedCoupon={state.selectedCoupon}
        saving={state.saving}
        onClose={actions.closeModal}
        onSubmit={() => void actions.submitCoupon()}
        onDraftChange={actions.setDraft}
      />

      <CouponViewModal
        open={state.viewMode === "view" && Boolean(state.selectedCoupon)}
        selectedCoupon={state.selectedCoupon}
        onClose={actions.closeModal}
        onEdit={actions.openEditModal}
      />

      <ConfirmDialog
        open={Boolean(state.confirmDelete)}
        eyebrow="Confirm deletion"
        title="Delete coupon?"
        description="This will permanently remove the coupon code from the admin catalog."
        confirmLabel={state.saving ? "Deleting..." : "Delete"}
        loading={state.saving}
        onCancel={() => actions.setConfirmDelete(null)}
        onConfirm={() => void actions.submitDeleteCoupon()}
      />
    </div>
  );
}
