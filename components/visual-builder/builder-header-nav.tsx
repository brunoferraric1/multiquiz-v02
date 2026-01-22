'use client'

import { cn } from '@/lib/utils'
import { ArrowLeft, Play, Edit3, Sparkles, Palette, BarChart3, Settings, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type HeaderTab = 'editar' | 'assistente' | 'tema' | 'relatorio' | 'config'

interface BuilderHeaderNavProps {
  quizName: string
  activeTab: HeaderTab
  onTabChange: (tab: HeaderTab) => void
  onBack?: () => void
  onPreview?: () => void
  onPublish?: () => void
  isPublishing?: boolean
  isPublished?: boolean
  isPreviewing?: boolean
  isBackSaving?: boolean
}

const tabs: { id: HeaderTab; label: string; icon: React.ReactNode }[] = [
  { id: 'editar', label: 'Editar', icon: <Edit3 className="w-4 h-4" /> },
  { id: 'assistente', label: 'Assistente IA', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'tema', label: 'Tema', icon: <Palette className="w-4 h-4" /> },
  { id: 'relatorio', label: 'Relatório', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'config', label: 'Configurações', icon: <Settings className="w-4 h-4" /> },
]

export function BuilderHeaderNav({
  quizName,
  activeTab,
  onTabChange,
  onBack,
  onPreview,
  onPublish,
  isPublishing = false,
  isPublished = false,
  isPreviewing = false,
  isBackSaving = false,
}: BuilderHeaderNavProps) {
  // Determine button text based on publish state
  const publishButtonText = isPublishing
    ? 'Publicando...'
    : isPublished
      ? 'Atualizar'
      : 'Publicar'

  return (
    <header className="h-14 bg-card border-b flex items-center px-4 shrink-0">
      {/* Left: Back + Quiz name */}
      <div className="flex items-center gap-3 w-48">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Voltar"
          disabled={isBackSaving}
          className="text-muted-foreground hover:text-foreground"
        >
          {isBackSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowLeft className="w-5 h-5" />
          )}
        </Button>
        <span className="font-semibold text-foreground truncate">{quizName}</span>
      </div>

      {/* Center: Navigation tabs */}
      <div className="flex-1 flex items-center justify-center">
        <nav className="flex items-center gap-1 bg-muted rounded-lg p-1" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.icon}
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 w-48 justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreview}
          className="flex items-center gap-2"
          aria-label="Preview"
          disabled={isPreviewing}
        >
          {isPreviewing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          <span className="hidden sm:inline">
            {isPreviewing ? 'Abrindo...' : 'Preview'}
          </span>
        </Button>
        <Button
          size="sm"
          onClick={onPublish}
          aria-label={publishButtonText}
          disabled={isPublishing}
        >
          {isPublishing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {publishButtonText}
        </Button>
      </div>
    </header>
  )
}
