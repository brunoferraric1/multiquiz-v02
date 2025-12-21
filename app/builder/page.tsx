
'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { ProtectedRoute } from '@/components/protected-route';
import BuilderContent from './builder-content';

function NewQuizInitializer() {
  const { reset, setQuiz } = useQuizBuilderStore();

  const [navigationType, setNavigationType] =
    useState<PerformanceNavigationTiming['type'] | null>(null);
  const initializedRef = useRef(false);

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

  // Initialize a new quiz on first load
  useEffect(() => {
    if (initializedRef.current || !navigationType) {
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
  }, [navigationType, reset, setQuiz]);

  return <BuilderContent isEditMode={false} />;
}

export default function BuilderPage() {
  return (
    <ProtectedRoute>
      <NewQuizInitializer />
    </ProtectedRoute>
  );
}
