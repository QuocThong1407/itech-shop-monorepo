"use client";

import * as React from "react";

export type BadgeTone = "neutral" | "success" | "warning" | "danger";

export type BadgeProps = React.PropsWithChildren<{
  tone?: BadgeTone;
  className?: string;
}>;

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  success: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-100 text-amber-700 ring-amber-200",
  danger: "bg-rose-100 text-rose-700 ring-rose-200",
};

export function Badge({
  tone = "neutral",
  className = "",
  children,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export type LogoutButtonProps = {
  backendBaseUrl?: string;
  redirectTo?: string;
  label?: string;
  className?: string;
};

export function LogoutButton({
  backendBaseUrl = "http://localhost:5000/api",
  redirectTo = "/login",
  label = "Sign out",
  className = "",
}: LogoutButtonProps) {
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    setLoading(true);

    try {
      await fetch(`${backendBaseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.assign(redirectTo);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? "Signing out..." : label}
    </button>
  );
}
