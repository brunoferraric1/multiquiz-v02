'use client'

import { useMessages } from '@/lib/i18n/context'
import { ArrowLeft, Globe, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export type HeaderTab = 'editar' | 'assistente'

interface BuilderHeaderNavProps {
  quizName: string
  activeTab?: HeaderTab
  onTabChange?: (tab: HeaderTab) => void
  onBack?: () => void
  onPublish?: () => void
  isPublishing?: boolean
  isPublished?: boolean
  isBackSaving?: boolean
}

export function BuilderHeaderNav({
  quizName,
  onBack,
  onPublish,
  isPublishing = false,
  isPublished = false,
  isBackSaving = false,
}: BuilderHeaderNavProps) {
  const messages = useMessages()
  const header = messages.visualBuilder.header
  const dashboard = messages.dashboard

  // Determine button text based on publish state
  const publishButtonText = isPublishing
    ? header.actions.publishing
    : isPublished
      ? header.actions.update
      : header.actions.publish

  return (
    <header className="h-14 bg-card border-b flex items-center px-4 shrink-0">
      {/* Left: Back button with label */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          aria-label={header.aria.back}
          disabled={isBackSaving}
          className="text-muted-foreground hover:bg-muted hover:text-foreground gap-1 px-2"
        >
          {isBackSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowLeft className="w-4 h-4" />
          )}
          <span>{header.backLabel}</span>
        </Button>
      </div>

      {/* Center: Quiz title + Status badge */}
      <div className="flex-1 flex items-center justify-center gap-2 min-w-0 px-4">
        <span className="font-semibold text-foreground truncate max-w-md">
          {quizName}
        </span>
        <Badge
          variant={isPublished ? 'published' : 'draft'}
          className="rounded shadow-sm border-none shrink-0"
        >
          {isPublished ? dashboard.quizCard.published : dashboard.quizCard.draft}
        </Badge>
      </div>

      {/* Right: Publish */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          onClick={onPublish}
          aria-label={publishButtonText}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Globe className="w-4 h-4 mr-2" />
          )}
          {publishButtonText}
        </Button>
      </div>
    </header>
  )
}
