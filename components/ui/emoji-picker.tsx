'use client';

import emojiRegex from 'emoji-regex';
import { X } from 'lucide-react';
import {
  ChangeEvent,
  MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EmojiPickerProps {
  value?: string;
  onChange: (emoji: string | undefined) => void;
  className?: string;
}

export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(value ?? '');
  const regex = useMemo(() => emojiRegex(), []);

  useEffect(() => {
    setInputValue(value ?? '');
  }, [value]);

  const extractEmoji = (text: string) => {
    const match = text.match(regex);
    return match?.[0];
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    const nextEmoji = extractEmoji(text);

    setInputValue(nextEmoji ?? '');
    onChange(nextEmoji ?? undefined);
  };

  const handleClear = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setInputValue('');
    onChange(undefined);
    inputRef.current?.focus();
  };

  const handleOpenNativePicker = () => {
    const input = inputRef.current as (HTMLInputElement & {
      showPicker?: () => void;
    }) | null;

    if (!input) return;

    input.focus();

    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch (error) {
        try {
          // Some browsers require explicit binding
          input.showPicker.call(input);
          return;
        } catch (secondError) {
          console.warn('Native emoji picker failed', secondError || error);
        }
      }
    }
  };

  const hasEmoji = Boolean(inputValue);

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <Input
        ref={inputRef}
        type="text"
        inputMode="text"
        value={inputValue}
        onChange={handleInputChange}
        onClick={handleOpenNativePicker}
        onFocus={handleOpenNativePicker}
        placeholder="😀"
        className={cn(
          'w-20 h-10 text-center text-lg px-2 pr-8 cursor-[var(--cursor-interactive)]',
          !hasEmoji && 'opacity-50'
        )}
        title="Clique para abrir o teclado do sistema ou cole um emoji"
        aria-label="Escolher emoji"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs hover:bg-destructive/90 cursor-[var(--cursor-interactive)] z-10"
          title="Remover emoji"
          aria-label="Remover emoji selecionado"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
