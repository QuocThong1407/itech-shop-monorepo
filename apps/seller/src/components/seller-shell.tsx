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
  icon: IconName;
};

type IconName = "dashboard" | "orders" | "products" | "returns" | "cancellations";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Orders", href: "/orders", icon: "orders" },
  { label: "Products", href: "/products", icon: "products" },
  { label: "Returns", href: "/returns", icon: "returns" },
  { label: "Cancellations", href: "/cancellations", icon: "cancellations" },
];

function getTitle(pathname: string) {
  if (pathname === "/orders") return "Orders";
  if (pathname === "/products") return "Products";
  if (pathname === "/returns") return "Returns";
  if (pathname === "/cancellations") return "Cancellations";
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
          <path
            d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"
            fill="currentColor"
          />
        </svg>
      );
    case "orders":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path
            d="M7 4h10l3 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8l2-4Zm0 0v4h10V4M9 12h6M9 16h4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "products":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path
            d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 0v18M4 7.5l8 4.5 8-4.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "returns":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path
            d="M9 7H5v4M5 11a7 7 0 1 0 2-4.9L5 7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "cancellations":
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
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
      <path
        d="m15 6-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
          ? "bg-amber-50 text-[#f59e0b] shadow-[inset_0_0_0_1px_rgba(245,158,11,0.18)]"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition ${
          active
            ? "bg-white text-[#f59e0b] shadow-[0_10px_24px_rgba(245,158,11,0.15)]"
            : "bg-slate-100 text-slate-500 group-hover:bg-white"
        }`}
      >
        <SidebarGlyph icon={item.icon} />
      </span>
      {!collapsed ? <span className="truncate text-sm font-semibold">{item.label}</span> : null}
    </Link>
  );
}

export function SellerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const title = useMemo(() => getTitle(pathname), [pathname]);
  const sidebarWidth = collapsed ? "lg:w-[88px]" : "lg:w-[17rem]";
  const contentOffset = collapsed ? "lg:pl-[88px]" : "lg:pl-[17rem]";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_28%),linear-gradient(180deg,_#fffaf2_0%,_#f8fafc_100%)] text-slate-900">
      <div className="flex min-h-screen w-full">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col border-r border-amber-100/80 bg-white/95 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 ${sidebarWidth} ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="flex items-center gap-3 border-b border-amber-100 px-4 py-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,_#1e293b_0%,_#f59e0b_100%)] shadow-[0_12px_30px_rgba(245,158,11,0.22)]">
              <Image src={logo} alt="ITech Shop" className="h-7 w-7 rounded-lg object-cover" />
            </div>

            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">ITech Shop Seller</p>
                <p className="truncate text-xs text-slate-500">Seller operations workspace</p>
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
            </nav>
          </div>

          <div className="shrink-0 border-t border-amber-100 bg-white/95 p-3 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="hidden h-11 w-full items-center justify-center gap-2 rounded-2xl border border-amber-100 bg-white text-slate-700 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 lg:inline-flex"
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
          <header className="sticky top-0 z-20 border-b border-amber-100/80 bg-white/85 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setMobileOpen((value) => !value)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-100 bg-white text-slate-700 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 lg:hidden"
                aria-label="Toggle sidebar"
              >
                <MobileMenuIcon className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => setCollapsed((value) => !value)}
                className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-amber-100 bg-white text-slate-700 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 lg:inline-flex"
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
                <div className="flex h-11 items-center rounded-2xl border border-amber-100 bg-amber-50 px-4 sm:px-5">
                  <div className="leading-tight">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-amber-400">Welcome</p>
                    <p className="text-sm font-semibold text-slate-900">Seller</p>
                  </div>
                </div>

                <LogoutButton
                  redirectTo={`${process.env.NEXT_PUBLIC_HOST_APP_URL ?? "http://localhost:3000"}/login`}
                  label="Logout"
                  className="h-11 rounded-2xl !border-amber-600 !bg-amber-600 px-5 text-white !text-white shadow-[0_12px_28px_rgba(245,158,11,0.18)] transition hover:!bg-amber-500"
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
