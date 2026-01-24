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

// Focal point for image positioning (0-100 percentage)
export interface FocalPoint {
  x: number // 0-100, percentage from left
  y: number // 0-100, percentage from top
}

// Media block configuration
export interface MediaConfig {
  type: 'image' | 'video'
  url?: string
  alt?: string
  orientation?: 'horizontal' | 'vertical'
  videoThumbnail?: string // Custom thumbnail for videos (used when auto-thumbnail is unavailable)
  focalPoint?: FocalPoint // Focal point for image cropping/positioning
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
  title: string              // Product/plan name (e.g., "Plano PRO")
  prefix?: string            // Text above price (e.g., "10% off")
  value: string              // Main price (e.g., "R$ 89,90")
  suffix?: string            // Text below price (e.g., "à vista")
  originalPrice?: string     // Slashed price value (e.g., "R$ 129,90")
  showOriginalPrice?: boolean // Toggle to enable "de X por" display
  highlightText?: string     // Badge text (e.g., "MAIS POPULAR")
  showHighlight?: boolean    // Toggle to enable highlight banner
  redirectUrl?: string       // URL to redirect when clicked
}

// Price block configuration
export interface PriceConfig {
  items: PriceItem[]
  selectionType?: 'single' | 'multiple'  // Radio or checkbox selection
}

// Button action types
export type ButtonAction = 'url' | 'next_step' | 'selected_price'

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
      return { type: 'image', url: '', orientation: 'horizontal' } as MediaConfig
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
          },
        ],
        selectionType: 'single',
      } as PriceConfig
    case 'button':
      return { text: 'Continuar', action: 'next_step' } as ButtonConfig
    case 'banner':
      return { urgency: 'info', text: '' } as BannerConfig
    case 'list':
      return {
        items: [
          {
            id: `list-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: 'Item da lista 1',
            emoji: '✓',
          },
          {
            id: `list-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: 'Item da lista 2',
            emoji: '✓',
          },
          {
            id: `list-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: 'Item da lista 3',
            emoji: '✓',
          },
        ],
      } as ListConfig
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
