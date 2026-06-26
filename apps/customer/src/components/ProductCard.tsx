// apps/customer/src/components/ProductCard.tsx
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/api";

function formatVND(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

interface ProductCardProps {
  product: Product;
  variant?: "home" | "grid";
}

export function ProductCard({ product, variant = "grid" }: ProductCardProps) {
  const discount = product.discountPercentage ?? 0;
  const hasDiscount = discount > 0;
  const salePrice = hasDiscount
    ? product.price * (1 - discount / 100)
    : product.price;

  if (variant === "home") {
    const isNew =
      new Date(product.createdAt ?? 0).getTime() >
      Date.now() - 7 * 24 * 60 * 60 * 1000;

    return (
      <Link
        href={`/products/${product.id}`}
        className="group flex flex-col rounded-xl border border-zinc-200 bg-white overflow-hidden hover:border-blue-400 hover:shadow-md transition-all"
      >
        <div className="relative aspect-square bg-zinc-50 overflow-hidden">
          {isNew && (
            <span className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              NEW
            </span>
          )}
          {hasDiscount && (
            <span className="absolute top-2 right-2 z-10 bg-red-600 text-white text-sm font-bold px-2.5 py-1 rounded-md shadow-sm">
              -{discount}%
            </span>
          )}
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="flex gap-1.5 px-3 pt-2">
          <span className="rounded text-[10px] font-medium px-1.5 py-0.5 bg-blue-50 text-blue-700">
            Trả góp 0%
          </span>
          <span className="rounded text-[10px] font-medium px-1.5 py-0.5 bg-green-50 text-green-700">
            BH 12 tháng
          </span>
        </div>

        <div className="flex flex-col gap-1 p-3 flex-1">
          <p className="text-sm font-medium text-zinc-800 line-clamp-2 leading-snug">
            {product.name}
          </p>
          <div className="mt-auto flex flex-col gap-0.5 pt-2">
            {hasDiscount && (
              <span className="text-xs text-zinc-400 line-through">
                {formatVND(product.price)}
              </span>
            )}
            <div className="flex items-center justify-between">
              <span
                className={`text-base font-bold ${
                  hasDiscount ? "text-red-600" : "text-blue-600"
                }`}
              >
                {formatVND(salePrice)}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white group-hover:bg-blue-600 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100 px-3 py-1.5">
          <p className="text-[11px] text-blue-600">
            Thu cũ đổi mới trợ giá lên đến{" "}
            <span className="font-semibold">1.000.000 VNĐ</span>
          </p>
        </div>
      </Link>
    );
  }

  // variant === "grid" (trang /products)
  return (
    <Link
      href={`/products/${product.id}`}
      className="group rounded-[1.5rem] border border-zinc-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
    >
      <div className="relative aspect-square bg-zinc-100 overflow-hidden">
        {hasDiscount && (
          <span className="absolute top-2 right-2 z-10 bg-red-600 text-white text-sm font-bold px-2.5 py-1 rounded-md shadow-sm">
            -{discount}%
          </span>
        )}
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <p className="text-sm font-semibold text-zinc-800 line-clamp-2 leading-snug">
          {product.name}
        </p>
        <div className="mt-auto pt-2 flex flex-col gap-0.5">
          {hasDiscount && (
            <span className="text-xs text-zinc-400 line-through">
              {formatVND(product.price)}
            </span>
          )}
          <p
            className={`font-bold text-base ${
              hasDiscount ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {formatVND(salePrice)}
          </p>
        </div>
      </div>
    </Link>
  );
}
