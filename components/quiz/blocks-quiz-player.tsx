'use client';

/**
 * BlocksQuizPlayer - Unified quiz player using visual builder blocks
 *
 * This component renders quizzes using the blocks-based format from the visual builder.
 * It supports all 9 block types and maintains visual consistency between
 * the builder preview and the production quiz player.
 */

import { useMemo, useState, useEffect, useRef, type CSSProperties } from 'react';
import type { BrandKitColors, Quiz, QuizDraft, VisualBuilderData, FieldResponse } from '@/types';
import type { Block, OptionsConfig, FieldsConfig, FieldItem, PriceConfig, FieldType } from '@/types/blocks';
import { QuizBlocksRenderer } from './quiz-blocks-renderer';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { useAuth } from '@/lib/hooks/use-auth';
import { quizToVisualBuilder } from '@/lib/utils/visual-builder-converters';
import { ArrowLeft } from 'lucide-react';

interface BlocksQuizPlayerProps {
  quiz: QuizDraft | Quiz;
  mode?: 'preview' | 'live';
  onExit?: () => void;
  brandKitColors?: BrandKitColors | null;
  brandKitLogoUrl?: string | null;
}

type SelectionState = Record<string, string[]>;
type FieldValuesState = Record<string, Record<string, string>>;

const DEFAULT_PURPLE = '#4F46E5';
const DARK_TEXT = '#0f172a';
const LIGHT_TEXT = '#f8fafc';
type BrandKitStyle = CSSProperties & Record<`--${string}`, string>;
const WHITE_HEX = '#ffffff';
const BLACK_HEX = '#000000';

// Color utility functions (copied from quiz-player.tsx)
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

