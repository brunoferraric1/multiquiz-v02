'use client'

import { FieldsConfig, FieldType } from '@/types/blocks'
import { cn } from '@/lib/utils'

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

// Default placeholders for each field type (must match editor)
const defaultPlaceholders: Record<FieldType, string> = {
  text: 'Digite aqui...',
  email: 'seu@email.com',
  phone: '(00) 00000-0000',
  number: '0',
  textarea: 'Digite sua mensagem...',
}

/**
 * FieldsBlockPreview - Renders form fields block
 */
export function FieldsBlockPreview({ config, enabled }: FieldsBlockPreviewProps) {
  const { items } = config as FieldsConfig

  if (!items || items.length === 0) {
    // Placeholder state
    return (
      <div className={cn('p-4', !enabled && 'opacity-50')}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground/50">Nome do campo</label>
            <div className="h-10 rounded-md border border-dashed border-muted-foreground/30 bg-muted/30" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground/50">Email</label>
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
