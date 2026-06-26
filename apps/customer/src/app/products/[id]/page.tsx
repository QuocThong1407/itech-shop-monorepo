import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import AddToCart from "./add-to-cart";
import ProductGallery from "./product-gallery";
import ProductDescription from "./product-description";
import ProductReviews from "./product-reviews";
import { getProduct } from "@/lib/api";
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

interface Variant {
  id: string;
  variantAttributes: Record<string, string>;
  priceAdjustment?: number;
  quantity?: number;
  images?: string[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPercentage?: number;
  images: string[];
  averageRating: number;
  reviewCount?: number;
  soldCount?: number;
  stockQuantity?: number;
  Category?: { id: string; name: string };
  variants?: Variant[];
  ProductVariant?: Variant[];
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
    title: `${product.name} | iTech Mobile`,
    description: product.description?.replace(/<[^>]*>/g, "").slice(0, 155),
    openGraph: {
      title: product.name,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < Math.round(rating) ? "text-amber-400" : "text-zinc-200"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-sm font-semibold text-zinc-700">
        {rating.toFixed(1)}
      </span>
      {count !== undefined && (
        <span className="text-xs text-zinc-400">({count} đánh giá)</span>
      )}
    </div>
  );
}

function formatVND(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let product;
  try {
    product = await getProduct(id);
  } catch {
    notFound();
  }

  // Check login
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get("accessToken")?.value;

  const variantOptions: Record<string, string[]> = (() => {
    const raw = (product as any).variantOptions;
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  })();

  const variantTypes: string[] = (product as any).variantTypes ?? [];
  const variants = product.ProductVariant ?? product.variants ?? [];
  const category = product.Category;
  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Link href="/" className="hover:text-blue-600 transition">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-blue-600 transition">
          Sản phẩm
        </Link>
        {category && (
          <>
            <span>/</span>
            <Link
              href={`/products?category=${category.id}`}
              className="hover:text-blue-600 transition"
            >
              {category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-zinc-600 line-clamp-1">{product.name}</span>
      </nav>

      {/* Main card */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Gallery */}
          <div className="border-b md:border-b-0 md:border-r border-zinc-100">
            <ProductGallery images={product.images ?? []} name={product.name} />
          </div>

          {/* Info */}
          <div className="p-6 flex flex-col gap-5">
            {category && (
              <Link
                href={`/products?category=${category.id}`}
                className="w-fit text-xs font-medium px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
              >
                {category.name}
              </Link>
            )}

            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-bold text-zinc-900 leading-snug">
                {product.name}
              </h1>
              <StarRating
                rating={product.averageRating}
                count={product.reviewCount}
              />
              <div className="flex items-center gap-4 text-xs text-zinc-400">
                {product.soldCount !== undefined && product.soldCount > 0 && (
                  <span>
                    Đã bán:{" "}
                    <strong className="text-zinc-600">
                      {product.soldCount.toLocaleString("vi-VN")}
                    </strong>
                  </span>
                )}
                {product.stockQuantity !== undefined && (
                  <span>
                    Kho:{" "}
                    <strong className="text-zinc-600">
                      {product.stockQuantity.toLocaleString("vi-VN")}
                    </strong>
                  </span>
                )}
              </div>
            </div>

            {/* Policies */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: "🛡️", text: "Bảo hành 12 tháng" },
                { icon: "🔄", text: "Đổi trả 30 ngày" },
                { icon: "🚚", text: "Giao hàng toàn quốc" },
                { icon: "💳", text: "Trả góp 0%" },
              ].map((p) => (
                <div
                  key={p.text}
                  className="flex items-center gap-2 text-xs text-zinc-600 bg-zinc-50 rounded-lg px-3 py-2"
                >
                  <span>{p.icon}</span>
                  <span>{p.text}</span>
                </div>
              ))}
            </div>

            {/* Trade-in */}
            <div className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
              Thu cũ đổi mới — trợ giá lên đến <strong>1.000.000 VNĐ</strong>
            </div>

            {/* Add to cart */}
            <div className="border-t border-zinc-100 pt-4">
              <AddToCart
                productId={product.id}
                basePrice={product.price}
                discountPercentage={product.discountPercentage ?? 0}
                variants={(variants as any[]).map((v) => ({
                  id: v.id,
                  variantAttributes: v.variantAttributes,
                  priceAdjustment: v.priceAdjustment,
                  images: v.images,
                }))}
                variantTypes={variantTypes}
                variantOptions={variantOptions}
                isLoggedIn={isLoggedIn}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <ProductDescription description={product.description} />
      )}

      {/* Reviews */}
      <ProductReviews productId={product.id} />
    </div>
  );
}
