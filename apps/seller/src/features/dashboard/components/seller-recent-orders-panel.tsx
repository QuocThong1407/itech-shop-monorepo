import {
  EmptyState,
  PanelHeader,
  StatusBadge,
  SurfaceCard,
  TableShell,
} from "@itech/shared";
import type { OrderRecord } from "../../orders/types";
import {
  formatDateTime,
  formatMoney,
  getPaymentLabel,
  getPaymentTone,
  getStatusLabel,
} from "../../orders/helpers";

type SellerRecentOrdersPanelProps = {
  orders: OrderRecord[];
};

export default function SellerRecentOrdersPanel({
  orders,
}: SellerRecentOrdersPanelProps) {
  return (
    <SurfaceCard className="h-full rounded-[2rem] p-0 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
      <div className="border-b border-slate-200 py-3">
        <PanelHeader
          title="Recent orders"
          description="Track the newest orders entering your seller pipeline."
        />
      </div>

      {orders.length > 0 ? (
        <TableShell className="pt-5 !px-0">
          <table className="w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <th className="px-5 py-4">Order</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Value</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {orders.map((order) => {
                const payment = order.Payment?.[0];
                return (
                  <tr key={order.id}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDateTime(order.orderDate || order.createdAt || "")}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <p className="font-medium text-slate-900">
                        {order.Customer?.User?.username || "Customer"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {order.Customer?.User?.email || "No email"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                      {formatMoney(Number(payment?.amount || 0))}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge className={getPaymentTone(payment?.status)}>
                        {getPaymentLabel(payment?.status)}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge className="bg-slate-100 text-slate-700 ring-slate-200">
                        {getStatusLabel(order.status)}
                      </StatusBadge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      ) : (
        <div className="p-6">
          <EmptyState
            title="No recent orders yet"
            description="New orders will appear here once customers start checking out your products."
          />
        </div>
      )}
    </SurfaceCard>
  );
}
