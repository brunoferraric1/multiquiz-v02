'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu, Plus, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function DashboardHeader() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

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
                  className="w-full justify-start text-base"
                  onClick={() => handleNavigation('/dashboard')}
                >
                  Quizzes
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-base"
                  onClick={() => handleNavigation('/dashboard/reports')}
                >
                  Relatórios
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-base"
                  onClick={() => handleNavigation('/dashboard/leads')}
                >
                  Leads
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-base"
                  onClick={() => handleNavigation('/account')}
                >
                  Conta
                </Button>
              </nav>

              <div className="mt-10 border-t pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user?.photoURL ?? undefined} />
                    <AvatarFallback>{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user?.displayName || 'Usuário'}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
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
