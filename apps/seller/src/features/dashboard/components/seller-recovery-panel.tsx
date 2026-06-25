import { EmptyState, PanelHeader, StatusBadge, SurfaceCard } from "@itech/shared";
import type { SellerRecoveryItem } from "../types";
import { formatDateTime, formatMoney, getRecoveryTone } from "../helpers";

type SellerRecoveryPanelProps = {
  items: SellerRecoveryItem[];
};

export default function SellerRecoveryPanel({
  items,
}: SellerRecoveryPanelProps) {
  return (
    <SurfaceCard className="flex h-full min-h-[40rem] max-h-[40rem] flex-col rounded-[2rem] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
      <PanelHeader
        title="Returns and cancellations"
        description="Watch service recovery requests that can affect customer trust and revenue."
      />

      <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">
                    {item.type === "return" ? "Return" : "Cancellation"} • #
                    {item.orderId?.slice(0, 8) || item.id.slice(0, 8)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.customerLabel} • {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <StatusBadge className={getRecoveryTone(item.status)}>
                  {item.status}
                </StatusBadge>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                {item.reason}
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {formatMoney(item.amount)}
              </p>
            </div>
          ))
        ) : (
          <EmptyState
            title="No recovery requests"
            description="Returns and cancellation requests will show up here when customers need follow-up."
          />
        )}
      </div>
    </SurfaceCard>
  );
}
