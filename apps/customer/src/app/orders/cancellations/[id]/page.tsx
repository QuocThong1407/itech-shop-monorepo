import Link from "next/link";
import { notFound } from "next/navigation";
import { getCancellation } from "@/lib/api";
import { ArrowLeft, Package } from "lucide-react";

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

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Chờ xử lý",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  COMPLETED: "Đã hủy",
};

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: "text-amber-600 bg-amber-50 border-amber-200",
  APPROVED: "text-blue-600 bg-blue-50 border-blue-200",
  REJECTED: "text-red-600 bg-red-50 border-red-200",
  COMPLETED: "text-zinc-600 bg-zinc-50 border-zinc-200",
};

export default async function CancellationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let cancellation;
  try {
    cancellation = await getCancellation(id);
  } catch {
    notFound();
  }

  const payment = cancellation.Order.Payment?.[0];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#d1fae5_0%,_#f0fdf4_40%,_#ffffff_100%)] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/orders/${cancellation.orderId}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-emerald-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Chi tiết đơn hàng
        </Link>

        {/* Header */}
        <div className="mb-4 rounded-[1.5rem] border border-zinc-200 bg-white/80 px-6 py-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-1">
                Yêu cầu hủy đơn
              </p>
              <h1 className="font-geist text-xl font-semibold text-zinc-900">
                #{cancellation.orderId.slice(0, 8).toUpperCase()}
              </h1>
              <p className="mt-1 text-xs text-zinc-400">
                Gửi lúc {formatDate(cancellation.createdAt)}
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLOR[cancellation.status] ?? "text-zinc-600 bg-zinc-50 border-zinc-200"}`}
            >
              {STATUS_LABEL[cancellation.status] ?? cancellation.status}
            </span>
          </div>
        </div>

        {/* Thông tin yêu cầu */}
        <div className="mb-4 rounded-[1.5rem] border border-zinc-200 bg-white/80 px-6 py-5 shadow-sm backdrop-blur-sm space-y-3">
          <h2 className="text-sm font-semibold text-zinc-700">
            Thông tin yêu cầu
          </h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-zinc-400">Yêu cầu bởi</span>
            <span className="text-zinc-800 text-right">Người mua</span>
            <span className="text-zinc-400">Yêu cầu vào</span>
            <span className="text-zinc-800 text-right">
              {formatDate(cancellation.createdAt)}
            </span>
            <span className="text-zinc-400">Lý do</span>
            <span className="text-zinc-800 text-right">
              {cancellation.reason}
            </span>
            {payment && (
              <>
                <span className="text-zinc-400">Phương thức thanh toán</span>
                <span className="text-zinc-800 text-right">
                  {payment.method}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Sản phẩm */}
        <div className="mb-4 rounded-[1.5rem] border border-zinc-200 bg-white/80 px-6 py-5 shadow-sm backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-zinc-700">
              Sản phẩm ({cancellation.Order.OrderItem.length})
            </h2>
          </div>
          <ul className="divide-y divide-zinc-100">
            {cancellation.Order.OrderItem.map((item) => {
              const thumbnail =
                item.ProductVariant.images?.[0] ??
                item.ProductVariant.Product.images?.[0];
              const unitPrice =
                item.ProductVariant.Product.price +
                item.ProductVariant.priceAdjustment;
              const attrs = item.ProductVariant.variantAttributes;
              return (
                <li key={item.id} className="flex items-center gap-4 py-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
                    {thumbnail ? (
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
                          .map(([k, v]) => `${k}: ${v}`)
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

        {/* Back to order */}
        <div className="flex justify-end">
          <Link
            href={`/orders/${cancellation.orderId}`}
            className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
          >
            Chi tiết đơn hàng
          </Link>
        </div>
      </div>
    </div>
  );
}
