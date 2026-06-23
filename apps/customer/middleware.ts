import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES, APP_BASE_PATHS, normalizeAuthRole } from "@itech/shared/auth";

const hostLoginUrl = process.env.HOST_APP_URL ?? "http://localhost:3000";
const customerAppUrl = process.env.CUSTOMER_APP_URL ?? "http://localhost:3001";
const sellerAppUrl = process.env.SELLER_APP_URL ?? "http://localhost:3002";
const adminAppUrl = process.env.ADMIN_APP_URL ?? "http://localhost:3003";

const roleOrigins = {
  admin: adminAppUrl,
  seller: sellerAppUrl,
  customer: customerAppUrl,
} as const;

// Routes không cần đăng nhập
const PUBLIC_PREFIXES = [
  "/customer/products",
  "/customer/search",
];

const PUBLIC_EXACT = ["/customer", "/customer/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes → cho qua luôn
  if (
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAMES.accessToken)?.value;
  const role = normalizeAuthRole(
    request.cookies.get(AUTH_COOKIE_NAMES.authRole)?.value
  );

  // Chưa đăng nhập → về login của host
  if (!token || !role) {
    const loginUrl = new URL(
      `/login?next=${encodeURIComponent(pathname)}`,
      hostLoginUrl
    );
    return NextResponse.redirect(loginUrl);
  }

  // Đúng role → cho qua
  if (role === "customer") {
    return NextResponse.next();
  }

  // Sai role → redirect về app tương ứng
  return NextResponse.redirect(
    new URL(APP_BASE_PATHS[role], roleOrigins[role])
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};