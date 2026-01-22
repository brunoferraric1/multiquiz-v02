'use client';

import { useRef, useState } from 'react';
import { SectionTitle } from '@/components/ui/section-title';
import { ColorPickerField } from './color-picker-field';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrandKitColors, LogoSize } from '@/types';

interface CustomThemeEditorProps {
  colors: BrandKitColors;
  logoUrl: string | null;
  logoSize?: LogoSize;
  onColorsChange: (colors: BrandKitColors) => void;
  onLogoChange: (file: File) => Promise<void>;
  onLogoRemove: () => void;
  onLogoSizeChange?: (size: LogoSize) => void;
  isUploadingLogo?: boolean;
  copy: {
    colorsTitle: string;
    primaryLabel: string;
    primaryHint: string;
    secondaryLabel: string;
    secondaryHint: string;
    accentLabel: string;
    accentHint: string;
    logoTitle: string;
    logoUpload: string;
    logoUploadHint: string;
    logoRemove: string;
    logoSizeLabel: string;
    logoSizeSmall: string;
    logoSizeMedium: string;
    logoSizeLarge: string;
  };
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Editor for custom theme colors and logo upload
 */
const LOGO_SIZES: LogoSize[] = ['small', 'medium', 'large'];

export function CustomThemeEditor({
  colors,
  logoUrl,
  logoSize = 'medium',
  onColorsChange,
  onLogoChange,
  onLogoRemove,
  onLogoSizeChange,
  isUploadingLogo = false,
  copy,
}: CustomThemeEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const sizeLabels: Record<LogoSize, string> = {
    small: copy.logoSizeSmall,
    medium: copy.logoSizeMedium,
    large: copy.logoSizeLarge,
  };

  const handleColorChange = (key: keyof BrandKitColors, value: string) => {
    onColorsChange({
      ...colors,
      [key]: value,
    });
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      return;
    }
    await onLogoChange(file);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  return (
    <div className="space-y-6">
      {/* Colors section - 3-column grid */}
      <div className="space-y-4">
        <SectionTitle>{copy.colorsTitle}</SectionTitle>
        <div className="grid grid-cols-3 gap-4">
          <ColorPickerField
            id="primary-color"
            label={copy.primaryLabel}
            hint={copy.primaryHint}
            value={colors.primary}
            onChange={(value) => handleColorChange('primary', value)}
          />
          <ColorPickerField
            id="secondary-color"
            label={copy.secondaryLabel}
            hint={copy.secondaryHint}
            value={colors.secondary}
            onChange={(value) => handleColorChange('secondary', value)}
          />
          <ColorPickerField
            id="accent-color"
            label={copy.accentLabel}
            hint={copy.accentHint}
            value={colors.accent}
            onChange={(value) => handleColorChange('accent', value)}
          />
        </div>
      </div>

      {/* Logo section */}
      <div className="space-y-3">
        <SectionTitle>{copy.logoTitle}</SectionTitle>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.svg"
          onChange={handleInputChange}
          className="hidden"
        />

        {logoUrl ? (
          <div className="space-y-4">
            {/* Logo preview */}
            <div className="relative w-fit">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-16 w-auto max-w-[200px] object-contain rounded-lg border"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={onLogoRemove}
                disabled={isUploadingLogo}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            {/* Logo size selector */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">{copy.logoSizeLabel}</span>
              <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
                {LOGO_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onLogoSizeChange?.(size)}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                      logoSize === size
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {sizeLabels[size]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            disabled={isUploadingLogo}
            className={`
              w-full p-4 border-2 border-dashed rounded-lg transition-colors
              flex flex-col items-center gap-2 text-muted-foreground
              ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              ${isUploadingLogo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {isUploadingLogo ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
            <span className="text-sm font-medium">{copy.logoUpload}</span>
            <span className="text-xs">{copy.logoUploadHint}</span>
          </button>
        )}
      </div>
    </div>
  );
}
