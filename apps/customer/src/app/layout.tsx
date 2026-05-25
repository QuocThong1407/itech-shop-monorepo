import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { AUTH_COOKIE_NAMES, normalizeAuthRole } from "@itech/shared/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ITech Shop Customer",
  description: "Customer storefront",
};

export default async function CustomerLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value;
  const role = normalizeAuthRole(cookieStore.get(AUTH_COOKIE_NAMES.authRole)?.value);

  if (!token || role !== "customer") {
    redirect(
      `${process.env.HOST_APP_URL ?? "http://localhost:3000"}/login?next=${encodeURIComponent(
        "/customer",
      )}`,
    );
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-zinc-900">{children}</body>
    </html>
  );
}
