'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ConnectedVisualBuilder } from '@/components/visual-builder'
import { MobileGate } from '@/components/visual-builder/mobile-gate'
import {
  useVisualBuilderStore,
  Step,
  Outcome,
  getDefaultBlocksForStepType,
  getDefaultOutcomeBlocks,
} from '@/store/visual-builder-store'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLocale, useMessages } from '@/lib/i18n/context'
import { localizePathname } from '@/lib/i18n/paths'

export default function VisualBuilderPage() {
  const router = useRouter()
  const initialize = useVisualBuilderStore((state) => state.initialize)
  const [isInitialized, setIsInitialized] = useState(false)
  const locale = useLocale()
  const messages = useMessages()
  const copy = messages.visualBuilder

  // Back handler for mobile gate
  const handleMobileBack = useCallback(() => {
    router.push(localizePathname('/dashboard', locale))
  }, [locale, router])

  // Initialize store with demo data on mount (client-side only)
  useEffect(() => {
    // Create sample data for testing the visual builder
    // This runs only on the client to avoid hydration mismatches
    const initialSteps: Step[] = [
      {
        id: 'intro',
        type: 'intro',
        label: copy.stepLabels.intro,
        isFixed: true,
        subtitle: copy.defaults.introTitle,
        blocks: getDefaultBlocksForStepType('intro', copy),
        settings: { showProgress: false, allowBack: false },
      },
      {
        id: 'q1',
        type: 'question',
        label: `${copy.stepLabels.question} 1`,
        blocks: getDefaultBlocksForStepType('question', copy),
        settings: { showProgress: true, allowBack: true },
      },
      {
        id: 'q2',
        type: 'question',
        label: `${copy.stepLabels.question} 2`,
        blocks: getDefaultBlocksForStepType('question', copy),
        settings: { showProgress: true, allowBack: true },
      },
      {
        id: 'lead',
        type: 'lead-gen',
        label: copy.stepLabels.leadGen,
        subtitle: copy.defaults.leadGenTitle,
        blocks: getDefaultBlocksForStepType('lead-gen', copy),
        settings: { showProgress: true, allowBack: true },
      },
      {
        id: 'result',
        type: 'result',
        label: copy.stepLabels.result,
        isFixed: true,
        blocks: [],
        settings: { showProgress: false, allowBack: false },
      },
    ]

    const initialOutcomes: Outcome[] = [
      { id: 'outcome-1', name: `${copy.sidebar.outcomeLabel} 1`, blocks: getDefaultOutcomeBlocks(copy) },
      { id: 'outcome-2', name: `${copy.sidebar.outcomeLabel} 2`, blocks: getDefaultOutcomeBlocks(copy) },
    ]

    initialize({ steps: initialSteps, outcomes: initialOutcomes })
    setIsInitialized(true)
  }, [copy, initialize])

  // Show loading state until store is initialized
  if (!isInitialized) {
    return (
      <MobileGate onBack={handleMobileBack}>
        <div className="min-h-screen flex items-center justify-center bg-muted">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">{copy.loading.loadingQuiz}</p>
          </div>
        </div>
      </MobileGate>
    )
  }

  const handlePreview = () => {
    toast.info(copy.demo.previewNotice, {
      action: {
        label: copy.demo.goDashboard,
        onClick: () => router.push(localizePathname('/dashboard', locale)),
      },
    })
  }

  const handlePublish = () => {
    toast.info(copy.demo.publishNotice, {
      action: {
        label: copy.demo.goDashboard,
        onClick: () => router.push(localizePathname('/dashboard', locale)),
      },
    })
  }

  return (
    <MobileGate onBack={handleMobileBack}>
      <ConnectedVisualBuilder
        quizName={copy.quiz.defaultName}
        onBack={handleMobileBack}
        onPreview={handlePreview}
        onPublish={handlePublish}
      />
    </MobileGate>
  )
}
