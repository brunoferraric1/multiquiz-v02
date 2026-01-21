import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, isSupportedLocale, locales } from "./lib/i18n";

const PUBLIC_FILE = /\.(.*)$/;

const getLocaleFromPathname = (pathname: string) =>
  locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const localeFromPath = getLocaleFromPathname(pathname);

  if (localeFromPath) {
    const url = request.nextUrl.clone();
    url.pathname =
      pathname === `/${localeFromPath}`
        ? "/"
        : pathname.replace(`/${localeFromPath}`, "");

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", localeFromPath);

    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  const cookieLocale = request.cookies.get("locale")?.value;
  const locale = isSupportedLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set("locale", locale, { path: "/" });
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};
