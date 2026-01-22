'use client';

import { Label } from '@/components/ui/label';

interface ColorPickerFieldProps {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Compact color picker with swatch, hex input, and label
 * Designed for use in a horizontal grid layout
 */
export function ColorPickerField({
  id,
  label,
  hint,
  value,
  onChange,
}: ColorPickerFieldProps) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Label */}
      <Label htmlFor={id} className="text-sm font-medium mb-2">
        {label}
      </Label>

      {/* Color swatch - larger and clickable */}
      <div className="relative mb-2">
        <input
          type="color"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-14 h-14 rounded-xl border-2 border-input cursor-pointer appearance-none bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0 hover:border-primary/50 transition-colors"
        />
      </div>

      {/* Hex input */}
      <input
        type="text"
        value={value.toUpperCase()}
        onChange={(e) => {
          const val = e.target.value;
          if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
            onChange(val);
          }
        }}
        className="w-20 text-center font-mono text-xs bg-muted/50 border border-input rounded-md px-2 py-1 uppercase focus:outline-none focus:ring-1 focus:ring-primary"
        maxLength={7}
      />

      {/* Hint */}
      {hint && (
        <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>
      )}
    </div>
  );
}
