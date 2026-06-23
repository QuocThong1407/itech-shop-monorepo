"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@itech/shared";
import logo from "@itech/shared/assets/logo.png";

type IconName =
  | "dashboard"
  | "users"
  | "orders"
  | "returns"
  | "cancellations"
  | "categories"
  | "products"
  | "promotions"
  | "coupons"
  | "settings"
  | "reports";

type NavItem = {
  label: string;
  href: string;
  icon: IconName;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Users", href: "/users", icon: "users" },
  { label: "Orders", href: "/orders", icon: "orders" },
  { label: "Returns", href: "/returns", icon: "returns" },
  { label: "Cancellations", href: "/cancellations", icon: "cancellations" },
  { label: "Categories", href: "/categories", icon: "categories" },
  { label: "Products", href: "/products", icon: "products" },
  { label: "Promotions", href: "/promotions", icon: "promotions" },
  { label: "Coupons", href: "/coupons", icon: "coupons" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

const reportItems: NavItem[] = [
  { label: "Revenue Report", href: "/reports/revenue", icon: "reports" },
  { label: "Activity Report", href: "/reports/activity", icon: "reports" },
];

function getTitle(pathname: string) {
  if (pathname === "/users") return "Users";
  if (pathname === "/orders") return "Orders";
  if (pathname === "/returns") return "Returns";
  if (pathname === "/cancellations") return "Cancellations";
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

function SidebarGlyph({
  icon,
  className = "",
}: {
  icon: IconName;
  className?: string;
}) {
  const base = `h-4 w-4 ${className}`;
  switch (icon) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" fill="currentColor" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20a6 6 0 0 1 12 0H3Zm11 0c.3-1.8 1.7-3.3 3.5-3.8A5 5 0 0 1 21 20h-7Z" fill="currentColor" />
        </svg>
      );
    case "orders":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M7 4h10l3 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8l2-4Zm0 0v4h10V4M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "returns":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M9 7H5v4M5 11a7 7 0 1 0 2-4.9L5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "cancellations":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "categories":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M4 7h16M4 12h10M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "products":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 0v18M4 7.5l8 4.5 8-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "promotions":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M20 12a3 3 0 0 1-3 3H9l-5 4V5l5 4h8a3 3 0 0 1 3 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "coupons":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M8 4h8l4 4v8l-4 4H8l-4-4V8l4-4Zm2 5h4M10 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 1 0 12 8.5Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.7Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "reports":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M5 19V9m7 10V5m7 14v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
}

function ChevronIcon({
  expanded,
  className = "",
}: {
  expanded: boolean;
  className?: string;
}) {
  return expanded ? (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MobileMenuIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 rounded-2xl px-3 py-2 transition ${
        active
          ? "bg-sky-50 text-[#008ECC] shadow-[inset_0_0_0_1px_rgba(0,142,204,0.18)]"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition ${
          active
            ? "bg-white text-[#008ECC] shadow-[0_10px_24px_rgba(0,142,204,0.15)]"
            : "bg-slate-100 text-slate-500 group-hover:bg-white"
        }`}
      >
        <SidebarGlyph icon={item.icon} />
      </span>
      {!collapsed ? <span className="truncate text-sm font-semibold">{item.label}</span> : null}
    </Link>
  );
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
  const sidebarWidth = collapsed ? "lg:w-[88px]" : "lg:w-[17rem]";
  const contentOffset = collapsed ? "lg:pl-[88px]" : "lg:pl-[17rem]";

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
                <p className="truncate text-xs text-slate-500">Admin workspace</p>
              </div>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
                  collapsed={collapsed}
                />
              ))}

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
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition ${
                      pathname.startsWith("/reports")
                        ? "bg-white text-[#008ECC] shadow-[0_10px_24px_rgba(0,142,204,0.15)]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <SidebarGlyph icon="reports" />
                  </span>

                  {!collapsed ? (
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">Reports</p>
                    </div>
                  ) : null}

                  {!collapsed ? (
                    <span className="text-xs font-semibold text-slate-400">
                      {reportsOpen ? "-" : "+"}
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
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="hidden h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronIcon expanded={!collapsed} className="h-4 w-4" />
              {!collapsed ? <span className="text-sm font-semibold">Collapse</span> : null}
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
                <MobileMenuIcon className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => setCollapsed((value) => !value)}
                className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:inline-flex"
                aria-label="Collapse sidebar"
              >
                <ChevronIcon expanded={!collapsed} className="h-4 w-4" />
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

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
