import { EmptyState, PanelHeader, StatusBadge, SurfaceCard, TableShell } from "@itech/shared";
import { formatShortDate, formatStatus, statusClass } from "../helpers";
import type { OrderList } from "../types";

type RecentOrdersPanelProps = {
  orderList: OrderList;
};

export default function RecentOrdersPanel({ orderList }: RecentOrdersPanelProps) {
  const recentOrders = orderList.orders.slice(0, 5);

  return (
    <SurfaceCard className="flex h-full flex-col rounded-[2rem] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
      <PanelHeader
        title="Latest activity"
        eyebrow="Recent orders"
      />

      <TableShell className="mt-6 flex-1 !p-0" innerClassName="h-full border-0">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
              <th className="w-[32%] px-4 py-2 font-medium">Order</th>
              <th className="w-[26%] px-4 py-2 font-medium">Customer</th>
              <th className="w-[16%] px-4 py-2 font-medium">Amount</th>
              <th className="w-[14%] px-4 py-2 font-medium">Status</th>
              <th className="w-[12%] px-4 py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <tr key={order.id} className="rounded-[1.25rem] bg-slate-50/80">
                  <td className="rounded-l-[1.25rem] px-4 py-4 font-medium text-slate-900">
                    {order.id}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {order.Customer?.User?.username || order.Customer?.User?.email || "Guest"}
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      maximumFractionDigits: 0,
                    }).format(Number(order.Payment?.[0]?.amount ?? 0))}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge className={statusClass(order.status)}>
                      {formatStatus(order.status)}
                    </StatusBadge>
                  </td>
                  <td className="rounded-r-[1.25rem] px-4 py-4 text-slate-500">
                    {formatShortDate(order.orderDate || order.createdAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-10">
                  <EmptyState title="No order data available" className="border-0 bg-transparent py-0" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableShell>
    </SurfaceCard>
  );
}
