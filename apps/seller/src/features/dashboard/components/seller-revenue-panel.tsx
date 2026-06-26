import { EmptyState, PanelHeader, SurfaceCard } from "@itech/shared";
import type { SellerOperationalSnapshot, SellerRevenuePoint } from "../types";
import { formatMoney } from "../helpers";

type SellerRevenuePanelProps = {
  trend: SellerRevenuePoint[];
  snapshot: SellerOperationalSnapshot;
};

export default function SellerRevenuePanel({
  trend,
  snapshot,
}: SellerRevenuePanelProps) {
  const maxRevenue = Math.max(...trend.map((item) => item.revenue), 1);

  return (
    <SurfaceCard className="flex h-full flex-col rounded-[2rem] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
      <PanelHeader
        title="Revenue momentum"
        description="A live view of secured revenue volume over the latest order activity window."
      />

      <div className="mt-6 space-y-4">
        <div className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,_rgba(245,158,11,0.10)_0%,_rgba(255,255,255,0.96)_100%)] p-5">
          {trend.length > 0 ? (
            <div className="flex min-h-[16rem] items-end gap-3">
              {trend.map((point) => (
                <div key={point.key} className="flex min-w-0 flex-1 flex-col items-center gap-3">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-900">
                      {formatMoney(point.revenue)}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      {point.orders} orders
                    </p>
                  </div>
                  <div className="flex h-40 w-full items-end rounded-full bg-white/80 px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                    <div
                      className="w-full rounded-full bg-[linear-gradient(180deg,_#f59e0b_0%,_#f97316_100%)] shadow-[0_12px_24px_rgba(245,158,11,0.24)] transition-all"
                      style={{
                        height: `${Math.max(18, (point.revenue / maxRevenue) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">{point.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Not enough order revenue yet"
              description="Revenue bars will appear once successful payments start flowing into your seller account."
              className="h-full"
            />
          )}
        </div>

        <div className="grid gap-3 lg:grid-cols-3 pt-5">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Revenue secured
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(snapshot.totalRevenue)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Successful payments captured across your orders.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-500">
              Delivered revenue
            </p>
            <p className="mt-3 text-2xl font-semibold text-emerald-700">
              {formatMoney(snapshot.deliveredRevenue)}
            </p>
            <p className="mt-1 text-sm text-emerald-700/80">
              Revenue tied to completed deliveries.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-500">
              Exposure
            </p>
            <p className="mt-3 text-2xl font-semibold text-sky-700">
              {formatMoney(snapshot.pendingRevenue)}
            </p>
            <p className="mt-1 text-sm text-sky-700/80">
              Paid value still moving toward delivery.
            </p>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}
