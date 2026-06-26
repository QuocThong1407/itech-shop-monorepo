import Link from "next/link";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { Badge } from "@itech/shared";
import OrderActions from "./order-actions";
import { getPaymentLabel, getPaymentColor } from "@/lib/payment-label";
import { CreditCard } from "lucide-react";
import RepayButton from "./repay-button";
import {
  getOrder,
  getOrderTotal,
  getOrderItemUnitPrice,
  getActiveCancellation,
  getActiveReturn,
  type Order,
  type OrderStatus,
} from "@/lib/api";
import {
  ArrowLeft,
  MapPin,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
} from "lucide-react";

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

// Đúng theo validateStatusTransition trong orderHelper.js:
// PENDING → CONFIRMED → SHIPPED → DELIVERED (CANCELLED có thể xảy ra ở 3 bước đầu)
const TIMELINE_STEPS: Array<{
  status: OrderStatus;
  label: string;
  icon: typeof Clock;
}> = [
  { status: "PENDING", label: "Đã đặt hàng", icon: Clock },
  { status: "CONFIRMED", label: "Đã xác nhận", icon: Package },
  { status: "SHIPPED", label: "Đang giao hàng", icon: Truck },
  { status: "DELIVERED", label: "Đã giao thành công", icon: CheckCircle2 },
];

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function buildTimeline(order: Order) {
  // CANCELLED là trạng thái cuối riêng biệt, không nằm trong chuỗi tuyến tính
  if (order.status === "CANCELLED") {
    return [
      {
        status: "PENDING" as const,
        label: "Đã đặt hàng",
        icon: Clock,
        done: true,
        time: order.orderDate,
      },
      {
        status: "CANCELLED" as const,
        label: "Đơn hàng đã hủy",
        icon: XCircle,
        done: true,
        time: order.updatedAt,
      },
    ];
  }

  const order_ = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];
  const currentIndex = order_.indexOf(order.status);

  return TIMELINE_STEPS.map((step, i) => ({
    ...step,
    done: i <= currentIndex,
    time:
      i === 0 ? order.orderDate : i === currentIndex ? order.updatedAt : null,
  }));
}

