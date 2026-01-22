'use client'

import { FieldsConfig, FieldType } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { useMessages } from '@/lib/i18n/context'

interface FieldsBlockPreviewProps {
  config: FieldsConfig
  enabled: boolean
}

// Field type to input type mapping
const fieldTypeToInputType: Record<FieldType, string> = {
  text: 'text',
  email: 'email',
  phone: 'tel',
  number: 'number',
  textarea: 'textarea',
}

/**
 * FieldsBlockPreview - Renders form fields block
 */
export function FieldsBlockPreview({ config, enabled }: FieldsBlockPreviewProps) {
  const messages = useMessages()
  const fieldsCopy = messages.visualBuilder.fieldsEditor
  const defaults = messages.visualBuilder.defaults
  const { items } = config as FieldsConfig
  const defaultPlaceholders: Record<FieldType, string> = {
    text: fieldsCopy.placeholders.text,
    email: fieldsCopy.placeholders.email,
    phone: fieldsCopy.placeholders.phone,
    number: fieldsCopy.placeholders.number,
    textarea: fieldsCopy.placeholders.textarea,
  }

  if (!items || items.length === 0) {
    // Placeholder state
    return (
      <div className={cn('p-4', !enabled && 'opacity-50')}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground/50">
              {defaults.fieldNameLabel}
            </label>
            <div className="h-10 rounded-md border border-dashed border-muted-foreground/30 bg-muted/30" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground/50">
              {defaults.fieldEmailLabel}
            </label>
            <div className="h-10 rounded-md border border-dashed border-muted-foreground/30 bg-muted/30" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('p-4', !enabled && 'opacity-50')}>
      <div className="space-y-3">
        {items.map((field) => {
          // Use custom placeholder if set, otherwise use type-based default
          const placeholder = field.placeholder || defaultPlaceholders[field.type]

          return (
            <div key={field.id} className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                  placeholder={placeholder}
                  readOnly
                />
              ) : (
                <input
                  type={fieldTypeToInputType[field.type]}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground"
                  placeholder={placeholder}
                  readOnly
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
