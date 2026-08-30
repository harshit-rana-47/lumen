import { NextResponse, type NextRequest } from "next/server";

const ACCESS_COOKIE = "lumen-access-token";

export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(ACCESS_COOKIE)?.value);
  const loginUrl = new URL("/login", request.url);

  if (!hasSession) {
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
