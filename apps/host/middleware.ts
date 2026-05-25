import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES, getAppHomePath, normalizeAuthRole } from "@itech/shared/auth";

export function middleware(request: NextRequest) {
  const role = normalizeAuthRole(request.cookies.get(AUTH_COOKIE_NAMES.authRole)?.value);
  const token = request.cookies.get(AUTH_COOKIE_NAMES.accessToken)?.value;
  const { pathname } = request.nextUrl;

  if (role && token && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL(getAppHomePath(role), request.url));
  }

  if (!role || !token) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(getAppHomePath(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/login/:path*"],
};
