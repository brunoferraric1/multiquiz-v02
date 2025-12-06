'use client';

import { useMemo, useState } from 'react';
import type { AnswerOption, Quiz, QuizDraft } from '@/types';
import { QuizIntro } from './quiz-intro';
import { QuizQuestion } from './quiz-question';
import { QuizResult } from './quiz-result';
import { QuizLeadGen } from './quiz-lead-gen';
import { QuizProgressBar } from './quiz-progress-bar';

type PlayableQuestion = {
  id: string;
  text: string;
  options: Partial<AnswerOption>[];
  allowMultiple?: boolean;
  imageUrl?: string;
};

type PlayableOutcome = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
};

type QuizPlayerProps = {
  quiz: QuizDraft | Quiz;
  mode?: 'preview' | 'live';
  onExit?: () => void;
};

type SelectionState = Record<string, string[]>;

const getPreviewCopy = (quiz: QuizDraft | Quiz) => ({
  title: quiz.title?.trim() || 'Meu Novo Quiz',
  description:
    quiz.description?.trim() || 'Conte mais sobre o que torna esse quiz especial.',
  coverImageUrl: quiz.coverImageUrl,
  primaryColor: quiz.primaryColor || 'var(--color-primary)',
  ctaText: quiz.ctaText,
});

export function QuizPlayer({ quiz, mode = 'live', onExit }: QuizPlayerProps) {
  const { title, description, coverImageUrl, primaryColor, ctaText } = getPreviewCopy(quiz);

  const questions = useMemo<PlayableQuestion[]>(() => {
    return (quiz.questions || []).reduce<PlayableQuestion[]>((list, item) => {
      if (!item?.id || !item.text || !(item.options || []).length) return list;
      const options = (item.options || []).filter((opt) => Boolean(opt?.id && opt.text));
      if (!options.length) return list;
      list.push({
        id: item.id,
        text: item.text,
        options,
        allowMultiple: item.allowMultiple,
        imageUrl: item.imageUrl,
      });
      return list;
    }, []);
  }, [quiz.questions]);

  const outcomes = useMemo<PlayableOutcome[]>(() => {
    return (quiz.outcomes || []).reduce<PlayableOutcome[]>((list, item) => {
      if (!item?.id || !item.title) return list;
      list.push({
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.imageUrl,
        ctaText: item.ctaText,
        ctaUrl: item.ctaUrl,
      });
      return list;
    }, []);
  }, [quiz.outcomes]);

  const leadGenConfig = useMemo(() => {
    return quiz.leadGen?.enabled && quiz.leadGen?.fields?.length ? quiz.leadGen : null;
  }, [quiz.leadGen]);

  const [phase, setPhase] = useState<'intro' | 'question' | 'lead-gen' | 'result'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<SelectionState>({});
  const [resultOutcomeId, setResultOutcomeId] = useState<string | null>(null);
  const [leadData, setLeadData] = useState<Record<string, string>>({});

  const currentQuestion = questions[currentQuestionIndex];
  const currentSelectionIds =
    currentQuestion && currentQuestion.id ? selectedOptions[currentQuestion.id] || [] : [];

  const handleStart = () => {
    if (questions.length > 0 && outcomes.length > 0) {
      setPhase('question');
      setCurrentQuestionIndex(0);
      setSelectedOptions({});
      setResultOutcomeId(null);
    }
  };

  const handleOptionSelect = (optionId: string) => {
    if (!currentQuestion?.id) return;

    setSelectedOptions((prev) => {
      const existing = prev[currentQuestion.id] || [];
      const nextSelections = currentQuestion.allowMultiple
        ? existing.includes(optionId)
          ? existing.filter((id) => id !== optionId)
          : [...existing, optionId]
        : [optionId];

      return {
        ...prev,
        [currentQuestion.id]: nextSelections,
      };
    });

    if (!currentQuestion.allowMultiple) {
      setTimeout(() => {
        goToNextQuestion();
      }, 220);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }
    // Check for Lead Gen before finalizing
    if (leadGenConfig) {
      setPhase('lead-gen');
    } else {
      finalizeQuiz();
    }
  };

  const handleLeadGenSubmit = (data: Record<string, string>) => {
    setLeadData(data);
    // TODO: Send lead data to backend
    finalizeQuiz();
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex === 0) {
      setPhase('intro');
      return;
    }
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const finalizeQuiz = () => {
    const tally: Record<string, number> = {};

    questions.forEach((question) => {
      const selections = selectedOptions[question.id] || [];
      selections.forEach((selectionId) => {
        const option = question.options.find((opt) => opt.id === selectionId);
        if (option?.targetOutcomeId) {
          tally[option.targetOutcomeId] = (tally[option.targetOutcomeId] || 0) + 1;
        }
      });
    });

    const rankedOutcomes = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    const winningOutcomeId = rankedOutcomes[0]?.[0] || outcomes[0]?.id || null;

    setResultOutcomeId(winningOutcomeId);
    setPhase('result');
  };

  const resetQuiz = () => {
    setPhase('intro');
    setSelectedOptions({});
    setCurrentQuestionIndex(0);
    setResultOutcomeId(null);
  };

  const resultOutcome =
    outcomes.find((outcome) => outcome.id === resultOutcomeId) || outcomes[0];

  const progress =
    phase === 'intro'
      ? 0
      : phase === 'result'
        ? questions.length + 1
        : currentQuestionIndex + 1;

  return (
    <div className="h-full w-full overflow-y-auto px-4 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        {phase === 'intro' && (
          <QuizIntro
            title={title}
            description={description}
            coverImageUrl={coverImageUrl}
            primaryColor={primaryColor}
            questionCount={questions.length}
            outcomeCount={outcomes.length}
            mode={mode}
            onStart={handleStart}
            ctaText={ctaText}
          />
        )}
        {phase === 'question' && currentQuestion && (
          <QuizQuestion
            question={currentQuestion}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            primaryColor={primaryColor}
            selectedOptionIds={currentSelectionIds}
            onOptionSelect={handleOptionSelect}
            onNext={goToNextQuestion}
            onBack={goToPreviousQuestion}
            onReset={resetQuiz}
          />
        )}
        {phase === 'lead-gen' && leadGenConfig && (
          <QuizLeadGen
            config={leadGenConfig}
            primaryColor={primaryColor}
            onSubmit={handleLeadGenSubmit}
          />
        )}
        {phase === 'result' && resultOutcome && (
          <QuizResult
            outcome={resultOutcome}
            mode={mode}
            onReset={resetQuiz}
            onExit={onExit}
          />
        )}
      </div>
    </div>
  );
}