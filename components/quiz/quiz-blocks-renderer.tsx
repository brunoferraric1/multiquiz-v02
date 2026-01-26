'use client';

/**
 * QuizBlocksRenderer - Renders visual builder blocks in read-only mode for QuizPlayer
 *
 * This component renders blocks from the visual builder format without editing UI.
 * It handles both display-only blocks and interactive blocks (options, fields).
 */

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
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
  LoadingConfig,
  FieldType,
} from '@/types/blocks';
import { cn } from '@/lib/utils';
import { Check, AlertTriangle, AlertCircle, Info, ArrowRight, Square, CheckSquare, Play, Video } from 'lucide-react';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { PhoneInput, getDefaultCountryFromLocale } from './phone-input';
import { useLocale } from '@/lib/i18n/context';
import { getMessages } from '@/lib/i18n/messages';
import type { Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { FormattedText } from './formatted-text';

// Dynamic import for react-player to avoid SSR issues
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface QuizBlocksRendererProps {
  blocks: Block[];
  // For options block
  onOptionSelect?: (optionId: string) => void;
  selectedOptionIds?: string[];
  // For price block
  onPriceSelect?: (priceId: string) => void;
  selectedPriceIds?: string[];
  // For button block
  onButtonClick?: () => void;
  // For fields block
  fieldValues?: Record<string, string>;
  onFieldChange?: (fieldId: string, value: string) => void;
  showFieldErrors?: boolean;
  // For loading block - called when loading animation completes
  onLoadingComplete?: () => void;
  // Styling
  className?: string;
}

export function QuizBlocksRenderer({
  blocks,
  onOptionSelect,
  selectedOptionIds = [],
  onPriceSelect,
  selectedPriceIds = [],
  onButtonClick,
  fieldValues = {},
  onFieldChange,
  showFieldErrors = false,
  onLoadingComplete,
  className,
}: QuizBlocksRendererProps) {
  // Filter to only enabled blocks
  const enabledBlocks = blocks.filter((block) => block.enabled);

  if (enabledBlocks.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {enabledBlocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          onOptionSelect={onOptionSelect}
          selectedOptionIds={selectedOptionIds}
          onPriceSelect={onPriceSelect}
          selectedPriceIds={selectedPriceIds}
          onButtonClick={onButtonClick}
          fieldValues={fieldValues}
          onFieldChange={onFieldChange}
          showFieldErrors={showFieldErrors}
          onLoadingComplete={onLoadingComplete}
        />
      ))}
    </div>
  );
}

interface BlockRendererProps {
  block: Block;
  onOptionSelect?: (optionId: string) => void;
  selectedOptionIds?: string[];
  onPriceSelect?: (priceId: string) => void;
  selectedPriceIds?: string[];
  onButtonClick?: () => void;
  fieldValues?: Record<string, string>;
  onFieldChange?: (fieldId: string, value: string) => void;
  showFieldErrors?: boolean;
  onLoadingComplete?: () => void;
}

function BlockRenderer({
  block,
  onOptionSelect,
  selectedOptionIds = [],
  onPriceSelect,
  selectedPriceIds = [],
  onButtonClick,
  fieldValues = {},
  onFieldChange,
  showFieldErrors = false,
  onLoadingComplete,
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
          showAllErrors={showFieldErrors}
        />
      );
    case 'price':
      return (
        <PriceBlock
          config={block.config as PriceConfig}
          onSelect={onPriceSelect}
          selectedIds={selectedPriceIds}
        />
      );
    case 'loading':
      return <LoadingBlock config={block.config as LoadingConfig} onComplete={onLoadingComplete} />;
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
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
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
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Get video thumbnail URL
 */
function getVideoThumbnail(url: string): string | null {
  const youtubeId = getYouTubeVideoId(url);
  if (youtubeId) {
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }
  return null;
}

/**
 * Clean video player with minimal UI
 * Shows static thumbnail first, then embeds video iframe when clicked
 * Priority: customThumbnail > auto-generated thumbnail > placeholder
 */
function VideoPlayer({ url, customThumbnail }: { url: string; customThumbnail?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const autoThumbnailUrl = getVideoThumbnail(url);
  const thumbnailUrl = customThumbnail || autoThumbnailUrl;
  const youtubeId = getYouTubeVideoId(url);
  const vimeoId = getVimeoVideoId(url);

  // Show static thumbnail with play button before user clicks
  if (!isPlaying) {
    return (
      <div
        className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted cursor-[var(--cursor-interactive)] group"
        onClick={() => setIsPlaying(true)}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <Video className="w-12 h-12 text-gray-500" />
          </div>
        )}
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:bg-white group-hover:scale-105 transition-all">
            <Play className="w-7 h-7 text-gray-900 ml-1" fill="currentColor" />
          </div>
        </div>
      </div>
    );
  }

  // Show YouTube iframe embed
  if (youtubeId) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&modestbranding=1&rel=0`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Show Vimeo iframe embed
  if (vimeoId) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&byline=0&portrait=0&title=0`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Fallback for other video URLs - use react-player
  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
      <ReactPlayer
        url={url}
        width="100%"
        height="100%"
        playing={true}
        controls={true}
      />
    </div>
  );
}

