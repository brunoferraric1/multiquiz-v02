'use client';

import { cn } from '@/lib/utils';

type FormattedTextProps = {
  text?: string | null;
  fallback?: string;
  className?: string;
  paragraphClassName?: string;
};

const splitIntoBlocks = (value?: string | null) => {
  if (!value) return [];

  return value
    .split(/\r?\n\r?\n+/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
};

export function FormattedText({
  text,
  fallback,
  className,
  paragraphClassName,
}: FormattedTextProps) {
  const blocks = splitIntoBlocks(text);
  const content = blocks.length ? blocks : fallback ? [fallback] : [];

  if (!content.length) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {content.map((block, index) => (
        <p key={index} className={cn('whitespace-pre-wrap', paragraphClassName)}>
          {block}
        </p>
      ))}
    </div>
  );
}
