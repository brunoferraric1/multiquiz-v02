'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUserQuizzesQuery, useDeleteQuizMutation } from '@/lib/hooks/use-quiz-queries';
import { createCheckoutSession } from '@/lib/services/subscription-service';

import { QuizCard } from '@/components/dashboard/quiz-card';
import { QuizListItem } from '@/components/dashboard/quiz-list-item';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ProtectedRoute } from '@/components/protected-route';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { data: quizzes, isLoading: quizzesLoading } = useUserQuizzesQuery(user?.uid);
  const deleteQuizMutation = useDeleteQuizMutation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false);
  const hasProcessedUpgrade = useRef(false);

  const clearUpgradeParams = () => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('upgrade');
    newUrl.searchParams.delete('period');
    newUrl.searchParams.delete('checkout');
    window.history.replaceState({}, '', newUrl.toString());
  };

  // Handle post-login upgrade intent
  useEffect(() => {
    const handleUpgrade = async () => {
      const upgrade = searchParams.get('upgrade') === 'true';
      const period = searchParams.get('period') || 'monthly';
      const checkoutStatus = searchParams.get('checkout');

      // If user came back from successful checkout, show success message
      if (checkoutStatus === 'success') {
        toast.success('Assinatura ativada com sucesso!');
        // Remove params to clean URL
        clearUpgradeParams();
        return;
      }

      // If upgrade intent is present and user is logged in
      if (upgrade && user && !isProcessingUpgrade && !hasProcessedUpgrade.current) {
        hasProcessedUpgrade.current = true;
        setIsProcessingUpgrade(true);
        try {
          const checkoutUrl = await createCheckoutSession(
            user.uid,
            user.email || '',
            period as 'monthly' | 'yearly'
          );

          if (checkoutUrl) {
            window.location.href = checkoutUrl;
          } else {
            console.error('Failed to create checkout session');
            toast.error('Erro ao iniciar pagamento. Tente novamente.');
            setIsProcessingUpgrade(false);
            clearUpgradeParams();
          }
        } catch (error) {
          console.error('Checkout error:', error);
          toast.error('Erro ao processar upgrade.');
          setIsProcessingUpgrade(false);
          clearUpgradeParams();
        }
      }
    };

    if (!authLoading && user) {
      handleUpgrade();
    }
  }, [user, authLoading, searchParams, isProcessingUpgrade]);

  if (isProcessingUpgrade) {
    return (
      <div className="flex flex-col h-screen items-center justify-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground animate-pulse">Iniciando checkout seguro...</p>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen pb-20">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Meus Quizzes</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie seus quizzes de recomendação e veja seus leads.
            </p>
          </div>

          <div className="flex bg-muted p-1 rounded-lg self-start sm:self-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'text-yellow-500' : ''}`}
              title="Visualização em Grade"
            >
              <LayoutGrid size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'text-yellow-500' : ''}`}
              title="Visualização em Lista"
            >
              <List size={16} />
            </Button>
          </div>
        </div>

        {/* Content */}
        {quizzes && quizzes.length > 0 ? (
          viewMode === 'grid' ? (
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
            <div className="flex flex-col gap-3">
              {quizzes.map((quiz) => (
                <QuizListItem
                  key={quiz.id}
                  quiz={quiz}
                  onDelete={handleDelete}
                  isDeleting={deleteQuizMutation.isPending}
                />
              ))}
            </div>
          )
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
  return <DashboardContent />;
}
