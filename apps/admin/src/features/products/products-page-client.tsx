"use client";

import { ConfirmDialog, StatCard } from "@itech/shared";
import ProductFormModal from "./components/product-form-modal";
import ProductImportModal from "./components/product-import-modal";
import ProductListSection from "./components/product-list-section";
import ProductViewModal from "./components/product-view-modal";
import { useProductsPage } from "./hooks/use-products-page";

export default function ProductsPageClient() {
  const { state, actions } = useProductsPage();

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
              Catalog engine
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Products
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Manage inventory, pricing, category assignment, seller assignment,
              and product media with real backend data.
            </p>
          </div>
        </div>
      </section>

      {state.error ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total products"
          value={state.stats.total.toLocaleString("vi-VN")}
          note="All items in the catalog"
          accentClassName="bg-[#008ECC]"
        />
        <StatCard
          title="In stock"
          value={state.stats.active.toLocaleString("vi-VN")}
          note="Healthy inventory levels"
          accentClassName="bg-emerald-500"
        />
        <StatCard
          title="Low stock"
          value={state.stats.lowStock.toLocaleString("vi-VN")}
          note="Need replenishment soon"
          accentClassName="bg-amber-500"
        />
        <StatCard
          title="Out of stock"
          value={state.stats.outStock.toLocaleString("vi-VN")}
          note="Currently unavailable items"
          accentClassName="bg-rose-500"
        />
      </section>

      <ProductListSection
        searchInput={state.searchInput}
        onSearchInputChange={actions.setSearchInput}
        onSearch={() => {
          actions.setSearchQuery(state.searchInput.trim());
          actions.setPage(1);
        }}
        onClear={() => {
          actions.setSearchInput("");
          actions.setSearchQuery("");
          actions.setCategoryFilter("ALL");
          actions.setStatusFilter("ALL");
          actions.setPage(1);
        }}
        onRefresh={actions.loadProducts}
        onOpenBulkDelete={() => actions.setBulkDeleteOpen(true)}
        selectedCount={state.selectedProductIds.length}
        statusFilter={state.statusFilter}
        onStatusFilterChange={actions.setStatusFilter}
        categoryFilter={state.categoryFilter}
        onCategoryFilterChange={actions.setCategoryFilter}
        categories={state.categories}
        onOpenImport={() => {
          actions.setError(null);
          actions.setImportResult(null);
          actions.setImportFile(null);
          actions.setImportContinueOnError(true);
          actions.setImportOpen(true);
        }}
        onOpenAdd={actions.openAddModal}
        onClearSelection={() => actions.setSelectedProductIds([])}
        loading={state.loading}
        pagedProducts={state.pagedProducts}
        allPagedSelected={state.allPagedSelected}
        onToggleSelectAllPaged={actions.toggleSelectAllPaged}
        selectedProductIds={state.selectedProductIds}
        onToggleProductSelection={actions.toggleProductSelection}
        onViewProduct={actions.openViewModal}
        onEditProduct={actions.openEditModal}
        onDeleteProduct={actions.setConfirmDelete}
        page={state.page}
        totalPages={state.totalPages}
        filteredProductsLength={state.filteredProducts.length}
        onPrevPage={() => actions.setPage((value) => Math.max(1, value - 1))}
        onNextPage={() =>
          actions.setPage((value) => Math.min(state.totalPages, value + 1))
        }
      />

      <ProductFormModal
        open={state.modalMode === "add" || state.modalMode === "edit"}
        modalMode={state.modalMode === "edit" ? "edit" : "add"}
        draft={state.draft}
        categories={state.categories}
        sellers={state.sellers}
        editingId={state.editingId}
        saving={state.saving}
        onClose={actions.closeModal}
        onSubmit={actions.submitProduct}
        onDraftChange={actions.setDraft}
        onAddVariantRow={actions.addVariantRow}
        onRemoveVariantRow={actions.removeVariantRow}
        onAddVariantAttribute={actions.addVariantAttribute}
        onUpdateVariantAttribute={actions.updateVariantAttribute}
        onRemoveVariantAttribute={actions.removeVariantAttribute}
        onUpdateVariantRow={actions.updateVariantRow}
        onSetVariantImage={actions.setVariantImage}
        onOpenImages={actions.openImages}
        onRemovePreview={actions.removePreview}
      />

      <ProductViewModal
        open={state.modalMode === "view" && Boolean(state.selectedProduct)}
        product={state.selectedProduct}
        selectedStatus={state.selectedStatus}
        onClose={actions.closeModal}
        onEdit={actions.openEditModal}
      />

      <ProductImportModal
        open={state.importOpen}
        importFile={state.importFile}
        importContinueOnError={state.importContinueOnError}
        importResult={state.importResult}
        importing={state.importing}
        onClose={actions.closeImportModal}
        onSubmit={actions.submitImport}
        onFileChange={actions.setImportFile}
        onContinueOnErrorChange={actions.setImportContinueOnError}
        onResetResult={() => actions.setImportResult(null)}
      />

      <ConfirmDialog
        open={Boolean(state.confirmDelete)}
        eyebrow="Confirm deletion"
        title="Delete product?"
        description="This will soft delete the product from the catalog. Existing references remain in the database."
        confirmLabel={state.saving ? "Deleting..." : "Delete"}
        loading={state.saving}
        onCancel={() => actions.setConfirmDelete(null)}
        onConfirm={actions.deleteProduct}
      />

      <ConfirmDialog
        open={state.bulkDeleteOpen}
        eyebrow="Bulk deletion"
        title="Delete selected products?"
        description={`This will soft delete ${state.selectedProductIds.length} selected products from the catalog. Existing references in orders and reports remain available.`}
        confirmLabel={state.saving ? "Deleting..." : "Delete selected"}
        loading={state.saving}
        onCancel={() => actions.setBulkDeleteOpen(false)}
        onConfirm={actions.submitBulkDelete}
      >
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
          Review the selected list before confirming. This action hides the
          products from active management screens.
        </div>
      </ConfirmDialog>
    </div>
  );
}
