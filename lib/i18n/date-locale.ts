import type { Locale as DateFnsLocale } from "date-fns";
import { enUS, es, ptBR } from "date-fns/locale";
import type { Locale } from "@/lib/i18n";

const dateLocales: Record<Locale, DateFnsLocale> = {
  "pt-BR": ptBR,
  en: enUS,
  es,
};

export const getDateLocale = (locale: Locale) => dateLocales[locale] ?? ptBR;
