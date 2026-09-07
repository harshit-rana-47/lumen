import { NextResponse, type NextRequest } from "next/server";

const ACCESS_COOKIE = "lumen-access-token";
const PUBLIC_PATHS = new Set(["/", "/login", "/register", "/design-system"]);

function hasAccessCookie(request: NextRequest): boolean {
  const raw = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!raw) {
    return false;
  }
  try {
    const token = decodeURIComponent(raw).trim();
    return token.length > 0 && token !== "dev-preview";
  } catch {
    return false;
  }
}

/**
 * Route protection + auth home redirect.
 * - Unauthenticated `/` → landing
 * - Authenticated `/` → `/today` (skip landing)
 * - Protected app routes require a real session cookie
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = hasAccessCookie(request);

  if (pathname === "/" && hasSession) {
    return NextResponse.redirect(new URL("/today", request.url));
  }

  if (PUBLIC_PATHS.has(pathname)) {
    if (hasSession && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/today", request.url));
    }
    return NextResponse.next();
  }

  const isProtected =
    pathname === "/today" ||
    pathname.startsWith("/journal") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/you") ||
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
    "/today",
    "/you",
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
