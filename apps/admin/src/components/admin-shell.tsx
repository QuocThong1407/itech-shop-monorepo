"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Badge, LogoutButton } from "@itech/shared";
import logo from "@itech/shared/assets/logo.png";

type NavItem = {
  id: string;
  label: string;
  href: string;
  note: string;
};

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", href: "#overview", note: "Snapshot" },
  { id: "analytics", label: "Analytics", href: "#analytics", note: "Revenue" },
  { id: "orders", label: "Orders", href: "#orders", note: "Sales flow" },
  { id: "customers", label: "Customers", href: "#customers", note: "Retention" },
  { id: "catalog", label: "Catalog", href: "#catalog", note: "Products" },
  { id: "settings", label: "Settings", href: "#settings", note: "Workspace" },
];

function sectionTitle(section: string) {
  switch (section) {
    case "analytics":
      return "Analytics";
    case "orders":
      return "Orders";
    case "customers":
      return "Customers";
    case "catalog":
      return "Catalog";
    case "settings":
      return "Settings";
    default:
      return "Overview";
  }
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const syncHash = () => {
      const nextHash = window.location.hash.replace("#", "");
      setActiveSection(nextHash || "overview");
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const currentTitle = useMemo(() => sectionTitle(activeSection), [activeSection]);

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  const sidebarWidthClass = desktopCollapsed ? "lg:w-[96px]" : "lg:w-72";
  const contentOffsetClass = desktopCollapsed ? "lg:pl-[96px]" : "lg:pl-72";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(0,142,204,0.10),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef6fb_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200/80 bg-white/95 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 ${sidebarWidthClass} ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,_#0f172a_0%,_#1d4ed8_100%)] shadow-[0_12px_30px_rgba(15,23,42,0.28)]">
              <Image src={logo} alt="ITech Shop" className="h-8 w-8 rounded-xl object-cover" />
            </div>
            {!desktopCollapsed ? (
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.24em] text-slate-500 uppercase">
                  Admin portal
                </p>
                <p className="truncate text-base font-semibold text-slate-900">ITech Shop</p>
              </div>
            ) : null}
          </div>

          {!desktopCollapsed ? (
            <div className="px-5 py-4">
              <Badge tone="neutral" className="bg-sky-50 text-sky-700 ring-sky-200">
                Command center
              </Badge>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Manage inventory, customers, sales flow, and workspace settings from one unified
                dashboard.
              </p>
            </div>
          ) : null}

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const active = activeSection === item.id;

              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={handleNavClick}
                  className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition ${
                    active
                      ? "bg-sky-50 text-[#008ECC] shadow-[inset_0_0_0_1px_rgba(0,142,204,0.18)]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-sm font-semibold transition ${
                      active
                        ? "bg-white text-[#008ECC] shadow-[0_10px_24px_rgba(0,142,204,0.15)]"
                        : "bg-slate-100 text-slate-500 group-hover:bg-white"
                    }`}
                  >
                    {item.label.slice(0, 1)}
                  </span>

                  {!desktopCollapsed ? (
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{item.label}</p>
                        <span
                          className={`text-[11px] font-medium ${
                            active ? "text-[#008ECC]" : "text-slate-400"
                          }`}
                        >
                          {item.label === currentTitle ? "Now" : ""}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-500">{item.note}</p>
                    </div>
                  ) : null}
                </a>
              );
            })}
          </nav>

          {!desktopCollapsed ? (
            <div className="border-t border-slate-200 p-4">
              <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,_rgba(0,142,204,0.10),_rgba(14,165,233,0.04))] p-4">
                <p className="text-sm font-semibold text-slate-900">Operational mode</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Route guard active. Admin-only workspace is protected before rendering.
                </p>
              </div>
            </div>
          ) : null}
        </aside>

        {mobileOpen ? (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
          />
        ) : null}

        <div className={`flex min-h-screen flex-1 flex-col ${contentOffsetClass}`}>
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
                onClick={() => setDesktopCollapsed((value) => !value)}
                className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:inline-flex"
                aria-label="Collapse sidebar"
              >
                <span className="text-lg leading-none">{desktopCollapsed ? "›" : "‹"}</span>
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                    {currentTitle}
                  </h1>
                  <Badge tone="neutral" className="bg-emerald-50 text-emerald-700 ring-emerald-200">
                    Admin only
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  A clean workspace for orders, catalog, and marketplace operations.
                </p>
              </div>

              <div className="hidden min-w-[320px] flex-1 justify-center xl:flex">
                <label className="flex w-full max-w-md items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 shadow-inner">
                  <span className="text-sm text-slate-400">⌕</span>
                  <input
                    type="search"
                    placeholder="Search orders, users, products..."
                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </label>
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