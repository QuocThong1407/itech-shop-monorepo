"use client";

import {
  Button,
  DetailSection,
  EmptyState,
  KeyValueGrid,
  ModalShell,
  StatusBadge,
} from "@itech/shared";
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

            <KeyValueGrid
              items={[
                { label: "Price", value: formatMoney(product.price) },
                {
                  label: "Stock",
                  value: Number(product.stockQuantity || 0).toLocaleString("vi-VN"),
                },
                {
                  label: "Status",
                  value: (
                    <StatusBadge
                      className={stockMeta[selectedStatus].tone}
                      dotClassName={stockMeta[selectedStatus].chip}
                      withDot
                    >
                      {stockMeta[selectedStatus].label}
                    </StatusBadge>
                  ),
                },
              ]}
              columnsClassName="grid gap-4 sm:grid-cols-3"
            />

            <DetailSection title="Description" className="bg-slate-50 shadow-none">
              <div className="prose prose-slate mt-3 max-w-none text-sm leading-7 text-slate-600">
                {product.description ? (
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                ) : (
                  <p>No description provided.</p>
                )}
              </div>
            </DetailSection>

            <KeyValueGrid
              items={[
                { label: "Category", value: product.Category?.name || "N/A" },
                { label: "Seller", value: product.Seller?.User?.username || "N/A" },
              ]}
              columnsClassName="grid gap-4 sm:grid-cols-2"
            />

            <KeyValueGrid
              items={[
                { label: "Ratings", value: `${product.averageRating ?? 0}/5` },
                {
                  label: "Reviews",
                  value: (product.reviewCount ?? 0).toLocaleString("vi-VN"),
                },
                { label: "Sold", value: (product.soldCount ?? 0).toLocaleString("vi-VN") },
              ]}
              columnsClassName="grid gap-4 sm:grid-cols-3"
            />

            <DetailSection title="Timeline" className="shadow-sm">
              <KeyValueGrid
                items={[
                  { label: "Created", value: formatDateTime(product.createdAt) },
                  { label: "Updated", value: formatDateTime(product.updatedAt) },
                ]}
                columnsClassName="grid gap-3"
              />
            </DetailSection>
          </div>

          <div className="space-y-5 bg-slate-50 p-6">
            <DetailSection title="Gallery" className="shadow-sm">
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
            </DetailSection>

            <DetailSection title="Variants" className="shadow-sm">
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
            </DetailSection>

            <div className="flex justify-end gap-3">
              <Button
                onClick={() => onEdit(product)}
                variant="secondary"
                className="!shadow-none"
              >
                Edit product
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}
