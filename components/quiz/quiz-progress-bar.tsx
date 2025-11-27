'use client';

type QuizProgressBarProps = {
  current: number;
  total: number;
  color?: string;
};

const progressWidth = (current: number, total: number) => {
  if (total === 0) return '0%';
  const progress = ((current + 1) / (total + 2)) * 100;
  return `${Math.min(100, Math.max(0, progress))}%`;
};

export function QuizProgressBar({
  current,
  total,
  color = 'var(--color-primary)',
}: QuizProgressBarProps) {
  const width = progressWidth(current, total);

  return (
    <div className="h-2 rounded-full bg-border/30">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width,
          backgroundColor: color,
        }}
      />
    </div>
  );
}
