"use client";

import { useState } from "react";

interface Variant {
  id: string;
  name: string;
  price?: number;
}

interface Props {
  productId: string;
  variants: Variant[];
}

type ToastState = { type: "success" | "error"; message: string } | null;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

export default function AddToCart({ productId, variants }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<string>(
    variants[0]?.id ?? "",
  );
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/cart/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productVariantId: selectedVariant,
          quantity,
        }),
      });
      if (!res.ok) throw new Error("Thêm thất bại");
      showToast("success", "Đã thêm vào giỏ hàng!");
    } catch {
      showToast("error", "Không thể thêm vào giỏ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Variant selector */}
      {variants.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium text-zinc-500 mb-2 uppercase tracking-wide">
            Phân loại
          </legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <label
                key={v.id}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer text-sm font-medium transition-all
                  ${
                    selectedVariant === v.id
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300"
                  }
                `}
              >
                <input
                  type="radio"
                  name="variant"
                  value={v.id}
                  checked={selectedVariant === v.id}
                  onChange={() => setSelectedVariant(v.id)}
                  className="sr-only"
                />
                {v.name}
                {v.price !== undefined && (
                  <span className="text-xs text-zinc-400 font-normal">
                    +{v.price.toLocaleString("vi-VN")}₫
                  </span>
                )}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Quantity */}
      <div>
        <label className="text-sm font-medium text-zinc-500 uppercase tracking-wide block mb-2">
          Số lượng
        </label>
        <div className="flex items-center gap-2 w-fit">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-14 h-9 text-center border border-zinc-200 rounded-xl text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to cart button */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={loading || !selectedVariant}
        className="
          w-full py-3 px-6 rounded-[1.25rem] bg-emerald-600 hover:bg-emerald-500
          text-white font-semibold text-sm tracking-wide
          transition-all shadow-sm hover:shadow-emerald-200 hover:shadow-md
          disabled:opacity-60 disabled:cursor-not-allowed
          flex items-center justify-center gap-2
        "
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Đang thêm...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 21h6"
              />
            </svg>
            Thêm vào giỏ hàng
          </>
        )}
      </button>

      {/* Toast */}
      {toast && (
        <div
          role="alert"
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
            transition-all animate-in fade-in slide-in-from-bottom-2 duration-300
            ${
              toast.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }
          `}
        >
          {toast.type === "success" ? (
            <svg
              className="w-4 h-4 shrink-0"
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
          ) : (
            <svg
              className="w-4 h-4 shrink-0"
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
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
