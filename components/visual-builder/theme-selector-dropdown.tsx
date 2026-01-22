'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, Check, Lock, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSubscription, isPro } from '@/lib/services/subscription-service'
import { useMessages, useLocale } from '@/lib/i18n/context'
import { localizePathname } from '@/lib/i18n/paths'
import {
  getThemeSettings,
  saveThemeSettings,
} from '@/lib/services/brand-kit-service'
import { PRESET_THEMES, DEFAULT_THEME_ID, DEFAULT_CUSTOM_COLORS } from '@/lib/themes/preset-themes'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { UpgradeModal } from '@/components/upgrade-modal'
import { cn } from '@/lib/utils'
import type { PresetThemeId, UserThemeSettings, BrandKitColors } from '@/types'

interface ThemeSelectorDropdownProps {
  onThemeChange?: (colors: BrandKitColors) => void
}

/**
 * ThemeSelectorDropdown - Compact theme selector for the preview toolbar
 * Shows stacked color dots + theme name, with dropdown for selection
 */
export function ThemeSelectorDropdown({ onThemeChange }: ThemeSelectorDropdownProps) {
  const { user } = useAuth()
  const { subscription } = useSubscription(user?.uid)
  const messages = useMessages()
  const locale = useLocale()
  const copy = messages.settings

  // Local state
  const [isOpen, setIsOpen] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Theme settings state
  const [mode, setMode] = useState<'preset' | 'custom'>('preset')
  const [presetId, setPresetId] = useState<PresetThemeId>(DEFAULT_THEME_ID)
  const [customColors, setCustomColors] = useState<BrandKitColors>(
    DEFAULT_CUSTOM_COLORS
  )
  const [customName, setCustomName] = useState<string | null>(null)

  const isProUser = isPro(subscription)

  // Get effective colors and name
  const effectiveColors =
    mode === 'preset' ? PRESET_THEMES[presetId].colors : customColors

  const currentThemeName = mode === 'custom'
    ? (customName || copy.themes.custom.label)
    : presetId === 'multiquiz-dark'
      ? 'Dark'
      : 'Light'

  // Notify parent of theme changes
  useEffect(() => {
    onThemeChange?.(effectiveColors)
  }, [effectiveColors, onThemeChange])

  // Load existing settings
  useEffect(() => {
    if (!user?.uid) return

    const loadSettings = async () => {
      try {
        const settings = await getThemeSettings(user.uid)

        if (settings) {
          setMode(settings.mode)
          if (settings.mode === 'preset' && settings.presetId) {
            setPresetId(settings.presetId)
          }
          if (settings.mode === 'custom' && settings.customBrandKit) {
            setCustomColors(settings.customBrandKit.colors)
            // TODO: Load custom name when we add that feature
          }
        }
      } catch (err) {
        console.error('Error loading theme settings:', err)
      }
    }

    loadSettings()
  }, [user?.uid])

  // Handle preset theme selection
  const handlePresetSelect = async (id: PresetThemeId) => {
    if (!user?.uid) return

    setMode('preset')
    setPresetId(id)
    setIsOpen(false)

    // Auto-save
    try {
      const settings: UserThemeSettings = {
        mode: 'preset',
        presetId: id,
      }
      await saveThemeSettings(user.uid, settings)
    } catch (err) {
      console.error('Error saving theme:', err)
    }
  }

  // Handle custom theme selection
  const handleCustomSelect = () => {
    if (!isProUser) {
      setIsOpen(false)
      setShowUpgradeModal(true)
      return
    }
    // If user is Pro and has custom theme, select it
    setMode('custom')
    setIsOpen(false)
  }

  // Theme options
  const presetOptions: { id: PresetThemeId; label: string; colors: BrandKitColors }[] = [
    { id: 'multiquiz-dark', label: 'Dark', colors: PRESET_THEMES['multiquiz-dark'].colors },
    { id: 'multiquiz-light', label: 'Light', colors: PRESET_THEMES['multiquiz-light'].colors },
  ]

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-2 bg-card rounded-lg shadow-md py-1.5 px-3 hover:bg-muted/50 transition-colors"
            aria-label={copy.themeSelector.title}
          >
            {/* Stacked color dots */}
            <div className="flex items-center -space-x-1.5">
              <div
                className="w-4 h-4 rounded-full border-2 border-card z-[3]"
                style={{ backgroundColor: effectiveColors.primary }}
              />
              <div
                className="w-4 h-4 rounded-full border-2 border-card z-[2]"
                style={{ backgroundColor: effectiveColors.secondary }}
              />
              <div
                className="w-4 h-4 rounded-full border-2 border-card z-[1]"
                style={{ backgroundColor: effectiveColors.accent }}
              />
            </div>

            {/* Theme name */}
            <span className="text-xs font-medium text-foreground">
              {currentThemeName}
            </span>

            {/* Chevron */}
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="center">
          {/* Theme options */}
          <div className="p-1">
            {/* Preset themes */}
            {presetOptions.map((option) => {
              const isSelected = mode === 'preset' && presetId === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => handlePresetSelect(option.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    isSelected
                      ? 'bg-primary/10'
                      : 'hover:bg-muted'
                  )}
                >
                  {/* Stacked color dots */}
                  <div className="flex items-center -space-x-1">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-background z-[3]"
                      style={{ backgroundColor: option.colors.primary }}
                    />
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-background z-[2]"
                      style={{ backgroundColor: option.colors.secondary }}
                    />
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-background z-[1]"
                      style={{ backgroundColor: option.colors.accent }}
                    />
                  </div>

                  {/* Label */}
                  <span className="flex-1 text-left text-foreground">{option.label}</span>

                  {/* Check mark */}
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              )
            })}

            {/* Custom theme option */}
            <button
              onClick={handleCustomSelect}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                mode === 'custom'
                  ? 'bg-primary/10'
                  : 'hover:bg-muted'
              )}
            >
              {/* Stacked color dots */}
              <div className="flex items-center -space-x-1">
                <div
                  className={cn(
                    "w-3.5 h-3.5 rounded-full border border-background z-[3]",
                    !isProUser && "opacity-50"
                  )}
                  style={{ backgroundColor: customColors.primary }}
                />
                <div
                  className={cn(
                    "w-3.5 h-3.5 rounded-full border border-background z-[2]",
                    !isProUser && "opacity-50"
                  )}
                  style={{ backgroundColor: customColors.secondary }}
                />
                <div
                  className={cn(
                    "w-3.5 h-3.5 rounded-full border border-background z-[1]",
                    !isProUser && "opacity-50"
                  )}
                  style={{ backgroundColor: customColors.accent }}
                />
              </div>

              {/* Label + Pro badge */}
              <span className={cn(
                "flex-1 text-left",
                !isProUser ? "text-muted-foreground" : "text-foreground"
              )}>
                {copy.themes.custom.label}
              </span>

              {/* Pro badge or check mark */}
              {!isProUser ? (
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  <Lock className="w-3 h-3" />
                  {copy.themes.custom.proBadge}
                </span>
              ) : mode === 'custom' ? (
                <Check className="w-4 h-4 text-primary" />
              ) : null}
            </button>
          </div>

          {/* Customize link - only for Pro users */}
          {isProUser && (
            <div className="border-t p-1">
              <Link
                href={localizePathname('/dashboard/settings/themes', locale)}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <span>{copy.themeSelector.customize}</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        reason="brand-kit"
        onOpenChange={setShowUpgradeModal}
      />
    </>
  )
}
