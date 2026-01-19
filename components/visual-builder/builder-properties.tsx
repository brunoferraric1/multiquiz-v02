'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BuilderPropertiesProps {
  title?: string
  showBack?: boolean
  onBack?: () => void
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

export function BuilderProperties({
  title = 'Propriedades',
  showBack = false,
  onBack,
  actions,
  children,
  className,
}: BuilderPropertiesProps) {
  return (
    <aside
      data-testid="right-panel"
      className={cn(
        'w-80 bg-card border-l flex flex-col overflow-hidden shrink-0',
        className
      )}
    >
      {/* Header */}
      <div
        data-testid="properties-header"
        className="px-4 py-3 border-b flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {showBack && (
            <button
              onClick={onBack}
              aria-label="Voltar"
              className="shrink-0 -ml-1 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h3 className="font-semibold text-foreground truncate text-sm">{title}</h3>
        </div>
        {actions && (
          <div className="flex items-center gap-1 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        data-testid="properties-content"
        className="flex-1 overflow-y-auto p-4"
      >
        {children || (
          <div className="text-sm text-muted-foreground">
            Selecione um bloco para editar suas propriedades.
          </div>
        )}
      </div>
    </aside>
  )
}
