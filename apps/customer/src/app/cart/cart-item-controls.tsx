"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface CartItemControlsProps {
  itemId: string;
  quantity: number;
  max: number;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

async function patchQuantity(itemId: string, quantity: number) {
  const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error("Cập nhật thất bại");
}

async function deleteItem(itemId: string) {
  const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Xóa thất bại");
}

export default function CartItemControls({
  itemId,
  quantity,
  max,
}: CartItemControlsProps) {
  const router = useRouter();
  const [qty, setQty] = useState(quantity);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleUpdate = useCallback(
    (newQty: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          setLoading(true);
          await patchQuantity(itemId, newQty);
          router.refresh();
        } catch {
          // revert on error
          setQty(quantity);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [itemId, quantity, router],
  );

  const handleDecrement = () => {
    if (qty <= 1) return;
    const next = qty - 1;
    setQty(next);
    scheduleUpdate(next);
  };

  const handleIncrement = () => {
    if (qty >= max) return;
    const next = qty + 1;
    setQty(next);
    scheduleUpdate(next);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteItem(itemId);
      router.refresh();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quantity control */}
      <div className="flex items-center rounded-full border border-zinc-200 bg-zinc-50 overflow-hidden">
        <button
          onClick={handleDecrement}
          disabled={qty <= 1 || loading}
          className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 transition-colors text-base font-bold"
          aria-label="Giảm số lượng"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold text-zinc-800 tabular-nums">
          {qty}
        </span>
        <button
          onClick={handleIncrement}
          disabled={qty >= max || loading}
          className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 transition-colors text-base font-bold"
          aria-label="Tăng số lượng"
        >
          +
        </button>
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-3 h-8 text-xs font-semibold text-red-500 hover:bg-red-100 disabled:opacity-40 transition-colors"
        aria-label="Xóa sản phẩm"
      >
        {loading ? (
          <span className="inline-block h-3 w-3 rounded-full border-2 border-red-300 border-t-red-500 animate-spin" />
        ) : (
          "✕ Xóa"
        )}
      </button>
    </div>
  );
}
