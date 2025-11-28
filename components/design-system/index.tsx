"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Upload } from '@/components/ui/upload'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { cn } from '@/lib/utils'

type Section = 'colors' | 'typography' | 'components'

export function DesignSystem() {
  const [activeSection, setActiveSection] = useState<Section>('colors')

  const sections = [
    { id: 'colors' as const, label: 'Colors', description: 'Color palette and design tokens' },
    { id: 'typography' as const, label: 'Typography', description: 'Font sizes, weights, and scales' },
    { id: 'components' as const, label: 'Components', description: 'UI components and their variants' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Design System</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Comprehensive visualization of our design system, components, and design tokens.
          </p>

          {/* Section Navigation */}
          <div className="flex gap-2 mb-8">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? 'default' : 'outline'}
                onClick={() => setActiveSection(section.id)}
                className="flex flex-col items-start p-4 h-auto"
              >
                <span className="font-medium">{section.label}</span>
                <span className="text-xs text-muted-foreground mt-1">{section.description}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {activeSection === 'colors' && <ColorPalette />}
        {activeSection === 'typography' && <TypographyScale />}
        {activeSection === 'components' && <ComponentsShowcase />}
      </div>
    </div>
  )
}

function ColorPalette() {
  const colors = [
    { name: 'Background', value: 'var(--color-background)', hex: '#1a1f2e', usage: 'Main background color' },
    { name: 'Foreground', value: 'var(--color-foreground)', hex: '#f8fafc', usage: 'Primary text color' },
    { name: 'Card', value: 'var(--color-card)', hex: '#232936', usage: 'Card backgrounds' },
    { name: 'Card Foreground', value: 'var(--color-card-foreground)', hex: '#f8fafc', usage: 'Text on cards' },
    { name: 'Popover', value: 'var(--color-popover)', hex: '#232936', usage: 'Dropdown backgrounds' },
    { name: 'Popover Foreground', value: 'var(--color-popover-foreground)', hex: '#f8fafc', usage: 'Text in dropdowns' },
    { name: 'Primary', value: 'var(--color-primary)', hex: '#fbbf24', usage: 'Primary actions, links' },
    { name: 'Primary Foreground', value: 'var(--color-primary-foreground)', hex: '#1a1f2e', usage: 'Text on primary elements' },
    { name: 'Secondary', value: 'var(--color-secondary)', hex: '#2d3548', usage: 'Secondary backgrounds' },
    { name: 'Secondary Foreground', value: 'var(--color-secondary-foreground)', hex: '#f8fafc', usage: 'Text on secondary elements' },
    { name: 'Muted', value: 'var(--color-muted)', hex: '#2d3548', usage: 'Subtle backgrounds' },
    { name: 'Muted Foreground', value: 'var(--color-muted-foreground)', hex: '#94a3b8', usage: 'Muted text color' },
    { name: 'Accent', value: 'var(--color-accent)', hex: '#fbbf24', usage: 'Accent elements' },
    { name: 'Accent Foreground', value: 'var(--color-accent-foreground)', hex: '#1a1f2e', usage: 'Text on accents' },
    { name: 'Destructive', value: 'var(--color-destructive)', hex: '#ef4444', usage: 'Error states, destructive actions' },
    { name: 'Destructive Foreground', value: 'var(--color-destructive-foreground)', hex: '#f8fafc', usage: 'Text on destructive elements' },
    { name: 'Border', value: 'var(--color-border)', hex: '#3d4454', usage: 'Borders and dividers' },
    { name: 'Input', value: 'var(--color-input)', hex: '#2d3548', usage: 'Form input backgrounds' },
    { name: 'Ring', value: 'var(--color-ring)', hex: '#fbbf24', usage: 'Focus ring color' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-semibold mb-4">Color Palette</h2>
        <p className="text-muted-foreground mb-8">
          Our design system uses a carefully crafted color palette with semantic naming.
          All colors are defined as CSS custom properties for consistency across the application.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {colors.map((color) => (
          <Card key={color.name} className="overflow-hidden">
            <div
              className="h-24 flex items-center justify-center"
              style={{ backgroundColor: color.hex }}
            >
              <span className="text-sm font-medium" style={{ color: color.hex === '#1a1f2e' ? '#f8fafc' : '#1a1f2e' }}>
                {color.hex}
              </span>
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-1">{color.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{color.usage}</p>
              <div className="flex items-center gap-2 text-xs">
                <code className="bg-muted px-2 py-1 rounded">{color.value}</code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function TypographyScale() {
  const textSizes = [
    { class: 'text-xs', size: '0.75rem (12px)', lineHeight: '1rem', usage: 'Small labels, captions' },
    { class: 'text-sm', size: '0.875rem (14px)', lineHeight: '1.25rem', usage: 'Body text, secondary information' },
    { class: 'text-base', size: '1rem (16px)', lineHeight: '1.5rem', usage: 'Primary body text' },
    { class: 'text-lg', size: '1.125rem (18px)', lineHeight: '1.75rem', usage: 'Large body text' },
    { class: 'text-xl', size: '1.25rem (20px)', lineHeight: '1.75rem', usage: 'Section headings' },
    { class: 'text-2xl', size: '1.5rem (24px)', lineHeight: '2rem', usage: 'Page headings' },
    { class: 'text-3xl', size: '1.875rem (30px)', lineHeight: '2.25rem', usage: 'Large headings' },
    { class: 'text-4xl', size: '2.25rem (36px)', lineHeight: '2.5rem', usage: 'Hero headings' },
  ]

  const fontWeights = [
    { class: 'font-normal', weight: '400', usage: 'Regular text' },
    { class: 'font-medium', weight: '500', usage: 'Semi-bold emphasis' },
    { class: 'font-semibold', weight: '600', usage: 'Bold headings' },
    { class: 'font-bold', weight: '700', usage: 'Strong emphasis' },
  ]

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-3xl font-semibold mb-4">Typography Scale</h2>
        <p className="text-muted-foreground mb-8">
          Our typography system uses a consistent scale with Inter as the primary font family.
          Font sizes are defined using Tailwind's responsive scale.
        </p>
      </div>

      {/* Font Sizes */}
      <div>
        <h3 className="text-2xl font-semibold mb-6">Font Sizes</h3>
        <div className="space-y-4">
          {textSizes.map((size) => (
            <Card key={size.class}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <code className="bg-muted px-3 py-1 rounded text-sm">{size.class}</code>
                    <span className="text-sm text-muted-foreground">{size.size}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Line height: {size.lineHeight}</span>
                </div>
                <p className={cn(size.class, 'mb-2')}>The quick brown fox jumps over the lazy dog</p>
                <p className="text-sm text-muted-foreground">{size.usage}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Font Weights */}
      <div>
        <h3 className="text-2xl font-semibold mb-6">Font Weights</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {fontWeights.map((weight) => (
            <Card key={weight.class}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-3">
                  <code className="bg-muted px-3 py-1 rounded text-sm">{weight.class}</code>
                  <span className="text-sm text-muted-foreground">({weight.weight})</span>
                </div>
                <p className={cn(weight.class, 'mb-2')}>The quick brown fox jumps over the lazy dog</p>
                <p className="text-sm text-muted-foreground">{weight.usage}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function ComponentsShowcase() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-3xl font-semibold mb-4">Component Library</h2>
        <p className="text-muted-foreground mb-8">
          Comprehensive showcase of all UI components with their variants and states.
        </p>
      </div>

      <ButtonShowcase />
      <BadgeShowcase />
      <InputShowcase />
      <CardShowcase />
      <SelectShowcase />
      <DialogShowcase />
      <AvatarShowcase />
      <LoadingSpinnerShowcase />
      <EmptyStateShowcase />
      <UploadShowcase />
      <EmojiPickerShowcase />
    </div>
  )
}

function ButtonShowcase() {
  const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const
  const sizes = ['default', 'sm', 'lg', 'icon'] as const

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-6">Button</h3>
      <div className="space-y-8">
        {/* Variants */}
        <div>
          <h4 className="text-lg font-medium mb-4">Variants</h4>
          <div className="flex flex-wrap gap-4">
            {variants.map((variant) => (
              <div key={variant} className="flex flex-col items-center gap-2">
                <Button variant={variant}>{variant}</Button>
                <code className="text-xs bg-muted px-2 py-1 rounded">{variant}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div>
          <h4 className="text-lg font-medium mb-4">Sizes</h4>
          <div className="flex flex-wrap items-end gap-4">
            {sizes.map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <Button size={size}>{size === 'icon' ? '🔍' : `Size ${size}`}</Button>
                <code className="text-xs bg-muted px-2 py-1 rounded">{size}</code>
              </div>
            ))}
          </div>
        </div>

        {/* States */}
        <div>
          <h4 className="text-lg font-medium mb-4">States</h4>
          <div className="flex flex-wrap gap-4">
            <Button>Normal</Button>
            <Button disabled>Disabled</Button>
            <Button className="cursor-pointer">Custom Cursor</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function BadgeShowcase() {
  const variants = ['default', 'secondary', 'destructive', 'outline', 'draft', 'published'] as const

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-6">Badge</h3>
      <div className="flex flex-wrap gap-4">
        {variants.map((variant) => (
          <div key={variant} className="flex flex-col items-center gap-2">
            <Badge variant={variant}>{variant}</Badge>
            <code className="text-xs bg-muted px-2 py-1 rounded">{variant}</code>
          </div>
        ))}
      </div>
    </div>
  )
}

function InputShowcase() {
  return (
    <div>
      <h3 className="text-2xl font-semibold mb-6">Input</h3>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="text-sm font-medium mb-2 block">Default Input</label>
          <Input placeholder="Enter some text..." />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Email Input</label>
          <Input type="email" placeholder="Enter your email..." />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Disabled Input</label>
          <Input disabled placeholder="Disabled input..." />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Textarea</label>
          <Textarea placeholder="Enter longer text..." rows={4} />
        </div>
      </div>
    </div>
  )
}

function CardShowcase() {
  return (
    <div>
      <h3 className="text-2xl font-semibold mb-6">Card</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description goes here.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">This is the main content of the card.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card with Footer</CardTitle>
            <CardDescription>Card with both header and footer.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Content section of the card.</p>
          </CardContent>
          <div className="flex justify-end p-6 pt-0">
            <Button size="sm">Action</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

function SelectShowcase() {
  return (
    <div>
      <h3 className="text-2xl font-semibold mb-6">Select</h3>
      <div className="max-w-md">
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
            <SelectItem value="option3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function DialogShowcase() {
  return (
    <div>
      <h3 className="text-2xl font-semibold mb-6">Dialog</h3>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>
              This is a dialog component example.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>Dialog content goes here.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AvatarShowcase() {
  return (
    <div>
      <h3 className="text-2xl font-semibold mb-6">Avatar</h3>
      <div className="flex gap-4">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}

function LoadingSpinnerShowcase() {
  return (
    <div>
      <h3 className="text-2xl font-semibold mb-6">Loading Spinner</h3>
      <div className="flex gap-4">
        <LoadingSpinner size="sm" />
        <LoadingSpinner size="default" />
        <LoadingSpinner size="lg" />
      </div>
    </div>
  )
}

function EmptyStateShowcase() {
  return (
    <div>
      <h3 className="text-2xl font-semibold mb-6">Empty State</h3>
      <EmptyState
        icon={<span className="text-2xl">📭</span>}
        title="No items found"
        description="There are no items to display at the moment."
      />
    </div>
  )
}

function UploadShowcase() {
  const [file, setFile] = useState<File | null>(null)

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-6">Upload</h3>
      <Upload
        onFileChange={setFile}
        accept="image/*"
      />
    </div>
  )
}

function EmojiPickerShowcase() {
  const [selectedEmoji, setSelectedEmoji] = useState<string | undefined>('😊')

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-6">Emoji Picker</h3>
      <div className="flex items-center gap-4">
        <span className="text-2xl">{selectedEmoji || '😀'}</span>
        <EmojiPicker
          value={selectedEmoji}
          onChange={setSelectedEmoji}
        />
      </div>
    </div>
  )
}
