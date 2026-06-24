"use client";

import { AlertBanner, ConfirmDialog, MetricsGrid, PageIntro, StatCard } from "@itech/shared";
import CouponFormModal from "./components/coupon-form-modal";
import CouponsListSection from "./components/coupons-list-section";
import CouponViewModal from "./components/coupon-view-modal";
import { useCouponsPage } from "./hooks/use-coupons-page";

export default function CouponsPageClient() {
  const { state, actions } = useCouponsPage();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Discount vault"
        title="Coupons"
        description="Manage code-based discounts linked to promotions, with usage limits and real-time availability."
        className="bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
        titleClassName="sm:text-4xl"
      />

      {state.error ? (
        <AlertBanner tone="danger" message={state.error} className="rounded-[1.5rem]" />
      ) : null}

      <MetricsGrid className="xl:grid-cols-5">
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
      </MetricsGrid>

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
