'use client';

import { useRouter } from 'next/navigation';
import { Plus, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function DashboardHeader() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleNewQuiz = () => {
    router.push('/builder');
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="bg-card border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            <Sparkles size={18} />
          </div>
          <span className="font-bold text-xl tracking-tight">
            MultiQuiz
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* User Info */}
          <div className="hidden sm:flex items-center space-x-2">
            <Avatar>
              <AvatarImage src={user?.photoURL ?? undefined} />
              <AvatarFallback>{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {user?.displayName || user?.email}
            </span>
          </div>

          {/* Logout */}
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
            <LogOut size={20} />
          </Button>

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
