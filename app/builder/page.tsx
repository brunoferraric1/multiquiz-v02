
'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { ProtectedRoute } from '@/components/protected-route';
import BuilderContent from './builder-content';

function NewQuizInitializer() {
  const { reset, setQuiz, quiz } = useQuizBuilderStore();
  const [hasHydrated, setHasHydrated] = useState(
    useQuizBuilderStore.persist.hasHydrated()
  );

  const [navigationType, setNavigationType] =
    useState<PerformanceNavigationTiming['type'] | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const unsub = useQuizBuilderStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    return () => {
      unsub?.();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof performance === 'undefined') {
      return;
    }

    const detectNavigationType = () => {
      const entries = performance.getEntriesByType?.('navigation') as
        | PerformanceNavigationTiming[]
        | undefined;
      const latestEntry = entries && entries.length > 0 ? entries[entries.length - 1] : undefined;

      if (latestEntry?.type) {
        return latestEntry.type;
      }

      const perfWithLegacyNav = performance as Performance & { navigation?: PerformanceNavigation };
      if (perfWithLegacyNav.navigation) {
        const typeMap: Record<number, PerformanceNavigationTiming['type']> = {
          0: 'navigate',
          1: 'reload',
          2: 'back_forward',
          255: 'navigate',
        };
        return typeMap[perfWithLegacyNav.navigation.type] || 'navigate';
      }

      return 'navigate';
    };

    const rafId = window.requestAnimationFrame(() => {
      setNavigationType(detectNavigationType());
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Reset store and initialize a new quiz only when we don't have persisted data
  useEffect(() => {
    if (!hasHydrated || initializedRef.current || !navigationType) {
      return;
    }

    const cameFromBuilder = (() => {
      if (typeof document === 'undefined') return false;
      if (!document.referrer) return false;
      try {
        const referrerPathname = new URL(document.referrer).pathname;
        return referrerPathname.startsWith('/builder');
      } catch (error) {
        console.error('Failed to parse referrer for builder navigation:', error);
        return false;
      }
    })();

    const shouldPreserveExisting =
      cameFromBuilder && (navigationType === 'reload' || navigationType === 'back_forward') && Boolean(quiz?.id);

    if (shouldPreserveExisting) {
      initializedRef.current = true;
      return;
    }

    reset();

    setQuiz({
      id: crypto.randomUUID(),
      title: '',
      description: '',
      questions: [],
      outcomes: [],
      primaryColor: '#4F46E5',
      isPublished: false,
    });
    initializedRef.current = true;
  }, [hasHydrated, navigationType, quiz?.id, reset, setQuiz]);

  return <BuilderContent isEditMode={false} />;
}

export default function BuilderPage() {
  return (
    <ProtectedRoute>
      <NewQuizInitializer />
    </ProtectedRoute>
  );
}
