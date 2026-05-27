import type { Metadata } from "next";
import "./globals.css";
import type { ReactNode } from "react";
import { AdminShell } from "../components/admin-shell";

export const metadata: Metadata = {
  title: "ITech Shop | Admin",
  description: "Admin portal for marketplace management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
