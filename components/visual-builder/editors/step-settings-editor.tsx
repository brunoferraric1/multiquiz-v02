'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { StepSettings } from '@/types/blocks'
import { BarChart2, ArrowLeft } from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'

interface StepSettingsEditorProps {
  settings: StepSettings
  onChange: (settings: Partial<StepSettings>) => void
  isIntroStep?: boolean
  isResultStep?: boolean
}

export function StepSettingsEditor({
  settings,
  onChange,
  isIntroStep = false,
  isResultStep = false,
}: StepSettingsEditorProps) {
  const messages = useMessages()
  const settingsCopy = messages.visualBuilder.stepSettings
  return (
    <div className="space-y-4" data-testid="step-settings-editor">
      <div className="text-sm text-muted-foreground">
        {settingsCopy.description}
      </div>

      <Separator />

      {/* Show progress bar */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <Label htmlFor="show-progress">{settingsCopy.progressLabel}</Label>
            <p className="text-xs text-muted-foreground">
              {isIntroStep
                ? settingsCopy.progressHintIntro
                : settingsCopy.progressHint}
            </p>
          </div>
        </div>
        <Switch
          id="show-progress"
          checked={settings.showProgress || false}
          onCheckedChange={(checked) => onChange({ showProgress: checked })}
          data-testid="show-progress-toggle"
        />
      </div>

      {/* Allow back button - not shown on intro step */}
      {!isIntroStep && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="allow-back">{settingsCopy.backLabel}</Label>
              <p className="text-xs text-muted-foreground">
                {settingsCopy.backHint}
              </p>
            </div>
          </div>
          <Switch
            id="allow-back"
            checked={settings.allowBack || false}
            onCheckedChange={(checked) => onChange({ allowBack: checked })}
            data-testid="allow-back-toggle"
          />
        </div>
      )}

      {isIntroStep && (
        <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
          {settingsCopy.introHint}
        </p>
      )}

      {isResultStep && (
        <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
          {settingsCopy.resultHint}
        </p>
      )}
    </div>
  )
}
