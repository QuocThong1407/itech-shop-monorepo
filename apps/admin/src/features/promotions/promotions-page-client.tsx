"use client";

import { AlertBanner, ConfirmDialog, MetricsGrid, PageIntro, StatCard } from "@itech/shared";
import PromotionFormModal from "./components/promotion-form-modal";
import PromotionsListSection from "./components/promotions-list-section";
import PromotionViewModal from "./components/promotion-view-modal";
import { usePromotionsPage } from "./hooks/use-promotions-page";

export default function PromotionsPageClient() {
  const { state, actions } = usePromotionsPage();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Campaign center"
        title="Promotions"
        description="Manage store-wide campaigns, category offers, and product-specific promotions with clear date ranges, scope control, and real backend data."
        className="bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
        titleClassName="sm:text-4xl"
      />

      {state.error ? (
        <AlertBanner tone="danger" message={state.error} className="rounded-[1.5rem]" />
      ) : null}

      <MetricsGrid className="xl:grid-cols-5">
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
      </MetricsGrid>

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
