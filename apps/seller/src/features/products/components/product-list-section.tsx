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
import { filterTabs, PAGE_SIZE } from "../constants";
import {
  formatMoney,
  getStatusMeta,
  getVariantSummary,
  normalizeStockStatus,
} from "../helpers";
import type { CategoryOption, FilterStatus, ProductRecord } from "../types";

type ProductListSectionProps = {
  loading: boolean;
  searchText: string;
  onSearchTextChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  statusFilter: FilterStatus;
  onStatusFilterChange: (value: FilterStatus) => void;
  categories: CategoryOption[];
  pagedProducts: ProductRecord[];
  filteredProductsLength: number;
  onRefresh: () => void;
  onViewProduct: (product: ProductRecord) => void;
  onEditProduct: (product: ProductRecord) => void;
  page: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export default function ProductListSection({
  loading,
  searchText,
  onSearchTextChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  categories,
  pagedProducts,
  filteredProductsLength,
  onRefresh,
  onViewProduct,
  onEditProduct,
  page,
  totalPages,
  onPrevPage,
  onNextPage,
}: ProductListSectionProps) {
  return (
    <TableCard className="rounded-[2rem] shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
      <FilterToolbar className="border-b border-slate-200 px-5 pb-4 pt-5">
        <TabPills
          items={filterTabs.map((status) => ({
            key: status,
            label: status === "ALL" ? "All" : getStatusMeta(status).label,
          }))}
          activeKey={statusFilter}
          onChange={(key) => onStatusFilterChange(key as FilterStatus)}
          className="justify-start"
          activeClassName="!bg-amber-600 !text-white !shadow-none"
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
            variant="primary"
            className="!border !border-amber-700 !bg-amber-600 !text-white !shadow-none hover:!bg-amber-500"
          >
            Refresh
          </Button>
        </div>
      </FilterToolbar>

      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <SearchInput
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
            placeholder="Product, category, seller"
            className="!w-full !max-w-md !bg-white !focus:border-amber-300 !focus:ring-amber-100"
          />
        </div>
      </div>

      <TableShell className="pt-0" innerClassName="overflow-x-auto overflow-y-hidden">
        <table className="min-w-[1100px] w-full table-fixed divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              <th className="w-[28%] px-5 py-4">Product</th>
              <th className="w-[12%] px-5 py-4">Price</th>
              <th className="w-[12%] px-5 py-4">Stock</th>
              <th className="w-[12%] px-5 py-4">Variants</th>
              <th className="w-[10%] px-5 py-4">Sold</th>
              <th className="w-[12%] px-5 py-4">Status</th>
              <th className="w-[14%] px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-sm text-slate-500">
                  Loading products...
                </td>
              </tr>
            ) : pagedProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <EmptyState
                    title="No products found"
                    description="Try another filter or search keyword."
                  />
                </td>
              </tr>
            ) : (
              pagedProducts.map((product) => {
                const status = normalizeStockStatus(product.stockQuantity);
                const meta = getStatusMeta(status);

                return (
                  <tr key={product.id} className="align-top">
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
                          <p className="mt-1 truncate text-xs text-slate-400">
                            {product.Category?.name || "No category"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5 text-sm text-slate-600">
                      {formatMoney(product.price)}
                    </td>
                    <td className="px-5 py-5 text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">
                        {Number(product.stockQuantity || 0).toLocaleString("vi-VN")}
                      </span>
                    </td>
                    <td className="px-5 py-5 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">
                        {getVariantSummary(product)}
                      </span>
                    </td>
                    <td className="px-5 py-5 text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">
                        {(product.soldCount ?? 0).toLocaleString("vi-VN")}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      <StatusBadge className={meta.tone} dotClassName={meta.chip} withDot>
                        {meta.label}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex flex-nowrap justify-end gap-2 whitespace-nowrap">
                        <Button
                          onClick={() => onViewProduct(product)}
                          size="sm"
                          variant="secondary"
                          className="rounded-full border-amber-200 px-3 py-2 text-xs text-amber-700 shadow-none hover:border-amber-300 hover:bg-amber-50"
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
          Showing {filteredProductsLength === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{" "}
          {Math.min(page * PAGE_SIZE, filteredProductsLength)} of {filteredProductsLength}
        </p>
        <TablePagination
          page={page}
          totalPages={totalPages || 1}
          onPrevious={onPrevPage}
          onNext={onNextPage}
          className="gap-2"
        />
      </div>
    </TableCard>
  );
}
