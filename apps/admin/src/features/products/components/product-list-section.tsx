"use client";

import {
  Button,
  EmptyState,
  FilterToolbar,
  SearchInput,
  SelectInput,
  StatusBadge,
  TableCard,
  TablePagination,
  TableShell,
  TabPills,
} from "@itech/shared";
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
  onStatusFilterChange: (
    value: "ALL" | "ACTIVE" | "LOW_STOCK" | "OUT_STOCK",
  ) => void;
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
    <TableCard className="rounded-[2rem] shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
      <FilterToolbar className="border-b border-slate-200 px-5 pb-4 pt-5">
        <TabPills
          items={[
            { key: "ALL", label: "All" },
            { key: "ACTIVE", label: "In stock" },
            { key: "LOW_STOCK", label: "Low stock" },
            { key: "OUT_STOCK", label: "Out stock" },
          ]}
          activeKey={statusFilter}
          onChange={(key) =>
            onStatusFilterChange(
              key as "ALL" | "ACTIVE" | "LOW_STOCK" | "OUT_STOCK",
            )
          }
          className="justify-start"
          activeClassName="!bg-slate-950 !text-white !shadow-none"
          inactiveClassName="!border !border-slate-200 !bg-white !text-slate-600 hover:!bg-slate-50"
        />

        <div className="flex flex-wrap items-center gap-3">
          <SelectInput
            value={categoryFilter}
            onChange={(event) => onCategoryFilterChange(event.target.value)}
            className="!h-11 !w-auto !min-w-[12rem] !bg-white"
          >
            <option value="ALL">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectInput>

          <Button
            onClick={onRefresh}
            variant="secondary"
            className="!shadow-none"
          >
            Refresh
          </Button>

          <Button
            onClick={onOpenImport}
            variant="secondary"
            className="!shadow-none"
          >
            Import file
          </Button>

          <Button
            onClick={onOpenAdd}
            variant="primary"
            className="!border !border-slate-900 !shadow-none"
          >
            Add product
          </Button>
        </div>
      </FilterToolbar>

      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <SearchInput
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSearch();
              }
            }}
            placeholder="Name, category, seller"
            className="!w-full w-xl !max-w-[22rem] !bg-white !focus:border-sky-300 !focus:ring-sky-100"
          />
          <Button
            onClick={onSearch}
            variant="secondary"
            className="!shadow-none"
          >
            Search
          </Button>
          <Button
            onClick={onClear}
            variant="secondary"
            className="!shadow-none"
          >
            Clear
          </Button>
          <Button
            onClick={onOpenBulkDelete}
            disabled={selectedCount === 0}
            variant="secondary"
            className="!border-rose-200 !bg-rose-50 !text-rose-700 !shadow-none hover:!bg-rose-100"
          >
            Delete selected
          </Button>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p>
            {selectedCount > 0
              ? `${selectedCount} products selected for bulk actions.`
              : "Select one or more products to use bulk delete."}
          </p>
          {selectedCount > 0 ? (
            <Button
              onClick={onClearSelection}
              size="md"
              variant="secondary"
              className="rounded-full border-slate-200 shadow-none"
            >
              Clear selection
            </Button>
          ) : null}
        </div>
      </div>

      <TableShell className="pt-0">
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
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-16 text-center text-sm text-slate-500"
                >
                  Loading products...
                </td>
              </tr>
            ) : pagedProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center">
                  <EmptyState
                    title="No products found"
                    description="Try another filter or create a new product."
                  />
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
                        {Number(product.stockQuantity || 0).toLocaleString(
                          "vi-VN",
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      <StatusBadge
                        className={stockMeta[status].tone}
                        dotClassName={stockMeta[status].chip}
                        withDot
                      >
                        {stockMeta[status].label}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex flex-nowrap justify-end gap-2 whitespace-nowrap">
                        <Button
                          onClick={() => onViewProduct(product)}
                          size="sm"
                          variant="secondary"
                          className="rounded-full border-slate-200 px-3 py-2 text-xs shadow-none"
                        >
                          View
                        </Button>
                        <Button
                          onClick={() => onEditProduct(product)}
                          size="sm"
                          variant="secondary"
                          className="rounded-full border-slate-200 px-3 py-2 text-xs shadow-none"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => onDeleteProduct(product)}
                          size="sm"
                          variant="secondary"
                          className="rounded-full !border-rose-200 !bg-rose-50 !px-3 !py-2 !text-xs !text-rose-700 !shadow-none hover:!bg-rose-100"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableShell>

      <div className="flex flex-col gap-3 px-5 pb-5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing{" "}
          {filteredProductsLength === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{" "}
          {Math.min(page * PAGE_SIZE, filteredProductsLength)} of{" "}
          {filteredProductsLength}
        </p>
        <TablePagination
          page={page}
          totalPages={totalPages || 1}
          onPrevious={onPrevPage}
          onNext={onNextPage}
          previousLabel="Prev"
          nextLabel="Next"
          className="gap-2"
        />
      </div>
    </TableCard>
  );
}
