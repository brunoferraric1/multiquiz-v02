'use client';

import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EmojiPickerProps {
  value?: string;
  onChange: (emoji: string | undefined) => void;
  className?: string;
}

export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    
    // If input is being cleared
    if (!text) {
      onChange(undefined);
      return;
    }
    
    // Extract emoji from input (take the first emoji character)
    const emojiMatch = text.match(/[\p{Emoji}]/u);
    if (emojiMatch) {
      onChange(emojiMatch[0]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace/delete to clear
    if (e.key === 'Backspace' || e.key === 'Delete') {
      onChange(undefined);
      return;
    }
    // Allow emoji input, but prevent regular text
    if (e.key.length === 1 && !/[\p{Emoji}]/u.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <Input
        type="text"
        inputMode="text"
        maxLength={2}
        value={value || ''}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="😀"
        className="w-12 h-10 text-center text-lg p-0 cursor-pointer"
        title="Use Cmd+Ctrl+Space (Mac) ou cole um emoji"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs hover:bg-destructive/90 cursor-pointer z-10"
          title="Remover emoji"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

