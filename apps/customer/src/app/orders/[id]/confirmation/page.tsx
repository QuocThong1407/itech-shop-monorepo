// app/customer/orders/[id]/confirmation/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import {
  getOrder,
  getOrderTotal,
  getOrderItemUnitPrice,
  type Order,
} from "@/lib/api";
import { CheckCircle2, Package, MapPin, ArrowRight } from "lucide-react";

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

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  VNPAY: "Đã thanh toán qua VNPay",
  STRIPE: "Đã thanh toán qua Stripe",
};

async function fetchOrder(id: string): Promise<Order | null> {
  try {
    return await getOrder(id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("403")) return null;
    if (message.includes("401")) redirect("/login");
    return null;
  }
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await fetchOrder(id);

  if (!order) notFound();

  const total = getOrderTotal(order);
  const totalQty = order.OrderItem.reduce((sum, i) => sum + i.quantity, 0);
  const payment = Array.isArray(order.Payment)
    ? order.Payment[0]
    : order.Payment;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#d1fae5_0%,_#f0fdf4_40%,_#ffffff_100%)] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Success banner */}
        <div className="mb-6 flex flex-col items-center gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 px-6 py-8 text-center shadow-sm backdrop-blur-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="font-geist text-lg font-semibold text-emerald-700">
              Đặt hàng thành công
            </h1>
            <p className="mt-1 text-sm text-emerald-600/80">
              Chúng tôi đã ghi nhận đơn hàng của bạn và sẽ liên hệ để xác nhận
              sớm nhất.
            </p>
          </div>
        </div>

        {/* Order info */}
        <div className="mb-4 rounded-[1.5rem] border border-zinc-200 bg-white/80 px-6 py-5 shadow-sm backdrop-blur-sm">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">
            Thông tin đơn hàng
          </h2>
          <dl className="divide-y divide-zinc-100 text-sm">
            <Row
              label="Mã đơn hàng"
              value={`#${order.id.slice(0, 8).toUpperCase()}`}
              mono
            />
            <Row label="Thời gian đặt" value={formatDate(order.orderDate)} />
            <Row label="Số lượng sản phẩm" value={String(totalQty)} />
            <Row label="Phí vận chuyển" value="Miễn phí" />
            <Row
              label="Phương thức thanh toán"
              value={
                payment
                  ? (PAYMENT_METHOD_LABEL[payment.method] ?? payment.method)
                  : "—"
              }
            />
            <Row
              label="Tổng tiền"
              value={formatVND(total)}
              labelClassName="font-semibold text-zinc-800"
              valueClassName="text-base font-bold text-emerald-600"
            />
          </dl>
        </div>

        {/* Shipping address */}
        <div className="mb-4 rounded-[1.5rem] border border-zinc-200 bg-white/80 px-6 py-5 shadow-sm backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-zinc-700">
              Thông tin nhận hàng
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

        {/* Items */}
        <div className="mb-6 rounded-[1.5rem] border border-zinc-200 bg-white/80 px-6 py-5 shadow-sm backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-zinc-700">
              Danh sách sản phẩm
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
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/products"
            className="flex-1 rounded-[1.5rem] border border-zinc-200 bg-white px-4 py-3.5 text-center text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            Tiếp tục mua hàng
          </Link>
          <Link
            href={`/${order.id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[1.5rem] bg-emerald-500 px-4 py-3.5 text-center text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600"
          >
            Xem chi tiết đơn hàng
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  labelClassName,
  valueClassName,
}: {
  label: string;
  value: string;
  mono?: boolean;
  labelClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <span className={`text-zinc-500 ${labelClassName ?? ""}`}>{label}</span>
      <span
        className={`text-right ${mono ? "font-mono" : ""} text-zinc-800 ${valueClassName ?? ""}`}
      >
        {value}
      </span>
    </div>
  );
}
