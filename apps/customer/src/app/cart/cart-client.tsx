// app/cart/cart-client.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CartItemControls from "./cart-item-controls";

interface ProductVariant {
  id: string;
  quantity: number;
  variantAttributes: Record<string, string> | null;
  images: string[] | null;
  priceAdjustment: number;
  Product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stockQuantity: number;
  };
}

interface CartItem {
  id: string;
  quantity: number;
  ProductVariant: ProductVariant;
}

const vnd = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n,
  );

export default function CartClient({
  items: initialItems,
}: {
  items: CartItem[];
  serverTotal?: number;
}) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [checked, setChecked] = useState<Set<string>>(
    new Set(initialItems.map((i) => i.id)),
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const toggleAll = () => {
    if (checked.size === items.length) setChecked(new Set());
    else setChecked(new Set(items.map((i) => i.id)));
  };

  const toggleOne = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    setPendingId(itemId);
    setError(null);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok)
        throw new Error(body?.message ?? "Cập nhật số lượng thất bại");
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
      );
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setPendingId(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setPendingId(itemId);
    setError(null);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message ?? "Xóa sản phẩm thất bại");
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setChecked((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      router.refresh(); // đồng bộ badge số lượng ở header (server component)
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setPendingId(null);
    }
  };

  const selectedItems = items.filter((i) => checked.has(i.id));
  const total = selectedItems.reduce((sum, item) => {
    const unitPrice =
      item.ProductVariant.Product.price + item.ProductVariant.priceAdjustment;
    return sum + unitPrice * item.quantity;
  }, 0);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-20 text-center">
        <div className="text-5xl mb-4">🛒</div>
        <p className="text-zinc-500">
          Giỏ hàng trống. Hãy thêm sản phẩm để bắt đầu!
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-zinc-200 bg-white">
            <input
              type="checkbox"
              checked={checked.size === items.length}
              onChange={toggleAll}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
            <span className="text-sm font-medium text-zinc-700">
              Chọn tất cả ({items.length} sản phẩm)
            </span>
          </div>

          {items.map((item) => {
            const pv = item.ProductVariant;
            const unitPrice = pv.Product.price + pv.priceAdjustment;
            const imageUrl =
              pv.images?.[0] ?? pv.Product.images?.[0] ?? "/placeholder.png";
            const variantLabel = pv.variantAttributes
              ? Object.values(pv.variantAttributes).join(" / ")
              : "";
            const isChecked = checked.has(item.id);
            const isPending = pendingId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border bg-white transition-colors ${
                  isChecked ? "border-blue-200" : "border-zinc-200"
                } ${isPending ? "opacity-60" : ""}`}
              >
                <div className="p-4 flex gap-4 items-start">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOne(item.id)}
                      disabled={isPending}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <Link
                    href={`/products/${pv.Product.id}`}
                    className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 hover:opacity-90 transition"
                  >
                    <Image
                      src={imageUrl}
                      alt={pv.Product.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${pv.Product.id}`}
                        className="font-semibold text-zinc-900 text-sm leading-snug hover:text-blue-600 transition line-clamp-2"
                      >
                        {pv.Product.name}
                        {variantLabel && (
                          <span className="font-normal text-zinc-400">
                            {" "}
                            | {variantLabel}
                          </span>
                        )}
                      </Link>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={isPending}
                        className="shrink-0 text-zinc-400 hover:text-rose-500 transition-colors disabled:cursor-not-allowed"
                        aria-label="Xóa sản phẩm"
                      >
                        🗑
                      </button>
                    </div>

                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-base font-bold text-blue-600">
                        {vnd(unitPrice)}
                      </span>
                      {pv.priceAdjustment !== 0 && (
                        <span className="text-xs text-zinc-400 line-through">
                          {vnd(pv.Product.price)}
                        </span>
                      )}
                    </div>

                    <div className="mt-3">
                      <CartItemControls
                        itemId={item.id}
                        quantity={item.quantity}
                        max={pv.quantity}
                        onDelete={(id) => {
                          setItems((prev) => prev.filter((i) => i.id !== id));
                          setChecked((prev) => {
                            const next = new Set(prev);
                            next.delete(id);
                            return next;
                          });
                        }}
                      />
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-zinc-900">
                      {vnd(unitPrice * item.quantity)}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {item.quantity} sản phẩm
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="sticky top-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col gap-4">
            <h2 className="text-base font-bold text-zinc-900">
              Tóm tắt đơn hàng
            </h2>

            <div className="flex flex-col gap-2 text-sm text-zinc-600 max-h-48 overflow-y-auto">
              {selectedItems.length === 0 ? (
                <p className="text-zinc-400 text-xs">Chưa chọn sản phẩm nào</p>
              ) : (
                selectedItems.map((item) => {
                  const pv = item.ProductVariant;
                  const unitPrice = pv.Product.price + pv.priceAdjustment;
                  const variantLabel = pv.variantAttributes
                    ? Object.values(pv.variantAttributes).join(" / ")
                    : "";
                  return (
                    <div key={item.id} className="flex justify-between gap-2">
                      <span className="truncate max-w-[60%] text-zinc-500 text-xs">
                        {pv.Product.name}
                        {variantLabel && (
                          <span className="text-zinc-400">
                            {" "}
                            ({variantLabel})
                          </span>
                        )}
                        <span className="text-zinc-400"> ×{item.quantity}</span>
                      </span>
                      <span className="shrink-0 font-medium text-zinc-700 text-xs">
                        {vnd(unitPrice * item.quantity)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-zinc-100 pt-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-zinc-700">
                Tổng cộng
                <span className="ml-1 text-xs font-normal text-zinc-400">
                  ({selectedItems.reduce((s, i) => s + i.quantity, 0)} sp)
                </span>
              </span>
              <span className="text-lg font-bold text-blue-600">
                {vnd(total)}
              </span>
            </div>

            <Link
              href="/checkout"
              className={`w-full rounded-full py-3 text-center text-sm font-bold text-white transition-all ${
                selectedItems.length === 0
                  ? "bg-zinc-300 cursor-not-allowed pointer-events-none"
                  : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-blue-200"
              }`}
            >
              Tiến hành thanh toán →
            </Link>

            <Link
              href="/products"
              className="text-center text-xs text-zinc-400 hover:text-blue-600 transition-colors"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