function MediaBlock({ config }: { config: MediaConfig }) {
  const { type, url, alt, orientation, videoThumbnail, focalPoint } = config;
  const imageOrientation = orientation ?? 'horizontal';
  const imageWrapperClass = cn(
    'rounded-xl overflow-hidden border border-border/50',
    imageOrientation === 'vertical'
      ? 'w-full max-w-[var(--media-portrait-max-width)] mx-auto'
      : 'w-full'
  );
  const imageAspectClass = imageOrientation === 'vertical' ? 'aspect-[3/4]' : 'aspect-video';
  const objectPosition = focalPoint
    ? `${focalPoint.x}% ${focalPoint.y}%`
    : 'center';

  if (!url) return null;

  if (type === 'video') {
    return (
      <div className="w-full">
        <VideoPlayer url={url} customThumbnail={videoThumbnail} />
      </div>
    );
  }

  // Images match the builder aspect ratio based on the chosen orientation
  return (
    <div className={imageWrapperClass}>
      <div className={imageAspectClass}>
        <img
          src={url}
          alt={alt || ''}
          className="w-full h-full object-cover"
          style={{ objectPosition }}
        />
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

function PriceBlock({
  config,
  onSelect,
  selectedIds = [],
}: {
  config: PriceConfig;
  onSelect?: (priceId: string) => void;
  selectedIds?: string[];
}) {
  const items = config.items || [];
  const selectionType = config.selectionType || 'single';
  const isMultiple = selectionType === 'multiple';
  const showSelection = items.length > 1;

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((price) => {
        const isSelected = selectedIds.includes(price.id);
        const hasHighlight = price.showHighlight && !!price.highlightText;
        const hasOriginalPrice = price.showOriginalPrice && !!price.originalPrice;

        return (
          <button
            key={price.id}
            type="button"
            onClick={() => onSelect?.(price.id)}
            className={cn(
              'relative w-full rounded-xl overflow-hidden text-left transition-all',
              'bg-card border-2 shadow-sm',
              'hover:border-primary hover:bg-[var(--quiz-card-hover,hsl(var(--muted)))] hover:ring-1 hover:ring-primary',
              isSelected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : hasHighlight
                  ? 'border-primary/50'
                  : 'border-border/50'
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
                    {isMultiple ? (
                      isSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5 text-muted-foreground" />
                      )
                    ) : isSelected ? (
                      <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      </div>
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
          </button>
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
  const { items, selectionType, layout = 'vertical', showImages } = config;
  const isMultiple = selectionType === 'multiple';
  const isImageOnTop = layout === 'horizontal' || layout === 'grid';

  if (!items || items.length === 0) return null;

  // Determine grid classes based on layout and item count
  const getGridClasses = () => {
    if (layout === 'vertical') {
      return 'flex flex-col gap-2';
    }
    if (layout === 'horizontal') {
      const itemCount = items.length;
      if (itemCount === 2) return 'grid grid-cols-2 gap-3';
      if (itemCount === 3) return 'grid grid-cols-2 sm:grid-cols-3 gap-3';
      return 'grid grid-cols-2 gap-3';
    }
    if (layout === 'grid') {
      const itemCount = items.length;
      if (itemCount <= 4) return 'grid grid-cols-2 gap-3';
      return 'grid grid-cols-2 sm:grid-cols-3 gap-3';
    }
    return 'flex flex-col gap-2';
  };

  return (
    <div className={getGridClasses()}>
      {items.map((item) => {
        const isSelected = selectedIds.includes(item.id);
        const hasImage = showImages && item.imageUrl;

        // Card layout for horizontal/grid with image on top
        if (isImageOnTop && hasImage) {
          return (
            <button
              key={item.id}
              onClick={() => onSelect?.(item.id)}
              className={cn(
                'flex flex-col rounded-xl overflow-hidden border-2 text-left transition-all',
                'hover:border-primary hover:ring-1 hover:ring-primary',
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card'
              )}
            >
              {/* Image on top */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                <img
                  src={item.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Content below */}
              <div className="flex items-center gap-3 p-4">
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
        }

        // Default vertical layout (or horizontal/grid without image)
        return (
          <button
            key={item.id}
            onClick={() => onSelect?.(item.id)}
            className={cn(
              'w-full p-4 rounded-xl border-2 text-left transition-all',
              'hover:border-primary hover:bg-[var(--quiz-card-hover,hsl(var(--muted)))] hover:ring-1 hover:ring-primary',
              isSelected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
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
              {/* Inline image for vertical layout - positioned after checkbox */}
              {hasImage && !isImageOnTop && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {item.emoji && <span className="text-xl">{item.emoji}</span>}
              <span className="font-medium">{item.text}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Validation helpers - exported for use in blocks-quiz-player
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateField(type: string, value: string, required: boolean = false): string | null {
  // Check required first
  if (required && !value.trim()) {
    return 'required';
  }

  // Skip format validation if empty and not required
  if (!value.trim()) return null;

  // Type-specific validation
  if (type === 'email' && !EMAIL_REGEX.test(value)) {
    return 'invalid_email';
  }

  // Use library's international phone validation
  if (type === 'phone' && !isValidPhoneNumber(value)) {
    return 'invalid_phone';
  }

  return null;
}

const FIELD_ERROR_MESSAGES: Record<string, Record<string, string>> = {
  required: {
    'pt-BR': 'Este campo é obrigatório',
    'en': 'This field is required',
    'es': 'Este campo es obligatorio',
  },
  invalid_email: {
    'pt-BR': 'Digite um e-mail válido',
    'en': 'Enter a valid email',
    'es': 'Ingrese un correo electrónico válido',
  },
  invalid_phone: {
    'pt-BR': 'Digite um número de telefone válido',
    'en': 'Enter a valid phone number',
    'es': 'Ingrese un número de teléfono válido',
  },
};

function getErrorMessage(errorKey: string): string {
  // Try to detect locale from navigator, fallback to pt-BR
  const locale = typeof navigator !== 'undefined'
    ? (navigator.language.startsWith('en') ? 'en' : navigator.language.startsWith('es') ? 'es' : 'pt-BR')
    : 'pt-BR';
  return FIELD_ERROR_MESSAGES[errorKey]?.[locale] || FIELD_ERROR_MESSAGES[errorKey]?.['pt-BR'] || '';
}


function LoadingBlock({ config, onComplete }: { config: LoadingConfig; onComplete?: () => void }) {
  const { text, style, duration = 3 } = config;
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const hasCalledComplete = useRef(false);
  const startTimeRef = useRef<number>(Date.now());

  // Animation duration in milliseconds
  const durationMs = duration * 1000;
  // Extra delay after completion before advancing (to show the checkmark)
  const completionDelay = 600;
  // Update interval for smoother animation
  const updateInterval = 50;

  useEffect(() => {
    // Reset start time when component mounts
    startTimeRef.current = Date.now();

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / durationMs) * 100, 100);

      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(intervalId);
        setIsComplete(true);

        // Auto-advance after showing the checkmark
        if (onComplete && !hasCalledComplete.current) {
          hasCalledComplete.current = true;
          setTimeout(() => {
            onComplete();
          }, completionDelay);
        }
      }
    }, updateInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [durationMs, onComplete]);

  // Circle progress calculations
  const circumference = 2 * Math.PI * 20; // r=20
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      {/* Loading indicator */}
      {style === 'bar' ? (
        <div className="w-full max-w-xs">
          {isComplete ? (
            // Completion state - green checkmark
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center animate-in zoom-in-50 duration-300">
                <Check className="w-6 h-6 text-white" strokeWidth={3} />
              </div>
            </div>
          ) : (
            // Progress bar
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-100 ease-linear"
                style={{
                  width: `${Math.max(progress, 2)}%`,
                  backgroundColor: 'hsl(var(--primary))',
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-16 h-16">
          {isComplete ? (
            // Completion state - green checkmark
            <div className="w-full h-full rounded-full bg-green-500 flex items-center justify-center animate-in zoom-in-50 duration-300">
              <Check className="w-8 h-8 text-white" strokeWidth={3} />
            </div>
          ) : (
            // Circle progress
            <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="4"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 100ms linear' }}
              />
            </svg>
          )}
        </div>
      )}

      {/* Text - changes when complete */}
      {text && (
        <p className={cn(
          "text-base font-medium text-center transition-colors duration-300",
          isComplete ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
        )}>
          {text}
        </p>
      )}
    </div>
  );
}

function FieldsBlock({
  config,
  values,
  onChange,
  showAllErrors = false,
}: {
  config: FieldsConfig;
  values: Record<string, string>;
  onChange?: (fieldId: string, value: string) => void;
  showAllErrors?: boolean;
}) {
  const { items } = config;
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Get app locale for phone input default country
  let locale: Locale = 'pt-BR';
  try {
    locale = useLocale();
  } catch {
    // Fallback if not in LocaleProvider context (e.g., theme preview)
  }
  const defaultCountry = getDefaultCountryFromLocale(locale);
  const defaultPlaceholders: Record<FieldType, string> =
    getMessages(locale).visualBuilder.fieldsEditor.placeholders;

  if (!items || items.length === 0) return null;

  const handleBlur = (fieldId: string) => {
    setTouched((prev) => ({ ...prev, [fieldId]: true }));
  };

  const handleChange = (fieldId: string, value: string) => {
    onChange?.(fieldId, value);
  };

  return (
    <div className="space-y-4">
      {items.map((field) => {
        const value = values[field.id] || '';
        const shouldShowError = touched[field.id] || showAllErrors;
        const error = shouldShowError ? validateField(field.type, value, field.required) : null;
        const hasError = !!error;
        const placeholder = field.placeholder?.trim() ? field.placeholder : defaultPlaceholders[field.type];

        return (
          <div key={field.id} className="space-y-1.5">
            <label htmlFor={field.id} className="text-sm font-medium text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                id={field.id}
                value={value}
                onChange={(e) => handleChange(field.id, e.target.value)}
                onBlur={() => handleBlur(field.id)}
                placeholder={placeholder}
                className={cn(
                  'w-full px-4 py-3 rounded-lg border transition-colors',
                  'bg-[var(--quiz-input-bg,hsl(var(--input)))]',
                  'text-[var(--quiz-input-foreground,hsl(var(--foreground)))]',
                  'placeholder:text-[var(--quiz-input-placeholder,hsl(var(--muted-foreground)))]',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                  'min-h-[100px] resize-y',
                  hasError
                    ? 'border-destructive focus:ring-destructive/50'
                    : 'border-[var(--quiz-input-border,hsl(var(--border)))]'
                )}
              />
            ) : field.type === 'phone' ? (
              <PhoneInput
                id={field.id}
                value={value}
                onChange={(val) => handleChange(field.id, val)}
                onBlur={() => handleBlur(field.id)}
                placeholder={placeholder}
                defaultCountry={defaultCountry}
                hasError={hasError}
              />
            ) : (
              <input
                id={field.id}
                type={field.type === 'email' ? 'email' : 'text'}
                inputMode={field.type === 'email' ? 'email' : 'text'}
                value={value}
                onChange={(e) => handleChange(field.id, e.target.value)}
                onBlur={() => handleBlur(field.id)}
                placeholder={placeholder}
                className={cn(
                  'w-full px-4 py-3 rounded-lg border transition-colors',
                  'bg-[var(--quiz-input-bg,hsl(var(--input)))]',
                  'text-[var(--quiz-input-foreground,hsl(var(--foreground)))]',
                  'placeholder:text-[var(--quiz-input-placeholder,hsl(var(--muted-foreground)))]',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                  hasError
                    ? 'border-destructive focus:ring-destructive/50'
                    : 'border-[var(--quiz-input-border,hsl(var(--border)))]'
                )}
              />
            )}
            {hasError && (
              <p className="text-xs text-destructive mt-1">
                {getErrorMessage(error)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
