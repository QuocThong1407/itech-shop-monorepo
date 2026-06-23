"use client";

import { ConfirmDialog, StatCard } from "@itech/shared";
import PromotionFormModal from "./components/promotion-form-modal";
import PromotionsListSection from "./components/promotions-list-section";
import PromotionViewModal from "./components/promotion-view-modal";
import { usePromotionsPage } from "./hooks/use-promotions-page";

export default function PromotionsPageClient() {
  const { state, actions } = usePromotionsPage();

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
              Campaign center
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Promotions
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Manage store-wide campaigns, category offers, and product-specific promotions with
              clear date ranges, scope control, and real backend data.
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
          title="Total promotions"
          value={state.stats.total}
          note="All campaigns tracked in the system"
          accentClassName="bg-[#008ECC]"
        />
        <StatCard
          title="Active"
          value={state.stats.active}
          note="Currently visible to customers"
          accentClassName="bg-emerald-500"
        />
        <StatCard
          title="Upcoming"
          value={state.stats.upcoming}
          note="Scheduled for the future"
          accentClassName="bg-amber-500"
        />
        <StatCard
          title="Expired"
          value={state.stats.expired}
          note="Past their end date"
          accentClassName="bg-rose-500"
        />
        <StatCard
          title="Inactive"
          value={state.stats.inactive}
          note="Paused by admin"
          accentClassName="bg-slate-500"
        />
      </section>

      <PromotionsListSection
        loading={state.loading}
        searchInput={state.searchInput}
        onSearchInputChange={actions.setSearchInput}
        onSearch={() => {
          actions.setSearchQuery(state.searchInput.trim());
          actions.setPage(1);
        }}
        onClear={() => {
          actions.setSearchInput("");
          actions.setSearchQuery("");
          actions.setStatusFilter("ALL");
          actions.setPage(1);
        }}
        statusFilter={state.statusFilter}
        onStatusFilterChange={(status) => {
          actions.setStatusFilter(status);
          actions.setPage(1);
        }}
        onRefresh={() => void actions.loadPromotions()}
        onOpenAdd={actions.openAddModal}
        pagedPromotions={state.pagedPromotions}
        filteredPromotionsLength={state.filteredPromotions.length}
        page={state.page}
        totalPages={state.totalPages}
        promotionDetails={state.promotionDetails}
        categoriesCount={state.categories.length}
        onOpenView={(promotion) => void actions.openViewModal(promotion)}
        onOpenEdit={(promotion) => void actions.openEditModal(promotion)}
        onToggleStatus={(promotion, nextStatus) =>
          void actions.submitToggleStatus(promotion, nextStatus)
        }
        onRequestDelete={actions.setConfirmDelete}
        onPrevPage={() => actions.setPage((value) => Math.max(1, value - 1))}
        onNextPage={() => actions.setPage((value) => Math.min(state.totalPages, value + 1))}
      />

      <PromotionFormModal
        viewMode={state.viewMode}
        draft={state.draft}
        saving={state.saving}
        categories={state.categories}
        filteredResourceItems={state.filteredResourceItems}
        resourceSearch={state.resourceSearch}
        onClose={actions.closeModal}
        onSubmit={() => void actions.submitPromotion()}
        onDraftChange={actions.setDraft}
        onResourceSearchChange={actions.setResourceSearch}
      />

      <PromotionViewModal
        open={state.viewMode === "view" && Boolean(state.selectedPromotion)}
        selectedPromotion={state.selectedPromotion}
        selectedScopeInfo={state.selectedScopeInfo}
        onClose={actions.closeModal}
      />

      <ConfirmDialog
        open={Boolean(state.confirmDelete)}
        eyebrow="Confirm deletion"
        title="Delete promotion?"
        description="This will remove the promotion from the admin catalog. The campaign cannot be restored from here."
        confirmLabel={state.saving ? "Deleting..." : "Delete"}
        loading={state.saving}
        onCancel={() => actions.setConfirmDelete(null)}
        onConfirm={() => void actions.submitDeletePromotion()}
      />
    </div>
  );
}
