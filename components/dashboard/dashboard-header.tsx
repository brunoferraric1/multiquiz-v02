'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { isPro, useSubscription } from '@/lib/services/subscription-service';
import { useLocale, useMessages } from '@/lib/i18n/context';
import { localizePathname, stripLocaleFromPathname } from '@/lib/i18n/paths';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LanguageSelector } from '@/components/dashboard/language-selector';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import Link from 'next/link';

export function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { subscription } = useSubscription(user?.uid);
  const [menuOpen, setMenuOpen] = useState(false);
  const isProUser = isPro(subscription);
  const locale = useLocale();
  const messages = useMessages();
  const common = messages.common;
  const dashboard = messages.dashboard;

  const handleNavigation = (path: string) => {
    router.push(localizePathname(path, locale));
    setMenuOpen(false);
  };

  const isActiveRoute = (path: string) => {
    if (!pathname) return false;
    const normalizedPath = stripLocaleFromPathname(pathname);
    if (path === '/dashboard') return normalizedPath === '/dashboard';
    return normalizedPath.startsWith(path);
  };

  return (
    <header className="bg-card border-b sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={common.aria.openMenu}
                className="md:hidden"
              >
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent className="left-0 right-auto border-l-0 border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left">
              <SheetHeader className="mb-8">
                <SheetTitle>{dashboard.header.menu}</SheetTitle>
                <SheetDescription>{dashboard.header.menuDescription}</SheetDescription>
              </SheetHeader>

              <nav className="space-y-2">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-base",
                    isActiveRoute('/dashboard') && "bg-muted text-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => handleNavigation('/dashboard')}
                  aria-current={isActiveRoute('/dashboard') ? 'page' : undefined}
                >
                  {common.navigation.quizzes}
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-base",
                    isActiveRoute('/dashboard/reports') && "bg-muted text-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => handleNavigation('/dashboard/reports')}
                  aria-current={isActiveRoute('/dashboard/reports') ? 'page' : undefined}
                >
                  {common.navigation.reports}
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-base",
                    isActiveRoute('/pricing') && "bg-muted text-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => handleNavigation('/pricing')}
                  aria-current={isActiveRoute('/pricing') ? 'page' : undefined}
                >
                  {common.navigation.pricing}
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-base",
                    isActiveRoute('/dashboard/settings') && "bg-muted text-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => handleNavigation('/dashboard/settings')}
                  aria-current={isActiveRoute('/dashboard/settings') ? 'page' : undefined}
                >
                  {common.navigation.settings}
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-base",
                    isActiveRoute('/dashboard/account') && "bg-muted text-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => handleNavigation('/dashboard/account')}
                  aria-current={isActiveRoute('/dashboard/account') ? 'page' : undefined}
                >
                  {common.navigation.account}
                </Button>
              </nav>

              <div className="mt-10 border-t pt-6">
                <Link
                  href={localizePathname("/dashboard/account", locale)}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3"
                >
                  <Avatar>
                    <AvatarImage src={user?.photoURL ?? undefined} />
                    <AvatarFallback>{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {user?.displayName || dashboard.header.user}
                      </span>
                      {isProUser && <Badge variant="secondary">Pro</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </Link>
              </div>
            </SheetContent>
          </Sheet>

          <Link
            href={localizePathname("/dashboard", locale)}
            className="flex items-center gap-2"
          >
            <Image
              src="/multiquiz-logo.svg"
              alt="MultiQuiz Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-bold text-xl tracking-tight">
              MultiQuiz
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex flex-1 items-center justify-center gap-2 lg:gap-4 xl:gap-6">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={cn(
              "text-sm",
              isActiveRoute('/dashboard') && "bg-muted text-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={isActiveRoute('/dashboard') ? 'page' : undefined}
          >
            <Link href={localizePathname("/dashboard", locale)}>
              {common.navigation.quizzes}
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={cn(
              "text-sm",
              isActiveRoute('/dashboard/reports') && "bg-muted text-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={isActiveRoute('/dashboard/reports') ? 'page' : undefined}
          >
            <Link href={localizePathname("/dashboard/reports", locale)}>
              {common.navigation.reports}
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={cn(
              "text-sm",
              isActiveRoute('/pricing') && "bg-muted text-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={isActiveRoute('/pricing') ? 'page' : undefined}
          >
            <Link href={localizePathname("/pricing", locale)}>
              {common.navigation.pricing}
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={cn(
              "text-sm",
              isActiveRoute('/dashboard/settings') && "bg-muted text-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={isActiveRoute('/dashboard/settings') ? 'page' : undefined}
          >
            <Link href={localizePathname("/dashboard/settings", locale)}>
              {common.navigation.settings}
            </Link>
          </Button>
        </nav>

        <div className="ml-auto md:ml-0 flex items-center gap-2">
          <LanguageSelector />
          <Link
            href={localizePathname("/dashboard/account", locale)}
            className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted"
          >
            <Avatar className="h-8 w-8 md:h-9 md:w-9">
              <AvatarImage src={user?.photoURL ?? undefined} />
              <AvatarFallback>{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline text-sm font-medium">
                {user?.displayName?.split(' ')[0] || common.navigation.account}
              </span>
              {isProUser && (
                <Badge variant="secondary" className="text-[10px] px-1.5 h-4 md:text-xs md:px-2 md:h-5">
                  Pro
                </Badge>
              )}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
