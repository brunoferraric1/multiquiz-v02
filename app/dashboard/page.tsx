'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUserQuizzesQuery, useDeleteQuizMutation } from '@/lib/hooks/use-quiz-queries';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { QuizCard } from '@/components/dashboard/quiz-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ProtectedRoute } from '@/components/protected-route';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: quizzes, isLoading } = useUserQuizzesQuery(user?.uid);
  const deleteQuizMutation = useDeleteQuizMutation();

  const handleDelete = async (quizId: string): Promise<void> => {
    if (!user) {
      alert('Você precisa estar autenticado para excluir um quiz');
      throw new Error('User not authenticated');
    }

    await deleteQuizMutation.mutateAsync({ quizId, userId: user.uid });
  };

  const handleNewQuiz = () => {
    router.push('/builder');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Meus Quizzes</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus quizzes de recomendação e veja seus leads.
          </p>
        </div>

        {/* Quiz Grid */}
        {quizzes && quizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onDelete={handleDelete}
                isDeleting={deleteQuizMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed">
            <EmptyState
              icon={<Plus size={32} />}
              title="Nenhum quiz criado ainda"
              description="Comece uma conversa com nossa IA para criar seu primeiro quiz."
              action={
                <Button size="lg" onClick={handleNewQuiz}>
                  Criar com IA
                </Button>
              }
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

