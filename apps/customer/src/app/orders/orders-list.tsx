"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@itech/shared";
import { type Order, type OrderStatus, getOrderTotal } from "@/lib/order-types";
import { ArrowRight, Loader2, Package } from "lucide-react";
import { getActiveCancellation, getActiveReturn } from "@/lib/order-types";
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

const STATUS_TABS: Array<{
  value: OrderStatus | "ALL" | "RETURNED";
  label: string;
}> = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "SHIPPED", label: "Đang giao" },
  { value: "DELIVERED", label: "Đã giao" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "RETURNED", label: "Trả hàng" },
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

function getVariantLabel(attrs: Record<string, string> | null | undefined) {
  if (!attrs) return null;
  const values = Object.values(attrs).filter(Boolean);
  return values.length > 0 ? values.join(" · ") : null;
}

interface OrdersListProps {
  initialOrders: Order[];
  initialTotal: number;
  initialPage: number;
  limit: number;
  status: OrderStatus | "ALL" | "RETURNED";
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
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const hasMore = orders.length < total;

  function handleStatusChange(next: OrderStatus | "ALL" | "RETURNED") {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "ALL") {
      params.delete("status");
      params.delete("hasReturn");
    } else if (next === "RETURNED") {
      params.delete("status");
      params.set("hasReturn", "true");
    } else {
      params.set("status", next);
      params.delete("hasReturn");
    }
    startTransition(() => {
      router.push(`/orders?${params.toString()}`);
    });
  }

  async function handleLoadMore() {
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("limit", String(limit));
      if (status === "RETURNED") {
        params.set("hasReturn", "true");
      } else if (status !== "ALL") {
        params.set("status", status);
      }

      const res = await fetch(`/customer/api/orders?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load more orders (status ${res.status})`);
      }

      const data = await res.json();
      const raw = data.data ?? data;
      const newOrders: Order[] = raw.orders ?? [];

      if (newOrders.length === 0) {
        // Backend báo còn nhưng trả về rỗng → đồng bộ lại total để ẩn nút
        setTotal(orders.length);
        return;
      }

      setOrders((prev) => [...prev, ...newOrders]);
      setPage(nextPage);
      setTotal(raw.pagination?.total ?? total);
    } catch (err) {
      console.error("Load more orders error:", err);
      setLoadMoreError("Không thể tải thêm đơn hàng. Vui lòng thử lại.");
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
            const firstItem = order.OrderItem[0];
            const extraProductCount = order.OrderItem.length - 1;

            const firstThumbnail =
              firstItem?.ProductVariant.images?.[0] ??
              firstItem?.ProductVariant.Product.images?.[0];
            const firstVariantLabel = getVariantLabel(
              firstItem?.ProductVariant.variantAttributes,
            );

            return (
              <li
                key={order.id}
                className="rounded-[1.5rem] border border-zinc-200 bg-white/80 px-6 py-5 shadow-sm backdrop-blur-sm transition hover:shadow-md"
              >
                {/* Header: mã đơn + status + tổng tiền */}
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="font-geist text-sm font-semibold text-zinc-900">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>

                      {/* Badge status gốc */}
                      <Badge tone={STATUS_TONE[order.status]}>
                        {STATUS_LABEL[order.status]}
                      </Badge>

                      {/* Badge phụ — cùng size với Badge component */}
                      {(() => {
                        const cancelReq = getActiveCancellation(order);
                        const returnReq = getActiveReturn(order);
                        if (cancelReq) {
                          return (
                            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
                              {cancelReq.status === "APPROVED"
                                ? "Đã duyệt hủy"
                                : "Chờ hủy"}
                            </span>
                          );
                        }
                        if (returnReq) {
                          return (
                            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600">
                              {returnReq.status === "APPROVED"
                                ? "Đã duyệt hoàn"
                                : "Chờ hoàn hàng"}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <p className="text-xs text-zinc-400">
                      {formatDateShort(order.orderDate)} · {itemCount} sản phẩm
                    </p>
                  </div>
                  <span className="shrink-0 font-geist text-base font-semibold text-emerald-600">
                    {formatVND(getOrderTotal(order))}
                  </span>
                </div>

                {/* Product preview row */}
                {firstItem && (
                  <div className="mb-4 flex items-center gap-3 rounded-2xl bg-zinc-50/80 p-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-100 bg-white">
                      {firstThumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={firstThumbnail}
                          alt={firstItem.ProductVariant.Product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-zinc-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-800">
                        {firstItem.ProductVariant.Product.name}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {firstVariantLabel ? `${firstVariantLabel} · ` : ""}
                        SL: {firstItem.quantity}
                      </p>
                      {extraProductCount > 0 && (
                        <p className="mt-0.5 text-xs text-zinc-400">
                          và {extraProductCount} sản phẩm khác
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action */}
                <div className="flex justify-end">
                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 active:scale-95"
                  >
                    Xem chi tiết
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
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

      {/* Load more / hết danh sách */}
      {orders.length > 0 && (
        <div className="mt-6 flex flex-col items-center gap-2">
          {loadMoreError && (
            <p className="text-sm text-red-500">{loadMoreError}</p>
          )}

          {hasMore ? (
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
          ) : (
            <p className="text-xs text-zinc-400">
              Đã hiển thị tất cả {total} đơn hàng
            </p>
          )}
        </div>
      )}
    </div>
  );
}
