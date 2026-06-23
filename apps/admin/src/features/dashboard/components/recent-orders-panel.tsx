import { formatShortDate, formatStatus, statusClass } from "../helpers";
import type { OrderList } from "../types";

type RecentOrdersPanelProps = {
  orderList: OrderList;
};

export default function RecentOrdersPanel({ orderList }: RecentOrdersPanelProps) {
  const recentOrders = orderList.orders.slice(0, 5);

  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#008ECC]">Recent orders</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">Latest activity</h3>
        </div>
        <span className="text-sm text-slate-500">Fetched from `/api/orders`</span>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
              <th className="px-4 py-2 font-medium">Order</th>
              <th className="px-4 py-2 font-medium">Customer</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Date</th>
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
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusClass(
                        order.status,
                      )}`}
                    >
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className="rounded-r-[1.25rem] px-4 py-4 text-slate-500">
                    {formatShortDate(order.orderDate || order.createdAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                  No order data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
