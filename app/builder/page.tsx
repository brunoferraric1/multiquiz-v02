
'use client';

import { useEffect } from 'react';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { ProtectedRoute } from '@/components/protected-route';
import BuilderContent from './builder-content';

function NewQuizInitializer() {
  const { reset, setQuiz, quiz } = useQuizBuilderStore();

  // Reset store and initialize a new quiz when component mounts
  useEffect(() => {
    // Reset to clean state
    reset();

    // Initialize with a new ID
    setQuiz({
      id: crypto.randomUUID(),
      title: '',
      description: '',
      questions: [],
      outcomes: [],
      primaryColor: '#4F46E5',
      isPublished: false,
    });
  }, [reset, setQuiz]);

  return <BuilderContent isEditMode={false} />;
}

export default function BuilderPage() {
  return (
    <ProtectedRoute>
      <NewQuizInitializer />
    </ProtectedRoute>
  );
}

