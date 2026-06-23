"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@itech/shared";
import { type Order, type OrderStatus, getOrderTotal } from "@/lib/order-types";
import { ArrowRight, Loader2 } from "lucide-react";

const STATUS_TONE: Record<
  OrderStatus,
  "warning" | "neutral" | "success" | "danger"
> = {
  PENDING: "warning",
  CONFIRMED: "neutral",
  SHIPPED: "neutral",
  DELIVERED: "success",
  CANCELLED: "danger",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPED: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

const STATUS_TABS: Array<{ value: OrderStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "SHIPPED", label: "Đang giao" },
  { value: "DELIVERED", label: "Đã giao" },
  { value: "CANCELLED", label: "Đã hủy" },
];

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDateShort(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

interface OrdersListProps {
  initialOrders: Order[];
  initialTotal: number;
  initialPage: number;
  limit: number;
  status: OrderStatus | "ALL";
}

export default function OrdersList({
  initialOrders,
  initialTotal,
  initialPage,
  limit,
  status,
}: OrdersListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [orders, setOrders] = useState(initialOrders);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(initialTotal);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const hasMore = orders.length < total;

  function handleStatusChange(next: OrderStatus | "ALL") {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "ALL") {
      params.delete("status");
    } else {
      params.set("status", next);
    }
    startTransition(() => {
      router.push(`/customer/orders?${params.toString()}`);
    });
  }

  async function handleLoadMore() {
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("limit", String(limit));
      if (status !== "ALL") params.set("status", status);

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load more orders");

      const data = await res.json();
      const raw = data.data ?? data;
      setOrders((prev) => [...prev, ...(raw.orders ?? [])]);
      setPage(nextPage);
      setTotal(raw.pagination?.total ?? total);
    } catch {
      // Giữ nguyên danh sách hiện tại, không phá UI nếu load more lỗi
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <div>
      {/* Status tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => {
          const isActive = tab.value === status;
          return (
            <button
              key={tab.value}
              onClick={() => handleStatusChange(tab.value)}
              disabled={isPending}
              className={`shrink-0 rounded-xl px-4 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                isActive
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-white/80 text-zinc-500 border border-zinc-200 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Order list */}
      {orders.length > 0 && (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => {
            const itemCount = order.OrderItem.reduce(
              (sum, item) => sum + item.quantity,
              0,
            );
            return (
              <li
                key={order.id}
                className="rounded-[1.5rem] border border-zinc-200 bg-white/80 px-6 py-5 shadow-sm backdrop-blur-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="font-geist text-sm font-semibold text-zinc-900">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <Badge tone={STATUS_TONE[order.status]}>
                        {STATUS_LABEL[order.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400">
                      {formatDateShort(order.orderDate)} · {itemCount} sản phẩm
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2.5">
                    <span className="font-geist text-base font-semibold text-emerald-600">
                      {formatVND(getOrderTotal(order))}
                    </span>
                    <Link
                      href={`/customer/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 active:scale-95"
                    >
                      Xem chi tiết
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Empty state cho tab đang chọn (không phải empty state tổng) */}
      {orders.length === 0 && (
        <div className="rounded-[1.5rem] border border-zinc-200 bg-white/80 px-8 py-14 text-center text-sm text-zinc-400 shadow-sm backdrop-blur-sm">
          Không có đơn hàng nào ở trạng thái này.
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-6 py-2.5 text-sm font-medium text-zinc-600 shadow-sm transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-60"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải...
              </>
            ) : (
              "Xem thêm đơn hàng"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
