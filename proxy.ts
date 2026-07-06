import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/auth/session-constants";

const publicAdminPaths = new Set([
  "/admin/login",
  "/admin/logout",
  "/admin/unauthorized",
]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicAdminPaths.has(pathname)) {
    return withAdminSecurityHeaders(NextResponse.next());
  }

  const hasSessionCookie = Boolean(
    request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value,
  );

  if (!hasSessionCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return withAdminSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return withAdminSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: "/admin/:path*",
};

function withAdminSecurityHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Vary", "Cookie");
  return response;
}
