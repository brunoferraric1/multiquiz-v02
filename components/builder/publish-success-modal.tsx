'use client';

import { useState } from 'react';
import { Globe, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PublishSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string;
}

export function PublishSuccessModal({
  open,
  onOpenChange,
  quizId,
}: PublishSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  // Generate the quiz URL - uses current domain + /quiz/[id] route
  const quizUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/quiz/${quizId}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(quizUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <Globe className="w-8 h-8 text-green-600 dark:text-green-500" />
          </div>
          <DialogTitle className="text-2xl">Quiz Publicado!</DialogTitle>
          <DialogDescription className="text-base">
            Seu quiz está no ar e pronto para receber respostas. Compartilhe o
            link abaixo com sua audiência.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={quizUrl}
              className="flex-1 font-mono text-sm bg-muted"
              onClick={(e) => e.currentTarget.select()}
            />
          </div>

          <Button
            onClick={handleCopyLink}
            className="w-full gap-2"
            size="lg"
          >
            {copied ? (
              <>
                <Check size={20} />
                Link Copiado!
              </>
            ) : (
              <>
                <Copy size={20} />
                Copiar Link
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
