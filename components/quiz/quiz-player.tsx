'use client';

import { useMemo, useState, useEffect, useRef, type CSSProperties } from 'react';
import type { AnswerOption, BrandKitColors, Quiz, QuizDraft } from '@/types';
import { QuizIntro } from './quiz-intro';
import { QuizQuestion } from './quiz-question';
import { QuizResult } from './quiz-result';
import { QuizLeadGen } from './quiz-lead-gen';
import { QuizProgressBar } from './quiz-progress-bar';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { useAuth } from '@/lib/hooks/use-auth';

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
  brandKitColors?: BrandKitColors | null;
  brandKitLogoUrl?: string | null;
};

type SelectionState = Record<string, string[]>;

const DEFAULT_PURPLE = '#4F46E5';
const DARK_TEXT = '#0f172a';
const LIGHT_TEXT = '#f8fafc';
type BrandKitStyle = CSSProperties & Record<`--${string}`, string>;
const WHITE_HEX = '#ffffff';
const BLACK_HEX = '#000000';

const hexToRgb = (value: string) => {
  const normalized = value.trim().replace('#', '');
  if (normalized.length !== 6) return null;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
  return { r, g, b };
};

const relativeLuminance = (value: string) => {
  const rgb = hexToRgb(value);
  if (!rgb) return 0;
  const transform = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };
  const r = transform(rgb.r);
  const g = transform(rgb.g);
  const b = transform(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const getReadableTextColor = (value: string) => {
  return relativeLuminance(value) > 0.6 ? DARK_TEXT : LIGHT_TEXT;
};

const clampChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (channel: number) => clampChannel(channel).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const mixColors = (base: string, target: string, amount: number) => {
  const baseRgb = hexToRgb(base);
  const targetRgb = hexToRgb(target);
  if (!baseRgb || !targetRgb) return base;
  const mix = (from: number, to: number) => from + (to - from) * amount;
  return rgbToHex(
    mix(baseRgb.r, targetRgb.r),
    mix(baseRgb.g, targetRgb.g),
    mix(baseRgb.b, targetRgb.b)
  );
};

const adjustColor = (value: string, amount: number) => {
  if (amount === 0) return value;
  const target = amount > 0 ? WHITE_HEX : BLACK_HEX;
  return mixColors(value, target, Math.abs(amount));
};

const getInputBackground = (cardColor: string) => {
  const cardLum = relativeLuminance(cardColor);
  return cardLum < 0.5
    ? mixColors(cardColor, WHITE_HEX, 0.08)
    : mixColors(cardColor, BLACK_HEX, 0.04);
};

const getInputBorder = (inputColor: string, inputForeground: string) => {
  return mixColors(inputColor, inputForeground, 0.1);
};

const getCardBorder = (cardColor: string) => {
  const cardLum = relativeLuminance(cardColor);
  const target = cardLum < 0.5 ? WHITE_HEX : BLACK_HEX;
  const amount = cardLum < 0.5 ? 0.12 : 0.08;
  return mixColors(cardColor, target, amount);
};

const getCardHoverBackground = (cardColor: string) => {
  const cardLum = relativeLuminance(cardColor);
  const target = cardLum < 0.5 ? WHITE_HEX : BLACK_HEX;
  const amount = cardLum < 0.5 ? 0.14 : 0.08;
  return mixColors(cardColor, target, amount);
};

const getCardHoverBorder = (cardColor: string) => {
  const cardLum = relativeLuminance(cardColor);
  const target = cardLum < 0.5 ? WHITE_HEX : BLACK_HEX;
  const amount = cardLum < 0.5 ? 0.22 : 0.16;
  return mixColors(cardColor, target, amount);
};

const getPreviewCopy = (quiz: QuizDraft | Quiz) => ({
  title: quiz.title?.trim() || 'Meu Novo Quiz',
  description:
    quiz.description?.trim() || 'Conte mais sobre o que torna esse quiz especial.',
  coverImageUrl: quiz.coverImageUrl,
  primaryColor: (quiz.primaryColor && quiz.primaryColor !== DEFAULT_PURPLE)
    ? quiz.primaryColor
    : 'var(--color-primary)',
  ctaText: quiz.ctaText,
});

export function QuizPlayer({
  quiz,
  mode = 'live',
  onExit,
  brandKitColors,
  brandKitLogoUrl,
}: QuizPlayerProps) {
  const { title, description, coverImageUrl, primaryColor, ctaText } = getPreviewCopy(quiz);
  const brandKitStyle = useMemo(() => {
    if (quiz.brandKitMode !== 'custom') return undefined;

    const primary = brandKitColors?.primary || quiz.primaryColor || DEFAULT_PURPLE;
    const style: BrandKitStyle = {
      '--color-primary': primary,
      '--color-primary-foreground': getReadableTextColor(primary),
      '--color-accent': primary,
      '--color-accent-foreground': getReadableTextColor(primary),
      '--color-ring': primary,
    };

    if (brandKitColors) {
      const cardColor = brandKitColors.secondary;
      const backgroundColor = brandKitColors.accent;
      const inputBackground = getInputBackground(cardColor);
      const inputForeground = getReadableTextColor(inputBackground);
      const inputBorder = getInputBorder(inputBackground, inputForeground);
      const cardBorder = getCardBorder(cardColor);
      const cardHover = getCardHoverBackground(cardColor);
      const cardHoverBorder = getCardHoverBorder(cardColor);
      const mutedForeground = mixColors(
        getReadableTextColor(backgroundColor),
        backgroundColor,
        0.45
      );
      style['--color-secondary'] = cardColor;
      style['--color-secondary-foreground'] = getReadableTextColor(cardColor);
      style['--color-background'] = backgroundColor;
      style['--color-foreground'] = getReadableTextColor(backgroundColor);
      style['--color-muted-foreground'] = mutedForeground;
      style['--color-card'] = cardColor;
      style['--color-card-foreground'] = getReadableTextColor(cardColor);
      style['--color-border'] = cardBorder;
      style['--quiz-card-hover'] = cardHover;
      style['--quiz-card-hover-border'] = cardHoverBorder;
      style['--color-input'] = inputBorder;
      style['--quiz-input-bg'] = inputBackground;
      style['--quiz-input-border'] = inputBorder;
      style['--quiz-input-foreground'] = inputForeground;
      style['--quiz-input-placeholder'] = mixColors(inputForeground, inputBackground, 0.55);
    }

    return style;
  }, [brandKitColors, quiz.brandKitMode, quiz.primaryColor]);

  // Attempt Tracking
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth(); // Get current user

  // Track if we already started tracking to avoid double inits
  const hasStartedRef = useRef(false);

  // Initialize attempt immediately on mount if live mode
  useEffect(() => {
    // Wait for auth to load so we know if it's the owner
    if (authLoading) return;

    if (mode === 'live' && quiz.id && !hasStartedRef.current && !attemptId) {
      hasStartedRef.current = true;
      // Check if current user is owner
      // We can't know for sure until user is loaded, but useAuth loads fast or we wait?
      // user might be null initially. If we wait for user, we might delay.
      // But we need to know if owner.
      // Let's assume false if loading, but that risks false negative.
      // Better: Just fire it. The service can be updated later? No.
      // If we wait for user loading it might delay valid starts.
      // Compromise: We check user.uid against quiz.ownerId if user exists.

      const isOwner = user?.uid === quiz.ownerId;

      AnalyticsService.createAttempt(quiz.id, user?.uid, isOwner).then(id => {
        setAttemptId(id);
      }).catch(e => console.error(e));
    }
  }, [mode, quiz.id, user, attemptId, quiz.ownerId, authLoading]);

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

  const handleStart = async () => {
    if (questions.length > 0 && outcomes.length > 0) {
      setPhase('question');
      setCurrentQuestionIndex(0);
      setSelectedOptions({});
      setResultOutcomeId(null);

      // Attempt is already created in useEffect.
      // We just need to update it with first question IF we have the ID.
      // If we don't have ID yet (rare race), we should wait or retry.
      if (attemptId && questions[0]) {
        AnalyticsService.updateAttempt(attemptId, {
          currentQuestionId: questions[0].id
        });
      }
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

      const nextState = {
        ...prev,
        [currentQuestion.id]: nextSelections,
      };

      // Track answer if in live mode and attempt is active
      if (mode === 'live' && attemptId) {
        // Simplified: just taking the last selection or joined strings for tracking
        // For allowMultiple, this might overwrite. Real app might want array storage or separate events.
        // For MVP, tracking the latest state of answers map
        // Construct the full answers map to update
        const simpleAnswers: Record<string, string> = {};
        Object.entries(nextState).forEach(([qId, sIds]) => {
          simpleAnswers[qId] = sIds.join(',');
        });

        AnalyticsService.updateAttempt(attemptId, {
          answers: simpleAnswers
        });
      }

      return nextState;
    });

    if (!currentQuestion.allowMultiple) {
      setTimeout(() => {
        goToNextQuestion();
      }, 220);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);

      // Update analytics with new current question
      if (mode === 'live' && attemptId && questions[nextIndex]) {
        AnalyticsService.updateAttempt(attemptId, {
          currentQuestionId: questions[nextIndex].id
        });
      }
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

    // Track lead info
    if (mode === 'live' && attemptId) {
      AnalyticsService.updateAttempt(attemptId, {
        lead: {
          name: data.name,
          email: data.email,
          phone: data.phone
        }
      });
    }

    finalizeQuiz();
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex === 0) {
      setPhase('intro');
      return;
    }
    const prevIndex = Math.max(0, currentQuestionIndex - 1);
    setCurrentQuestionIndex(prevIndex);
    // Update analytics with new current question (technically they went back, but it's still their "current" view)
    if (mode === 'live' && attemptId && questions[prevIndex]) {
      AnalyticsService.updateAttempt(attemptId, {
        currentQuestionId: questions[prevIndex].id
      });
    }
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

    // Track completion
    if (mode === 'live' && attemptId && winningOutcomeId) {
      AnalyticsService.updateAttempt(attemptId, {
        status: 'completed',
        resultOutcomeId: winningOutcomeId,
        // Ensure final state of answers is synced (optional if relying on interim updates)
      });
    }
  };

  const resetQuiz = () => {
    setPhase('intro');
    setSelectedOptions({});
    setCurrentQuestionIndex(0);
    setResultOutcomeId(null);
    setAttemptId(null); // Reset tracking session
  };

  const handleCtaClick = () => {
    if (mode === 'live' && attemptId) {
      AnalyticsService.updateAttempt(attemptId, {
        ctaClickedAt: Date.now()
      });
    }
  }

  const resultOutcome =
    outcomes.find((outcome) => outcome.id === resultOutcomeId) || outcomes[0];

  const progress =
    phase === 'intro'
      ? 0
      : phase === 'result'
        ? questions.length + 1
        : currentQuestionIndex + 1;

  const isLive = mode === 'live';
  const showBrandLogo = quiz.brandKitMode === 'custom' && Boolean(brandKitLogoUrl);

  return (
    <div
      className="relative min-h-screen w-full bg-background px-4 py-8 pb-20 text-foreground sm:px-8 sm:pb-24 flex flex-col justify-center"
      style={brandKitStyle}
    >
      {showBrandLogo && (
        <div className="absolute left-6 top-6 z-10 flex items-center sm:left-10 sm:top-8">
          <button
            type="button"
            onClick={resetQuiz}
            aria-label="Voltar ao início do quiz"
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-[var(--cursor-interactive)]"
          >
            <img
              src={brandKitLogoUrl as string}
              alt="Logo da marca"
              className="h-14 w-auto max-w-[200px] object-contain sm:h-16"
            />
          </button>
        </div>
      )}
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
            useBrandKitInputs={quiz.brandKitMode === 'custom' && Boolean(brandKitColors)}
          />
        )}
        {phase === 'result' && resultOutcome && (
          <QuizResult
            outcome={resultOutcome}
            mode={mode}
            onReset={resetQuiz}
            onExit={onExit}
            onCtaClick={handleCtaClick}
            primaryColor={primaryColor}
          />
        )}
      </div>
      <div className="pointer-events-auto fixed bottom-4 right-4 z-10">
        {isLive ? (
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col items-center gap-1 text-xs font-medium text-foreground/60 transition-colors hover:text-foreground sm:flex-row sm:gap-2 cursor-[var(--cursor-interactive)]"
            aria-label="Made with MultiQuiz"
          >
            <span className="opacity-70 transition-opacity group-hover:opacity-100">Made with</span>
            <span className="flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
              <img 
                src="/multiquiz-logo.svg" 
                alt="MultiQuiz" 
                className="h-4 w-4"
              />
              <span>MultiQuiz</span>
            </span>
          </a>
        ) : (
          <div className="group flex flex-col items-center gap-1 text-xs font-medium text-foreground/60 sm:flex-row sm:gap-2">
            <span className="opacity-70 transition-opacity group-hover:opacity-100">Made with</span>
            <span className="flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
              <img 
                src="/multiquiz-logo.svg" 
                alt="MultiQuiz" 
                className="h-4 w-4"
              />
              <span>MultiQuiz</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
