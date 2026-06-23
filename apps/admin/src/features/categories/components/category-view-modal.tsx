"use client";

import { EmptyState, ModalShell } from "@itech/shared";
import { formatCategoryDate, formatCategoryMoney } from "../helpers";
import type { CategoryRecord, ProductRecord } from "../types";

type CategoryViewModalProps = {
  open: boolean;
  category: CategoryRecord | null;
  products: ProductRecord[];
  productsLoading: boolean;
  onClose: () => void;
};

export default function CategoryViewModal({
  open,
  category,
  products,
  productsLoading,
  onClose,
}: CategoryViewModalProps) {
  return (
    <ModalShell
      open={open}
      eyebrow="Category detail"
      title={category?.name ?? "Category"}
      subtitle="Review category information and the products attached to it."
      onClose={onClose}
      widthClass="max-w-4xl"
    >
      {category ? (
        <div className="grid gap-6 p-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-64 w-full object-cover"
                />
              ) : (
                <div className="grid h-64 place-items-center text-sm text-slate-400">
                  No image available
                </div>
              )}
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Description</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {category.description || "No description provided."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Created</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {formatCategoryDate(category.createdAt)}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Updated</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {formatCategoryDate(category.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#008ECC]">Products in category</p>
                <h4 className="mt-1 text-lg font-semibold text-slate-950">
                  {products.length} items loaded
                </h4>
              </div>
            </div>

            <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
              {productsLoading ? (
                <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                  Loading products...
                </div>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-white p-3"
                  >
                    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-100">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">No img</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {product.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatCategoryMoney(product.price)} - Stock {product.stockQuantity}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No products found in this category"
                  description="This category is currently empty."
                  className="bg-white"
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}
