import type { Metadata } from "next";
import "./globals.css";
import type { ReactNode } from "react";
import { SellerShell } from "../components/seller-shell";

export const metadata: Metadata = {
  title: "ITech Shop Seller",
  description: "Seller operations workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SellerShell>{children}</SellerShell>
      </body>
    </html>
  );
}
