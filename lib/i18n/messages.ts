import { defaultLocale, type Locale } from "@/lib/i18n";
import enMessages from "@/messages/en";
import esMessages from "@/messages/es";
import ptBRMessages from "@/messages/pt-BR";

export type Messages = typeof ptBRMessages;

const messagesByLocale: Record<Locale, Messages> = {
  "pt-BR": ptBRMessages,
  en: enMessages,
  es: esMessages,
};

export const getMessages = (locale: Locale): Messages =>
  messagesByLocale[locale] ?? messagesByLocale[defaultLocale];
