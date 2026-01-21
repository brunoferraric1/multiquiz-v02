export const locales = ["pt-BR", "en", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt-BR";

export const isSupportedLocale = (
  value: string | null | undefined,
): value is Locale => {
  return Boolean(value) && locales.includes(value as Locale);
};
