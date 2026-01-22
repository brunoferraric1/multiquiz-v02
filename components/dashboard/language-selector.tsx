"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Locale } from "@/lib/i18n";
import { useLocale, useMessages } from "@/lib/i18n/context";
import { localizePathname } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

type LanguageSelectorProps = {
  className?: string;
};

const localeMeta: Record<Locale, { flag: string; shortLabel: string }> = {
  "pt-BR": { flag: "🇧🇷", shortLabel: "PT-BR" },
  en: { flag: "🇺🇸", shortLabel: "EN" },
  es: { flag: "🇪🇸", shortLabel: "ES" },
};

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const messages = useMessages();
  const labels = messages.dashboard.language;
  const active = localeMeta[locale];

  const options = useMemo(
    () => [
      { value: "pt-BR", label: labels.options["pt-BR"] },
      { value: "en", label: labels.options.en },
      { value: "es", label: labels.options.es },
    ],
    [labels],
  );

  const handleLocaleChange = (value: string) => {
    const nextLocale = value as Locale;
    const search = searchParams?.toString();
    const currentPath = `${pathname ?? "/"}${search ? `?${search}` : ""}`;
    const nextHref = localizePathname(currentPath, nextLocale);
    router.push(nextHref);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 gap-2 px-2 text-xs font-semibold tracking-wide",
            className,
          )}
          aria-label={labels.label}
        >
          <span className="text-base">{active.flag}</span>
          <span>{active.shortLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {options.map((option) => {
          const meta = localeMeta[option.value as Locale];
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleLocaleChange(option.value)}
              className="flex items-center gap-2"
            >
              <span className="text-base">{meta.flag}</span>
              <span className="text-xs font-semibold">{meta.shortLabel}</span>
              <span className="text-xs text-muted-foreground">{option.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
