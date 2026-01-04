'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu, Plus, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { isPro, useSubscription } from '@/lib/services/subscription-service';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  const { user, signOut } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription(user?.uid);
  const [menuOpen, setMenuOpen] = useState(false);
  const isProUser = isPro(subscription);

  const handleNewQuiz = () => {
    router.push('/builder');
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setMenuOpen(false);
  };

  const isActiveRoute = (path: string) => {
    if (!pathname) return false;
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  };

  return (
    <header className="bg-card border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Navigation */}
        <div className="flex items-center space-x-3">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent className="left-0 right-auto border-l-0 border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left">
              <SheetHeader className="mb-8">
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>Acesse seções rápidas do MultiQuiz.</SheetDescription>
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
                  Quizzes
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
                  Relatórios
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-base",
                    isActiveRoute('/dashboard/leads') && "bg-muted text-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => handleNavigation('/dashboard/leads')}
                  aria-current={isActiveRoute('/dashboard/leads') ? 'page' : undefined}
                >
                  Leads
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
                  Conta
                </Button>
              </nav>

              <div className="mt-10 border-t pt-6 space-y-4">
                <Link
                  href="/dashboard/account"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 mb-2"
                >
                  <Avatar>
                    <AvatarImage src={user?.photoURL ?? undefined} />
                    <AvatarFallback>{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{user?.displayName || 'Usuário'}</span>
                      {isProUser && <Badge variant="secondary">Pro</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </Link>
                {subscriptionLoading ? (
                  <div className="h-9 w-full rounded-md bg-muted/60 animate-pulse" aria-hidden="true" />
                ) : (
                  !isProUser && (
                    <Button asChild size="sm" className="w-full">
                      <Link href="/dashboard?upgrade=true&period=monthly">
                        Fazer upgrade para Pro
                      </Link>
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={async () => {
                    await handleLogout();
                    setMenuOpen(false);
                  }}
                >
                  <LogOut size={18} className="mr-2" />
                  Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* New Quiz Button */}
          <Button onClick={handleNewQuiz}>
            <Plus size={20} className="mr-2" />
            Novo Quiz
          </Button>
        </div>
      </div>
    </header>
  );
}
