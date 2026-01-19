'use client'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BlockControlsProps {
  enabled: boolean
  onToggle: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  blockTypeName: string
}

export function BlockControls({
  enabled,
  onToggle,
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp,
  canMoveDown,
  blockTypeName,
}: BlockControlsProps) {
  return (
    <div className="space-y-4" data-testid="block-controls">
      {/* Enable/Disable toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="block-enabled">Bloco ativo</Label>
          <p className="text-xs text-muted-foreground">
            {enabled ? 'Visível no quiz' : 'Oculto no quiz'}
          </p>
        </div>
        <Switch
          id="block-enabled"
          checked={enabled}
          onCheckedChange={onToggle}
          data-testid="block-enabled-toggle"
        />
      </div>

      <Separator />

      {/* Reorder controls */}
      <div className="space-y-2">
        <Label>Reordenar</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="flex-1"
            aria-label="Mover bloco para cima"
            data-testid="move-up-button"
          >
            <ChevronUp className="w-4 h-4 mr-1" />
            Subir
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="flex-1"
            aria-label="Mover bloco para baixo"
            data-testid="move-down-button"
          >
            <ChevronDown className="w-4 h-4 mr-1" />
            Descer
          </Button>
        </div>
      </div>

      <Separator />

      {/* Delete button */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDelete}
          className={cn(
            'w-full text-destructive border-destructive/50',
            'hover:bg-destructive hover:text-destructive-foreground'
          )}
          aria-label={`Excluir bloco ${blockTypeName}`}
          data-testid="delete-block-button"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Excluir bloco
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Esta ação não pode ser desfeita
        </p>
      </div>
    </div>
  )
}
