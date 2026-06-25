import { EmptyState, PanelHeader, StatusBadge, SurfaceCard } from "@itech/shared";
import type { SellerProductHighlight } from "../types";
import { formatDateTime, formatMoney, getStockTone } from "../helpers";

type SellerTopProductsPanelProps = {
  products: SellerProductHighlight[];
};

export default function SellerTopProductsPanel({
  products,
}: SellerTopProductsPanelProps) {
  return (
    <SurfaceCard className="flex h-full flex-col rounded-[2rem] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
      <PanelHeader
        title="Top product focus"
        description="Your strongest movers and the items that deserve the next inventory decision."
      />

      <div className="mt-5 flex-1 space-y-3">
        {products.length > 0 ? (
          products.map((product) => (
            <div
              key={product.id}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {product.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {product.Category?.name || "Uncategorized"} • updated{" "}
                    {formatDateTime(product.updatedAt)}
                  </p>
                </div>
                <StatusBadge className={getStockTone(product.status)}>
                  {product.status === "ACTIVE"
                    ? "In stock"
                    : product.status === "LOW_STOCK"
                      ? "Low stock"
                      : "Out of stock"}
                </StatusBadge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Revenue anchor
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {formatMoney(product.price)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Stock
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {Number(product.stockQuantity || 0).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Sold count
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {Number(product.soldCount || 0).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="No product performance yet"
            description="Top products will surface here after your catalog starts receiving orders."
          />
        )}
      </div>
    </SurfaceCard>
  );
}
