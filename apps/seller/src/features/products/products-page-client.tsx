"use client";

import { AlertBanner, MetricsGrid, PageIntro, StatCard } from "@itech/shared";
import ProductFormModal from "./components/product-form-modal";
import ProductListSection from "./components/product-list-section";
import ProductViewModal from "./components/product-view-modal";
import { useProductsPage } from "./hooks/use-products-page";
import { normalizeStockStatus } from "./helpers";

export default function ProductsPageClient() {
  const { state, actions } = useProductsPage();

  const selectedStatus = state.selectedProduct
    ? normalizeStockStatus(state.selectedProduct.stockQuantity)
    : "OUT_STOCK";

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Seller products"
        title="My Products"
        description="Manage your own catalog, review product details, and update inventory without stepping into the admin workflow."
        className="bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
        titleClassName="sm:text-4xl"
      />

      {state.error ? (
        <AlertBanner tone="danger" message={state.error} className="rounded-[1.5rem]" />
      ) : null}

      <MetricsGrid className="xl:grid-cols-4">
        <StatCard
          title="Total products"
          value={state.stats.total.toLocaleString("vi-VN")}
          note="Items in your catalog"
          className="!h-full !p-6"
          accentClassName="bg-slate-400"
        />
        <StatCard
          title="In stock"
          value={state.stats.active.toLocaleString("vi-VN")}
          note="Healthy inventory"
          className="!h-full !p-6"
          accentClassName="bg-emerald-500"
        />
        <StatCard
          title="Low stock"
          value={state.stats.lowStock.toLocaleString("vi-VN")}
          note="Needs attention soon"
          className="!h-full !p-6"
          accentClassName="bg-amber-500"
        />
        <StatCard
          title="Out of stock"
          value={state.stats.outStock.toLocaleString("vi-VN")}
          note="Unavailable right now"
          className="!h-full !p-6"
          accentClassName="bg-rose-500"
        />
      </MetricsGrid>

      <ProductListSection
        loading={state.loading}
        searchText={state.searchText}
        onSearchTextChange={actions.setSearchText}
        categoryFilter={state.categoryFilter}
        onCategoryFilterChange={actions.setCategoryFilter}
        statusFilter={state.statusFilter}
        onStatusFilterChange={actions.setStatusFilter}
        categories={state.categories}
        pagedProducts={state.pagedProducts}
        filteredProductsLength={state.filteredProducts.length}
        onRefresh={() => void actions.loadProducts()}
        onViewProduct={(product) => void actions.openView(product)}
        onEditProduct={(product) => void actions.openEdit(product)}
        page={state.page}
        totalPages={state.totalPages}
        onPrevPage={() => actions.setPage((value) => Math.max(1, value - 1))}
        onNextPage={() => actions.setPage((value) => Math.min(state.totalPages, value + 1))}
      />

      <ProductViewModal
        open={state.detailOpen && Boolean(state.selectedProduct)}
        product={state.selectedProduct}
        selectedStatus={selectedStatus}
        onClose={() => actions.setDetailOpen(false)}
        onEdit={(product) => void actions.openEdit(product)}
      />

      <ProductFormModal
        open={state.editOpen && Boolean(state.selectedProduct)}
        draft={state.draft}
        categories={state.categories}
        selectedProduct={state.selectedProduct}
        saving={state.saving}
        variantDrafts={state.variantDrafts}
        onClose={() => actions.setEditOpen(false)}
        onSubmit={() => void actions.saveProduct()}
        onDraftChange={actions.setDraft}
        onHandlePreviewImages={actions.handlePreviewImages}
        onAddVariantAttribute={actions.addVariantAttribute}
        onUpdateVariantAttribute={actions.updateVariantAttribute}
        onRemoveVariantAttribute={actions.removeVariantAttribute}
        onUpdateVariantRow={actions.updateVariantRow}
        onSetVariantImage={actions.setVariantImage}
        onResetVariantImage={actions.resetVariantImage}
      />
    </div>
  );
}
