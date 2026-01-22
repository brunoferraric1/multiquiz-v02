'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { Button } from '@/components/ui/button'
import { SectionTitle } from '@/components/ui/section-title'
import { TextConfig } from '@/types/blocks'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'
import { useMessages } from '@/lib/i18n/context'

interface TextBlockEditorProps {
  config: TextConfig
  onChange: (config: Partial<TextConfig>) => void
}

export function TextBlockEditor({ config, onChange }: TextBlockEditorProps) {
  const messages = useMessages()
  const textCopy = messages.visualBuilder.textEditor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Underline,
      TextAlign.configure({
        types: ['paragraph'],
        defaultAlignment: 'center',
      }),
    ],
    content: config.content || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange({ content: editor.getHTML() })
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-[var(--cursor-not-allowed)] disabled:opacity-50 prose prose-sm max-w-none dark:prose-invert',
      },
    },
  })

  // Sync content when config changes externally
  useEffect(() => {
    if (editor && config.content !== editor.getHTML()) {
      editor.commands.setContent(config.content || '')
    }
  }, [config.content, editor])

  if (!editor) {
    return null
  }

  return (
    <div className="space-y-4" data-testid="text-block-editor">
      <div>
        <SectionTitle>{textCopy.content}</SectionTitle>

        <div className="space-y-2">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1 p-1 border rounded-md bg-muted/30">
            {/* Text formatting */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title={textCopy.bold}
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title={textCopy.italic}
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title={textCopy.underline}
            >
              <UnderlineIcon className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title={textCopy.strikethrough}
            >
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* Alignment */}
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              title={textCopy.alignLeft}
            >
              <AlignLeft className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              title={textCopy.alignCenter}
            >
              <AlignCenter className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              title={textCopy.alignRight}
            >
              <AlignRight className="w-4 h-4" />
            </ToolbarButton>
          </div>

          {/* Editor */}
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, isActive, title, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      title={title}
      className={cn(
        'h-8 w-8 p-0',
        isActive && 'bg-muted text-foreground'
      )}
    >
      {children}
    </Button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-border mx-1" />
}
