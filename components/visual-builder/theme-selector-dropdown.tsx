'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Palette, Check, Lock, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSubscription, isPro } from '@/lib/services/subscription-service'
import { useMessages, useLocale } from '@/lib/i18n/context'
import { localizePathname } from '@/lib/i18n/paths'
import {
  getThemeSettings,
  saveThemeSettings,
} from '@/lib/services/brand-kit-service'
import { PRESET_THEMES, DEFAULT_THEME_ID } from '@/lib/themes/preset-themes'
import { Button } from '@/components/ui/button'
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
 * ThemeSelectorDropdown - Compact theme selector for the visual builder header
 * Allows quick theme switching and links to full theme customization
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
    PRESET_THEMES[DEFAULT_THEME_ID].colors
  )

  const isProUser = isPro(subscription)

  // Get effective colors
  const effectiveColors =
    mode === 'preset' ? PRESET_THEMES[presetId].colors : customColors

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
    // If user is Pro, just navigate to settings (handled by link)
  }

  // Theme options
  const presetOptions: { id: PresetThemeId; label: string; colors: BrandKitColors }[] = [
    { id: 'multiquiz-dark', label: copy.themes.presets.dark, colors: PRESET_THEMES['multiquiz-dark'].colors },
    { id: 'multiquiz-light', label: copy.themes.presets.light, colors: PRESET_THEMES['multiquiz-light'].colors },
  ]

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            aria-label={copy.themeSelector.title}
          >
            <Palette className="h-4 w-4" />
            <span className="hidden lg:inline">{copy.themeSelector.title}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="end">
          {/* Header */}
          <div className="px-3 py-2 border-b">
            <p className="text-sm font-medium">{copy.themeSelector.title}</p>
          </div>

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
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  {/* Radio indicator */}
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                      isSelected ? 'border-primary' : 'border-muted-foreground/50'
                    )}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>

                  {/* Label */}
                  <span className="flex-1 text-left">{option.label}</span>

                  {/* Color dots */}
                  <div className="flex gap-1">
                    <div
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: option.colors.primary }}
                    />
                    <div
                      className="w-3 h-3 rounded-full border border-black/10"
                      style={{ backgroundColor: option.colors.secondary }}
                    />
                    <div
                      className="w-3 h-3 rounded-full border border-black/10"
                      style={{ backgroundColor: option.colors.accent }}
                    />
                  </div>
                </button>
              )
            })}

            {/* Custom theme option */}
            <button
              onClick={handleCustomSelect}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                mode === 'custom'
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-foreground',
                !isProUser && 'opacity-60'
              )}
            >
              {/* Radio indicator */}
              <div
                className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                  mode === 'custom' ? 'border-primary' : 'border-muted-foreground/50'
                )}
              >
                {mode === 'custom' && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>

              {/* Label */}
              <span className="flex-1 text-left">{copy.themes.custom.label}</span>

              {/* Pro badge or color dots */}
              {!isProUser ? (
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  {copy.themes.custom.proBadge}
                </span>
              ) : (
                <div className="flex gap-1">
                  <div
                    className="w-3 h-3 rounded-full border border-white/20"
                    style={{ backgroundColor: customColors.primary }}
                  />
                  <div
                    className="w-3 h-3 rounded-full border border-black/10"
                    style={{ backgroundColor: customColors.secondary }}
                  />
                  <div
                    className="w-3 h-3 rounded-full border border-black/10"
                    style={{ backgroundColor: customColors.accent }}
                  />
                </div>
              )}
            </button>
          </div>

          {/* Customize link */}
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