export function BlocksQuizPlayer({
  quiz,
  mode = 'live',
  onExit,
  brandKitColors,
  brandKitLogoUrl,
}: BlocksQuizPlayerProps) {
  // Get blocks data (prefer stored, fallback to reconstruction for legacy quizzes)
  const visualBuilderData = useMemo((): VisualBuilderData => {
    if (quiz.visualBuilderData) {
      return quiz.visualBuilderData as VisualBuilderData;
    }
    // Temporary fallback for legacy quizzes without visualBuilderData
    const converted = quizToVisualBuilder(quiz);
    return {
      schemaVersion: 1,
      steps: converted.steps,
      outcomes: converted.outcomes,
    };
  }, [quiz]);

  const { steps, outcomes } = visualBuilderData;

  // Theme/Brand kit styling - always apply when colors are provided
  const brandKitStyle = useMemo(() => {
    // If no colors provided, use no custom styling
    if (!brandKitColors) return undefined;

    const primary = brandKitColors.primary || DEFAULT_PURPLE;
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

    const style: BrandKitStyle = {
      '--color-primary': primary,
      '--color-primary-foreground': getReadableTextColor(primary),
      '--color-accent': primary,
      '--color-accent-foreground': getReadableTextColor(primary),
      '--color-ring': primary,
      '--color-secondary': cardColor,
      '--color-secondary-foreground': getReadableTextColor(cardColor),
      '--color-background': backgroundColor,
      '--color-foreground': getReadableTextColor(backgroundColor),
      '--color-muted-foreground': mutedForeground,
      '--color-card': cardColor,
      '--color-card-foreground': getReadableTextColor(cardColor),
      '--color-border': cardBorder,
      '--quiz-card-hover': cardHover,
      '--quiz-card-hover-border': cardHoverBorder,
      '--color-input': inputBorder,
      '--quiz-input-bg': inputBackground,
      '--quiz-input-border': inputBorder,
      '--quiz-input-foreground': inputForeground,
      '--quiz-input-placeholder': mixColors(inputForeground, inputBackground, 0.55),
    };

    return style;
  }, [brandKitColors]);

  // Analytics tracking
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const hasStartedRef = useRef(false);

  // Initialize attempt immediately on mount if live mode
  useEffect(() => {
    if (authLoading) return;

    if (mode === 'live' && quiz.id && !hasStartedRef.current && !attemptId) {
      hasStartedRef.current = true;
      const isOwner = user?.uid === quiz.ownerId;

      AnalyticsService.createAttempt(quiz.id, user?.uid, isOwner)
        .then((id) => {
          setAttemptId(id);
        })
        .catch((e) => console.error(e));
    }
  }, [mode, quiz.id, user, attemptId, quiz.ownerId, authLoading]);

  // State machine
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<SelectionState>({});
  const [selectedPrices, setSelectedPrices] = useState<SelectionState>({});
  const [fieldValues, setFieldValues] = useState<FieldValuesState>({});
  const [resultOutcomeId, setResultOutcomeId] = useState<string | null>(null);

  const currentStep = steps[currentStepIndex];

  // Get question steps for counting and outcome calculation
  const questionSteps = useMemo(() => {
    return steps.filter((s) => s.type === 'question');
  }, [steps]);

  // Get current step's selections and field values
  const currentSelectionIds = currentStep ? selectedOptions[currentStep.id] || [] : [];
  const currentPriceIds = currentStep ? selectedPrices[currentStep.id] || [] : [];
  const currentFieldValues = currentStep ? fieldValues[currentStep.id] || {} : {};

  // Get blocks to render
  const blocksToRender = useMemo((): Block[] => {
    if (!currentStep) return [];

    // For result step, show the winning outcome's blocks
    if (currentStep.type === 'result' && resultOutcomeId) {
      const winningOutcome = outcomes.find((o) => o.id === resultOutcomeId);
      return winningOutcome?.blocks || [];
    }

    return currentStep.blocks;
  }, [currentStep, resultOutcomeId, outcomes]);

  // Handle option selection
  const handleOptionSelect = (optionId: string) => {
    if (!currentStep) return;

    // Find options block to check if multi-select
    const optionsBlock = currentStep.blocks.find((b) => b.type === 'options' && b.enabled);
    const optionsConfig = optionsBlock?.config as OptionsConfig | undefined;
    const isMultiple = optionsConfig?.selectionType === 'multiple';

    setSelectedOptions((prev) => {
      const existing = prev[currentStep.id] || [];
      const nextSelections = isMultiple
        ? existing.includes(optionId)
          ? existing.filter((id) => id !== optionId)
          : [...existing, optionId]
        : [optionId];

      const nextState = {
        ...prev,
        [currentStep.id]: nextSelections,
      };

      // Track answer if in live mode and attempt is active
      if (mode === 'live' && attemptId) {
        const simpleAnswers: Record<string, string> = {};
        Object.entries(nextState).forEach(([stepId, sIds]) => {
          simpleAnswers[stepId] = sIds.join(',');
        });

        AnalyticsService.updateAttempt(attemptId, {
          answers: simpleAnswers,
        });
      }

      return nextState;
    });

    // Auto-advance for single selection
    if (!isMultiple) {
      setTimeout(() => {
        goToNextStep();
      }, 220);
    }
  };

  // Handle price selection
  const handlePriceSelect = (priceId: string) => {
    if (!currentStep) return;

    // Find price block to check if multi-select
    const priceBlock = currentStep.blocks.find((b) => b.type === 'price' && b.enabled);
    const priceConfig = priceBlock?.config as PriceConfig | undefined;
    const isMultiple = priceConfig?.selectionType === 'multiple';

    setSelectedPrices((prev) => {
      const existing = prev[currentStep.id] || [];
      const nextSelections = isMultiple
        ? existing.includes(priceId)
          ? existing.filter((id) => id !== priceId)
          : [...existing, priceId]
        : [priceId];

      return {
        ...prev,
        [currentStep.id]: nextSelections,
      };
    });
  };

  // Handle field value changes
  const handleFieldChange = (fieldId: string, value: string) => {
    if (!currentStep) return;

    setFieldValues((prev) => ({
      ...prev,
      [currentStep.id]: {
        ...prev[currentStep.id],
        [fieldId]: value,
      },
    }));
  };

  // Handle button click
  const handleButtonClick = () => {
    if (!currentStep) return;

    // Validate required fields in current step before advancing
    const fieldsBlock = currentStep.blocks.find((b) => b.type === 'fields' && b.enabled);
    const fieldsConfig = fieldsBlock?.config as FieldsConfig | undefined;
    const stepFields = currentFieldValues;

    // Check required fields
    const missingRequired = fieldsConfig?.items?.some((field: FieldItem) => {
      return field.required && !stepFields[field.id]?.trim();
    });

    if (missingRequired) {
      // TODO: Show validation error - for now just don't advance
      return;
    }

    // Collect field data from current step if any
    if (mode === 'live' && attemptId && fieldsConfig?.items?.length) {
      collectAndSaveFieldResponses();
    }

    goToNextStep();
  };

  // Navigate to next step
  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;

    // If we're at the last non-result step, calculate result
    const isLastBeforeResult =
      currentStep?.type !== 'result' &&
      (nextIndex >= steps.length || steps[nextIndex]?.type === 'result');

    if (isLastBeforeResult) {
      finalizeQuiz();
      // Find result step index
      const resultIndex = steps.findIndex((s) => s.type === 'result');
      if (resultIndex >= 0) {
        setCurrentStepIndex(resultIndex);
      }
      return;
    }

    if (nextIndex < steps.length) {
      setCurrentStepIndex(nextIndex);

      // Update analytics with new current step
      if (mode === 'live' && attemptId && steps[nextIndex]) {
        AnalyticsService.updateAttempt(attemptId, {
          currentQuestionId: steps[nextIndex].id,
        });
      }
    }
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    if (currentStepIndex > 0 && currentStep?.settings?.allowBack !== false) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);

      if (mode === 'live' && attemptId && steps[prevIndex]) {
        AnalyticsService.updateAttempt(attemptId, {
          currentQuestionId: steps[prevIndex].id,
        });
      }
    }
  };

  // Collect all field responses from entire quiz and save to attempt
  const collectAndSaveFieldResponses = () => {
    if (mode !== 'live' || !attemptId) return;

    const fieldResponses: FieldResponse[] = [];

    // Iterate through ALL steps and collect ALL field values
    steps.forEach((step) => {
      const fieldsBlock = step.blocks.find((b) => b.type === 'fields' && b.enabled);
      const fieldsConfig = fieldsBlock?.config as FieldsConfig | undefined;
      const stepFieldValues = fieldValues[step.id] || {};

      fieldsConfig?.items.forEach((field) => {
        const value = stepFieldValues[field.id];
        if (value && value.trim()) {
          fieldResponses.push({
            fieldId: field.id,
            label: field.label,
            type: field.type as FieldType,
            value: value.trim(),
            stepId: step.id,
          });
        }
      });
    });

    // Build legacy lead object for backward compatibility
    // Derive from fieldResponses using simple type matching (no heuristics)
    const legacyLead: { name?: string; email?: string; phone?: string } = {};
    fieldResponses.forEach((response) => {
      if (response.type === 'email' && !legacyLead.email) {
        legacyLead.email = response.value;
      } else if (response.type === 'phone' && !legacyLead.phone) {
        legacyLead.phone = response.value;
      } else if (response.type === 'text' && !legacyLead.name) {
        // Use first text field as name for backward compat
        legacyLead.name = response.value;
      }
    });

    // Save both fieldResponses (primary) and legacy lead object
    AnalyticsService.updateAttempt(attemptId, {
      fieldResponses,
      lead: Object.keys(legacyLead).length > 0 ? legacyLead : undefined,
    });
  };

  // Calculate result outcome
  const finalizeQuiz = () => {
    const tally: Record<string, number> = {};

    // Count votes for each outcome based on selected options
    questionSteps.forEach((step) => {
      const selections = selectedOptions[step.id] || [];
      const optionsBlock = step.blocks.find((b) => b.type === 'options' && b.enabled);
      const optionsConfig = optionsBlock?.config as OptionsConfig | undefined;

      selections.forEach((selectionId) => {
        const option = optionsConfig?.items.find((opt) => opt.id === selectionId);
        if (option?.outcomeId) {
          tally[option.outcomeId] = (tally[option.outcomeId] || 0) + 1;
        }
      });
    });

    // Find winning outcome (most votes, or first outcome as fallback)
    const rankedOutcomes = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    const winningOutcomeId = rankedOutcomes[0]?.[0] || outcomes[0]?.id || null;

    setResultOutcomeId(winningOutcomeId);

    // Collect all field responses before completion
    collectAndSaveFieldResponses();

    // Track completion
    if (mode === 'live' && attemptId && winningOutcomeId) {
      AnalyticsService.updateAttempt(attemptId, {
        status: 'completed',
        resultOutcomeId: winningOutcomeId,
      });
    }
  };

  // Reset quiz
  const resetQuiz = () => {
    setCurrentStepIndex(0);
    setSelectedOptions({});
    setSelectedPrices({});
    setFieldValues({});
    setResultOutcomeId(null);
    setAttemptId(null);
    hasStartedRef.current = false;
  };

  // Handle CTA click tracking
  const handleCtaClick = () => {
    if (mode === 'live' && attemptId) {
      AnalyticsService.updateAttempt(attemptId, {
        ctaClickedAt: Date.now(),
      });
    }
  };

  const isLive = mode === 'live';
  const showBrandLogo = Boolean(brandKitLogoUrl);

  // Show progress for question steps
  const showProgress = currentStep?.settings?.showProgress ?? currentStep?.type === 'question';
  const currentQuestionNumber = currentStep?.type === 'question'
    ? questionSteps.findIndex((s) => s.id === currentStep.id) + 1
    : 0;

  // Calculate progress percentage based on all steps (excluding result)
  // This matches the editor preview calculation in step-preview.tsx
  const progressPercentage = useMemo(() => {
    const stepsExcludingResult = steps.filter((s) => s.type !== 'result');
    if (stepsExcludingResult.length <= 1) return 100;
    return Math.round((currentStepIndex / (stepsExcludingResult.length - 1)) * 100);
  }, [steps, currentStepIndex]);

  // Check if back button should be shown
  const showBackButton = currentStepIndex > 0 && currentStep?.settings?.allowBack !== false;

  return (
    <div
      className="relative min-h-screen w-full bg-background px-4 py-8 pb-20 text-foreground sm:px-8 sm:pb-24 flex flex-col justify-center"
      style={brandKitStyle}
    >
      {/* Brand logo */}
      {showBrandLogo && (
        <div className="absolute left-6 top-6 z-10 flex items-center sm:left-10 sm:top-8">
          <button
            type="button"
            onClick={resetQuiz}
            aria-label="Voltar ao inicio do quiz"
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

      {/* Main content */}
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        {/* Navigation header - back button and progress bar */}
        {(showProgress || showBackButton) && currentStep?.type !== 'intro' && currentStep?.type !== 'result' && (
          <div className="space-y-2">
            {/* Back button at top left */}
            {showBackButton && (
              <button
                type="button"
                onClick={goToPreviousStep}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
            )}

            {/* Progress bar */}
            {showProgress && questionSteps.length > 0 && (
              <div className="w-full">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Blocks renderer */}
        <QuizBlocksRenderer
          blocks={blocksToRender}
          onOptionSelect={handleOptionSelect}
          selectedOptionIds={currentSelectionIds}
          onPriceSelect={handlePriceSelect}
          selectedPriceIds={currentPriceIds}
          onButtonClick={handleButtonClick}
          fieldValues={currentFieldValues}
          onFieldChange={handleFieldChange}
        />

      </div>

      {/* Footer branding */}
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
