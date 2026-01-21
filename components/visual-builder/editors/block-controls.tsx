'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BlockControlsProps {
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  blockTypeName: string
}

export function BlockControls({
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp,
  canMoveDown,
  blockTypeName,
}: BlockControlsProps) {
  return (
    <div className="space-y-4" data-testid="block-controls">
      {/* Reorder controls */}
      <div>
        <div className="mb-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Reordenar
          </span>
        </div>
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
