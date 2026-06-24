"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LogoutButton } from "@itech/shared";
import logo from "@itech/shared/assets/logo.png";

interface CustomerShellProps {
  children: React.ReactNode;
  cartCount?: number;
  userName?: string;
  categories?: { id: string; name: string }[];
}

const ACCOUNT_LINKS = [
  { href: "/orders", label: "Đơn hàng" },
  { href: "/profile", label: "Tài khoản" },
];

export function CustomerShell({
  children,
  cartCount = 0,
  userName,
  categories = [],
}: CustomerShellProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const HOST_APP_URL =
    process.env.NEXT_PUBLIC_HOST_APP_URL ?? "http://localhost:3000";
  const [showAuthModal, setShowAuthModal] = useState(false);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleAuthRequired() {
      setShowAuthModal(true);
    }
    window.addEventListener("auth:required", handleAuthRequired);
    return () =>
      window.removeEventListener("auth:required", handleAuthRequired);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (q) router.push(`/products?search=${encodeURIComponent(q)}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      {/* ── Topbar ── */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-zinc-200 shadow-sm">
        {/* Row 1: logo + search + meta */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <Image
                src={logo}
                alt="Logo"
                height={32}
                width={32}
                className="h-8 w-auto"
                priority
              />
              <span className="hidden sm:block text-sm font-bold text-zinc-800">
                iTech<span className="text-blue-600">Mobile</span>
              </span>
            </Link>

            {/* Search */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-sm"
            >
              <div className="relative w-full">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm sản phẩm..."
                  className="w-full rounded-md border border-zinc-300 bg-zinc-50 py-2 pl-3 pr-9 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-blue-600 transition"
                  aria-label="Tìm kiếm"
                >
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
                      d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"
                    />
                  </svg>
                </button>
              </div>
            </form>

            {/* Meta: hotline + user + cart */}
            <div className="ml-auto flex items-center gap-4">
              {/* Hotline — ẩn trên mobile nhỏ */}
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>0398130750</span>
              </div>

              {/* Cart */}
              {userName ? (
                <Link
                  href="/cart"
                  className="relative flex items-center gap-1.5 text-sm text-zinc-600 hover:text-blue-600 transition"
                  aria-label="Giỏ hàng"
                >
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
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
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:block text-xs">Giỏ hàng</span>
                </Link>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="relative flex items-center gap-1.5 text-sm text-zinc-600 hover:text-blue-600 transition"
                  aria-label="Giỏ hàng"
                >
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
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
                  </div>
                  <span className="hidden sm:block text-xs">Giỏ hàng</span>
                </button>
              )}
              {/* User + logout — desktop */}
              <div className="hidden md:flex items-center gap-2 border-l border-zinc-200 pl-4">
                {userName ? (
                  <>
                    <svg>...</svg>
                    <span>{userName}</span>
                    <LogoutButton redirectTo={`${HOST_APP_URL}/login`} />
                  </>
                ) : (
                  <>
                    <a
                      href={`${HOST_APP_URL}/login`}
                      className="text-sm font-medium text-zinc-700 hover:text-blue-600 transition"
                    >
                      Đăng nhập
                    </a>
                    <span className="text-zinc-300">|</span>
                    <a
                      href={`${HOST_APP_URL}/register`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                    >
                      Đăng ký
                    </a>
                  </>
                )}
              </div>

              {/* Hamburger mobile */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 transition"
                aria-label="Menu"
              >
                {mobileOpen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: category navbar — desktop */}
        <div className="hidden md:block border-t border-zinc-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-0.5 py-1 overflow-x-auto scrollbar-none">
              <Link
                href="/"
                className={`whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium transition ${
                  pathname === "/"
                    ? "bg-blue-600 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                Trang chủ
              </Link>
              <Link
                href="/products"
                className={`whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium transition ${
                  pathname === "/products" && !searchParams.get("category")
                    ? "bg-blue-600 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                Tất cả
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  className={`whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium transition ${
                    pathname === "/products" &&
                    searchParams.get("category") === cat.id
                      ? "bg-blue-600 text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}

              <div className="ml-auto flex items-center gap-0.5">
                {userName &&
                  ACCOUNT_LINKS.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium transition ${
                        pathname.startsWith(href)
                          ? "bg-blue-50 text-blue-700"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                      }`}
                    >
                      {label}
                    </Link>
                  ))}
              </div>
            </nav>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden border-t border-zinc-100 bg-white px-4 pb-4 pt-3 space-y-3"
          >
            <form onSubmit={handleSearch} className="flex">
              <div className="relative w-full">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm sản phẩm..."
                  className="w-full rounded-md border border-zinc-300 bg-zinc-50 py-2 pl-3 pr-9 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400"
                  aria-label="Tìm kiếm"
                >
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
                      d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"
                    />
                  </svg>
                </button>
              </div>
            </form>
            <nav className="flex flex-col gap-1">
              <Link
                href="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium ${pathname === "/" ? "bg-blue-50 text-blue-700" : "text-zinc-600 hover:bg-zinc-100"}`}
              >
                Trang chủ
              </Link>
              <Link
                href="/products"
                className={`px-3 py-2 rounded-lg text-sm font-medium ${pathname === "/products" ? "bg-blue-50 text-blue-700" : "text-zinc-600 hover:bg-zinc-100"}`}
              >
                Tất cả sản phẩm
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  {cat.name}
                </Link>
              ))}
              <div className="border-t border-zinc-100 pt-2 mt-1 flex flex-col gap-1">
                {ACCOUNT_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${pathname.startsWith(href) ? "bg-blue-50 text-blue-700" : "text-zinc-600 hover:bg-zinc-100"}`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </nav>
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
              <span className="text-sm text-zinc-700 font-medium">
                {userName ?? "Khách"}
              </span>
              <LogoutButton redirectTo={`${HOST_APP_URL}/login`} />
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-zinc-900 text-zinc-300 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Cột 1: thương hiệu */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Image
                  src={logo}
                  alt="Logo"
                  height={28}
                  width={28}
                  className="h-7 w-auto brightness-200"
                />
                <span className="text-base font-bold text-white">
                  iTech<span className="text-blue-400">Mobile</span>
                </span>
              </div>
              <p className="text-xs leading-5 text-zinc-400">
                Hệ thống bán lẻ thiết bị công nghệ uy tín, chính hãng, bảo hành
                12 tháng.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-blue-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>
                  Hotline: <strong className="text-white">0398130750</strong>
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-xs text-zinc-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-blue-400 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>140 Nguyễn Thị Minh Khai, Phường Tân Mỹ, TP.HCM</span>
              </div>
            </div>

            {/* Cột 2: danh mục */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-white">Danh mục</h3>
              <ul className="flex flex-col gap-2">
                {categories.length > 0
                  ? categories.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          href={`/products?category=${cat.id}`}
                          className="text-xs text-zinc-400 hover:text-white transition"
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))
                  : ["Smartphone", "Laptop", "Tablet", "Phụ kiện", "Audio"].map(
                      (c) => (
                        <li key={c}>
                          <span className="text-xs text-zinc-400">{c}</span>
                        </li>
                      ),
                    )}
              </ul>
            </div>

            {/* Cột 3: chính sách */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-white">Chính sách</h3>
              <ul className="flex flex-col gap-2 text-xs text-zinc-400">
                {[
                  "Chính sách bảo hành",
                  "Chính sách đổi trả",
                  "Chính sách vận chuyển",
                  "Chính sách bảo mật",
                  "Điều khoản sử dụng",
                ].map((item) => (
                  <li key={item}>
                    <span className="hover:text-white transition cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cột 4: tài khoản + giờ làm việc */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-white">Tài khoản</h3>
              <ul className="flex flex-col gap-2 text-xs text-zinc-400">
                {ACCOUNT_LINKS.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-white transition">
                      {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/cart" className="hover:text-white transition">
                    Giỏ hàng
                  </Link>
                </li>
              </ul>
              <div className="mt-2 pt-3 border-t border-zinc-700">
                <p className="text-xs font-semibold text-white mb-1">
                  Giờ làm việc
                </p>
                <p className="text-xs text-zinc-400">Thứ 2 – Chủ nhật</p>
                <p className="text-xs text-zinc-400">08:00 – 21:00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-zinc-700">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-zinc-500">
              © 2025 iTechMobile. Tất cả quyền được bảo lưu.
            </p>
            <p className="text-xs text-zinc-500">
              Thiết kế bởi <span className="text-blue-400">iTech Team</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Zalo floating button */}
      <a
        href="https://zalo.me/0398130750"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg hover:scale-110 transition-transform"
        title="Chat Zalo"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"
          alt="Zalo"
          className="h-14 w-14 rounded-full"
        />
      </a>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAuthModal(false)}
          />
          {/* Modal */}
          <div className="relative z-10 w-full max-w-sm mx-4 rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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
            </button>

            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900">
                  Đăng nhập để tiếp tục
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Vui lòng đăng nhập hoặc đăng ký để thêm vào giỏ hàng và mua
                  sắm dễ dàng hơn.
                </p>
              </div>
              <div className="flex w-full gap-3">
                <a
                  href={`${HOST_APP_URL}/register`}
                  className="flex-1 rounded-xl border border-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition text-center"
                >
                  Đăng ký
                </a>
                <a
                  href={`${HOST_APP_URL}/login`}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition text-center"
                >
                  Đăng nhập
                </a>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600 transition"
              >
                Tiếp tục xem sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
