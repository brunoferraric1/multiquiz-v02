'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SectionTitle } from '@/components/ui/section-title'
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMessages } from '@/lib/i18n/context'

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
  const messages = useMessages()
  const controls = messages.visualBuilder.blockControls
  const deleteAria = controls.deleteBlockAria.replace('{{name}}', blockTypeName)

  return (
    <div className="space-y-4" data-testid="block-controls">
      {/* Reorder controls */}
      <div>
        <SectionTitle>{controls.reorder}</SectionTitle>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="flex-1"
            aria-label={controls.moveUp}
            data-testid="move-up-button"
          >
            <ChevronUp className="w-4 h-4 mr-1" />
            {controls.moveUp}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="flex-1"
            aria-label={controls.moveDown}
            data-testid="move-down-button"
          >
            <ChevronDown className="w-4 h-4 mr-1" />
            {controls.moveDown}
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
          aria-label={deleteAria}
          data-testid="delete-block-button"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {controls.deleteBlock}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          {controls.deleteHint}
        </p>
      </div>
    </div>
  )
}
