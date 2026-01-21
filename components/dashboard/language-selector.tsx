"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Locale } from "@/lib/i18n";
import { useLocale, useMessages } from "@/lib/i18n/context";
import { localizePathname } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

type LanguageSelectorProps = {
  className?: string;
};

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const messages = useMessages();
  const labels = messages.dashboard.language;

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
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground">{labels.label}</span>
      <Select value={locale} onValueChange={handleLocaleChange}>
        <SelectTrigger className="w-[140px]" aria-label={labels.label}>
          <SelectValue placeholder={labels.label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
