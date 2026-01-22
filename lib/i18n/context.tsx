"use client";

import { createContext, useContext, useMemo } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { getMessages, type Messages } from "@/lib/i18n/messages";
import { getLocaleFromPathname } from "@/lib/i18n/paths";

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function LocaleProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pathLocale = getLocaleFromPathname(pathname ?? "");
  const resolvedLocale = pathLocale ?? locale;
  const resolvedMessages = pathLocale ? getMessages(pathLocale) : messages;

  const value = useMemo(
    () => ({ locale: resolvedLocale, messages: resolvedMessages }),
    [resolvedLocale, resolvedMessages],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within a LocaleProvider");
  }
  return context;
};

export const useLocale = () => useI18n().locale;

export const useMessages = () => useI18n().messages;
