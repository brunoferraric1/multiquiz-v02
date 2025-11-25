'use client';

import { useRouter } from 'next/navigation';
import { Plus, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button, Avatar } from '@/components/ui';

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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
            <Sparkles size={18} />
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">
            MultiQuiz
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* User Info */}
          <div className="hidden sm:flex items-center space-x-2">
            <Avatar
              src={user?.displayName?.[0] || undefined}
              fallback={user?.email?.[0]}
              size="sm"
            />
            <span className="text-sm text-gray-600">
              {user?.displayName || user?.email}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Sair"
          >
            <LogOut size={20} />
          </button>

          {/* New Quiz Button */}
          <Button onClick={handleNewQuiz} size="md">
            <Plus size={20} className="mr-2" />
            Novo Quiz
          </Button>
        </div>
      </div>
    </header>
  );
}
