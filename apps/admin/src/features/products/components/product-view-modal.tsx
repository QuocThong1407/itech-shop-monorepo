"use client";

import { EmptyState, ModalShell } from "@itech/shared";
import { formatDateTime, formatMoney } from "../../../lib/admin-api";
import { stockMeta } from "../constants";
import type { ProductDetail } from "../types";

type ProductViewModalProps = {
  open: boolean;
  product: ProductDetail | null;
  selectedStatus: "ACTIVE" | "LOW_STOCK" | "OUT_STOCK";
  onClose: () => void;
  onEdit: (product: ProductDetail) => void;
};

export default function ProductViewModal({
  open,
  product,
  selectedStatus,
  onClose,
  onEdit,
}: ProductViewModalProps) {
  return (
    <ModalShell
      open={open}
      title={product?.name ?? "Product detail"}
      subtitle="Inspect product media, pricing, seller and variant records."
      onClose={onClose}
      widthClass="max-w-6xl"
      eyebrow="Products"
    >
      {product ? (
        <div className="grid gap-0 lg:grid-cols-[1fr_0.98fr]">
          <div className="space-y-5 p-6 lg:border-r lg:border-slate-200">
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100">
              <div className="aspect-[16/10]">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-slate-400">
                    No main image
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Price
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {formatMoney(product.price)}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Stock
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {Number(product.stockQuantity || 0).toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Status
                </p>
                <span
                  className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${stockMeta[selectedStatus].tone}`}
                >
                  <span className={`h-2 w-2 rounded-full ${stockMeta[selectedStatus].chip}`} />
                  {stockMeta[selectedStatus].label}
                </span>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Description</p>
              <div className="prose prose-slate mt-3 max-w-none text-sm leading-7 text-slate-600">
                {product.description ? (
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                ) : (
                  <p>No description provided.</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Category
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {product.Category?.name || "N/A"}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Seller
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {product.Seller?.User?.username || "N/A"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Ratings
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {product.averageRating ?? 0}/5
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Reviews
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {(product.reviewCount ?? 0).toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Sold
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {(product.soldCount ?? 0).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Timeline</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Created</span>
                  <span className="font-medium text-slate-900">
                    {formatDateTime(product.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Updated</span>
                  <span className="font-medium text-slate-900">
                    {formatDateTime(product.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 bg-slate-50 p-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Gallery</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {(product.images ?? []).length > 0 ? (
                  product.images?.map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                    >
                      <div className="aspect-square">
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No gallery images." className="col-span-full py-8" />
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Variants</p>
              <div className="mt-4 space-y-3">
                {(product.ProductVariant ?? []).length > 0 ? (
                  product.ProductVariant?.map((variant) => (
                    <div
                      key={variant.id}
                      className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {Object.entries(variant.variantAttributes || {})
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(" · ")}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Quantity {variant.quantity} · Price adj.{" "}
                            {variant.priceAdjustment ?? 0}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                          {variant.images?.length || 0} images
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No variants for this product." className="py-6" />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => onEdit(product)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Edit product
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}
