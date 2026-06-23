"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogoutButton } from "@itech/shared";
import logo from "@itech/shared/assets/logo.png";

const HOST_APP_URL =
  process.env.NEXT_PUBLIC_HOST_APP_URL ?? "http://localhost:3000";

interface CustomerShellProps {
  children: React.ReactNode;
  cartCount?: number;
  userName?: string;
  categories?: { id: string; name: string }[];
}

const ACCOUNT_LINKS = [
  { href: "/orders", label: "Đơn hàng" },
  { href: "/profile", label: "Tài khoản" },
  { href: "/profile/addresses", label: "Địa chỉ" },
];

export function CustomerShell({
  children,
  cartCount = 0,
  userName,
  categories = [],
}: CustomerShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
                <span>0879 987 789</span>
              </div>

              {/* Cart */}
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

              {/* User + logout — desktop */}
              <div className="hidden md:flex items-center gap-2 border-l border-zinc-200 pl-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-zinc-400"
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
                <span className="text-sm text-zinc-700 font-medium">
                  {userName ?? "Khách"}
                </span>
                <LogoutButton redirectTo={`${HOST_APP_URL}/login`} />
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
                  pathname === "/products" &&
                  !new URLSearchParams(
                    typeof window !== "undefined" ? window.location.search : "",
                  ).get("category")
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
                  className="whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition"
                >
                  {cat.name}
                </Link>
              ))}
              <div className="ml-auto flex items-center gap-0.5">
                {ACCOUNT_LINKS.map(({ href, label }) => (
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
    </div>
  );
}
