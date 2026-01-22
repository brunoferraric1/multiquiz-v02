'use client'

import { Palette, Link2 } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useMessages, useLocale } from '@/lib/i18n/context'
import { localizePathname } from '@/lib/i18n/paths'
import { Loader2 } from 'lucide-react'
import { SettingsSectionCard } from '@/components/dashboard/settings/settings-section-card'

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const messages = useMessages()
  const locale = useLocale()
  const copy = messages.settings

  // Loading state
  if (authLoading || !user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{copy.page.title}</h1>
        <p className="text-muted-foreground mt-2">{copy.page.subtitle}</p>
      </div>

      {/* Settings sections */}
      <div className="space-y-4">
        {/* Themes section */}
        <SettingsSectionCard
          icon={<Palette className="h-5 w-5" />}
          title={copy.sections.themes.title}
          description={copy.sections.themes.description}
          href={localizePathname('/dashboard/settings/themes', locale)}
        />

        {/* Custom URL section (coming soon) */}
        <SettingsSectionCard
          icon={<Link2 className="h-5 w-5" />}
          title={copy.sections.customUrl.title}
          description={copy.sections.customUrl.description}
          href="/dashboard/settings/custom-url"
          disabled
          badge={copy.sections.customUrl.badge}
        />
      </div>
    </div>
  )
}
