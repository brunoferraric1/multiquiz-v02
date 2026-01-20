'use client';

/**
 * QuizBlocksRenderer - Renders visual builder blocks in read-only mode for QuizPlayer
 *
 * This component renders blocks from the visual builder format without editing UI.
 * It handles both display-only blocks and interactive blocks (options, fields).
 */

import {
  Block,
  HeaderConfig,
  TextConfig,
  MediaConfig,
  ListConfig,
  BannerConfig,
  ButtonConfig,
  OptionsConfig,
  FieldsConfig,
  PriceConfig,
} from '@/types/blocks';
import { cn } from '@/lib/utils';
import { Check, AlertTriangle, AlertCircle, Info, ArrowRight, Square, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormattedText } from './formatted-text';

interface QuizBlocksRendererProps {
  blocks: Block[];
  // For options block
  onOptionSelect?: (optionId: string) => void;
  selectedOptionIds?: string[];
  // For button block
  onButtonClick?: () => void;
  // For fields block
  fieldValues?: Record<string, string>;
  onFieldChange?: (fieldId: string, value: string) => void;
  // Styling
  className?: string;
}

export function QuizBlocksRenderer({
  blocks,
  onOptionSelect,
  selectedOptionIds = [],
  onButtonClick,
  fieldValues = {},
  onFieldChange,
  className,
}: QuizBlocksRendererProps) {
  // Filter to only enabled blocks
  const enabledBlocks = blocks.filter((block) => block.enabled);

  if (enabledBlocks.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {enabledBlocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          onOptionSelect={onOptionSelect}
          selectedOptionIds={selectedOptionIds}
          onButtonClick={onButtonClick}
          fieldValues={fieldValues}
          onFieldChange={onFieldChange}
        />
      ))}
    </div>
  );
}

interface BlockRendererProps {
  block: Block;
  onOptionSelect?: (optionId: string) => void;
  selectedOptionIds?: string[];
  onButtonClick?: () => void;
  fieldValues?: Record<string, string>;
  onFieldChange?: (fieldId: string, value: string) => void;
}

function BlockRenderer({
  block,
  onOptionSelect,
  selectedOptionIds = [],
  onButtonClick,
  fieldValues = {},
  onFieldChange,
}: BlockRendererProps) {
  switch (block.type) {
    case 'header':
      return <HeaderBlock config={block.config as HeaderConfig} />;
    case 'text':
      return <TextBlock config={block.config as TextConfig} />;
    case 'media':
      return <MediaBlock config={block.config as MediaConfig} />;
    case 'list':
      return <ListBlock config={block.config as ListConfig} />;
    case 'banner':
      return <BannerBlock config={block.config as BannerConfig} />;
    case 'button':
      return <ButtonBlock config={block.config as ButtonConfig} onClick={onButtonClick} />;
    case 'options':
      return (
        <OptionsBlock
          config={block.config as OptionsConfig}
          onSelect={onOptionSelect}
          selectedIds={selectedOptionIds}
        />
      );
    case 'fields':
      return (
        <FieldsBlock
          config={block.config as FieldsConfig}
          values={fieldValues}
          onChange={onFieldChange}
        />
      );
    case 'price':
      return <PriceBlock config={block.config as PriceConfig} />;
    default:
      return null;
  }
}

// ============================================================================
// Individual Block Components (Read-only for player)
// ============================================================================

function HeaderBlock({ config }: { config: HeaderConfig }) {
  const { title, description } = config;

  // Don't render if no content
  if (!title && !description) return null;

  return (
    <div className="text-center">
      {title && <h2 className="text-2xl font-semibold">{title}</h2>}
      {description && (
        <FormattedText
          text={description}
          className="mt-2 text-muted-foreground"
        />
      )}
    </div>
  );
}

