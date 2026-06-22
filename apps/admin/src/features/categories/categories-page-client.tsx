"use client";

import { ConfirmDialog, StatCard } from "@itech/shared";
import CategoriesListSection from "./components/categories-list-section";
import CategoryFormModal from "./components/category-form-modal";
import CategoryViewModal from "./components/category-view-modal";
import { getCategoryDeleteDescription, getTopCategorySummary } from "./helpers";
import { useCategoriesPage } from "./hooks/use-categories-page";

export default function CategoriesPageClient() {
  const { state, actions } = useCategoriesPage();
  const { topCategory, topCategoryCount } = getTopCategorySummary(state.stats);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
        <div className="px-6 py-6 xl:px-8 xl:py-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-[#008ECC] ring-1 ring-sky-200">
              Category management
            </span>
            <span className="text-sm text-slate-500">
              Manage catalog structure and product grouping
            </span>
          </div>

          <div className="mt-4 max-w-3xl space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Organize product categories with a cleaner, more visual admin workflow.
            </h2>
            <p className="text-base leading-7 text-slate-600">
              This screen keeps the old category management idea, but redesigns it with better
              spacing, clearer emphasis on product counts, and a dedicated detail view for the
              products inside each category.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total categories"
          value={state.stats.total.toLocaleString("vi-VN")}
          note="All catalog groups in the system"
          accentClassName="bg-slate-400"
        />
        <StatCard
          title="Top category"
          value={topCategory ? topCategory.name : "N/A"}
          note={`${topCategoryCount.toLocaleString("vi-VN")} products in the leading category`}
          accentClassName="bg-sky-500"
        />
        <StatCard
          title="Tracked categories"
          value={state.stats.topCategories.length.toLocaleString("vi-VN")}
          note="Categories currently ranked by product volume"
          accentClassName="bg-amber-500"
        />
        <StatCard
          title="Filtered view"
          value={state.pagination.total.toLocaleString("vi-VN")}
          note="Matches the current search query"
          accentClassName="bg-rose-500"
        />
      </section>

      <CategoriesListSection
        search={state.search}
        onSearchChange={actions.setSearch}
        onSubmitSearch={() => actions.setQuery(state.search)}
        onOpenAdd={actions.openAdd}
        error={state.error}
        loading={state.loading}
        categories={state.categories}
        pagination={state.pagination}
        topCategoryMap={state.topCategoryMap}
        onOpenView={actions.openView}
        onOpenEdit={actions.openEdit}
        onRequestDelete={actions.setConfirmDeleteId}
        onPageChange={(page) => void actions.loadCategories(page)}
      />

      <CategoryFormModal
        modalMode={state.modalMode}
        formState={state.formState}
        saving={state.saving}
        onClose={actions.closeModal}
        onSubmit={() => void actions.submitCategory()}
        onFormChange={actions.setFormState}
      />

      <CategoryViewModal
        open={state.modalMode === "view"}
        category={state.selectedCategory}
        products={state.products}
        productsLoading={state.productsLoading}
        onClose={actions.closeModal}
      />

      <ConfirmDialog
        open={Boolean(state.confirmDeleteId)}
        eyebrow="Confirm deletion"
        title="Delete this category?"
        description={getCategoryDeleteDescription(
          state.categories.find((item) => item.id === state.confirmDeleteId) ?? state.selectedCategory,
        )}
        confirmLabel={state.saving ? "Deleting..." : "Delete category"}
        loading={state.saving}
        onCancel={() => actions.setConfirmDeleteId(null)}
        onConfirm={() => void actions.submitDeleteCategory()}
      />
    </div>
  );
}
