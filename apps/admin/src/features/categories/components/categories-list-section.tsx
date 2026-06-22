"use client";

import { Badge, EmptyState } from "@itech/shared";
import { formatCategoryDate } from "../helpers";
import type { CategoryRecord, Pagination, RankedCategory } from "../types";

type CategoriesListSectionProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onSubmitSearch: () => void;
  onOpenAdd: () => void;
  error: string | null;
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
  error,
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
    <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmitSearch();
          }}
        >
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by category name"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 sm:w-80"
          />
          <button
            type="submit"
            className="h-11 rounded-2xl bg-[#008ECC] px-4 text-sm font-semibold text-white transition hover:bg-[#0075aa]"
          >
            Search
          </button>
        </form>

        <button
          type="button"
          onClick={onOpenAdd}
          className="h-11 rounded-2xl border border-slate-900 bg-slate-900 px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
        >
          Add category
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full table-fixed border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
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
                  <tr key={category.id} className="rounded-[1.25rem] bg-slate-50/80">
                    <td className="rounded-l-[1.25rem] px-4 py-4 align-top">
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
                    <td className="rounded-r-[1.25rem] px-4 py-4 align-top">
                      <div className="flex justify-end gap-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => void onOpenView(category)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenEdit(category)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDelete(category.id)}
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
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
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-900">{categories.length}</span> of{" "}
          <span className="font-medium text-slate-900">{pagination.total}</span> categories
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1 || loading}
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages || 1}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages || loading}
            onClick={() => onPageChange(pagination.page + 1)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </article>
  );
}
