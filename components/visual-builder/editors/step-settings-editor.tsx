'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { StepSettings } from '@/types/blocks'
import { BarChart2, ArrowLeft } from 'lucide-react'

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
  return (
    <div className="space-y-4" data-testid="step-settings-editor">
      <div className="text-sm text-muted-foreground">
        Configure as opções de navegação desta etapa.
      </div>

      <Separator />

      {/* Show progress bar */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <Label htmlFor="show-progress">Barra de progresso</Label>
            <p className="text-xs text-muted-foreground">
              {isIntroStep
                ? 'Exibe uma barra de progresso no topo'
                : 'Exibe o progresso do quiz'}
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
              <Label htmlFor="allow-back">Botão voltar</Label>
              <p className="text-xs text-muted-foreground">
                Permite que o usuário volte para a etapa anterior
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
          A etapa de introdução é a primeira do quiz e não possui botão de voltar.
        </p>
      )}

      {isResultStep && (
        <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
          A tela de resultados é a etapa final do quiz. Configure cada resultado separadamente.
        </p>
      )}
    </div>
  )
}
