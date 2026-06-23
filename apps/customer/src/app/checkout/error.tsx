"use client";

import { useEffect } from "react";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[checkout] render error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_#d1fae5_0%,_#f0fdf4_40%,_#f8fafc_100%)] px-4">
      <div className="w-full max-w-md rounded-[1.5rem] border border-zinc-200 bg-white/90 p-8 text-center shadow-sm backdrop-blur">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-6 w-6 text-red-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376C1.83 17.65 2.943 20 4.857 20h14.286c1.913 0 3.027-2.35 1.96-4.124L13.86 4.876c-.957-1.5-3.064-1.5-4.022 0L2.697 16.126Z"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-base font-semibold text-zinc-800">
          Không tải được trang thanh toán
        </h1>
        <p className="mb-1 text-sm text-zinc-500">
          Đã có lỗi khi tải thông tin giỏ hàng hoặc địa chỉ.
        </p>
        <p className="mb-6 text-sm font-medium text-emerald-600">
          Giỏ hàng của bạn vẫn an toàn, chưa có gì bị mất.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={reset}
            className="w-full rounded-[1.5rem] bg-emerald-500 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600"
          >
            Thử lại
          </button>
          <a
            href="/customer/cart"
            className="w-full rounded-[1.5rem] border border-zinc-200 py-3 text-center text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            Quay lại giỏ hàng
          </a>
        </div>
      </div>
    </main>
  );
}
