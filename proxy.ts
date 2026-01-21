import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, isSupportedLocale } from "./lib/i18n";
import { getLocaleFromPathname } from "./lib/i18n/paths";

const PUBLIC_FILE = /\.(.*)$/;

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

    const response = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    response.cookies.set("locale", localeFromPath, { path: "/" });
    return response;
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
