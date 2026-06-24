import Link from "next/link";
import Image from "next/image";
import {
  getProducts,
  getCategories,
  getActivePromotions,
  type Product,
} from "@/lib/api";

function formatVND(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

// Icon map cho từng category name (fallback là grid icon)
function CategoryIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes("phone") || n.includes("smartphone"))
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    );
  if (n.includes("laptop") || n.includes("macbook"))
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    );
  if (n.includes("tablet") || n.includes("ipad"))
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    );
  if (n.includes("audio") || n.includes("tai nghe") || n.includes("loa"))
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
        />
      </svg>
    );
  if (n.includes("phụ kiện") || n.includes("accessory"))
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
        />
      </svg>
    );
  // fallback
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-7 w-7"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}

function ProductCard({ product }: { product: Product }) {
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
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-base font-bold text-blue-600">
            {formatVND(product.price)}
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

      <div className="border-t border-zinc-100 px-3 py-1.5">
        <p className="text-[11px] text-blue-600">
          Thu cũ đổi mới trợ giá lên đến{" "}
          <span className="font-semibold">1.000.000 VNĐ</span>
        </p>
      </div>
    </Link>
  );
}

export default async function CustomerHomePage() {
  const [categories, promotions] = await Promise.all([
    getCategories(),
    getActivePromotions(),
  ]);

  const sections = (
    await Promise.all(
      categories.map((cat) =>
        getProducts({ category: cat.id, limit: 8 }).then((r) => ({
          category: cat,
          products: r.data,
        })),
      ),
    )
  ).filter((s) => s.products.length > 0);

  return (
    <div className="flex flex-col gap-8 py-2">
      {/* ── Banner promotions ── */}
      {promotions.length > 0 && (
        <section className="flex flex-col gap-3">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white min-h-[160px]"
            >
              {/* Background image nếu có */}
              {promo.image && (
                <Image
                  src={promo.image}
                  alt={promo.name}
                  fill
                  className="object-cover opacity-20"
                  sizes="100vw"
                />
              )}
              <div className="relative px-8 py-8 flex flex-col gap-3 max-w-2xl">
                <h2 className="text-2xl font-bold leading-tight">
                  {promo.name}
                </h2>
                {promo.description && (
                  <p className="text-sm text-blue-100">{promo.description}</p>
                )}
                <div>
                  <Link
                    href="/products"
                    className="inline-block rounded-lg bg-white text-blue-700 font-semibold text-sm px-5 py-2 hover:bg-blue-50 transition"
                  >
                    Mua ngay
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* fallback nếu không có promotion nào */}
      {promotions.length === 0 && (
        <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 text-white px-8 py-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-2">
            iTech Mobile
          </p>
          <h1 className="text-2xl font-bold mb-1">
            Thiết bị công nghệ chính hãng
          </h1>
          <p className="text-sm text-blue-100 mb-4">
            Bảo hành 12 tháng — Trả góp 0% — Giao hàng toàn quốc
          </p>
          <Link
            href="/products"
            className="inline-block rounded-lg bg-white text-blue-700 font-semibold text-sm px-5 py-2 hover:bg-blue-50 transition"
          >
            Xem sản phẩm
          </Link>
        </section>
      )}

      {/* ── Row danh mục icon ── */}
      {categories.length > 0 && (
        <section>
          <h2 className="text-center text-lg font-bold text-zinc-800 uppercase tracking-wide mb-4">
            Danh mục nổi bật
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.id}`}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="relative h-24 w-full rounded-2xl overflow-hidden bg-zinc-100 group-hover:shadow-md transition-shadow">
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                      <CategoryIcon name={cat.name} />
                    </div>
                  )}
                </div>
                <span className="text-xs font-semibold text-blue-600 text-center group-hover:text-blue-800 transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Product sections by category ── */}
      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-zinc-400 gap-3">
          <p className="text-sm">Chưa có sản phẩm nào.</p>
        </div>
      ) : (
        sections.map(({ category, products }) => (
          <section key={category.id}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold tracking-wide text-zinc-900 uppercase">
                {category.name}
              </h2>
              <Link
                href={`/products?category=${category.id}`}
                className="flex items-center gap-1 rounded-lg border border-zinc-300 px-4 py-1.5 text-sm text-zinc-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                Xem tất cả
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
