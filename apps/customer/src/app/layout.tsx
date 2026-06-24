// apps/customer/src/app/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAMES, normalizeAuthRole } from "@itech/shared/auth";
import { CustomerShell } from "@/components/customer-shell";
import { getCart, getProfile, getCategories } from "@/lib/api";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ITech Shop Customer",
  description: "Customer storefront",
};

const HOST_APP_URL = process.env.HOST_APP_URL ?? "http://localhost:3000";

export default async function CustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value;
  const role = normalizeAuthRole(
    cookieStore.get(AUTH_COOKIE_NAMES.authRole)?.value,
  );

  const isLoggedIn = !!token && role === "CUSTOMER";

  // Không redirect ở layout nữa — để từng page tự handle nếu cần auth

  const [cart, profile, cats] = await Promise.allSettled([
    isLoggedIn ? getCart() : Promise.reject("guest"),
    isLoggedIn ? getProfile() : Promise.reject("guest"),
    getCategories(),
  ]);

  const categories = cats.status === "fulfilled" ? cats.value : [];

  const cartCount =
    cart.status === "fulfilled" && cart.value
      ? cart.value.items.reduce((sum, item) => sum + item.quantity, 0)
      : 0;

  const userName =
    profile.status === "fulfilled" && profile.value
      ? profile.value.username
      : undefined;

  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full text-zinc-900">
        <CustomerShell
          cartCount={cartCount}
          userName={userName}
          categories={categories}
        >
          {children}
        </CustomerShell>
      </body>
    </html>
  );
}
