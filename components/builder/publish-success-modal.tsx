'use client';

import { useState } from 'react';
import { Globe, Copy, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { copyToClipboard } from '@/lib/copy-to-clipboard';
import { useMessages } from '@/lib/i18n/context';

interface PublishSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string;
  loading?: boolean;
  isUpdate?: boolean;
}

export function PublishSuccessModal({
  open,
  onOpenChange,
  quizId,
  loading = false,
  isUpdate = false,
}: PublishSuccessModalProps) {
  const messages = useMessages();
  const copy = messages.dashboard.publishSuccess;
  const [copied, setCopied] = useState(false);

  // Generate the quiz URL - uses current domain + /quiz/[id] route
  const quizUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/quiz/${quizId}`
    : '';

  const handleCopyLink = async () => {
    if (loading) return;
    if (!quizUrl) return;

    try {
      const copiedSuccessfully = await copyToClipboard(quizUrl);
      if (!copiedSuccessfully) throw new Error('Clipboard not supported');

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy quiz link:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <Globe className="w-8 h-8 text-green-600 dark:text-green-500" />
          </div>
          <DialogTitle className="text-2xl">
            {loading ? copy.loadingTitle : isUpdate ? copy.updateTitle : copy.title}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {loading ? copy.loadingDescription : copy.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border/60 bg-muted px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-foreground/70" />
                {copy.preparingLink}
              </div>
            ) : (
              <Input
                readOnly
                value={quizUrl}
                className="flex-1 font-mono text-sm bg-muted"
                onClick={(e) => e.currentTarget.select()}
              />
            )}
          </div>

          {loading ? (
            <Button className="w-full gap-2" size="lg" disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
              {copy.preparingLink}
            </Button>
          ) : (
            <Button
              onClick={handleCopyLink}
              className="w-full gap-2"
              size="lg"
            >
              {copied ? (
                <>
                  <Check size={20} />
                  {copy.linkCopied}
                </>
              ) : (
                <>
                  <Copy size={20} />
                  {copy.copyLink}
                </>
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            {copy.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
