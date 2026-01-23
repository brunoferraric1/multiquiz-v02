'use client'

import { useState } from 'react'
import { useMessages, useLocale } from '@/lib/i18n/context'
import { localizePathname } from '@/lib/i18n/paths'
import { copyToClipboard } from '@/lib/copy-to-clipboard'
import { toast } from 'sonner'
import { ArrowLeft, Globe, Loader2, Check, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export type HeaderTab = 'editar' | 'assistente'

interface BuilderHeaderNavProps {
  quizName: string
  quizId?: string
  activeTab?: HeaderTab
  onTabChange?: (tab: HeaderTab) => void
  onBack?: () => void
  onPublish?: () => void
  isPublishing?: boolean
  isPublished?: boolean
  hasUnpublishedChanges?: boolean
  isBackSaving?: boolean
}

export function BuilderHeaderNav({
  quizName,
  quizId,
  onBack,
  onPublish,
  isPublishing = false,
  isPublished = false,
  hasUnpublishedChanges = false,
  isBackSaving = false,
}: BuilderHeaderNavProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const messages = useMessages()
  const locale = useLocale()
  const header = messages.visualBuilder.header
  const dashboard = messages.dashboard

  // Determine button text and state based on publish status
  // 1. Publishing in progress -> "Publicando..." (disabled)
  // 2. Not published -> "Publicar" (enabled)
  // 3. Published + has changes -> "Atualizar" (enabled)
  // 4. Published + no changes -> "Publicado" (shows "Copiar Link" on hover)
  const isPublishedWithNoChanges = isPublished && !hasUnpublishedChanges

  // When published with no changes and hovered, show copy link option
  const showCopyLinkMode = isPublishedWithNoChanges && isHovered && !copied
  const showCopiedMode = isPublishedWithNoChanges && copied

  const publishButtonText = isPublishing
    ? header.actions.publishing
    : showCopiedMode
      ? dashboard.quizActions.linkCopied
      : showCopyLinkMode
        ? dashboard.quizActions.copyLink
        : !isPublished
          ? header.actions.publish
          : hasUnpublishedChanges
            ? header.actions.update
            : header.actions.published

  // Button is only disabled when publishing - not when showing "Publicado"
  const isPublishDisabled = isPublishing

  const handleButtonClick = async () => {
    // If in copy mode, copy the link instead of publishing
    if (isPublishedWithNoChanges && quizId) {
      const url = typeof window !== 'undefined'
        ? `${window.location.origin}${localizePathname(`/quiz/${quizId}`, locale)}`
        : ''
      if (!url) return

      const success = await copyToClipboard(url)
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        toast.error(dashboard.quizActions.linkCopyError)
      }
      return
    }

    // Otherwise, call the publish handler
    onPublish?.()
  }

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
          onClick={handleButtonClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label={publishButtonText}
          disabled={isPublishDisabled}
          variant={isPublishedWithNoChanges && !showCopyLinkMode && !showCopiedMode ? 'secondary' : 'default'}
        >
          {isPublishing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : showCopiedMode ? (
            <Check className="w-4 h-4 mr-2 text-green-500" />
          ) : showCopyLinkMode ? (
            <Share2 className="w-4 h-4 mr-2" />
          ) : isPublishedWithNoChanges ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Globe className="w-4 h-4 mr-2" />
          )}
          {publishButtonText}
        </Button>
      </div>
    </header>
  )
}
