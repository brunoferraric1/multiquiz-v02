
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { defaultLocale, isSupportedLocale } from "@/lib/i18n";
import { getMessages } from "@/lib/i18n/messages";
import { LocaleProvider } from "@/lib/i18n/context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MultiQuiz - Crie quizzes com IA",
  description: "Crie quizzes com IA, gere leads e analise resultados.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const headerLocale = requestHeaders.get("x-locale");
  const locale = isSupportedLocale(headerLocale) ? headerLocale : defaultLocale;
  const messages = getMessages(locale);

  return (
    <html lang={locale} className="dark">
      <body className={inter.className}>
        <LocaleProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </LocaleProvider>
      </body>
    </html>
  );
}
