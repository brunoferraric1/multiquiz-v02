'use client'

import { cn } from '@/lib/utils'
import { useMessages } from '@/lib/i18n/context'
import { ArrowLeft, Edit3, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type HeaderTab = 'editar' | 'assistente'

interface BuilderHeaderNavProps {
  quizName: string
  activeTab: HeaderTab
  onTabChange: (tab: HeaderTab) => void
  onBack?: () => void
  onPublish?: () => void
  isPublishing?: boolean
  isPublished?: boolean
  isBackSaving?: boolean
}

export function BuilderHeaderNav({
  quizName,
  activeTab,
  onTabChange,
  onBack,
  onPublish,
  isPublishing = false,
  isPublished = false,
  isBackSaving = false,
}: BuilderHeaderNavProps) {
  const messages = useMessages()
  const header = messages.visualBuilder.header
  const tabs: { id: HeaderTab; label: string; icon: React.ReactNode }[] = [
    { id: 'editar', label: header.tabs.editar, icon: <Edit3 className="w-4 h-4" /> },
    { id: 'assistente', label: header.tabs.assistente, icon: <Sparkles className="w-4 h-4" /> },
  ]

  // Determine button text based on publish state
  const publishButtonText = isPublishing
    ? header.actions.publishing
    : isPublished
      ? header.actions.update
      : header.actions.publish
  return (
    <header className="h-14 bg-card border-b flex items-center px-4 shrink-0">
      {/* Left: Back + Quiz name */}
      <div className="flex items-center gap-3 w-48">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label={header.aria.back}
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

      {/* Right: Publish */}
      <div className="flex items-center gap-2 w-48 justify-end">
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
