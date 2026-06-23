"use client";

import { useEffect } from "react";

export default function CartError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CartError]", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#d1fae5_0%,_#f0fdf4_40%,_#ffffff_100%)] px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[1.5rem] border border-red-100 bg-white/80 shadow-sm px-8 py-20 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-zinc-700 font-semibold text-base mb-1">
            Không thể tải giỏ hàng
          </p>
          <p className="text-zinc-400 text-sm mb-6">
            {error.message ?? "Đã xảy ra lỗi, vui lòng thử lại."}
          </p>
          <button
            onClick={reset}
            className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-600 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    </main>
  );
}
