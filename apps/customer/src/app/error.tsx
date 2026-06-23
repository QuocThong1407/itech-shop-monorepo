// apps/customer/src/app/error.tsx
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Home Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-500">
      <p className="text-sm">Đã có lỗi xảy ra.</p>
      <p className="text-xs text-red-400">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm hover:bg-emerald-600 transition"
      >
        Thử lại
      </button>
    </div>
  );
}
