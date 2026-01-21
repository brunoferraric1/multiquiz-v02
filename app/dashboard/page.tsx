'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUserQuizzesQuery, useDeleteQuizMutation } from '@/lib/hooks/use-quiz-queries';
import { useLocale, useMessages } from '@/lib/i18n/context';
import { localizePathname } from '@/lib/i18n/paths';

import { QuizCard } from '@/components/dashboard/quiz-card';
import { QuizListItem } from '@/components/dashboard/quiz-list-item';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LanguageSelector } from '@/components/dashboard/language-selector';

const skeletonItems = Array.from({ length: 6 }, (_, index) => index);

function DashboardSkeleton({
  viewMode,
  loadingLabel,
}: {
  viewMode: 'grid' | 'list';
  loadingLabel: string;
}) {
  return (
    <div className="space-y-6" aria-live="polite" aria-busy="true">
      <span className="sr-only">{loadingLabel}</span>
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-hidden="true">
          {skeletonItems.map((item) => (
            <div
              key={`grid-${item}`}
              className="flex flex-col overflow-hidden rounded-lg border bg-card animate-pulse"
            >
              <div className="h-32 bg-muted/60" />
              <div className="flex flex-col gap-3 p-5">
                <div className="h-4 w-2/3 rounded bg-muted/70" />
                <div className="h-3 w-full rounded bg-muted/50" />
                <div className="h-3 w-4/5 rounded bg-muted/50" />
              </div>
              <div className="mt-auto border-t border-border/50 p-5 pt-0">
                <div className="mt-4 h-3 w-24 rounded bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3" aria-hidden="true">
          {skeletonItems.map((item) => (
            <div
              key={`list-${item}`}
              className="flex items-center justify-between p-4 bg-card border rounded-lg animate-pulse"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="h-12 w-12 rounded-md bg-muted/60" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-4 w-2/5 rounded bg-muted/70" />
                  <div className="h-3 w-1/3 rounded bg-muted/50" />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-4">
                <div className="h-6 w-20 rounded-full bg-muted/60" />
                <div className="h-8 w-8 rounded-md bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { data: quizzes, isLoading: quizzesLoading, isFetching } = useUserQuizzesQuery(user?.uid);
  const deleteQuizMutation = useDeleteQuizMutation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isRedirectingUpgrade, setIsRedirectingUpgrade] = useState(false);
  const hasProcessedUpgrade = useRef(false);
  const hasProcessedCheckout = useRef(false);
  const locale = useLocale();
  const messages = useMessages();
  const dashboard = messages.dashboard;

  const clearUpgradeParams = () => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('upgrade');
    newUrl.searchParams.delete('period');
    newUrl.searchParams.delete('checkout');
    newUrl.searchParams.delete('session_id');
    window.history.replaceState({}, '', newUrl.toString());
  };

  // Handle post-login upgrade intent
  useEffect(() => {
    const upgrade = searchParams.get('upgrade') === 'true';
    const period = searchParams.get('period') || 'monthly';
    const checkoutStatus = searchParams.get('checkout');
    const sessionId = searchParams.get('session_id');

    if (authLoading || !user) {
      return;
    }

    const syncCheckout = async () => {
      if (!user) return;
      try {
        const response = await fetch('/api/stripe/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, sessionId }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorPayload: unknown = errorText;
          try {
            errorPayload = errorText ? JSON.parse(errorText) : errorText;
          } catch (parseError) {
            console.error('Failed to parse sync error payload', parseError);
          }
          console.error('Failed to sync subscription', errorPayload);
          toast.error(dashboard.toast.checkoutSyncError);
          return;
        }

        toast.success(dashboard.toast.subscriptionActivated);
      } catch (error) {
        console.error('Subscription sync error:', error);
        toast.error(dashboard.toast.subscriptionUpdateError);
      } finally {
        clearUpgradeParams();
      }
    };

    if (checkoutStatus === 'success' && !hasProcessedCheckout.current) {
      hasProcessedCheckout.current = true;
      syncCheckout();
      return;
    }

    if (checkoutStatus === 'canceled' && !hasProcessedCheckout.current) {
      hasProcessedCheckout.current = true;
      toast.info(dashboard.toast.checkoutCanceled);
      clearUpgradeParams();
      return;
    }

    if (upgrade && user && !hasProcessedUpgrade.current) {
      hasProcessedUpgrade.current = true;
      setIsRedirectingUpgrade(true);
      router.replace(`${localizePathname('/pricing', locale)}?period=${period}`);
    }
  }, [dashboard, locale, user, authLoading, searchParams, router]);

  if (isRedirectingUpgrade) {
    return (
      <div className="flex flex-col h-screen items-center justify-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground animate-pulse">
          {dashboard.page.redirectingUpgrade}
        </p>
      </div>
    );
  }

  const handleDelete = async (quizId: string): Promise<void> => {
    if (!user) {
      alert(dashboard.errors.authRequiredDelete);
      throw new Error('User not authenticated');
    }

    await deleteQuizMutation.mutateAsync({ quizId, userId: user.uid });
  };

  const handleNewQuiz = () => {
    // Generate a new quiz ID and navigate to visual builder
    const newQuizId = crypto.randomUUID();
    router.push(localizePathname(`/visual-builder/${newQuizId}`, locale));
  };

  // Show skeleton during initial load OR when refetching to prevent stale image flicker
  const showSkeleton = authLoading || quizzesLoading || isFetching || quizzes === undefined;

  return (
    <div className="min-h-screen pb-20">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">{dashboard.page.title}</h1>
            <p className="text-muted-foreground mt-2">
              {dashboard.page.subtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto self-start sm:self-end">
            <LanguageSelector className="order-2 sm:order-1 w-full sm:w-auto" />
            <Button onClick={handleNewQuiz} className="w-full sm:w-auto order-1 sm:order-2">
              <Plus size={18} className="mr-2" />
              {dashboard.page.newQuiz}
            </Button>
            <div className="grid grid-cols-2 w-full sm:w-auto bg-muted p-1 rounded-lg order-2 sm:order-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-8 px-3 sm:w-8 sm:px-0 ${viewMode === 'grid' ? 'bg-card text-foreground ring-1 ring-border/70' : 'text-muted-foreground'}`}
                title={dashboard.page.viewGrid}
              >
                <LayoutGrid size={16} />
                <span className="ml-2 text-xs font-medium sm:hidden">
                  {dashboard.page.gridShort}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`h-8 px-3 sm:w-8 sm:px-0 ${viewMode === 'list' ? 'bg-card text-foreground ring-1 ring-border/70' : 'text-muted-foreground'}`}
                title={dashboard.page.viewList}
              >
                <List size={16} />
                <span className="ml-2 text-xs font-medium sm:hidden">
                  {dashboard.page.listShort}
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {showSkeleton ? (
          <DashboardSkeleton viewMode={viewMode} loadingLabel={dashboard.page.loadingQuizzes} />
        ) : quizzes && quizzes.length > 0 ? (
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
              title={dashboard.empty.title}
              description={dashboard.empty.description}
              action={
                <Button size="lg" onClick={handleNewQuiz}>
                  {dashboard.empty.createButton}
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
