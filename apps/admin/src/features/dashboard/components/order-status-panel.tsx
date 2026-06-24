import { InfoField, KeyValueGrid, PanelHeader, StatusBadge, SurfaceCard } from "@itech/shared";
import { buildOrderStatusRing, emptyMoney, formatStatus } from "../helpers";
import type { OrderList, RevenueReport } from "../types";

type OrderStatusPanelProps = {
  orderList: OrderList;
  revenueReport: RevenueReport;
};

export default function OrderStatusPanel({ orderList, revenueReport }: OrderStatusPanelProps) {
  const { counts: orderStatusCounts, total: orderStatusTotal, gradient } = buildOrderStatusRing(
    orderList.orders,
  );

  return (
    <SurfaceCard className="flex h-full flex-col rounded-[2rem] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
      <PanelHeader
        title="Fulfillment balance"
        eyebrow="Order status"
        actions={
          <StatusBadge tone="neutral" className="bg-slate-100 text-slate-600 ring-slate-200">
            {orderStatusTotal.toLocaleString("vi-VN")} orders loaded
          </StatusBadge>
        }
      />

      <div className="flex flex-1 flex-col justify-center py-4">
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex items-center justify-center">
            <div className="relative h-56 w-56">
              <div className="absolute inset-0 rounded-full" style={{ background: gradient }} />
              <div className="absolute inset-6 rounded-full bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]" />
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Orders</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">
                    {orderStatusTotal.toLocaleString("vi-VN")}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Current dataset</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(orderStatusCounts).map(([status, count]) => {
              const percentage = ((count / orderStatusTotal) * 100).toFixed(1);
              return (
                <div key={status}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{formatStatus(status)}</span>
                    <span className="text-slate-500">
                      {count.toLocaleString("vi-VN")} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={
                        status.toUpperCase() === "DELIVERED"
                          ? "h-2 rounded-full bg-emerald-500"
                          : status.toUpperCase() === "SHIPPED"
                            ? "h-2 rounded-full bg-sky-500"
                            : status.toUpperCase() === "CONFIRMED"
                              ? "h-2 rounded-full bg-amber-500"
                              : status.toUpperCase() === "CANCELLED"
                                ? "h-2 rounded-full bg-rose-500"
                                : "h-2 rounded-full bg-slate-400"
                      }
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <KeyValueGrid
        className="mt-5"
        columnsClassName="grid grid-cols-2 gap-3 md:grid-cols-4"
        itemClassName="ring-1 ring-slate-200"
        items={[
          {
            label: "Income",
            value: <span className="text-[18px] font-semibold text-slate-950">{emptyMoney(revenueReport.summary.totalIncome)}</span>,
          },
          {
            label: "Refund",
            value: <span className="text-[18px] font-semibold text-slate-950">{emptyMoney(revenueReport.summary.totalRefund)}</span>,
          },
          {
            label: "Net",
            value: <span className="text-[18px] font-semibold text-slate-950">{emptyMoney(revenueReport.summary.netRevenue)}</span>,
          },
          {
            label: "Points",
            value: <span className="text-[18px] font-semibold text-slate-950">{revenueReport.rows.length.toLocaleString("vi-VN")}</span>,
          },
        ]}
      />
    </SurfaceCard>
  );
}
