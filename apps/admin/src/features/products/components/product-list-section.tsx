"use client";

import { formatMoney } from "../../../lib/admin-api";
import { PAGE_SIZE, stockMeta } from "../constants";
import { normalizeStockStatus } from "../helpers";
import type { CategoryOption, ProductRecord } from "../types";

type ProductListSectionProps = {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onRefresh: () => void;
  onOpenBulkDelete: () => void;
  selectedCount: number;
  statusFilter: "ALL" | "ACTIVE" | "LOW_STOCK" | "OUT_STOCK";
  onStatusFilterChange: (value: "ALL" | "ACTIVE" | "LOW_STOCK" | "OUT_STOCK") => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  categories: CategoryOption[];
  onOpenImport: () => void;
  onOpenAdd: () => void;
  onClearSelection: () => void;
  loading: boolean;
  pagedProducts: ProductRecord[];
  allPagedSelected: boolean;
  onToggleSelectAllPaged: () => void;
  selectedProductIds: string[];
  onToggleProductSelection: (productId: string) => void;
  onViewProduct: (product: ProductRecord) => void;
  onEditProduct: (product: ProductRecord) => void;
  onDeleteProduct: (product: ProductRecord) => void;
  page: number;
  totalPages: number;
  filteredProductsLength: number;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export default function ProductListSection({
  searchInput,
  onSearchInputChange,
  onSearch,
  onClear,
  onRefresh,
  onOpenBulkDelete,
  selectedCount,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  onOpenImport,
  onOpenAdd,
  onClearSelection,
  loading,
  pagedProducts,
  allPagedSelected,
  onToggleSelectAllPaged,
  selectedProductIds,
  onToggleProductSelection,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  page,
  totalPages,
  filteredProductsLength,
  onPrevPage,
  onNextPage,
}: ProductListSectionProps) {
  return (
    <section className="space-y-6">
      <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Product list</p>
            <p className="mt-1 text-sm text-slate-500">
              Search, filter, and manage inventory records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-11 min-w-[18rem] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600">
              <span className="text-slate-400">Search</span>
              <input
                value={searchInput}
                onChange={(event) => onSearchInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onSearch();
                  }
                }}
                placeholder="Name, category, seller"
                className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>
            <button
              type="button"
              onClick={onSearch}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Search
            </button>
            <button
              type="button"
              onClick={onClear}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={onOpenBulkDelete}
              disabled={selectedCount === 0}
              className="h-11 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete selected
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["ALL", "ACTIVE", "LOW_STOCK", "OUT_STOCK"] as const).map(
              (status) => {
                const active = statusFilter === status;
                const label =
                  status === "ALL"
                    ? "All"
                    : status === "ACTIVE"
                      ? "In stock"
                      : status === "LOW_STOCK"
                        ? "Low stock"
                        : "Out stock";
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onStatusFilterChange(status)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-slate-950 text-white shadow-[0_10px_22px_rgba(15,23,42,0.16)]"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                );
              },
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={categoryFilter}
              onChange={(event) => onCategoryFilterChange(event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-slate-400"
            >
              <option value="ALL">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onOpenImport}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Import file
            </button>

            <button
              type="button"
              onClick={onOpenAdd}
              className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
            >
              Add product
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p>
            {selectedCount > 0
              ? `${selectedCount} products selected for bulk actions.`
              : "Select one or more products to use bulk delete."}
          </p>
          {selectedCount > 0 ? (
            <button
              type="button"
              onClick={onClearSelection}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Clear selection
            </button>
          ) : null}
        </div>
      </article>

      <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <table className="w-full table-fixed divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-[5%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                <input
                  type="checkbox"
                  checked={allPagedSelected}
                  onChange={onToggleSelectAllPaged}
                  aria-label="Select all products on this page"
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                />
              </th>
              <th className="w-[24%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Product
              </th>
              <th className="w-[14%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Category
              </th>
              <th className="w-[14%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Seller
              </th>
              <th className="w-[10%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Price
              </th>
              <th className="w-[8%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Stock
              </th>
              <th className="w-[12%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Status
              </th>
              <th className="w-[18%] px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center text-sm text-slate-500">
                  Loading products...
                </td>
              </tr>
            ) : pagedProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center">
                  <p className="text-sm font-medium text-slate-900">No products found</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Try another filter or create a new product.
                  </p>
                </td>
              </tr>
            ) : (
              pagedProducts.map((product) => {
                const status = normalizeStockStatus(product.stockQuantity);

                return (
                  <tr key={product.id} className="align-top">
                    <td className="px-5 py-5">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product.id)}
                        onChange={() => onToggleProductSelection(product.id)}
                        aria-label={`Select product ${product.name}`}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                      />
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-xs font-semibold text-slate-400">
                              No img
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {product.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5 text-sm text-slate-600">
                      <p className="truncate font-medium text-slate-900">
                        {product.Category?.name || "N/A"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {product.categoryId.slice(0, 8)}
                      </p>
                    </td>
                    <td className="px-5 py-5 text-sm text-slate-600">
                      <p className="truncate font-medium text-slate-900">
                        {product.Seller?.User?.username || "N/A"}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {product.Seller?.User?.email || "No email"}
                      </p>
                    </td>
                    <td className="px-5 py-5 text-sm text-slate-600">
                      {formatMoney(product.price)}
                    </td>
                    <td className="px-5 py-5 text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">
                        {Number(product.stockQuantity || 0).toLocaleString("vi-VN")}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${stockMeta[status].tone}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${stockMeta[status].chip}`} />
                        {stockMeta[status].label}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex flex-nowrap justify-end gap-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onViewProduct(product)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditProduct(product)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(product)}
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {(page - 1) * PAGE_SIZE + 1}-{" "}
            {Math.min(page * PAGE_SIZE, filteredProductsLength)} of{" "}
            {filteredProductsLength}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={onPrevPage}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={onNextPage}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
