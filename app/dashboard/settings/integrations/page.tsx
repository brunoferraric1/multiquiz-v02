'use client'

import { useState, useEffect } from 'react'
import { Copy, RefreshCw, Loader2, Send, CheckCircle2, AlertCircle, Webhook, MessageCircle, ChevronDown } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { auth } from '@/lib/firebase'
import { useMessages, useLocale } from '@/lib/i18n/context'
import { localizePathname } from '@/lib/i18n/paths'
import { generateWebhookSecret } from '@/lib/services/user-settings-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { PageBreadcrumb } from '@/components/ui/page-breadcrumb'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { WebhookConfig } from '@/types'

export default function IntegrationsSettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const messages = useMessages()
  const locale = useLocale()
  const copy = messages.integrations

  // Local state
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Webhook config state
  const [enabled, setEnabled] = useState(false)
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  // Track original values to detect changes
  const [originalConfig, setOriginalConfig] = useState<WebhookConfig | null>(null)

  // Load existing settings
  useEffect(() => {
    if (!user?.uid) return

    const loadSettings = async () => {
      try {
        setIsLoading(true)
        const token = await auth?.currentUser?.getIdToken()
        const response = await fetch('/api/user/settings', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          const config = data.webhookConfig as WebhookConfig | null

          if (config) {
            setEnabled(config.enabled)
            setUrl(config.url)
            setSecret(config.secret)
            setOriginalConfig(config)
            // Auto-expand if webhook is enabled
            if (config.enabled) {
              setIsExpanded(true)
            }
          } else {
            // Generate a new secret for new users
            const newSecret = generateWebhookSecret()
            setSecret(newSecret)
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err)
        toast.error(copy.toast.loadError)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [user, copy.toast.loadError])

  // Track changes
  useEffect(() => {
    if (!originalConfig) {
      // New config - has changes if URL is set
      setHasChanges(url.length > 0)
      return
    }

    const changed =
      enabled !== originalConfig.enabled ||
      url !== originalConfig.url ||
      secret !== originalConfig.secret

    setHasChanges(changed)
  }, [enabled, url, secret, originalConfig])

  // Reset test result after 3 seconds on success
  useEffect(() => {
    if (testResult === 'success') {
      const timer = setTimeout(() => {
        setTestResult(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [testResult])

  // Reset test result when URL changes
  useEffect(() => {
    setTestResult(null)
  }, [url])

  // Handle save
  const handleSave = async () => {
    if (!user?.uid) return

    // Validate URL
    if (enabled && !url) {
      toast.error(copy.toast.urlRequired)
      return
    }

    if (url) {
      try {
        new URL(url)
      } catch {
        toast.error(copy.toast.invalidUrl)
        return
      }
    }

    try {
      setIsSaving(true)
      const token = await auth?.currentUser?.getIdToken()

      const config: WebhookConfig = {
        enabled,
        url,
        secret,
      }

      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webhookConfig: config }),
      })

      if (response.ok) {
        setOriginalConfig(config)
        setHasChanges(false)
        toast.success(copy.toast.saveSuccess)
      } else {
        throw new Error('Failed to save')
      }
    } catch (err) {
      console.error('Error saving settings:', err)
      toast.error(copy.toast.saveError)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle test webhook
  const handleTest = async () => {
    if (!user?.uid || !url || !secret) return

    // Validate URL
    try {
      new URL(url)
    } catch {
      toast.error(copy.toast.invalidUrl)
      return
    }

    try {
      setIsTesting(true)
      setTestResult(null)

      const token = await auth?.currentUser?.getIdToken()
      if (!token) {
        toast.error(copy.toast.authError || 'Authentication error')
        setTestResult('error')
        return
      }

      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, secret }),
      })

      const data = await response.json()

      if (data.success) {
        setTestResult('success')
        toast.success(copy.toast.testSuccess)
      } else {
        setTestResult('error')
        toast.error(copy.toast.testError + (data.error ? `: ${data.error}` : ''))
      }
    } catch (err) {
      console.error('Error testing webhook:', err)
      setTestResult('error')
      toast.error(copy.toast.testError)
    } finally {
      setIsTesting(false)
    }
  }

  // Handle copy secret
  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret)
      toast.success(copy.toast.copied)
    } catch {
      toast.error(copy.toast.copyError)
    }
  }

  // Handle regenerate secret
  const handleRegenerateSecret = () => {
    const newSecret = generateWebhookSecret()
    setSecret(newSecret)
    toast.success(copy.toast.secretGenerated)
  }

  // Handle toggle - expand when enabling
  const handleToggle = (checked: boolean) => {
    setEnabled(checked)
    // Auto-expand when enabling
    if (checked) {
      setIsExpanded(true)
    }
    // Reset test result when toggling
    setTestResult(null)
  }

  // Handle accordion expand/collapse
  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded)
  }

  // Breadcrumb items
  const breadcrumbItems = [
    { label: copy.breadcrumb.settings, href: localizePathname('/dashboard/settings', locale) },
    { label: copy.breadcrumb.integrations },
  ]

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Breadcrumb */}
      <PageBreadcrumb items={breadcrumbItems} />

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{copy.page.title}</h1>
        <p className="text-muted-foreground mt-2">{copy.page.subtitle}</p>
      </div>

      {/* Integrations list */}
      <div className="space-y-4">
        {/* CRM Webhook Integration */}
        <div className="rounded-lg border bg-card overflow-hidden">
          {/* Header - always visible, clickable to expand/collapse */}
          <div
            className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={handleExpandToggle}
          >
            {/* Icon */}
            <div className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg shrink-0',
              enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              <Webhook className="h-5 w-5" />
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {copy.webhook.title}
                </span>
                {/* Show "Active" badge only when webhook is saved, enabled, and has URL */}
                {originalConfig?.enabled && originalConfig?.url && (
                  <Badge variant="default" className="text-xs bg-green-500/20 text-green-500 hover:bg-green-500/20">
                    {copy.webhook.activeBadge}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {copy.webhook.description}
              </p>
            </div>

            {/* Toggle and chevron */}
            <div className="flex items-center gap-3">
              <Switch
                checked={enabled}
                onCheckedChange={handleToggle}
                onClick={(e) => e.stopPropagation()}
              />
              <ChevronDown className={cn(
                'h-5 w-5 text-muted-foreground transition-transform duration-200',
                isExpanded && 'rotate-180'
              )} />
            </div>
          </div>

          {/* Expanded content - accordion */}
          <div className={cn(
            'grid transition-all duration-200 ease-in-out',
            isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          )}>
            <div className="overflow-hidden">
              <div className="border-t px-4 pb-4 pt-4 space-y-4">
                {/* URL input */}
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">{copy.webhook.urlLabel}</Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    placeholder="https://seu-crm.com/webhook"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {copy.webhook.urlHint}
                  </p>
                </div>

                {/* Secret input */}
                <div className="space-y-2">
                  <Label htmlFor="webhook-secret">{copy.webhook.secretLabel}</Label>
                  {secret ? (
                    <>
                      <div className="flex gap-2">
                        <Input
                          id="webhook-secret"
                          type="text"
                          value={secret}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleCopySecret}
                          title={copy.webhook.copyButton}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleRegenerateSecret}
                          title={copy.webhook.regenerateButton}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {copy.webhook.secretHint}
                      </p>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRegenerateSecret}
                      className="w-full justify-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      {copy.webhook.generateButton}
                    </Button>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="h-10"
                    onClick={handleTest}
                    disabled={isTesting || !url || !secret}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {copy.webhook.testing}
                      </>
                    ) : testResult === 'success' ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                        {copy.webhook.testSuccess}
                      </>
                    ) : testResult === 'error' ? (
                      <>
                        <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                        {copy.webhook.testError}
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {copy.webhook.testButton}
                      </>
                    )}
                  </Button>

                  <Button
                    className="h-10"
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {copy.actions.saving}
                      </>
                    ) : (
                      copy.actions.save
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Integration - Coming Soon */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            {/* Icon */}
            <div className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0 bg-muted text-muted-foreground">
              <MessageCircle className="h-5 w-5" />
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">
                  {copy.whatsapp.title}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {copy.whatsapp.soonBadge}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {copy.whatsapp.description}
              </p>
            </div>

            {/* Disabled toggle */}
            <div className="flex items-center gap-3">
              <Switch disabled checked={false} />
              <ChevronDown className="h-5 w-5 text-muted-foreground/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
