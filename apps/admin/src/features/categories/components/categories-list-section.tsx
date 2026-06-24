"use client";

import {
  Badge,
  Button,
  EmptyState,
  FilterToolbar,
  SearchInput,
  TableCard,
  TablePagination,
  TableShell,
} from "@itech/shared";
import { formatCategoryDate } from "../helpers";
import type { CategoryRecord, Pagination, RankedCategory } from "../types";

type CategoriesListSectionProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onSubmitSearch: () => void;
  onOpenAdd: () => void;
  loading: boolean;
  categories: CategoryRecord[];
  pagination: Pagination;
  topCategoryMap: Map<string, RankedCategory>;
  onOpenView: (category: CategoryRecord) => void | Promise<void>;
  onOpenEdit: (category: CategoryRecord) => void;
  onRequestDelete: (id: string) => void;
  onPageChange: (page: number) => void;
};

export default function CategoriesListSection({
  search,
  onSearchChange,
  onSubmitSearch,
  onOpenAdd,
  loading,
  categories,
  pagination,
  topCategoryMap,
  onOpenView,
  onOpenEdit,
  onRequestDelete,
  onPageChange,
}: CategoriesListSectionProps) {
  return (
    <TableCard className="rounded-[2rem] shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
      <div className="border-b border-slate-200 px-5 pb-4 pt-5">
        <form
          className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmitSearch();
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by category name"
              className="!w-full !w-xl !max-w-[22rem] !bg-white !focus:border-sky-300 !focus:ring-sky-100"
            />
            <Button type="submit" variant="secondary" className="!border-slate-200 !shadow-none">
              Search
            </Button>
          </div>

          <Button onClick={onOpenAdd} variant="primary" className="!border !border-slate-900 !shadow-none">
            Add category
          </Button>
        </form>
      </div>

      <FilterToolbar className="pb-4 pt-4">
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-900">{categories.length}</span> of{" "}
          <span className="font-semibold text-slate-900">{pagination.total}</span> categories
        </p>
      </FilterToolbar>

      <TableShell className="pt-0" innerClassName="overflow-x-auto">
        <table className="min-w-full table-fixed">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
              <th className="w-[25%] px-4 py-2 font-medium">Category</th>
              <th className="w-[25%] px-4 py-2 font-medium">Description</th>
              <th className="w-[16%] px-4 py-2 font-medium">Created</th>
              <th className="w-[16%] px-4 py-2 font-medium">Rank</th>
              <th className="w-[18%] px-4 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">
                  Loading categories...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8">
                  <EmptyState
                    title="No categories found"
                    description="Try another search keyword or add a new category."
                  />
                </td>
              </tr>
              ) : (
                categories.map((category) => {
                  const rankInfo = topCategoryMap.get(category.id);

                  return (
                  <tr key={category.id} className="border-t border-slate-200 align-top">
                    <td className="px-4 py-4 align-top">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-slate-400">No img</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">{category.name}</p>
                          <p className="mt-1 text-xs text-slate-500">ID: {category.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">
                      <p className="break-words">{category.description || "No description"}</p>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-500">
                      <span className="block break-words">{formatCategoryDate(category.createdAt)}</span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      {rankInfo ? (
                        <Badge tone="success" className="max-w-full">
                          Top #{rankInfo.rank} - {rankInfo.productCount} products
                        </Badge>
                      ) : (
                        <Badge>Not ranked</Badge>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex justify-end gap-2 whitespace-nowrap">
                        <Button
                          onClick={() => void onOpenView(category)}
                          size="sm"
                          variant="secondary"
                          className="rounded-full border-slate-200 px-3 py-2 text-xs shadow-none"
                        >
                          View
                        </Button>
                        <Button
                          onClick={() => onOpenEdit(category)}
                          size="sm"
                          variant="secondary"
                          className="rounded-full border-slate-200 px-3 py-2 text-xs shadow-none"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => onRequestDelete(category.id)}
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

      <div className="flex flex-col gap-3 px-5 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-900">{categories.length}</span> of{" "}
          <span className="font-medium text-slate-900">{pagination.total}</span> categories
        </p>

        <TablePagination
          page={pagination.page}
          totalPages={pagination.totalPages || 1}
          onPrevious={() => onPageChange(Math.max(1, pagination.page - 1))}
          onNext={() => onPageChange(pagination.page + 1)}
          className="gap-2"
        />
      </div>
    </TableCard>
  );
}
