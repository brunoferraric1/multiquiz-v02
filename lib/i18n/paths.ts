import { locales, type Locale } from "@/lib/i18n";

const normalizePathname = (pathname: string) =>
  pathname.startsWith("/") ? pathname : `/${pathname}`;

const isExternalHref = (href: string) =>
  /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(href) ||
  href.startsWith("mailto:") ||
  href.startsWith("tel:");

export const getLocaleFromPathname = (pathname: string): Locale | null => {
  const normalizedPath = normalizePathname(pathname);
  const match = locales.find(
    (locale) =>
      normalizedPath === `/${locale}` ||
      normalizedPath.startsWith(`/${locale}/`),
  );
  return match ?? null;
};

export const stripLocaleFromPathname = (pathname: string) => {
  const normalizedPath = normalizePathname(pathname);
  const locale = getLocaleFromPathname(normalizedPath);
  if (!locale) {
    return normalizedPath;
  }

  if (normalizedPath === `/${locale}`) {
    return "/";
  }

  return normalizedPath.replace(`/${locale}`, "");
};

export const localizePathname = (href: string, locale: Locale) => {
  if (!href || href.startsWith("#") || isExternalHref(href)) {
    return href;
  }

  const [pathWithQuery, hash] = href.split("#");
  const [pathname, query] = pathWithQuery.split("?");
  const normalizedPath = normalizePathname(pathname);
  const strippedPath = stripLocaleFromPathname(normalizedPath);
  const localizedPath =
    strippedPath === "/" ? `/${locale}` : `/${locale}${strippedPath}`;

  const querySuffix = query ? `?${query}` : "";
  const hashSuffix = hash ? `#${hash}` : "";

  return `${localizedPath}${querySuffix}${hashSuffix}`;
};
