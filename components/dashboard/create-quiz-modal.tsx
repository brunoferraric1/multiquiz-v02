'use client';

import { Sparkles, FileText, LayoutGrid } from 'lucide-react';
import { useMessages } from '@/lib/i18n/context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CreateQuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuizCreated: (quizId: string) => void;
}

interface MethodCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
  comingSoonLabel?: string;
  onClick?: () => void;
}

function MethodCard({
  icon,
  title,
  description,
  disabled = false,
  comingSoonLabel,
  onClick,
}: MethodCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-center transition-all duration-200',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:-translate-y-1 hover:border-primary/50 hover:bg-muted/50 hover:shadow-lg'
      )}
    >
      {comingSoonLabel && (
        <Badge variant="disabled" className="absolute right-3 top-3">
          {comingSoonLabel}
        </Badge>
      )}
      <div className="rounded-xl bg-primary/10 p-3 transition-transform duration-200 group-hover:animate-bounce-subtle">
        <div className="text-primary">{icon}</div>
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

export function CreateQuizModal({
  open,
  onOpenChange,
  onQuizCreated,
}: CreateQuizModalProps) {
  const messages = useMessages();
  const copy = messages.dashboard.createQuizModal;

  const handleBlankQuiz = () => {
    const quizId = crypto.randomUUID();
    onQuizCreated(quizId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* AI Assistant - disabled */}
          <MethodCard
            icon={<Sparkles size={24} />}
            title={copy.methods.ai.title}
            description={copy.methods.ai.description}
            disabled
            comingSoonLabel={copy.comingSoon}
          />

          {/* Blank Quiz - active */}
          <MethodCard
            icon={<FileText size={24} />}
            title={copy.methods.blank.title}
            description={copy.methods.blank.description}
            onClick={handleBlankQuiz}
          />

          {/* Templates - disabled */}
          <MethodCard
            icon={<LayoutGrid size={24} />}
            title={copy.methods.templates.title}
            description={copy.methods.templates.description}
            disabled
            comingSoonLabel={copy.comingSoon}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
