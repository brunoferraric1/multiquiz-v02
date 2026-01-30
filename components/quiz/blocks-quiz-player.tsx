'use client';

/**
 * BlocksQuizPlayer - Unified quiz player using visual builder blocks
 *
 * This component renders quizzes using the blocks-based format from the visual builder.
 * It supports all 9 block types and maintains visual consistency between
 * the builder preview and the production quiz player.
 */

import { useMemo, useState, useEffect, useRef, type CSSProperties } from 'react';
import posthog from 'posthog-js';
import type { BrandKitColors, Quiz, QuizDraft, VisualBuilderData, FieldResponse, LogoSize } from '@/types';
import type { Block, OptionsConfig, FieldsConfig, FieldItem, PriceConfig, FieldType } from '@/types/blocks';
import { QuizBlocksRenderer, validateField } from './quiz-blocks-renderer';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { useAuth } from '@/lib/hooks/use-auth';
import { quizToVisualBuilder } from '@/lib/utils/visual-builder-converters';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMessages } from '@/lib/i18n/context';
import {
  getReadableTextColor,
  getCardBorder,
  getMutedForeground,
  getInputBackground,
  getInputBorder,
  getCardHoverBackground,
  getCardHoverBorder,
  mixColors,
} from '@/lib/utils/color';

interface BlocksQuizPlayerProps {
  quiz: QuizDraft | Quiz;
  mode?: 'preview' | 'live';
  onExit?: () => void;
  brandKitColors?: BrandKitColors | null;
  brandKitLogoUrl?: string | null;
  brandKitLogoSize?: LogoSize;
  layout?: 'full' | 'embedded';
  className?: string;
  initialSelectedOptions?: SelectionState;
  hideBranding?: boolean;
  initialStepIndex?: number;
  initialOutcomeId?: string | null;
}

type SelectionState = Record<string, string[]>;
type FieldValuesState = Record<string, Record<string, string>>;

const DEFAULT_PURPLE = '#4F46E5';
type BrandKitStyle = CSSProperties & Record<`--${string}`, string>;

// Logo size CSS classes mapped by size and layout
const LOGO_SIZE_CLASSES: Record<LogoSize, { full: string; embedded: string }> = {
  small: {
    full: 'h-10 sm:h-12 max-w-[160px]',
    embedded: 'h-8 max-w-[140px]',
  },
  medium: {
    full: 'h-14 sm:h-16 max-w-[200px]',
    embedded: 'h-12 max-w-[180px]',
  },
  large: {
    full: 'h-16 sm:h-20 max-w-[240px]',
    embedded: 'h-16 max-w-[220px]',
  },
};

