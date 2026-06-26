import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/ProductCard";
import { getProducts, getCategories, getActivePromotions } from "@/lib/api";

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
      {/* ── Hero Banner ── */}
      {promotions.length > 0 ? (
        <section className="-mx-4 sm:-mx-6 lg:-mx-8">
          {promotions.map((promo) => (
            <div key={promo.id} className="w-full">
              {promo.image ? (
                <Link href="/products" className="block w-full">
                  <Image
                    src={promo.image}
                    alt={promo.name}
                    width={1920}
                    height={600}
                    className="w-full h-auto"
                    sizes="100vw"
                    priority
                  />
                </Link>
              ) : (
                <div className="w-full bg-gradient-to-r from-blue-700 to-blue-500 py-16 px-8 sm:px-16">
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
                    iTech Mobile
                  </p>
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-2">
                    {promo.name}
                  </h1>
                  <Link
                    href="/products"
                    className="inline-block mt-4 rounded-lg bg-white text-blue-700 font-bold text-sm px-6 py-2.5 hover:bg-blue-50 transition"
                  >
                    Mua ngay
                  </Link>
                </div>
              )}
            </div>
          ))}
        </section>
      ) : (
        <section className="-mx-4 sm:-mx-6 lg:-mx-8">
          <div className="w-full bg-gradient-to-r from-blue-700 to-blue-500 py-16 px-8 sm:px-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
              iTech Mobile
            </p>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-2">
              Thiết bị công nghệ chính hãng
            </h1>
            <p className="text-sm text-blue-100 mt-1">
              Bảo hành 12 tháng — Trả góp 0% — Giao hàng toàn quốc
            </p>
            <Link
              href="/products"
              className="inline-block mt-4 rounded-lg bg-white text-blue-700 font-bold text-sm px-6 py-2.5 hover:bg-blue-50 transition"
            >
              Xem sản phẩm
            </Link>
          </div>
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
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="home"
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
