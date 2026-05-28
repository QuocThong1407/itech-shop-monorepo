"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@itech/shared";
import logo from "@itech/shared/assets/logo.png";

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Users", href: "/users" },
  { label: "Categories", href: "/categories" },
  { label: "Products", href: "/products" },
  { label: "Promotions", href: "/promotions" },
  { label: "Coupons", href: "/coupons" },
  { label: "Settings", href: "/settings" },
];

const reportItems: NavItem[] = [
  { label: "Revenue Report", href: "/reports/revenue" },
  { label: "Activity Report", href: "/reports/activity" },
];

function getTitle(pathname: string) {
  if (pathname === "/users") return "Users";
  if (pathname === "/categories") return "Categories";
  if (pathname === "/products") return "Products";
  if (pathname === "/promotions") return "Promotions";
  if (pathname === "/coupons") return "Coupons";
  if (pathname === "/settings") return "Settings";
  if (pathname === "/reports/revenue") return "Revenue Report";
  if (pathname === "/reports/activity") return "Activity Report";
  if (pathname === "/reports") return "Reports";
  return "Dashboard";
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(pathname.startsWith("/reports"));

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/reports")) {
      setReportsOpen(true);
    }
  }, [pathname]);

  const title = useMemo(() => getTitle(pathname), [pathname]);
  const sidebarWidth = collapsed ? "lg:w-[84px]" : "lg:w-[17rem]";
  const contentOffset = collapsed ? "lg:pl-[84px]" : "lg:pl-[17rem]";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(0,142,204,0.10),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef6fb_100%)] text-slate-900">
      <div className="flex min-h-screen w-full">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col border-r border-slate-200/80 bg-white/95 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 ${sidebarWidth} ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,_#0f172a_0%,_#1d4ed8_100%)] shadow-[0_12px_30px_rgba(15,23,42,0.28)]">
              <Image src={logo} alt="ITech Shop" className="h-7 w-7 rounded-lg object-cover" />
            </div>

            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">ITech Shop</p>
              </div>
            ) : null}
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2 transition ${
                    active
                      ? "bg-sky-50 text-[#008ECC] shadow-[inset_0_0_0_1px_rgba(0,142,204,0.18)]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-sm font-semibold transition ${
                      active
                        ? "bg-white text-[#008ECC] shadow-[0_10px_24px_rgba(0,142,204,0.15)]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.label.slice(0, 1)}
                  </span>

                  {!collapsed ? <span className="text-sm font-semibold">{item.label}</span> : null}
                </Link>
              );
            })}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setReportsOpen((value) => !value)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition ${
                  pathname.startsWith("/reports")
                    ? "bg-sky-50 text-[#008ECC] shadow-[inset_0_0_0_1px_rgba(0,142,204,0.18)]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-sm font-semibold transition ${
                    pathname.startsWith("/reports")
                      ? "bg-white text-[#008ECC] shadow-[0_10px_24px_rgba(0,142,204,0.15)]"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  R
                </span>

                {!collapsed ? (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Report</p>
                    <p className="text-xs text-slate-500">Revenue and activity insights</p>
                  </div>
                ) : null}

                {!collapsed ? (
                  <span className="text-xs font-semibold text-slate-400">
                    {reportsOpen ? "−" : "+"}
                  </span>
                ) : null}
              </button>

              {reportsOpen && !collapsed ? (
                <div className="mt-2 space-y-1 pl-3">
                  {reportItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition ${
                          active
                            ? "bg-sky-50 text-[#008ECC]"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            active ? "bg-[#008ECC]" : "bg-slate-300"
                          }`}
                        />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </nav>

          <div className="border-t border-slate-200 p-3">
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="hidden h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span className="text-lg leading-none">{collapsed ? ">" : "<"}</span>
            </button>
          </div>
        </aside>

        {mobileOpen ? (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
          />
        ) : null}

        <div className={`flex min-h-screen flex-1 flex-col ${contentOffset}`}>
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setMobileOpen((value) => !value)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
                aria-label="Toggle sidebar"
              >
                <span className="text-lg leading-none">≡</span>
              </button>

              <button
                type="button"
                onClick={() => setCollapsed((value) => !value)}
                className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:inline-flex"
                aria-label="Collapse sidebar"
              >
                <span className="text-lg leading-none">{collapsed ? ">" : "<"}</span>
              </button>

              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  {title}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 sm:px-5">
                  <div className="leading-tight">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Welcome</p>
                    <p className="text-sm font-semibold text-slate-900">Administrator</p>
                  </div>
                </div>

                <LogoutButton
                  redirectTo={`${process.env.NEXT_PUBLIC_HOST_APP_URL ?? "http://localhost:3000"}/login`}
                  label="Logout"
                  className="h-11 rounded-2xl !border-slate-900 !bg-slate-900 px-5 text-white !text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:!bg-slate-800"
                />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