async function fetchOrder(id: string): Promise<Order | null> {
  try {
    return await getOrder(id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("403")) {
      // Order tồn tại nhưng không thuộc về user này → coi như không tìm thấy,
      // tránh lộ thông tin "đơn hàng này có tồn tại"
      return null;
    }
    if (message.includes("401")) {
      redirect("/customer/login");
    }
    // 404 hoặc lỗi khác → not found
    return null;
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await fetchOrder(id);

  if (!order) notFound();

  const timeline = buildTimeline(order);
  const total = getOrderTotal(order);

  const payment = Array.isArray(order.Payment)
    ? order.Payment[0]
    : order.Payment;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#d1fae5_0%,_#f0fdf4_40%,_#ffffff_100%)] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Back */}
        <Link
          href="/orders"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Danh sách đơn hàng
        </Link>

        {/* Order header card */}
        <div className="mb-4 rounded-[1.5rem] border border-zinc-200 bg-white/80 px-6 py-5 shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-widest text-zinc-400">
                Mã đơn hàng
              </p>
              <h1 className="font-geist text-xl font-semibold text-zinc-900">
                #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="mt-1 text-xs text-zinc-400">
                Đặt lúc {formatDate(order.orderDate)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap justify-end gap-2">
                <Badge tone={STATUS_TONE[order.status]}>
                  {STATUS_LABEL[order.status]}
                </Badge>
                {(() => {
                  const activeCancellation = getActiveCancellation(order);
                  const activeReturn = getActiveReturn(order);
                  if (activeCancellation) {
                    return (
                      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
                        {activeCancellation.status === "APPROVED"
                          ? "Đã duyệt hủy"
                          : "Chờ hủy"}
                      </span>
                    );
                  }
                  if (activeReturn) {
                    return (
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600">
                        {activeReturn.status === "APPROVED"
                          ? "Đã duyệt hoàn"
                          : "Chờ hoàn hàng"}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
              <span className="font-geist text-xl font-bold text-emerald-600">
                {formatVND(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="mb-4 rounded-[1.5rem] border border-zinc-200 bg-white/80 px-6 py-5 shadow-sm backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-zinc-700">
              Địa chỉ giao hàng
            </h2>
          </div>
          <p className="text-sm font-medium text-zinc-900">
            {order.Address.phoneNumber}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {order.Address.address}, {order.Address.street},{" "}
            {order.Address.ward}, {order.Address.district},{" "}
            {order.Address.province}
          </p>
        </div>

        {/* Payment info */}
        {payment && (
          <div className="mb-4 rounded-[1.5rem] border border-zinc-200 bg-white/80 px-6 py-5 shadow-sm backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-zinc-700">
                Thông tin thanh toán
              </h2>
            </div>
            <div className="flex items-center justify-between">
              <span
                className="text-sm font-medium"
                style={{ color: getPaymentColor(payment) }}
              >
                {getPaymentLabel(payment)}
              </span>
              {payment.method !== "COD" && payment.status !== "SUCCESS" && (
                <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-600">
                  Chưa thanh toán
                </span>
              )}
              {payment.status === "SUCCESS" && (
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-600">
                  Đã thanh toán
                </span>
              )}
              {payment.method === "COD" && (
                <span className="rounded-full bg-zinc-50 border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500">
                  Thanh toán khi nhận hàng
                </span>
              )}
            </div>

            {/* ↓ Thêm đoạn này */}
            {payment.method === "VNPAY" &&
              payment.status !== "SUCCESS" &&
              !["CANCELLED", "DELIVERED"].includes(order.status) && (
                <RepayButton
                  orderId={order.id}
                  createdAt={payment.createdAt ?? order.orderDate}
                />
              )}
          </div>
        )}

        {/* Timeline */}
        <div className="mb-4 rounded-[1.5rem] border border-zinc-200 bg-white/80 px-6 py-5 shadow-sm backdrop-blur-sm">
          <h2 className="mb-4 text-sm font-semibold text-zinc-700">
            Trạng thái đơn hàng
          </h2>
          <ol className="relative flex flex-col gap-0">
            {timeline.map((step, i) => {
              const Icon = step.icon;
              const isLast = i === timeline.length - 1;
              const isCancelled = step.status === "CANCELLED";
              return (
                <li key={step.status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                        isCancelled
                          ? "bg-red-100 text-red-600"
                          : step.done
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-zinc-100 text-zinc-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {!isLast && (
                      <div
                        className={`mt-1 h-6 w-px ${
                          step.done ? "bg-emerald-200" : "bg-zinc-100"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-4 pt-1">
                    <p
                      className={`text-sm font-medium ${
                        isCancelled
                          ? "text-red-600"
                          : step.done
                            ? "text-zinc-800"
                            : "text-zinc-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.time && (
                      <p className="text-xs text-zinc-400">
                        {formatDate(step.time)}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Items */}
        <div className="rounded-[1.5rem] border border-zinc-200 bg-white/80 px-6 py-5 shadow-sm backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-zinc-700">
              Sản phẩm ({order.OrderItem.length})
            </h2>
          </div>
          <ul className="divide-y divide-zinc-100">
            {order.OrderItem.map((item) => {
              const unitPrice = getOrderItemUnitPrice(item);
              const attrs = item.ProductVariant.variantAttributes;
              const thumbnail =
                item.ProductVariant.images?.[0] ??
                item.ProductVariant.Product.images?.[0];

              return (
                <li key={item.id} className="flex items-center gap-4 py-3">
                  {/* Thumbnail */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
                    {thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbnail}
                        alt={item.ProductVariant.Product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-zinc-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {item.ProductVariant.Product.name}
                    </p>
                    {attrs && Object.keys(attrs).length > 0 && (
                      <p className="text-xs text-zinc-400">
                        {Object.entries(attrs)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(" · ")}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400">
                      {formatVND(unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-zinc-800">
                    {formatVND(unitPrice * item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Total */}
          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
            <span className="text-sm font-medium text-zinc-600">Tổng cộng</span>
            <span className="font-geist text-lg font-bold text-emerald-600">
              {formatVND(total)}
            </span>
          </div>
        </div>
        <OrderActions
          orderId={order.id}
          status={order.status}
          existingCancellation={getActiveCancellation(order)}
          existingReturn={getActiveReturn(order)}
        />
      </div>
    </div>
  );
}
