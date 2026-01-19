/**
 * Block Types for the Visual Builder
 *
 * These types define the structure of blocks that can be added to steps.
 * Each step contains an array of blocks, and each block has a type and configuration.
 */

// Block type identifiers
export type BlockType =
  | 'header'
  | 'text'
  | 'media'
  | 'options'
  | 'fields'
  | 'price'
  | 'button'
  | 'banner'
  | 'list'

// Header block configuration
export interface HeaderConfig {
  title?: string
  description?: string
}

// Text block configuration
export interface TextConfig {
  content: string
}

// Media block configuration
export interface MediaConfig {
  type: 'image' | 'video'
  url?: string
  alt?: string
}

// Option item for options block
export interface OptionItem {
  id: string
  text: string
  emoji?: string
  outcomeId?: string
}

// Options block configuration
export interface OptionsConfig {
  items: OptionItem[]
  selectionType: 'single' | 'multiple'
}

// Field types for form fields
export type FieldType = 'text' | 'email' | 'phone' | 'number' | 'textarea'

// Field item for fields block
export interface FieldItem {
  id: string
  label: string
  type: FieldType
  placeholder?: string
  required?: boolean
}

// Fields block configuration
export interface FieldsConfig {
  items: FieldItem[]
}

// Price item for price block (supports multiple prices)
export interface PriceItem {
  id: string
  title: string           // Product/plan name (e.g., "Plano PRO")
  prefix?: string         // Text above price (e.g., "10% off")
  value: string           // Main price (e.g., "R$ 89,90")
  suffix?: string         // Text below price (e.g., "à vista")
  originalPrice?: string  // Slashed/strikethrough price (e.g., "R$ 129,90")
  highlightText?: string  // Badge text (e.g., "MAIS POPULAR")
  showCheckbox?: boolean  // Show selection checkbox/radio
  redirectUrl?: string    // URL to redirect when clicked
}

// Price block configuration
export interface PriceConfig {
  items: PriceItem[]
  selectionType?: 'single' | 'multiple'  // Radio or checkbox selection
}

// Button action types
export type ButtonAction = 'url' | 'next_step'

// Button block configuration
export interface ButtonConfig {
  text: string
  action: ButtonAction
  url?: string
}

// Banner urgency levels
export type BannerUrgency = 'info' | 'warning' | 'danger'

// Banner block configuration
export interface BannerConfig {
  urgency: BannerUrgency
  text: string
  emoji?: string
}

// List item for list block
export interface ListItem {
  id: string
  text: string
  emoji?: string
}

// List block configuration
export interface ListConfig {
  items: ListItem[]
}

// Union type for all block configurations
export type BlockConfig =
  | HeaderConfig
  | TextConfig
  | MediaConfig
  | OptionsConfig
  | FieldsConfig
  | PriceConfig
  | ButtonConfig
  | BannerConfig
  | ListConfig

// Block interface
export interface Block {
  id: string
  type: BlockType
  enabled: boolean
  config: BlockConfig
}

// Step settings
export interface StepSettings {
  showProgress?: boolean
  allowBack?: boolean
}

// Helper function to get default config for a block type
export function getDefaultBlockConfig(type: BlockType): BlockConfig {
  switch (type) {
    case 'header':
      return { title: '', description: '' } as HeaderConfig
    case 'text':
      return { content: '' } as TextConfig
    case 'media':
      return { type: 'image', url: '' } as MediaConfig
    case 'options':
      return { items: [], selectionType: 'single' } as OptionsConfig
    case 'fields':
      return {
        items: [
          {
            id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            label: 'Nome',
            type: 'text',
            placeholder: 'Digite seu nome...',
            required: true,
          },
        ],
      } as FieldsConfig
    case 'price':
      return {
        items: [
          {
            id: `price-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title: 'Plano',
            value: 'R$ 99,90',
            suffix: 'à vista',
            showCheckbox: true,
          },
        ],
        selectionType: 'single',
      } as PriceConfig
    case 'button':
      return { text: 'Continuar', action: 'next_step' } as ButtonConfig
    case 'banner':
      return { urgency: 'info', text: '' } as BannerConfig
    case 'list':
      return { items: [] } as ListConfig
  }
}

// Helper function to create a new block
export function createBlock(type: BlockType): Block {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    enabled: true,
    config: getDefaultBlockConfig(type),
  }
}

// Block type labels (for UI display)
export const blockTypeLabels: Record<BlockType, string> = {
  header: 'Cabeçalho',
  text: 'Texto',
  media: 'Mídia',
  options: 'Opções',
  fields: 'Campos',
  price: 'Preço',
  button: 'Botão',
  banner: 'Banner',
  list: 'Lista',
}

// Block type descriptions (for UI display)
export const blockTypeDescriptions: Record<BlockType, string> = {
  header: 'Título e descrição',
  text: 'Bloco de texto simples',
  media: 'Imagem ou vídeo',
  options: 'Opções de resposta',
  fields: 'Campos de formulário',
  price: 'Exibição de preço',
  button: 'Botão de ação',
  banner: 'Banner de destaque',
  list: 'Lista de itens',
}
