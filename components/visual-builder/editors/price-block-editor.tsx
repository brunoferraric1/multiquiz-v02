'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { PriceConfig } from '@/types/blocks'

interface PriceBlockEditorProps {
  config: PriceConfig
  onChange: (config: Partial<PriceConfig>) => void
}

export function PriceBlockEditor({ config, onChange }: PriceBlockEditorProps) {
  return (
    <div className="space-y-4" data-testid="price-block-editor">
      {/* Product title */}
      <div className="space-y-2">
        <Label htmlFor="price-product-title">Nome do produto</Label>
        <Input
          id="price-product-title"
          value={config.productTitle || ''}
          onChange={(e) => onChange({ productTitle: e.target.value })}
          placeholder="Ex: Plano Premium"
        />
      </div>

      {/* Price value with prefix/suffix */}
      <div className="space-y-2">
        <Label>Preço</Label>
        <div className="flex gap-2">
          <div className="w-16">
            <Input
              value={config.prefix || ''}
              onChange={(e) => onChange({ prefix: e.target.value })}
              placeholder="R$"
              aria-label="Prefixo do preço"
            />
          </div>
          <div className="flex-1">
            <Input
              value={config.value || ''}
              onChange={(e) => onChange({ value: e.target.value })}
              placeholder="99,90"
              aria-label="Valor do preço"
            />
          </div>
          <div className="w-20">
            <Input
              value={config.suffix || ''}
              onChange={(e) => onChange({ suffix: e.target.value })}
              placeholder="/mês"
              aria-label="Sufixo do preço"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Exemplo: R$ 99,90 /mês
        </p>
      </div>

      {/* Highlight toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="price-highlight">Destacar preço</Label>
          <p className="text-xs text-muted-foreground">
            Adiciona um badge de destaque ao preço
          </p>
        </div>
        <Switch
          id="price-highlight"
          checked={config.highlight || false}
          onCheckedChange={(checked) => onChange({ highlight: checked })}
        />
      </div>
    </div>
  )
}
