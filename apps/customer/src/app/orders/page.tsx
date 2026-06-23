import Link from "next/link";
import { getOrders, type OrderStatus } from "@/lib/api";
import OrdersList from "./orders-list";
import { ShoppingBag, ArrowRight, PackageOpen } from "lucide-react";

const LIMIT = 10;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const status = (statusParam as OrderStatus | undefined) ?? undefined;

  const { orders, pagination } = await getOrders({
    page: 1,
    limit: LIMIT,
    status,
  });

  // Empty state tổng: chỉ hiện khi KHÔNG lọc gì cả mà vẫn không có đơn nào.
  // Nếu đang lọc theo status mà rỗng, OrdersList tự xử lý empty state riêng cho tab đó.
  const isFullyEmpty = !status && pagination.total === 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#d1fae5_0%,_#f0fdf4_40%,_#ffffff_100%)] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100">
            <ShoppingBag className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="font-geist text-2xl font-semibold tracking-tight text-zinc-900">
              Đơn hàng của tôi
            </h1>
            <p className="text-sm text-zinc-500">
              {pagination.total > 0
                ? `${pagination.total} đơn hàng`
                : "Chưa có đơn hàng nào"}
            </p>
          </div>
        </div>

        {isFullyEmpty ? (
          <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-zinc-200 bg-white/80 px-8 py-20 text-center shadow-sm backdrop-blur-sm">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <PackageOpen className="h-9 w-9 text-emerald-400" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-zinc-800">
              Chưa có đơn hàng nào
            </h2>
            <p className="mb-7 max-w-xs text-sm leading-relaxed text-zinc-500">
              Bạn chưa đặt hàng lần nào. Khám phá sản phẩm và bắt đầu mua sắm
              ngay nhé!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-600 active:scale-95"
            >
              Khám phá sản phẩm
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <OrdersList
            key={status ?? "all"}
            initialOrders={orders}
            initialTotal={pagination.total}
            initialPage={pagination.page}
            limit={LIMIT}
            status={status ?? "ALL"}
          />
        )}
      </div>
    </div>
  );
}
