import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware = a fast first gate only. It checks for the presence of a
 * session cookie and bounces clearly-unauthenticated users away from /admin
 * before the page renders. It does NOT decide authorization — the real,
 * authoritative role check happens server-side in the admin layout via
 * `requireAdmin()` (which reads the role from the database). We keep DB access
 * out of the edge so this stays compatible with the free tier.
 */
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export function middleware(req: NextRequest) {
  const hasSession = SESSION_COOKIES.some((c) => req.cookies.has(c));
  if (!hasSession) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