export function BlocksQuizPlayer({
  quiz,
  mode = 'live',
  onExit,
  brandKitColors,
  brandKitLogoUrl,
  brandKitLogoSize = 'medium',
  layout = 'full',
  className,
  initialSelectedOptions,
  hideBranding = false,
  initialStepIndex = 0,
  initialOutcomeId = null,
}: BlocksQuizPlayerProps) {
  const messages = useMessages();

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
    const mutedForeground = getMutedForeground(backgroundColor);

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
          // Track quiz start event
          posthog.capture('quiz_started', {
            quiz_id: quiz.id,
            quiz_title: quiz.title,
            attempt_id: id,
            steps_count: steps.length,
            questions_count: steps.filter((s) => s.type === 'question').length,
          });
        })
        .catch((e) => console.error(e));
    }
  }, [mode, quiz.id, user, attemptId, quiz.ownerId, authLoading]);

  // State machine
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex);
  const [selectedOptions, setSelectedOptions] = useState<SelectionState>(
    initialSelectedOptions ?? {}
  );
  const [selectedPrices, setSelectedPrices] = useState<SelectionState>({});
  const [fieldValues, setFieldValues] = useState<FieldValuesState>({});
  const [resultOutcomeId, setResultOutcomeId] = useState<string | null>(initialOutcomeId);
  const [showFieldErrors, setShowFieldErrors] = useState(false);

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

  // Compute selected price redirect URL for button actions
  const selectedPriceRedirectUrl = useMemo(() => {
    // Find price block in current blocks
    const priceBlock = blocksToRender.find((b) => b.type === 'price' && b.enabled);
    if (!priceBlock) return undefined;

    const priceConfig = priceBlock.config as PriceConfig;
    const items = priceConfig.items || [];

    // Get the first selected price's redirect URL
    const selectedPriceId = currentPriceIds[0];
    if (!selectedPriceId) return undefined;

    const selectedPrice = items.find((item) => item.id === selectedPriceId);
    return selectedPrice?.redirectUrl;
  }, [blocksToRender, currentPriceIds]);

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

    // Validate fields in current step before advancing
    const fieldsBlock = currentStep.blocks.find((b) => b.type === 'fields' && b.enabled);
    const fieldsConfig = fieldsBlock?.config as FieldsConfig | undefined;
    const stepFields = currentFieldValues;

    // Check all field validations (required + format)
    const hasValidationErrors = fieldsConfig?.items?.some((field: FieldItem) => {
      const value = stepFields[field.id] || '';
      const error = validateField(field.type, value, field.required);
      return error !== null;
    });

    if (hasValidationErrors) {
      // Show all validation errors
      setShowFieldErrors(true);
      return;
    }

    // Reset error display for next step
    setShowFieldErrors(false);

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

    // Track lead capture event (only if we have meaningful field data)
    if (fieldResponses.length > 0) {
      const hasContactInfo = fieldResponses.some(
        (r) => r.type === 'email' || r.type === 'phone'
      );
      posthog.capture('lead_captured', {
        quiz_id: quiz.id,
        quiz_title: quiz.title,
        attempt_id: attemptId,
        has_email: !!legacyLead.email,
        has_phone: !!legacyLead.phone,
        has_name: !!legacyLead.name,
        fields_count: fieldResponses.length,
        has_contact_info: hasContactInfo,
      });
    }
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
        quizId: quiz.id, // Pass quizId to ensure stats are updated even if attempt doc fetch fails
      });

      // Track quiz completion event
      const winningOutcome = outcomes.find((o) => o.id === winningOutcomeId);
      posthog.capture('quiz_completed', {
        quiz_id: quiz.id,
        quiz_title: quiz.title,
        attempt_id: attemptId,
        outcome_id: winningOutcomeId,
        outcome_name: winningOutcome?.name,
        questions_answered: Object.keys(selectedOptions).length,
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
      className={cn(
        'relative w-full bg-background px-4 py-8 pb-20 text-foreground sm:px-8 sm:pb-24 flex flex-col justify-center',
        layout === 'full' ? 'min-h-screen' : 'min-h-full',
        className
      )}
      style={brandKitStyle}
    >
      {/* Main content */}
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        {/* Brand logo - centered with spacing */}
        {showBrandLogo && (
          <div className="flex justify-center mb-2">
            <button
              type="button"
              onClick={resetQuiz}
              aria-label="Voltar ao inicio do quiz"
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-[var(--cursor-interactive)]"
            >
              <img
                src={brandKitLogoUrl as string}
                alt="Logo da marca"
                className={cn(
                  'w-auto object-contain',
                  layout === 'full'
                    ? LOGO_SIZE_CLASSES[brandKitLogoSize].full
                    : LOGO_SIZE_CLASSES[brandKitLogoSize].embedded
                )}
              />
            </button>
          </div>
        )}
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
          selectedPriceRedirectUrl={selectedPriceRedirectUrl}
          onButtonClick={handleButtonClick}
          fieldValues={currentFieldValues}
          onFieldChange={handleFieldChange}
          showFieldErrors={showFieldErrors}
          onLoadingComplete={goToNextStep}
        />

      </div>

      {/* Footer branding */}
      {!hideBranding && (
        <div
          className={cn(
            'pointer-events-auto bottom-4 right-4 z-10',
            layout === 'full' ? 'fixed' : 'absolute'
          )}
        >
          {isLive ? (
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col items-center gap-1 text-xs font-medium text-foreground/60 transition-colors hover:text-foreground sm:flex-row sm:gap-2 cursor-[var(--cursor-interactive)]"
              aria-label={messages.common.branding.madeWithMultiQuiz}
            >
              <span className="opacity-70 transition-opacity group-hover:opacity-100">{messages.common.branding.madeWith}</span>
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
              <span className="opacity-70 transition-opacity group-hover:opacity-100">{messages.common.branding.madeWith}</span>
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
      )}
    </div>
  );
}
