// apps/customer/src/app/products/page.tsx
import Link from "next/link";
import Image from "next/image";
import { getProducts, getCategories } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
interface SearchParams {
  page?: string;
  search?: string;
  category?: string;
  sort?: string;
}

function formatVND(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

function buildHref(current: SearchParams, patch: Partial<SearchParams>) {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  if (next.search) params.set("search", next.search);
  if (next.category) params.set("category", next.category);
  if (next.sort) params.set("sort", next.sort);
  if (next.page && next.page !== "1") params.set("page", next.page);
  const qs = params.toString();
  return `/products${qs ? `?${qs}` : ""}`;
}

const SORT_OPTIONS = [
  { value: "", label: "Mặc định" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
  { value: "newest", label: "Mới nhất" },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  const [{ data: products, totalPages }, categories] = await Promise.all([
    getProducts({
      page,
      limit: 12,
      category: sp.category,
      search: sp.search,
      sort: sp.sort,
    }),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Search summary */}
      {sp.search && (
        <p className="text-sm text-zinc-500">
          Kết quả tìm kiếm cho{" "}
          <span className="font-semibold text-zinc-800">"{sp.search}"</span> —{" "}
          {products.length} sản phẩm
        </p>
      )}

      {/* ── Mobile filter bar ── */}
      <div className="flex md:hidden flex-wrap gap-2">
        <Link
          href={buildHref(sp, { category: undefined, page: "1" })}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            !sp.category
              ? "bg-blue-600 text-white border-blue-600"
              : "border-zinc-300 text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          Tất cả
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={buildHref(sp, { category: cat.id, page: "1" })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              sp.category === cat.id
                ? "bg-blue-600 text-white border-blue-600"
                : "border-zinc-300 text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {cat.name}
          </Link>
        ))}
        {/* Sort pills */}
        <div className="w-full flex gap-2 mt-1">
          {SORT_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={buildHref(sp, { sort: opt.value || undefined, page: "1" })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                (sp.sort ?? "") === opt.value
                  ? "bg-zinc-800 text-white border-zinc-800"
                  : "border-zinc-300 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Sidebar + Grid ── */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* ── Sidebar — desktop only ── */}
        <aside className="hidden md:flex w-56 shrink-0 rounded-2xl border border-zinc-200 bg-white shadow-sm p-4 flex-col gap-6">
          {/* Category filter */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Danh mục
            </p>
            <ul className="flex flex-col gap-1">
              <li>
                <Link
                  href={buildHref(sp, { category: undefined, page: "1" })}
                  className={`block px-3 py-1.5 rounded-xl text-sm transition ${
                    !sp.category
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  Tất cả
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={buildHref(sp, { category: cat.id, page: "1" })}
                    className={`block px-3 py-1.5 rounded-xl text-sm transition ${
                      sp.category === cat.id
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sort */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Sắp xếp
            </p>
            <div className="flex flex-col gap-1">
              {SORT_OPTIONS.map((opt) => (
                <Link
                  key={opt.value}
                  href={buildHref(sp, {
                    sort: opt.value || undefined,
                    page: "1",
                  })}
                  className={`px-3 py-1.5 rounded-xl text-sm transition ${
                    (sp.sort ?? "") === opt.value
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Product grid ── */}
        <div className="flex-1 flex flex-col gap-6">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-400 gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.25}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-sm">Không tìm thấy sản phẩm nào.</p>
              <Link
                href="/products"
                className="text-emerald-600 text-sm hover:underline"
              >
                Xem tất cả sản phẩm
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="home"
                />
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-2">
              {page > 1 && (
                <Link
                  href={buildHref(sp, { page: String(page - 1) })}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition"
                >
                  ‹
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildHref(sp, { page: String(p) })}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm transition border ${
                    p === page
                      ? "bg-emerald-500 text-white border-emerald-500 font-semibold"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link
                  href={buildHref(sp, { page: String(page + 1) })}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition"
                >
                  ›
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
