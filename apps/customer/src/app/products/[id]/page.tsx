import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { apiRequest } from "@itech/shared/api";
import { Badge } from "@itech/shared";
import AddToCart from "./add-to-cart";

interface Variant {
  id: string;
  variantAttributes: Record<string, string>;
  priceAdjustment?: number;
  quantity?: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  averageRating: number;
  reviewCount?: number;
  category?: string;
  variants: Variant[];
}

async function getProduct(id: string): Promise<Product | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

  try {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const body = await res.json();
    return body.data ?? body;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Sản phẩm không tìm thấy" };
  return {
    title: `${product.name} | Cửa hàng`,
    description: product.description?.slice(0, 155),
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 155),
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < Math.floor(rating);
          const half = !filled && i < rating;
          return (
            <svg
              key={i}
              className={`w-4 h-4 ${
                filled
                  ? "text-amber-400"
                  : half
                    ? "text-amber-300"
                    : "text-zinc-200"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          );
        })}
      </div>
      <span className="text-sm font-medium text-zinc-700">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function buildVariantLabel(attrs: Record<string, string>): string {
  return Object.entries(attrs)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <main
      className="min-h-screen py-10 px-4"
      style={{
        background:
          "radial-gradient(ellipse at 60% 0%, #d1fae5 0%, #f0fdf4 40%, #f8fafc 100%)",
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb hint */}
        <p className="text-xs text-zinc-400 mb-6 font-medium tracking-wide uppercase">
          Sản phẩm
          {product.category && (
            <>
              {" "}
              / <span className="text-emerald-600">{product.category}</span>
            </>
          )}
        </p>

        <div className="rounded-[1.5rem] border border-zinc-200 bg-white/80 backdrop-blur shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Image panel */}
            <div className="relative aspect-square bg-zinc-50 md:rounded-l-[1.5rem] overflow-hidden">
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-300">
                  <svg
                    className="w-20 h-20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Info panel */}
            <div className="p-8 flex flex-col gap-6">
              {/* Header */}
              <div className="space-y-3">
                {product.category && (
                  <Badge tone="neutral" className="text-xs">
                    {product.category}
                  </Badge>
                )}
                <h1 className="text-2xl font-bold text-zinc-900 leading-snug">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3">
                  <StarRating rating={product.averageRating} />
                  {product.reviewCount !== undefined && (
                    <span className="text-xs text-zinc-400">
                      ({product.reviewCount.toLocaleString("vi-VN")} đánh giá)
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                  {product.price.toLocaleString("vi-VN")}₫
                </span>
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-sm text-zinc-500 leading-relaxed border-t border-zinc-100 pt-4">
                  {product.description}
                </p>
              )}

              {/* Client island */}
              <div className="border-t border-zinc-100 pt-4">
                <AddToCart
                  productId={product.id}
                  variants={(product.variants ?? []).map((v) => ({
                    id: v.id,
                    name: buildVariantLabel(v.variantAttributes),
                    price: v.priceAdjustment,
                  }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
