"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const HOST_APP_URL =
  process.env.NEXT_PUBLIC_HOST_APP_URL ?? "http://localhost:3000";
interface Variant {
  id: string;
  variantAttributes: Record<string, string>;
  priceAdjustment?: number;
  images?: string[];
}

interface Props {
  productId: string;
  basePrice: number;
  discountPercentage?: number;
  variants: Variant[];
  variantTypes: string[];
  variantOptions: Record<string, string[]>;
  isLoggedIn: boolean;
}

type ToastState = { type: "success" | "error"; message: string } | null;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

function formatVND(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

function applyDiscount(price: number, discountPercentage: number) {
  if (discountPercentage <= 0) return price;
  return price * (1 - discountPercentage / 100);
}

export default function AddToCart({
  productId,
  basePrice,
  discountPercentage = 0,
  variants,
  variantTypes,
  variantOptions,
  isLoggedIn,
}: Props) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const router = useRouter();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const matchedVariant = variants.find((v) =>
    variantTypes.every((t) => v.variantAttributes[t] === selected[t]),
  );

  const allSelected = variantTypes.every((t) => selected[t]);

  // Giá hiển thị = base + adjustment của variant đang match
  const displayPrice = basePrice + (matchedVariant?.priceAdjustment ?? 0);

  // Nếu chỉ chọn 1 phần (ví dụ chỉ chọn SIZE chưa chọn COLOR),
  // tính giá thấp nhất có thể của SIZE đó để preview
  const previewPrice = (() => {
    if (allSelected) return displayPrice;
    if (Object.keys(selected).length === 0) return basePrice;
    // Tìm tất cả variant khớp với những gì đã chọn
    const matching = variants.filter((v) =>
      Object.entries(selected).every(
        ([k, val]) => v.variantAttributes[k] === val,
      ),
    );
    if (matching.length === 0) return basePrice;
    const min = Math.min(
      ...matching.map((v) => basePrice + (v.priceAdjustment ?? 0)),
    );
    const max = Math.max(
      ...matching.map((v) => basePrice + (v.priceAdjustment ?? 0)),
    );
    return min === max ? min : null; // null = range
  })();

  const isOptionAvailable = (type: string, value: string) => {
    const tentative = { ...selected, [type]: value };
    return variants.some((v) =>
      Object.entries(tentative).every(
        ([k, val]) => v.variantAttributes[k] === val,
      ),
    );
  };

  // Lấy giá của một option cụ thể (dùng cho COLOR khi SIZE đã chọn)
  const getOptionPrice = (type: string, value: string): number | null => {
    const tentative = { ...selected, [type]: value };
    // Chỉ hiển thị giá nếu đã đủ để match 1 variant
    if (Object.keys(tentative).length < variantTypes.length) return null;
    const matched = variants.find((v) =>
      variantTypes.every((t) => v.variantAttributes[t] === tentative[t]),
    );
    return matched ? basePrice + (matched.priceAdjustment ?? 0) : null;
  };

  // Lấy ảnh của option (nếu có)
  const getOptionImage = (type: string, value: string): string | null => {
    const tentative = { ...selected, [type]: value };
    const matched = variants.find((v) =>
      Object.entries(tentative).every(
        ([k, val]) => v.variantAttributes[k] === val,
      ),
    );
    return matched?.images?.[0] ?? null;
  };

  const handleSelect = (type: string, value: string) => {
    setSelected((prev) => {
      if (prev[type] === value) {
        const next = { ...prev };
        delete next[type];
        return next;
      }
      return { ...prev, [type]: value };
    });
  };

  const addToCart = async (): Promise<boolean> => {
    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent("auth:required"));
      return false;
    }
    if (!matchedVariant) return false;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/cart/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productVariantId: matchedVariant.id,
          quantity,
        }),
      });
      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent("auth:required"));
        return false;
      }
      if (!res.ok) throw new Error();
      return true;
    } catch {
      showToast("error", "Không thể thêm vào giỏ. Vui lòng thử lại.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    const success = await addToCart();
    if (success) showToast("success", "Đã thêm vào giỏ hàng!");
  };

  const handleBuyNow = async () => {
    const success = await addToCart();
    if (success && matchedVariant)
      router.push(
        `/checkout?buyNow=true&variantId=${matchedVariant.id}&qty=${quantity}`,
      );
  };

  const hasVariants = variantTypes.length > 0;

  return (
    <div className="space-y-5">
      {/* Giá động */}
      {/* Giá động */}
      {hasVariants && (
        <div className="py-3 px-4 rounded-lg bg-blue-50 border border-blue-100">
          {allSelected ? (
            <div className="flex flex-col gap-0.5">
              {discountPercentage > 0 && (
                <span className="text-sm text-zinc-400 line-through">
                  {formatVND(displayPrice)}
                </span>
              )}
              <span
                className={`text-3xl font-extrabold ${
                  discountPercentage > 0 ? "text-red-600" : "text-blue-600"
                }`}
              >
                {formatVND(applyDiscount(displayPrice, discountPercentage))}
              </span>
            </div>
          ) : previewPrice !== null ? (
            <div className="flex flex-col gap-0.5">
              {discountPercentage > 0 && (
                <span className="text-sm text-zinc-400 line-through">
                  {formatVND(previewPrice)}
                </span>
              )}
              <span
                className={`text-3xl font-extrabold ${
                  discountPercentage > 0 ? "text-red-600" : "text-blue-600"
                }`}
              >
                {formatVND(applyDiscount(previewPrice, discountPercentage))}
              </span>
            </div>
          ) : (
            // Range price khi các option có giá khác nhau
            <span
              className={`text-2xl font-extrabold ${
                discountPercentage > 0 ? "text-red-600" : "text-blue-600"
              }`}
            >
              {formatVND(
                applyDiscount(
                  Math.min(
                    ...variants
                      .filter((v) =>
                        Object.entries(selected).every(
                          ([k, val]) => v.variantAttributes[k] === val,
                        ),
                      )
                      .map((v) => basePrice + (v.priceAdjustment ?? 0)),
                  ),
                  discountPercentage,
                ),
              )}{" "}
              —{" "}
              {formatVND(
                applyDiscount(
                  Math.max(
                    ...variants
                      .filter((v) =>
                        Object.entries(selected).every(
                          ([k, val]) => v.variantAttributes[k] === val,
                        ),
                      )
                      .map((v) => basePrice + (v.priceAdjustment ?? 0)),
                  ),
                  discountPercentage,
                ),
              )}
            </span>
          )}
        </div>
      )}

      {/* Variant selectors */}
      {hasVariants &&
        variantTypes.map((type) => (
          <div key={type}>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              {type}
              {selected[type] && (
                <span className="ml-2 normal-case font-medium text-zinc-700">
                  {selected[type]}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {(variantOptions[type] ?? []).map((value) => {
                const available = isOptionAvailable(type, value);
                const isSelected = selected[type] === value;
                const optionPrice = getOptionPrice(type, value);
                const optionImage = getOptionImage(type, value);

                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!available}
                    onClick={() => handleSelect(type, value)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all
                      ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                          : available
                            ? "border-zinc-200 bg-white text-zinc-700 hover:border-blue-300"
                            : "border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed line-through"
                      }
                    `}
                  >
                    {/* Ảnh nhỏ nếu có (giống CellPhones COLOR selector) */}
                    {optionImage && (
                      <img
                        src={optionImage}
                        alt={value}
                        className="w-8 h-8 rounded-md object-cover shrink-0"
                      />
                    )}
                    <span className="flex flex-col items-start leading-tight">
                      <span>{value}</span>
                      {optionPrice !== null && (
                        <span
                          className={`text-xs font-semibold ${
                            isSelected ? "text-blue-600" : "text-zinc-500"
                          }`}
                        >
                          {formatVND(
                            applyDiscount(optionPrice, discountPercentage),
                          )}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

      {/* Quantity */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-2">
          Số lượng
        </label>
        <div className="flex items-center gap-2 w-fit">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-14 h-9 text-center border border-zinc-200 rounded-xl text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to cart + buy now buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={loading || !allSelected || !matchedVariant}
          className="
            flex-1 py-3 px-4 rounded-[1.25rem] border-2 border-blue-600
            text-blue-600 font-semibold text-sm tracking-wide
            transition-all hover:bg-blue-50
            disabled:opacity-60 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
          "
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          ) : (
            "Thêm vào giỏ"
          )}
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={loading || !allSelected || !matchedVariant}
          className="
            flex-1 py-3 px-4 rounded-[1.25rem] bg-blue-600 hover:bg-blue-500
            text-white font-semibold text-sm tracking-wide
            transition-all shadow-sm hover:shadow-blue-200 hover:shadow-md
            disabled:opacity-60 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
          "
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Mua ngay"
          )}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="alert"
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
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
          <span className="flex-1">{toast.message}</span>
          {!isLoggedIn && toast.type === "error" && (
            <a
              href={`${HOST_APP_URL}/login`}
              className="shrink-0 underline font-semibold hover:opacity-80"
            >
              Đăng nhập
            </a>
          )}
        </div>
      )}
    </div>
  );
}
