import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);

const PUBLIC_PATHS = ["/", "/apply", "/status"];

function isPublicPath(pathname: string): boolean {
  // pathname comes in as /en/apply, /zh/status, etc.
  // Strip the locale prefix to get the bare path
  const bare = pathname.replace(/^\/(en|zh)(\/|$)/, "/") || "/";
  return PUBLIC_PATHS.some((p) => bare === p || bare.startsWith(p + "/"));
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let next-intl handle locale routing first for public paths
  if (isPublicPath(pathname)) {
    return handleI18n(request);
  }

  // Protected path — check session cookie
  const session = request.cookies.get("cf_session");
  if (!session) {
    // Redirect to the login page (root) preserving locale
    const locale = pathname.match(/^\/(en|zh)/)?.[1] ?? routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return handleI18n(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
