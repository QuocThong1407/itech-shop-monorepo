"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PaymentResult() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const orderId = searchParams.get("orderId");
  const message = searchParams.get("message");

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center gap-6 text-center max-w-md w-full">
        {success ? (
          <>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <svg
                className="h-10 w-10 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900">
                Thanh toán thành công!
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Đơn hàng của bạn đã được xác nhận và đang được xử lý.
              </p>
              {orderId && (
                <p className="mt-1 text-xs text-zinc-400">
                  Mã đơn:{" "}
                  <span className="font-mono font-medium text-zinc-600">
                    #{orderId.slice(0, 8).toUpperCase()}
                  </span>
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3 w-full">
              {orderId && (
                <Link
                  href={`/orders/${orderId}`}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition"
                >
                  Xem chi tiết đơn hàng
                </Link>
              )}
              <Link
                href="/orders"
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
              >
                Tất cả đơn hàng
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-100">
              <svg
                className="h-10 w-10 text-rose-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900">
                Thanh toán thất bại
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                {message ?? "Giao dịch không thành công. Vui lòng thử lại."}
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              {orderId && (
                <Link
                  href={`/orders/${orderId}`}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition"
                >
                  Thử lại thanh toán
                </Link>
              )}
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
              >
                Về trang chủ
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
