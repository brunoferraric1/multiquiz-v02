'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Palette } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSubscription, isPro } from '@/lib/services/subscription-service';
import { useMessages, useLocale } from '@/lib/i18n/context';
import { localizePathname } from '@/lib/i18n/paths';
import {
  getThemeSettings,
  saveThemeSettings,
} from '@/lib/services/brand-kit-service';
import { uploadImage, getBrandKitLogoPath } from '@/lib/services/storage-service';
import { PRESET_THEMES, DEFAULT_THEME_ID } from '@/lib/themes/preset-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { ThemeCard } from '@/components/dashboard/settings/theme-card';
import { CustomThemeEditor } from '@/components/dashboard/settings/custom-theme-editor';
import { ThemePreview } from '@/components/dashboard/settings/theme-preview';
import { toast } from 'sonner';
import type { PresetThemeId, UserThemeSettings, BrandKitColors } from '@/types';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription(user?.uid);
  const messages = useMessages();
  const locale = useLocale();
  const router = useRouter();
  const copy = messages.settings;

  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Theme settings state
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [presetId, setPresetId] = useState<PresetThemeId>(DEFAULT_THEME_ID);
  const [customColors, setCustomColors] = useState<BrandKitColors>(
    PRESET_THEMES[DEFAULT_THEME_ID].colors
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Derived state
  const isSubscriptionReady = !authLoading && !subscriptionLoading;
  const isProUser = isPro(subscription);

  // Get effective colors for preview
  const effectiveColors =
    mode === 'preset' ? PRESET_THEMES[presetId].colors : customColors;

  // Load existing settings
  useEffect(() => {
    if (!user?.uid) return;

    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const settings = await getThemeSettings(user.uid);

        if (settings) {
          setMode(settings.mode);
          if (settings.mode === 'preset' && settings.presetId) {
            setPresetId(settings.presetId);
          }
          if (settings.mode === 'custom' && settings.customBrandKit) {
            setCustomColors(settings.customBrandKit.colors);
            setLogoUrl(settings.customBrandKit.logoUrl ?? null);
          }
        }
      } catch (err) {
        console.error('Error loading theme settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user?.uid]);

  // Handle preset theme selection
  const handlePresetSelect = (id: PresetThemeId) => {
    setMode('preset');
    setPresetId(id);
  };

  // Handle custom theme selection
  const handleCustomSelect = () => {
    if (!isProUser) {
      // Redirect to pricing
      router.push(localizePathname('/pricing?period=monthly', locale));
      return;
    }
    setMode('custom');
  };

  // Handle logo upload
  const handleLogoUpload = useCallback(
    async (file: File) => {
      if (!user?.uid) return;

      // Validate file size
      if (file.size > 2 * 1024 * 1024) {
        toast.error(copy.toast.uploadTooLarge);
        return;
      }

      try {
        setIsUploadingLogo(true);
        const path = getBrandKitLogoPath(user.uid);
        const blob = new Blob([await file.arrayBuffer()], { type: file.type });
        const url = await uploadImage(path, blob);
        setLogoUrl(url);
      } catch (err) {
        console.error('Error uploading logo:', err);
        toast.error(copy.toast.uploadError);
      } finally {
        setIsUploadingLogo(false);
      }
    },
    [user?.uid, copy.toast.uploadError, copy.toast.uploadTooLarge]
  );

  // Handle logo removal
  const handleLogoRemove = () => {
    setLogoUrl(null);
  };

  // Handle save
  const handleSave = async () => {
    if (!user?.uid) return;

    try {
      setIsSaving(true);

      const settings: UserThemeSettings = {
        mode,
        presetId: mode === 'preset' ? presetId : undefined,
        customBrandKit:
          mode === 'custom'
            ? {
                colors: customColors,
                logoUrl: logoUrl,
              }
            : undefined,
      };

      await saveThemeSettings(user.uid, settings);
      toast.success(copy.toast.saveSuccess);
    } catch (err) {
      console.error('Error saving theme settings:', err);
      toast.error(copy.toast.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading || !isSubscriptionReady) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{copy.page.title}</h1>
        <p className="text-muted-foreground mt-2">{copy.page.subtitle}</p>
      </div>

      {/* Main content grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left column - Theme selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              {copy.themes.title}
            </CardTitle>
            <CardDescription>
              {copy.page.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preset themes */}
            <div className="space-y-3">
              <ThemeCard
                name={copy.themes.presets.dark}
                colors={PRESET_THEMES['multiquiz-dark'].colors}
                isSelected={mode === 'preset' && presetId === 'multiquiz-dark'}
                onClick={() => handlePresetSelect('multiquiz-dark')}
              />
              <ThemeCard
                name={copy.themes.presets.light}
                colors={PRESET_THEMES['multiquiz-light'].colors}
                isSelected={mode === 'preset' && presetId === 'multiquiz-light'}
                onClick={() => handlePresetSelect('multiquiz-light')}
              />
              <ThemeCard
                name={copy.themes.custom.label}
                colors={customColors}
                isSelected={mode === 'custom'}
                isLocked={!isProUser}
                proBadge={copy.themes.custom.proBadge}
                onClick={handleCustomSelect}
              />
            </div>

            {/* Custom theme editor (only when custom is selected and user is Pro) */}
            {mode === 'custom' && isProUser && (
              <CustomThemeEditor
                colors={customColors}
                logoUrl={logoUrl}
                onColorsChange={setCustomColors}
                onLogoChange={handleLogoUpload}
                onLogoRemove={handleLogoRemove}
                isUploadingLogo={isUploadingLogo}
                copy={{
                  colorsTitle: copy.colors.title,
                  primaryLabel: copy.colors.primary,
                  primaryHint: copy.colors.primaryHint,
                  secondaryLabel: copy.colors.secondary,
                  secondaryHint: copy.colors.secondaryHint,
                  accentLabel: copy.colors.accent,
                  accentHint: copy.colors.accentHint,
                  logoTitle: copy.logo.title,
                  logoUpload: copy.logo.upload,
                  logoUploadHint: copy.logo.uploadHint,
                  logoRemove: copy.logo.remove,
                }}
              />
            )}

            {/* Upgrade CTA for free users clicking custom */}
            {!isProUser && mode !== 'custom' && (
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-sm font-medium">{copy.themes.custom.upgradeTitle}</p>
                <p className="text-sm text-muted-foreground">
                  {copy.themes.custom.upgradeDescription}
                </p>
              </div>
            )}

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {copy.actions.saving}
                </>
              ) : (
                copy.actions.save
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right column - Preview */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>{copy.preview.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ThemePreview
              colors={effectiveColors}
              logoUrl={mode === 'custom' ? logoUrl : null}
              copy={{
                title: copy.preview.title,
                questionLabel: copy.preview.questionLabel,
                option1: copy.preview.option1,
                option2: copy.preview.option2,
                buttonText: copy.preview.buttonText,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
