import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);

const PUBLIC_PATHS = ["/", "/apply", "/status"];
const ADMIN_PATHS = ["/admin"];

function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(en|zh)(\/|$)/, "/") || "/";
}

function matchesAny(pathname: string, paths: string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const bare = stripLocale(pathname);
  const locale = pathname.match(/^\/(en|zh)/)?.[1] ?? routing.defaultLocale;

  // Public paths — no auth needed
  if (matchesAny(bare, PUBLIC_PATHS)) {
    return handleI18n(request);
  }

  // Must be logged in from here
  const session = request.cookies.get("cf_session");
  if (!session) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  // Admin-only paths — require admin role
  if (matchesAny(bare, ADMIN_PATHS) && session.value !== "admin") {
    return NextResponse.redirect(new URL(`/${locale}/resources`, request.url));
  }

  return handleI18n(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
