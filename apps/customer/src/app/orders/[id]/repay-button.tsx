// app/customer/orders/[id]/repay-button.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface RepayButtonProps {
  orderId: string;
  createdAt: string; // ISO string
}

const EXPIRE_HOURS = 24;

export default function RepayButton({ orderId, createdAt }: RepayButtonProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const expireTime =
      new Date(createdAt).getTime() + EXPIRE_HOURS * 60 * 60 * 1000;

    const tick = () => {
      const diff = expireTime - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft(null);
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`,
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const handleRepay = async () => {
    setLoading(true);
    setError(null);
    try {
      const API_BASE =
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";
      const res = await fetch(`${API_BASE}/payments/repay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId,
          returnUrl: `${API_BASE}/payments/vnpay/return`,
        }),
      });

      const data = await res.json();
      console.log("repay response:", data); // check structure
      if (!res.ok)
        throw new Error(data.message || "Không thể tạo link thanh toán");

      // successResponse wrap vào data.data
      const paymentUrl = data.data?.paymentUrl ?? data.paymentUrl;
      if (!paymentUrl) throw new Error("Không nhận được link thanh toán");

      window.location.href = paymentUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setLoading(false);
    }
  };

  if (expired) {
    return (
      <p className="mt-3 text-xs text-zinc-400 text-center">
        Đã hết thời gian thanh toán (24 giờ)
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <button
        onClick={handleRepay}
        disabled={loading}
        className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-60"
      >
        {loading ? "Đang xử lý..." : "Thanh toán ngay"}
      </button>

      {timeLeft && (
        <p className="text-center text-xs text-zinc-400">
          Hết hạn sau{" "}
          <span className="font-mono font-semibold text-amber-500">
            {timeLeft}
          </span>
        </p>
      )}

      {error && <p className="text-center text-xs text-red-500">{error}</p>}
    </div>
  );
}
