import { NextResponse, type NextRequest } from "next/server";

const ACCESS_COOKIE = "lumen-access-token";

const PUBLIC_PATHS = new Set(["/login", "/register"]);

/**
 * Server-side route protection.
 * Root cause of prior bug: apps/web/proxy.ts exported middleware-like helpers
 * but was never named/wired as Next.js middleware.ts, so auth was client-only.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(ACCESS_COOKIE)?.value);

  if (PUBLIC_PATHS.has(pathname)) {
    if (hasSession && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Protect app surfaces (dashboard group routes live at /, /journal, etc.)
  const isProtected =
    pathname === "/" ||
    pathname.startsWith("/journal") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/memory") ||
    pathname.startsWith("/insights") ||
    pathname.startsWith("/goals") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/timeline") ||
    pathname.startsWith("/dashboard");

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/dashboard/:path*",
    "/journal/:path*",
    "/chat/:path*",
    "/memory/:path*",
    "/insights/:path*",
    "/goals/:path*",
    "/settings/:path*",
    "/timeline/:path*"
  ]
};
