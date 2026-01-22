'use client';

import { useMemo } from 'react';
import type { BrandKitColors, QuizDraft } from '@/types';
import { BlocksQuizPlayer } from '@/components/quiz/blocks-quiz-player';

type ThemePreviewCopy = {
  title: string;
  questionLabel: string;
  option1: string;
  option2: string;
  buttonText: string;
};

interface ThemePreviewProps {
  colors: BrandKitColors;
  logoUrl?: string | null;
  copy: ThemePreviewCopy;
}

const buildPreviewQuiz = (copy: ThemePreviewCopy): QuizDraft => ({
  title: copy.title,
  visualBuilderData: {
    schemaVersion: 1,
    steps: [
      {
        id: 'theme-preview-step',
        type: 'question',
        label: copy.title,
        blocks: [
          {
            id: 'theme-preview-header',
            type: 'header',
            enabled: true,
            config: {
              title: copy.questionLabel,
            },
          },
          {
            id: 'theme-preview-options',
            type: 'options',
            enabled: true,
            config: {
              selectionType: 'single',
              items: [
                { id: 'theme-preview-option-a', text: copy.option1 },
                { id: 'theme-preview-option-b', text: copy.option2 },
              ],
            },
          },
          {
            id: 'theme-preview-button',
            type: 'button',
            enabled: true,
            config: {
              text: copy.buttonText,
              action: 'next_step',
            },
          },
        ],
        settings: {
          showProgress: false,
          allowBack: false,
        },
      },
    ],
    outcomes: [],
  },
});

/**
 * Theme preview rendered with the real quiz player for accurate styling.
 */
export function ThemePreview({ colors, logoUrl, copy }: ThemePreviewProps) {
  const previewQuiz = useMemo(() => buildPreviewQuiz(copy), [copy]);

  return (
    <div className="relative h-[60vh] min-h-[420px] w-full overflow-x-hidden overflow-y-auto">
      <BlocksQuizPlayer
        quiz={previewQuiz}
        mode="preview"
        brandKitColors={colors}
        brandKitLogoUrl={logoUrl}
        layout="embedded"
        hideBranding
        initialSelectedOptions={{
          'theme-preview-step': ['theme-preview-option-b'],
        }}
      />
    </div>
  );
}