function TextBlock({ config }: { config: TextConfig }) {
  const { content } = config;

  if (!content) return null;

  // Content from Tiptap editor is HTML, render it directly
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none text-foreground [&_p]:my-0 [&_p]:leading-relaxed"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

/**
 * Extract YouTube video ID from various URL formats
 */
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Extract Vimeo video ID from URL
 */
function getVimeoVideoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

function MediaBlock({ config }: { config: MediaConfig }) {
  const { type, url, alt } = config;

  if (!url) return null;

  if (type === 'video') {
    // Check for YouTube
    const youtubeId = getYouTubeVideoId(url);
    if (youtubeId) {
      return (
        <div className="w-full rounded-xl overflow-hidden">
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      );
    }

    // Check for Vimeo
    const vimeoId = getVimeoVideoId(url);
    if (vimeoId) {
      return (
        <div className="w-full rounded-xl overflow-hidden">
          <div className="aspect-video">
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}`}
              title="Vimeo video"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      );
    }

    // Fallback to native video for direct video URLs (mp4, webm, etc.)
    return (
      <div className="w-full rounded-xl overflow-hidden">
        <div className="aspect-video">
          <video src={url} controls className="w-full h-full object-contain bg-black" />
        </div>
      </div>
    );
  }

  // Images use 4:3 aspect ratio with object-cover to crop proportionally
  return (
    <div className="w-full rounded-xl overflow-hidden border border-border/50">
      <div className="aspect-[4/3]">
        <img src={url} alt={alt || ''} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}

function ListBlock({ config }: { config: ListConfig }) {
  const { items } = config;

  if (!items || items.length === 0) return null;

  return (
    <ul className="space-y-2 px-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3">
          <span className="w-5 h-5 shrink-0 flex items-center justify-center text-base mt-0.5">
            {item.emoji || <Check className="w-4 h-4 text-primary" />}
          </span>
          <span className="text-foreground">{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

function BannerBlock({ config }: { config: BannerConfig }) {
  const { urgency, text, emoji } = config;

  if (!text) return null;

  const urgencyStyles = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
    danger: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
  };

  const UrgencyIcon = {
    info: Info,
    warning: AlertTriangle,
    danger: AlertCircle,
  }[urgency];

  return (
    <div className={cn('p-4 rounded-lg border flex items-start gap-3', urgencyStyles[urgency])}>
      {emoji ? (
        <span className="text-lg">{emoji}</span>
      ) : (
        <UrgencyIcon className="w-5 h-5 shrink-0 mt-0.5" />
      )}
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

function PriceBlock({ config }: { config: PriceConfig }) {
  const items = config.items || [];
  const selectionType = config.selectionType || 'single';
  const showSelection = items.length > 1;

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((price) => {
        const hasHighlight = price.showHighlight && !!price.highlightText;
        const hasOriginalPrice = price.showOriginalPrice && !!price.originalPrice;

        return (
          <div
            key={price.id}
            className={cn(
              'relative rounded-xl overflow-hidden',
              'bg-card border border-border/50',
              'shadow-sm',
              hasHighlight && 'ring-2 ring-primary'
            )}
          >
            {/* Highlight banner */}
            {hasHighlight && (
              <div className="bg-primary text-primary-foreground text-xs font-semibold text-center py-1.5 px-3">
                {price.highlightText}
              </div>
            )}

            {/* Card content */}
            <div className="flex items-center justify-between p-4 gap-4">
              {/* Left side: selection indicator + title */}
              <div className="flex items-center gap-3 min-w-0">
                {showSelection && (
                  <div className="shrink-0">
                    {selectionType === 'multiple' ? (
                      <Square className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                    )}
                  </div>
                )}
                <span className="text-base font-medium text-foreground truncate">
                  {price.title || 'Plano'}
                </span>
              </div>

              {/* Right side: price info */}
              <div className="text-right shrink-0">
                {/* Prefix (e.g., "10% off") */}
                {price.prefix && (
                  <p className="text-xs text-muted-foreground">{price.prefix}</p>
                )}

                {/* Original price with "de X por:" format */}
                {hasOriginalPrice && (
                  <p className="text-sm text-muted-foreground">
                    <span>de </span>
                    <span className="line-through">{price.originalPrice}</span>
                    <span> por:</span>
                  </p>
                )}

                {/* Main price */}
                <p className="text-xl font-bold text-foreground">
                  {price.value || 'R$ 0,00'}
                </p>

                {/* Suffix (e.g., "à vista") */}
                {price.suffix && (
                  <p className="text-xs text-muted-foreground">{price.suffix}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ButtonBlock({ config, onClick }: { config: ButtonConfig; onClick?: () => void }) {
  const { text, action, url } = config;

  if (!text) return null;

  const handleClick = () => {
    if (action === 'url' && url) {
      window.open(url, '_blank');
    } else {
      onClick?.();
    }
  };

  return (
    <Button onClick={handleClick} size="lg" className="w-full justify-center gap-2">
      {text}
      <ArrowRight className="w-4 h-4" />
    </Button>
  );
}

function OptionsBlock({
  config,
  onSelect,
  selectedIds,
}: {
  config: OptionsConfig;
  onSelect?: (optionId: string) => void;
  selectedIds: string[];
}) {
  const { items, selectionType } = config;
  const isMultiple = selectionType === 'multiple';

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isSelected = selectedIds.includes(item.id);
        return (
          <button
            key={item.id}
            onClick={() => onSelect?.(item.id)}
            className={cn(
              'w-full p-4 rounded-xl border-2 text-left transition-all',
              'hover:border-primary/50 hover:bg-[var(--quiz-card-hover,hsl(var(--muted)))]',
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
            )}
          >
            <div className="flex items-center gap-3">
              {/* Show checkbox for multiple selection, radio for single */}
              {isMultiple ? (
                isSelected ? (
                  <CheckSquare className="w-5 h-5 text-primary shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-muted-foreground shrink-0" />
                )
              ) : null}
              {item.emoji && <span className="text-xl">{item.emoji}</span>}
              <span className="font-medium">{item.text}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function FieldsBlock({
  config,
  values,
  onChange,
}: {
  config: FieldsConfig;
  values: Record<string, string>;
  onChange?: (fieldId: string, value: string) => void;
}) {
  const { items } = config;

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-4">
      {items.map((field) => (
        <div key={field.id} className="space-y-2">
          <label htmlFor={field.id} className="text-sm font-medium text-foreground">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              id={field.id}
              value={values[field.id] || ''}
              onChange={(e) => onChange?.(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={cn(
                'w-full px-4 py-3 rounded-lg border',
                'bg-[var(--quiz-input-bg,hsl(var(--input)))]',
                'border-[var(--quiz-input-border,hsl(var(--border)))]',
                'text-[var(--quiz-input-foreground,hsl(var(--foreground)))]',
                'placeholder:text-[var(--quiz-input-placeholder,hsl(var(--muted-foreground)))]',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                'min-h-[100px] resize-y'
              )}
              required={field.required}
            />
          ) : (
            <input
              id={field.id}
              type={field.type === 'phone' ? 'tel' : field.type}
              value={values[field.id] || ''}
              onChange={(e) => onChange?.(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={cn(
                'w-full px-4 py-3 rounded-lg border',
                'bg-[var(--quiz-input-bg,hsl(var(--input)))]',
                'border-[var(--quiz-input-border,hsl(var(--border)))]',
                'text-[var(--quiz-input-foreground,hsl(var(--foreground)))]',
                'placeholder:text-[var(--quiz-input-placeholder,hsl(var(--muted-foreground)))]',
                'focus:outline-none focus:ring-2 focus:ring-ring'
              )}
              required={field.required}
            />
          )}
        </div>
      ))}
    </div>
  );
}
